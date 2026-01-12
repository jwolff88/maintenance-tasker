import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get team overview stats
router.get('/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get team size
    const technicians = await prisma.user.findMany({
      where: {
        companyId: req.user!.companyId,
        role: 'MAINTENANCE_STAFF',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        skills: true,
        hourlyRate: true,
        _count: {
          select: {
            assignedTasks: true,
            assignedTickets: true
          }
        }
      }
    });

    // Tasks completed in period
    const tasksCompleted = await prisma.task.count({
      where: {
        companyId: req.user!.companyId,
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end }
      }
    });

    // Tickets completed in period
    const ticketsCompleted = await prisma.maintenanceTicket.count({
      where: {
        property: { companyId: req.user!.companyId },
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end }
      }
    });

    // Total hours worked
    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        user: { companyId: req.user!.companyId },
        clockIn: { gte: start, lte: end },
        duration: { not: null }
      },
      _sum: { duration: true }
    });

    // Average response time (time from creation to first assignment)
    const recentTickets = await prisma.maintenanceTicket.findMany({
      where: {
        property: { companyId: req.user!.companyId },
        createdAt: { gte: start, lte: end },
        assigneeId: { not: null }
      },
      select: { createdAt: true, updatedAt: true }
    });

    // Open tasks/tickets
    const openTasks = await prisma.task.count({
      where: {
        companyId: req.user!.companyId,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    });

    const openTickets = await prisma.maintenanceTicket.count({
      where: {
        property: { companyId: req.user!.companyId },
        status: { in: ['NEW', 'IN_PROGRESS'] }
      }
    });

    res.json({
      period: { start, end },
      team: {
        size: technicians.length,
        members: technicians.map(t => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          skills: t.skills,
          activeTasks: t._count.assignedTasks,
          activeTickets: t._count.assignedTickets
        }))
      },
      productivity: {
        tasksCompleted,
        ticketsCompleted,
        totalCompleted: tasksCompleted + ticketsCompleted,
        hoursWorked: Math.round((timeEntries._sum.duration || 0) / 60 * 10) / 10
      },
      workload: {
        openTasks,
        openTickets,
        totalOpen: openTasks + openTickets
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get individual technician performance
router.get('/technician/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const technician = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        role: 'MAINTENANCE_STAFF'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        skills: true,
        hourlyRate: true,
        createdAt: true
      }
    });

    if (!technician) {
      throw new AppError('Technician not found', 404);
    }

    // Tasks metrics
    const [tasksCompleted, tasksAssigned, avgTaskTime] = await Promise.all([
      prisma.task.count({
        where: {
          assignedToId: req.params.id,
          status: 'COMPLETED',
          completedAt: { gte: start, lte: end }
        }
      }),
      prisma.task.count({
        where: {
          assignedToId: req.params.id,
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.task.aggregate({
        where: {
          assignedToId: req.params.id,
          status: 'COMPLETED',
          completedAt: { gte: start, lte: end },
          actualTime: { not: null }
        },
        _avg: { actualTime: true }
      })
    ]);

    // Tickets metrics
    const [ticketsCompleted, ticketsAssigned] = await Promise.all([
      prisma.maintenanceTicket.count({
        where: {
          assigneeId: req.params.id,
          status: 'COMPLETED',
          completedAt: { gte: start, lte: end }
        }
      }),
      prisma.maintenanceTicket.count({
        where: {
          assigneeId: req.params.id,
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    // Time tracking
    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        userId: req.params.id,
        clockIn: { gte: start, lte: end },
        duration: { not: null }
      },
      _sum: { duration: true },
      _count: true
    });

    // Calculate completion rate
    const completionRate = tasksAssigned > 0
      ? Math.round((tasksCompleted / tasksAssigned) * 100)
      : 0;

    // Labor cost
    const hoursWorked = (timeEntries._sum.duration || 0) / 60;
    const laborCost = hoursWorked * Number(technician.hourlyRate || 0);

    res.json({
      technician: {
        id: technician.id,
        name: `${technician.firstName} ${technician.lastName}`,
        skills: technician.skills,
        hourlyRate: technician.hourlyRate,
        memberSince: technician.createdAt
      },
      period: { start, end },
      tasks: {
        completed: tasksCompleted,
        assigned: tasksAssigned,
        completionRate,
        avgTimeMinutes: Math.round(avgTaskTime._avg.actualTime || 0)
      },
      tickets: {
        completed: ticketsCompleted,
        assigned: ticketsAssigned
      },
      time: {
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        entriesLogged: timeEntries._count,
        laborCost: Math.round(laborCost * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get team leaderboard
router.get('/leaderboard', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, metric } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const technicians = await prisma.user.findMany({
      where: {
        companyId: req.user!.companyId,
        role: 'MAINTENANCE_STAFF',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedTasks: {
          where: {
            status: 'COMPLETED',
            completedAt: { gte: start, lte: end }
          }
        },
        assignedTickets: {
          where: {
            status: 'COMPLETED',
            completedAt: { gte: start, lte: end }
          }
        },
        timeEntries: {
          where: {
            clockIn: { gte: start, lte: end },
            duration: { not: null }
          }
        }
      }
    });

    const leaderboard = technicians.map(tech => {
      const tasksCompleted = tech.assignedTasks.length;
      const ticketsCompleted = tech.assignedTickets.length;
      const hoursWorked = tech.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;

      return {
        id: tech.id,
        name: `${tech.firstName} ${tech.lastName}`,
        tasksCompleted,
        ticketsCompleted,
        totalCompleted: tasksCompleted + ticketsCompleted,
        hoursWorked: Math.round(hoursWorked * 10) / 10
      };
    });

    // Sort by requested metric
    const sortKey = metric === 'tasks' ? 'tasksCompleted'
      : metric === 'tickets' ? 'ticketsCompleted'
      : metric === 'hours' ? 'hoursWorked'
      : 'totalCompleted';

    leaderboard.sort((a, b) => (b as any)[sortKey] - (a as any)[sortKey]);

    res.json({
      period: { start, end },
      leaderboard: leaderboard.map((tech, index) => ({
        rank: index + 1,
        ...tech
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get workload distribution
router.get('/workload', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        companyId: req.user!.companyId,
        role: 'MAINTENANCE_STAFF',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        maxDailyTasks: true,
        _count: {
          select: {
            assignedTasks: {
              where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
            },
            assignedTickets: {
              where: { status: { in: ['NEW', 'IN_PROGRESS'] } }
            }
          }
        }
      }
    });

    const workload = technicians.map(tech => {
      const activeTasks = tech._count.assignedTasks;
      const activeTickets = tech._count.assignedTickets;
      const total = activeTasks + activeTickets;
      const capacity = tech.maxDailyTasks || 8;
      const utilizationPct = Math.round((total / capacity) * 100);

      return {
        id: tech.id,
        name: `${tech.firstName} ${tech.lastName}`,
        activeTasks,
        activeTickets,
        totalActive: total,
        capacity,
        utilizationPct,
        status: utilizationPct >= 100 ? 'overloaded'
          : utilizationPct >= 75 ? 'busy'
          : utilizationPct >= 25 ? 'available'
          : 'idle'
      };
    });

    // Sort by utilization
    workload.sort((a, b) => b.utilizationPct - a.utilizationPct);

    const avgUtilization = workload.length > 0
      ? Math.round(workload.reduce((sum, w) => sum + w.utilizationPct, 0) / workload.length)
      : 0;

    res.json({
      avgUtilization,
      overloaded: workload.filter(w => w.status === 'overloaded').length,
      available: workload.filter(w => w.status === 'available' || w.status === 'idle').length,
      technicians: workload
    });
  } catch (error) {
    next(error);
  }
});

// Get skills coverage
router.get('/skills-coverage', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        companyId: req.user!.companyId,
        role: 'MAINTENANCE_STAFF',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        skills: true
      }
    });

    // Aggregate skills
    const skillsMap: Record<string, string[]> = {};

    technicians.forEach(tech => {
      tech.skills.forEach(skill => {
        if (!skillsMap[skill]) {
          skillsMap[skill] = [];
        }
        skillsMap[skill].push(`${tech.firstName} ${tech.lastName}`);
      });
    });

    const coverage = Object.entries(skillsMap).map(([skill, techs]) => ({
      skill,
      technicianCount: techs.length,
      technicians: techs
    }));

    coverage.sort((a, b) => b.technicianCount - a.technicianCount);

    // Find gaps (skills with only one technician)
    const gaps = coverage.filter(c => c.technicianCount === 1);

    res.json({
      totalSkillTypes: coverage.length,
      totalTechnicians: technicians.length,
      coverage,
      gaps,
      gapWarning: gaps.length > 0
        ? `${gaps.length} skill(s) have only one technician - consider cross-training`
        : null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
