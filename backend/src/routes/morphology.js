import express from 'express';
import { analyzeText, getStats, clearCache } from '../controllers/morphologyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/morphology/analyze
router.post('/analyze', analyzeText);

// GET /api/morphology/stats
router.get('/stats', getStats);

// POST /api/morphology/clear-cache
router.post('/clear-cache', clearCache);

export default router;
