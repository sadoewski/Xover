import express from 'express';
import { prioritiesController } from '../controllers/prioritiesController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для создания приоритета
const createPriorityValidation = [
  body('name').notEmpty().trim().withMessage('Название обязательно'),
  body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Некорректный формат цвета'),
  body('level').optional().isInt({ min: 1 }).withMessage('Уровень должен быть положительным целым числом'),
];

// Валидация для обновления приоритета
const updatePriorityValidation = [
  body('name').optional().notEmpty().trim().withMessage('Название не может быть пустым'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Некорректный формат цвета'),
  body('level').optional().isInt({ min: 1 }).withMessage('Уровень должен быть положительным целым числом'),
];

router.get('/', authMiddleware, prioritiesController.getPriorities);
router.post('/', authMiddleware, createPriorityValidation, validate, prioritiesController.createPriority);
router.get('/:id', authMiddleware, prioritiesController.getPriorityById);
router.put('/:id', authMiddleware, updatePriorityValidation, validate, prioritiesController.updatePriority);
router.delete('/:id', authMiddleware, prioritiesController.deletePriority);

export default router;
