import express from 'express';
import { templatesController } from '../controllers/templatesController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для создания шаблона
const createTemplateValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
];

// Валидация для обновления шаблона
const updateTemplateValidation = [
  body('name').optional().notEmpty().trim().withMessage('Название не может быть пустым'),
];

router.get('/', authMiddleware, templatesController.getTemplates);
router.post('/', authMiddleware, createTemplateValidation, validate, templatesController.createTemplate);
router.get('/:id', authMiddleware, templatesController.getTemplateById);
router.put('/:id', authMiddleware, updateTemplateValidation, validate, templatesController.updateTemplate);
router.delete('/:id', authMiddleware, templatesController.deleteTemplate);

export default router;
