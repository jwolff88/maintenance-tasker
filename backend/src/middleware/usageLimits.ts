import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from './errorHandler.js';
import { AuthRequest } from './auth.js';
import { PLAN_LIMITS } from '../routes/billing.js';

type ResourceType = 'properties' | 'users' | 'tasks' | 'assets';

// Helper to get start of current month
function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function checkUsageLimit(resourceType: ResourceType) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Unauthorized', 401);
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          _count: {
            select: {
              properties: true,
              users: true,
              assets: true,
            },
          },
        },
      });

      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // Check if subscription is valid
      if (company.subscriptionStatus === 'CANCELED' || company.subscriptionStatus === 'UNPAID') {
        throw new AppError('Your subscription is inactive. Please update your billing to continue.', 402);
      }

      // Check trial expiration
      if (company.plan === 'TRIAL' && company.trialEndsAt) {
        if (new Date() > company.trialEndsAt) {
          throw new AppError('Your trial has expired. Please subscribe to continue.', 402);
        }
      }

      const limits = PLAN_LIMITS[company.plan as keyof typeof PLAN_LIMITS];
      let currentCount: number;
      let limit: number;
      let resourceLabel: string = resourceType;

      switch (resourceType) {
        case 'properties':
          currentCount = company._count.properties;
          limit = limits.properties;
          break;

        case 'users':
          currentCount = company._count.users;
          limit = limits.users;
          break;

        case 'tasks':
          // Count only tasks created this month
          const tasksThisMonth = await prisma.task.count({
            where: {
              companyId,
              createdAt: { gte: getStartOfMonth() },
            },
          });
          currentCount = tasksThisMonth;
          limit = limits.tasksPerMonth;
          resourceLabel = 'tasks this month';
          break;

        case 'assets':
          // Use total assets as the limit (treating assetsPerProperty as total for simplicity)
          currentCount = company._count.assets;
          limit = limits.assetsPerProperty;
          break;

        default:
          currentCount = 0;
          limit = -1;
      }

      // -1 means unlimited
      if (limit !== -1 && currentCount >= limit) {
        const planName = company.plan.toLowerCase();
        throw new AppError(
          `You've reached the ${resourceLabel} limit for your ${planName} plan. Please upgrade to add more.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Middleware to add subscription info to response (for frontend awareness)
export async function attachSubscriptionInfo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId },
        select: {
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
        },
      });

      if (company) {
        // Attach to request for downstream use
        (req as any).subscription = {
          plan: company.plan,
          status: company.subscriptionStatus,
          trialEndsAt: company.trialEndsAt,
        };
      }
    }
    next();
  } catch (error) {
    // Don't block request if subscription check fails
    next();
  }
}
