# Maintenance Tasker

**Property Management & Maintenance Operations Platform**

A professional-grade SaaS application for property management companies to coordinate, track, and document maintenance activities across their portfolio. Built for accountability, efficiency, and scale.

## Value Proposition

- **Reduce maintenance costs** with predictive analytics and scheduled maintenance
- **Prevent failures** before they happen with proactive asset monitoring
- **Centralize operations** with a single source of truth for all properties
- **Improve tenant satisfaction** with faster response times and transparent communication
- **Real-time visibility** across your entire property portfolio

## Features

### Core Platform
- Multi-tenant architecture with full data isolation per company
- Role-based access control (Admin, Property Manager, Maintenance Staff, Vendor)
- Dashboard with portfolio overview and analytics
- Property management with detailed operational profiles

### Maintenance Tasker
- Asset registry with categories, service history, and status tracking
- Task lifecycle management: Open → In Progress → Under Review → Completed
- Photo evidence (before/after) for accountability
- Recurring task scheduling (daily, weekly, monthly, etc.)
- Overdue task alerts and priority matrix

### Additional Features
- Maintenance tickets with SLA tracking
- Tenant portal for maintenance requests
- Vendor management with ratings
- Lease tracking with expiration alerts
- Equipment warranty monitoring
- Inspection scheduling
- Cost analytics and reporting

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Supabase recommended)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: React Query
- **Auth**: JWT-based authentication
- **Payments**: Stripe (for subscription billing)

## Quick Start

### Prerequisites
- Node.js 20.x
- PostgreSQL database (or Supabase account)
- Stripe account (for billing - optional for development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd maintenance-tasker

# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and secrets

# Run database migrations
cd backend
npx prisma db push
npm run db:seed  # Optional: seed demo data

# Start development servers
cd ..
npm run dev
```

### Environment Variables

Create `backend/.env` with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/maintenance_tasker"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
PORT=3001
NODE_ENV=development

# Stripe (optional for development)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_STARTER="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_ENTERPRISE="price_..."

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

## Demo Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@acme-pm.com | password123 |
| Manager | manager@acme-pm.com | password123 |
| Technician | tech@acme-pm.com | password123 |

## Pricing Tiers

| Plan | Price | Properties | Users | Tasks/mo |
|------|-------|------------|-------|----------|
| Free Trial | $0 | 3 | 2 | 25 |
| Starter | $49/mo | 10 | 3 | 100 |
| Professional | $149/mo | 50 | 10 | Unlimited |
| Enterprise | $349/mo | Unlimited | Unlimited | Unlimited |

14-day free trial included. No credit card required to start.

## Project Structure

```
maintenance-tasker/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, error handling, usage limits
│   │   └── utils/         # Prisma client
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── seed.ts        # Demo data
├── frontend/
│   ├── src/
│   │   ├── components/    # Shared UI
│   │   ├── pages/         # Route pages
│   │   ├── context/       # React context
│   │   └── services/      # API client
│   └── dist/              # Production build
└── api/
    └── index.ts           # Vercel serverless entry
```

## API Routes

All routes prefixed with `/api`:

| Route | Description |
|-------|-------------|
| `/auth` | Login, register, current user |
| `/billing` | Subscription, pricing, checkout |
| `/properties` | Property CRUD, activity logs |
| `/tickets` | Maintenance tickets, comments |
| `/assets` | Asset registry, service history |
| `/tasks` | Maintenance tasks, photo uploads |
| `/leases` | Lease management, tenants |
| `/vendors` | Vendor management, ratings |
| `/dashboard` | Overview stats, analytics |

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

The `vercel.json` configuration handles:
- Frontend SPA serving from `frontend/dist`
- Backend API as serverless function at `/api`

### Environment Variables for Production

Set these in your deployment platform:

- `DATABASE_URL` - Production database connection string
- `JWT_SECRET` - Strong secret for JWT signing
- `JWT_REFRESH_SECRET` - Strong secret for refresh tokens
- `STRIPE_SECRET_KEY` - Stripe secret key (live mode)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_*` - Stripe price IDs for each plan
- `FRONTEND_URL` - Production frontend URL

## Development

```bash
# Run both frontend and backend
npm run dev

# Run backend only (port 3001)
npm run dev:backend

# Run frontend only (port 5173)
npm run dev:frontend

# Build for production
npm run build

# Database commands
cd backend
npm run db:migrate    # Run migrations
npm run db:seed       # Seed demo data
npm run db:generate   # Regenerate Prisma client
```

## Security

- JWT-based authentication with 24-hour token expiry
- Role-based access control at API level
- Multi-tenant data isolation via companyId scoping
- Passwords hashed with bcrypt (12 rounds)
- CORS configured for specified origins only

## License

Proprietary - All rights reserved

---

**Built for property management professionals who demand reliability and accountability.**
