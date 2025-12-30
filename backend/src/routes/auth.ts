import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register company and admin user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        email,
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
        companyName: company.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
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

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name
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

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name
    });
  } catch (error) {
    next(error);
  }
});

export default router;
