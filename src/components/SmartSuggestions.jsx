import React, { useMemo } from "react";
import { Card, Button, Space, message, Tag } from "antd";
import { BulbOutlined, CheckOutlined } from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";

const SmartSuggestions = ({ form, onSuggestionApply }) => {
  const { tasks } = useTasks();
  const formValues = form.getFieldsValue();

  const suggestions = useMemo(() => {
    const newSuggestions = {};

    // Assignee suggestion based on genre
    if (formValues.genre) {
      const genreTasks = tasks.filter(
        (task) => task.genre === formValues.genre
      );
      if (genreTasks.length > 0) {
        const assigneeCounts = {};
        genreTasks.forEach((task) => {
          if (task.assignee) {
            assigneeCounts[task.assignee] =
              (assigneeCounts[task.assignee] || 0) + 1;
          }
        });

        const mostCommonAssignee = Object.keys(assigneeCounts).reduce(
          (a, b) => (assigneeCounts[a] > assigneeCounts[b] ? a : b),
          null
        );

        if (mostCommonAssignee && mostCommonAssignee !== formValues.assignee) {
          newSuggestions.assignee = {
            value: mostCommonAssignee,
            reason: `Most common assignee for ${formValues.genre} tasks`,
          };
        }
      }
    }

    // Due date suggestion based on priority
    if (formValues.priority && !formValues.dueDate) {
      const priorityDays = {
        low: 8,
        medium: 5,
        high: 2,
        urgent: 1,
      };

      const days = priorityDays[formValues.priority];
      if (days) {
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + days);
        const formattedDate = suggestedDate.toISOString().split("T")[0];

        newSuggestions.dueDate = {
          value: formattedDate,
          reason: `${days} days for ${formValues.priority} priority tasks`,
        };
      }
    }

    // Tag suggestions based on title keywords
    if (formValues.title) {
      const title = formValues.title.toLowerCase();
      const suggestedTags = [];

      if (
        title.includes("bug") ||
        title.includes("fix") ||
        title.includes("error")
      ) {
        suggestedTags.push("bug");
      }
      if (
        title.includes("feature") ||
        title.includes("add") ||
        title.includes("new")
      ) {
        suggestedTags.push("feature");
      }
      if (
        title.includes("enhance") ||
        title.includes("improve") ||
        title.includes("update")
      ) {
        suggestedTags.push("enhancement");
      }
      if (title.includes("doc") || title.includes("document")) {
        suggestedTags.push("documentation");
      }
      if (title.includes("test")) {
        suggestedTags.push("testing");
      }

      const currentTags = formValues.tags || [];
      const newTags = suggestedTags.filter((tag) => !currentTags.includes(tag));

      if (newTags.length > 0) {
        newSuggestions.tags = {
          value: newTags,
          reason: "Based on keywords in task title",
        };
      }
    }

    // Subtask templates based on genre
    if (
      formValues.genre === "Development" &&
      (!formValues.subtasks || formValues.subtasks.length === 0)
    ) {
      const devSubtasks = [
        { id: "1", title: "Write code", completed: false },
        { id: "2", title: "Write tests", completed: false },
        { id: "3", title: "Code review", completed: false },
      ];

      newSuggestions.subtasks = {
        value: devSubtasks,
        reason: "Standard development workflow",
      };
    }

    return newSuggestions;
  }, [formValues, tasks]);

  const applySuggestion = (type, value) => {
    if (type === "subtasks") {
      onSuggestionApply(type, value);
    } else {
      form.setFieldsValue({ [type]: value });
    }

    message.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} suggestion applied!`
    );
  };

  const hasSuggestions = Object.keys(suggestions).length > 0;

  if (!hasSuggestions) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: "#f6ffed",
        border: "1px solid #b7eb8f",
      }}
      title={
        <Space>
          <BulbOutlined style={{ color: "#52c41a" }} />
          <span style={{ color: "#52c41a", fontWeight: 500 }}>
            Smart Suggestions
          </span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {suggestions.assignee && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Assignee:</strong> {suggestions.assignee.value}
              <br />
              <small style={{ color: "#666" }}>
                {suggestions.assignee.reason}
              </small>
            </div>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() =>
                applySuggestion("assignee", suggestions.assignee.value)
              }
            >
              Apply
            </Button>
          </div>
        )}

        {suggestions.dueDate && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Due Date:</strong>{" "}
              {new Date(suggestions.dueDate.value).toLocaleDateString()}
              <br />
              <small style={{ color: "#666" }}>
                {suggestions.dueDate.reason}
              </small>
            </div>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() =>
                applySuggestion("dueDate", suggestions.dueDate.value)
              }
            >
              Apply
            </Button>
          </div>
        )}

        {suggestions.tags && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Tags:</strong>{" "}
              {suggestions.tags.value.map((tag) => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))}
              <br />
              <small style={{ color: "#666" }}>{suggestions.tags.reason}</small>
            </div>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() =>
                applySuggestion("tags", [
                  ...(formValues.tags || []),
                  ...suggestions.tags.value,
                ])
              }
            >
              Apply
            </Button>
          </div>
        )}

        {suggestions.subtasks && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Subtasks:</strong> {suggestions.subtasks.value.length}{" "}
              standard items
              <br />
              <small style={{ color: "#666" }}>
                {suggestions.subtasks.reason}
              </small>
            </div>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() =>
                applySuggestion("subtasks", suggestions.subtasks.value)
              }
            >
              Apply
            </Button>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default SmartSuggestions;
