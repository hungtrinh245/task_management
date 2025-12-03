import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Empty,
  Progress,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTasks } from "../contexts/TaskContext";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { tasks, deleteTask } = useTasks();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <span
          style={{ textDecoration: record.completed ? "line-through" : "none" }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Director",
      dataIndex: "director",
      key: "director",
    },
    {
      title: "Genre",
      dataIndex: "genre",
      key: "genre",
      render: (genre) => <Tag color="blue">{genre}</Tag>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Status",
      dataIndex: "completed",
      key: "status",
      render: (completed) => (
        <Tag color={completed ? "green" : "orange"}>
          {completed ? "Completed" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Link to={`/tasks/${record.id}`}>
            <Button type="primary" size="small">
              View
            </Button>
          </Link>
          <Link to={`/tasks/edit/${record.id}`}>
            <Button size="small">Edit</Button>
          </Link>
          <Button
            danger
            size="small"
            onClick={() => {
              if (window.confirm("Delete this task?")) {
                deleteTask(record.id);
              }
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: "#f0f2f5", padding: "24px" }}>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Tasks"
              value={totalTasks}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Completed"
              value={completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Pending"
              value={pendingTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Completion Rate"
              value={completionRate}
              suffix="%"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Bar */}
      <Card style={{ marginBottom: 24, borderRadius: 8 }}>
        <h3 style={{ marginBottom: 16 }}>Overall Progress</h3>
        <Progress
          percent={completionRate}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          status={completionRate === 100 ? "success" : "active"}
        />
        <p style={{ marginTop: 12, color: "#666" }}>
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </Card>

      {/* Upcoming Tasks */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            title="Upcoming Tasks"
            extra={
              <Link to="/tasks/create">
                <Button type="primary">+ Add Task</Button>
              </Link>
            }
            style={{ borderRadius: 8 }}
          >
            {upcomingTasks.length > 0 ? (
              <Table
                columns={columns}
                dataSource={upcomingTasks}
                pagination={false}
                rowKey="id"
                size="small"
              />
            ) : (
              <Empty description="No upcoming tasks" />
            )}
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={24} lg={8}>
          <Card title="Quick Stats" style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Tasks:</span>
                <strong>{totalTasks}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Completed:</span>
                <strong style={{ color: "#52c41a" }}>{completedTasks}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pending:</span>
                <strong style={{ color: "#faad14" }}>{pendingTasks}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Completion:</span>
                <strong style={{ color: "#722ed1" }}>{completionRate}%</strong>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
