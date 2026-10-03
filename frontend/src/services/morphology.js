import api from './api';

export const morphologyService = {
  /**
   * Возвращает карту { слово (в нижнем регистре): часть речи } для русского текста.
   */
  analyze: async (text) => {
    const response = await api.post('/morphology/analyze', { text });
    const map = {};
    for (const { word, pos } of response.data?.words || []) {
      map[word.toLowerCase()] = pos;
    }
    return map;
  },
};
