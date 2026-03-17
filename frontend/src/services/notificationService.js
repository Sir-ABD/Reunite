import api from "./api";

export const getNotifications = (params = {}) =>
	api.get("/notifications", { params });
export const markNotificationAsRead = (notificationId, data) =>
	api.put(`/notifications/${notificationId}/read`, data);
