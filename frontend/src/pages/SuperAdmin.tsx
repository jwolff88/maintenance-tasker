import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { format } from 'date-fns';
import {
  Building2, Users, DollarSign, Activity, Shield, Search,
  MoreVertical, Gift, Trash2, UserCheck, Eye, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

const superAdminApi = {
  getStats: () => api.get('/super-admin/stats'),
  getCompanies: (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/super-admin/companies${queryString}`);
  },
  getCompany: (id: string) => api.get(`/super-admin/companies/${id}`),
  updateCompany: (id: string, data: any) => api.patch(`/super-admin/companies/${id}`, data),
  grantAccess: (id: string, data: any) => api.post(`/super-admin/companies/${id}/grant-access`, data),
  deleteCompany: (id: string) => api.delete(`/super-admin/companies/${id}`),
  getUsers: (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/super-admin/users${queryString}`);
  },
  updateUser: (id: string, data: any) => api.patch(`/super-admin/users/${id}`, data),
  impersonateUser: (id: string) => api.post(`/super-admin/users/${id}/impersonate`),
  deleteUser: (id: string) => api.delete(`/super-admin/users/${id}`),
  getActivity: () => api.get('/super-admin/activity'),
};

export default function SuperAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'activity'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({ plan: 'ENTERPRISE', months: 12 });

  // Redirect if not super admin
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Super Admin privileges required</p>
        </div>
      </div>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => superAdminApi.getStats().then(res => res.data),
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['super-admin-companies', searchTerm],
    queryFn: () => superAdminApi.getCompanies(searchTerm ? { search: searchTerm } : undefined).then(res => res.data),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['super-admin-users', searchTerm],
    queryFn: () => superAdminApi.getUsers(searchTerm ? { search: searchTerm } : undefined).then(res => res.data),
  });

  const { data: activity } = useQuery({
    queryKey: ['super-admin-activity'],
    queryFn: () => superAdminApi.getActivity().then(res => res.data),
  });

  const grantAccessMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => superAdminApi.grantAccess(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
      setShowGrantModal(false);
      setSelectedCompany(null);
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => superAdminApi.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.impersonateUser(id),
    onSuccess: (response) => {
      const { token, user: impersonatedUser } = response.data;
      // Store original token
      const originalToken = localStorage.getItem('token');
      localStorage.setItem('originalToken', originalToken || '');
      localStorage.setItem('token', token);
      localStorage.setItem('impersonating', JSON.stringify(impersonatedUser));
      window.location.href = '/';
    },
  });

  const planColors: Record<string, string> = {
    TRIAL: 'bg-gray-100 text-gray-800',
    STARTER: 'bg-blue-100 text-blue-800',
    PRO: 'bg-purple-100 text-purple-800',
    ENTERPRISE: 'bg-green-100 text-green-800',
  };

  const statusColors: Record<string, string> = {
    TRIALING: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    PAST_DUE: 'bg-red-100 text-red-800',
    CANCELED: 'bg-gray-100 text-gray-800',
    UNPAID: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600">Platform-wide management and control</p>
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Building2 className="w-8 h-8 opacity-80" />
            <p className="text-3xl font-bold mt-2">{stats.totalCompanies}</p>
            <p className="text-sm opacity-80">Companies</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <Users className="w-8 h-8 opacity-80" />
            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
            <p className="text-sm opacity-80">Users</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <Building2 className="w-8 h-8 opacity-80" />
            <p className="text-3xl font-bold mt-2">{stats.totalProperties}</p>
            <p className="text-sm opacity-80">Properties</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <Activity className="w-8 h-8 opacity-80" />
            <p className="text-3xl font-bold mt-2">{stats.totalTickets}</p>
            <p className="text-sm opacity-80">Tickets</p>
          </div>
          <div className="card bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <p className="text-3xl font-bold mt-2">{stats.totalTasks}</p>
            <p className="text-sm opacity-80">Tasks</p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <DollarSign className="w-8 h-8 opacity-80" />
            <p className="text-3xl font-bold mt-2">${stats.mrr}</p>
            <p className="text-sm opacity-80">MRR</p>
          </div>
        </div>
      )}

      {/* Plan Distribution */}
      {stats?.companiesByPlan && (
        <div className="card">
          <h3 className="font-semibold mb-4">Subscription Distribution</h3>
          <div className="flex gap-4 flex-wrap">
            {stats.companiesByPlan.map((item: any) => (
              <div key={item.plan} className="flex items-center gap-2">
                <span className={`badge ${planColors[item.plan]}`}>{item.plan}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {(['overview', 'companies', 'users', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {(activeTab === 'companies' || activeTab === 'users') && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Signups */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Recent Signups
            </h3>
            <div className="space-y-3">
              {stats.recentSignups?.map((company: any) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-500">{company.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${planColors[company.plan]}`}>{company.plan}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(company.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('companies')}
                className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors"
              >
                <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium">Manage Companies</p>
                <p className="text-sm text-gray-500">View and edit all companies</p>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors"
              >
                <Users className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-gray-500">View and edit all users</p>
              </button>
              <button
                onClick={() => queryClient.invalidateQueries()}
                className="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors"
              >
                <RefreshCw className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium">Refresh Data</p>
                <p className="text-sm text-gray-500">Reload all statistics</p>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className="p-4 bg-orange-50 rounded-lg text-left hover:bg-orange-100 transition-colors"
              >
                <Activity className="w-6 h-6 text-orange-600 mb-2" />
                <p className="font-medium">View Activity</p>
                <p className="text-sm text-gray-500">Recent platform activity</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companiesLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : companies?.map((company: any) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-500">{company.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${planColors[company.plan]}`}>{company.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${statusColors[company.subscriptionStatus]}`}>
                      {company.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {company._count.users} users, {company._count.properties} properties
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(company.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowGrantModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Grant Access"
                      >
                        <Gift className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${company.name}? This cannot be undone.`)) {
                            deleteCompanyMutation.mutate(company.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{u.company?.name}</p>
                    <span className={`badge text-xs ${planColors[u.company?.plan]}`}>
                      {u.company?.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge bg-gray-100 text-gray-800">{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    {u.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => impersonateMutation.mutate(u.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Impersonate User"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && activity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div className="card">
            <h3 className="font-semibold mb-4">Recent Users</h3>
            <div className="space-y-3">
              {activity.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">{u.company?.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(u.createdAt), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="card">
            <h3 className="font-semibold mb-4">Recent Tickets</h3>
            <div className="space-y-3">
              {activity.recentTickets?.map((t: any) => (
                <div key={t.id} className="p-2 hover:bg-gray-50 rounded">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${
                      t.priority === 'URGENT' ? 'badge-red' :
                      t.priority === 'HIGH' ? 'badge-yellow' : 'badge-gray'
                    }`}>{t.priority}</span>
                    <span className="text-xs text-gray-500">{t.property?.company?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <h3 className="font-semibold mb-4">Recent Tasks</h3>
            <div className="space-y-3">
              {activity.recentTasks?.map((t: any) => (
                <div key={t.id} className="p-2 hover:bg-gray-50 rounded">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${
                      t.status === 'COMPLETED' ? 'badge-green' :
                      t.status === 'IN_PROGRESS' ? 'badge-yellow' : 'badge-gray'
                    }`}>{t.status}</span>
                    <span className="text-xs text-gray-500">{t.company?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrantModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Grant Access to {selectedCompany.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={grantForm.plan}
                  onChange={(e) => setGrantForm({ ...grantForm, plan: e.target.value })}
                  className="input w-full"
                >
                  <option value="STARTER">Starter ($49/mo)</option>
                  <option value="PRO">Professional ($149/mo)</option>
                  <option value="ENTERPRISE">Enterprise ($349/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                <input
                  type="number"
                  value={grantForm.months}
                  onChange={(e) => setGrantForm({ ...grantForm, months: parseInt(e.target.value) })}
                  className="input w-full"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedCompany(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => grantAccessMutation.mutate({
                  id: selectedCompany.id,
                  data: grantForm,
                })}
                disabled={grantAccessMutation.isPending}
                className="btn-primary flex-1"
              >
                {grantAccessMutation.isPending ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
