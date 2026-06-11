import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import financeRoutes from './routes/finance.js';
import materialRoutes from './routes/materials.js';
import notificationRoutes from './routes/notifications.js';
import scheduleRoutes from './routes/schedules.js';
import auditRoutes from './routes/audit.js';
import { sentryErrorHandler } from './middleware/sentry.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      connectSrc: ["'self'", ...(process.env.SUPABASE_URL ? [process.env.SUPABASE_URL] : [])],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

// CORS
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  const hasWildcard = corsOrigins.some((o) => o.includes('*'));
  if (hasWildcard) {
    logger.warn('[CORS] Wildcard origin detected in production — this is insecure. Remove "*" from CORS_ORIGIN.');
  }
}

app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
}));

logger.info(`[CORS] Allowed origins: ${corsOrigins.join(', ')}`);

// Request body parsing
app.use(express.json({ limit: '1mb' }));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
});
app.use('/api/', limiter);

// Auth endpoints: stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request logging (exclude health check)
app.use((req, _res, next) => {
  if (req.path !== '/api/health') {
    logger.info({ method: req.method, url: req.url, ip: req.ip }, 'request');
  }
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EduAdmin Bimbel API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/audit-logs', auditRoutes);

// 404 — JSON response for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && !res.headersSent) {
    res.status(404).json({ success: false, error: 'Endpoint tidak ditemukan' });
  } else {
    next();
  }
});

// Sentry error reporting (before final error handler)
app.use(sentryErrorHandler);

// Error handler
app.use(errorHandler);

export default app;
