import express from 'express';
const router = express.Router();
import * as sitesController from '../controllers/sitesController.js';
import { authMiddleware } from '../middleware/auth.js';

// Все роуты требуют аутентификации
router.use(authMiddleware);

// Сайты
router.get('/', sitesController.getSites);
router.post('/', sitesController.createSite);
router.get('/:id', sitesController.getSite);
router.put('/:id', sitesController.updateSite);
router.delete('/:id', sitesController.deleteSite);

// Элементы сайта
router.post('/:id/items', sitesController.createItem);
router.put('/:id/items/:itemId', sitesController.updateItem);
router.delete('/:id/items/:itemId', sitesController.deleteItem);

// Поиск
router.get('/:id/search', sitesController.searchSite);

export default router;
