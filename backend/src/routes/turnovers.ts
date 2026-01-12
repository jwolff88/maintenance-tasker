import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Default turnover task templates
const DEFAULT_TURNOVER_TASKS = [
  { title: 'Move-out inspection', category: 'INSPECTION', description: 'Document condition and damages' },
  { title: 'Deep cleaning', category: 'CLEANING', description: 'Full unit deep clean' },
  { title: 'Carpet cleaning/replacement', category: 'FLOORING', description: 'Clean or replace carpets as needed' },
  { title: 'Paint touch-up/repaint', category: 'PAINTING', description: 'Touch up or full repaint walls' },
  { title: 'Appliance check', category: 'APPLIANCES', description: 'Test and clean all appliances' },
  { title: 'HVAC filter replacement', category: 'REPAIRS', description: 'Replace air filters' },
  { title: 'Change locks', category: 'LOCKS', description: 'Re-key or replace locks' },
  { title: 'Final inspection', category: 'INSPECTION', description: 'Final walkthrough before move-in' },
];

// Get all turnovers for company
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId, status } = req.query;

    const where: any = {
      companyId: req.user!.companyId,
    };

    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

    const turnovers = await prisma.turnover.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        turnoverTasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { moveOutDate: 'desc' },
    });

    // Calculate days vacant for active turnovers
    const enriched = turnovers.map(t => ({
      ...t,
      daysVacant: t.status !== 'OCCUPIED' && t.status !== 'CANCELLED'
        ? Math.floor((Date.now() - new Date(t.moveOutDate).getTime()) / (1000 * 60 * 60 * 24))
        : t.daysVacant,
      tasksCompleted: t.turnoverTasks.filter(task => task.status === 'COMPLETED').length,
      tasksTotal: t.turnoverTasks.length,
    }));

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// Get single turnover with tasks
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const turnover = await prisma.turnover.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
      include: {
        property: true,
        turnoverTasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!turnover) {
      throw new AppError('Turnover not found', 404);
    }

    res.json(turnover);
  } catch (error) {
    next(error);
  }
});

// Create turnover with default tasks
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      propertyId,
      unit,
      moveOutDate,
      targetReadyDate,
      outgoingLeaseId,
      estimatedCost,
      createDefaultTasks = true,
    } = req.body;

    // Verify property belongs to company
    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId },
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const turnover = await prisma.turnover.create({
      data: {
        unit,
        moveOutDate: new Date(moveOutDate),
        targetReadyDate: new Date(targetReadyDate),
        outgoingLeaseId,
        estimatedCost,
        propertyId,
        companyId: req.user!.companyId,
        // Create default tasks if requested
        turnoverTasks: createDefaultTasks ? {
          create: DEFAULT_TURNOVER_TASKS.map(task => ({
            title: task.title,
            description: task.description,
            category: task.category as any,
          })),
        } : undefined,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        turnoverTasks: true,
      },
    });

    res.status(201).json(turnover);
  } catch (error) {
    next(error);
  }
});

// Update turnover
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.turnover.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!existing) {
      throw new AppError('Turnover not found', 404);
    }

    const {
      status,
      unit,
      moveOutDate,
      targetReadyDate,
      actualReadyDate,
      moveInDate,
      estimatedCost,
      actualCost,
      outgoingLeaseId,
      incomingLeaseId,
      moveOutNotes,
      moveOutPhotos,
      moveInNotes,
      moveInPhotos,
      depositDeductions,
      depositNotes,
    } = req.body;

    // Calculate days vacant when marking as occupied
    let daysVacant = existing.daysVacant;
    if (status === 'OCCUPIED' && existing.status !== 'OCCUPIED') {
      daysVacant = Math.floor(
        (Date.now() - new Date(existing.moveOutDate).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const turnover = await prisma.turnover.update({
      where: { id: req.params.id },
      data: {
        status,
        unit,
        moveOutDate: moveOutDate ? new Date(moveOutDate) : undefined,
        targetReadyDate: targetReadyDate ? new Date(targetReadyDate) : undefined,
        actualReadyDate: actualReadyDate ? new Date(actualReadyDate) : undefined,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        daysVacant,
        estimatedCost,
        actualCost,
        outgoingLeaseId,
        incomingLeaseId,
        moveOutNotes,
        moveOutPhotos,
        moveInNotes,
        moveInPhotos,
        depositDeductions,
        depositNotes,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        turnoverTasks: true,
      },
    });

    res.json(turnover);
  } catch (error) {
    next(error);
  }
});

// Delete turnover
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.turnover.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!existing) {
      throw new AppError('Turnover not found', 404);
    }

    await prisma.turnover.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// === TURNOVER TASKS ===

// Add task to turnover
router.post('/:id/tasks', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const turnover = await prisma.turnover.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!turnover) {
      throw new AppError('Turnover not found', 404);
    }

    const { title, description, category, estimatedCost, assigneeId, vendorId } = req.body;

    const task = await prisma.turnoverTask.create({
      data: {
        title,
        description,
        category: category || 'OTHER',
        estimatedCost,
        assigneeId,
        vendorId,
        turnoverId: req.params.id,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update turnover task
router.patch('/:id/tasks/:taskId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Verify turnover belongs to company
    const turnover = await prisma.turnover.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!turnover) {
      throw new AppError('Turnover not found', 404);
    }

    const { status, title, description, category, estimatedCost, actualCost, notes, photos, assigneeId, vendorId } = req.body;

    const task = await prisma.turnoverTask.update({
      where: { id: req.params.taskId },
      data: {
        status,
        title,
        description,
        category,
        estimatedCost,
        actualCost,
        notes,
        photos,
        assigneeId,
        vendorId,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // Update turnover actual cost when task is completed
    if (status === 'COMPLETED' && actualCost) {
      const allTasks = await prisma.turnoverTask.findMany({
        where: { turnoverId: req.params.id },
      });
      const totalCost = allTasks.reduce((sum, t) => sum + Number(t.actualCost || 0), 0);
      await prisma.turnover.update({
        where: { id: req.params.id },
        data: { actualCost: totalCost },
      });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Delete turnover task
router.delete('/:id/tasks/:taskId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const turnover = await prisma.turnover.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!turnover) {
      throw new AppError('Turnover not found', 404);
    }

    await prisma.turnoverTask.delete({
      where: { id: req.params.taskId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get turnover stats/summary
router.get('/stats/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [active, completed, stats] = await Promise.all([
      prisma.turnover.count({
        where: {
          companyId: req.user!.companyId,
          status: { notIn: ['OCCUPIED', 'CANCELLED'] },
        },
      }),
      prisma.turnover.count({
        where: {
          companyId: req.user!.companyId,
          status: 'OCCUPIED',
        },
      }),
      prisma.turnover.aggregate({
        where: {
          companyId: req.user!.companyId,
          status: 'OCCUPIED',
          daysVacant: { not: null },
        },
        _avg: { daysVacant: true },
        _sum: { actualCost: true },
      }),
    ]);

    res.json({
      activeTurnovers: active,
      completedTurnovers: completed,
      avgDaysVacant: Math.round(stats._avg.daysVacant || 0),
      totalCost: stats._sum.actualCost || 0,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
