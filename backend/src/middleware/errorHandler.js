import { AppError } from '../utils/errors.js';

// Логирование ошибок
const logError = (err, req) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    error: {
      message: err.message,
      code: err.code,
      stack: err.stack,
    },
  };

  if (err.statusCode >= 500) {
    console.error('❌ Server Error:', JSON.stringify(logData, null, 2));
  } else {
    console.warn('⚠️  Client Error:', JSON.stringify(logData, null, 2));
  }
};

// Форматирование ответа с ошибкой
const formatErrorResponse = (err) => {
  const response = {
    error: {
      message: err.message,
      code: err.code || 'UNKNOWN_ERROR',
    },
  };

  // Добавляем детали для операционных ошибок
  if (err.isOperational && err.details) {
    response.error.details = err.details;
  }

  // В dev режиме добавляем stack trace
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  return response;
};

// Обработка специфичных ошибок PostgreSQL
const handleDatabaseError = (err) => {
  // Duplicate key violation
  if (err.code === '23505') {
    return {
      statusCode: 409,
      message: 'Resource already exists',
      code: 'DUPLICATE_KEY',
    };
  }

  // Foreign key violation
  if (err.code === '23503') {
    return {
      statusCode: 400,
      message: 'Referenced resource does not exist',
      code: 'FOREIGN_KEY_VIOLATION',
    };
  }

  // Not null violation
  if (err.code === '23502') {
    return {
      statusCode: 400,
      message: 'Required field is missing',
      code: 'NOT_NULL_VIOLATION',
    };
  }

  // Check constraint violation
  if (err.code === '23514') {
    return {
      statusCode: 400,
      message: 'Data validation failed',
      code: 'CHECK_VIOLATION',
    };
  }

  // Generic database error
  return {
    statusCode: 500,
    message: 'Database operation failed',
    code: 'DATABASE_ERROR',
  };
};

// Главный error handler middleware
const errorHandler = (err, req, res, next) => {
  // Логируем ошибку
  logError(err, req);

  let statusCode = err.statusCode || 500;
  let error = err;

  // Обрабатываем специфичные типы ошибок
  if (!err.isOperational) {
    // PostgreSQL ошибки
    if (err.code && err.code.startsWith('23')) {
      const dbError = handleDatabaseError(err);
      statusCode = dbError.statusCode;
      error = new AppError(dbError.message, dbError.statusCode, dbError.code);
    }
    // JWT ошибки
    else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    // Неизвестные ошибки
    else {
      statusCode = 500;
      error = new AppError(
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Internal server error',
        500,
        'INTERNAL_ERROR'
      );
    }
  }

  // Отправляем ответ
  res.status(statusCode).json(formatErrorResponse(error));
};

// 404 handler для несуществующих роутов
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

export { errorHandler, notFoundHandler };
