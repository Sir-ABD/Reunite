import api from './api';

export const getMyConversations = (params = {}) => api.get('/conversations', { params });
export const startConversation = (data) => api.post('/conversations', data);