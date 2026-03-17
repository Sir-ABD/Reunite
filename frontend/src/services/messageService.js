import api from './api';

export const getMessagesInConversation = (conversationId, params = {}) =>
  api.get(`/messages/${conversationId}/messages`, { params });
export const sendMessageInConversation = (conversationId, data) =>
  api.post(`/messages/${conversationId}/messages`, data);