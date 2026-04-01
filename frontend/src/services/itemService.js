import api from './api';

export const getItems = (params) => api.get('/items', { params });
export const getItemById = (itemId) => api.get(`/items/${itemId}`);
export const deleteItem = (itemId) => api.delete(`/items/${itemId}`);
export const createItem = (data) => {
  const config = {
    headers: {
      Authorization: `${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    },
  };
  return api.post('/items', data, config);
};
export const getItemDetails = (itemId) => api.get(`/items/${itemId}`);
export const claimItem = (itemId) => api.post(`/items/${itemId}/claim`);
export const approveClaimRequest = (itemId) => api.post(`/items/${itemId}/approve-claim`);
export const rejectClaimRequest = (itemId) => api.post(`/items/${itemId}/reject-claim`);
export const updateItem = (itemId, data) => {
  const config = {
    headers: {
      Authorization: `${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    },
  };
  return api.put(`/items/${itemId}`, data, config);
};
export const deleteUserItem = (itemId) => api.delete(`/items/${itemId}`);
export const toggleItemActivation = (itemId) => api.put(`/admin/items/${itemId}/activate`);

export const markItemAsReturned = (itemId) => api.post(`/items/${itemId}/return`);
export const assignKeeperToItem = (itemId, data) => api.post(`/items/${itemId}/assign-keeper`, data);
export const generateQRCodeForItem = (itemId) => api.post(`/items/${itemId}/generate-qr`);
export const scanQRCodeForItem = (itemId, data) => api.post(`/items/${itemId}/scan-qr`, data);
export const confirmHandoff = (itemId) => api.post(`/items/${itemId}/confirm-handoff`);
export const confirmMeeting = (itemId) => api.post(`/items/${itemId}/confirm-meeting`);
export const keeperApproveHandoff = (itemId) => api.post(`/items/${itemId}/approve-handoff`);
export const improveText = (data) => {
  const config = {
    headers: {
      Authorization: `${localStorage.getItem('token')}`,
    },
  };
  return api.post('/items/improve-text', data, config);
};
