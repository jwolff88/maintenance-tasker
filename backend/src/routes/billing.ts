import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Initialize Stripe (will fail gracefully if not configured)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan limits configuration
export const PLAN_LIMITS = {
  TRIAL: {
    properties: 3,
    users: 2,
    tasksPerMonth: 25,
    assetsPerProperty: 5,
  },
  STARTER: {
    properties: 10,
    users: 3,
    tasksPerMonth: 100,
    assetsPerProperty: 20,
  },
  PRO: {
    properties: 50,
    users: 10,
    tasksPerMonth: -1, // unlimited
    assetsPerProperty: -1,
  },
  ENTERPRISE: {
    properties: -1,
    users: -1,
    tasksPerMonth: -1,
    assetsPerProperty: -1,
  },
};

// Price IDs from environment (set these in Stripe dashboard)
const PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PRO: process.env.STRIPE_PRICE_PRO,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
};

// Get current subscription status
router.get('/subscription', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        _count: {
          select: {
            properties: true,
            users: true,
            tasks: true,
            assets: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const limits = PLAN_LIMITS[company.plan];
    const usage = {
      properties: company._count.properties,
      users: company._count.users,
      tasks: company._count.tasks,
      assets: company._count.assets,
    };

    res.json({
      plan: company.plan,
      status: company.subscriptionStatus,
      trialEndsAt: company.trialEndsAt,
      currentPeriodEnd: company.currentPeriodEnd,
      limits,
      usage,
      isAtLimit: {
        properties: limits.properties !== -1 && usage.properties >= limits.properties,
        users: limits.users !== -1 && usage.users >= limits.users,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get pricing info (public)
router.get('/pricing', async (req: Request, res: Response) => {
  res.json({
    plans: [
      {
        id: 'STARTER',
        name: 'Starter',
        price: 49,
        interval: 'month',
        features: [
          'Up to 10 properties',
          '3 team members',
          '100 tasks per month',
          'Email support',
        ],
        limits: PLAN_LIMITS.STARTER,
      },
      {
        id: 'PRO',
        name: 'Professional',
        price: 149,
        interval: 'month',
        popular: true,
        features: [
          'Up to 50 properties',
          '10 team members',
          'Unlimited tasks',
          'Priority support',
          'Advanced analytics',
        ],
        limits: PLAN_LIMITS.PRO,
      },
      {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        price: 349,
        interval: 'month',
        features: [
          'Unlimited properties',
          'Unlimited team members',
          'Unlimited tasks',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
        ],
        limits: PLAN_LIMITS.ENTERPRISE,
      },
    ],
    trial: {
      days: 14,
      limits: PLAN_LIMITS.TRIAL,
    },
  });
});

// Create checkout session
router.post('/create-checkout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!stripe) {
      throw new AppError('Billing is not configured', 503);
    }

    const { plan } = req.body;
    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];

    if (!priceId) {
      throw new AppError('Invalid plan selected', 400);
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Create or retrieve Stripe customer
    let customerId = company.stripeCustomerId;

    // Verify existing customer exists in Stripe, create new one if not
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err: any) {
        // Customer doesn't exist in current Stripe account, clear it
        if (err.code === 'resource_missing') {
          customerId = null;
          await prisma.company.update({
            where: { id: company.id },
            data: { stripeCustomerId: null, stripeSubscriptionId: null },
          });
        } else {
          throw err;
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.name,
        metadata: {
          companyId: company.id,
        },
      });
      customerId = customer.id;
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Take first URL if multiple are provided (comma-separated)
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings?billing=success`,
      cancel_url: `${frontendUrl}/settings?billing=canceled`,
      metadata: {
        companyId: company.id,
        plan,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

// Create customer portal session
router.post('/create-portal', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!stripe) {
      throw new AppError('Billing is not configured', 503);
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
    });

    if (!company?.stripeCustomerId) {
      throw new AppError('No billing account found', 400);
    }

    // Take first URL if multiple are provided (comma-separated)
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${frontendUrl}/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook handler
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!stripe) {
      throw new AppError('Billing is not configured', 503);
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    let event: Stripe.Event;

    try {
      // req.body is a Buffer when using express.raw() middleware
      const payload = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.companyId;
        const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'ENTERPRISE';

        if (companyId && plan) {
          await prisma.company.update({
            where: { id: companyId },
            data: {
              plan,
              subscriptionStatus: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const company = await prisma.company.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (company) {
          const periodEnd = (subscription as any).current_period_end;
          await prisma.company.update({
            where: { id: company.id },
            data: {
              subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' :
                subscription.status === 'past_due' ? 'PAST_DUE' :
                subscription.status === 'canceled' ? 'CANCELED' :
                subscription.status === 'trialing' ? 'TRIALING' : 'UNPAID',
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const company = await prisma.company.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: {
              plan: 'TRIAL',
              subscriptionStatus: 'CANCELED',
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId) {
          const company = await prisma.company.findFirst({
            where: { stripeSubscriptionId: subscriptionId as string },
          });

          if (company) {
            await prisma.company.update({
              where: { id: company.id },
              data: { subscriptionStatus: 'PAST_DUE' },
            });
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
