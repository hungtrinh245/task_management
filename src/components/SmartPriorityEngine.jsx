import React, { useMemo } from "react";
import { Card, Alert, Tag, Space, Button } from "antd";
import { BulbOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const SmartPriorityEngine = ({ task, onApplySuggestion }) => {
  const analysis = useMemo(() => {
    if (!task) return null;

    const suggestions = [];
    const warnings = [];

    // Calculate days left until deadline
    const daysLeft = task.dueDate
      ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    // Analyze deadline
    if (daysLeft !== null) {
      if (daysLeft < 0) {
        suggestions.push({
          type: "priority",
          value: "urgent",
          message: "Task này đã quá hạn, nên gán Priority: Urgent",
          reason: `Quá hạn ${Math.abs(daysLeft)} ngày`,
        });
      } else if (daysLeft <= 3) {
        suggestions.push({
          type: "priority",
          value: "high",
          message: "Task này sắp đến hạn, nên gán Priority: High",
          reason: `Còn ${daysLeft} ngày đến deadline`,
        });
      } else if (daysLeft <= 7) {
        suggestions.push({
          type: "priority",
          value: "medium",
          message: "Task này nên gán Priority: Medium",
          reason: `Còn ${daysLeft} ngày đến deadline`,
        });
      }
    }

    // Analyze update frequency
    const lastUpdate = task.updatedAt ? new Date(task.updatedAt) : null;
    const daysSinceUpdate = lastUpdate
      ? Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceUpdate !== null && daysSinceUpdate > 7 && !task.completed) {
      warnings.push({
        message: "Task này có dấu hiệu chậm tiến độ",
        reason: `Không được cập nhật trong ${daysSinceUpdate} ngày`,
      });
    }

    // Analyze by category/genre
    const categoryPriorityMap = {
      Development: "high",
      Design: "high",
      Testing: "medium",
      "Sci-Fi": "medium",
      Drama: "low",
      Crime: "medium",
      Action: "high",
      Historical: "medium",
    };

    const suggestedPriority = categoryPriorityMap[task.genre];
    if (suggestedPriority && suggestedPriority !== task.priority) {
      suggestions.push({
        type: "priority",
        value: suggestedPriority,
        message: `Task ${task.genre} nên gán Priority: ${
          suggestedPriority.charAt(0).toUpperCase() + suggestedPriority.slice(1)
        }`,
        reason: `Dựa trên thể loại ${task.genre}`,
      });
    }

    // Analyze status
    if (task.status === "pending" && daysLeft !== null && daysLeft < 0) {
      suggestions.push({
        type: "status",
        value: "overdue",
        message: "Task này nên cập nhật Status: Overdue",
        reason: "Task pending nhưng đã quá hạn",
      });
    }

    // Analyze subtasks completion
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSubtasks = task.subtasks.filter(
        (st) => st.completed
      ).length;
      const completionRate = completedSubtasks / task.subtasks.length;

      if (completionRate < 0.3 && daysLeft !== null && daysLeft <= 7) {
        warnings.push({
          message: "Task này có dấu hiệu chậm tiến độ",
          reason: `Chỉ hoàn thành ${Math.round(
            completionRate * 100
          )}% subtasks nhưng sắp đến hạn`,
        });
      }
    }

    return { suggestions, warnings };
  }, [task]);

  if (
    !analysis ||
    (analysis.suggestions.length === 0 && analysis.warnings.length === 0)
  ) {
    return null;
  }

  const handleApplySuggestion = (suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: "#fff7e6",
        border: "1px solid #ffd591",
      }}
      title={
        <Space>
          <BulbOutlined style={{ color: "#fa8c16" }} />
          <span style={{ color: "#fa8c16", fontWeight: 500 }}>
            Smart Priority Engine
          </span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Priority Suggestions */}
        {analysis.suggestions.map((suggestion, index) => (
          <Alert
            key={index}
            message={
              <div>
                <strong>{suggestion.message}</strong>
                <br />
                <small style={{ color: "#666" }}>{suggestion.reason}</small>
              </div>
            }
            type="warning"
            showIcon
            action={
              onApplySuggestion ? (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleApplySuggestion(suggestion)}
                >
                  Apply
                </Button>
              ) : null
            }
            style={{ marginBottom: 8 }}
          />
        ))}

        {/* Warnings */}
        {analysis.warnings.map((warning, index) => (
          <Alert
            key={`warning-${index}`}
            message={
              <div>
                <strong>{warning.message}</strong>
                <br />
                <small style={{ color: "#666" }}>{warning.reason}</small>
              </div>
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 8 }}
          />
        ))}
      </Space>
    </Card>
  );
};

export default SmartPriorityEngine;
