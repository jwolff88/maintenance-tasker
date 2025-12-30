import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leasesApi, propertiesApi } from '../services/api';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const statusColors = {
  ACTIVE: 'badge-green',
  EXPIRED: 'badge-red',
  TERMINATED: 'badge-gray',
  PENDING: 'badge-yellow',
};

export default function Leases() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    depositAmount: '',
    terms: '',
    tenantData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  const { data: leases, isLoading } = useQuery({
    queryKey: ['leases', statusFilter],
    queryFn: () => leasesApi.getAll({ status: statusFilter }).then((res) => res.data),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: leasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setShowModal(false);
      setFormData({
        propertyId: '',
        startDate: '',
        endDate: '',
        rentAmount: '',
        depositAmount: '',
        terms: '',
        tenantData: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        },
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      rentAmount: parseFloat(formData.rentAmount),
      depositAmount: parseFloat(formData.depositAmount),
    });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-600">Manage property leases and tenants</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Lease
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-48"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="EXPIRED">Expired</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Leases List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : leases?.length > 0 ? (
        <div className="space-y-3">
          {leases.map((lease: any) => {
            const daysUntil = getDaysUntilExpiry(lease.endDate);
            const isExpiringSoon = lease.status === 'ACTIVE' && daysUntil <= 30 && daysUntil > 0;

            return (
              <div
                key={lease.id}
                className={`card ${isExpiringSoon ? 'border-yellow-300 border-2' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${statusColors[lease.status as keyof typeof statusColors]}`}>
                        {lease.status}
                      </span>
                      {isExpiringSoon && (
                        <span className="badge badge-yellow">
                          Expires in {daysUntil} days
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {lease.tenant.firstName} {lease.tenant.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{lease.property.name}</p>
                    <p className="text-sm text-gray-500">{lease.property.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${Number(lease.rentAmount).toLocaleString()}/mo
                    </p>
                    <p className="text-sm text-gray-500">
                      Deposit: ${Number(lease.depositAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                  </div>
                  {lease.tenant.email && (
                    <div>{lease.tenant.email}</div>
                  )}
                  {lease.tenant.phone && (
                    <div>{lease.tenant.phone}</div>
                  )}
                </div>
                {lease.terms && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Special Terms:</p>
                    {lease.terms}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
          <p className="text-gray-600 mb-4">Create your first lease agreement.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            New Lease
          </button>
        </div>
      )}

      {/* Create Lease Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Create New Lease</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property *
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select property</option>
                    {properties?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Tenant Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.tenantData.firstName}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantData: { ...formData.tenantData, firstName: e.target.value }
                        })}
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
                        value={formData.tenantData.lastName}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantData: { ...formData.tenantData, lastName: e.target.value }
                        })}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.tenantData.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantData: { ...formData.tenantData, email: e.target.value }
                        })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.tenantData.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          tenantData: { ...formData.tenantData, phone: e.target.value }
                        })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Lease Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Rent *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.rentAmount}
                        onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Deposit *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Terms
                    </label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Any special lease terms or conditions..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'Creating...' : 'Create Lease'}
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
