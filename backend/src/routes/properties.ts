import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all properties
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search, managerId } = req.query;

    const properties = await prisma.property.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(status && { status: status as any }),
        ...(managerId && { managerId: managerId as string }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { address: { contains: search as string, mode: 'insensitive' } },
            { city: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tickets: true, leases: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(properties);
  } catch (error) {
    next(error);
  }
});

// Get single property with full details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        owner: true,
        leases: {
          where: { status: 'ACTIVE' },
          include: { tenant: true },
          orderBy: { endDate: 'asc' }
        },
        tickets: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { firstName: true, lastName: true } } }
        },
        equipment: { orderBy: { nextServiceDate: 'asc' } },
        inspections: {
          where: { status: 'SCHEDULED' },
          orderBy: { scheduledAt: 'asc' }
        },
        events: {
          where: { isCompleted: false, date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 10
        }
      }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    res.json(property);
  } catch (error) {
    next(error);
  }
});

// Create property
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name, address, city, state, zipCode, type,
      units, sqft, yearBuilt, managerId, ownerId
    } = req.body;

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        type,
        units: units || 1,
        sqft,
        yearBuilt,
        managerId,
        ownerId,
        companyId: req.user!.companyId
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'PROPERTY_CREATED',
        details: `Property "${name}" created`,
        userId: req.user!.id,
        propertyId: property.id
      }
    });

    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
});

// Update property
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'PROPERTY_UPDATED',
        details: `Property "${updated.name}" updated`,
        userId: req.user!.id,
        propertyId: updated.id
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete property
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    await prisma.property.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get property activity log
router.get('/:id/activity', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { propertyId: req.params.id },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
