/**
 * Преобразует технические ошибки API в понятные пользователю сообщения на русском языке
 */
export const mapErrorToUserFriendly = (error) => {
  // Network errors
  if (error.message === 'Network Error') {
    return 'Нет подключения к интернету. Проверьте сеть и попробуйте снова.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Превышено время ожидания. Попробуйте еще раз.';
  }

  // HTTP status codes
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message || '';
  const serverError = error.response?.data?.error || '';

  // 401 - Unauthorized
  if (status === 401) {
    if (serverMessage.toLowerCase().includes('password') ||
        serverMessage.toLowerCase().includes('credentials')) {
      return 'Неверный логин или пароль';
    }
    return 'Требуется авторизация. Войдите в систему.';
  }

  // 403 - Forbidden
  if (status === 403) {
    return 'У вас нет доступа к этому ресурсу';
  }

  // 404 - Not Found
  if (status === 404) {
    return 'Запрашиваемые данные не найдены';
  }

  // 422 - Validation Error
  if (status === 422) {
    return 'Проверьте правильность заполнения полей';
  }

  // 429 - Too Many Requests
  if (status === 429) {
    return 'Слишком много попыток. Попробуйте через несколько минут.';
  }

  // Database errors
  if (serverMessage.includes('foreign key') ||
      serverMessage.includes('FOREIGN KEY') ||
      serverError.includes('foreign key')) {
    return 'Невозможно удалить: используется в других местах';
  }

  if (serverMessage.includes('unique constraint') ||
      serverMessage.includes('UNIQUE') ||
      serverMessage.includes('duplicate key') ||
      serverError.includes('unique')) {
    return 'Такая запись уже существует';
  }

  if (serverMessage.includes('not null constraint') ||
      serverMessage.includes('NOT NULL')) {
    return 'Заполните все обязательные поля';
  }

  // JWT errors
  if (serverMessage.includes('token') ||
      serverMessage.includes('jwt') ||
      serverMessage.includes('expired')) {
    return 'Сессия истекла. Войдите в систему заново.';
  }

  // 500 - Server Error
  if (status >= 500) {
    return 'Ошибка сервера. Попробуйте позже или обратитесь в поддержку.';
  }

  // Если есть понятное сообщение от сервера на русском - показать его
  if (serverMessage && /[а-яА-Я]/.test(serverMessage)) {
    return serverMessage;
  }

  // Default generic message
  return 'Произошла ошибка. Попробуйте еще раз.';
};

/**
 * Проверяет является ли ошибка сетевой (отсутствие интернета)
 */
export const isNetworkError = (error) => {
  return error.message === 'Network Error' || error.code === 'ECONNABORTED';
};

/**
 * Проверяет является ли ошибка проблемой авторизации
 */
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Извлекает детали ошибки для логирования (не показывается пользователю)
 */
export const getErrorDetails = (error) => {
  return {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method
  };
};
