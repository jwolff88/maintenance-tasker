import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Valid skills that technicians can have
const VALID_SKILLS = [
  'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL',
  'PAINTING', 'FLOORING', 'ROOFING', 'LANDSCAPING', 'GENERAL'
];

// Get all technicians in company
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        email: true,
        phone: true,
        skills: true,
        certifications: true,
        hourlyRate: true,
        maxDailyTasks: true,
        currentWorkload: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
            assignedTickets: { where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    res.json(technicians);
  } catch (error) {
    next(error);
  }
});

// Get single technician profile
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
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
        email: true,
        phone: true,
        skills: true,
        certifications: true,
        hourlyRate: true,
        maxDailyTasks: true,
        currentWorkload: true,
        createdAt: true,
        assignedTasks: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW'] } },
          include: {
            asset: { select: { name: true, location: true } }
          },
          orderBy: { dueDate: 'asc' },
          take: 20
        },
        assignedTickets: {
          where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
          include: {
            property: { select: { name: true, address: true } }
          },
          orderBy: { priority: 'desc' },
          take: 20
        },
        timeEntries: {
          orderBy: { clockIn: 'desc' },
          take: 10
        }
      }
    });

    if (!technician) {
      throw new AppError('Technician not found', 404);
    }

    res.json(technician);
  } catch (error) {
    next(error);
  }
});

// Update technician profile (skills, certifications, etc.)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skills, certifications, hourlyRate, maxDailyTasks, phone } = req.body;

    // Verify technician exists and belongs to company
    const existing = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        role: 'MAINTENANCE_STAFF'
      }
    });

    if (!existing) {
      throw new AppError('Technician not found', 404);
    }

    // Validate skills if provided
    if (skills) {
      const invalidSkills = skills.filter((s: string) => !VALID_SKILLS.includes(s.toUpperCase()));
      if (invalidSkills.length > 0) {
        throw new AppError(`Invalid skills: ${invalidSkills.join(', ')}`, 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(skills && { skills: skills.map((s: string) => s.toUpperCase()) }),
        ...(certifications !== undefined && { certifications }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(maxDailyTasks !== undefined && { maxDailyTasks }),
        ...(phone !== undefined && { phone })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        skills: true,
        certifications: true,
        hourlyRate: true,
        maxDailyTasks: true,
        currentWorkload: true
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Smart assignment - find best technician for a task/ticket
router.post('/smart-assign', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requiredSkills, priority, propertyId } = req.body;

    // Get all available technicians
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
        currentWorkload: true,
        maxDailyTasks: true,
        hourlyRate: true,
        _count: {
          select: {
            assignedTasks: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
            assignedTickets: { where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }
          }
        }
      }
    });

    // Score each technician
    const scored = technicians.map(tech => {
      let score = 100;

      // Skill match (40 points)
      if (requiredSkills && requiredSkills.length > 0) {
        const matchedSkills = requiredSkills.filter((skill: string) =>
          tech.skills.includes(skill.toUpperCase())
        );
        const skillScore = (matchedSkills.length / requiredSkills.length) * 40;
        score += skillScore;
      }

      // Workload factor (30 points) - prefer less busy technicians
      const totalActive = tech._count.assignedTasks + tech._count.assignedTickets;
      const maxTasks = tech.maxDailyTasks || 8;
      const workloadRatio = totalActive / maxTasks;
      score -= workloadRatio * 30;

      // Availability (30 points) - if not at capacity
      if (totalActive >= maxTasks) {
        score -= 50; // Heavy penalty for overloaded technicians
      }

      return {
        ...tech,
        score: Math.round(score),
        activeJobs: totalActive,
        skillMatch: requiredSkills ? requiredSkills.filter((skill: string) =>
          tech.skills.includes(skill.toUpperCase())
        ) : []
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top 5 recommendations
    res.json({
      recommendations: scored.slice(0, 5),
      bestMatch: scored[0] || null
    });
  } catch (error) {
    next(error);
  }
});

// Get technician availability/schedule
router.get('/:id/availability', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
        maxDailyTasks: true,
        assignedTasks: {
          where: {
            dueDate: { gte: start, lte: end },
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            priority: true,
            estimatedTime: true
          }
        },
        timeEntries: {
          where: {
            clockIn: { gte: start, lte: end }
          },
          select: {
            clockIn: true,
            clockOut: true,
            duration: true
          }
        }
      }
    });

    if (!technician) {
      throw new AppError('Technician not found', 404);
    }

    // Calculate hours worked
    const totalMinutes = technician.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    res.json({
      technician: {
        id: technician.id,
        name: `${technician.firstName} ${technician.lastName}`,
        maxDailyTasks: technician.maxDailyTasks
      },
      scheduledTasks: technician.assignedTasks,
      hoursWorked: Math.round(totalMinutes / 60 * 10) / 10,
      taskCount: technician.assignedTasks.length
    });
  } catch (error) {
    next(error);
  }
});

// Get valid skills list
router.get('/config/skills', authenticate, async (_req: AuthRequest, res: Response) => {
  res.json({ skills: VALID_SKILLS });
});

export default router;
