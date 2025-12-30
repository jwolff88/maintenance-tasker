import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from './errorHandler.js';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    companyId: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: UserRole;
      companyId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, companyId: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized', 403));
    }
    next();
  };
};

export const authorizeCompanyAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  // Super admins can access everything
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // For other users, ensure they're accessing their own company's resources
  const companyId = req.params.companyId || req.body.companyId;
  if (companyId && companyId !== req.user.companyId) {
    return next(new AppError('Not authorized to access this company', 403));
  }

  next();
};
