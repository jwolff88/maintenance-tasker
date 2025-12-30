import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../services/api';
import { Building2, Users, Plus, User } from 'lucide-react';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  PROPERTY_MANAGER: 'Property Manager',
  MAINTENANCE_STAFF: 'Maintenance Staff',
  VENDOR: 'Vendor',
  READ_ONLY: 'Read Only',
};

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUserModal, setShowUserModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'PROPERTY_MANAGER',
    phone: '',
  });

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get().then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['company-users'],
    queryFn: () => companyApi.getUsers().then((res) => res.data),
    enabled: user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and company settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold">Company</h2>
            </div>
            {company && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{company.email}</p>
                </div>
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{company._count?.properties || 0}</p>
                      <p className="text-xs text-gray-500">Properties</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{company._count?.users || 0}</p>
                      <p className="text-xs text-gray-500">Users</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{company._count?.vendors || 0}</p>
                      <p className="text-xs text-gray-500">Vendors</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current User */}
          <div className="card mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Your Profile</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        {isAdmin && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold">Team Members</h2>
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
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Role</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-3 px-2">
                            <p className="font-medium">{u.firstName} {u.lastName}</p>
                          </td>
                          <td className="py-3 px-2 text-gray-600">{u.email}</td>
                          <td className="py-3 px-2">
                            <span className="badge badge-blue">{roleLabels[u.role] || u.role}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No team members yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Add Team Member</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
        </div>
      )}
    </div>
  );
}
