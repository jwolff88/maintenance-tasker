# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **property management maintenance platform** - multi-tenant SaaS for property management companies. Features predictive maintenance, lease intelligence, and full property operational profiles.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Query
- **Auth**: JWT-based with role-based access control (RBAC)

## Build Commands

```bash
# Install dependencies (from root)
npm install

# Run both frontend and backend in dev mode
npm run dev

# Run backend only (port 3001)
npm run dev:backend

# Run frontend only (port 5173)
npm run dev:frontend

# Database commands (requires PostgreSQL)
cd backend
cp .env.example .env  # then edit DATABASE_URL
npm run db:migrate    # run migrations
npm run db:seed       # seed demo data
npm run db:generate   # regenerate Prisma client
```

## Demo Credentials (after seeding)

- Email: `admin@acme-pm.com`
- Password: `password123`

## Project Structure

```
backend/
  src/
    routes/       # Express route handlers
    middleware/   # Auth, error handling
    utils/        # Prisma client singleton
  prisma/
    schema.prisma # Database schema
    seed.ts       # Demo data seeder

frontend/
  src/
    components/   # Shared UI components
    pages/        # Route pages
    context/      # React context (AuthContext)
    services/     # API client (axios)
```

## Key Domain Concepts

- **Multi-tenant**: Each company isolated via `companyId` on all queries
- **User roles**: SUPER_ADMIN, COMPANY_ADMIN, PROPERTY_MANAGER, MAINTENANCE_STAFF, VENDOR, READ_ONLY
- **Property status**: HEALTHY, ATTENTION_NEEDED, CRITICAL
- **Four note types per property**: PROPERTY, TENANT, BUILDING, OWNER
- **Risk scoring**: 0-100 predictive maintenance score per property

## API Routes

All routes prefixed with `/api`:
- `/auth` - login, register, me
- `/properties` - CRUD, activity logs
- `/tickets` - maintenance tickets with comments
- `/leases` - lease management with tenants
- `/vendors` - contractor management with ratings
- `/notes` - four-category property notes
- `/dashboard` - overview stats, analytics
- `/companies` - company settings, user management

## Database Schema Highlights

- `Company` → `User`, `Property`, `Vendor` (tenant isolation)
- `Property` → `Lease`, `MaintenanceTicket`, `Note`, `Equipment`, `Inspection`, `PropertyEvent`
- `MaintenanceTicket` → `TicketComment`, `Attachment`
- `Note` has `type` enum for the four categories
