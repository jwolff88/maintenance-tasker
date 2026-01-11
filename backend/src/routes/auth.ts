import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { getEffectivePermissions, UserPermissions } from '../utils/permissions.js';

const router = Router();

// Register company and admin user
router.post('/register', registerLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Set trial to expire in 14 days
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        email,
        plan: 'TRIAL',
        subscriptionStatus: 'TRIALING',
        trialEndsAt,
        users: {
          create: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'COMPANY_ADMIN'
          }
        }
      },
      include: { users: true }
    });

    const user = company.users[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, companyId: company.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: company.id,
        companyName: company.name,
        subscription: {
          plan: company.plan,
          status: company.subscriptionStatus,
          trialEndsAt: company.trialEndsAt,
        },
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const permissions = getEffectivePermissions(
      user.role,
      user.permissions as Partial<UserPermissions> | null
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
        subscription: {
          plan: user.company.plan,
          status: user.company.subscriptionStatus,
          trialEndsAt: user.company.trialEndsAt,
        },
        permissions,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { company: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const permissions = getEffectivePermissions(
      user.role,
      user.permissions as Partial<UserPermissions> | null
    );

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      subscription: {
        plan: user.company.plan,
        status: user.company.subscriptionStatus,
        trialEndsAt: user.company.trialEndsAt,
      },
      permissions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
