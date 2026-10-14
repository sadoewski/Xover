import express from 'express';
import { terminalController } from '../controllers/terminalController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All terminal routes require authentication
router.use(authMiddleware);

// Board/Dashboard
router.get('/board', terminalController.getBoard);

// Tasks
router.get('/tasks/date', terminalController.getTasksByDate);
router.get('/tasks/range', terminalController.getTasksInRange);
router.get('/tasks/:id', terminalController.getTaskDetails);
router.put('/tasks/:id/status', terminalController.updateTaskStatus);
router.delete('/tasks/:id', terminalController.deleteTask);

// Task links
router.get('/tasks/:id/links', terminalController.getTaskLinks);
router.post('/tasks/:id/links', terminalController.addTaskLink);
router.delete('/tasks/:id/links/:linkId', terminalController.deleteTaskLink);

// TaskBases
router.get('/taskbases', terminalController.getTaskBases);

// Events
router.get('/events', terminalController.getEvents);

export default router;
