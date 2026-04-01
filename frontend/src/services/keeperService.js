import api from './api';

export const getKeepers = () => api.get('/keepers');
export const getAssignedItems = () => api.get('/keepers/assigned-items');
export const facilitateMeeting = (itemId) => api.post(`/keepers/items/${itemId}/facilitate-meeting`);