import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import pool from '../config/database.js';

describe('Groups API', () => {
  let authToken;
  let userId;
  let groupId;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testgroups${Date.now()}`,
        email: `test-groups-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Test User',
      });

    if (userRes.status !== 201) {
      console.error("Registration failed:", userRes.status, userRes.body);
      throw new Error(`Registration failed: ${JSON.stringify(userRes.body)}`);
    }
    authToken = userRes.body.token;
    userId = userRes.body.user.id;
  });

  afterAll(async () => {
    if (groupId) await pool.query('DELETE FROM task_groups WHERE id = $1', [groupId]);
    if (userId) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /api/groups', () => {
    it('should create a new group with valid data', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Group',
          color: '#0000FF',
        });

      expect(res.status).toBe(201);
      expect(res.body.group).toHaveProperty('id');
      expect(res.body.group).toHaveProperty('name', 'Test Group');
      expect(res.body.group).toHaveProperty('color', '#0000FF');

      groupId = res.body.group.id;
    });

    it('should reject group creation without auth', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
          color: '#0000FF',
        });

      expect(res.status).toBe(401);
    });

    it('should reject group without name', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          color: '#0000FF',
        });

      expect(res.status).toBe(400);
    });

    it('should reject group with invalid color format', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Group',
          color: 'invalid-color',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/groups', () => {
    it('should get all groups for authenticated user', async () => {
      const res = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.groups).toBeInstanceOf(Array);
      expect(res.body.groups.length).toBeGreaterThan(0);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/groups');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group name', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Group Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.group).toHaveProperty('name', 'Updated Group Name');
    });

    it('should update group color', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          color: '#FF0000',
        });

      expect(res.status).toBe(200);
      expect(res.body.group).toHaveProperty('color', '#FF0000');
    });

    it('should return 404 for non-existent group', async () => {
      const res = await request(app)
        .put('/api/groups/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete a group', async () => {
      const res = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedGroup = getRes.body.groups.find(g => g.id === groupId);
      expect(deletedGroup).toBeUndefined();

      groupId = null;
    });
  });
});
