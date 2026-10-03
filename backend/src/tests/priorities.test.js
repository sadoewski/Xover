import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import pool from '../config/database.js';

describe('Priorities API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testpriorities${Date.now()}`,
        email: `test-priorities-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Test User',
      });

    authToken = userRes.body.token;
    userId = userRes.body.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM priorities WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  describe('POST /api/priorities', () => {
    it('should create a new priority with valid data', async () => {
      const res = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Test Priority ${Date.now()}`,
          color: '#FF0000',
          level: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.priority).toHaveProperty('id');
      expect(res.body.priority).toHaveProperty('color', '#FF0000');
      expect(res.body.priority).toHaveProperty('level', 1);
    });

    it('should reject priority creation without auth', async () => {
      const res = await request(app)
        .post('/api/priorities')
        .send({
          name: 'Test Priority',
          color: '#FF0000',
          level: 1,
        });

      expect(res.status).toBe(401);
    });

    it('should reject priority without required fields', async () => {
      const res = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Priority',
        });

      expect(res.status).toBe(400);
    });

    it('should reject priority with invalid color', async () => {
      const res = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Priority',
          color: 'not-a-color',
          level: 1,
        });

      expect(res.status).toBe(400);
    });

    it('should reject priority with invalid level', async () => {
      const res = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Priority',
          color: '#FF0000',
          level: 'not-a-number',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/priorities', () => {
    beforeAll(async () => {
      // Create a priority for GET tests
      await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Get Test Priority ${Date.now()}`,
          color: '#00FF00',
          level: 2,
        });
    });

    it('should get all priorities for authenticated user', async () => {
      const res = await request(app)
        .get('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.priorities).toBeInstanceOf(Array);
      expect(res.body.priorities.length).toBeGreaterThan(0);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/priorities');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/priorities/:id', () => {
    let priorityId;

    beforeEach(async () => {
      // Create a fresh priority for each update test
      const res = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Update Test Priority ${Date.now()}`,
          color: '#0000FF',
          level: 1,
        });
      priorityId = res.body.priority.id;
    });

    it('should update priority name', async () => {
      const res = await request(app)
        .put(`/api/priorities/${priorityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Updated Priority ${Date.now()}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.priority).toHaveProperty('id', priorityId);
    });

    it('should update priority color', async () => {
      const res = await request(app)
        .put(`/api/priorities/${priorityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          color: '#00FF00',
        });

      expect(res.status).toBe(200);
      expect(res.body.priority).toHaveProperty('color', '#00FF00');
    });

    it('should update priority level', async () => {
      const res = await request(app)
        .put(`/api/priorities/${priorityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          level: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.priority).toHaveProperty('level', 5);
    });

    it('should return 404 for non-existent priority', async () => {
      const res = await request(app)
        .put('/api/priorities/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/priorities/:id', () => {
    it('should delete a priority', async () => {
      // Create priority to delete
      const createRes = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Delete Test Priority ${Date.now()}`,
          color: '#FF00FF',
          level: 1,
        });

      const priorityId = createRes.body.priority.id;

      const res = await request(app)
        .delete(`/api/priorities/${priorityId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get('/api/priorities')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedPriority = getRes.body.priorities.find(p => p.id === priorityId);
      expect(deletedPriority).toBeUndefined();
    });
  });
});

