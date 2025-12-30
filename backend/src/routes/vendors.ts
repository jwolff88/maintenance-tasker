import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all vendors
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { specialty } = req.query;

    const vendors = await prisma.vendor.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(specialty && {
          specialties: { has: specialty as string }
        })
      },
      include: {
        _count: { select: { tickets: true } }
      },
      orderBy: { rating: 'desc' }
    });

    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

// Get single vendor
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            property: { select: { name: true, address: true } }
          }
        }
      }
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// Create vendor
router.post('/', authenticate, authorize('COMPANY_ADMIN', 'PROPERTY_MANAGER', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name, email, phone, specialties,
      insuranceExpiry, licenseNumber
    } = req.body;

    const vendor = await prisma.vendor.create({
      data: {
        name,
        email,
        phone,
        specialties: specialties || [],
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        licenseNumber,
        companyId: req.user!.companyId
      }
    });

    res.status(201).json(vendor);
  } catch (error) {
    next(error);
  }
});

// Update vendor
router.patch('/:id', authenticate, authorize('COMPANY_ADMIN', 'PROPERTY_MANAGER', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    const updated = await prisma.vendor.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Rate vendor
router.post('/:id/rate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      throw new AppError('Rating must be between 0 and 5', 400);
    }

    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    // Calculate new average rating
    const totalJobs = vendor.totalJobs + 1;
    const currentTotal = parseFloat(vendor.rating.toString()) * vendor.totalJobs;
    const newRating = (currentTotal + rating) / totalJobs;

    const updated = await prisma.vendor.update({
      where: { id: req.params.id },
      data: {
        rating: newRating,
        totalJobs
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete vendor
router.delete('/:id', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    await prisma.vendor.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
