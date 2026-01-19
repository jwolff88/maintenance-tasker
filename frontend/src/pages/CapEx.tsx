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
  PROPOSED: 'badge-gray',
  PENDING_APPROVAL: 'badge-yellow',
  APPROVED: 'badge-blue',
  IN_PROGRESS: 'badge-yellow',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
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
          <h1 className="text-2xl font-bold text-viridian">Capital Expenditures</h1>
          <p className="text-viridian/60">Track and manage major property investments</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="btn-primary"
        >
          + New CapEx
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Total Items ({filterYear})</p>
            <p className="text-2xl font-bold text-viridian mt-1">{stats.totalItems}</p>
          </div>
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Estimated Budget</p>
            <p className="text-2xl font-bold text-viridian mt-1">{formatCurrency(stats.totalEstimated)}</p>
          </div>
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Actual Spent</p>
            <p className="text-2xl font-bold text-teal mt-1">{formatCurrency(stats.totalActual)}</p>
          </div>
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Variance</p>
            <p className={`text-2xl font-bold mt-1 ${stats.variance > 0 ? 'text-red-400' : 'text-viridian'}`}>
              {formatCurrency(Math.abs(stats.variance))} {stats.variance > 0 ? 'over' : 'under'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 card-holo">
        <div>
          <label className="block text-sm font-medium text-viridian/80 font-orbitron">Budget Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="input mt-1"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-viridian/80 font-orbitron">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input mt-1"
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
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-holo w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-viridian font-orbitron">{editingId ? 'Edit' : 'New'} Capital Expenditure</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-viridian/80">Title *</label>
                <input
                  name="title"
                  required
                  className="input mt-1"
                  placeholder="e.g., Roof Replacement - Building A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80">Property *</label>
                <select name="propertyId" required className="input mt-1">
                  <option value="">Select property</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80">Category</label>
                  <select name="category" className="input mt-1">
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80">Budget Year</label>
                  <input
                    name="budgetYear"
                    type="number"
                    defaultValue={new Date().getFullYear()}
                    className="input mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80">Estimated Cost *</label>
                  <input
                    name="estimatedCost"
                    type="number"
                    step="0.01"
                    required
                    className="input mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80">Depreciation (years)</label>
                  <input
                    name="depreciationYears"
                    type="number"
                    className="input mt-1"
                    placeholder="e.g., 15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="input mt-1"
                  placeholder="Detailed description of the expenditure..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="input mt-1"
                  placeholder="Internal notes..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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
        <div className="text-center py-8 text-viridian/60">Loading...</div>
      ) : capexItems.length === 0 ? (
        <div className="text-center py-8 card-holo">
          <p className="text-viridian/60">No capital expenditures found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-viridian hover:underline"
          >
            Create your first CapEx item
          </button>
        </div>
      ) : (
        <div className="card-holo overflow-hidden p-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-viridian/20">
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Property</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Estimated</th>
                <th className="px-6 py-3 text-left">Actual</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capexItems.map((item: any) => (
                <tr key={item.id} className="border-b border-bronze/10 hover:bg-viridian/5">
                  <td className="px-6 py-4">
                    <div className="font-medium text-viridian">{item.title}</div>
                    {item.description && (
                      <div className="text-sm text-viridian/50 truncate max-w-xs">{item.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-viridian/70">
                    {item.property?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-viridian/70">
                    {item.category}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${STATUS_COLORS[item.status]}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-viridian">
                    {formatCurrency(Number(item.estimatedCost))}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-teal">
                    {item.actualCost ? formatCurrency(Number(item.actualCost)) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {item.status === 'PROPOSED' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: item.id, data: { status: 'APPROVED' } })}
                          className="text-viridian hover:text-viridian/80"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-red-400 hover:text-red-300"
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
