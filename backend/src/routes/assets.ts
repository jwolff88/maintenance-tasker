import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all assets
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, propertyId } = req.query;

    const assets = await prisma.asset.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
        ...(propertyId && { propertyId: propertyId as string }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { location: { contains: search as string, mode: 'insensitive' } },
            { serialNumber: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        property: { select: { id: true, name: true } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(assets);
  } catch (error) {
    next(error);
  }
});

// Get single asset with full details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    res.json(asset);
  } catch (error) {
    next(error);
  }
});

// Get asset service history (all completed tasks)
router.get('/:id/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    const tasks = await prisma.task.findMany({
      where: {
        assetId: req.params.id,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Create asset
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name, description, category, location, qrCode,
      manufacturer, model, serialNumber, purchaseDate,
      warrantyExpiry, notes, propertyId
    } = req.body;

    // Generate QR code if not provided
    const generatedQrCode = qrCode || `ASSET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const asset = await prisma.asset.create({
      data: {
        name,
        description,
        category: category || 'OTHER',
        location,
        qrCode: generatedQrCode,
        manufacturer,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
        notes,
        propertyId,
        companyId: req.user!.companyId
      },
      include: {
        property: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

// Update asset
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    // Handle date conversions
    const updateData = { ...req.body };
    if (updateData.purchaseDate) {
      updateData.purchaseDate = new Date(updateData.purchaseDate);
    }
    if (updateData.warrantyExpiry) {
      updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);
    }

    const updated = await prisma.asset.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete asset
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    await prisma.asset.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get assets needing attention
router.get('/needing-attention/list', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    // Get assets that need maintenance, are out of service, or have overdue tasks
    const assets = await prisma.asset.findMany({
      where: {
        companyId: req.user!.companyId,
        OR: [
          { status: 'NEEDS_MAINTENANCE' },
          { status: 'OUT_OF_SERVICE' },
          {
            tasks: {
              some: {
                dueDate: { lt: now },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
              }
            }
          },
          {
            warrantyExpiry: {
              lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Expiring in 30 days
            }
          }
        ]
      },
      include: {
        property: { select: { id: true, name: true } },
        tasks: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] }
          },
          select: { id: true, title: true, status: true, priority: true, dueDate: true }
        }
      },
      take: 10
    });

    // Add reason for each asset
    const assetsWithReason = assets.map(asset => {
      const reasons: string[] = [];
      if (asset.status === 'NEEDS_MAINTENANCE') reasons.push('Needs maintenance');
      if (asset.status === 'OUT_OF_SERVICE') reasons.push('Out of service');
      if (asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        reasons.push('Warranty expiring soon');
      }
      const overdueTasks = asset.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
      if (overdueTasks.length > 0) reasons.push(`${overdueTasks.length} overdue task(s)`);

      return { ...asset, attentionReasons: reasons };
    });

    res.json(assetsWithReason);
  } catch (error) {
    next(error);
  }
});

// Get asset statistics
router.get('/stats/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [total, operational, needsMaintenance, outOfService] = await Promise.all([
      prisma.asset.count({ where: { companyId: req.user!.companyId } }),
      prisma.asset.count({ where: { companyId: req.user!.companyId, status: 'OPERATIONAL' } }),
      prisma.asset.count({ where: { companyId: req.user!.companyId, status: 'NEEDS_MAINTENANCE' } }),
      prisma.asset.count({ where: { companyId: req.user!.companyId, status: 'OUT_OF_SERVICE' } })
    ]);

    res.json({
      total,
      operational,
      needsMaintenance,
      outOfService
    });
  } catch (error) {
    next(error);
  }
});

export default router;
