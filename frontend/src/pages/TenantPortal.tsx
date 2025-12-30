import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tenantPortalApi } from '../services/api';
import {
  Building2, Wrench, Mail, Phone, CheckCircle, AlertCircle,
  Clock, ArrowLeft, Send
} from 'lucide-react';
import { format } from 'date-fns';

const categories = [
  { value: 'PLUMBING', label: 'Plumbing (leaks, clogs, water issues)' },
  { value: 'ELECTRICAL', label: 'Electrical (outlets, lights, breakers)' },
  { value: 'HVAC', label: 'HVAC (heating, cooling, ventilation)' },
  { value: 'APPLIANCE', label: 'Appliances (fridge, stove, washer, etc.)' },
  { value: 'STRUCTURAL', label: 'Structural (doors, windows, walls)' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'SAFETY', label: 'Safety (smoke detectors, locks)' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low - Not urgent, can wait', color: 'text-gray-600' },
  { value: 'MEDIUM', label: 'Medium - Should be fixed soon', color: 'text-blue-600' },
  { value: 'HIGH', label: 'High - Affecting daily life', color: 'text-yellow-600' },
  { value: 'URGENT', label: 'Urgent - Emergency situation', color: 'text-red-600' },
];

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_ON_TENANT: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

interface TenantInfo {
  tenantId: string;
  firstName: string;
  lastName: string;
  properties: Array<{
    leaseId: string;
    propertyId: string;
    propertyName: string;
    address: string;
    companyName: string;
  }>;
}

export default function TenantPortal() {
  const [step, setStep] = useState<'lookup' | 'select' | 'form' | 'success' | 'history'>('lookup');
  const [email, setEmail] = useState('');
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [existingTickets, setExistingTickets] = useState<any[]>([]);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);
  const [error, setError] = useState('');

  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    contactPhone: '',
  });

  const lookupMutation = useMutation({
    mutationFn: (email: string) => tenantPortalApi.lookup(email),
    onSuccess: async (res) => {
      setTenantInfo(res.data);
      setError('');

      // Also fetch existing tickets
      try {
        const ticketsRes = await tenantPortalApi.getTickets(res.data.tenantId);
        setExistingTickets(ticketsRes.data);
      } catch {
        // Ignore errors fetching tickets
      }

      if (res.data.properties.length === 1) {
        setSelectedProperty(res.data.properties[0].propertyId);
        setStep('form');
      } else {
        setStep('select');
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Unable to find your account. Please contact your property manager.');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => tenantPortalApi.submitTicket(data),
    onSuccess: (res) => {
      setSubmittedTicket(res.data);
      setStep('success');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    },
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    lookupMutation.mutate(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    submitMutation.mutate({
      tenantId: tenantInfo?.tenantId,
      propertyId: selectedProperty,
      ...ticketForm,
    });
  };

  const resetForm = () => {
    setStep('lookup');
    setEmail('');
    setTenantInfo(null);
    setSelectedProperty('');
    setExistingTickets([]);
    setSubmittedTicket(null);
    setTicketForm({
      title: '',
      description: '',
      category: 'OTHER',
      priority: 'MEDIUM',
      contactPhone: '',
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tenant Portal</h1>
                <p className="text-sm text-gray-600">Submit Maintenance Requests</p>
              </div>
            </div>
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Step: Lookup */}
        {step === 'lookup' && (
          <div className="card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <Mail className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome, Tenant!</h2>
              <p className="text-gray-600 mt-2">
                Enter your email address to submit a maintenance request
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your.email@example.com"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use the email address associated with your lease
                </p>
              </div>

              <button
                type="submit"
                disabled={lookupMutation.isPending}
                className="w-full btn-primary py-3"
              >
                {lookupMutation.isPending ? 'Looking up...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step: Select Property (if multiple) */}
        {step === 'select' && tenantInfo && (
          <div className="card">
            <button onClick={resetForm} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Hello, {tenantInfo.firstName}!
            </h2>
            <p className="text-gray-600 mb-6">
              Select the property for your maintenance request:
            </p>

            <div className="space-y-3">
              {tenantInfo.properties.map((prop) => (
                <button
                  key={prop.propertyId}
                  onClick={() => {
                    setSelectedProperty(prop.propertyId);
                    setStep('form');
                  }}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                >
                  <p className="font-medium text-gray-900">{prop.propertyName}</p>
                  <p className="text-sm text-gray-600">{prop.address}</p>
                  <p className="text-xs text-gray-500 mt-1">Managed by {prop.companyName}</p>
                </button>
              ))}
            </div>

            {existingTickets.length > 0 && (
              <button
                onClick={() => setStep('history')}
                className="w-full mt-4 btn-secondary"
              >
                View My Previous Requests ({existingTickets.length})
              </button>
            )}
          </div>
        )}

        {/* Step: Request Form */}
        {step === 'form' && tenantInfo && (
          <div className="card">
            <button
              onClick={() => tenantInfo.properties.length > 1 ? setStep('select') : resetForm()}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Maintenance Request</h2>
                <p className="text-sm text-gray-600">
                  {tenantInfo.properties.find(p => p.propertyId === selectedProperty)?.propertyName}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What's the issue? *
                </label>
                <input
                  type="text"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Leaky faucet in bathroom"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How urgent is this? *
                </label>
                <div className="space-y-2">
                  {priorityOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        ticketForm.priority === opt.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={opt.value}
                        checked={ticketForm.priority === opt.value}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                        className="text-primary-600"
                      />
                      <span className={opt.color}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the problem in detail *
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Please provide as much detail as possible. Include location within the property, when the issue started, and any relevant details..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={ticketForm.contactPhone}
                    onChange={(e) => setTicketForm({ ...ticketForm, contactPhone: e.target.value })}
                    className="input pl-10"
                    placeholder="Best number to reach you"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            {existingTickets.length > 0 && (
              <button
                onClick={() => setStep('history')}
                className="w-full mt-4 btn-secondary"
              >
                View My Previous Requests
              </button>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && submittedTicket && (
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-6">{submittedTicket.message}</p>

            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <p className="text-sm text-gray-500 mb-1">Request ID</p>
              <p className="font-mono font-medium">{submittedTicket.ticketId.slice(0, 8)}</p>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{submittedTicket.ticket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium">{submittedTicket.ticket.priority}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={resetForm} className="btn-secondary flex-1">
                Submit Another Request
              </button>
              {existingTickets.length > 0 && (
                <button onClick={() => setStep('history')} className="btn-primary flex-1">
                  View All Requests
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step: History */}
        {step === 'history' && tenantInfo && (
          <div className="card">
            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to New Request
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">My Maintenance Requests</h2>

            {existingTickets.length > 0 ? (
              <div className="space-y-3">
                {existingTickets.map((ticket: any) => (
                  <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{ticket.title}</p>
                        <p className="text-sm text-gray-600">{ticket.property.name}</p>
                      </div>
                      <span className={`badge ${statusColors[ticket.status] || 'badge-gray'}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div>{ticket.category.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No previous requests</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          For emergencies, please call your property management company directly.
        </div>
      </footer>
    </div>
  );
}
