import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { checkUsageLimit } from '../middleware/usageLimits.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for photo uploads
// Use /tmp for serverless environments (Vercel), otherwise use local uploads dir
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsDir = isServerless
  ? '/tmp/uploads/tasks'
  : path.join(process.cwd(), 'uploads', 'tasks');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create uploads directory:', err);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper: Calculate next due date for recurring tasks
function calculateNextDueDate(recurrenceType: string, recurrenceValue: number | null, currentDue: Date): Date {
  const next = new Date(currentDue);

  switch (recurrenceType) {
    case 'DAILY':
      next.setDate(next.getDate() + (recurrenceValue || 1));
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * (recurrenceValue || 1));
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + (recurrenceValue || 1));
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'CUSTOM':
      next.setDate(next.getDate() + (recurrenceValue || 30));
      break;
    default:
      next.setDate(next.getDate() + 30);
  }

  return next;
}

// Get all tasks with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, priority, assetId, assignedToId, search, overdue } = req.query;
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(assetId && { assetId: assetId as string }),
        ...(assignedToId && { assignedToId: assignedToId as string }),
        ...(overdue === 'true' && {
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }),
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        asset: { select: { id: true, name: true, category: true, location: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { comments: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Add overdue flag to each task
    const tasksWithOverdue = tasks.map(task => ({
      ...task,
      isOverdue: task.dueDate && task.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(task.status)
    }));

    res.json(tasksWithOverdue);
  } catch (error) {
    next(error);
  }
});

// Get single task with full details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      },
      include: {
        asset: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', authenticate, checkUsageLimit('tasks'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, assetId, assignedToId, priority,
      dueDate, estimatedTime, isRecurring, recurrenceType, recurrenceValue
    } = req.body;

    // Verify asset exists and belongs to company
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, companyId: req.user!.companyId }
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assetId,
        assignedToId,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedTime,
        isRecurring: isRecurring || false,
        recurrenceType,
        recurrenceValue,
        nextDueDate: isRecurring && dueDate ? calculateNextDueDate(recurrenceType, recurrenceValue, new Date(dueDate)) : undefined,
        createdById: req.user!.id,
        companyId: req.user!.companyId
      },
      include: {
        asset: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update task
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updateData = { ...req.body };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        asset: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Update task status (lifecycle management)
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Validate photo requirement for CRITICAL tasks going to COMPLETED
    if (status === 'COMPLETED' && task.priority === 'CRITICAL') {
      if (!task.photoBefore || !task.photoAfter) {
        throw new AppError('Critical tasks require before and after photos to complete', 400);
      }
    }

    const updateData: any = { status };

    // Track lifecycle timestamps
    if (status === 'IN_PROGRESS' && !task.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();

      // Calculate actual time if started
      if (task.startedAt) {
        const startTime = new Date(task.startedAt).getTime();
        const endTime = Date.now();
        updateData.actualTime = Math.round((endTime - startTime) / 60000); // minutes
      }

      // Handle recurring task - create next occurrence
      if (task.isRecurring && task.recurrenceType) {
        const nextDue = calculateNextDueDate(
          task.recurrenceType,
          task.recurrenceValue,
          task.dueDate || new Date()
        );

        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            assetId: task.assetId,
            assignedToId: task.assignedToId,
            priority: task.priority,
            dueDate: nextDue,
            estimatedTime: task.estimatedTime,
            isRecurring: true,
            recurrenceType: task.recurrenceType,
            recurrenceValue: task.recurrenceValue,
            nextDueDate: calculateNextDueDate(task.recurrenceType, task.recurrenceValue, nextDue),
            createdById: req.user!.id,
            companyId: req.user!.companyId
          }
        });
      }

      // Update asset status if it was marked as needs maintenance
      await prisma.asset.update({
        where: { id: task.assetId },
        data: { status: 'OPERATIONAL' }
      });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        asset: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Upload task photos (before/after)
router.post('/:id/photos', authenticate, uploadLimiter, upload.single('photo'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body; // 'before' or 'after'

    if (!type || !['before', 'after'].includes(type)) {
      throw new AppError('Photo type must be "before" or "after"', 400);
    }

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const photoUrl = `/uploads/tasks/${req.file.filename}`;

    const updateData = type === 'before'
      ? { photoBefore: photoUrl }
      : { photoAfter: photoUrl };

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        asset: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Add comment to task
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId: req.params.id,
        authorId: req.user!.id
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get task statistics
router.get('/stats/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const [total, open, inProgress, underReview, completed, overdue, critical] = await Promise.all([
      prisma.task.count({ where: { companyId: req.user!.companyId } }),
      prisma.task.count({ where: { companyId: req.user!.companyId, status: 'OPEN' } }),
      prisma.task.count({ where: { companyId: req.user!.companyId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { companyId: req.user!.companyId, status: 'UNDER_REVIEW' } }),
      prisma.task.count({ where: { companyId: req.user!.companyId, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          companyId: req.user!.companyId,
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      }),
      prisma.task.count({
        where: {
          companyId: req.user!.companyId,
          priority: 'CRITICAL',
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      })
    ]);

    res.json({
      total,
      open,
      inProgress,
      underReview,
      completed,
      overdue,
      critical
    });
  } catch (error) {
    next(error);
  }
});

// Bulk update task status
router.put('/bulk/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskIds, status } = req.body;
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new AppError('Task IDs array is required', 400);
    }

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    // Verify all tasks belong to the company
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        companyId: req.user!.companyId
      }
    });

    if (tasks.length !== taskIds.length) {
      throw new AppError('Some tasks not found or not authorized', 404);
    }

    // Check photo requirements for CRITICAL tasks going to COMPLETED
    if (status === 'COMPLETED') {
      const criticalWithoutPhotos = tasks.filter(
        t => t.priority === 'CRITICAL' && (!t.photoBefore || !t.photoAfter)
      );
      if (criticalWithoutPhotos.length > 0) {
        throw new AppError(
          `${criticalWithoutPhotos.length} critical task(s) require before/after photos to complete`,
          400
        );
      }
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === 'IN_PROGRESS') {
      updateData.startedAt = now;
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = now;
    }

    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        companyId: req.user!.companyId
      },
      data: updateData
    });

    res.json({ updated: taskIds.length, status });
  } catch (error) {
    next(error);
  }
});

