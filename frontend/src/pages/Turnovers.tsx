import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turnoverApi, propertiesApi } from '../services/api';

const STATUSES = [
  'SCHEDULED', 'MOVE_OUT_COMPLETE', 'IN_PROGRESS', 'FINAL_INSPECTION', 'READY', 'OCCUPIED', 'CANCELLED'
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-800',
  MOVE_OUT_COMPLETE: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  FINAL_INSPECTION: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
};

export default function Turnovers() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedTurnover, setSelectedTurnover] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const { data: turnovers = [], isLoading } = useQuery({
    queryKey: ['turnovers', filterStatus],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      return turnoverApi.getAll(params).then(res => res.data);
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll().then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['turnover-stats'],
    queryFn: () => turnoverApi.getStats().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => turnoverApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnovers'] });
      queryClient.invalidateQueries({ queryKey: ['turnover-stats'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => turnoverApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnovers'] });
      queryClient.invalidateQueries({ queryKey: ['turnover-stats'] });
      if (selectedTurnover) {
        // Refetch selected turnover
        turnoverApi.getOne(selectedTurnover.id).then(res => setSelectedTurnover(res.data));
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ turnoverId, taskId, data }: { turnoverId: string; taskId: string; data: any }) =>
      turnoverApi.updateTask(turnoverId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnovers'] });
      if (selectedTurnover) {
        turnoverApi.getOne(selectedTurnover.id).then(res => setSelectedTurnover(res.data));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => turnoverApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnovers'] });
      queryClient.invalidateQueries({ queryKey: ['turnover-stats'] });
      setSelectedTurnover(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      propertyId: formData.get('propertyId'),
      unit: formData.get('unit') || undefined,
      moveOutDate: formData.get('moveOutDate'),
      targetReadyDate: formData.get('targetReadyDate'),
      estimatedCost: formData.get('estimatedCost') ? parseFloat(formData.get('estimatedCost') as string) : undefined,
      createDefaultTasks: true,
    };
    createMutation.mutate(data);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unit Turnovers</h1>
          <p className="text-gray-600">Manage make-ready workflow between tenants</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Turnover
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Active Turnovers</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeTurnovers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedTurnovers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Avg Days Vacant</p>
            <p className="text-2xl font-bold">{stats.avgDaysVacant} days</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Cost (Completed)</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(stats.totalCost))}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 border rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* New Turnover Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Schedule New Turnover</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property *</label>
                <select name="propertyId" required className="mt-1 w-full border rounded-md px-3 py-2">
                  <option value="">Select property</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Number</label>
                <input
                  name="unit"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Unit 101, Apt 2B"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Move-out Date *</label>
                  <input
                    name="moveOutDate"
                    type="date"
                    required
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Ready Date *</label>
                  <input
                    name="targetReadyDate"
                    type="date"
                    required
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                <input
                  name="estimatedCost"
                  type="number"
                  step="0.01"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-gray-500">
                Default make-ready tasks will be created automatically.
              </p>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Turnover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Turnover Detail Modal */}
      {selectedTurnover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedTurnover.property?.name}</h2>
                <p className="text-gray-500">{selectedTurnover.unit || 'Main Unit'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedTurnover.status]}`}>
                {selectedTurnover.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Dates & Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Move-out</p>
                <p className="font-medium">{formatDate(selectedTurnover.moveOutDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Ready</p>
                <p className="font-medium">{formatDate(selectedTurnover.targetReadyDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Days Vacant</p>
                <p className="font-medium text-orange-600">{selectedTurnover.daysVacant || 0} days</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Task Progress</span>
                <span>{selectedTurnover.tasksCompleted}/{selectedTurnover.tasksTotal} completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(selectedTurnover.tasksCompleted / selectedTurnover.tasksTotal) * 100}%` }}
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Make-Ready Tasks</h3>
              <div className="space-y-2">
                {selectedTurnover.turnoverTasks?.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'COMPLETED'}
                        onChange={() => {
                          const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
                          updateTaskMutation.mutate({
                            turnoverId: selectedTurnover.id,
                            taskId: task.id,
                            data: { status: newStatus },
                          });
                        }}
                        className="h-5 w-5 rounded"
                      />
                      <div>
                        <p className={task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">{task.category}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Actions */}
            <div className="flex gap-2 mb-4">
              {selectedTurnover.status === 'SCHEDULED' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'MOVE_OUT_COMPLETE' } })}
                  className="px-3 py-2 bg-yellow-600 text-white rounded-md text-sm"
                >
                  Mark Move-out Complete
                </button>
              )}
              {selectedTurnover.status === 'MOVE_OUT_COMPLETE' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'IN_PROGRESS' } })}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Start Make-Ready
                </button>
              )}
              {selectedTurnover.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'FINAL_INSPECTION' } })}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm"
                >
                  Ready for Inspection
                </button>
              )}
              {selectedTurnover.status === 'FINAL_INSPECTION' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'READY' } })}
                  className="px-3 py-2 bg-green-600 text-white rounded-md text-sm"
                >
                  Mark Ready
                </button>
              )}
              {selectedTurnover.status === 'READY' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'OCCUPIED' } })}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm"
                >
                  Mark Occupied
                </button>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => deleteMutation.mutate(selectedTurnover.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedTurnover(null)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turnovers List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : turnovers.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No turnovers found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-blue-600 hover:underline"
          >
            Schedule your first turnover
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {turnovers.map((turnover: any) => (
            <div
              key={turnover.id}
              onClick={() => setSelectedTurnover(turnover)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{turnover.property?.name}</h3>
                  <p className="text-sm text-gray-500">{turnover.unit || 'Main Unit'} - {turnover.property?.address}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[turnover.status]}`}>
                  {turnover.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Move-out:</span>{' '}
                  <span className="font-medium">{formatDate(turnover.moveOutDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Target:</span>{' '}
                  <span className="font-medium">{formatDate(turnover.targetReadyDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Vacant:</span>{' '}
                  <span className={`font-medium ${(turnover.daysVacant || 0) > 14 ? 'text-red-600' : 'text-orange-600'}`}>
                    {turnover.daysVacant || 0} days
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tasks:</span>{' '}
                  <span className="font-medium">{turnover.tasksCompleted}/{turnover.tasksTotal}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
