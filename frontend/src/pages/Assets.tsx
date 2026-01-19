import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { assetsApi, propertiesApi } from '../services/api';
import { Plus, Search, Cog, MapPin, QrCode, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const statusColors = {
  OPERATIONAL: 'badge-green',
  NEEDS_MAINTENANCE: 'badge-yellow',
  OUT_OF_SERVICE: 'badge-red',
  RETIRED: 'badge-gray',
};

const statusLabels = {
  OPERATIONAL: 'Operational',
  NEEDS_MAINTENANCE: 'Needs Maintenance',
  OUT_OF_SERVICE: 'Out of Service',
  RETIRED: 'Retired',
};

const statusIcons = {
  OPERATIONAL: CheckCircle,
  NEEDS_MAINTENANCE: AlertTriangle,
  OUT_OF_SERVICE: XCircle,
  RETIRED: XCircle,
};

const categoryLabels: Record<string, string> = {
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  MECHANICAL: 'Mechanical',
  SAFETY: 'Safety',
  STRUCTURAL: 'Structural',
  IT_EQUIPMENT: 'IT Equipment',
  VEHICLES: 'Vehicles',
  OTHER: 'Other',
};

export default function Assets() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'OTHER',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    notes: '',
    propertyId: '',
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', search, statusFilter, categoryFilter],
    queryFn: () =>
      assetsApi.getAll({ search, status: statusFilter, category: categoryFilter }).then((res) => res.data),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll({}).then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        category: 'OTHER',
        location: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        warrantyExpiry: '',
        notes: '',
        propertyId: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      propertyId: formData.propertyId || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-viridian">Assets</h1>
          <p className="text-viridian/60">Manage your equipment and machinery</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-viridian/40" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Status</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-viridian"></div>
        </div>
      ) : assets?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset: any) => {
            const StatusIcon = statusIcons[asset.status as keyof typeof statusIcons];
            return (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="card-holo hover:shadow-viridian transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-viridian/20 rounded-lg">
                    <Cog className="w-5 h-5 text-viridian" />
                  </div>
                  <span className={`badge ${statusColors[asset.status as keyof typeof statusColors]}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusLabels[asset.status as keyof typeof statusLabels]}
                  </span>
                </div>
                <h3 className="font-semibold text-viridian mb-1">{asset.name}</h3>
                <p className="text-sm text-viridian/50 mb-2">{categoryLabels[asset.category]}</p>
                {asset.location && (
                  <div className="flex items-center gap-1 text-sm text-viridian/60 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {asset.location}
                  </div>
                )}
                {asset.qrCode && (
                  <div className="flex items-center gap-1 text-xs text-viridian/40">
                    <QrCode className="w-3 h-3" />
                    {asset.qrCode}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-viridian/20">
                  <span className="text-viridian/50">
                    {asset._count.tasks} task{asset._count.tasks !== 1 ? 's' : ''}
                  </span>
                  {asset.property && (
                    <span className="text-viridian/50 truncate max-w-[150px]">
                      {asset.property.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 card-holo">
          <Cog className="w-12 h-12 text-viridian/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-viridian mb-2">No assets found</h3>
          <p className="text-viridian/60 mb-4">Get started by adding your first asset.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Asset
          </button>
        </div>
      )}

      {/* Add Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-holo max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-viridian font-orbitron">Add New Asset</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Generator 04"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Property
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="input"
                  >
                    <option value="">No property</option>
                    {properties?.map((prop: any) => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating...' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
