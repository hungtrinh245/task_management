import apiClient from "./apiClient";
import AuthService from "./AuthService";

/**
 * Service xử lý audit log và thông báo cho task updates
 */
const AuditService = {
  /**
   * Ghi lại thay đổi của task và gửi thông báo nếu cần
   * @param {Object} oldTask - Task trước khi update
   * @param {Object} newTask - Task sau khi update
   */
  async logTaskUpdate(oldTask, newTask) {
    try {
      // Lấy thông tin user hiện tại
      const currentUser = AuthService.getUser();
      if (!currentUser) return;

      // Tạo audit log entry
      const auditEntry = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "update",
        timestamp: new Date().toISOString(),
        changes: this.getChanges(oldTask, newTask),
      };

      // Thêm audit log vào task
      const updatedAuditLogs = [...(newTask.auditLogs || []), auditEntry];

      // Cập nhật auditLogs trong task
      await apiClient.patch(`/tasks/${newTask.id}`, {
        auditLogs: updatedAuditLogs,
        updatedAt: new Date().toISOString(),
      });

      // Gửi thông báo cho assignee nếu cần
      if (this.shouldNotifyAssignee(auditEntry.changes) && newTask.assignee) {
        await this.notifyAssignee(newTask, auditEntry);
      }

      console.log("Audit log recorded:", auditEntry);
    } catch (error) {
      console.error("Error logging task update:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách thay đổi giữa oldTask và newTask
   * @param {Object} oldTask
   * @param {Object} newTask
   * @returns {Array} Danh sách thay đổi
   */
  getChanges(oldTask, newTask) {
    const changes = [];
    const fieldsToTrack = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "assignee",
      "completed",
    ];

    fieldsToTrack.forEach((field) => {
      if (oldTask[field] !== newTask[field]) {
        changes.push({
          field,
          oldValue: oldTask[field],
          newValue: newTask[field],
        });
      }
    });

    return changes;
  },

  /**
   * Kiểm tra xem có cần thông báo cho assignee không
   * @param {Array} changes - Danh sách thay đổi
   * @returns {boolean}
   */
  shouldNotifyAssignee(changes) {
    const importantFields = [
      "title",
      "description",
      "dueDate",
      "status",
      "priority",
    ];
    return changes.some((change) => importantFields.includes(change.field));
  },

  /**
   * Gửi thông báo cho assignee
   * @param {Object} task - Task đã update
   * @param {Object} auditEntry - Audit log entry
   */
  async notifyAssignee(task, auditEntry) {
    try {
      // Trong môi trường thực tế, đây có thể là API call tới notification service
      // Hiện tại chỉ log ra console và có thể hiển thị toast notification

      const notification = {
        id: Date.now().toString(),
        taskId: task.id,
        taskTitle: task.title,
        assigneeEmail: task.assignee,
        message: `Task "${task.title}" has been updated by ${
          auditEntry.userName
        }. Changes: ${auditEntry.changes
          .map((c) => `${c.field}: "${c.oldValue}" → "${c.newValue}"`)
          .join(", ")}`,
        timestamp: auditEntry.timestamp,
        read: false,
      };

      // Lưu notification vào localStorage (hoặc gửi tới backend)
      const notifications = JSON.parse(
        localStorage.getItem("notifications") || "[]"
      );
      notifications.push(notification);
      localStorage.setItem("notifications", JSON.stringify(notifications));

      // Trong React app, có thể trigger event để hiển thị notification
      console.log("Notification sent to assignee:", notification);

      // Trigger custom event để UI có thể hiển thị notification
      window.dispatchEvent(
        new CustomEvent("taskNotification", { detail: notification })
      );
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  },

  /**
   * Lấy audit logs của một task
   * @param {string} taskId
   * @returns {Array} Danh sách audit logs
   */
  async getTaskAuditLogs(taskId) {
    try {
      const task = await apiClient.get(`/tasks/${taskId}`);
      return task.auditLogs || [];
    } catch (error) {
      console.error("Error getting audit logs:", error);
      return [];
    }
  },

  /**
   * Lấy notifications cho user hiện tại
   * @returns {Array} Danh sách notifications
   */
  getUserNotifications() {
    try {
      const currentUser = AuthService.getUser();
      if (!currentUser) return [];

      const notifications = JSON.parse(
        localStorage.getItem("notifications") || "[]"
      );
      return notifications.filter((n) => n.assigneeEmail === currentUser.email);
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return [];
    }
  },

  /**
   * Đánh dấu notification đã đọc
   * @param {string} notificationId
   */
  markNotificationAsRead(notificationId) {
    try {
      const notifications = JSON.parse(
        localStorage.getItem("notifications") || "[]"
      );
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },
};

export default AuditService;
