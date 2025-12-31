import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Lookup tenant by email - returns their active leases/properties
router.post('/lookup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const tenant = await prisma.tenant.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                company: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!tenant || tenant.leases.length === 0) {
      throw new AppError('No active lease found for this email. Please contact your property manager.', 404);
    }

    res.json({
      tenantId: tenant.id,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      properties: tenant.leases.map(l => ({
        leaseId: l.id,
        propertyId: l.property.id,
        propertyName: l.property.name,
        address: `${l.property.address}, ${l.property.city}, ${l.property.state} ${l.property.zipCode}`,
        companyName: l.property.company.name
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get tenant's existing tickets
router.get('/tickets/:tenantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;

    const tickets = await prisma.maintenanceTicket.findMany({
      where: { tenantId },
      include: {
        property: { select: { name: true, address: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

// Submit a maintenance request (public endpoint for tenants)
router.post('/submit-ticket', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, propertyId, title, description, category, priority, contactPhone } = req.body;

    if (!tenantId || !propertyId || !title || !description) {
      throw new AppError('Missing required fields', 400);
    }

    // Verify tenant has active lease at this property
    const lease = await prisma.lease.findFirst({
      where: {
        tenantId,
        propertyId,
        status: 'ACTIVE'
      },
      include: {
        property: {
          include: {
            company: true,
            manager: true
          }
        },
        tenant: true
      }
    });

    if (!lease) {
      throw new AppError('No active lease found for this property', 403);
    }

    // Find a user to assign as creator (use property manager or first company admin)
    let creatorId = lease.property.managerId;
    if (!creatorId) {
      const companyAdmin = await prisma.user.findFirst({
        where: {
          companyId: lease.property.companyId,
          role: { in: ['COMPANY_ADMIN', 'SUPER_ADMIN'] }
        }
      });
      creatorId = companyAdmin?.id ?? null;
    }

    if (!creatorId) {
      throw new AppError('Unable to process request. Please contact property management directly.', 500);
    }

    // Create the ticket
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title,
        description: contactPhone
          ? `${description}\n\n---\nTenant contact: ${contactPhone}`
          : description,
        propertyId,
        tenantId,
        creatorId,
        category: category || 'OTHER',
        priority: priority || 'MEDIUM',
        status: 'NEW'
      },
      include: {
        property: { select: { name: true, address: true } }
      }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'TENANT_TICKET_SUBMITTED',
        details: `Tenant ${lease.tenant.firstName} ${lease.tenant.lastName} submitted: ${title}`,
        propertyId
      }
    });

    res.status(201).json({
      success: true,
      ticketId: ticket.id,
      message: 'Your maintenance request has been submitted successfully. The property management team will be in touch soon.',
      ticket: {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        property: ticket.property
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single ticket status (for tenant to check)
router.get('/ticket-status/:ticketId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;
    const { tenantId } = req.query;

    const ticket = await prisma.maintenanceTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenantId as string
      },
      include: {
        property: { select: { name: true, address: true } },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    res.json({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      completedAt: ticket.completedAt,
      property: ticket.property,
      updates: ticket.comments.map(c => ({
        content: c.content,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
