import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

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
