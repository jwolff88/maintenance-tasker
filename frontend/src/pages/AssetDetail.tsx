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
  RETIRED: 'bg-gray-100 text-gray-800',
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
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  COMPLETED: 'badge-green',
  CANCELLED: 'bg-gray-100 text-gray-800',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Asset not found</h2>
        <Link to="/assets" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assets')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <span className={`badge ${statusColors[asset.status as keyof typeof statusColors]}`}>
              {statusLabels[asset.status as keyof typeof statusLabels]}
            </span>
          </div>
          <p className="text-gray-600">{categoryLabels[asset.category]}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Asset Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {asset.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{asset.location}</p>
                  </div>
                </div>
              )}
              {asset.qrCode && (
                <div className="flex items-start gap-2">
                  <QrCode className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">QR/ID Code</p>
                    <p className="font-medium font-mono text-sm">{asset.qrCode}</p>
                  </div>
                </div>
              )}
              {asset.manufacturer && (
                <div className="flex items-start gap-2">
                  <Cog className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Manufacturer</p>
                    <p className="font-medium">{asset.manufacturer}</p>
                  </div>
                </div>
              )}
              {asset.model && (
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{asset.model}</p>
                </div>
              )}
              {asset.serialNumber && (
                <div>
                  <p className="text-sm text-gray-500">Serial Number</p>
                  <p className="font-medium font-mono">{asset.serialNumber}</p>
                </div>
              )}
              {asset.purchaseDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p className="font-medium">{format(new Date(asset.purchaseDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
              {asset.warrantyExpiry && (
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Warranty Expires</p>
                    <p className={`font-medium ${new Date(asset.warrantyExpiry) < new Date() ? 'text-red-600' : ''}`}>
                      {format(new Date(asset.warrantyExpiry), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {asset.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{asset.description}</p>
              </div>
            )}
            {asset.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Tasks/History Tabs */}
          <div className="card">
            <div className="flex gap-4 border-b mb-4">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2 px-1 border-b-2 font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'history'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.assignedTo && (
                            <p className="text-sm text-gray-500">
                              Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </p>
                          )}
                        </div>
                        <span className={`badge ${taskStatusColors[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Clock className="w-3.5 h-3.5" />
                          Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active tasks</p>
              )
            ) : history?.length > 0 ? (
              <div className="space-y-3">
                {history.map((task: any) => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.assignedTo && (
                          <p className="text-sm text-gray-500">
                            Completed by {task.assignedTo.firstName} {task.assignedTo.lastName}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    {task.completedAt && (
                      <p className="text-sm text-gray-500 mt-2">
                        {format(new Date(task.completedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No service history</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-semibold">{asset.tasks?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Open Tasks</span>
                <span className="font-semibold">
                  {asset.tasks?.filter((t: any) => t.status === 'OPEN').length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold">
                  {asset.tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Property Link */}
          {asset.property && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Property</h3>
              <Link
                to={`/properties/${asset.property.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <p className="font-medium text-gray-900">{asset.property.name}</p>
                {asset.property.address && (
                  <p className="text-sm text-gray-500">{asset.property.address}</p>
                )}
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
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
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Asset?</h3>
            <p className="text-gray-600 mb-6">
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
