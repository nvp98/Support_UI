import apiService from "./ApiService";
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
// config sample
export const UploadApi = {
  postImages: () => apiService.post("/api/Uploads/image"),
  postLinkImages: BASE_API_URL + "/api/Uploads/image",
};
