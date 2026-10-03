import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import pool from '../config/database.js';

describe('Auth API', () => {
  let testUserId;
  const testUsername = `testuser${Date.now()}`;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', testUsername);
      expect(res.body.user).toHaveProperty('email', testEmail);
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).not.toHaveProperty('password_hash');

      testUserId = res.body.user.id;
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `another${Date.now()}`,
          email: testEmail,
          password: testPassword,
          name: 'Another User',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user${Date.now()}`,
          email: 'invalid-email',
          password: testPassword,
          name: 'Test User',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user${Date.now()}`,
          email: `new-${Date.now()}@example.com`,
          password: '123',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
    });

    it('should reject password without uppercase letter', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user${Date.now()}`,
          email: `new-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `new-${Date.now()}@example.com`,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', testUsername);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: testPassword,
        });

      expect(res.status).toBe(401);
    });

    it('should reject login without credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
