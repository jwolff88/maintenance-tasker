import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ticketsApi, propertiesApi } from '../services/api';
import { Plus, Search, Wrench, Clock, User, AlertCircle, CheckCircle2, Timer, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const priorityColors = {
  LOW: 'badge-gray',
  MEDIUM: 'badge-blue',
  HIGH: 'badge-yellow',
  URGENT: 'badge-red',
};

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_ON_TENANT: 'bg-orange-100 text-orange-800',
  WAITING_ON_VENDOR: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const categories = [
  'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL',
  'PEST_CONTROL', 'LANDSCAPING', 'CLEANING', 'SAFETY', 'OTHER'
];

// SLA Countdown Component
function SlaCountdown({ ticket }: { ticket: any }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!ticket.slaDeadline) return null;

  const deadline = new Date(ticket.slaDeadline);
  const isCompleted = ['COMPLETED', 'CANCELLED'].includes(ticket.status);

  if (isCompleted) {
    return ticket.slaStatus === 'MET' ? (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
        <CheckCircle2 className="w-3 h-3" /> SLA Met
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
        <AlertCircle className="w-3 h-3" /> SLA Breached
      </span>
    );
  }

  const remainingMs = deadline.getTime() - now.getTime();
  const isBreached = remainingMs <= 0;
  const isWarning = remainingMs > 0 && remainingMs < 2 * 60 * 60 * 1000; // Less than 2 hours

  if (isBreached) {
    const breachedHours = Math.abs(Math.floor(remainingMs / (1000 * 60 * 60)));
    const breachedMins = Math.abs(Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
    return (
      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded animate-pulse">
        <AlertCircle className="w-3 h-3" />
        SLA Breached ({breachedHours}h {breachedMins}m ago)
      </span>
    );
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
      isWarning ? 'text-orange-600 bg-orange-50 animate-pulse' : 'text-blue-600 bg-blue-50'
    }`}>
      <Timer className="w-3 h-3" />
      {hours}h {minutes}m left
    </span>
  );
}

export default function Tickets() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyId: searchParams.get('propertyId') || '',
    priority: 'MEDIUM',
    category: 'OTHER',
    useAiTriage: true,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, searchParams.get('propertyId')],
    queryFn: () =>
      ticketsApi.getAll({
        status: statusFilter,
        priority: priorityFilter,
        propertyId: searchParams.get('propertyId') || '',
      }).then((res) => res.data),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ticketsApi.create({
      ...data,
      skipAiTriage: !data.useAiTriage,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        propertyId: '',
        priority: 'MEDIUM',
        category: 'OTHER',
        useAiTriage: true,
      });
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Tickets</h1>
          <p className="text-gray-600">Track and manage maintenance requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Ticket
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
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_ON_TENANT">Waiting on Tenant</option>
          <option value="WAITING_ON_VENDOR">Waiting on Vendor</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : tickets?.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`badge ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                      {ticket.priority}
                    </span>
                    <span className={`badge ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span className="badge badge-gray">{ticket.category.replace(/_/g, ' ')}</span>
                    <SlaCountdown ticket={ticket} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" />
                      {ticket.property.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </div>
                    {ticket.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {ticket.assignee.firstName} {ticket.assignee.lastName}
                      </div>
                    )}
                  </div>
                </div>
                {ticket._count.comments > 0 && (
                  <div className="text-sm text-gray-500">
                    {ticket._count.comments} comment{ticket._count.comments !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600 mb-4">Create your first maintenance ticket.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            New Ticket
          </button>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Create Maintenance Ticket</h2>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    required
                  />
                </div>
                {/* AI Triage Toggle */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useAiTriage}
                      onChange={(e) => setFormData({ ...formData, useAiTriage: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">AI Smart Triage</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Let AI analyze the issue and suggest the best category, priority, and fix
                      </p>
                    </div>
                  </label>
                </div>

                <div className={`grid grid-cols-2 gap-4 ${formData.useAiTriage ? 'opacity-50' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority {formData.useAiTriage && <span className="text-blue-600 text-xs">(AI will set)</span>}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input"
                      disabled={formData.useAiTriage}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category {formData.useAiTriage && <span className="text-blue-600 text-xs">(AI will set)</span>}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                      disabled={formData.useAiTriage}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {createMutation.isPending ? (
                      formData.useAiTriage ? 'AI Analyzing...' : 'Creating...'
                    ) : (
                      <>
                        {formData.useAiTriage && <Sparkles className="w-4 h-4" />}
                        {formData.useAiTriage ? 'Create with AI Triage' : 'Create Ticket'}
                      </>
                    )}
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
