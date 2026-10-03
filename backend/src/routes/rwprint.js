import express from 'express';
import { rwprintController } from '../controllers/rwprintController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// === ENVIRONMENTS ===
router.get('/environments', rwprintController.getEnvironments);
router.post('/environments', rwprintController.createEnvironment);
router.put('/environments/:id', rwprintController.updateEnvironment);
router.delete('/environments/:id', rwprintController.deleteEnvironment);

// === FOLDERS ===
router.get('/environments/:environmentId/folders', rwprintController.getFolders);
router.post('/environments/:environmentId/folders', rwprintController.createFolder);
router.put('/folders/:id', rwprintController.updateFolder);
router.delete('/folders/:id', rwprintController.deleteFolder);

// === DOCUMENTS ===
router.get('/environments/:environmentId/documents', rwprintController.getDocuments);
router.post('/environments/:environmentId/documents', rwprintController.createDocument);
router.post('/documents/:id', rwprintController.getDocumentById); // POST для пароля
router.put('/documents/:id', rwprintController.updateDocument);
router.delete('/documents/:id', rwprintController.deleteDocument);

// === TAGS ===
router.get('/environments/:environmentId/tags', rwprintController.getTags);
router.post('/environments/:environmentId/tags', rwprintController.createTag);
router.delete('/tags/:id', rwprintController.deleteTag);

// Document-Tag Relations
router.post('/documents/:documentId/tags/:tagId', rwprintController.addTagToDocument);
router.delete('/documents/:documentId/tags/:tagId', rwprintController.removeTagFromDocument);
router.get('/documents/:documentId/tags', rwprintController.getDocumentTags);

// === METADATA ===
router.get('/documents/:documentId/metadata', rwprintController.getDocumentMetadata);
router.post('/documents/:documentId/metadata', rwprintController.setDocumentMetadata);
router.delete('/documents/:documentId/metadata/:key', rwprintController.deleteDocumentMetadata);

// === BOOKMARKS ===
router.get('/bookmarks', rwprintController.getAllBookmarks);

// === STORAGE STATS ===
router.get('/stats/storage', rwprintController.getStorageStats);

export default router;
