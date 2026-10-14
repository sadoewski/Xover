import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import Layout from '../components/Layout';

const ToastTestPage = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Toast Notification System - Тест
        </h1>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Базовые уведомления
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => showSuccess('Операция выполнена успешно!')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Success Toast
              </button>
              <button
                onClick={() => showError('Произошла ошибка при выполнении операции')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Error Toast
              </button>
              <button
                onClick={() => showWarning('Внимание! Это важное предупреждение')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Warning Toast
              </button>
              <button
                onClick={() => showInfo('Информация: система обновлена')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Info Toast
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Реальные сценарии
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => showSuccess('Задача создана успешно')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Задача создана
              </button>
              <button
                onClick={() => showError('Не удалось загрузить данные. Проверьте подключение.')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ошибка загрузки
              </button>
              <button
                onClick={() => showWarning('Невозможно удалить: используется в других местах')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Ошибка удаления
              </button>
              <button
                onClick={() => showInfo('Сохранение...')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Сохранение
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Множественные уведомления
            </h2>
            <button
              onClick={() => {
                showInfo('Начинается загрузка...');
                setTimeout(() => showWarning('Загрузка занимает больше времени чем обычно'), 1000);
                setTimeout(() => showSuccess('Загрузка завершена!'), 2000);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Показать последовательность
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Длинные сообщения
            </h2>
            <button
              onClick={() => showError('Ошибка при сохранении данных: сервер не отвечает. Проверьте подключение к интернету и попробуйте еще раз через несколько минут.')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Длинное сообщение
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            ℹ️ Информация о системе
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>✅ Уведомления автоматически исчезают через 5 секунд</li>
            <li>✅ Можно закрыть вручную кнопкой ×</li>
            <li>✅ Поддержка светлой и темной темы</li>
            <li>✅ Плавные анимации появления/исчезновения</li>
            <li>✅ Стек уведомлений в правом верхнем углу</li>
            <li>✅ Автоматическая интеграция с API errors</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ToastTestPage;
