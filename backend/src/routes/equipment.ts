import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get equipment for a property
router.get('/property/:propertyId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const equipment = await prisma.equipment.findMany({
      where: { propertyId: req.params.propertyId },
      orderBy: { nextServiceDate: 'asc' }
    });

    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

// Get single equipment
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!equipment || equipment.property.companyId !== req.user!.companyId) {
      throw new AppError('Equipment not found', 404);
    }

    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

// Create equipment
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      propertyId, name, type, manufacturer, model, serialNumber,
      installDate, warrantyExpiry, lastServiceDate, nextServiceDate,
      expectedLifespan, notes
    } = req.body;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const equipment = await prisma.equipment.create({
      data: {
        propertyId,
        name,
        type,
        manufacturer,
        model,
        serialNumber,
        installDate: installDate ? new Date(installDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        expectedLifespan,
        notes
      }
    });

    // Update property risk score based on equipment
    await updatePropertyRiskScore(propertyId);

    res.status(201).json(equipment);
  } catch (error) {
    next(error);
  }
});

// Update equipment
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true, id: true } } }
    });

    if (!equipment || equipment.property.companyId !== req.user!.companyId) {
      throw new AppError('Equipment not found', 404);
    }

    const updateData: any = { ...req.body };
    ['installDate', 'warrantyExpiry', 'lastServiceDate', 'nextServiceDate'].forEach(field => {
      if (updateData[field]) updateData[field] = new Date(updateData[field]);
    });

    const updated = await prisma.equipment.update({
      where: { id: req.params.id },
      data: updateData
    });

    await updatePropertyRiskScore(equipment.property.id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete equipment
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true, id: true } } }
    });

    if (!equipment || equipment.property.companyId !== req.user!.companyId) {
      throw new AppError('Equipment not found', 404);
    }

    await prisma.equipment.delete({ where: { id: req.params.id } });
    await updatePropertyRiskScore(equipment.property.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Calculate and update property risk score based on equipment and other factors
async function updatePropertyRiskScore(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      equipment: true,
      tickets: { where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }
    }
  });

  if (!property) return;

  let riskScore = 0;
  const now = new Date();

  // Equipment factors (up to 50 points)
  for (const equip of property.equipment) {
    // Warranty expired: +10 points per item
    if (equip.warrantyExpiry && equip.warrantyExpiry < now) {
      riskScore += 10;
    }
    // Service overdue: +15 points per item
    if (equip.nextServiceDate && equip.nextServiceDate < now) {
      riskScore += 15;
    }
    // Old equipment (past expected lifespan): +10 points
    if (equip.installDate && equip.expectedLifespan) {
      const age = (now.getTime() - equip.installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age > equip.expectedLifespan) {
        riskScore += 10;
      } else if (age > equip.expectedLifespan * 0.8) {
        riskScore += 5;
      }
    }
  }

  // Open ticket factors (up to 30 points)
  const urgentTickets = property.tickets.filter(t => t.priority === 'URGENT').length;
  const highTickets = property.tickets.filter(t => t.priority === 'HIGH').length;
  riskScore += urgentTickets * 10;
  riskScore += highTickets * 5;

  // Property age factor (up to 20 points)
  if (property.yearBuilt) {
    const propertyAge = now.getFullYear() - property.yearBuilt;
    if (propertyAge > 50) riskScore += 20;
    else if (propertyAge > 30) riskScore += 10;
    else if (propertyAge > 20) riskScore += 5;
  }

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // Determine status based on risk score
  let status: 'HEALTHY' | 'ATTENTION_NEEDED' | 'CRITICAL' = 'HEALTHY';
  if (riskScore >= 70) status = 'CRITICAL';
  else if (riskScore >= 40) status = 'ATTENTION_NEEDED';

  await prisma.property.update({
    where: { id: propertyId },
    data: { riskScore, status }
  });
}

export default router;
export { updatePropertyRiskScore };
