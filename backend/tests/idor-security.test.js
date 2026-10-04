/**
 * IDOR (Insecure Direct Object Reference) Security Tests
 *
 * Проверяет что User A не может получить доступ к ресурсам User B
 */

import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/database.js';

describe('IDOR Security Tests', () => {
  let userAToken, userBToken;
  let userAId, userBId;
  let userAPriority, userBPriority;
  let userAGroup, userBGroup;
  let userATask, userBTask;
  let userAEvent, userBEvent;
  let userADataTask, userBDataTask;

  beforeAll(async () => {
    // Создаем двух пользователей
    const userA = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'userA_idor_test',
        email: 'usera@idor.test',
        password: 'password123',
        name: 'User A'
      });
    userAToken = userA.body.token;
    userAId = userA.body.user.id;

    const userB = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'userB_idor_test',
        email: 'userb@idor.test',
        password: 'password123',
        name: 'User B'
      });
    userBToken = userB.body.token;
    userBId = userB.body.user.id;

    // Создаем ресурсы для User A
    const priorityA = await request(app)
      .post('/api/priorities')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Priority A', color: '#FF0000', level: 1 });
    userAPriority = priorityA.body.priority.id;

    const groupA = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Group A', color: '#00FF00' });
    userAGroup = groupA.body.group.id;

    const taskA = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        groupId: userAGroup,
        priorityId: userAPriority,
        title: 'Task A',
        date: '2026-12-31'
      });
    userATask = taskA.body.task.id;

    const eventA = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Event A',
        type: 'meeting',
        month: 12,
        day: 25
      });
    userAEvent = eventA.body.event.id;

    const datataskA = await request(app)
      .post('/api/datatasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'DataTask A',
        groupId: userAGroup,
        dates: ['2026-12-31']
      });
    userADataTask = datataskA.body.datatask.id;

    // Создаем ресурсы для User B
    const priorityB = await request(app)
      .post('/api/priorities')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Priority B', color: '#0000FF', level: 1 });
    userBPriority = priorityB.body.priority.id;

    const groupB = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Group B', color: '#FFFF00' });
    userBGroup = groupB.body.group.id;

    const taskB = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        groupId: userBGroup,
        priorityId: userBPriority,
        title: 'Task B',
        date: '2026-12-31'
      });
    userBTask = taskB.body.task.id;

    const eventB = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Event B',
        type: 'meeting',
        month: 12,
        day: 26
      });
    userBEvent = eventB.body.event.id;

    const datataskB = await request(app)
      .post('/api/datatasks')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        name: 'DataTask B',
        groupId: userBGroup,
        dates: ['2026-12-31']
      });
    userBDataTask = datataskB.body.datatask.id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [userAId, userBId]);
    await pool.end();
  });

  describe('Priorities IDOR', () => {
    test('User A cannot read User B priority', async () => {
      const response = await request(app)
        .get(`/api/priorities/${userBPriority}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });

    test('User A cannot update User B priority', async () => {
      const response = await request(app)
        .put(`/api/priorities/${userBPriority}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Hacked Priority' });

      expect(response.status).toBe(404);
    });

    test('User A cannot delete User B priority', async () => {
      const response = await request(app)
        .delete(`/api/priorities/${userBPriority}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Groups IDOR', () => {
    test('User A cannot read User B group', async () => {
      const response = await request(app)
        .get(`/api/groups/${userBGroup}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });

    test('User A cannot update User B group', async () => {
      const response = await request(app)
        .put(`/api/groups/${userBGroup}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Hacked Group' });

      expect(response.status).toBe(404);
    });

    test('User A cannot delete User B group', async () => {
      const response = await request(app)
        .delete(`/api/groups/${userBGroup}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Tasks IDOR', () => {
    test('User A cannot read User B task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${userBTask}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });

    test('User A cannot update User B task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${userBTask}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Hacked Task' });

      expect(response.status).toBe(404);
    });

    test('User A cannot delete User B task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${userBTask}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Events IDOR', () => {
    test('User A cannot read User B event', async () => {
      const response = await request(app)
        .get(`/api/events/${userBEvent}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });

    test('User A cannot update User B event', async () => {
      const response = await request(app)
        .put(`/api/events/${userBEvent}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Hacked Event' });

      expect(response.status).toBe(404);
    });

    test('User A cannot delete User B event', async () => {
      const response = await request(app)
        .delete(`/api/events/${userBEvent}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DataTasks IDOR', () => {
    test('User A cannot read User B datatask', async () => {
      const response = await request(app)
        .get(`/api/datatasks/${userBDataTask}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });

    test('User A cannot update User B datatask', async () => {
      const response = await request(app)
        .put(`/api/datatasks/${userBDataTask}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Hacked DataTask' });

      expect(response.status).toBe(404);
    });

    test('User A cannot delete User B datatask', async () => {
      const response = await request(app)
        .delete(`/api/datatasks/${userBDataTask}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Listing endpoints isolation', () => {
    test('User A sees only their priorities', async () => {
      const response = await request(app)
        .get('/api/priorities')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.priorities.every(p => p.user_id === userAId)).toBe(true);
    });

    test('User A sees only their groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.groups.every(g => g.user_id === userAId)).toBe(true);
    });

    test('User A sees only their datatasks', async () => {
      const response = await request(app)
        .get('/api/datatasks')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.datatasks.every(d => d.user_id === userAId)).toBe(true);
    });
  });
});
