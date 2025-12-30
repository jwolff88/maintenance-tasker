import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all inspections for company
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId, status, type } = req.query;

    const companyProperties = await prisma.property.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true }
    });
    const propertyIds = companyProperties.map(p => p.id);

    const inspections = await prisma.inspection.findMany({
      where: {
        propertyId: { in: propertyIds },
        ...(propertyId && { propertyId: propertyId as string }),
        ...(status && { status: status as any }),
        ...(type && { type: type as any })
      },
      include: {
        property: { select: { id: true, name: true, address: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(inspections);
  } catch (error) {
    next(error);
  }
});

// Get inspections for a property
router.get('/property/:propertyId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const inspections = await prisma.inspection.findMany({
      where: { propertyId: req.params.propertyId },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json(inspections);
  } catch (error) {
    next(error);
  }
});

// Create inspection
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId, type, scheduledAt, notes } = req.body;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const inspection = await prisma.inspection.create({
      data: {
        propertyId,
        type,
        scheduledAt: new Date(scheduledAt),
        notes,
        status: 'SCHEDULED'
      },
      include: {
        property: { select: { id: true, name: true, address: true } }
      }
    });

    // Create associated event
    await prisma.propertyEvent.create({
      data: {
        propertyId,
        title: `${type} Inspection`,
        type: 'INSPECTION',
        date: new Date(scheduledAt),
        description: notes
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'INSPECTION_SCHEDULED',
        details: `${type} inspection scheduled for ${new Date(scheduledAt).toLocaleDateString()}`,
        userId: req.user!.id,
        propertyId
      }
    });

    res.status(201).json(inspection);
  } catch (error) {
    next(error);
  }
});

// Update inspection (complete, cancel, reschedule)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true, id: true } } }
    });

    if (!inspection || inspection.property.companyId !== req.user!.companyId) {
      throw new AppError('Inspection not found', 404);
    }

    const { status, scheduledAt, completedAt, notes, passedItems, failedItems } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (completedAt) updateData.completedAt = new Date(completedAt);
    if (notes !== undefined) updateData.notes = notes;
    if (passedItems) updateData.passedItems = passedItems;
    if (failedItems) updateData.failedItems = failedItems;

    // If completing, set completedAt if not provided
    if (status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.inspection.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true, address: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: `INSPECTION_${status || 'UPDATED'}`,
        details: `Inspection ${status?.toLowerCase() || 'updated'}`,
        userId: req.user!.id,
        propertyId: inspection.property.id
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete inspection
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!inspection || inspection.property.companyId !== req.user!.companyId) {
      throw new AppError('Inspection not found', 404);
    }

    await prisma.inspection.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
