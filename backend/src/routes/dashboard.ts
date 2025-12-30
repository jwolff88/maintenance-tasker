import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get dashboard overview
router.get('/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;

    // Get property stats
    const properties = await prisma.property.findMany({
      where: { companyId },
      select: { id: true, status: true, riskScore: true }
    });

    const propertyIds = properties.map(p => p.id);

    const propertyStats = {
      total: properties.length,
      healthy: properties.filter(p => p.status === 'HEALTHY').length,
      attentionNeeded: properties.filter(p => p.status === 'ATTENTION_NEEDED').length,
      critical: properties.filter(p => p.status === 'CRITICAL').length,
      avgRiskScore: properties.length > 0
        ? Math.round(properties.reduce((sum, p) => sum + p.riskScore, 0) / properties.length)
        : 0
    };

    // Get ticket stats
    const ticketStats = await prisma.maintenanceTicket.groupBy({
      by: ['status'],
      where: { propertyId: { in: propertyIds } },
      _count: true
    });

    const tickets = {
      new: ticketStats.find(t => t.status === 'NEW')?._count || 0,
      inProgress: ticketStats.find(t => t.status === 'IN_PROGRESS')?._count || 0,
      waitingOnTenant: ticketStats.find(t => t.status === 'WAITING_ON_TENANT')?._count || 0,
      completed: ticketStats.find(t => t.status === 'COMPLETED')?._count || 0
    };

    // Get urgent tickets
    const urgentTickets = await prisma.maintenanceTicket.findMany({
      where: {
        propertyId: { in: propertyIds },
        priority: 'URGENT',
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      },
      include: {
        property: { select: { name: true, address: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get expiring leases (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLeases = await prisma.lease.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        }
      },
      include: {
        property: { select: { name: true, address: true } },
        tenant: { select: { firstName: true, lastName: true } }
      },
      orderBy: { endDate: 'asc' }
    });

    // Get upcoming events
    const upcomingEvents = await prisma.propertyEvent.findMany({
      where: {
        propertyId: { in: propertyIds },
        isCompleted: false,
        date: { gte: new Date() }
      },
      include: {
        property: { select: { name: true } }
      },
      orderBy: { date: 'asc' },
      take: 10
    });

    // Get upcoming inspections
    const upcomingInspections = await prisma.inspection.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() }
      },
      include: {
        property: { select: { name: true, address: true } }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5
    });

    // Get high risk properties (predictive maintenance)
    const highRiskProperties = await prisma.property.findMany({
      where: {
        companyId,
        riskScore: { gte: 70 }
      },
      include: {
        equipment: {
          where: {
            OR: [
              { warrantyExpiry: { lte: new Date() } },
              { nextServiceDate: { lte: new Date() } }
            ]
          }
        }
      },
      orderBy: { riskScore: 'desc' },
      take: 5
    });

    res.json({
      propertyStats,
      tickets,
      urgentTickets,
      expiringLeases,
      upcomingEvents,
      upcomingInspections,
      highRiskProperties
    });
  } catch (error) {
    next(error);
  }
});

// Get maintenance cost analytics
router.get('/analytics/costs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const companyProperties = await prisma.property.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true }
    });
    const propertyIds = companyProperties.map(p => p.id);

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end }
      },
      select: {
        actualCost: true,
        category: true,
        propertyId: true,
        completedAt: true
      }
    });

    // Cost by category
    const costByCategory = tickets.reduce((acc, t) => {
      const cost = parseFloat(t.actualCost?.toString() || '0');
      acc[t.category] = (acc[t.category] || 0) + cost;
      return acc;
    }, {} as Record<string, number>);

    // Cost by property
    const costByProperty = tickets.reduce((acc, t) => {
      const cost = parseFloat(t.actualCost?.toString() || '0');
      acc[t.propertyId] = (acc[t.propertyId] || 0) + cost;
      return acc;
    }, {} as Record<string, number>);

    // Total cost
    const totalCost = tickets.reduce((sum, t) =>
      sum + parseFloat(t.actualCost?.toString() || '0'), 0
    );

    res.json({
      totalCost,
      costByCategory,
      costByProperty,
      ticketCount: tickets.length,
      avgCostPerTicket: tickets.length > 0 ? totalCost / tickets.length : 0
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activity
router.get('/activity', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyProperties = await prisma.property.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true }
    });
    const propertyIds = companyProperties.map(p => p.id);

    const logs = await prisma.activityLog.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        user: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
