import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import pool from '../config/database.js';

describe('Tasks API', () => {
  let authToken;
  let userId;
  let groupId;
  let priorityId;
  let taskId;

  beforeAll(async () => {
    // Register test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testtasks${Date.now()}`,
        email: `test-tasks-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Test User',
      });

    authToken = userRes.body.token;
    userId = userRes.body.user.id;

    // Create test group
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Group',
        color: '#0000FF',
      });

    groupId = groupRes.body.group.id;

    // Create test priority
    const priorityRes = await request(app)
      .post('/api/priorities')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Priority',
        color: '#FF0000',
        level: 1,
      });

    priorityId = priorityRes.body.priority.id;
  });

  afterAll(async () => {
    // Cleanup
    if (taskId) await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    if (groupId) await pool.query('DELETE FROM task_groups WHERE id = $1', [groupId]);
    if (priorityId) await pool.query('DELETE FROM priorities WHERE id = $1', [priorityId]);
    if (userId) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          groupId,
          priorityId,
          title: 'Test Task',
          description: 'Test description',
          date: dateStr,
          isTimeBound: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.task).toHaveProperty('id');
      expect(res.body.task).toHaveProperty('title', 'Test Task');
      expect(res.body.task).toHaveProperty('status', 'pending');

      taskId = res.body.task.id;
    });

    it('should reject task creation without auth', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          groupId,
          priorityId,
          title: 'Test Task',
          date: '2024-12-31',
        });

      expect(res.status).toBe(401);
    });

    it('should reject task with past date', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          groupId,
          priorityId,
          title: 'Test Task',
          date: '2020-01-01',
        });

      expect(res.status).toBe(400);
    });

    it('should reject task without required fields', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get task by id', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.task).toHaveProperty('id', taskId);
      expect(res.body.task).toHaveProperty('title', 'Test Task');
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task title', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task Title',
        });

      expect(res.status).toBe(200);
      expect(res.body.task).toHaveProperty('title', 'Updated Task Title');
    });

    it('should update task status', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in_progress',
        });

      expect(res.status).toBe(200);
      expect(res.body.task).toHaveProperty('status', 'in_progress');
    });

    it('should update task links', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          links: [
            { text: 'Test link', created_at: new Date().toISOString() },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.task.links).toHaveLength(1);
    });

    it('should allow updating completed task links', async () => {
      // First complete the task
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      // Then try to update links
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          links: [
            { text: 'Link in completed task', created_at: new Date().toISOString() },
          ],
        });

      expect(res.status).toBe(200);
    });

    it('should reject updating completed task other fields', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Should not work',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/tasks/link', () => {
    let task2Id;

    beforeAll(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          groupId,
          priorityId,
          title: 'Task 2',
          date: dateStr,
        });

      task2Id = res.body.task.id;
    });

    afterAll(async () => {
      if (task2Id) await pool.query('DELETE FROM tasks WHERE id = $1', [task2Id]);
    });

    it('should link two tasks', async () => {
      const res = await request(app)
        .post('/api/tasks/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId1: taskId,
          taskId2: task2Id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject linking task to itself', async () => {
      const res = await request(app)
        .post('/api/tasks/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId1: taskId,
          taskId2: taskId,
        });

      expect(res.status).toBe(400);
    });

    it('should reject linking without required IDs', async () => {
      const res = await request(app)
        .post('/api/tasks/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId1: taskId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);

      taskId = null; // Prevent cleanup of already deleted task
    });
  });
});
