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
  Spin,
  Alert,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined as ApprovalIcon,
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import AuthService from "../services/AuthService";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const { tasks, loading, error, deleteTask } = useTasks();

  // Get current user
  const currentUser = AuthService.getUser();
  const currentUserRole = currentUser?.role || "employee";
  const isManager = currentUserRole === "manager";

  // Hiển thị loading khi đang lấy dữ liệu
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" tip="Loading tasks..." />
      </div>
    );
  }

  // Hiển thị error nếu có lỗi
  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        closable
      />
    );
  }

  const totalTasks = tasks.length;
  const now = new Date();
  const completedTasks = tasks.filter((t) => t.completed).length;
  const isTaskOverdue = (t) =>
    t.dueDate && new Date(t.dueDate) < now && !t.completed;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;
  const pendingTasks = tasks.filter(
    (t) => !t.completed && !isTaskOverdue(t)
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Approval stats for managers
  const pendingApprovalsCount = tasks.filter(
    (t) => t.approvalStatus === "pending"
  ).length;
  const approvedTasksCount = tasks.filter(
    (t) => t.approvalStatus === "approved"
  ).length;

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Compute task distribution by assignee
  const tasksByAssignee = tasks.reduce((acc, task) => {
    const assignee = task.assignee || "Unassigned";
    if (!acc[assignee]) {
      acc[assignee] = { assignee, total: 0, completed: 0, pending: 0 };
    }
    acc[assignee].total += 1;
    if (task.completed) {
      acc[assignee].completed += 1;
    } else {
      acc[assignee].pending += 1;
    }
    return acc;
  }, {});

  // Convert to array for chart
  const assigneeChartData = Object.values(tasksByAssignee).map((item) => ({
    name: item.assignee,
    Total: item.total,
    Completed: item.completed,
    Pending: item.pending,
  }));

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
      title: "Assigned To",
      dataIndex: "assignee",
      key: "assignee",
      render: (assignee) => (
        <Tag color="purple">{assignee || "Not assigned"}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        if (record.completed) return <Tag color="green">Completed</Tag>;
        const overdue =
          record.dueDate && new Date(record.dueDate) < now && !record.completed;
        if (overdue) return <Tag color="red">Overdue</Tag>;
        return <Tag color="orange">Pending</Tag>;
      },
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
      {/* Manager Alert - Pending Approvals */}
      {isManager && pendingApprovalsCount > 0 && (
        <Alert
          message={`You have ${pendingApprovalsCount} task(s) awaiting approval`}
          description={
            <Link to="/approvals">
              <Button type="link">Review pending approvals →</Button>
            </Link>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={isManager ? 4 : 6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Tasks"
              value={totalTasks}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={isManager ? 4 : 6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Completed"
              value={completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={isManager ? 4 : 6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Pending"
              value={pendingTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={isManager ? 4 : 6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Overdue"
              value={overdueTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        {isManager && (
          <>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} style={{ borderRadius: 8 }}>
                <Statistic
                  title="Pending Approvals"
                  value={pendingApprovalsCount}
                  prefix={<ApprovalIcon />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} style={{ borderRadius: 8 }}>
                <Statistic
                  title="Approved"
                  value={approvedTasksCount}
                  prefix={<ApprovalIcon />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </>
        )}
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

      {/* Task Distribution by Assignee Chart */}
      <Card style={{ marginBottom: 24, borderRadius: 8 }}>
        <h3 style={{ marginBottom: 16 }}>📊 Task Distribution by Assignee</h3>
        {assigneeChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assigneeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#1890ff" />
              <Bar dataKey="Completed" fill="#52c41a" />
              <Bar dataKey="Pending" fill="#faad14" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No assignee data" />
        )}
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
                <span>Overdue:</span>
                <strong style={{ color: "#f5222d" }}>{overdueTasks}</strong>
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
