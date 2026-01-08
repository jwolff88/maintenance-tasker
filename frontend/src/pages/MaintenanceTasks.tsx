import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { tasksApi, assetsApi, companyApi } from '../services/api';
import {
  Plus, Search, ClipboardList, Clock, AlertTriangle, Play, CheckCircle,
  Eye, User, Calendar, ChevronRight, Filter, Download, CheckSquare, Square, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export default function MaintenanceTasks() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetId: searchParams.get('assetId') || '',
    assignedToId: '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedTime: '',
    isRecurring: false,
    recurrenceType: 'MONTHLY',
    recurrenceValue: 1,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, priorityFilter, searchParams.get('assetId')],
    queryFn: () =>
      tasksApi.getAll({
        search,
        status: statusFilter,
        priority: priorityFilter,
        assetId: searchParams.get('assetId') || '',
      }).then((res) => res.data),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets-list'],
    queryFn: () => assetsApi.getAll({}).then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['company-users'],
    queryFn: () => companyApi.getUsers().then((res) => res.data),
  });

  const { data: templates } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => tasksApi.getTemplates().then((res) => res.data),
  });

  const applyTemplate = (templateId: string) => {
    const template = templates?.find((t: any) => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description,
        priority: template.priority,
        estimatedTime: template.estimatedTime?.toString() || '',
        isRecurring: !!template.recurrenceType,
        recurrenceType: template.recurrenceType || 'MONTHLY',
      }));
    }
  };

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        assetId: '',
        assignedToId: '',
        priority: 'MEDIUM',
        dueDate: '',
        estimatedTime: '',
        isRecurring: false,
        recurrenceType: 'MONTHLY',
        recurrenceValue: 1,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ taskIds, status }: { taskIds: string[]; status: string }) =>
      tasksApi.bulkUpdateStatus(taskIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTasks([]);
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await tasksApi.exportCsv({
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleAllTasks = () => {
    if (!tasks) return;
    const selectableTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    if (selectedTasks.length === selectableTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(selectableTasks.map((t: any) => t.id));
    }
  };

  const handleBulkAction = (status: string) => {
    if (selectedTasks.length === 0) return;
    bulkStatusMutation.mutate({ taskIds: selectedTasks, status });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : null,
      assignedToId: formData.assignedToId || null,
    });
  };

  const handleQuickAction = (taskId: string, currentStatus: string) => {
    const nextStatus: Record<string, string> = {
      OPEN: 'IN_PROGRESS',
      IN_PROGRESS: 'UNDER_REVIEW',
      UNDER_REVIEW: 'COMPLETED',
    };
    if (nextStatus[currentStatus]) {
      statusMutation.mutate({ id: taskId, status: nextStatus[currentStatus] });
    }
  };

  const getQuickActionButton = (task: any) => {
    switch (task.status) {
      case 'OPEN':
        return (
          <button
            onClick={(e) => { e.preventDefault(); handleQuickAction(task.id, task.status); }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
          >
            <Play className="w-3 h-3" /> Start
          </button>
        );
      case 'IN_PROGRESS':
        return (
          <button
            onClick={(e) => { e.preventDefault(); handleQuickAction(task.id, task.status); }}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1"
          >
            <Eye className="w-3 h-3" /> Submit
          </button>
        );
      case 'UNDER_REVIEW':
        return (
          <button
            onClick={(e) => { e.preventDefault(); handleQuickAction(task.id, task.status); }}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" /> Complete
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Tasks</h1>
          <p className="text-gray-600">Track and manage maintenance work</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-primary-700">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkAction('IN_PROGRESS')}
              disabled={bulkStatusMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Start All
            </button>
            <button
              onClick={() => handleBulkAction('UNDER_REVIEW')}
              disabled={bulkStatusMutation.isPending}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" /> Submit All
            </button>
            <button
              onClick={() => handleBulkAction('COMPLETED')}
              disabled={bulkStatusMutation.isPending}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" /> Complete All
            </button>
            <button
              onClick={() => handleBulkAction('CANCELLED')}
              disabled={bulkStatusMutation.isPending}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" /> Cancel All
            </button>
          </div>
          <button
            onClick={() => setSelectedTasks([])}
            className="ml-auto text-sm text-gray-600 hover:text-gray-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : tasks?.length > 0 ? (
        <div className="space-y-3">
          {/* Select All Header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <button
              onClick={toggleAllTasks}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {selectedTasks.length === tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length && selectedTasks.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-primary-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-600">
              {selectedTasks.length > 0 ? `${selectedTasks.length} selected` : 'Select all'}
            </span>
          </div>
          {tasks.map((task: any) => (
            <div key={task.id} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
              {/* Checkbox - only show for non-completed tasks */}
              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}
                  className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                >
                  {selectedTasks.includes(task.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              )}
              <Link
                to={`/maintenance-tasks/${task.id}`}
                className="flex-1 flex items-center gap-4 min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                    {task.isOverdue && (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {task.asset?.name}
                    </span>
                    {task.assignedTo && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                  </span>
                  <span className={`badge ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {getQuickActionButton(task)}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Create your first maintenance task.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Task
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Create Maintenance Task</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Template Selector */}
                {templates && templates.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Quick Start from Template
                    </label>
                    <select
                      onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                      className="input text-sm"
                      defaultValue=""
                    >
                      <option value="">Select a template to auto-fill...</option>
                      {templates.map((template: any) => (
                        <option key={template.id} value={template.id}>
                          {template.title} ({template.priority})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="e.g., Replace air filter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Describe the task..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset *
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select an asset</option>
                    {assets?.map((asset: any) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - {asset.location || 'No location'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      className="input"
                    >
                      <option value="">Unassigned</option>
                      {users?.map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                      className="input"
                      min="0"
                    />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Recurring Task</span>
                  </label>
                  {formData.isRecurring && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency
                        </label>
                        <select
                          value={formData.recurrenceType}
                          onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                          className="input"
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="BIWEEKLY">Bi-weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="CUSTOM">Custom (days)</option>
                        </select>
                      </div>
                      {formData.recurrenceType === 'CUSTOM' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Every X Days
                          </label>
                          <input
                            type="number"
                            value={formData.recurrenceValue}
                            onChange={(e) => setFormData({ ...formData, recurrenceValue: Number(e.target.value) })}
                            className="input"
                            min="1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'Creating...' : 'Create Task'}
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
