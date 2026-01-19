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

const statusColors: Record<string, string> = {
  HEALTHY: 'badge-green',
  ATTENTION_NEEDED: 'badge-yellow',
  CRITICAL: 'badge-red',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-viridian"></div>
      </div>
    );
  }

  if (!property) {
    return <div className="text-center py-12 text-viridian">Property not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-viridian/50 mb-2">
            <Link to="/properties" className="hover:text-viridian">Properties</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-viridian">{property.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-viridian font-orbitron">{property.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-viridian/60">
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
        <div className="card-holo">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-viridian">{property.units}</p>
              <p className="text-sm text-viridian/60">Units</p>
            </div>
          </div>
        </div>
        <div className="card-holo">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-viridian">{property.leases?.length || 0}</p>
              <p className="text-sm text-viridian/60">Active Leases</p>
            </div>
          </div>
        </div>
        <div className="card-holo">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Wrench className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-viridian">{property.tickets?.length || 0}</p>
              <p className="text-sm text-viridian/60">Open Tickets</p>
            </div>
          </div>
        </div>
        <div className="card-holo">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-viridian">{property.riskScore}</p>
              <p className="text-sm text-viridian/60">Risk Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <div className="card-holo">
            <h2 className="text-lg font-semibold mb-4 text-viridian font-orbitron">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-viridian/50">Type</p>
                <p className="font-medium text-viridian">{property.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Square Feet</p>
                <p className="font-medium text-viridian">{property.sqft?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Year Built</p>
                <p className="font-medium text-viridian">{property.yearBuilt || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Occupancy</p>
                <p className="font-medium text-viridian">{property.occupancy} / {property.units}</p>
              </div>
              {property.manager && (
                <div>
                  <p className="text-sm text-viridian/50">Property Manager</p>
                  <p className="font-medium text-viridian">{property.manager.firstName} {property.manager.lastName}</p>
                </div>
              )}
              {property.owner && (
                <div>
                  <p className="text-sm text-viridian/50">Owner</p>
                  <p className="font-medium text-viridian">{property.owner.firstName} {property.owner.lastName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="card-holo">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-viridian font-orbitron">Notes</h2>
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
                      ? 'bg-viridian/20 text-viridian'
                      : 'bg-viridian/5 text-viridian/60 hover:bg-viridian/10'
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
                  <div key={note.id} className="p-4 bg-viridian/5 border border-viridian/20 rounded-lg">
                    <p className="text-viridian whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-viridian/50">
                      <span>{note.author.firstName} {note.author.lastName}</span>
                      <span>•</span>
                      <span>{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      {note.isInternal && (
                        <>
                          <span>•</span>
                          <span className="text-orange-400">Internal</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-viridian/50 py-8">No notes yet</p>
            )}
          </div>

          {/* Equipment Section */}
          <div className="card-holo">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-viridian font-orbitron">Equipment & Systems</h2>
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
                      serviceOverdue ? 'border-red-500/30 bg-red-500/10' :
                      warrantyExpired ? 'border-yellow-500/30 bg-yellow-500/10' :
                      'border-viridian/20 bg-viridian/5'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            serviceOverdue ? 'bg-red-500/20' :
                            warrantyExpired ? 'bg-yellow-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            <Cog className={`w-5 h-5 ${
                              serviceOverdue ? 'text-red-400' :
                              warrantyExpired ? 'text-yellow-400' :
                              'text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-viridian">{item.name}</p>
                            <p className="text-sm text-viridian/60">{item.type}</p>
                            {item.manufacturer && (
                              <p className="text-sm text-viridian/50">{item.manufacturer} {item.model}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEquipmentMutation.mutate(item.id)}
                          className="text-viridian/40 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        {item.installDate && (
                          <div>
                            <span className="text-viridian/50">Installed: </span>
                            <span className="text-viridian">{format(new Date(item.installDate), 'MMM yyyy')}</span>
                          </div>
                        )}
                        {item.warrantyExpiry && (
                          <div className={warrantyExpired ? 'text-yellow-400' : ''}>
                            <span className="text-viridian/50">Warranty: </span>
                            <span>{format(new Date(item.warrantyExpiry), 'MMM yyyy')}</span>
                            {warrantyExpired && <AlertCircle className="w-3 h-3 inline ml-1" />}
                          </div>
                        )}
                        {item.nextServiceDate && (
                          <div className={serviceOverdue ? 'text-red-400 font-medium' : ''}>
                            <span className="text-viridian/50">Next Service: </span>
                            <span>{format(new Date(item.nextServiceDate), 'MMM d, yyyy')}</span>
                            {serviceOverdue && <span className="ml-1">(Overdue!)</span>}
                          </div>
                        )}
                        {item.expectedLifespan && (
                          <div>
                            <span className="text-viridian/50">Lifespan: </span>
                            <span className="text-viridian">{item.expectedLifespan} years</span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-2 text-sm text-viridian/60 italic">{item.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-viridian/50 py-8">No equipment tracked yet</p>
            )}
          </div>
        </div>

        {/* Right Column - Tickets, Leases, Events */}
        <div className="space-y-6">
          {/* Open Tickets */}
          <div className="card-holo">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-viridian font-orbitron">Open Tickets</h3>
              <Link to={`/tickets?propertyId=${id}`} className="text-sm text-viridian hover:underline">
                View all
              </Link>
            </div>
            {property.tickets?.length > 0 ? (
              <div className="space-y-2">
                {property.tickets.slice(0, 5).map((ticket: any) => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="block p-3 bg-viridian/5 border border-viridian/20 rounded-lg hover:bg-viridian/10"
                  >
                    <p className="font-medium text-sm text-viridian">{ticket.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${
                        ticket.priority === 'URGENT' ? 'badge-red' :
                        ticket.priority === 'HIGH' ? 'badge-yellow' : 'badge-gray'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-viridian/50">{ticket.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-viridian/50 text-center py-4">No open tickets</p>
            )}
          </div>

          {/* Active Leases */}
          <div className="card-holo">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-viridian font-orbitron">Active Leases</h3>
              <Link to={`/leases?propertyId=${id}`} className="text-sm text-viridian hover:underline">
                View all
              </Link>
            </div>
            {property.leases?.length > 0 ? (
              <div className="space-y-2">
                {property.leases.map((lease: any) => (
                  <div key={lease.id} className="p-3 bg-viridian/5 border border-viridian/20 rounded-lg">
                    <p className="font-medium text-sm text-viridian">
                      {lease.tenant.firstName} {lease.tenant.lastName}
                    </p>
                    <p className="text-xs text-viridian/50 mt-1">
                      Expires: {format(new Date(lease.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-viridian/50 text-center py-4">No active leases</p>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card-holo">
            <h3 className="font-semibold mb-4 text-viridian font-orbitron">Upcoming Events</h3>
            {property.events?.length > 0 ? (
              <div className="space-y-2">
                {property.events.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-viridian/5 border border-viridian/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-viridian/40" />
                    <div>
                      <p className="font-medium text-sm text-viridian">{event.title}</p>
                      <p className="text-xs text-viridian/50">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-viridian/50 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-holo max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4 text-viridian font-orbitron">Add Note</h2>
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
                <label className="block text-sm font-medium text-viridian/80 mb-1">
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
                <label className="block text-sm font-medium text-viridian/80 mb-1">
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
      )}

      {/* Add Equipment Modal */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-holo max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-viridian font-orbitron">Add Equipment</h2>
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
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Name *</label>
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
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Type *</label>
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
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={equipmentForm.manufacturer}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Model</label>
                  <input
                    type="text"
                    value={equipmentForm.model}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={equipmentForm.serialNumber}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, serialNumber: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Install Date</label>
                  <input
                    type="date"
                    value={equipmentForm.installDate}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, installDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Warranty Expiry</label>
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
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Next Service Date</label>
                  <input
                    type="date"
                    value={equipmentForm.nextServiceDate}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, nextServiceDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80 mb-1">Expected Lifespan (years)</label>
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
                <label className="block text-sm font-medium text-viridian/80 mb-1">Notes</label>
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
      )}
    </div>
  );
}
