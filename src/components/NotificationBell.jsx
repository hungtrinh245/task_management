import { useState, useEffect } from "react";
import AuditService from "../services/AuditService";

/**
 * Component hiển thị chuông thông báo với số lượng unread notifications
 */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = () => {
    const userNotifications = AuditService.getUserNotifications();
    setNotifications(userNotifications);
    setUnreadCount(userNotifications.filter((n) => !n.read).length);
  };

  useEffect(() => {
    // Lấy notifications ban đầu
    loadNotifications();

    // Lắng nghe event khi có notification mới
    const handleNewNotification = () => {
      loadNotifications();
    };

    window.addEventListener("taskNotification", handleNewNotification);

    return () => {
      window.removeEventListener("taskNotification", handleNewNotification);
    };
  }, []);

  const markAsRead = (notificationId) => {
    AuditService.markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const markAllAsRead = () => {
    notifications.forEach((n) => {
      if (!n.read) {
        AuditService.markNotificationAsRead(n.id);
      }
    });
    loadNotifications();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          unreadCount > 0
            ? "text-red-600 hover:text-red-700 hover:bg-red-50 animate-pulse"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        title={`${
          unreadCount > 0 ? `${unreadCount} thông báo mới` : "Thông báo"
        }`}
      >
        <svg
          className={`w-8 h-8 transition-transform duration-200 ${
            unreadCount > 0 ? "animate-bounce" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5-5V7a3 3 0 00-6 0v5l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0h6"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <>
            {/* Ping animation background */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white animate-ping opacity-75">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            {/* Static badge on top */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
