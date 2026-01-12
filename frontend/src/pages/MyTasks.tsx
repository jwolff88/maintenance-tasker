import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tasksApi, ticketsApi, timeTrackingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Clock, Play, Square, CheckCircle, Wrench, ClipboardList,
  MapPin, Calendar, AlertCircle, Timer
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tasks' | 'tickets'>('tasks');

  // Get current time entry (if clocked in)
  const { data: currentTimeEntry } = useQuery({
    queryKey: ['current-time-entry'],
    queryFn: () => timeTrackingApi.getCurrent().then(res => res.data),
    refetchInterval: 60000, // Refresh every minute
  });

  // Get my assigned tasks
  const { data: myTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getMyTasks().then(res => res.data),
  });

  // Get my assigned tickets
  const { data: myTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.getAll({ assigneeId: user?.id || '' }).then(res => res.data),
  });

  // Time tracking mutations
  const clockInMutation = useMutation({
    mutationFn: timeTrackingApi.clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-time-entry'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: timeTrackingApi.clockOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-time-entry'] });
    },
  });

  // Task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tasksApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  const isClockedIn = !!currentTimeEntry;
  const clockedInDuration = currentTimeEntry
    ? Math.floor((Date.now() - new Date(currentTimeEntry.clockIn).getTime()) / 60000)
    : 0;

  const priorityColors: Record<string, string> = {
    LOW: 'badge-gray',
    MEDIUM: 'badge-blue',
    HIGH: 'badge-yellow',
    URGENT: 'badge-red',
    CRITICAL: 'badge-red',
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    NEW: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
        <p className="text-gray-600">Tasks and tickets assigned to you</p>
      </div>

      {/* Time Clock Card */}
      <div className={`card ${isClockedIn ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isClockedIn ? 'bg-green-100' : 'bg-gray-200'}`}>
              <Clock className={`w-6 h-6 ${isClockedIn ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {isClockedIn ? 'Currently Working' : 'Not Clocked In'}
              </p>
              {isClockedIn && (
                <div className="text-sm text-gray-600">
                  <p>Started: {format(new Date(currentTimeEntry.clockIn), 'h:mm a')}</p>
                  <p className="font-medium text-green-700">
                    Duration: {Math.floor(clockedInDuration / 60)}h {clockedInDuration % 60}m
                  </p>
                  {currentTimeEntry.task && (
                    <p className="text-primary-600">Task: {currentTimeEntry.task.title}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            {isClockedIn ? (
              <button
                onClick={() => clockOutMutation.mutate({})}
                disabled={clockOutMutation.isPending}
                className="btn-secondary flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
              >
                <Square className="w-4 h-4" />
                {clockOutMutation.isPending ? 'Stopping...' : 'Clock Out'}
              </button>
            ) : (
              <button
                onClick={() => clockInMutation.mutate({})}
                disabled={clockInMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {clockInMutation.isPending ? 'Starting...' : 'Clock In'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Open Tasks</p>
          <p className="text-2xl font-bold">
            {myTasks?.filter((t: any) => t.status === 'OPEN').length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {myTasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Open Tickets</p>
          <p className="text-2xl font-bold">
            {myTickets?.filter((t: any) => ['NEW', 'IN_PROGRESS'].includes(t.status)).length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Due Today</p>
          <p className="text-2xl font-bold text-red-600">
            {myTasks?.filter((t: any) => {
              if (!t.dueDate) return false;
              const due = new Date(t.dueDate);
              const today = new Date();
              return due.toDateString() === today.toDateString();
            }).length || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Tasks ({myTasks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Tickets ({myTickets?.filter((t: any) => !['COMPLETED', 'CANCELLED'].includes(t.status)).length || 0})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasksLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : myTasks?.length > 0 ? (
            myTasks.map((task: any) => (
              <div key={task.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                      <span className={`badge ${statusColors[task.status]}`}>{task.status.replace(/_/g, ' ')}</span>
                    </div>
                    <Link to={`/maintenance-tasks/${task.id}`} className="font-semibold hover:text-primary-600">
                      {task.title}
                    </Link>
                    {task.asset && (
                      <p className="text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {task.asset.name} {task.asset.location && `- ${task.asset.location}`}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className={`text-sm mt-1 flex items-center gap-1 ${
                        new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        Due: {format(new Date(task.dueDate), 'MMM d, h:mm a')}
                        {new Date(task.dueDate) < new Date() && (
                          <AlertCircle className="w-3 h-3 ml-1" />
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'OPEN' && (
                      <button
                        onClick={() => {
                          updateTaskMutation.mutate({ id: task.id, status: 'IN_PROGRESS' });
                          if (!isClockedIn) {
                            clockInMutation.mutate({ taskId: task.id });
                          }
                        }}
                        className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'UNDER_REVIEW' })}
                        className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tasks assigned to you</p>
            </div>
          )}
        </div>
      )}

      {/* Tickets List */}
      {activeTab === 'tickets' && (
        <div className="space-y-3">
          {ticketsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : myTickets?.filter((t: any) => !['COMPLETED', 'CANCELLED'].includes(t.status)).length > 0 ? (
            myTickets
              .filter((t: any) => !['COMPLETED', 'CANCELLED'].includes(t.status))
              .map((ticket: any) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                        <span className={`badge ${statusColors[ticket.status]}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span className="badge badge-gray">{ticket.category.replace(/_/g, ' ')}</span>
                      </div>
                      <h3 className="font-semibold">{ticket.title}</h3>
                      {ticket.property && (
                        <p className="text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {ticket.property.name} - {ticket.property.address}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {format(new Date(ticket.createdAt), 'MMM d')}
                    </div>
                  </div>
                </Link>
              ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No open tickets assigned to you</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
