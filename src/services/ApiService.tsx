import axios from "axios";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
// const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;

const apiService = axios.create({
  baseURL: BASE_API_URL, // thay đổi url api
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptors (bắt lỗi, thêm token)
apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiService.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // const navigate = useNavigate();
    if (error.response?.status === 401) {
      // Ví dụ: xóa token + redirect login
      localStorage.removeItem("token");
      // navigate("/login", { replace: true });
      window.location.href = "/login";

      return Promise.reject({
        message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
      });
    }

    return Promise.reject(error.response?.data || error);
  }
);

// export default apiService;

export default apiService as unknown as {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
};
// Client cho API Auth
export const authClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
