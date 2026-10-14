import express from 'express';
import { taskbasesController } from '../controllers/taskbasesController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для создания taskbase
const createTaskBaseValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('groupId').isInt().withMessage('ID группы обязателен'),
  body('dates').isArray({ min: 1 }).withMessage('Необходимо выбрать хотя бы одну дату'),
  body('isTimeBound').optional().isBoolean(),
];

// Получить все taskbases
router.get('/', authMiddleware, taskbasesController.getAllTaskBases);

// Получить taskbase по ID
router.get('/:id', authMiddleware, taskbasesController.getTaskBaseById);

// Создать новый taskbase
router.post('/', authMiddleware, createTaskBaseValidation, validate, taskbasesController.createTaskBase);

// Обновить taskbase
router.put('/:id', authMiddleware, taskbasesController.updateTaskBase);

// Удалить taskbase
router.delete('/:id', authMiddleware, taskbasesController.deleteTaskBase);

// Добавить дату в taskbase
router.post('/:id/dates', authMiddleware, [
  body('date').isDate().withMessage('Некорректная дата'),
], validate, taskbasesController.addDate);

// Удалить дату из taskbase
router.delete('/:id/dates/:date', authMiddleware, taskbasesController.removeDate);

// Обновить статус даты
router.put('/:id/dates/:date/status', authMiddleware, [
  body('status').notEmpty().withMessage('Статус обязателен'),
], validate, taskbasesController.updateDateStatus);

export default router;
