/**
 * Global error logger and user notification system
 * Catches unhandled errors and shows user-friendly messages
 */

let notificationCallback = null;
let errorHandler = null;
let rejectionHandler = null;

export function setNotificationCallback(callback) {
  notificationCallback = callback;
}

function getUserFriendlyMessage(error) {
  const errorStr = error?.toString() || '';
  const errorMessage = error?.message || '';

  // Network errors
  if (errorStr.includes('NetworkError') || errorStr.includes('Failed to fetch') ||
      errorMessage.includes('Network') || errorMessage.includes('fetch')) {
    return {
      title: 'Ошибка подключения',
      message: 'Не удалось подключиться к серверу. Проверьте интернет соединение.',
      type: 'error'
    };
  }

  // Auth errors
  if (errorStr.includes('401') || errorStr.includes('Unauthorized') ||
      errorMessage.includes('auth') || errorMessage.includes('token')) {
    return {
      title: 'Ошибка авторизации',
      message: 'Ваша сессия истекла. Пожалуйста, войдите заново.',
      type: 'error'
    };
  }

  // 403 Forbidden
  if (errorStr.includes('403') || errorStr.includes('Forbidden')) {
    return {
      title: 'Доступ запрещен',
      message: 'У вас нет прав для выполнения этого действия.',
      type: 'error'
    };
  }

  // 404 Not Found
  if (errorStr.includes('404') || errorStr.includes('Not Found')) {
    return {
      title: 'Не найдено',
      message: 'Запрашиваемый ресурс не найден.',
      type: 'error'
    };
  }

  // 500 Server Error
  if (errorStr.includes('500') || errorStr.includes('Internal Server Error')) {
    return {
      title: 'Ошибка сервера',
      message: 'Произошла ошибка на сервере. Попробуйте позже.',
      type: 'error'
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      title: 'Превышено время ожидания',
      message: 'Сервер не ответил вовремя. Попробуйте еще раз.',
      type: 'error'
    };
  }

  // Generic error
  return {
    title: 'Произошла ошибка',
    message: 'Что-то пошло не так. Попробуйте обновить страницу.',
    type: 'error'
  };
}

export function initErrorLogger() {
  // Remove old listeners if they exist
  if (errorHandler) {
    window.removeEventListener('error', errorHandler);
  }
  if (rejectionHandler) {
    window.removeEventListener('unhandledrejection', rejectionHandler);
  }

  // Handle unhandled promise rejections
  rejectionHandler = (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    const friendlyError = getUserFriendlyMessage(event.reason);

    // Show notification if callback is set
    if (notificationCallback) {
      notificationCallback(friendlyError.message, friendlyError.type);
    }

    // Prevent default error display in console
    event.preventDefault();
  };

  // Handle global errors
  errorHandler = (event) => {
    console.error('Global error:', event.error);

    const friendlyError = getUserFriendlyMessage(event.error);

    // Show notification if callback is set
    if (notificationCallback) {
      notificationCallback(friendlyError.message, friendlyError.type);
    }

    // Don't prevent default - let ErrorBoundary handle React errors
  };

  window.addEventListener('unhandledrejection', rejectionHandler);
  window.addEventListener('error', errorHandler);

  console.log('✅ Error logger initialized');
}

export function cleanupErrorLogger() {
  if (errorHandler) {
    window.removeEventListener('error', errorHandler);
    errorHandler = null;
  }
  if (rejectionHandler) {
    window.removeEventListener('unhandledrejection', rejectionHandler);
    rejectionHandler = null;
  }
  notificationCallback = null;
  console.log('✅ Error logger cleaned up');
}

export function logError(error, context = '') {
  console.error(`Error in ${context}:`, error);

  const friendlyError = getUserFriendlyMessage(error);

  if (notificationCallback) {
    notificationCallback(friendlyError.message, friendlyError.type);
  }
}
