import express from 'express';
import eventsController from '../controllers/eventsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Валидация для создания события
const createEventValidation = [
  body('type').notEmpty().isIn(['birthday', 'holiday', 'anniversary']).withMessage('Некорректный тип события'),
  body('name').notEmpty().trim().escape().isLength({ max: 255 }).withMessage('Название обязательно'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть от 1 до 12'),
  body('day').optional().isInt({ min: 1, max: 31 }).withMessage('День должен быть от 1 до 31'),
  body('date').optional().isISO8601().withMessage('Некорректная дата'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Некорректное время начала'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Некорректное время окончания'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Некорректный цвет'),
];

// Валидация для обновления события
const updateEventValidation = [
  param('id').isInt({ min: 1 }).withMessage('Некорректный ID события'),
  body('type').optional().isIn(['birthday', 'holiday', 'anniversary']).withMessage('Некорректный тип события'),
  body('name').optional().trim().escape().isLength({ max: 255 }).withMessage('Название слишком длинное'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть от 1 до 12'),
  body('day').optional().isInt({ min: 1, max: 31 }).withMessage('День должен быть от 1 до 31'),
  body('date').optional().isISO8601().withMessage('Некорректная дата'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Некорректное время начала'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Некорректное время окончания'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Некорректный цвет'),
];

// Получить все события пользователя
router.get('/', eventsController.getEvents);

// Получить события за конкретный месяц
router.get('/month/:month',
  param('month').isInt({ min: 1, max: 12 }),
  validate,
  eventsController.getEventsByMonth
);

// Получить события за конкретный день
router.get('/date/:month/:day',
  param('month').isInt({ min: 1, max: 12 }),
  param('day').isInt({ min: 1, max: 31 }),
  validate,
  eventsController.getEventsByDate
);

// Получить одно событие
router.get('/:id',
  param('id').isInt({ min: 1 }),
  validate,
  eventsController.getEventById
);

// Создать событие
router.post('/', createEventValidation, validate, eventsController.createEvent);

// Обновить событие
router.put('/:id', updateEventValidation, validate, eventsController.updateEvent);

// Удалить событие
router.delete('/:id',
  param('id').isInt({ min: 1 }),
  validate,
  eventsController.deleteEvent
);

// Работа с заметками для события за год
router.get('/:eventId/notes',
  param('eventId').isInt({ min: 1 }),
  validate,
  eventsController.getEventYearNotes
);

router.post('/:eventId/notes',
  param('eventId').isInt({ min: 1 }),
  body('year').isInt({ min: 1900, max: 2100 }),
  body('note').notEmpty().trim().escape(),
  validate,
  eventsController.upsertEventYearNote
);

router.delete('/:eventId/notes/:noteId',
  param('eventId').isInt({ min: 1 }),
  param('noteId').isInt({ min: 1 }),
  validate,
  eventsController.deleteEventYearNote
);

export default router;
