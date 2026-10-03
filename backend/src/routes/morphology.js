import express from 'express';
import { analyzeText } from '../controllers/morphologyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/morphology/analyze
router.post('/analyze', analyzeText);

export default router;
