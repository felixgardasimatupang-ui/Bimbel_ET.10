import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import financeRoutes from './routes/finance.js';
import materialRoutes from './routes/materials.js';
import notificationRoutes from './routes/notifications.js';
import scheduleRoutes from './routes/schedules.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EduAdmin Bimbel API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedules', scheduleRoutes);

app.use(errorHandler);

export default app;
