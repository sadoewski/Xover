import request from 'supertest';
import app from '../../src/index.js';
import pool from '../../src/config/database.js';

describe('Health Endpoints Integration Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('morphology');
    });

    it('should report database as ok when connected', async () => {
      const response = await request(app).get('/ready');

      expect(response.body.checks.database).toBe('ok');
    });

    it('should be accessible via /readiness alias', async () => {
      const response = await request(app).get('/readiness');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should be accessible via /liveness alias', async () => {
      const response = await request(app).get('/liveness');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
    });
  });

  describe('Health check endpoints availability', () => {
    it('should be accessible without authentication', async () => {
      const healthResponse = await request(app).get('/health');
      const readyResponse = await request(app).get('/ready');
      const liveResponse = await request(app).get('/live');

      expect(healthResponse.status).toBe(200);
      expect(readyResponse.status).toBe(200);
      expect(liveResponse.status).toBe(200);
    });
  });
});
