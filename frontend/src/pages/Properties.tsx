import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { propertiesApi } from '../services/api';
import { Plus, Search, Building2, MapPin, Users } from 'lucide-react';

const statusColors = {
  HEALTHY: 'badge-green',
  ATTENTION_NEEDED: 'badge-yellow',
  CRITICAL: 'badge-red',
};

const statusLabels = {
  HEALTHY: 'Healthy',
  ATTENTION_NEEDED: 'Attention Needed',
  CRITICAL: 'Critical',
};

export default function Properties() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'SINGLE_FAMILY',
    units: 1,
    sqft: '',
    yearBuilt: '',
  });

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', search, statusFilter],
    queryFn: () =>
      propertiesApi.getAll({ search, status: statusFilter }).then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: propertiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowModal(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        type: 'SINGLE_FAMILY',
        units: 1,
        sqft: '',
        yearBuilt: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      units: Number(formData.units),
      sqft: formData.sqft ? Number(formData.sqft) : null,
      yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your rental properties</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties..."
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
          <option value="HEALTHY">Healthy</option>
          <option value="ATTENTION_NEEDED">Attention Needed</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : properties?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property: any) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <span className={`badge ${statusColors[property.status as keyof typeof statusColors]}`}>
                  {statusLabels[property.status as keyof typeof statusLabels]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{property.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {property.address}, {property.city}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  {property.units} unit{property.units > 1 ? 's' : ''}
                </div>
                <div className="text-gray-500">
                  {property._count.tickets} ticket{property._count.tickets !== 1 ? 's' : ''}
                </div>
              </div>
              {property.riskScore > 50 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Risk Score</span>
                    <span className={`font-medium ${
                      property.riskScore >= 70 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {property.riskScore}/100
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first property.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Property
          </button>
        </div>
      )}

      {/* Add Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Add New Property</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input"
                    >
                      <option value="SINGLE_FAMILY">Single Family</option>
                      <option value="MULTI_FAMILY">Multi Family</option>
                      <option value="APARTMENT">Apartment</option>
                      <option value="CONDO">Condo</option>
                      <option value="TOWNHOUSE">Townhouse</option>
                      <option value="COMMERCIAL">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Units
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.units}
                      onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Square Feet
                    </label>
                    <input
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year Built
                    </label>
                    <input
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'Creating...' : 'Create Property'}
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
