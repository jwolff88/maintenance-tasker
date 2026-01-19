import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../services/api';
import {
  ArrowLeft, Cog, MapPin, QrCode, Calendar, Shield,
  Edit2, Trash2, CheckCircle, AlertTriangle, Clock, History
} from 'lucide-react';
import { format } from 'date-fns';

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

const taskStatusColors: Record<string, string> = {
  OPEN: 'badge-yellow',
  IN_PROGRESS: 'badge-blue',
  UNDER_REVIEW: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-gray',
};

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.getById(id!).then((res) => res.data),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['asset-history', id],
    queryFn: () => assetsApi.getHistory(id!).then((res) => res.data),
    enabled: !!id && activeTab === 'history',
  });

  const deleteMutation = useMutation({
    mutationFn: () => assetsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      navigate('/assets');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => assetsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      setShowEditModal(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-viridian"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-viridian">Asset not found</h2>
        <Link to="/assets" className="text-viridian hover:underline mt-2 inline-block">
          Back to Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assets')} className="p-2 hover:bg-viridian/10 rounded-lg text-viridian">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-viridian font-orbitron">{asset.name}</h1>
            <span className={`badge ${statusColors[asset.status as keyof typeof statusColors]}`}>
              {statusLabels[asset.status as keyof typeof statusLabels]}
            </span>
          </div>
          <p className="text-viridian/60">{categoryLabels[asset.category]}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="card-holo">
            <h3 className="font-semibold text-viridian mb-4 font-orbitron">Asset Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {asset.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-viridian/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-viridian/50">Location</p>
                    <p className="font-medium text-viridian">{asset.location}</p>
                  </div>
                </div>
              )}
              {asset.qrCode && (
                <div className="flex items-start gap-2">
                  <QrCode className="w-4 h-4 text-viridian/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-viridian/50">QR/ID Code</p>
                    <p className="font-medium font-mono text-sm text-viridian">{asset.qrCode}</p>
                  </div>
                </div>
              )}
              {asset.manufacturer && (
                <div className="flex items-start gap-2">
                  <Cog className="w-4 h-4 text-viridian/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-viridian/50">Manufacturer</p>
                    <p className="font-medium text-viridian">{asset.manufacturer}</p>
                  </div>
                </div>
              )}
              {asset.model && (
                <div>
                  <p className="text-sm text-viridian/50">Model</p>
                  <p className="font-medium text-viridian">{asset.model}</p>
                </div>
              )}
              {asset.serialNumber && (
                <div>
                  <p className="text-sm text-viridian/50">Serial Number</p>
                  <p className="font-medium font-mono text-viridian">{asset.serialNumber}</p>
                </div>
              )}
              {asset.purchaseDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-viridian/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-viridian/50">Purchase Date</p>
                    <p className="font-medium text-viridian">{format(new Date(asset.purchaseDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
              {asset.warrantyExpiry && (
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-viridian/40 mt-0.5" />
                  <div>
                    <p className="text-sm text-viridian/50">Warranty Expires</p>
                    <p className={`font-medium ${new Date(asset.warrantyExpiry) < new Date() ? 'text-red-400' : 'text-viridian'}`}>
                      {format(new Date(asset.warrantyExpiry), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {asset.description && (
              <div className="mt-4 pt-4 border-t border-viridian/20">
                <p className="text-sm text-viridian/50 mb-1">Description</p>
                <p className="text-viridian/70">{asset.description}</p>
              </div>
            )}
            {asset.notes && (
              <div className="mt-4 pt-4 border-t border-viridian/20">
                <p className="text-sm text-viridian/50 mb-1">Notes</p>
                <p className="text-viridian/70">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Tasks/History Tabs */}
          <div className="card-holo">
            <div className="flex gap-4 border-b border-viridian/20 mb-4">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-viridian text-viridian'
                    : 'border-transparent text-viridian/50 hover:text-viridian/70'
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2 px-1 border-b-2 font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'history'
                    ? 'border-viridian text-viridian'
                    : 'border-transparent text-viridian/50 hover:text-viridian/70'
                }`}
              >
                <History className="w-4 h-4" />
                Service History
              </button>
            </div>

            {activeTab === 'tasks' ? (
              asset.tasks?.length > 0 ? (
                <div className="space-y-3">
                  {asset.tasks.map((task: any) => (
                    <Link
                      key={task.id}
                      to={`/maintenance-tasks/${task.id}`}
                      className="block p-3 bg-viridian/5 border border-viridian/20 rounded-lg hover:bg-viridian/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-viridian">{task.title}</h4>
                          {task.assignedTo && (
                            <p className="text-sm text-viridian/50">
                              Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </p>
                          )}
                        </div>
                        <span className={`badge ${taskStatusColors[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-viridian/50 mt-2">
                          <Clock className="w-3.5 h-3.5" />
                          Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-viridian/50 text-center py-4">No active tasks</p>
              )
            ) : history?.length > 0 ? (
              <div className="space-y-3">
                {history.map((task: any) => (
                  <div key={task.id} className="p-3 bg-viridian/5 border border-viridian/20 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-viridian">{task.title}</h4>
                        {task.assignedTo && (
                          <p className="text-sm text-viridian/50">
                            Completed by {task.assignedTo.firstName} {task.assignedTo.lastName}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    {task.completedAt && (
                      <p className="text-sm text-viridian/50 mt-2">
                        {format(new Date(task.completedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-viridian/50 text-center py-4">No service history</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card-holo">
            <h3 className="font-semibold text-viridian mb-4 font-orbitron">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-viridian/60">Total Tasks</span>
                <span className="font-semibold text-viridian">{asset.tasks?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-viridian/60">Open Tasks</span>
                <span className="font-semibold text-viridian">
                  {asset.tasks?.filter((t: any) => t.status === 'OPEN').length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-viridian/60">In Progress</span>
                <span className="font-semibold text-viridian">
                  {asset.tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Property Link */}
          {asset.property && (
            <div className="card-holo">
              <h3 className="font-semibold text-viridian mb-4 font-orbitron">Property</h3>
              <Link
                to={`/properties/${asset.property.id}`}
                className="block p-3 bg-viridian/5 border border-viridian/20 rounded-lg hover:bg-viridian/10"
              >
                <p className="font-medium text-viridian">{asset.property.name}</p>
                {asset.property.address && (
                  <p className="text-sm text-viridian/50">{asset.property.address}</p>
                )}
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card-holo">
            <h3 className="font-semibold text-viridian mb-4 font-orbitron">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to={`/maintenance-tasks?assetId=${asset.id}`}
                className="btn-secondary w-full justify-center"
              >
                View All Tasks
              </Link>
              <button
                onClick={() => updateMutation.mutate({ status: 'NEEDS_MAINTENANCE' })}
                className="btn-secondary w-full justify-center flex items-center gap-2"
                disabled={asset.status === 'NEEDS_MAINTENANCE'}
              >
                <AlertTriangle className="w-4 h-4" />
                Flag for Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-forest/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-holo max-w-md w-full">
            <h3 className="text-lg font-semibold text-viridian mb-2 font-orbitron">Delete Asset?</h3>
            <p className="text-viridian/60 mb-6">
              This will permanently delete "{asset.name}" and all associated tasks. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
