import {
  Card,
  Button,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Spin,
  Descriptions,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useTasks } from "../contexts/TaskContext";
import { useNavigate, useParams } from "react-router-dom";

export default function TaskDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getTaskById, deleteTask } = useTasks();
  const task = getTaskById(id);

  if (!task) {
    return (
      <Card style={{ borderRadius: 8, textAlign: "center" }}>
        <p style={{ color: "#ff4d4f", fontSize: 16 }}>Task not found!</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/tasks")}>
          Back to Tasks
        </Button>
      </Card>
    );
  }

  const isOverdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  const handleDelete = () => {
    if (window.confirm("Delete this task?")) {
      deleteTask(task.id);
      navigate("/tasks");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/tasks")}
            />
            <span>Task Details: {task.title}</span>
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/tasks/edit/${task.id}`)}
            >
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 1, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="Task ID" span={2}>
            <strong>#{task.id}</strong>
          </Descriptions.Item>

          <Descriptions.Item label="Title" span={2}>
            <h3 style={{ margin: 0 }}>{task.title}</h3>
          </Descriptions.Item>

          <Descriptions.Item label="Director/Team">
            <Tag color="blue">{task.director}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Genre/Category">
            <Tag color="cyan">{task.genre}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Due Date">
            <span>
              {task.dueDate || "Not set"}
              {isOverdue && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  Overdue
                </Tag>
              )}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Tag color={task.completed ? "green" : "orange"}>
              {task.completed ? "✓ Completed" : "Pending"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Description" span={2}>
            <div
              style={{
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 4,
                minHeight: 80,
                lineHeight: 1.6,
              }}
            >
              {task.description || (
                <span style={{ color: "#999" }}>No description provided</span>
              )}
            </div>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ borderRadius: 4 }}>
              <div style={{ textAlign: "center" }}>
                <h4>Created</h4>
                <p style={{ margin: 0, color: "#666" }}>Task ID: #{task.id}</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ borderRadius: 4 }}>
              <div style={{ textAlign: "center" }}>
                <h4>Status</h4>
                <Tag
                  color={task.completed ? "green" : "orange"}
                  style={{ marginTop: 8 }}
                >
                  {task.completed ? "Completed" : "In Progress"}
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
