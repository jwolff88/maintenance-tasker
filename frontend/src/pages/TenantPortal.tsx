import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tenantPortalApi } from '../services/api';
import {
  Building2, Wrench, Mail, Phone, CheckCircle, AlertCircle,
  Clock, ArrowLeft, Send, Hexagon
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
  { value: 'LOW', label: 'Low - Not urgent, can wait', color: 'text-viridian/60' },
  { value: 'MEDIUM', label: 'Medium - Should be fixed soon', color: 'text-blue-400' },
  { value: 'HIGH', label: 'High - Affecting daily life', color: 'text-yellow-400' },
  { value: 'URGENT', label: 'Urgent - Emergency situation', color: 'text-red-400' },
];

const statusColors: Record<string, string> = {
  NEW: 'badge-blue',
  IN_PROGRESS: 'badge-yellow',
  WAITING_ON_TENANT: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-gray',
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
    <div className="min-h-screen bg-forest bg-glow-spotlight">
      {/* Circuitry background overlay */}
      <div className="fixed inset-0 bg-circuitry bg-parallax-slow pointer-events-none opacity-30" />

      {/* Header */}
      <header className="relative z-10 border-b border-bronze/30" style={{ background: 'rgba(1, 11, 10, 0.95)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Hexagon className="w-10 h-10 text-viridian animate-pulse-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-forest" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-viridian font-orbitron glow-viridian-text">Tenant Portal</h1>
                <p className="text-sm text-viridian/60">Submit Maintenance Requests</p>
              </div>
            </div>
            <Link to="/login" className="text-sm text-viridian hover:text-viridian/80">
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Step: Lookup */}
        {step === 'lookup' && (
          <div className="card-holo">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-viridian/20 mb-4">
                <Mail className="w-8 h-8 text-viridian" />
              </div>
              <h2 className="text-2xl font-bold text-viridian font-orbitron">Welcome, Tenant!</h2>
              <p className="text-viridian/60 mt-2">
                Enter your email address to submit a maintenance request
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
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
                <p className="text-sm text-viridian/50 mt-1">
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
          <div className="card-holo">
            <button onClick={resetForm} className="flex items-center gap-1 text-viridian/60 hover:text-viridian mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-xl font-bold text-viridian font-orbitron mb-2">
              Hello, {tenantInfo.firstName}!
            </h2>
            <p className="text-viridian/60 mb-6">
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
                  className="w-full p-4 border border-viridian/20 rounded-lg hover:border-viridian hover:bg-viridian/10 transition-colors text-left"
                >
                  <p className="font-medium text-viridian">{prop.propertyName}</p>
                  <p className="text-sm text-viridian/60">{prop.address}</p>
                  <p className="text-xs text-viridian/40 mt-1">Managed by {prop.companyName}</p>
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
          <div className="card-holo">
            <button
              onClick={() => tenantInfo.properties.length > 1 ? setStep('select') : resetForm()}
              className="flex items-center gap-1 text-viridian/60 hover:text-viridian mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Wrench className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-viridian font-orbitron">New Maintenance Request</h2>
                <p className="text-sm text-viridian/60">
                  {tenantInfo.properties.find(p => p.propertyId === selectedProperty)?.propertyName}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
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
                <label className="block text-sm font-medium text-viridian/80 mb-1">
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
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  How urgent is this? *
                </label>
                <div className="space-y-2">
                  {priorityOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        ticketForm.priority === opt.value
                          ? 'border-viridian bg-viridian/10'
                          : 'border-viridian/20 hover:border-viridian/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={opt.value}
                        checked={ticketForm.priority === opt.value}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                        className="text-viridian"
                      />
                      <span className={opt.color}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
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
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Phone Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-viridian/40" />
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
          <div className="card-holo text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-viridian font-orbitron mb-2">Request Submitted!</h2>
            <p className="text-viridian/60 mb-6">{submittedTicket.message}</p>

            <div className="bg-viridian/5 border border-viridian/20 rounded-lg p-4 text-left mb-6">
              <p className="text-sm text-viridian/50 mb-1">Request ID</p>
              <p className="font-mono font-medium text-viridian">{submittedTicket.ticketId.slice(0, 8)}</p>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-viridian/50">Category</p>
                  <p className="font-medium text-viridian">{submittedTicket.ticket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-viridian/50">Priority</p>
                  <p className="font-medium text-viridian">{submittedTicket.ticket.priority}</p>
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
          <div className="card-holo">
            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-1 text-viridian/60 hover:text-viridian mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to New Request
            </button>

            <h2 className="text-xl font-bold text-viridian font-orbitron mb-6">My Maintenance Requests</h2>

            {existingTickets.length > 0 ? (
              <div className="space-y-3">
                {existingTickets.map((ticket: any) => (
                  <div key={ticket.id} className="p-4 border border-viridian/20 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-viridian">{ticket.title}</p>
                        <p className="text-sm text-viridian/60">{ticket.property.name}</p>
                      </div>
                      <span className={`badge ${statusColors[ticket.status] || 'badge-gray'}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-viridian/50">
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
              <p className="text-center text-viridian/50 py-8">No previous requests</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-bronze/30 mt-auto" style={{ background: 'rgba(1, 11, 10, 0.95)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-sm text-viridian/50">
          For emergencies, please call your property management company directly.
        </div>
      </footer>
    </div>
  );
}
