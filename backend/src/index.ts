import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import propertyRoutes from './routes/properties.js';
import ticketRoutes from './routes/tickets.js';
import leaseRoutes from './routes/leases.js';
import vendorRoutes from './routes/vendors.js';
import dashboardRoutes from './routes/dashboard.js';
import noteRoutes from './routes/notes.js';
import equipmentRoutes from './routes/equipment.js';
import inspectionRoutes from './routes/inspections.js';
import tenantPortalRoutes from './routes/tenant-portal.js';
import assetRoutes from './routes/assets.js';
import taskRoutes from './routes/tasks.js';
import billingRoutes from './routes/billing.js';
import capexRoutes from './routes/capex.js';
import turnoverRoutes from './routes/turnovers.js';
import technicianRoutes from './routes/technicians.js';
import inventoryRoutes from './routes/inventory.js';
import timeTrackingRoutes from './routes/time-tracking.js';
import teamAnalyticsRoutes from './routes/team-analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel/serverless environments (needed for rate limiting)
app.set('trust proxy', 1);

const frontendUrls = (process.env.FRONTEND_URL || '').split(',').map(url => url.trim());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  ...frontendUrls,
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all localhost ports in development
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    // Allow Vercel preview and production URLs
    if (origin.includes('vercel.app')) return callback(null, true);
    // Check against allowed origins list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Stripe webhooks need raw body for signature verification
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Serve static files for uploads
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsPath = isServerless ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Apply global rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/tenant-portal', tenantPortalRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/capex', capexRoutes);
app.use('/api/turnovers', turnoverRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/team-analytics', teamAnalyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
