// API URL utilities
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || '/api';
};

export const getBaseUrl = () => {
  // В dev режиме с Vite proxy используем относительные пути
  // В production используем полный URL если нужен
  if (import.meta.env.DEV) {
    return '';
  }
  return import.meta.env.VITE_BASE_URL || '';
};

export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;

  // Если путь уже полный URL, возвращаем как есть
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Иначе добавляем base URL
  return `${getBaseUrl()}${avatarPath}`;
};

export const getUploadUrl = (uploadPath) => {
  if (!uploadPath) return null;

  if (uploadPath.startsWith('http://') || uploadPath.startsWith('https://')) {
    return uploadPath;
  }

  return `${getBaseUrl()}${uploadPath}`;
};
