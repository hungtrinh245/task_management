import apiClient from "./apiClient";
import AuditService from "./AuditService";

const BASE_ENDPOINT = "/tasks";

const TaskService = {
  /**
   * Lấy danh sách tasks với filter, search, pagination
   * @param {Object} params - { search, status, page, limit }
   * @returns {Promise<Task[]>}
   */
  async getTasks(params = {}) {
    try {
      const response = await apiClient.get(BASE_ENDPOINT, { params });
      // json-server trả mảng trực tiếp
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("TaskService.getTasks error:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết 1 task theo ID
   * @param {number|string} id
   * @returns {Promise<Task>}
   */
  async getTaskById(id) {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
      return response;
    } catch (error) {
      console.error(`TaskService.getTaskById(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Tạo task mới
   * @param {Object} taskData - { title, description, status, dueDate }
   * @returns {Promise<Task>}
   */
  async createTask(taskData) {
    try {
      const response = await apiClient.post(BASE_ENDPOINT, {
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error("TaskService.createTask error:", error);
      throw error;
    }
  },

  /**
   * Cập nhật task
   * @param {number|string} id
   * @param {Object} updates - { title, description, status, dueDate, completed }
   * @returns {Promise<Task>}
   */
  async updateTask(id, updates) {
    try {
      // Lấy task cũ để so sánh thay đổi
      const oldTask = await this.getTaskById(id);

      // Cập nhật task
      const response = await apiClient.put(`${BASE_ENDPOINT}/${id}`, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Ghi audit log và thông báo
      await AuditService.logTaskUpdate(oldTask, response);

      return response;
    } catch (error) {
      console.error(`TaskService.updateTask(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Xoá task
   * @param {number|string} id
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteTask(id) {
    try {
      const response = await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
      return response || { success: true };
    } catch (error) {
      console.error(`TaskService.deleteTask(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Toggle completed status của task
   * @param {number|string} id
   * @param {boolean} completed
   * @returns {Promise<Task>}
   */
  async toggleTaskCompletion(id, completed) {
    try {
      const response = await apiClient.patch(`${BASE_ENDPOINT}/${id}`, {
        completed,
        updatedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error(`TaskService.toggleTaskCompletion(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tasks theo projectId
   * @param {string} projectId
   * @returns {Promise<Task[]>}
   */
  async getTasksByProject(projectId) {
    try {
      const response = await this.getTasks({ projectId });
      return response;
    } catch (error) {
      console.error(`TaskService.getTasksByProject(${projectId}) error:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật projectId của task (gán hoặc gỡ task khỏi project)
   * @param {number|string} taskId
   * @param {string|null} projectId - null để gỡ task khỏi project
   * @returns {Promise<Task>}
   */
  async updateTaskProject(taskId, projectId) {
    try {
      const response = await this.updateTask(taskId, {
        projectId,
        updatedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error(
        `TaskService.updateTaskProject(${taskId}, ${projectId}) error:`,
        error
      );
      throw error;
    }
  },
};

export default TaskService;
