import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '../services/api';
import { Plus, Users, Star, Phone, Mail, Shield } from 'lucide-react';
import { format } from 'date-fns';

const specialtyOptions = [
  'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
  'pest_control', 'landscaping', 'cleaning', 'roofing', 'painting'
];

export default function Vendors() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    licenseNumber: '',
    insuranceExpiry: '',
  });

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: vendorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        licenseNumber: '',
        insuranceExpiry: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage contractors and service providers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : vendors?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor: any) => (
            <div key={vendor.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{Number(vendor.rating).toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({vendor.totalJobs})</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{vendor.name}</h3>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {vendor.email}
                </div>
                {vendor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </div>
                )}
                {vendor.licenseNumber && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    License: {vendor.licenseNumber}
                  </div>
                )}
              </div>

              {vendor.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {vendor.specialties.map((s: string) => (
                    <span key={s} className="badge badge-blue">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t text-sm text-gray-500">
                {vendor._count.tickets} job{vendor._count.tickets !== 1 ? 's' : ''} completed
                {vendor.insuranceExpiry && (
                  <span className="ml-2">
                    • Insurance expires {format(new Date(vendor.insuranceExpiry), 'MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors yet</h3>
          <p className="text-gray-600 mb-4">Add your first vendor or contractor.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Vendor
          </button>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Add New Vendor</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Contractor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          formData.specialties.includes(s)
                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.insuranceExpiry}
                      onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'Adding...' : 'Add Vendor'}
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
