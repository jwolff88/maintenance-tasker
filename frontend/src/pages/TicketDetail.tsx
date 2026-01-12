import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../services/api';
import { ChevronRight, Clock, User, Building2, Send, Sparkles, RefreshCw } from 'lucide-react';
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

const statuses = [
  'NEW', 'IN_PROGRESS', 'WAITING_ON_TENANT', 'WAITING_ON_VENDOR', 'COMPLETED', 'CANCELLED'
];

export default function TicketDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id!).then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => ticketsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => ticketsApi.addComment(id!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setComment('');
    },
  });

  const retriageMutation = useMutation({
    mutationFn: () => ticketsApi.retriage(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-12">Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/tickets" className="hover:text-primary-600">Tickets</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="truncate">{ticket.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`badge ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-gray">{ticket.category.replace(/_/g, ' ')}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              </div>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap mb-4">{ticket.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <Link to={`/properties/${ticket.property.id}`} className="hover:text-primary-600">
                  {ticket.property.name}
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                By {ticket.creator.firstName} {ticket.creator.lastName}
              </div>
            </div>

            {ticket.suggestedFix && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">AI Suggested Fix</p>
                </div>
                <p className="text-sm text-blue-700">{ticket.suggestedFix}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>

            {ticket.comments?.length > 0 ? (
              <div className="space-y-4 mb-6">
                {ticket.comments.map((c: any) => (
                  <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{c.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {format(new Date(c.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 mb-4">No comments yet</p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) {
                  commentMutation.mutate(comment);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={commentMutation.isPending || !comment.trim()}
                className="btn-primary"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Triage */}
          {!['COMPLETED', 'CANCELLED'].includes(ticket.status) && (
            <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI Triage</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Re-analyze this ticket with AI to update category, priority, and get a fresh diagnosis.
              </p>
              <button
                onClick={() => retriageMutation.mutate()}
                disabled={retriageMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {retriageMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Re-triage with AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status Update */}
          <div className="card">
            <h3 className="font-semibold mb-4">Update Status</h3>
            <select
              value={ticket.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value })}
              className="input"
              disabled={updateMutation.isPending}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Assignment */}
          <div className="card">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Assignee</p>
                <p className="font-medium">
                  {ticket.assignee
                    ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                    : 'Unassigned'}
                </p>
              </div>
              {ticket.vendor && (
                <div>
                  <p className="text-sm text-gray-500">Vendor</p>
                  <p className="font-medium">{ticket.vendor.name}</p>
                </div>
              )}
              {ticket.tenant && (
                <div>
                  <p className="text-sm text-gray-500">Tenant</p>
                  <p className="font-medium">
                    {ticket.tenant.firstName} {ticket.tenant.lastName}
                  </p>
                </div>
              )}
              {ticket.estimatedCost && (
                <div>
                  <p className="text-sm text-gray-500">Estimated Cost</p>
                  <p className="font-medium">${Number(ticket.estimatedCost).toFixed(2)}</p>
                </div>
              )}
              {ticket.actualCost && (
                <div>
                  <p className="text-sm text-gray-500">Actual Cost</p>
                  <p className="font-medium">${Number(ticket.actualCost).toFixed(2)}</p>
                </div>
              )}
              {ticket.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">
                    {format(new Date(ticket.completedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Input */}
          {ticket.status === 'COMPLETED' && !ticket.actualCost && (
            <div className="card">
              <h3 className="font-semibold mb-4">Record Cost</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const cost = (form.elements.namedItem('cost') as HTMLInputElement).value;
                  updateMutation.mutate({ actualCost: parseFloat(cost) });
                }}
              >
                <input
                  type="number"
                  name="cost"
                  step="0.01"
                  min="0"
                  placeholder="Enter actual cost"
                  className="input mb-3"
                  required
                />
                <button type="submit" className="btn-primary w-full">
                  Save Cost
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
