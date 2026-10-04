import request from 'supertest';
import app from '../../src/index.js';
import pool from '../../src/config/database.js';

describe('Sync Integration Tests', () => {
  let authToken;
  let userId;

  // Set up test user before all tests
  beforeAll(async () => {
    // Clean up any existing test data
    await pool.query("DELETE FROM users WHERE username = 'syncuser'");

    // Register test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'syncuser',
        password: 'Password123',
        name: 'Sync Test User',
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  // Clean up test data after each test
  afterEach(async () => {
    await pool.query('DELETE FROM events WHERE user_id = $1', [userId]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE username = $1', ['syncuser']);
    await pool.end();
  });

  describe('GET /api/sync/status', () => {
    it('should return sync status without authentication error', async () => {
      const response = await request(app)
        .get('/api/sync/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('connected', true);
      expect(response.body).toHaveProperty('serverTime');
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/sync/status');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sync/push', () => {
    it('should successfully push insert operations', async () => {
      const timestamp = new Date().toISOString();
      const currentYear = new Date().getFullYear();
      const operations = [
        {
          table: 'events',
          action: 'insert',
          data: {
            type: 'birthday',
            name: 'Test Birthday',
            month: 5,
            day: 15,
            date: `${currentYear}-05-15`,
            is_yearly: true,
          },
          timestamp,
        },
      ];

      const response = await request(app)
        .post('/api/sync/push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ operations });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('synced');
      expect(response.body).toHaveProperty('conflicts');
      expect(response.body.synced.length).toBe(1);
      expect(response.body.conflicts.length).toBe(0);
      expect(response.body.summary.total).toBe(1);
      expect(response.body.summary.synced).toBe(1);
    });

    it('should detect conflicts with newer server data', async () => {
      const currentYear = new Date().getFullYear();
      // First, create an event directly in the database
      const eventResult = await pool.query(
        `INSERT INTO events (user_id, type, name, month, day, date, is_yearly, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING id, updated_at`,
        [userId, 'holiday', 'Existing Holiday', 12, 25, `${currentYear}-12-25`, true]
      );

      const eventId = eventResult.rows[0].id;

      // Try to update with an older timestamp
      const oldTimestamp = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      const operations = [
        {
          table: 'events',
          action: 'update',
          data: {
            id: eventId,
            name: 'Updated Holiday',
            month: 12,
            day: 26,
            date: `${currentYear}-12-26`,
          },
          timestamp: oldTimestamp,
        },
      ];

      const response = await request(app)
        .post('/api/sync/push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ operations });

      expect(response.status).toBe(200);
      expect(response.body.conflicts.length).toBe(1);
      expect(response.body.conflicts[0].reason).toContain('новее');
      expect(response.body.synced.length).toBe(0);
    });

    it('should reject operations with invalid table names', async () => {
      const timestamp = new Date().toISOString();
      const operations = [
        {
          table: 'invalid_table',
          action: 'insert',
          data: { test: 'data' },
          timestamp,
        },
      ];

      const response = await request(app)
        .post('/api/sync/push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ operations });

      expect(response.status).toBe(200);
      expect(response.body.conflicts.length).toBe(1);
      expect(response.body.conflicts[0].reason).toContain('Недопустимая таблица');
    });

    it('should reject operations with missing required fields', async () => {
      const operations = [
        {
          table: 'events',
          action: 'insert',
          // Missing data and timestamp
        },
      ];

      const response = await request(app)
        .post('/api/sync/push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ operations });

      expect(response.status).toBe(400);
    });

    it('should successfully delete records', async () => {
      const currentYear = new Date().getFullYear();
      // First, create an event
      const eventResult = await pool.query(
        `INSERT INTO events (user_id, type, name, month, day, date, is_yearly)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, 'anniversary', 'Event to Delete', 7, 10, `${currentYear}-07-10`, true]
      );

      const eventId = eventResult.rows[0].id;

      // Now delete it via sync
      const timestamp = new Date().toISOString();
      const operations = [
        {
          table: 'events',
          action: 'delete',
          data: { id: eventId },
          timestamp,
        },
      ];

      const response = await request(app)
        .post('/api/sync/push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ operations });

      expect(response.status).toBe(200);
      expect(response.body.synced.length).toBe(1);

      // Verify event was deleted
      const checkResult = await pool.query(
        'SELECT * FROM events WHERE id = $1',
        [eventId]
      );
      expect(checkResult.rows.length).toBe(0);
    });
  });

  describe('POST /api/sync/pull', () => {
    it('should pull changes since last sync', async () => {
      const currentYear = new Date().getFullYear();
      // Create some events
      await pool.query(
        `INSERT INTO events (user_id, type, name, month, day, date, is_yearly)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, 'birthday', 'Birthday 1', 3, 15, `${currentYear}-03-15`, true]
      );

      await pool.query(
        `INSERT INTO events (user_id, type, name, month, day, date, is_yearly)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, 'holiday', 'Holiday 1', 12, 31, `${currentYear}-12-31`, true]
      );

      // Use an old timestamp to get all changes
      const lastSyncTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const response = await request(app)
        .post('/api/sync/pull')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ lastSyncTimestamp });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('operations');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.operations)).toBe(true);
      expect(response.body.operations.length).toBeGreaterThanOrEqual(2);

      // Check that operations have proper structure
      const eventOperations = response.body.operations.filter(op => op.table === 'events');
      expect(eventOperations.length).toBeGreaterThanOrEqual(2);

      eventOperations.forEach(op => {
        expect(op).toHaveProperty('table');
        expect(op).toHaveProperty('action');
        expect(op).toHaveProperty('data');
        expect(op).toHaveProperty('timestamp');
      });
    });

    it('should return empty operations for recent sync', async () => {
      // Use current timestamp - no changes should be returned
      const lastSyncTimestamp = new Date().toISOString();

      const response = await request(app)
        .post('/api/sync/pull')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ lastSyncTimestamp });

      expect(response.status).toBe(200);
      expect(response.body.operations).toEqual([]);
    });

    it('should reject pull without lastSyncTimestamp', async () => {
      const response = await request(app)
        .post('/api/sync/pull')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
