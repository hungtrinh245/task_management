import { useState, useEffect } from "react";
import AuditService from "../services/AuditService";

/**
 * Component hiển thị audit logs của một task
 */
const AuditLogSection = ({ taskId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [taskId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await AuditService.getTaskAuditLogs(taskId);
      setAuditLogs(logs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatChanges = (changes) => {
    return changes.map((change, index) => (
      <span key={index} className="text-sm">
        <strong>{change.field}:</strong> "{change.oldValue}" → "
        {change.newValue}"{index < changes.length - 1 && ", "}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Lịch sử thay đổi</h3>
        <div className="text-center py-4">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Lịch sử thay đổi</h3>

      {auditLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có thay đổi nào được ghi lại
        </div>
      ) : (
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {log.userName}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({log.userEmail})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>

              <div className="text-sm text-gray-700 mb-2">
                <strong>Hành động:</strong> {log.action}
              </div>

              {log.changes && log.changes.length > 0 && (
                <div className="text-sm text-gray-700">
                  <strong>Thay đổi:</strong>{" "}
                  <div className="mt-1">{formatChanges(log.changes)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogSection;
