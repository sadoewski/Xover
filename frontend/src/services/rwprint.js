import api from './api';

export const rwprintService = {
  // === ENVIRONMENTS ===
  getEnvironments: async () => {
    const response = await api.get('/rwprint/environments');
    return response.data;
  },

  createEnvironment: async (name, description) => {
    const response = await api.post('/rwprint/environments', { name, description });
    return response.data;
  },

  updateEnvironment: async (id, name, description) => {
    const response = await api.put(`/rwprint/environments/${id}`, { name, description });
    return response.data;
  },

  deleteEnvironment: async (id) => {
    const response = await api.delete(`/rwprint/environments/${id}`);
    return response.data;
  },

  // === FOLDERS ===
  getFolders: async (environmentId) => {
    const response = await api.get(`/rwprint/environments/${environmentId}/folders`);
    return response.data;
  },

  createFolder: async (environmentId, name, parentFolderId = null) => {
    const response = await api.post(`/rwprint/environments/${environmentId}/folders`, {
      name,
      parent_folder_id: parentFolderId,
    });
    return response.data;
  },

  updateFolder: async (id, name, parentFolderId) => {
    const response = await api.put(`/rwprint/folders/${id}`, {
      name,
      parent_folder_id: parentFolderId,
    });
    return response.data;
  },

  deleteFolder: async (id) => {
    const response = await api.delete(`/rwprint/folders/${id}`);
    return response.data;
  },

  // === DOCUMENTS ===
  getDocuments: async (environmentId, folderId = null, bookmarked = false, sortBy = 'newest') => {
    const params = new URLSearchParams();
    if (folderId !== null) params.append('folderId', folderId);
    if (bookmarked) params.append('bookmarked', 'true');
    params.append('sortBy', sortBy);

    const response = await api.get(`/rwprint/environments/${environmentId}/documents?${params}`);
    return response.data;
  },

  getDocumentById: async (id, password = null) => {
    const response = await api.post(`/rwprint/documents/${id}`, { password });
    return response.data;
  },

  createDocument: async (environmentId, documentData) => {
    const response = await api.post(`/rwprint/environments/${environmentId}/documents`, documentData);
    return response.data;
  },

  updateDocument: async (id, documentData) => {
    const response = await api.put(`/rwprint/documents/${id}`, documentData);
    return response.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/rwprint/documents/${id}`);
    return response.data;
  },

  // === TAGS ===
  getTags: async (environmentId) => {
    const response = await api.get(`/rwprint/environments/${environmentId}/tags`);
    return response.data;
  },

  createTag: async (environmentId, name, color) => {
    const response = await api.post(`/rwprint/environments/${environmentId}/tags`, { name, color });
    return response.data;
  },

  deleteTag: async (id) => {
    const response = await api.delete(`/rwprint/tags/${id}`);
    return response.data;
  },

  addTagToDocument: async (documentId, tagId) => {
    const response = await api.post(`/rwprint/documents/${documentId}/tags/${tagId}`);
    return response.data;
  },

  removeTagFromDocument: async (documentId, tagId) => {
    const response = await api.delete(`/rwprint/documents/${documentId}/tags/${tagId}`);
    return response.data;
  },

  getDocumentTags: async (documentId) => {
    const response = await api.get(`/rwprint/documents/${documentId}/tags`);
    return response.data;
  },

  // === METADATA ===
  getDocumentMetadata: async (documentId) => {
    const response = await api.get(`/rwprint/documents/${documentId}/metadata`);
    return response.data;
  },

  setDocumentMetadata: async (documentId, key, value) => {
    const response = await api.post(`/rwprint/documents/${documentId}/metadata`, { key, value });
    return response.data;
  },

  deleteDocumentMetadata: async (documentId, key) => {
    const response = await api.delete(`/rwprint/documents/${documentId}/metadata/${key}`);
    return response.data;
  },

  // === BOOKMARKS ===
  getAllBookmarks: async () => {
    const response = await api.get('/rwprint/bookmarks');
    return response.data;
  },
};
