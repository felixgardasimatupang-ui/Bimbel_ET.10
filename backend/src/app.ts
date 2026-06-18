import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { prisma } from './lib/prisma.js';
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

app.set('trust proxy', 1);

// Security headers — API-only (JSON responses), minimal CSP
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Permissions-Policy: disable unnecessary browser features
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()');
  next();
});

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

// Request body parsing + cookies
app.use(express.json({ limit: '1mb' }));

// Malformed JSON handler
app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ success: false, error: 'Format JSON tidak valid' });
    return;
  }
  next(err);
});

app.use(cookieParser());

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: { success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
  validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);

// Auth endpoints: stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: { success: false, error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
  validate: { xForwardedForHeader: false },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/auth/refresh', authLimiter);
app.use('/api/auth/logout', authLimiter);

// Request logging with response time (exclude health check)
app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  const start = performance.now();
  res.on('finish', () => {
    const duration = (performance.now() - start).toFixed(1);
    logger.info(
      { method: req.method, url: req.url, status: res.statusCode, duration: `${duration}ms`, ip: req.ip },
      'request',
    );
  });
  next();
});

// Health check — verifikasi database connectivity
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
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
