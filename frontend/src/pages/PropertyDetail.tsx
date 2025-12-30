import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi, notesApi, equipmentApi } from '../services/api';
import {
  Building2, MapPin, Users, Calendar, Wrench, FileText,
  Plus, AlertTriangle, Clock, ChevronRight, Cog, AlertCircle, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const noteTypes = [
  { value: 'PROPERTY', label: 'Property Notes' },
  { value: 'TENANT', label: 'Tenant Notes' },
  { value: 'BUILDING', label: 'Building Notes' },
  { value: 'OWNER', label: 'Owner Notes' },
];

const statusColors = {
  HEALTHY: 'bg-green-100 text-green-800',
  ATTENTION_NEEDED: 'bg-yellow-100 text-yellow-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const equipmentTypes = ['HVAC', 'Water Heater', 'Electrical Panel', 'Roof', 'Plumbing', 'Appliance', 'Fire Safety', 'Other'];

export default function PropertyDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeNoteType, setActiveNoteType] = useState('PROPERTY');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '', type: 'HVAC', manufacturer: '', model: '', serialNumber: '',
    installDate: '', warrantyExpiry: '', nextServiceDate: '', expectedLifespan: '', notes: ''
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id!).then((res) => res.data),
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', id, activeNoteType],
    queryFn: () => notesApi.getByProperty(id!, activeNoteType).then((res) => res.data),
    enabled: !!id,
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getByProperty(id!).then((res) => res.data),
    enabled: !!id,
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: any) => notesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      setShowNoteModal(false);
      setNoteContent('');
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: (data: any) => equipmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setShowEquipmentModal(false);
      setEquipmentForm({
        name: '', type: 'HVAC', manufacturer: '', model: '', serialNumber: '',
        installDate: '', warrantyExpiry: '', nextServiceDate: '', expectedLifespan: '', notes: ''
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (equipId: string) => equipmentApi.delete(equipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return <div className="text-center py-12">Property not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/properties" className="hover:text-primary-600">Properties</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{property.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </div>
        </div>
        <span className={`badge ${statusColors[property.status as keyof typeof statusColors]}`}>
          {property.status.replace('_', ' ')}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{property.units}</p>
              <p className="text-sm text-gray-600">Units</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{property.leases?.length || 0}</p>
              <p className="text-sm text-gray-600">Active Leases</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{property.tickets?.length || 0}</p>
              <p className="text-sm text-gray-600">Open Tickets</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{property.riskScore}</p>
              <p className="text-sm text-gray-600">Risk Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{property.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Square Feet</p>
                <p className="font-medium">{property.sqft?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year Built</p>
                <p className="font-medium">{property.yearBuilt || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupancy</p>
                <p className="font-medium">{property.occupancy} / {property.units}</p>
              </div>
              {property.manager && (
                <div>
                  <p className="text-sm text-gray-500">Property Manager</p>
                  <p className="font-medium">{property.manager.firstName} {property.manager.lastName}</p>
                </div>
              )}
              {property.owner && (
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">{property.owner.firstName} {property.owner.lastName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notes</h2>
              <button onClick={() => setShowNoteModal(true)} className="btn-primary text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {/* Note Type Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {noteTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setActiveNoteType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activeNoteType === type.value
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Notes List */}
            {notes?.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note: any) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <span>{note.author.firstName} {note.author.lastName}</span>
                      <span>•</span>
                      <span>{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      {note.isInternal && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600">Internal</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No notes yet</p>
            )}
          </div>

          {/* Equipment Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Equipment & Systems</h2>
              <button onClick={() => setShowEquipmentModal(true)} className="btn-primary text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Equipment
              </button>
            </div>

            {equipment?.length > 0 ? (
              <div className="space-y-3">
                {equipment.map((item: any) => {
                  const now = new Date();
                  const warrantyExpired = item.warrantyExpiry && new Date(item.warrantyExpiry) < now;
                  const serviceOverdue = item.nextServiceDate && new Date(item.nextServiceDate) < now;

                  return (
                    <div key={item.id} className={`p-4 rounded-lg border ${
                      serviceOverdue ? 'border-red-300 bg-red-50' :
                      warrantyExpired ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            serviceOverdue ? 'bg-red-100' :
                            warrantyExpired ? 'bg-yellow-100' :
                            'bg-blue-100'
                          }`}>
                            <Cog className={`w-5 h-5 ${
                              serviceOverdue ? 'text-red-600' :
                              warrantyExpired ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.type}</p>
                            {item.manufacturer && (
                              <p className="text-sm text-gray-500">{item.manufacturer} {item.model}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEquipmentMutation.mutate(item.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        {item.installDate && (
                          <div>
                            <span className="text-gray-500">Installed: </span>
                            <span>{format(new Date(item.installDate), 'MMM yyyy')}</span>
                          </div>
                        )}
                        {item.warrantyExpiry && (
                          <div className={warrantyExpired ? 'text-yellow-700' : ''}>
                            <span className="text-gray-500">Warranty: </span>
                            <span>{format(new Date(item.warrantyExpiry), 'MMM yyyy')}</span>
                            {warrantyExpired && <AlertCircle className="w-3 h-3 inline ml-1" />}
                          </div>
                        )}
                        {item.nextServiceDate && (
                          <div className={serviceOverdue ? 'text-red-700 font-medium' : ''}>
                            <span className="text-gray-500">Next Service: </span>
                            <span>{format(new Date(item.nextServiceDate), 'MMM d, yyyy')}</span>
                            {serviceOverdue && <span className="ml-1">(Overdue!)</span>}
                          </div>
                        )}
                        {item.expectedLifespan && (
                          <div>
                            <span className="text-gray-500">Lifespan: </span>
                            <span>{item.expectedLifespan} years</span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">{item.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No equipment tracked yet</p>
            )}
          </div>
        </div>

        {/* Right Column - Tickets, Leases, Events */}
        <div className="space-y-6">
          {/* Open Tickets */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Open Tickets</h3>
              <Link to={`/tickets?propertyId=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            {property.tickets?.length > 0 ? (
              <div className="space-y-2">
                {property.tickets.slice(0, 5).map((ticket: any) => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <p className="font-medium text-sm">{ticket.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${
                        ticket.priority === 'URGENT' ? 'badge-red' :
                        ticket.priority === 'HIGH' ? 'badge-yellow' : 'badge-gray'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500">{ticket.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No open tickets</p>
            )}
          </div>

          {/* Active Leases */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Active Leases</h3>
              <Link to={`/leases?propertyId=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            {property.leases?.length > 0 ? (
              <div className="space-y-2">
                {property.leases.map((lease: any) => (
                  <div key={lease.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">
                      {lease.tenant.firstName} {lease.tenant.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {format(new Date(lease.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No active leases</p>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <h3 className="font-semibold mb-4">Upcoming Events</h3>
            {property.events?.length > 0 ? (
              <div className="space-y-2">
                {property.events.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add Note</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createNoteMutation.mutate({
                    propertyId: id,
                    content: noteContent,
                    type: activeNoteType,
                  });
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Type
                  </label>
                  <select
                    value={activeNoteType}
                    onChange={(e) => setActiveNoteType(e.target.value)}
                    className="input"
                  >
                    {noteTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="input min-h-[120px]"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createNoteMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add Equipment</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createEquipmentMutation.mutate({
                    propertyId: id,
                    ...equipmentForm,
                    expectedLifespan: equipmentForm.expectedLifespan ? parseInt(equipmentForm.expectedLifespan) : null,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                      className="input"
                      placeholder="e.g., Main HVAC Unit"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={equipmentForm.type}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })}
                      className="input"
                    >
                      {equipmentTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={equipmentForm.manufacturer}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={equipmentForm.model}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={equipmentForm.serialNumber}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, serialNumber: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Install Date</label>
                    <input
                      type="date"
                      value={equipmentForm.installDate}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, installDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                    <input
                      type="date"
                      value={equipmentForm.warrantyExpiry}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, warrantyExpiry: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Date</label>
                    <input
                      type="date"
                      value={equipmentForm.nextServiceDate}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, nextServiceDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Lifespan (years)</label>
                    <input
                      type="number"
                      value={equipmentForm.expectedLifespan}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, expectedLifespan: e.target.value })}
                      className="input"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={equipmentForm.notes}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                    className="input min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEquipmentModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createEquipmentMutation.isPending} className="btn-primary flex-1">
                    {createEquipmentMutation.isPending ? 'Adding...' : 'Add Equipment'}
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
