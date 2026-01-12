import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { triageTicket, retriageTicket } from '../services/aiTriage.js';

const router = Router();

// SLA hours by priority
const SLA_HOURS: Record<string, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168 // 1 week
};

// Helper: Calculate SLA info for a ticket
function calculateSlaInfo(ticket: any) {
  const now = new Date();
  let slaDeadline = ticket.slaDeadline;

  // If no explicit SLA deadline, calculate from priority
  if (!slaDeadline && ticket.priority) {
    const slaHours = SLA_HOURS[ticket.priority] || 72;
    slaDeadline = new Date(new Date(ticket.createdAt).getTime() + slaHours * 60 * 60 * 1000);
  }

  if (!slaDeadline) return { slaDeadline: null, slaStatus: null, slaRemaining: null };

  const deadline = new Date(slaDeadline);
  const isCompleted = ['COMPLETED', 'CANCELLED'].includes(ticket.status);

  if (isCompleted) {
    const completedAt = ticket.completedAt ? new Date(ticket.completedAt) : now;
    return {
      slaDeadline: deadline,
      slaStatus: completedAt <= deadline ? 'MET' : 'BREACHED',
      slaRemaining: null
    };
  }

  const remainingMs = deadline.getTime() - now.getTime();
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    slaDeadline: deadline,
    slaStatus: remainingMs > 0 ? 'ON_TRACK' : 'BREACHED',
    slaRemaining: remainingMs > 0 ? { hours: remainingHours, minutes: remainingMins } : null
  };
}

// Get all tickets
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, priority, propertyId, assigneeId, category } = req.query;

    // Get properties in user's company
    const companyProperties = await prisma.property.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true }
    });
    const propertyIds = companyProperties.map(p => p.id);

    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        propertyId: { in: propertyIds },
        ...(propertyId && { propertyId: propertyId as string }),
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(category && { category: category as any }),
        ...(assigneeId && { assigneeId: assigneeId as string })
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
        vendor: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    // Add SLA info to each ticket
    const ticketsWithSla = tickets.map(ticket => ({
      ...ticket,
      ...calculateSlaInfo(ticket)
    }));

    res.json(ticketsWithSla);
  } catch (error) {
    next(error);
  }
});

// Get single ticket
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: { id: true, name: true, address: true, companyId: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        tenant: true,
        vendor: true,
        attachments: true,
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket || ticket.property.companyId !== req.user!.companyId) {
      throw new AppError('Ticket not found', 404);
    }

    // Add SLA info
    const ticketWithSla = {
      ...ticket,
      ...calculateSlaInfo(ticket)
    };

    res.json(ticketWithSla);
  } catch (error) {
    next(error);
  }
});

// Create ticket with AI triage
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, propertyId, priority, category,
      assigneeId, tenantId, vendorId, slaDeadline, skipAiTriage
    } = req.body;

    // Verify property belongs to company
    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    // AI Triage: auto-categorize and prioritize if not provided
    let aiTriageResult = null;
    let finalCategory = category || 'OTHER';
    let finalPriority = priority || 'MEDIUM';
    let suggestedFix = null;

    if (!skipAiTriage && (!category || !priority)) {
      aiTriageResult = await triageTicket(title, description, property.type);
      if (aiTriageResult) {
        finalCategory = category || aiTriageResult.category;
        finalPriority = priority || aiTriageResult.priority;
        suggestedFix = aiTriageResult.suggestedFix;
      }
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title,
        description,
        propertyId,
        priority: finalPriority as any,
        category: finalCategory as any,
        suggestedFix,
        creatorId: req.user!.id,
        assigneeId,
        tenantId,
        vendorId,
        slaDeadline: slaDeadline ? new Date(slaDeadline) : null
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'TICKET_CREATED',
        details: `Ticket "${title}" created${aiTriageResult ? ' (AI-triaged)' : ''}`,
        userId: req.user!.id,
        propertyId
      }
    });

    // Return ticket with AI triage metadata
    res.status(201).json({
      ...ticket,
      aiTriage: aiTriageResult ? {
        wasApplied: true,
        suggestedCategory: aiTriageResult.category,
        suggestedPriority: aiTriageResult.priority,
        suggestedFix: aiTriageResult.suggestedFix,
        urgencyReason: aiTriageResult.estimatedUrgency,
        confidence: aiTriageResult.confidence
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// Update ticket
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!ticket || ticket.property.companyId !== req.user!.companyId) {
      throw new AppError('Ticket not found', 404);
    }

    const updateData: any = { ...req.body };

    // If completing, set completedAt
    if (req.body.status === 'COMPLETED' && ticket.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.maintenanceTicket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true, address: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'TICKET_UPDATED',
        details: `Ticket "${updated.title}" updated - Status: ${updated.status}`,
        userId: req.user!.id,
        propertyId: ticket.propertyId
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Add comment to ticket
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, isInternal } = req.body;

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!ticket || ticket.property.companyId !== req.user!.companyId) {
      throw new AppError('Ticket not found', 404);
    }

    const comment = await prisma.ticketComment.create({
      data: {
        content,
        isInternal: isInternal || false,
        ticketId: req.params.id,
        authorId: req.user!.id
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

// AI Re-triage existing ticket
router.post('/:id/retriage', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: { companyId: true, type: true } },
        comments: { select: { content: true }, orderBy: { createdAt: 'asc' } }
      }
    });

    if (!ticket || ticket.property.companyId !== req.user!.companyId) {
      throw new AppError('Ticket not found', 404);
    }

    const comments = ticket.comments.map(c => c.content);
    const triageResult = await retriageTicket(
      ticket.title,
      ticket.description,
      ticket.category,
      ticket.priority,
      comments
    );

    if (!triageResult) {
      throw new AppError('AI triage unavailable', 503);
    }

    // Update ticket with new triage results
    const updated = await prisma.maintenanceTicket.update({
      where: { id: req.params.id },
      data: {
        category: triageResult.category as any,
        priority: triageResult.priority as any,
        suggestedFix: triageResult.suggestedFix,
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'TICKET_RETRIAGED',
        details: `Ticket re-triaged by AI: ${triageResult.priority} priority, ${triageResult.category}`,
        userId: req.user!.id,
        propertyId: ticket.propertyId
      }
    });

    res.json({
      ...updated,
      aiTriage: {
        wasApplied: true,
        suggestedCategory: triageResult.category,
        suggestedPriority: triageResult.priority,
        suggestedFix: triageResult.suggestedFix,
        urgencyReason: triageResult.estimatedUrgency,
        confidence: triageResult.confidence
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
