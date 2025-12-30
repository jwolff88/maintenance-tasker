import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

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

    res.json(tickets);
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

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// Create ticket
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, propertyId, priority, category,
      assigneeId, tenantId, vendorId, slaDeadline
    } = req.body;

    // Verify property belongs to company
    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title,
        description,
        propertyId,
        priority: priority || 'MEDIUM',
        category: category || 'OTHER',
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
        details: `Ticket "${title}" created`,
        userId: req.user!.id,
        propertyId
      }
    });

    res.status(201).json(ticket);
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

export default router;
