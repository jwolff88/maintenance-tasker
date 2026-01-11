import { UserRole } from '@prisma/client';

// Permission structure for each resource
export interface ResourcePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

// Full user permissions object
export interface UserPermissions {
  properties: ResourcePermissions;
  tasks: ResourcePermissions;
  tickets: ResourcePermissions;
  leases: ResourcePermissions;
  assets: ResourcePermissions;
  inspections: ResourcePermissions;
  vendors: ResourcePermissions;
  dashboard: {
    view: boolean;
    analytics: boolean;
  };
  team: {
    view: boolean;
    manage: boolean;
  };
  billing: {
    view: boolean;
    manage: boolean;
  };
}

// Default permissions by role
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  SUPER_ADMIN: {
    properties: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true },
    tickets: { view: true, create: true, edit: true, delete: true },
    leases: { view: true, create: true, edit: true, delete: true },
    assets: { view: true, create: true, edit: true, delete: true },
    inspections: { view: true, create: true, edit: true, delete: true },
    vendors: { view: true, create: true, edit: true, delete: true },
    dashboard: { view: true, analytics: true },
    team: { view: true, manage: true },
    billing: { view: true, manage: true },
  },
  COMPANY_ADMIN: {
    properties: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true },
    tickets: { view: true, create: true, edit: true, delete: true },
    leases: { view: true, create: true, edit: true, delete: true },
    assets: { view: true, create: true, edit: true, delete: true },
    inspections: { view: true, create: true, edit: true, delete: true },
    vendors: { view: true, create: true, edit: true, delete: true },
    dashboard: { view: true, analytics: true },
    team: { view: true, manage: true },
    billing: { view: true, manage: true },
  },
  PROPERTY_MANAGER: {
    properties: { view: true, create: true, edit: true, delete: false },
    tasks: { view: true, create: true, edit: true, delete: true },
    tickets: { view: true, create: true, edit: true, delete: false },
    leases: { view: true, create: true, edit: true, delete: false },
    assets: { view: true, create: true, edit: true, delete: false },
    inspections: { view: true, create: true, edit: true, delete: false },
    vendors: { view: true, create: true, edit: false, delete: false },
    dashboard: { view: true, analytics: true },
    team: { view: true, manage: false },
    billing: { view: false, manage: false },
  },
  MAINTENANCE_STAFF: {
    properties: { view: true, create: false, edit: false, delete: false },
    tasks: { view: true, create: true, edit: true, delete: false },
    tickets: { view: true, create: true, edit: true, delete: false },
    leases: { view: false, create: false, edit: false, delete: false },
    assets: { view: true, create: false, edit: true, delete: false },
    inspections: { view: true, create: false, edit: false, delete: false },
    vendors: { view: true, create: false, edit: false, delete: false },
    dashboard: { view: true, analytics: false },
    team: { view: false, manage: false },
    billing: { view: false, manage: false },
  },
  VENDOR: {
    properties: { view: true, create: false, edit: false, delete: false },
    tasks: { view: true, create: false, edit: true, delete: false },
    tickets: { view: true, create: false, edit: true, delete: false },
    leases: { view: false, create: false, edit: false, delete: false },
    assets: { view: true, create: false, edit: false, delete: false },
    inspections: { view: false, create: false, edit: false, delete: false },
    vendors: { view: false, create: false, edit: false, delete: false },
    dashboard: { view: true, analytics: false },
    team: { view: false, manage: false },
    billing: { view: false, manage: false },
  },
  READ_ONLY: {
    properties: { view: true, create: false, edit: false, delete: false },
    tasks: { view: true, create: false, edit: false, delete: false },
    tickets: { view: true, create: false, edit: false, delete: false },
    leases: { view: true, create: false, edit: false, delete: false },
    assets: { view: true, create: false, edit: false, delete: false },
    inspections: { view: true, create: false, edit: false, delete: false },
    vendors: { view: true, create: false, edit: false, delete: false },
    dashboard: { view: true, analytics: false },
    team: { view: false, manage: false },
    billing: { view: false, manage: false },
  },
};

/**
 * Get effective permissions for a user
 * Custom permissions override role defaults
 */
export function getEffectivePermissions(
  role: UserRole,
  customPermissions?: Partial<UserPermissions> | null
): UserPermissions {
  const roleDefaults = ROLE_PERMISSIONS[role];

  if (!customPermissions) {
    return roleDefaults;
  }

  // Deep merge custom permissions over role defaults
  return {
    properties: { ...roleDefaults.properties, ...customPermissions.properties },
    tasks: { ...roleDefaults.tasks, ...customPermissions.tasks },
    tickets: { ...roleDefaults.tickets, ...customPermissions.tickets },
    leases: { ...roleDefaults.leases, ...customPermissions.leases },
    assets: { ...roleDefaults.assets, ...customPermissions.assets },
    inspections: { ...roleDefaults.inspections, ...customPermissions.inspections },
    vendors: { ...roleDefaults.vendors, ...customPermissions.vendors },
    dashboard: { ...roleDefaults.dashboard, ...customPermissions.dashboard },
    team: { ...roleDefaults.team, ...customPermissions.team },
    billing: { ...roleDefaults.billing, ...customPermissions.billing },
  };
}

/**
 * Get role default permissions (for display in admin UI)
 */
export function getRoleDefaults(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: UserPermissions,
  resource: keyof UserPermissions,
  action: string
): boolean {
  const resourcePerms = permissions[resource];
  if (!resourcePerms) return false;
  return (resourcePerms as Record<string, boolean>)[action] === true;
}

/**
 * Get all available permission keys for frontend display
 */
export function getPermissionCategories(): Array<{
  key: keyof UserPermissions;
  label: string;
  actions: Array<{ key: string; label: string }>;
}> {
  return [
    {
      key: 'properties',
      label: 'Properties',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'tasks',
      label: 'Maintenance Tasks',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'tickets',
      label: 'Tickets',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'leases',
      label: 'Leases',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'assets',
      label: 'Assets',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'inspections',
      label: 'Inspections',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'vendors',
      label: 'Vendors',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
      ],
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      actions: [
        { key: 'view', label: 'View Dashboard' },
        { key: 'analytics', label: 'View Analytics' },
      ],
    },
    {
      key: 'team',
      label: 'Team Management',
      actions: [
        { key: 'view', label: 'View Team' },
        { key: 'manage', label: 'Manage Team' },
      ],
    },
    {
      key: 'billing',
      label: 'Billing',
      actions: [
        { key: 'view', label: 'View Billing' },
        { key: 'manage', label: 'Manage Billing' },
      ],
    },
  ];
}
