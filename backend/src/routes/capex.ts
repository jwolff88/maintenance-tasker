import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get all capital expenditures for company
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId, status, category, budgetYear } = req.query;

    const where: any = {
      companyId: req.user!.companyId,
    };

    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (budgetYear) where.budgetYear = parseInt(budgetYear as string);

    const capexItems = await prisma.capitalExpenditure.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        vendor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(capexItems);
  } catch (error) {
    next(error);
  }
});

// Get single capital expenditure
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const capex = await prisma.capitalExpenditure.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
      include: {
        property: true,
        vendor: true,
      },
    });

    if (!capex) {
      throw new AppError('Capital expenditure not found', 404);
    }

    res.json(capex);
  } catch (error) {
    next(error);
  }
});

// Create capital expenditure
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      category,
      estimatedCost,
      budgetYear,
      propertyId,
      vendorId,
      depreciationYears,
      notes,
    } = req.body;

    // Verify property belongs to company
    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId },
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const capex = await prisma.capitalExpenditure.create({
      data: {
        title,
        description,
        category: category || 'OTHER',
        estimatedCost,
        budgetYear: budgetYear || new Date().getFullYear(),
        depreciationYears,
        notes,
        propertyId,
        vendorId,
        companyId: req.user!.companyId,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        vendor: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(capex);
  } catch (error) {
    next(error);
  }
});

// Update capital expenditure
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.capitalExpenditure.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!existing) {
      throw new AppError('Capital expenditure not found', 404);
    }

    const {
      title,
      description,
      category,
      status,
      estimatedCost,
      actualCost,
      budgetYear,
      startDate,
      completionDate,
      depreciationYears,
      notes,
      attachments,
      vendorId,
    } = req.body;

    // Handle approval
    let approvalData = {};
    if (status === 'APPROVED' && existing.status !== 'APPROVED') {
      approvalData = {
        approvedById: req.user!.id,
        approvedAt: new Date(),
      };
    }

    const capex = await prisma.capitalExpenditure.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category,
        status,
        estimatedCost,
        actualCost,
        budgetYear,
        startDate: startDate ? new Date(startDate) : undefined,
        completionDate: completionDate ? new Date(completionDate) : undefined,
        depreciationYears,
        notes,
        attachments,
        vendorId,
        ...approvalData,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        vendor: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(capex);
  } catch (error) {
    next(error);
  }
});

// Delete capital expenditure
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.capitalExpenditure.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!existing) {
      throw new AppError('Capital expenditure not found', 404);
    }

    await prisma.capitalExpenditure.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get CapEx summary/stats
router.get('/stats/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { budgetYear } = req.query;
    const year = budgetYear ? parseInt(budgetYear as string) : new Date().getFullYear();

    const [items, totals] = await Promise.all([
      prisma.capitalExpenditure.findMany({
        where: {
          companyId: req.user!.companyId,
          budgetYear: year,
        },
        select: {
          status: true,
          estimatedCost: true,
          actualCost: true,
          category: true,
        },
      }),
      prisma.capitalExpenditure.groupBy({
        by: ['status'],
        where: {
          companyId: req.user!.companyId,
          budgetYear: year,
        },
        _sum: {
          estimatedCost: true,
          actualCost: true,
        },
        _count: true,
      }),
    ]);

    const totalEstimated = items.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + Number(item.actualCost || 0), 0);

    const byCategory = items.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.estimatedCost || 0);
      return acc;
    }, {});

    res.json({
      year,
      totalItems: items.length,
      totalEstimated,
      totalActual,
      variance: totalActual - totalEstimated,
      byStatus: totals,
      byCategory,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
