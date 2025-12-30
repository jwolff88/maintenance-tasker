import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { inspectionsApi, propertiesApi } from '../services/api';
import { Plus, ClipboardCheck, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const inspectionTypes = ['CITY', 'FIRE', 'SAFETY', 'ROUTINE', 'MOVE_IN', 'MOVE_OUT'];

const statusColors = {
  SCHEDULED: 'badge-blue',
  COMPLETED: 'badge-green',
  FAILED: 'badge-red',
  CANCELLED: 'badge-gray',
};

const statusIcons = {
  SCHEDULED: Clock,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  CANCELLED: XCircle,
};

export default function Inspections() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    type: 'ROUTINE',
    scheduledAt: '',
    notes: '',
  });

  const { data: inspections, isLoading } = useQuery({
    queryKey: ['inspections', statusFilter, typeFilter],
    queryFn: () => inspectionsApi.getAll({ status: statusFilter, type: typeFilter }).then(res => res.data),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: inspectionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setShowModal(false);
      setFormData({ propertyId: '', type: 'ROUTINE', scheduledAt: '', notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inspectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-600">Schedule and track property inspections</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Types</option>
          {inspectionTypes.map(type => (
            <option key={type} value={type}>{type.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Inspections List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : inspections?.length > 0 ? (
        <div className="space-y-3">
          {inspections.map((inspection: any) => {
            const StatusIcon = statusIcons[inspection.status as keyof typeof statusIcons];
            const isPast = new Date(inspection.scheduledAt) < new Date();
            const isScheduled = inspection.status === 'SCHEDULED';

            return (
              <div key={inspection.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      inspection.status === 'COMPLETED' ? 'bg-green-100' :
                      inspection.status === 'FAILED' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      <StatusIcon className={`w-5 h-5 ${
                        inspection.status === 'COMPLETED' ? 'text-green-600' :
                        inspection.status === 'FAILED' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${statusColors[inspection.status as keyof typeof statusColors]}`}>
                          {inspection.status}
                        </span>
                        <span className="badge badge-gray">{inspection.type.replace('_', ' ')}</span>
                      </div>
                      <Link
                        to={`/properties/${inspection.property.id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {inspection.property.name}
                      </Link>
                      <p className="text-sm text-gray-600">{inspection.property.address}</p>
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(inspection.scheduledAt), 'EEEE, MMMM d, yyyy h:mm a')}
                        {isPast && isScheduled && (
                          <span className="text-red-600 ml-2">(Overdue)</span>
                        )}
                      </div>
                      {inspection.notes && (
                        <p className="text-sm text-gray-600 mt-2">{inspection.notes}</p>
                      )}
                    </div>
                  </div>

                  {isScheduled && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({
                          id: inspection.id,
                          data: { status: 'COMPLETED' }
                        })}
                        className="btn-primary text-sm"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({
                          id: inspection.id,
                          data: { status: 'FAILED' }
                        })}
                        className="btn-danger text-sm"
                      >
                        Failed
                      </button>
                    </div>
                  )}
                </div>

                {inspection.status === 'COMPLETED' && inspection.completedAt && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    Completed on {format(new Date(inspection.completedAt), 'MMM d, yyyy h:mm a')}
                  </div>
                )}

                {(inspection.passedItems?.length > 0 || inspection.failedItems?.length > 0) && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
                    {inspection.passedItems?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Passed Items</p>
                        <ul className="text-sm text-gray-600">
                          {inspection.passedItems.map((item: string, i: number) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {inspection.failedItems?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">Failed Items</p>
                        <ul className="text-sm text-gray-600">
                          {inspection.failedItems.map((item: string, i: number) => (
                            <li key={i} className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections found</h3>
          <p className="text-gray-600 mb-4">Schedule your first property inspection.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Schedule Inspection
          </button>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Schedule Inspection</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input"
                    >
                      {inspectionTypes.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Any special instructions or notes..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'Scheduling...' : 'Schedule'}
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
