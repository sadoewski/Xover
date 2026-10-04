import request from 'supertest';
import app from '../../src/index.js';
import pool from '../../src/config/database.js';

describe('Error Handling Integration Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('404 - Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
      expect(response.body.error.message).toContain('/api/nonexistent');
    });

    it('should return 404 for non-existent POST routes', async () => {
      const response = await request(app)
        .post('/api/does-not-exist')
        .send({ data: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('400 - Validation Errors', () => {
    it('should return validation error for missing required fields in login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      // Валидация может возвращать разный формат
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('401 - Authentication Errors', () => {
    it('should return 401 for missing auth token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 for invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });

    it('should return 401 for malformed JWT', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(response.status).toBe(401);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should include stack trace in development mode', async () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.body.error).toHaveProperty('stack');

      process.env.NODE_ENV = oldEnv;
    });
  });

  describe('Database Constraint Errors', () => {
    beforeEach(async () => {
      await pool.query("DELETE FROM users WHERE username LIKE 'test_constraint%'");
    });

    afterAll(async () => {
      await pool.query("DELETE FROM users WHERE username LIKE 'test_constraint%'");
    });

    it('should handle unique constraint violations', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test_constraint_unique',
          password: 'Password123',
          name: 'Test User',
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test_constraint_unique',
          password: 'Password456',
          name: 'Test User 2',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT_ERROR');
    });
  });
});
