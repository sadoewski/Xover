import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Не делаем редирект здесь - пусть компоненты сами обрабатывают
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (username, password, name, email, avatar_url) => {
    const response = await api.post('/auth/register', { username, password, name, email, avatar_url });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  updateProfile: async (name, email) => {
    const response = await api.put('/auth/profile', { name, email });
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  changePassword: async (old_password, new_password) => {
    const response = await api.post('/auth/change-password', { old_password, new_password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export const tasksService = {
  getTasksByDate: async (date) => {
    const response = await api.get(`/tasks/date/${date}`);
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getTaskLogs: async (id) => {
    const response = await api.get(`/tasks/${id}/logs`);
    return response.data;
  },

  getTasksByIds: async (ids) => {
    const response = await api.post('/tasks/by-ids', { ids });
    return response.data;
  },

  linkTasks: async (taskId1, taskId2) => {
    const response = await api.post('/tasks/link', { taskId1, taskId2 });
    return response.data;
  },

  unlinkTasks: async (taskId1, taskId2) => {
    const response = await api.post('/tasks/unlink', { taskId1, taskId2 });
    return response.data;
  },
};

export const groupsService = {
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  deleteGroup: async (id) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  getGroupById: async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  getTypes: async () => {
    // Получаем все группы со встроенными типами
    const response = await api.get('/groups');
    const allTypes = [];
    response.data.groups.forEach(group => {
      if (group.types && Array.isArray(group.types)) {
        group.types.forEach(type => {
          allTypes.push({
            ...type,
            group_id: group.id,
          });
        });
      }
    });
    return { types: allTypes };
  },

  createType: async (typeData) => {
    const response = await api.post(`/groups/${typeData.group_id}/types`, typeData);
    return response.data;
  },

  deleteType: async (id) => {
    const response = await api.delete(`/groups/types/${id}`);
    return response.data;
  },
};

export const prioritiesService = {
  getPriorities: async () => {
    const response = await api.get('/priorities');
    return response.data;
  },

  createPriority: async (priorityData) => {
    const response = await api.post('/priorities', priorityData);
    return response.data;
  },

  getPriorityById: async (id) => {
    const response = await api.get(`/priorities/${id}`);
    return response.data;
  },

  deletePriority: async (id) => {
    const response = await api.delete(`/priorities/${id}`);
    return response.data;
  },
};

export const eventsService = {
  getEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getEventsByMonth: async (month) => {
    const response = await api.get(`/events/month/${month}`);
    return response.data;
  },

  getEventsByDate: async (month, day) => {
    const response = await api.get(`/events/date/${month}/${day}`);
    return response.data;
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getEventYearNotes: async (eventId) => {
    const response = await api.get(`/events/${eventId}/notes`);
    return response.data;
  },

  upsertEventYearNote: async (eventId, year, note) => {
    const response = await api.post(`/events/${eventId}/notes`, { year, note });
    return response.data;
  },

  deleteEventYearNote: async (eventId, noteId) => {
    const response = await api.delete(`/events/${eventId}/notes/${noteId}`);
    return response.data;
  },
};

export const dataTasksService = {
  getAll: async () => {
    const response = await api.get('/datatasks');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/datatasks/${id}`);
    return response.data;
  },

  create: async (dataTaskData) => {
    const response = await api.post('/datatasks', dataTaskData);
    return response.data;
  },

  update: async (id, updates) => {
    const response = await api.put(`/datatasks/${id}`, updates);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/datatasks/${id}`);
    return response.data;
  },

  addDate: async (id, dateData) => {
    const response = await api.post(`/datatasks/${id}/dates`, dateData);
    return response.data;
  },

  removeDate: async (id, date) => {
    const response = await api.delete(`/datatasks/${id}/dates/${date}`);
    return response.data;
  },

  updateDateStatus: async (id, date, status) => {
    const response = await api.put(`/datatasks/${id}/dates/${date}/status`, { status });
    return response.data;
  },
};

export const rwprintService = {
  getEnvironments: async () => {
    const response = await api.get('/rwprint/environments');
    return response.data.environments || [];
  },

  getFolders: async (environmentId) => {
    const response = await api.get(`/rwprint/environments/${environmentId}/folders`);
    return response.data.folders || [];
  },

  getDocuments: async (environmentId) => {
    const response = await api.get(`/rwprint/environments/${environmentId}/documents`);
    return response.data.documents || [];
  },

  getStorageStats: async () => {
    const response = await api.get('/rwprint/stats/storage');
    return response.data;
  },
};

export default api;
