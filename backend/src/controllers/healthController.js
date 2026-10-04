import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';

// Basic health check - always returns OK if server is running
export const healthCheck = asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness check - verifies all dependencies
export const readinessCheck = asyncHandler(async (req, res) => {
  const checks = {
    database: 'unknown',
    morphology: 'unknown',
  };

  let isReady = true;

  // Check database connection
  try {
    const result = await pool.query('SELECT 1 as test');
    checks.database = result.rows[0].test === 1 ? 'ok' : 'error';
  } catch (error) {
    checks.database = 'error';
    isReady = false;
  }

  // Check morphology service (optional dependency)
  try {
    const morphologyUrl = process.env.MORPHOLOGY_URL || 'http://localhost:8080';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${morphologyUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    checks.morphology = response.ok ? 'ok' : 'degraded';
  } catch (error) {
    // Morphology is optional, so we mark as degraded but still ready
    checks.morphology = 'degraded';
  }

  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Liveness check - for Kubernetes liveness probe
export const livenessCheck = asyncHandler(async (req, res) => {
  // Simple check that the process is alive and responding
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});
