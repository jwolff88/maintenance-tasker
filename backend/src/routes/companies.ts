import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { checkUsageLimit } from '../middleware/usageLimits.js';
import {
  getEffectivePermissions,
  getRoleDefaults,
  getPermissionCategories,
  UserPermissions
} from '../utils/permissions.js';

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

// Get company users (with effective permissions)
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
        createdAt: true,
        permissions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add effective permissions to each user
    const usersWithPermissions = users.map(user => ({
      ...user,
      effectivePermissions: getEffectivePermissions(
        user.role,
        user.permissions as Partial<UserPermissions> | null
      ),
      hasCustomPermissions: user.permissions !== null
    }));

    res.json(usersWithPermissions);
  } catch (error) {
    next(error);
  }
});

// Create user in company
router.post('/users', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), checkUsageLimit('users'), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

// Delete user from company (or deactivate if they have related records)
router.delete('/users/:userId', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const userToDelete = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user!.companyId },
      include: {
        _count: {
          select: {
            notes: true,
            tickets: true,
            assignedTickets: true,
            activityLogs: true,
            assignedTasks: true,
            createdTasks: true,
            taskComments: true,
            timeEntries: true
          }
        }
      }
    });

    if (!userToDelete) {
      throw new AppError('User not found', 404);
    }

    // Prevent deleting yourself
    if (userId === req.user!.id) {
      throw new AppError('Cannot delete your own account', 403);
    }

    // Prevent deleting SUPER_ADMIN users
    if (userToDelete.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot delete super admin users', 403);
    }

    // Prevent COMPANY_ADMIN from deleting other COMPANY_ADMINs (only SUPER_ADMIN can)
    if (userToDelete.role === 'COMPANY_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      throw new AppError('Only super admins can delete company admins', 403);
    }

    // Check if user has any related records
    const counts = userToDelete._count;
    const hasRelatedRecords =
      counts.notes > 0 ||
      counts.tickets > 0 ||
      counts.assignedTickets > 0 ||
      counts.activityLogs > 0 ||
      counts.assignedTasks > 0 ||
      counts.createdTasks > 0 ||
      counts.taskComments > 0 ||
      counts.timeEntries > 0;

    if (hasRelatedRecords) {
      // Deactivate instead of delete to preserve data integrity
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      res.json({
        message: 'User deactivated successfully',
        deactivated: true,
        reason: 'User has associated records (notes, tickets, tasks, etc.) that must be preserved'
      });
    } else {
      // Safe to delete - no related records
      await prisma.user.delete({
        where: { id: userId }
      });

      res.json({ message: 'User deleted successfully', deactivated: false });
    }
  } catch (error) {
    next(error);
  }
});

// Get permission categories (for UI)
router.get('/permissions/categories', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), (req: AuthRequest, res: Response) => {
  res.json(getPermissionCategories());
});

// Get role default permissions
router.get('/permissions/defaults/:role', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const validRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_STAFF', 'VENDOR', 'READ_ONLY'];

    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const defaults = getRoleDefaults(role as any);
    res.json(defaults);
  } catch (error) {
    next(error);
  }
});

// Get user's permissions
router.get('/users/:userId/permissions', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user!.companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const roleDefaults = getRoleDefaults(user.role);
    const effectivePermissions = getEffectivePermissions(
      user.role,
      user.permissions as Partial<UserPermissions> | null
    );

    res.json({
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      roleDefaults,
      customPermissions: user.permissions,
      effectivePermissions,
      hasCustomPermissions: user.permissions !== null
    });
  } catch (error) {
    next(error);
  }
});

// Update user's custom permissions
router.patch('/users/:userId/permissions', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user!.companyId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent modifying own permissions (safety)
    if (userId === req.user!.id) {
      throw new AppError('Cannot modify your own permissions', 403);
    }

    // Prevent modifying SUPER_ADMIN permissions
    if (user.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot modify super admin permissions', 403);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { permissions },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true
      }
    });

    const effectivePermissions = getEffectivePermissions(
      updated.role,
      updated.permissions as Partial<UserPermissions> | null
    );

    res.json({
      ...updated,
      effectivePermissions,
      hasCustomPermissions: updated.permissions !== null
    });
  } catch (error) {
    next(error);
  }
});

// Reset user permissions to role defaults
router.delete('/users/:userId/permissions', authenticate, authorize('COMPANY_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user!.companyId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { permissions: Prisma.DbNull },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true
      }
    });

    const effectivePermissions = getEffectivePermissions(updated.role, null);

    res.json({
      ...updated,
      effectivePermissions,
      hasCustomPermissions: false,
      message: 'Permissions reset to role defaults'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
