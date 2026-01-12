import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { capexApi, propertiesApi } from '../services/api';

const CATEGORIES = [
  'ROOF', 'HVAC', 'PLUMBING', 'ELECTRICAL', 'STRUCTURAL',
  'APPLIANCES', 'FLOORING', 'EXTERIOR', 'LANDSCAPING', 'RENOVATION', 'OTHER'
];

const STATUSES = [
  'PROPOSED', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
];

const STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CapEx() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const { data: capexItems = [], isLoading } = useQuery({
    queryKey: ['capex', filterStatus, filterYear],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterYear) params.budgetYear = filterYear;
      return capexApi.getAll(params).then(res => res.data);
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll().then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['capex-stats', filterYear],
    queryFn: () => capexApi.getStats(parseInt(filterYear)).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => capexApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
      queryClient.invalidateQueries({ queryKey: ['capex-stats'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => capexApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
      queryClient.invalidateQueries({ queryKey: ['capex-stats'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => capexApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
      queryClient.invalidateQueries({ queryKey: ['capex-stats'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      propertyId: formData.get('propertyId'),
      estimatedCost: parseFloat(formData.get('estimatedCost') as string),
      budgetYear: parseInt(formData.get('budgetYear') as string),
      depreciationYears: formData.get('depreciationYears') ? parseInt(formData.get('depreciationYears') as string) : null,
      notes: formData.get('notes'),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Capital Expenditures</h1>
          <p className="text-gray-600">Track and manage major property investments</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New CapEx
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Items ({filterYear})</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Estimated Budget</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalEstimated)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Actual Spent</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalActual)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Variance</p>
            <p className={`text-2xl font-bold ${stats.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(stats.variance))} {stats.variance > 0 ? 'over' : 'under'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Budget Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="mt-1 border rounded-md px-3 py-2"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 border rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'New'} Capital Expenditure</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  name="title"
                  required
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Roof Replacement - Building A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property *</label>
                <select name="propertyId" required className="mt-1 w-full border rounded-md px-3 py-2">
                  <option value="">Select property</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select name="category" className="mt-1 w-full border rounded-md px-3 py-2">
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Year</label>
                  <input
                    name="budgetYear"
                    type="number"
                    defaultValue={new Date().getFullYear()}
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Cost *</label>
                  <input
                    name="estimatedCost"
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Depreciation (years)</label>
                  <input
                    name="depreciationYears"
                    type="number"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="e.g., 15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  placeholder="Detailed description of the expenditure..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  placeholder="Internal notes..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : capexItems.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No capital expenditures found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-blue-600 hover:underline"
          >
            Create your first CapEx item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {capexItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.property?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatCurrency(Number(item.estimatedCost))}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {item.actualCost ? formatCurrency(Number(item.actualCost)) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {item.status === 'PROPOSED' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: item.id, data: { status: 'APPROVED' } })}
                          className="text-green-600 hover:underline"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
