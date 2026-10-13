/**
 * Глобальный обработчик необработанных ошибок и promise rejections
 * Показывает понятные сообщения пользователю через Toast
 */

let toastFunction = null;

export const setGlobalErrorToast = (showToast) => {
  toastFunction = showToast;
};

/**
 * Инициализирует глобальные обработчики ошибок
 */
export const initGlobalErrorHandlers = () => {
  // Обработчик необработанных ошибок (window.onerror)
  window.addEventListener('error', (event) => {
    console.error('Необработанная ошибка:', event.error);

    // Игнорируем ошибки от расширений браузера
    if (event.filename && (
      event.filename.includes('chrome-extension://') ||
      event.filename.includes('moz-extension://') ||
      event.filename.includes('safari-extension://')
    )) {
      return;
    }

    // Игнорируем ResizeObserver loop errors (безопасные)
    if (event.message && event.message.includes('ResizeObserver')) {
      return;
    }

    // Показываем Toast если доступен
    if (toastFunction) {
      const errorMessage = getReadableErrorMessage(event.error || event.message);
      toastFunction(errorMessage, 'error');
    }
  });

  // Обработчик необработанных promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанное отклонение промиса:', event.reason);

    // Предотвращаем дефолтное поведение (вывод в консоль)
    event.preventDefault();

    // Показываем Toast если доступен
    if (toastFunction) {
      const errorMessage = getReadableErrorMessage(event.reason);
      toastFunction(errorMessage, 'error');
    }
  });

  console.log('✅ Глобальные обработчики ошибок инициализированы');
};

/**
 * Преобразует техническую ошибку в понятное сообщение
 */
function getReadableErrorMessage(error) {
  if (!error) {
    return 'Произошла неизвестная ошибка';
  }

  const errorStr = error.toString ? error.toString() : String(error);
  const errorMessage = error.message || errorStr;

  // Ошибки сети
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return 'Ошибка подключения к серверу. Проверьте интернет соединение.';
  }

  // Ошибки CORS
  if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
    return 'Ошибка доступа к ресурсу. Обратитесь к администратору.';
  }

  // Ошибки загрузки ресурсов
  if (errorMessage.includes('Failed to load') || errorMessage.includes('Loading chunk')) {
    return 'Ошибка загрузки ресурса. Попробуйте обновить страницу.';
  }

  // Ошибки рендеринга React
  if (errorMessage.includes('Minified React error') || errorMessage.includes('React')) {
    return 'Ошибка отображения компонента. Попробуйте обновить страницу.';
  }

  // Ошибки авторизации
  if (errorMessage.includes('401') || errorMessage.includes('403') ||
      errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
    return 'Сессия истекла. Войдите в систему заново.';
  }

  // Если ошибка содержит русский текст - показываем как есть
  if (/[а-яА-Я]/.test(errorMessage)) {
    return errorMessage;
  }

  // Для всех остальных - общее сообщение
  return 'Произошла ошибка. Попробуйте еще раз или обновите страницу.';
}

/**
 * Очищает обработчики (для тестов)
 */
export const cleanupGlobalErrorHandlers = () => {
  // Нельзя удалить обработчики добавленные через addEventListener напрямую
  // но можно обнулить toast функцию
  toastFunction = null;
};
