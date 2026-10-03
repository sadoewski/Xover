import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Валидация для регистрации
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 }).withMessage('Username должен быть от 3 до 50 символов')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username может содержать только буквы, цифры и подчеркивание')
    .trim(),
  body('password')
    .isLength({ min: 8 }).withMessage('Пароль должен быть минимум 8 символов')
    .matches(/[A-Z]/).withMessage('Пароль должен содержать хотя бы одну заглавную букву')
    .matches(/[a-z]/).withMessage('Пароль должен содержать хотя бы одну строчную букву')
    .matches(/[0-9]/).withMessage('Пароль должен содержать хотя бы одну цифру'),
  body('name').notEmpty().trim().escape().withMessage('Имя обязательно'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail().withMessage('Некорректный email'),
  body('avatar_url').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('Некорректный URL аватара'),
];

// Валидация для входа
const loginValidation = [
  body('username').notEmpty().trim().withMessage('Username обязателен'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

// Валидация для обновления профиля
const updateProfileValidation = [
  body('name').optional().notEmpty().trim().escape().withMessage('Имя не может быть пустым'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail().withMessage('Некорректный email'),
  body('avatar_url').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('Некорректный URL аватара'),
];

// Валидация для смены пароля
const changePasswordValidation = [
  body('old_password').notEmpty().withMessage('Старый пароль обязателен'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('Новый пароль должен быть минимум 8 символов')
    .matches(/[A-Z]/).withMessage('Новый пароль должен содержать хотя бы одну заглавную букву')
    .matches(/[a-z]/).withMessage('Новый пароль должен содержать хотя бы одну строчную букву')
    .matches(/[0-9]/).withMessage('Новый пароль должен содержать хотя бы одну цифру'),
];

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, updateProfileValidation, validate, authController.updateProfile);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);
router.post('/change-password', authMiddleware, changePasswordValidation, validate, authController.changePassword);

export default router;
