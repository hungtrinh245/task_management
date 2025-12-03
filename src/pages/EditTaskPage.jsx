import { Card, Form, Input, Select, Button, Space, message, Spin } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useTasks } from "../contexts/TaskContext";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function EditTaskPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const { getTaskById, editTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const task = getTaskById(id);

  const genreOptions = [
    { label: "💻 Development", value: "Development" },
    { label: "🎨 Design", value: "Design" },
    { label: "🧪 Testing", value: "Testing" },
    { label: "📚 Documentation", value: "Documentation" },
  ];

  useEffect(() => {
    if (task) {
      form.setFieldsValue({
        title: task.title,
        director: task.director,
        genre: task.genre,
        description: task.description,
        dueDate: task.dueDate,
      });
    }
    setInitialLoading(false);
  }, [task, form]);

  if (!task && !initialLoading) {
    return (
      <Card style={{ borderRadius: 8, textAlign: "center" }}>
        <p style={{ color: "#ff4d4f", fontSize: 16 }}>Task not found!</p>
        <Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>
      </Card>
    );
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      editTask(parseInt(id), {
        title: values.title,
        director: values.director,
        genre: values.genre,
        description: values.description || "",
        dueDate: values.dueDate || "",
      });

      message.success("Task updated successfully!");
      navigate("/tasks");
    } catch {
      message.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Spin spinning={initialLoading}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <EditOutlined style={{ fontSize: 24 }} />
              <span>Edit Task: {task?.title}</span>
            </div>
          }
          style={{ borderRadius: 8 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              label="Task Title"
              name="title"
              rules={[
                { required: true, message: "Please enter task title" },
                { min: 3, message: "Title must be at least 3 characters" },
              ]}
            >
              <Input placeholder="Enter task title" size="large" />
            </Form.Item>

            <Form.Item
              label="Director/Team"
              name="director"
              rules={[
                { required: true, message: "Please enter director/team name" },
                {
                  min: 2,
                  message: "Director name must be at least 2 characters",
                },
              ]}
            >
              <Input placeholder="e.g., John Doe, Dev Team" size="large" />
            </Form.Item>

            <Form.Item
              label="Genre/Category"
              name="genre"
              rules={[{ required: true, message: "Please select a genre" }]}
            >
              <Select
                placeholder="Select genre"
                options={genreOptions}
                size="large"
              />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea
                placeholder="Enter task description (optional)"
                rows={4}
              />
            </Form.Item>

            <Form.Item label="Due Date" name="dueDate">
              <Input
                type="date"
                placeholder="Select due date (optional)"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                >
                  Update Task
                </Button>
                <Button size="large" onClick={() => navigate("/tasks")}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
}
