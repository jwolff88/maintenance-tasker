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

### Installation & Setup

**1. Clone and Install Dependencies**
```bash
# Clone the repository
git clone <repository-url>
cd maintenance-tasker

# Install dependencies from the root directory
npm install
```

**2. Set Up PostgreSQL Database**

This project requires a PostgreSQL database. You can use a local installation or a cloud provider like Supabase (recommended) or Railway.

- **Ensure PostgreSQL is running.**
- **Create a database** for the project (e.g., `maintenance_tasker`).
- **Get your connection string.** This is a URL with the format:
  `postgresql://<user>:<password>@<host>:<port>/<database>`

**3. Configure Environment Variables**

You need to create two `.env` files: one for the backend and one for the frontend.

- **Backend:**
  ```bash
  cp backend/.env.example backend/.env
  ```
  Now, open `backend/.env` and **update the `DATABASE_URL`** with your actual connection string. You should also set your own `JWT_SECRET` and `JWT_REFRESH_SECRET`.

- **Frontend:**
  ```bash
  cp frontend/.env.example frontend/.env
  ```
  The default settings in this file are usually sufficient for local development.

**4. Run Database Migrations**

This command sets up your database schema based on `prisma/schema.prisma`.

```bash
# From the root directory
npm run db:migrate
```

**5. (Optional) Seed Database with Demo Data**

To populate the app with sample companies, users, and properties, run the seed script:

```bash
# From the root directory
npm run db:seed
```

**6. Start the Development Servers**
```bash
# This will start both the backend (port 3001) and frontend (port 5173)
npm run dev
```
The application should now be running at `http://localhost:5173`.

### Environment Variables Explained

#### `backend/.env`
```env
# Database connection string (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/maintenance_tasker"

# JWT secrets for authentication (REQUIRED - CHANGE THESE)
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# Port for the backend server
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

#### `frontend/.env`
```env
# URL for the backend API
VITE_API_URL=http://localhost:3001/api
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
