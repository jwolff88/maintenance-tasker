import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all leases
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId, status, expiringWithinDays } = req.query;

    const companyProperties = await prisma.property.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true }
    });
    const propertyIds = companyProperties.map(p => p.id);

    let dateFilter = {};
    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(expiringWithinDays as string));
      dateFilter = { endDate: { lte: futureDate, gte: new Date() } };
    }

    const leases = await prisma.lease.findMany({
      where: {
        propertyId: { in: propertyIds },
        ...(propertyId && { propertyId: propertyId as string }),
        ...(status && { status: status as any }),
        ...dateFilter
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        tenant: true
      },
      orderBy: { endDate: 'asc' }
    });

    res.json(leases);
  } catch (error) {
    next(error);
  }
});

// Get single lease
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: { id: true, name: true, address: true, companyId: true } },
        tenant: true
      }
    });

    if (!lease || lease.property.companyId !== req.user!.companyId) {
      throw new AppError('Lease not found', 404);
    }

    res.json(lease);
  } catch (error) {
    next(error);
  }
});

// Create lease
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      propertyId, startDate, endDate, rentAmount, depositAmount,
      terms, tenantId, tenantData
    } = req.body;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    // Create tenant if new
    let finalTenantId = tenantId;
    if (!tenantId && tenantData) {
      const tenant = await prisma.tenant.create({
        data: tenantData
      });
      finalTenantId = tenant.id;
    }

    const lease = await prisma.lease.create({
      data: {
        propertyId,
        tenantId: finalTenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount,
        depositAmount,
        terms,
        status: new Date(startDate) <= new Date() ? 'ACTIVE' : 'PENDING'
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        tenant: true
      }
    });

    // Update property occupancy
    await prisma.property.update({
      where: { id: propertyId },
      data: { occupancy: { increment: 1 } }
    });

    await prisma.activityLog.create({
      data: {
        action: 'LEASE_CREATED',
        details: `New lease created`,
        userId: req.user!.id,
        propertyId
      }
    });

    res.status(201).json(lease);
  } catch (error) {
    next(error);
  }
});

// Update lease
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!lease || lease.property.companyId !== req.user!.companyId) {
      throw new AppError('Lease not found', 404);
    }

    const updated = await prisma.lease.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        property: { select: { id: true, name: true, address: true } },
        tenant: true
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Terminate lease
router.post('/:id/terminate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true, id: true } } }
    });

    if (!lease || lease.property.companyId !== req.user!.companyId) {
      throw new AppError('Lease not found', 404);
    }

    const updated = await prisma.lease.update({
      where: { id: req.params.id },
      data: { status: 'TERMINATED' }
    });

    await prisma.property.update({
      where: { id: lease.property.id },
      data: { occupancy: { decrement: 1 } }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get tenants
router.get('/tenants/all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        leases: {
          include: {
            property: { select: { companyId: true } }
          }
        }
      }
    });

    // Filter to only tenants with leases in this company
    const companyTenants = tenants.filter(t =>
      t.leases.some(l => l.property.companyId === req.user!.companyId)
    );

    res.json(companyTenants.map(t => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone
    })));
  } catch (error) {
    next(error);
  }
});

export default router;
