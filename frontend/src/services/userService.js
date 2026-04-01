import api from './api';

export const getMyItems = (params = {}) => api.get('/users/me/items', { params });
export const getUserProfile = () => api.get('/users/me');
export const updateUserProfile = (data) => {
  const isFormData = data instanceof FormData;
  const config = {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
  };
  return api.put('/users/me', data, config);
};
export const updateUserPassword = (data) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${localStorage.getItem('token')}`,
    },
  };
  return api.put('/users/me/password', data, config);
};
export const deleteUserAccount = () => api.delete('/users/me');