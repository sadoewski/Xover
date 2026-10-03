import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем axios перед импортом модулей, которые его используют
const mockAxios = {
  create: vi.fn(() => mockAxios),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: mockAxios,
}));

// Теперь импортируем сервисы после мока
const { tasksService, groupsService, prioritiesService } = await import('../services/api');

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tasksService', () => {
    it('getTasksByDate возвращает задачи для даты', async () => {
      const mockResponse = {
        data: {
          tasks: [
            { id: 1, title: 'Задача 1', scheduled_date: '2026-09-27' },
            { id: 2, title: 'Задача 2', scheduled_date: '2026-09-27' },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await tasksService.getTasksByDate('2026-09-27');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/date/2026-09-27');
      expect(result).toEqual(mockResponse.data);
      expect(result.tasks).toHaveLength(2);
    });

    it('createTask отправляет POST запрос', async () => {
      const newTask = {
        title: 'Новая задача',
        description: 'Описание',
        scheduled_date: '2026-09-27',
        priority_id: 1,
        group_id: 1,
      };

      const mockResponse = {
        data: { id: 3, ...newTask },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await tasksService.createTask(newTask);

      expect(mockAxios.post).toHaveBeenCalledWith('/tasks', newTask);
      expect(result).toEqual(mockResponse.data);
    });

    it('updateTask отправляет PUT запрос', async () => {
      const updates = { status: 'completed' };
      const mockResponse = {
        data: { id: 1, status: 'completed' },
      };

      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await tasksService.updateTask(1, updates);

      expect(mockAxios.put).toHaveBeenCalledWith('/tasks/1', updates);
      expect(result).toEqual(mockResponse.data);
    });

    it('deleteTask отправляет DELETE запрос', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await tasksService.deleteTask(1);

      expect(mockAxios.delete).toHaveBeenCalledWith('/tasks/1');
    });
  });

  describe('groupsService', () => {
    it('getGroups возвращает список групп', async () => {
      const mockResponse = {
        data: {
          groups: [
            { id: 1, name: 'Работа', color: '#3B82F6' },
            { id: 2, name: 'Личное', color: '#10B981' },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await groupsService.getGroups();

      expect(mockAxios.get).toHaveBeenCalledWith('/groups');
      expect(result.groups).toHaveLength(2);
    });

    it('createGroup создает новую группу', async () => {
      const newGroup = { name: 'Новая группа', color: '#EF4444' };
      const mockResponse = {
        data: { id: 3, ...newGroup },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await groupsService.createGroup(newGroup);

      expect(mockAxios.post).toHaveBeenCalledWith('/groups', newGroup);
      expect(result).toEqual(mockResponse.data);
    });

    it('deleteGroup отправляет DELETE запрос', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await groupsService.deleteGroup(1);

      expect(mockAxios.delete).toHaveBeenCalledWith('/groups/1');
    });

    it('deleteType отправляет DELETE запрос для типа', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await groupsService.deleteType(5);

      expect(mockAxios.delete).toHaveBeenCalledWith('/groups/types/5');
    });

    it('createType создает новый тип группы', async () => {
      const newType = { group_id: 1, name: 'Новый тип' };
      const mockResponse = {
        data: { groupType: { id: 10, ...newType } },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await groupsService.createType(newType);

      expect(mockAxios.post).toHaveBeenCalledWith('/groups/1/types', newType);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('prioritiesService', () => {
    it('getPriorities возвращает список приоритетов', async () => {
      const mockResponse = {
        data: {
          priorities: [
            { id: 1, name: 'Высокий', color: '#EF4444', level: 1 },
            { id: 2, name: 'Средний', color: '#F59E0B', level: 2 },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await prioritiesService.getPriorities();

      expect(mockAxios.get).toHaveBeenCalledWith('/priorities');
      expect(result.priorities).toHaveLength(2);
    });

    it('createPriority создает новый приоритет', async () => {
      const newPriority = { name: 'Низкий', color: '#10B981', level: 3 };
      const mockResponse = {
        data: { id: 3, ...newPriority },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await prioritiesService.createPriority(newPriority);

      expect(mockAxios.post).toHaveBeenCalledWith('/priorities', newPriority);
      expect(result).toEqual(mockResponse.data);
    });

    it('deletePriority отправляет DELETE запрос', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await prioritiesService.deletePriority(2);

      expect(mockAxios.delete).toHaveBeenCalledWith('/priorities/2');
    });
  });
});
