import { Card, Checkbox, Button, Input, Space, List, Empty } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function TaskChecklist({
  subtasks = [],
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(newSubtaskTitle);
      setNewSubtaskTitle("");
    }
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress =
    subtasks.length > 0
      ? Math.round((completedCount / subtasks.length) * 100)
      : 0;

  return (
    <Card
      title={`Checklist (${completedCount}/${subtasks.length})`}
      style={{ marginTop: 16 }}
    >
      {subtasks.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 12, color: "#666" }}>
          Progress: {progress}%
        </div>
      )}

      {subtasks.length > 0 ? (
        <List
          dataSource={subtasks}
          renderItem={(subtask) => (
            <List.Item
              key={subtask.id}
              style={{
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Checkbox
                checked={subtask.completed}
                onChange={() => onToggleSubtask(subtask.id)}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: subtask.completed ? "line-through" : "none",
                  opacity: subtask.completed ? 0.6 : 1,
                }}
              >
                {subtask.title}
              </span>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onDeleteSubtask(subtask.id)}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No subtasks yet" style={{ margin: "16px 0" }} />
      )}

      <Space style={{ marginTop: 16, width: "100%" }}>
        <Input
          placeholder="Add new subtask..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onPressEnter={handleAddSubtask}
          size="small"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={handleAddSubtask}
        >
          Add
        </Button>
      </Space>
    </Card>
  );
}
