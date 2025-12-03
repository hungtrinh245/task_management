// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

/**
 * Custom Hook để quản lý state và đồng bộ nó với Local Storage.
 * @param {string} key - Key để lưu trữ trong Local Storage (ví dụ: 'task_manager_data').
 * @param {any} initialValue - Giá trị khởi tạo mặc định.
 */
function useLocalStorage(key, initialValue) {
  // 1. Khởi tạo State: Lấy giá trị từ Local Storage hoặc dùng giá trị mặc định
  const [value, setValue] = useState(() => {
    try {
      // Lấy dữ liệu đã lưu
      const storedValue = window.localStorage.getItem(key);
      
      if (storedValue) {
        // Nếu có, chuyển chuỗi JSON thành đối tượng JavaScript
        return JSON.parse(storedValue);
      }
      // Nếu không, trả về giá trị khởi tạo
      return initialValue;
    } catch (error) {
      console.error("Lỗi khi đọc từ Local Storage:", error);
      // Trong trường hợp lỗi, vẫn trả về giá trị khởi tạo để ứng dụng không bị crash
      return initialValue;
    }
  });

  // 2. Đồng bộ: Ghi state vào Local Storage mỗi khi 'value' thay đổi
  useEffect(() => {
    try {
      // Chuyển đối tượng JavaScript thành chuỗi JSON và lưu trữ
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Lỗi khi ghi vào Local Storage:", error);
    }
  }, [key, value]); // Dependencies: Hook chạy lại mỗi khi key hoặc value thay đổi

  return [value, setValue];
}

export default useLocalStorage;