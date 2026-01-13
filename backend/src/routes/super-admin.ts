import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

// Middleware to ensure SUPER_ADMIN only
const requireSuperAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
};

router.use(authenticate);
router.use(requireSuperAdmin);

// GET /super-admin/stats - Platform-wide statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalCompanies,
      totalUsers,
      totalProperties,
      totalTickets,
      totalTasks,
      companiesByPlan,
      recentSignups,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.property.count(),
      prisma.maintenanceTicket.count(),
      prisma.task.count(),
      prisma.company.groupBy({
        by: ['plan'],
        _count: { id: true },
      }),
      prisma.company.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
          _count: { select: { users: true, properties: true } },
        },
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const planPrices: Record<string, number> = {
      TRIAL: 0,
      STARTER: 49,
      PRO: 149,
      ENTERPRISE: 349,
    };

    const mrr = companiesByPlan.reduce((sum: number, item: { plan: string; _count: { id: number } }) => {
      return sum + (planPrices[item.plan] || 0) * item._count.id;
    }, 0);

    res.json({
      totalCompanies,
      totalUsers,
      totalProperties,
      totalTickets,
      totalTasks,
      mrr,
      companiesByPlan: companiesByPlan.map((p: { plan: string; _count: { id: number } }) => ({
        plan: p.plan,
        count: p._count.id,
      })),
      recentSignups,
    });
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /super-admin/companies - List all companies
router.get('/companies', async (req: AuthRequest, res: Response) => {
  try {
    const { search, plan, status } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (plan) {
      where.plan = plan;
    }

    if (status) {
      where.subscriptionStatus = status;
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
            tasks: true,
          },
        },
      },
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /super-admin/companies/:id - Get single company details
router.get('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            properties: true,
            tasks: true,
            assets: true,
            vendors: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// PATCH /super-admin/companies/:id - Update company (subscription, etc.)
router.patch('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { plan, subscriptionStatus, trialEndsAt, currentPeriodEnd } = req.body;

    const updateData: any = {};

    if (plan) updateData.plan = plan;
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
    if (trialEndsAt) updateData.trialEndsAt = new Date(trialEndsAt);
    if (currentPeriodEnd) updateData.currentPeriodEnd = new Date(currentPeriodEnd);

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// POST /super-admin/companies/:id/grant-access - Grant unlimited access
router.post('/companies/:id/grant-access', async (req: AuthRequest, res: Response) => {
  try {
    const { plan, months } = req.body;

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (months || 12));

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        plan: plan || 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd,
        trialEndsAt: null,
      },
    });

    res.json({ message: 'Access granted successfully', company });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// DELETE /super-admin/companies/:id - Delete a company
router.delete('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    // This will cascade delete all related data
    await prisma.company.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// GET /super-admin/users - List all users across all companies
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, companyId } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /super-admin/users/:id - Update any user
router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { role, isActive } = req.body;

    const updateData: any = {};
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /super-admin/users/:id/impersonate - Get token to impersonate user
router.post('/users/:id/impersonate', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { company: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate impersonation token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        impersonatedBy: req.user?.id,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.company.name,
      },
    });
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

// DELETE /super-admin/users/:id - Delete any user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /super-admin/activity - Recent activity across platform
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const [recentTickets, recentTasks, recentUsers] = await Promise.all([
      prisma.maintenanceTicket.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          property: {
            select: {
              name: true,
              company: { select: { name: true } },
            },
          },
        },
      }),
      prisma.task.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      recentTickets,
      recentTasks,
      recentUsers,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
