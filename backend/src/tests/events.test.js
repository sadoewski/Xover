import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import pool from '../config/database.js';

describe('Events API', () => {
  let authToken;
  let userId;
  let eventId;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testevents${Date.now()}`,
        email: `test-events-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Test User',
      });

    authToken = userRes.body.token;
    userId = userRes.body.user.id;
  });

  afterAll(async () => {
    if (eventId) await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    if (userId) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /api/events', () => {
    it('should create a new event with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'holiday',
          name: 'Test Event',
          date: dateStr,
          isYearly: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.event).toHaveProperty('id');
      expect(res.body.event).toHaveProperty('name', 'Test Event');
      expect(res.body.event).toHaveProperty('type', 'holiday');

      eventId = res.body.event.id;
    });

    it('should reject event creation without auth', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/events')
        .send({
          type: 'holiday',
          name: 'Test Event',
          date: dateStr,
          isYearly: false,
        });

      expect(res.status).toBe(401);
    });

    it('should reject event without required fields', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Event',
        });

      expect(res.status).toBe(400);
    });

    it('should reject event with invalid type', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'invalid-type',
          name: 'Test Event',
          date: dateStr,
          isYearly: false,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/events', () => {
    it('should get all events for authenticated user', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toBeInstanceOf(Array);
      expect(res.body.events.length).toBeGreaterThan(0);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/events');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event name', async () => {
      const res = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Event Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.event).toHaveProperty('name', 'Updated Event Name');
    });

    it('should update event type', async () => {
      const res = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'birthday',
        });

      expect(res.status).toBe(200);
      expect(res.body.event).toHaveProperty('type', 'birthday');
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(app)
        .put('/api/events/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedEvent = getRes.body.events.find(e => e.id === eventId);
      expect(deletedEvent).toBeUndefined();

      eventId = null;
    });
  });
});

