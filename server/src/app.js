import express from 'express';
import cors from 'cors';
import { getDBStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { complaintRoutes, adminComplaintRoutes } from './routes/complaintRoutes.js';

const app = express();

// Configure CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/hackathon context, customizable in prod
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint reporting server & DB status
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'ok',
    service: 'CivicAI API',
    server: 'running',
    database: {
      status: dbStatus.state,
      connected: dbStatus.connected,
      host: dbStatus.host,
      name: dbStatus.name
    },
    message: dbStatus.connected 
      ? 'CivicAI API and MongoDB are running smoothly' 
      : 'CivicAI API is running (MongoDB disconnected)',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin/complaints', adminComplaintRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
