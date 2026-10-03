import express from 'express';
import { datatasksController } from '../controllers/datatasksController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для создания datatask
const createDatataskValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('groupId').isInt().withMessage('ID группы обязателен'),
  body('dates').isArray({ min: 1 }).withMessage('Необходимо выбрать хотя бы одну дату'),
  body('isTimeBound').optional().isBoolean(),
];

// Получить все datatasks
router.get('/', authMiddleware, datatasksController.getAllDatatasks);

// Получить datatask по ID
router.get('/:id', authMiddleware, datatasksController.getDatataskById);

// Создать новый datatask
router.post('/', authMiddleware, createDatataskValidation, validate, datatasksController.createDatatask);

// Обновить datatask
router.put('/:id', authMiddleware, datatasksController.updateDatatask);

// Удалить datatask
router.delete('/:id', authMiddleware, datatasksController.deleteDatatask);

// Добавить дату в datatask
router.post('/:id/dates', authMiddleware, [
  body('date').isDate().withMessage('Некорректная дата'),
], validate, datatasksController.addDate);

// Удалить дату из datatask
router.delete('/:id/dates/:date', authMiddleware, datatasksController.removeDate);

// Обновить статус даты
router.put('/:id/dates/:date/status', authMiddleware, [
  body('status').notEmpty().withMessage('Статус обязателен'),
], validate, datatasksController.updateDateStatus);

export default router;
