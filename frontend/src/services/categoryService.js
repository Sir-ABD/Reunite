import api from './api';

export const getCategories = (params = {}) => api.get('/categories', { params });
export const getAllCategoriesForAdmin = (params = {}) => api.get('/categories/admin', { params });
export const addCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);