import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all inventory items
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, lowStock, search } = req.query;

    const items = await prisma.inventoryItem.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(category && { category: category as any }),
        ...(lowStock === 'true' && {
          quantity: { lte: prisma.inventoryItem.fields.minQuantity }
        }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { sku: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { name: 'asc' }
    });

    // Add low stock flag
    const itemsWithFlags = items.map(item => ({
      ...item,
      isLowStock: item.quantity <= item.minQuantity
    }));

    res.json(itemsWithFlags);
  } catch (error) {
    next(error);
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT * FROM "InventoryItem"
      WHERE "companyId" = ${req.user!.companyId}
      AND quantity <= "minQuantity"
      ORDER BY (quantity::float / NULLIF("minQuantity", 0)) ASC
    `;

    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get inventory stats
router.get('/stats/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalItems, lowStockCount, totalValue, recentTransactions] = await Promise.all([
      prisma.inventoryItem.count({
        where: { companyId: req.user!.companyId }
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "InventoryItem"
        WHERE "companyId" = ${req.user!.companyId}
        AND quantity <= "minQuantity"
      `,
      prisma.inventoryItem.aggregate({
        where: { companyId: req.user!.companyId },
        _sum: {
          quantity: true
        }
      }),
      prisma.inventoryTransaction.count({
        where: {
          item: { companyId: req.user!.companyId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    // Calculate total inventory value
    const itemsWithValue = await prisma.inventoryItem.findMany({
      where: { companyId: req.user!.companyId },
      select: { quantity: true, unitCost: true }
    });

    const inventoryValue = itemsWithValue.reduce((sum, item) => {
      return sum + (item.quantity * (Number(item.unitCost) || 0));
    }, 0);

    res.json({
      totalItems,
      lowStockCount: Number(lowStockCount[0]?.count || 0),
      totalUnits: totalValue._sum.quantity || 0,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      transactionsLast30Days: recentTransactions
    });
  } catch (error) {
    next(error);
  }
});

// Get single inventory item with history
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            task: { select: { id: true, title: true } },
            ticket: { select: { id: true, title: true } }
          }
        }
      }
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    res.json({
      ...item,
      isLowStock: item.quantity <= item.minQuantity
    });
  } catch (error) {
    next(error);
  }
});

// Create inventory item
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name, description, sku, category, quantity, minQuantity, maxQuantity,
      unit, unitCost, storageLocation, supplierName, supplierSku, reorderUrl
    } = req.body;

    // Check for duplicate SKU
    if (sku) {
      const existing = await prisma.inventoryItem.findFirst({
        where: { companyId: req.user!.companyId, sku }
      });
      if (existing) {
        throw new AppError('SKU already exists', 400);
      }
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        description,
        sku,
        category: category || 'OTHER',
        quantity: quantity || 0,
        minQuantity: minQuantity || 0,
        maxQuantity,
        unit: unit || 'each',
        unitCost,
        storageLocation,
        supplierName,
        supplierSku,
        reorderUrl,
        companyId: req.user!.companyId
      }
    });

    // Create initial stock transaction if quantity > 0
    if (quantity > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          type: 'RESTOCK',
          quantity: quantity,
          previousQty: 0,
          newQty: quantity,
          unitCost,
          notes: 'Initial stock',
          itemId: item.id,
          userId: req.user!.id
        }
      });
    }

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Update inventory item
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      throw new AppError('Item not found', 404);
    }

    const {
      name, description, sku, category, minQuantity, maxQuantity,
      unit, unitCost, storageLocation, supplierName, supplierSku, reorderUrl
    } = req.body;

    const updated = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sku !== undefined && { sku }),
        ...(category && { category }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(maxQuantity !== undefined && { maxQuantity }),
        ...(unit && { unit }),
        ...(unitCost !== undefined && { unitCost }),
        ...(storageLocation !== undefined && { storageLocation }),
        ...(supplierName !== undefined && { supplierName }),
        ...(supplierSku !== undefined && { supplierSku }),
        ...(reorderUrl !== undefined && { reorderUrl })
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Adjust inventory (restock, use, adjust)
router.post('/:id/transaction', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, quantity, notes, taskId, ticketId, unitCost } = req.body;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    // Calculate new quantity
    let quantityChange = quantity;
    if (['USED', 'DAMAGED'].includes(type)) {
      quantityChange = -Math.abs(quantity);
    } else if (['RESTOCK', 'RETURNED'].includes(type)) {
      quantityChange = Math.abs(quantity);
    }

    const newQty = item.quantity + quantityChange;

    if (newQty < 0) {
      throw new AppError('Insufficient stock', 400);
    }

    // Update item and create transaction
    const [updatedItem, transaction] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: { quantity: newQty }
      }),
      prisma.inventoryTransaction.create({
        data: {
          type,
          quantity: quantityChange,
          previousQty: item.quantity,
          newQty,
          unitCost: unitCost || item.unitCost,
          notes,
          itemId: req.params.id,
          taskId,
          ticketId,
          userId: req.user!.id
        }
      })
    ]);

    res.json({
      item: updatedItem,
      transaction
    });
  } catch (error) {
    next(error);
  }
});

// Use parts on a task (convenience endpoint)
router.post('/use-on-task', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { items, taskId, ticketId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Items array required', 400);
    }

    const results = [];

    for (const { itemId, quantity, notes } of items) {
      const item = await prisma.inventoryItem.findFirst({
        where: { id: itemId, companyId: req.user!.companyId }
      });

      if (!item) {
        results.push({ itemId, error: 'Item not found' });
        continue;
      }

      const newQty = item.quantity - Math.abs(quantity);
      if (newQty < 0) {
        results.push({ itemId, name: item.name, error: 'Insufficient stock' });
        continue;
      }

      const [updated, transaction] = await prisma.$transaction([
        prisma.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: newQty }
        }),
        prisma.inventoryTransaction.create({
          data: {
            type: 'USED',
            quantity: -Math.abs(quantity),
            previousQty: item.quantity,
            newQty,
            unitCost: item.unitCost,
            notes,
            itemId,
            taskId,
            ticketId,
            userId: req.user!.id
          }
        })
      ]);

      results.push({
        itemId,
        name: item.name,
        used: Math.abs(quantity),
        remaining: newQty,
        cost: Number(item.unitCost || 0) * Math.abs(quantity)
      });
    }

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Delete inventory item
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      throw new AppError('Item not found', 404);
    }

    await prisma.inventoryItem.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
