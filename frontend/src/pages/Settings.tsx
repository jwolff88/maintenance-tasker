import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyApi, billingApi } from '../services/api';
import { Building2, Users, Plus, User, CreditCard, AlertTriangle, Check, ExternalLink, Shield, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  PROPERTY_MANAGER: 'Property Manager',
  MAINTENANCE_STAFF: 'Maintenance Staff',
  VENDOR: 'Vendor',
  READ_ONLY: 'Read Only',
};

const planLabels: Record<string, string> = {
  TRIAL: 'Free Trial',
  STARTER: 'Starter',
  PRO: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const statusColors: Record<string, string> = {
  TRIALING: 'badge-blue',
  ACTIVE: 'badge-green',
  PAST_DUE: 'badge-red',
  CANCELED: 'badge-gray',
  UNPAID: 'badge-red',
};

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showUserModal, setShowUserModal] = useState(false);
  const [billingMessage, setBillingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'PROPERTY_MANAGER',
    phone: '',
  });
  const [permissionsModal, setPermissionsModal] = useState<{ userId: string; userName: string } | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<any>(null);

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  // Handle billing callback messages
  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      setBillingMessage({ type: 'success', text: 'Subscription activated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else if (billing === 'canceled') {
      setBillingMessage({ type: 'error', text: 'Checkout was canceled.' });
    }
  }, [searchParams, queryClient]);

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get().then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['company-users'],
    queryFn: () => companyApi.getUsers().then((res) => res.data),
    enabled: user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN',
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((res) => res.data),
  });

  const { data: permissionCategories } = useQuery({
    queryKey: ['permission-categories'],
    queryFn: () => companyApi.getPermissionCategories().then((res) => res.data),
    enabled: isAdmin,
  });

  const { data: userPermissionsData } = useQuery({
    queryKey: ['user-permissions', permissionsModal?.userId],
    queryFn: () => permissionsModal?.userId
      ? companyApi.getUserPermissions(permissionsModal.userId).then((res) => res.data)
      : null,
    enabled: !!permissionsModal?.userId,
  });

  // Initialize editing permissions when modal opens
  useEffect(() => {
    if (userPermissionsData) {
      setEditingPermissions(userPermissionsData.effectivePermissions);
    }
  }, [userPermissionsData]);

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: any }) =>
      companyApi.updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      setPermissionsModal(null);
      setEditingPermissions(null);
    },
  });

  const resetPermissionsMutation = useMutation({
    mutationFn: (userId: string) => companyApi.resetUserPermissions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      setPermissionsModal(null);
      setEditingPermissions(null);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: companyApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      setShowUserModal(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'PROPERTY_MANAGER',
        phone: '',
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => billingApi.createPortal(),
    onSuccess: (data) => {
      if (data.data.url) {
        window.location.href = data.data.url;
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handlePermissionToggle = (category: string, action: string) => {
    if (!editingPermissions) return;
    setEditingPermissions({
      ...editingPermissions,
      [category]: {
        ...editingPermissions[category],
        [action]: !editingPermissions[category]?.[action],
      },
    });
  };

  const handleSavePermissions = () => {
    if (!permissionsModal || !editingPermissions) return;
    updatePermissionsMutation.mutate({
      userId: permissionsModal.userId,
      permissions: editingPermissions,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-viridian">Settings</h1>
        <p className="text-viridian/60">Manage your account and company settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-1">
          <div className="card-holo">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-viridian/20 rounded-lg">
                <Building2 className="w-5 h-5 text-viridian" />
              </div>
              <h2 className="text-lg font-semibold text-viridian font-orbitron">Company</h2>
            </div>
            {company && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-viridian/50">Name</p>
                  <p className="font-medium text-viridian">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-viridian/50">Email</p>
                  <p className="font-medium text-viridian">{company.email}</p>
                </div>
                <div className="pt-3 border-t border-viridian/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-viridian">{company._count?.properties || 0}</p>
                      <p className="text-xs text-viridian/50">Properties</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-viridian">{company._count?.users || 0}</p>
                      <p className="text-xs text-viridian/50">Users</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-viridian">{company._count?.vendors || 0}</p>
                      <p className="text-xs text-viridian/50">Vendors</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current User */}
          <div className="card-holo mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal/20 rounded-lg">
                <User className="w-5 h-5 text-teal" />
              </div>
              <h2 className="text-lg font-semibold text-viridian font-orbitron">Your Profile</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-viridian/50">Name</p>
                <p className="font-medium text-viridian">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Email</p>
                <p className="font-medium text-viridian">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Role</p>
                <p className="font-medium text-viridian">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
            </div>
          </div>

          {/* Billing / Subscription */}
          {isAdmin && (
            <div className="card-holo mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-bronze/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-bronze" />
                </div>
                <h2 className="text-lg font-semibold text-viridian font-orbitron">Billing & Subscription</h2>
              </div>

              {billingMessage && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  billingMessage.type === 'success' ? 'bg-viridian/10 text-viridian border border-viridian/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {billingMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {billingMessage.text}
                </div>
              )}

              {subscription && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-viridian/50">Current Plan</p>
                      <p className="font-semibold text-lg text-viridian">{planLabels[subscription.plan] || subscription.plan}</p>
                    </div>
                    <span className={`badge ${statusColors[subscription.status] || 'badge-gray'}`}>
                      {subscription.status}
                    </span>
                  </div>

                  {subscription.plan === 'TRIAL' && subscription.trialEndsAt && (
                    <div className="p-3 bg-bronze/10 border border-bronze/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-bronze">Trial ends {format(new Date(subscription.trialEndsAt), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-viridian/60">Upgrade now to keep your data and continue using all features.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscription.status === 'PAST_DUE' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-400">Payment failed</p>
                          <p className="text-sm text-viridian/60">Please update your payment method to avoid service interruption.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Usage */}
                  <div className="pt-3 border-t border-viridian/20">
                    <p className="text-sm font-medium text-viridian/70 mb-2">Usage</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-viridian/60">Properties</span>
                        <span className="font-medium text-viridian">
                          {subscription.usage?.properties || 0}
                          {subscription.limits?.properties !== -1 && ` / ${subscription.limits?.properties}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-viridian/60">Team Members</span>
                        <span className="font-medium text-viridian">
                          {subscription.usage?.users || 0}
                          {subscription.limits?.users !== -1 && ` / ${subscription.limits?.users}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-3">
                    {subscription.plan === 'TRIAL' || subscription.status === 'CANCELED' ? (
                      <Link to="/pricing" className="btn-primary text-center flex items-center justify-center gap-2">
                        View Plans & Upgrade
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => portalMutation.mutate()}
                          disabled={portalMutation.isPending}
                          className="btn-secondary flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          {portalMutation.isPending ? 'Loading...' : 'Manage Subscription'}
                        </button>
                        <Link to="/pricing" className="text-sm text-center text-viridian hover:text-viridian/80">
                          View all plans
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Team Members */}
        {isAdmin && (
          <div className="lg:col-span-2">
            <div className="card-holo">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal/20 rounded-lg">
                    <Users className="w-5 h-5 text-teal" />
                  </div>
                  <h2 className="text-lg font-semibold text-viridian font-orbitron">Team Members</h2>
                </div>
                <button onClick={() => setShowUserModal(true)} className="btn-primary text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              {users?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-viridian/20">
                        <th className="text-left py-3 px-2 text-sm font-medium text-viridian/70">Name</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-viridian/70">Email</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-viridian/70">Role</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-viridian/70">Status</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-viridian/70">Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b border-viridian/10 last:border-0">
                          <td className="py-3 px-2">
                            <p className="font-medium text-viridian">{u.firstName} {u.lastName}</p>
                          </td>
                          <td className="py-3 px-2 text-viridian/60">{u.email}</td>
                          <td className="py-3 px-2">
                            <span className="badge badge-blue">{roleLabels[u.role] || u.role}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {u.id !== user?.id && u.role !== 'SUPER_ADMIN' ? (
                              <button
                                onClick={() => setPermissionsModal({ userId: u.id, userName: `${u.firstName} ${u.lastName}` })}
                                className="flex items-center gap-1 text-sm text-viridian hover:text-viridian/80"
                              >
                                <Shield className="w-4 h-4" />
                                {u.hasCustomPermissions ? 'Custom' : 'Default'}
                              </button>
                            ) : (
                              <span className="text-sm text-viridian/40">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-viridian/50 py-8">No team members yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-holo max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-6 text-viridian font-orbitron">Add Team Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                  >
                    <option value="PROPERTY_MANAGER">Property Manager</option>
                    <option value="MAINTENANCE_STAFF">Maintenance Staff</option>
                    <option value="READ_ONLY">Read Only</option>
                    {user?.role === 'SUPER_ADMIN' && (
                      <option value="COMPANY_ADMIN">Company Admin</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={createUserMutation.isPending} className="btn-primary flex-1">
                  {createUserMutation.isPending ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsModal && (
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-holo max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="pb-4 border-b border-viridian/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-viridian font-orbitron">Manage Permissions</h2>
                  <p className="text-viridian/60 text-sm mt-1">
                    Customize access for {permissionsModal.userName}
                  </p>
                </div>
                {userPermissionsData?.hasCustomPermissions && (
                  <button
                    onClick={() => resetPermissionsMutation.mutate(permissionsModal.userId)}
                    disabled={resetPermissionsMutation.isPending}
                    className="flex items-center gap-1 text-sm text-viridian/60 hover:text-viridian"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Default
                  </button>
                )}
              </div>
              {userPermissionsData && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-viridian/50">Base role:</span>
                  <span className="badge badge-blue text-xs">{roleLabels[userPermissionsData.role]}</span>
                  {userPermissionsData.hasCustomPermissions && (
                    <span className="badge badge-yellow text-xs">Custom Overrides</span>
                  )}
                </div>
              )}
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              {permissionCategories && editingPermissions ? (
                <div className="space-y-6">
                  {permissionCategories.map((category: any) => (
                    <div key={category.key} className="border border-viridian/20 rounded-lg p-4">
                      <h3 className="font-medium text-viridian mb-3">{category.label}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {category.actions.map((action: any) => {
                          const isEnabled = editingPermissions[category.key]?.[action.key];
                          const defaultValue = userPermissionsData?.roleDefaults?.[category.key]?.[action.key];
                          const isOverridden = isEnabled !== defaultValue;

                          return (
                            <label
                              key={action.key}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                isEnabled ? 'bg-viridian/10' : 'bg-viridian/5'
                              } ${isOverridden ? 'ring-2 ring-bronze/50' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled || false}
                                onChange={() => handlePermissionToggle(category.key, action.key)}
                                className="rounded border-viridian/30 accent-viridian"
                              />
                              <span className="text-sm text-viridian">{action.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-viridian"></div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-viridian/20 flex-shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPermissionsModal(null);
                  setEditingPermissions(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="btn-primary flex-1"
              >
                {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
