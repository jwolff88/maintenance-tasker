import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turnoverApi, propertiesApi } from '../services/api';

const STATUSES = [
  'SCHEDULED', 'MOVE_OUT_COMPLETE', 'IN_PROGRESS', 'FINAL_INSPECTION', 'READY', 'OCCUPIED', 'CANCELLED'
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'badge-gray',
  MOVE_OUT_COMPLETE: 'badge-yellow',
  IN_PROGRESS: 'badge-blue',
  FINAL_INSPECTION: 'badge-yellow',
  READY: 'badge-green',
  OCCUPIED: 'badge-green',
  CANCELLED: 'badge-red',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-gray',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-green',
  SKIPPED: 'badge-yellow',
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
          <h1 className="text-2xl font-bold text-viridian">Unit Turnovers</h1>
          <p className="text-viridian/60">Manage make-ready workflow between tenants</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + New Turnover
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Active Turnovers</p>
            <p className="text-2xl font-bold text-viridian mt-1">{stats.activeTurnovers}</p>
          </div>
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold text-teal mt-1">{stats.completedTurnovers}</p>
          </div>
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Avg Days Vacant</p>
            <p className="text-2xl font-bold text-bronze mt-1">{stats.avgDaysVacant} days</p>
          </div>
          <div className="card-holo">
            <p className="text-sm text-viridian/60 font-orbitron uppercase tracking-wide">Total Cost (Completed)</p>
            <p className="text-2xl font-bold text-viridian mt-1">{formatCurrency(Number(stats.totalCost))}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4 card-holo">
        <div>
          <label className="block text-sm font-medium text-viridian/80 font-orbitron">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input mt-1"
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
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-holo w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-viridian font-orbitron">Schedule New Turnover</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-viridian/80">Property *</label>
                <select name="propertyId" required className="input mt-1">
                  <option value="">Select property</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80">Unit Number</label>
                <input
                  name="unit"
                  className="input mt-1"
                  placeholder="e.g., Unit 101, Apt 2B"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-viridian/80">Move-out Date *</label>
                  <input
                    name="moveOutDate"
                    type="date"
                    required
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viridian/80">Target Ready Date *</label>
                  <input
                    name="targetReadyDate"
                    type="date"
                    required
                    className="input mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80">Estimated Cost</label>
                <input
                  name="estimatedCost"
                  type="number"
                  step="0.01"
                  className="input mt-1"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-viridian/50">
                Default make-ready tasks will be created automatically.
              </p>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-holo w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-viridian font-orbitron">{selectedTurnover.property?.name}</h2>
                <p className="text-viridian/50">{selectedTurnover.unit || 'Main Unit'}</p>
              </div>
              <span className={`badge ${STATUS_COLORS[selectedTurnover.status]}`}>
                {selectedTurnover.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Dates & Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-viridian/5 rounded-lg border border-viridian/20">
              <div>
                <p className="text-sm text-viridian/50">Move-out</p>
                <p className="font-medium text-viridian">{formatDate(selectedTurnover.moveOutDate)}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Target Ready</p>
                <p className="font-medium text-viridian">{formatDate(selectedTurnover.targetReadyDate)}</p>
              </div>
              <div>
                <p className="text-sm text-viridian/50">Days Vacant</p>
                <p className="font-medium text-bronze">{selectedTurnover.daysVacant || 0} days</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-viridian/70">Task Progress</span>
                <span className="text-viridian">{selectedTurnover.tasksCompleted}/{selectedTurnover.tasksTotal} completed</span>
              </div>
              <div className="w-full bg-viridian/10 rounded-full h-2">
                <div
                  className="bg-viridian h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(selectedTurnover.tasksCompleted / selectedTurnover.tasksTotal) * 100}%` }}
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-viridian font-orbitron">Make-Ready Tasks</h3>
              <div className="space-y-2">
                {selectedTurnover.turnoverTasks?.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-viridian/20 rounded-lg bg-viridian/5">
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
                        className="h-5 w-5 rounded accent-viridian"
                      />
                      <div>
                        <p className={task.status === 'COMPLETED' ? 'line-through text-viridian/40' : 'text-viridian'}>
                          {task.title}
                        </p>
                        <p className="text-xs text-viridian/50">{task.category}</p>
                      </div>
                    </div>
                    <span className={`badge ${TASK_STATUS_COLORS[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Actions */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {selectedTurnover.status === 'SCHEDULED' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'MOVE_OUT_COMPLETE' } })}
                  className="px-3 py-2 bg-bronze/80 text-forest rounded text-sm font-orbitron hover:bg-bronze transition-colors"
                >
                  Mark Move-out Complete
                </button>
              )}
              {selectedTurnover.status === 'MOVE_OUT_COMPLETE' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'IN_PROGRESS' } })}
                  className="px-3 py-2 bg-teal text-forest rounded text-sm font-orbitron hover:bg-teal/80 transition-colors"
                >
                  Start Make-Ready
                </button>
              )}
              {selectedTurnover.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'FINAL_INSPECTION' } })}
                  className="px-3 py-2 bg-bronze text-forest rounded text-sm font-orbitron hover:bg-bronze/80 transition-colors"
                >
                  Ready for Inspection
                </button>
              )}
              {selectedTurnover.status === 'FINAL_INSPECTION' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'READY' } })}
                  className="px-3 py-2 bg-viridian text-forest rounded text-sm font-orbitron hover:bg-viridian/80 transition-colors"
                >
                  Mark Ready
                </button>
              )}
              {selectedTurnover.status === 'READY' && (
                <button
                  onClick={() => updateMutation.mutate({ id: selectedTurnover.id, data: { status: 'OCCUPIED' } })}
                  className="px-3 py-2 bg-viridian text-forest rounded text-sm font-orbitron hover:bg-viridian/80 transition-colors"
                >
                  Mark Occupied
                </button>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-viridian/20">
              <button
                onClick={() => deleteMutation.mutate(selectedTurnover.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedTurnover(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turnovers List */}
      {isLoading ? (
        <div className="text-center py-8 text-viridian/60">Loading...</div>
      ) : turnovers.length === 0 ? (
        <div className="text-center py-8 card-holo">
          <p className="text-viridian/60">No turnovers found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-viridian hover:underline"
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
              className="card-holo cursor-pointer hover:shadow-viridian transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-viridian">{turnover.property?.name}</h3>
                  <p className="text-sm text-viridian/50">{turnover.unit || 'Main Unit'} - {turnover.property?.address}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[turnover.status]}`}>
                  {turnover.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 flex gap-6 text-sm flex-wrap">
                <div>
                  <span className="text-viridian/50">Move-out:</span>{' '}
                  <span className="font-medium text-viridian">{formatDate(turnover.moveOutDate)}</span>
                </div>
                <div>
                  <span className="text-viridian/50">Target:</span>{' '}
                  <span className="font-medium text-viridian">{formatDate(turnover.targetReadyDate)}</span>
                </div>
                <div>
                  <span className="text-viridian/50">Vacant:</span>{' '}
                  <span className={`font-medium ${(turnover.daysVacant || 0) > 14 ? 'text-red-400' : 'text-bronze'}`}>
                    {turnover.daysVacant || 0} days
                  </span>
                </div>
                <div>
                  <span className="text-viridian/50">Tasks:</span>{' '}
                  <span className="font-medium text-viridian">{turnover.tasksCompleted}/{turnover.tasksTotal}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
