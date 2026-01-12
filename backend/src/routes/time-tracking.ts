import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get time entries for current user or all (if admin)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, taskId, ticketId, startDate, endDate } = req.query;

    // Build filter
    const where: any = {};

    // Non-admins can only see their own entries
    const isAdmin = ['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (userId && isAdmin) {
      where.userId = userId;
    } else if (!isAdmin) {
      where.userId = req.user!.id;
    } else {
      // Admin viewing all - filter by company through user
      where.user = { companyId: req.user!.companyId };
    }

    if (taskId) where.taskId = taskId;
    if (ticketId) where.ticketId = ticketId;

    if (startDate || endDate) {
      where.clockIn = {};
      if (startDate) where.clockIn.gte = new Date(startDate as string);
      if (endDate) where.clockIn.lte = new Date(endDate as string);
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      },
      orderBy: { clockIn: 'desc' },
      take: 100
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// Get current active entry (if clocked in)
router.get('/current', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user!.id,
        clockOut: null
      },
      include: {
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    res.json(activeEntry);
  } catch (error) {
    next(error);
  }
});

// Clock in
router.post('/clock-in', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId, ticketId, notes, lat, lng } = req.body;

    // Check if already clocked in
    const existing = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user!.id,
        clockOut: null
      }
    });

    if (existing) {
      throw new AppError('Already clocked in. Please clock out first.', 400);
    }

    const entry = await prisma.timeEntry.create({
      data: {
        clockIn: new Date(),
        userId: req.user!.id,
        taskId,
        ticketId,
        notes,
        clockInLat: lat,
        clockInLng: lng
      },
      include: {
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    // Update task status to IN_PROGRESS if provided
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });
    }

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Clock out
router.post('/clock-out', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { notes, lat, lng } = req.body;

    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user!.id,
        clockOut: null
      }
    });

    if (!activeEntry) {
      throw new AppError('Not clocked in', 400);
    }

    const clockOut = new Date();
    const duration = Math.round((clockOut.getTime() - activeEntry.clockIn.getTime()) / 60000); // minutes

    const entry = await prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: {
        clockOut,
        duration,
        notes: notes || activeEntry.notes,
        clockOutLat: lat,
        clockOutLng: lng
      },
      include: {
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    // Update task actual time if linked
    if (activeEntry.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: activeEntry.taskId }
      });
      if (task) {
        await prisma.task.update({
          where: { id: activeEntry.taskId },
          data: {
            actualTime: (task.actualTime || 0) + duration
          }
        });
      }
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// Manual time entry (for admins or self)
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, taskId, ticketId, clockIn, clockOut, notes, billable } = req.body;

    // Verify user has permission
    const targetUserId = userId || req.user!.id;
    const isAdmin = ['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);

    if (targetUserId !== req.user!.id && !isAdmin) {
      throw new AppError('Not authorized to create entries for other users', 403);
    }

    const clockInDate = new Date(clockIn);
    const clockOutDate = clockOut ? new Date(clockOut) : null;
    const duration = clockOutDate
      ? Math.round((clockOutDate.getTime() - clockInDate.getTime()) / 60000)
      : null;

    const entry = await prisma.timeEntry.create({
      data: {
        clockIn: clockInDate,
        clockOut: clockOutDate,
        duration,
        notes,
        billable: billable !== false,
        userId: targetUserId,
        taskId,
        ticketId
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Update time entry
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { companyId: true } } }
    });

    if (!entry || entry.user.companyId !== req.user!.companyId) {
      throw new AppError('Entry not found', 404);
    }

    // Only admin or owner can edit
    const isAdmin = ['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (entry.userId !== req.user!.id && !isAdmin) {
      throw new AppError('Not authorized', 403);
    }

    const { clockIn, clockOut, notes, billable } = req.body;

    const clockInDate = clockIn ? new Date(clockIn) : entry.clockIn;
    const clockOutDate = clockOut ? new Date(clockOut) : entry.clockOut;
    const duration = clockOutDate
      ? Math.round((clockOutDate.getTime() - clockInDate.getTime()) / 60000)
      : null;

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: {
        clockIn: clockInDate,
        clockOut: clockOutDate,
        duration,
        notes: notes !== undefined ? notes : entry.notes,
        billable: billable !== undefined ? billable : entry.billable
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete time entry
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { companyId: true } } }
    });

    if (!entry || entry.user.companyId !== req.user!.companyId) {
      throw new AppError('Entry not found', 404);
    }

    // Only admin or owner can delete
    const isAdmin = ['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (entry.userId !== req.user!.id && !isAdmin) {
      throw new AppError('Not authorized', 403);
    }

    await prisma.timeEntry.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Entry deleted' });
  } catch (error) {
    next(error);
  }
});

// Get time summary for a user
router.get('/summary/:userId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Verify access
    const isAdmin = ['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (req.params.userId !== req.user!.id && !isAdmin) {
      throw new AppError('Not authorized', 403);
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: req.params.userId,
        clockIn: { gte: start, lte: end },
        duration: { not: null }
      },
      include: {
        task: { select: { id: true, title: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableMinutes = entries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    // Get user's hourly rate
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { hourlyRate: true, firstName: true, lastName: true }
    });

    const hourlyRate = Number(user?.hourlyRate || 0);
    const laborCost = (billableMinutes / 60) * hourlyRate;

    res.json({
      user: {
        id: req.params.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
      },
      period: { start, end },
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      billableHours: Math.round(billableMinutes / 60 * 10) / 10,
      entryCount: entries.length,
      laborCost: Math.round(laborCost * 100) / 100,
      entries
    });
  } catch (error) {
    next(error);
  }
});

export default router;
