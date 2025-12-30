// Shared types for maintenance tasker platform

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  companyName?: string;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'PROPERTY_MANAGER'
  | 'MAINTENANCE_STAFF'
  | 'VENDOR'
  | 'READ_ONLY';

export type PropertyStatus = 'HEALTHY' | 'ATTENTION_NEEDED' | 'CRITICAL';

export type PropertyType =
  | 'SINGLE_FAMILY'
  | 'MULTI_FAMILY'
  | 'APARTMENT'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'COMMERCIAL';

export type TicketStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_ON_TENANT'
  | 'WAITING_ON_VENDOR'
  | 'COMPLETED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'HVAC'
  | 'APPLIANCE'
  | 'STRUCTURAL'
  | 'PEST_CONTROL'
  | 'LANDSCAPING'
  | 'CLEANING'
  | 'SAFETY'
  | 'OTHER';

export type NoteType = 'PROPERTY' | 'TENANT' | 'BUILDING' | 'OWNER';

export type LeaseStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: PropertyType;
  units: number;
  sqft?: number;
  yearBuilt?: number;
  status: PropertyStatus;
  riskScore: number;
  occupancy: number;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  propertyId: string;
  creatorId: string;
  assigneeId?: string;
  tenantId?: string;
  vendorId?: string;
  estimatedCost?: number;
  actualCost?: number;
  slaDeadline?: Date;
  completedAt?: Date;
  suggestedFix?: string;
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  depositAmount: number;
  status: LeaseStatus;
  terms?: string;
  renewalProb: number;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  insuranceExpiry?: Date;
  licenseNumber?: string;
  rating: number;
  totalJobs: number;
  avgResponseTime?: number;
}

export interface Note {
  id: string;
  content: string;
  type: NoteType;
  isInternal: boolean;
  propertyId: string;
  authorId: string;
}
