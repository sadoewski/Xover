import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import prioritiesRoutes from './routes/priorities.js';
import groupsRoutes from './routes/groups.js';
import tasksRoutes from './routes/tasks.js';
import eventsRoutes from './routes/events.js';
import rwprintRoutes from './routes/rwprint.js';
import morphologyRoutes from './routes/morphology.js';
import datatasksRoutes from './routes/datatasks.js';
import sitesRoutes from './routes/sites.js';

dotenv.config();

// Validate critical environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-this')) {
  console.error('FATAL: JWT_SECRET must be set to a secure value');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware with CORS exceptions for static files
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting for auth endpoints (skip in test mode)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Слишком много попыток. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip rate limiting in tests
});

// CORS middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Static files for uploads with proper CORS headers
app.use('/uploads', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}), express.static('uploads'));

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/priorities', prioritiesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rwprint', rwprintRoutes);
app.use('/api/morphology', morphologyRoutes);
app.use('/api/datatasks', datatasksRoutes);
app.use('/api/sites', sitesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API работает' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Получен сигнал завершения, закрываю соединения...');
  try {
    const { default: pool } = await import('./config/database.js');
    await pool.end();
    console.log('Соединения с БД закрыты');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при завершении:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✓ Сервер запущен на порту ${PORT}`);
    console.log(`✓ API доступно по адресу: http://localhost:${PORT}`);
  });
}

export default app;
