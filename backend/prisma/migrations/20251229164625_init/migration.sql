-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_STAFF', 'VENDOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('HEALTHY', 'ATTENTION_NEEDED', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('SINGLE_FAMILY', 'MULTI_FAMILY', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('PROPERTY', 'TENANT', 'BUILDING', 'OWNER');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_ON_TENANT', 'WAITING_ON_VENDOR', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'LANDSCAPING', 'CLEANING', 'SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('CITY', 'FIRE', 'SAFETY', 'ROUTINE', 'MOVE_IN', 'MOVE_OUT');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('INSPECTION', 'LEASE_EXPIRY', 'WARRANTY_EXPIRY', 'SCHEDULED_MAINTENANCE', 'COMPLIANCE_DEADLINE');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'READ_ONLY',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "sqft" INTEGER,
    "yearBuilt" INTEGER,
    "status" "PropertyStatus" NOT NULL DEFAULT 'HEALTHY',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "occupancy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "managerId" TEXT,
    "ownerId" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyOwner" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noteId" TEXT,
    "ticketId" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "depositAmount" DECIMAL(10,2) NOT NULL,
    "status" "LeaseStatus" NOT NULL DEFAULT 'PENDING',
    "terms" TEXT,
    "renewalProb" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "TicketCategory" NOT NULL DEFAULT 'OTHER',
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "slaDeadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "suggestedFix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "tenantId" TEXT,
    "vendorId" TEXT,

    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "specialties" TEXT[],
    "insuranceExpiry" TIMESTAMP(3),
    "licenseNumber" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "passedItems" TEXT[],
    "failedItems" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "expectedLifespan" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "PropertyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "propertyId" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Property_companyId_idx" ON "Property"("companyId");

-- CreateIndex
CREATE INDEX "Property_managerId_idx" ON "Property"("managerId");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Note_propertyId_type_idx" ON "Note"("propertyId", "type");

-- CreateIndex
CREATE INDEX "Lease_propertyId_idx" ON "Lease"("propertyId");

-- CreateIndex
CREATE INDEX "Lease_endDate_idx" ON "Lease"("endDate");

-- CreateIndex
CREATE INDEX "Lease_status_idx" ON "Lease"("status");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_propertyId_idx" ON "MaintenanceTicket"("propertyId");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_status_idx" ON "MaintenanceTicket"("status");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_priority_idx" ON "MaintenanceTicket"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_createdAt_idx" ON "MaintenanceTicket"("createdAt");

-- CreateIndex
CREATE INDEX "Vendor_companyId_idx" ON "Vendor"("companyId");

-- CreateIndex
CREATE INDEX "Inspection_propertyId_idx" ON "Inspection"("propertyId");

-- CreateIndex
CREATE INDEX "Inspection_scheduledAt_idx" ON "Inspection"("scheduledAt");

-- CreateIndex
CREATE INDEX "Equipment_propertyId_idx" ON "Equipment"("propertyId");

-- CreateIndex
CREATE INDEX "Equipment_nextServiceDate_idx" ON "Equipment"("nextServiceDate");

-- CreateIndex
CREATE INDEX "PropertyEvent_propertyId_idx" ON "PropertyEvent"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyEvent_date_idx" ON "PropertyEvent"("date");

-- CreateIndex
CREATE INDEX "ActivityLog_propertyId_idx" ON "ActivityLog"("propertyId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "MaintenanceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "MaintenanceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyEvent" ADD CONSTRAINT "PropertyEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
