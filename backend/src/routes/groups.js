import express from 'express';
import { groupsController } from '../controllers/groupsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для создания группы
const createGroupValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Некорректный формат цвета'),
];

// Валидация для обновления группы
const updateGroupValidation = [
  body('name').optional().notEmpty().trim().withMessage('Название не может быть пустым'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Некорректный формат цвета'),
];

// Валидация для создания вида группы
const createGroupTypeValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
];

router.get('/', authMiddleware, groupsController.getGroups);
router.post('/', authMiddleware, createGroupValidation, validate, groupsController.createGroup);
router.get('/:id', authMiddleware, groupsController.getGroupById);
router.put('/:id', authMiddleware, updateGroupValidation, validate, groupsController.updateGroup);
router.delete('/:id', authMiddleware, groupsController.deleteGroup);
router.post('/:groupId/types', authMiddleware, createGroupTypeValidation, validate, groupsController.createGroupType);
router.delete('/types/:id', authMiddleware, groupsController.deleteGroupType);

export default router;
