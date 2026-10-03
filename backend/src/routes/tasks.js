import express from 'express';
import { tasksController } from '../controllers/tasksController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для создания записи
const createTaskValidation = [
  body('groupId').isInt().withMessage('ID группы обязателен'),
  body('priorityId').isInt().withMessage('ID приоритета обязателен'),
  body('title').notEmpty().withMessage('Название обязательно'),
  body('date')
    .isDate().withMessage('Некорректная дата')
    .custom((value) => {
      const taskDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (taskDate < today) {
        throw new Error('Нельзя создавать задачи на прошедшие даты');
      }
      return true;
    }),
  body('isTimeBound').optional().isBoolean(),
];

router.get('/date/:date', authMiddleware, tasksController.getTasksByDate);
router.get('/:id', authMiddleware, tasksController.getTaskById);
router.get('/:id/logs', authMiddleware, tasksController.getTaskLogs);
router.post('/', authMiddleware, createTaskValidation, validate, tasksController.createTask);
router.put('/:id', authMiddleware, tasksController.updateTask);
router.delete('/:id', authMiddleware, tasksController.deleteTask);

// Получить задачи по массиву ID
router.post('/by-ids', authMiddleware, tasksController.getTasksByIds);

// Связать две задачи
router.post('/link', authMiddleware, [
  body('taskId1').isInt().withMessage('Некорректный ID первой задачи'),
  body('taskId2').isInt().withMessage('Некорректный ID второй задачи'),
], validate, tasksController.linkTasks);

// Удалить связь между задачами
router.post('/unlink', authMiddleware, [
  body('taskId1').isInt().withMessage('Некорректный ID первой задачи'),
  body('taskId2').isInt().withMessage('Некорректный ID второй задачи'),
], validate, tasksController.unlinkTasks);

export default router;
