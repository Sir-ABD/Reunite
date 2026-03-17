import api from "./api";

export const searchItems = (params) =>
	api.get("/search/items/search", { params });
