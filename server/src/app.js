import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { getDBStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { complaintRoutes, adminComplaintRoutes } from './routes/complaintRoutes.js';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import hotspotRoutes from './routes/hotspotRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { authLimiter, aiLimiter, apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeError } from './services/gemini.service.js';

const app = express();

// Standard OWASP Security Headers (defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Configure CORS
const rawClientUrls = process.env.CLIENT_URL || '';
const configuredOrigins = rawClientUrls
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const isProduction = process.env.NODE_ENV === 'production';

// In production, strictly allow configured origins; in development, also allow local dev ports
const allowedOrigins = isProduction
  ? configuredOrigins
  : [...new Set([...configuredOrigins, ...devOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, health check, curl, or mobile requests with no browser origin
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // 1. Direct match with configured origins
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // 2. Allow Vercel preview/branch deployments if CLIENT_URL has a vercel.app domain
    const hasVercelClient = configuredOrigins.some((url) => url.includes('.vercel.app'));
    if (hasVercelClient) {
      try {
        const parsedUrl = new URL(cleanOrigin);
        if (parsedUrl.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch (e) {
        // invalid origin url format, ignore
      }
    }

    // 3. In non-production, be permissive for local development tools
    if (!isProduction) {
      return callback(null, true);
    }

    // 4. Strictly reject unknown origins in production
    console.warn(`[CORS Blocked] Origin "${cleanOrigin}" not authorized. Configured origins:`, configuredOrigins);
    return callback(new Error('CORS policy: Access from this origin is not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Apply global API rate limiter
app.use('/api', apiLimiter);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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

// Routes with specialized rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin/complaints', adminComplaintRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/hotspots', hotspotRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler with secret sanitization
app.use((err, req, res, next) => {
  const safeMessage = sanitizeError(err.message || 'Internal Server Error');
  console.error('[Error]', safeMessage);
  res.status(err.status || 500).json({
    success: false,
    message: safeMessage
  });
});

export default app;
