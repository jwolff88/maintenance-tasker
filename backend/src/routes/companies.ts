import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get company details
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      include: {
        _count: {
          select: { properties: true, users: true, vendors: true }
        }
      }
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
});

// Get company users
router.get('/users', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Create user in company
router.post('/users', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'READ_ONLY',
        phone,
        companyId: req.user!.companyId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// Update user
router.patch('/users/:userId', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, role, phone, isActive } = req.body;

    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user!.companyId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, role, phone, isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
