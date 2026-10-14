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

// Валидация для обновления записи
const updateTaskValidation = [
  body('groupId').optional().isInt().withMessage('ID группы должен быть числом'),
  body('priorityId').optional().isInt().withMessage('ID приоритета должен быть числом'),
  body('title').optional().notEmpty().withMessage('Название не может быть пустым'),
  body('date')
    .optional()
    .isDate().withMessage('Некорректная дата'),
  body('isTimeBound').optional().isBoolean(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Некорректный статус'),
];

router.get('/', authMiddleware, tasksController.getAllTasks);
router.get('/date/:date', authMiddleware, tasksController.getTasksByDate);
router.get('/group/:groupId', authMiddleware, tasksController.getTasksByGroup);
router.get('/priority/:priorityId', authMiddleware, tasksController.getTasksByPriority);
router.get('/:id', authMiddleware, tasksController.getTaskById);
router.get('/:id/logs', authMiddleware, tasksController.getTaskLogs);
router.post('/', authMiddleware, createTaskValidation, validate, tasksController.createTask);
router.put('/:id', authMiddleware, updateTaskValidation, validate, tasksController.updateTask);
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
