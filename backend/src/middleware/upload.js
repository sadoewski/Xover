import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Whitelist разрешенных MIME типов
const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    // Безопасная генерация имени файла без данных от пользователя
    const randomName = crypto.randomBytes(16).toString('hex');

    // Берем расширение из MIME типа, не из originalname (защита от path traversal)
    const extension = ALLOWED_MIME_TYPES[file.mimetype] || '.bin';

    cb(null, `avatar-${randomName}${extension}`);
  }
});

// Строгий фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Проверка MIME типа по whitelist
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(new Error('Недопустимый тип файла. Разрешены только изображения: JPEG, PNG, GIF, WebP'));
  }

  // Дополнительная проверка расширения (защита от MIME spoofing)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!allowedExts.includes(ext)) {
    return cb(new Error('Недопустимое расширение файла'));
  }

  cb(null, true);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Только один файл за раз
  },
  fileFilter: fileFilter
});
