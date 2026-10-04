import express from 'express';
import syncController from '../controllers/syncController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Validation for push operations
const pushValidation = [
  body('operations').isArray({ min: 1 }).withMessage('Операции должны быть непустым массивом'),
  body('operations.*.table').notEmpty().isString().withMessage('Каждая операция должна содержать table'),
  body('operations.*.action').notEmpty().isIn(['insert', 'update', 'delete']).withMessage('Действие должно быть insert, update или delete'),
  body('operations.*.data').notEmpty().isObject().withMessage('Каждая операция должна содержать объект data'),
  body('operations.*.timestamp').notEmpty().isISO8601().withMessage('Каждая операция должна содержать валидный timestamp')
];

// Validation for pull operations
const pullValidation = [
  body('lastSyncTimestamp').notEmpty().isISO8601().withMessage('Требуется валидный lastSyncTimestamp')
];

// POST /api/sync/push - Accept batch of operations from desktop app
router.post('/push', pushValidation, validate, syncController.push);

// POST /api/sync/pull - Get changes since last sync
router.post('/pull', pullValidation, validate, syncController.pull);

// GET /api/sync/status - Health check for sync
router.get('/status', syncController.status);

export default router;
