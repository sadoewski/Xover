import api from './api';

export const sitesService = {
  // Получить все сайты
  async getSites() {
    const response = await api.get('/sites');
    return response.data;
  },

  // Создать сайт
  async createSite(name, icon) {
    const response = await api.post('/sites', { name, icon });
    return response.data;
  },

  // Получить сайт с содержимым
  async getSite(siteId) {
    const response = await api.get(`/sites/${siteId}`);
    return response.data;
  },

  // Удалить сайт
  async deleteSite(siteId) {
    const response = await api.delete(`/sites/${siteId}`);
    return response.data;
  },

  // Создать элемент в сайте
  async createItem(siteId, itemData) {
    const response = await api.post(`/sites/${siteId}/items`, itemData);
    return response.data;
  },

  // Обновить элемент
  async updateItem(siteId, itemId, itemData) {
    const response = await api.put(`/sites/${siteId}/items/${itemId}`, itemData);
    return response.data;
  },

  // Удалить элемент
  async deleteItem(siteId, itemId) {
    const response = await api.delete(`/sites/${siteId}/items/${itemId}`);
    return response.data;
  },

  // Поиск по сайту
  async searchSite(siteId, query) {
    const response = await api.get(`/sites/${siteId}/search`, {
      params: { q: query }
    });
    return response.data;
  }
};
