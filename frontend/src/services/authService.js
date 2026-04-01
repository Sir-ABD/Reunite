import api from './api';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const finalizeLogin = (data) => api.post('/auth/login/finalize', data);
export const googleLogin = (data) => api.post('/auth/google-login', data);