// Export tasks as CSV
router.get('/export/csv', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, priority, assetId, startDate, endDate } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(assetId && { assetId: assetId as string }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        })
      },
      include: {
        asset: { select: { name: true, category: true, location: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const headers = [
      'Title', 'Description', 'Asset', 'Asset Category', 'Location',
      'Status', 'Priority', 'Assigned To', 'Created By',
      'Due Date', 'Created At', 'Completed At', 'Estimated Time (min)', 'Actual Time (min)',
      'Is Recurring', 'Recurrence Type'
    ];

    const rows = tasks.map(task => [
      `"${(task.title || '').replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      `"${task.asset?.name || ''}"`,
      `"${task.asset?.category || ''}"`,
      `"${task.asset?.location || ''}"`,
      task.status,
      task.priority,
      task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '',
      task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '',
      task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      task.createdAt.toISOString().split('T')[0],
      task.completedAt ? task.completedAt.toISOString().split('T')[0] : '',
      task.estimatedTime || '',
      task.actualTime || '',
      task.isRecurring ? 'Yes' : 'No',
      task.recurrenceType || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=maintenance-tasks-export.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Get task templates (predefined common maintenance tasks)
router.get('/templates/list', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Predefined task templates for common maintenance work
    const templates = [
      {
        id: 'hvac-filter',
        title: 'HVAC Filter Replacement',
        description: 'Replace HVAC air filters and inspect unit for proper operation',
        category: 'HVAC',
        priority: 'MEDIUM',
        estimatedTime: 30,
        recurrenceType: 'MONTHLY'
      },
      {
        id: 'fire-extinguisher',
        title: 'Fire Extinguisher Inspection',
        description: 'Monthly inspection of fire extinguishers - check pressure gauge, inspect for damage, verify seal',
        category: 'SAFETY',
        priority: 'HIGH',
        estimatedTime: 15,
        recurrenceType: 'MONTHLY'
      },
      {
        id: 'plumbing-check',
        title: 'Plumbing System Check',
        description: 'Inspect pipes for leaks, check water pressure, clear drains, inspect water heater',
        category: 'PLUMBING',
        priority: 'MEDIUM',
        estimatedTime: 60,
        recurrenceType: 'QUARTERLY'
      },
      {
        id: 'electrical-inspection',
        title: 'Electrical Panel Inspection',
        description: 'Inspect electrical panels, check for hot spots, verify breaker operation, check GFCI outlets',
        category: 'ELECTRICAL',
        priority: 'HIGH',
        estimatedTime: 45,
        recurrenceType: 'QUARTERLY'
      },
      {
        id: 'roof-inspection',
        title: 'Roof Inspection',
        description: 'Inspect roof for damage, check gutters and downspouts, look for signs of leaks',
        category: 'STRUCTURAL',
        priority: 'MEDIUM',
        estimatedTime: 90,
        recurrenceType: 'QUARTERLY'
      },
      {
        id: 'generator-test',
        title: 'Generator Test Run',
        description: 'Start generator, run under load for 30 minutes, check oil level, inspect for issues',
        category: 'ELECTRICAL',
        priority: 'HIGH',
        estimatedTime: 45,
        recurrenceType: 'MONTHLY'
      },
      {
        id: 'pest-inspection',
        title: 'Pest Control Inspection',
        description: 'Inspect for signs of pests, check entry points, verify bait stations, document findings',
        category: 'OTHER',
        priority: 'MEDIUM',
        estimatedTime: 60,
        recurrenceType: 'MONTHLY'
      },
      {
        id: 'elevator-inspection',
        title: 'Elevator Safety Check',
        description: 'Test emergency stop, verify phone operation, check lighting, inspect cab condition',
        category: 'SAFETY',
        priority: 'CRITICAL',
        estimatedTime: 30,
        recurrenceType: 'WEEKLY'
      },
      {
        id: 'lighting-check',
        title: 'Lighting Walkthrough',
        description: 'Check all interior and exterior lighting, replace burnt bulbs, clean fixtures',
        category: 'ELECTRICAL',
        priority: 'LOW',
        estimatedTime: 60,
        recurrenceType: 'MONTHLY'
      },
      {
        id: 'appliance-check',
        title: 'Appliance Maintenance',
        description: 'Clean refrigerator coils, check dishwasher filters, inspect washer hoses, clean dryer vents',
        category: 'APPLIANCE',
        priority: 'MEDIUM',
        estimatedTime: 90,
        recurrenceType: 'QUARTERLY'
      }
    ];

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get my assigned tasks (for technicians)
router.get('/my/assigned', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: req.user!.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      },
      include: {
        asset: { select: { id: true, name: true, category: true, location: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    const now = new Date();
    const tasksWithOverdue = tasks.map(task => ({
      ...task,
      isOverdue: task.dueDate && task.dueDate < now
    }));

    res.json(tasksWithOverdue);
  } catch (error) {
    next(error);
  }
});

export default router;
