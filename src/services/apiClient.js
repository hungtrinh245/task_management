import axios from "axios";

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 10000, // timeout 10 giây
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: tự động thêm token nếu có (auth token từ localStorage)
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage nếu có
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: xử lý lỗi response
apiClient.interceptors.response.use(
  (response) => {
    // Nếu response có cấu trúc { data, meta } hoặc chỉ { data }
    // có thể trả về response.data trực tiếp tùy theo backend
    return response.data || response;
  },
  (error) => {
    // Xử lý lỗi chung (401 = token hết hạn, 403 = không quyền, 404 = không tìm, 500 = server error)
    if (error.response) {
      // Server trả về status code lỗi
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.error || "Lỗi từ server";
      console.error(`[API Error ${status}]:`, errorMessage);
    } else if (error.request) {
      // Request được gửi nhưng không nhận response
      console.error(
        "[API Error] Không nhận response từ server:",
        error.message
      );
    } else {
      // Lỗi khi setup request
      console.error("[API Error] Setup request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
