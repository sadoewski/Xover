import express from 'express';
import { healthCheck, readinessCheck, livenessCheck } from '../controllers/healthController.js';

const router = express.Router();

// Basic health check
router.get('/health', healthCheck);

// Readiness check (for k8s readiness probe)
router.get('/ready', readinessCheck);
router.get('/readiness', readinessCheck);

// Liveness check (for k8s liveness probe)
router.get('/live', livenessCheck);
router.get('/liveness', livenessCheck);

export default router;
