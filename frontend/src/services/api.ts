import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Properties API
export const propertiesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/properties', { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  getActivity: (id: string) => api.get(`/properties/${id}/activity`),
};

// Tickets API
export const ticketsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.patch(`/tickets/${id}`, data),
  addComment: (id: string, data: any) => api.post(`/tickets/${id}/comments`, data),
};

// Leases API
export const leasesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/leases', { params }),
  getById: (id: string) => api.get(`/leases/${id}`),
  create: (data: any) => api.post('/leases', data),
  update: (id: string, data: any) => api.patch(`/leases/${id}`, data),
  terminate: (id: string) => api.post(`/leases/${id}/terminate`),
  getTenants: () => api.get('/leases/tenants/all'),
};

// Vendors API
export const vendorsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/vendors', { params }),
  getById: (id: string) => api.get(`/vendors/${id}`),
  create: (data: any) => api.post('/vendors', data),
  update: (id: string, data: any) => api.patch(`/vendors/${id}`, data),
  rate: (id: string, rating: number) => api.post(`/vendors/${id}/rate`, { rating }),
  delete: (id: string) => api.delete(`/vendors/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview'),
  getCostAnalytics: (params?: Record<string, string>) =>
    api.get('/dashboard/analytics/costs', { params }),
  getActivity: () => api.get('/dashboard/activity'),
};

// Notes API
export const notesApi = {
  getByProperty: (propertyId: string, type?: string) =>
    api.get(`/notes/property/${propertyId}`, { params: { type } }),
  create: (data: any) => api.post('/notes', data),
  update: (id: string, data: any) => api.patch(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

// Company API
export const companyApi = {
  get: () => api.get('/companies'),
  getUsers: () => api.get('/companies/users'),
  createUser: (data: any) => api.post('/companies/users', data),
  updateUser: (id: string, data: any) => api.patch(`/companies/users/${id}`, data),
};

// Equipment API
export const equipmentApi = {
  getByProperty: (propertyId: string) => api.get(`/equipment/property/${propertyId}`),
  getById: (id: string) => api.get(`/equipment/${id}`),
  create: (data: any) => api.post('/equipment', data),
  update: (id: string, data: any) => api.patch(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
};

// Inspections API
export const inspectionsApi = {
  getAll: (params?: Record<string, string>) => api.get('/inspections', { params }),
  getByProperty: (propertyId: string) => api.get(`/inspections/property/${propertyId}`),
  create: (data: any) => api.post('/inspections', data),
  update: (id: string, data: any) => api.patch(`/inspections/${id}`, data),
  delete: (id: string) => api.delete(`/inspections/${id}`),
};

// Tenant Portal API (public)
export const tenantPortalApi = {
  lookup: (email: string) => api.post('/tenant-portal/lookup', { email }),
  getTickets: (tenantId: string) => api.get(`/tenant-portal/tickets/${tenantId}`),
  submitTicket: (data: any) => api.post('/tenant-portal/submit-ticket', data),
  getTicketStatus: (ticketId: string, tenantId: string) =>
    api.get(`/tenant-portal/ticket-status/${ticketId}`, { params: { tenantId } }),
};

// Assets API (Maintenance Tasker)
export const assetsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/assets', { params }),
  getById: (id: string) => api.get(`/assets/${id}`),
  getHistory: (id: string) => api.get(`/assets/${id}/history`),
  getStats: () => api.get('/assets/stats/overview'),
  getNeedingAttention: () => api.get('/assets/needing-attention/list'),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.patch(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
};

// Tasks API (Maintenance Tasker)
export const tasksApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  getMyTasks: () => api.get('/tasks/my/assigned'),
  getStats: () => api.get('/tasks/stats/overview'),
  getTemplates: () => api.get('/tasks/templates/list'),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/tasks/${id}/status`, { status }),
  bulkUpdateStatus: (taskIds: string[], status: string) =>
    api.put('/tasks/bulk/status', { taskIds, status }),
  uploadPhoto: (id: string, formData: FormData) =>
    api.post(`/tasks/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  addComment: (id: string, content: string) => api.post(`/tasks/${id}/comments`, { content }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  exportCsv: (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/tasks/export/csv${queryString}`, { responseType: 'blob' });
  },
};
