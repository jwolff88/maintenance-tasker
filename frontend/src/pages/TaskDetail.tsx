import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../services/api';
import {
  ArrowLeft, Clock, User, Calendar, Camera, Play, Eye,
  CheckCircle, XCircle, MessageSquare, Send, AlertTriangle, Image
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

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [photoType, setPhotoType] = useState<'before' | 'after' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id!).then((res) => res.data),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => tasksApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const photoMutation = useMutation({
    mutationFn: (formData: FormData) => tasksApi.uploadPhoto(id!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setPhotoType(null);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => tasksApi.addComment(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setComment('');
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && photoType) {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', photoType);
      photoMutation.mutate(formData);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'COMPLETED' && task?.priority === 'CRITICAL') {
      if (!task.photoBefore || !task.photoAfter) {
        alert('Critical tasks require before and after photos to complete.');
        return;
      }
    }
    statusMutation.mutate(newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Task not found</h2>
        <Link to="/maintenance-tasks" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(task.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/maintenance-tasks')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            {isOverdue && (
              <span className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle className="w-4 h-4" /> Overdue
              </span>
            )}
          </div>
          <p className="text-gray-600">
            <Link to={`/assets/${task.asset?.id}`} className="hover:underline">
              {task.asset?.name}
            </Link>
            {task.asset?.location && ` - ${task.asset.location}`}
          </p>
        </div>
        <span className={`badge ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
        <span className={`badge ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Task Details</h3>
            {task.description && (
              <p className="text-gray-700 mb-4">{task.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-medium">{task.assignedTo.firstName} {task.assignedTo.lastName}</p>
                  </div>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              {task.estimatedTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Time</p>
                    <p className="font-medium">{task.estimatedTime} min</p>
                  </div>
                </div>
              )}
              {task.actualTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Actual Time</p>
                    <p className="font-medium">{task.actualTime} min</p>
                  </div>
                </div>
              )}
            </div>
            {task.isRecurring && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Recurring: {task.recurrenceType?.replace('_', ' ')}
                  {task.recurrenceValue && task.recurrenceType === 'CUSTOM' && ` (every ${task.recurrenceValue} days)`}
                </p>
              </div>
            )}
          </div>

          {/* Photo Evidence */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Photo Evidence</h3>
            {task.priority === 'CRITICAL' && (
              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded mb-4">
                Before and after photos are required for critical tasks
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Before</p>
                {task.photoBefore ? (
                  <div className="relative">
                    <img
                      src={task.photoBefore}
                      alt="Before"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => { setPhotoType('before'); fileInputRef.current?.click(); }}
                      className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setPhotoType('before'); fileInputRef.current?.click(); }}
                    disabled={photoMutation.isPending}
                    className="w-full h-40 flex flex-col items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Upload before photo</span>
                  </button>
                )}
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">After</p>
                {task.photoAfter ? (
                  <div className="relative">
                    <img
                      src={task.photoAfter}
                      alt="After"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => { setPhotoType('after'); fileInputRef.current?.click(); }}
                      className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setPhotoType('after'); fileInputRef.current?.click(); }}
                    disabled={photoMutation.isPending}
                    className="w-full h-40 flex flex-col items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Upload after photo</span>
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Comments
            </h3>
            <div className="space-y-4 mb-4">
              {task.comments?.length > 0 ? (
                task.comments.map((comment: any) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.author?.firstName} {comment.author?.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
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
                disabled={!comment.trim() || commentMutation.isPending}
                className="btn-primary px-4"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              {task.status === 'OPEN' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={statusMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Start Task
                </button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusChange('UNDER_REVIEW')}
                  disabled={statusMutation.isPending}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Submit for Review
                </button>
              )}
              {task.status === 'UNDER_REVIEW' && (
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={statusMutation.isPending}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
              )}
              {!['COMPLETED', 'CANCELLED'].includes(task.status) && (
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={statusMutation.isPending}
                  className="w-full btn-secondary flex items-center justify-center gap-2 text-red-600"
                >
                  <XCircle className="w-4 h-4" /> Cancel Task
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Created {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {task.startedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Started {format(new Date(task.startedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Completed {format(new Date(task.completedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Created By */}
          {task.createdBy && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Created By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {task.createdBy.firstName[0]}{task.createdBy.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{task.createdBy.firstName} {task.createdBy.lastName}</p>
                  <p className="text-sm text-gray-500">{task.createdBy.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
