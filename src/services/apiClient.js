import axios from "axios";
import AuthService from "./AuthService";
import { message } from "antd";

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
    // Xử lý lỗi chung
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.error || "Lỗi từ server";
      console.error(`[API Error ${status}]:`, errorMessage);

        // Nếu token không hợp lệ hoặc hết hạn -> tự động logout và chuyển tới trang đăng nhập
        if (status === 401) {
          // Nếu backend trả 401 nghĩa là token không hợp lệ hoặc đã hết hạn.
          // Thông báo cho user, xoá token tại client và điều hướng về trang đăng nhập.
          if (typeof window !== "undefined") {
            try {
              message.warning("Phiên đã hết hạn. Vui lòng đăng nhập lại.");
            } catch {
              // message có thể không hoạt động trong môi trường non-DOM
            }
          }
          try {
            AuthService.logout();
          } catch {
            // ignore
          }
          // redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
      }
      // 403: forbidden — user authenticated but not authorized for this resource
      if (status === 403) {
        if (typeof window !== "undefined") {
          try {
            message.error("Bạn không có quyền truy cập tài nguyên này.");
          } catch {
            // ignore
          }
        }
      }
    } else if (error.request) {
      console.error("[API Error] Không nhận response từ server:", error.message);
    } else {
      console.error("[API Error] Setup request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
