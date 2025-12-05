import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Empty,
  Row,
  Col,
  Statistic,
  Checkbox,
  Input,
  Select,
  Spin,
  Alert,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import { Link } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import AuthService from "../services/AuthService";

export default function MyTasksPage() {
  const { tasks, loading, error, deleteTask, toggleTask } = useTasks();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Get current logged-in user
  const currentUser = AuthService.getUser();
  const currentUserName = currentUser?.name || currentUser?.email || "";

  // Xử lý thay đổi search
  const handleSearch = useCallback((value) => {
    setSearchText(value);
    setCurrentPage(1);
  }, []);

  // Xử lý thay đổi filter
  const handleFilterStatus = useCallback((value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  }, []);

  // Filter tasks: only show tasks assigned to current user
  const myTasks = useMemo(() => {
    return tasks.filter((task) => task.assignee === currentUserName);
  }, [tasks, currentUserName]);

  // Filter my tasks based on search and status
  const filteredTasks = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return myTasks.filter((task) => {
      const title = String(task.title || "").toLowerCase();
      const director = String(task.director || "").toLowerCase();
      const genre = String(task.genre || "").toLowerCase();

      const matchesSearch =
        q === "" ||
        title.includes(q) ||
        director.includes(q) ||
        genre.includes(q);

      const isOverdue =
        task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "completed" && task.completed) ||
        (filterStatus === "pending" && !task.completed && !isOverdue) ||
        (filterStatus === "overdue" && isOverdue);

      return matchesSearch && matchesStatus;
    });
  }, [myTasks, searchText, filterStatus]);

  // Calculate stats for my tasks only
  const myCompletedCount = myTasks.filter((t) => t.completed).length;
  const myPendingCount = myTasks.filter((t) => !t.completed).length;
  const myOverdueCount = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
  ).length;
  const myCompletionRate =
    myTasks.length > 0
      ? Math.round((myCompletedCount / myTasks.length) * 100)
      : 0;

  // Loading state
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
        <Spin size="large" tip="Loading your tasks..." />
      </div>
    );
  }

  // Error state
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

  // Not authenticated state
  if (!currentUserName) {
    return (
      <Alert
        message="Not Authenticated"
        description="Please log in to view your tasks"
        type="warning"
        showIcon
        style={{ margin: "24px" }}
      />
    );
  }

  // Table columns
  const columns = [
    {
      title: "",
      dataIndex: "id",
      key: "checkbox",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={Boolean(record.completed)}
          onChange={(e) => toggleTask(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <span
          style={{
            textDecoration: record.completed ? "line-through" : "none",
            opacity: record.completed ? 0.6 : 1,
          }}
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
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const colorMap = {
          urgent: "red",
          high: "orange",
          medium: "blue",
          low: "green",
        };
        return (
          <Tag color={colorMap[priority] || "blue"}>
            {priority
              ? priority.charAt(0).toUpperCase() + priority.slice(1)
              : "N/A"}
          </Tag>
        );
      },
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
      render: (_, record) => {
        if (record.completed) return <Tag color="green">✓ Completed</Tag>;
        const overdue =
          record.dueDate &&
          new Date(record.dueDate) < new Date() &&
          !record.completed;
        if (overdue) return <Tag color="red">Overdue</Tag>;
        return <Tag color="orange">Pending</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Link to={`/tasks/${record.id}`}>
            <Button type="primary" icon={<EyeOutlined />} size="small" />
          </Link>
          <Link to={`/tasks/edit/${record.id}`}>
            <Button icon={<EditOutlined />} size="small" />
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              if (window.confirm("Delete this task?")) {
                deleteTask(record.id);
              }
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: "#f0f2f5", padding: "24px" }}>
      {/* Header with user info */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <UserOutlined style={{ fontSize: 32 }} />
          <div>
            <h2 style={{ margin: 0, color: "white" }}>My Tasks</h2>
            <p style={{ margin: "4px 0 0 0", opacity: 0.9 }}>
              Assigned to: <strong>{currentUserName}</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="My Total Tasks"
              value={myTasks.length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Completed"
              value={myCompletedCount}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Pending"
              value={myPendingCount}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Completion Rate"
              value={myCompletionRate}
              suffix="%"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Overdue Alert */}
      {myOverdueCount > 0 && (
        <Alert
          message={`⚠️ You have ${myOverdueCount} overdue task(s)`}
          type="warning"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Tasks Table */}
      <Card
        title="My Tasks"
        extra={
          <Link to="/tasks/create">
            <Button type="primary" icon={<PlusOutlined />}>
              New Task
            </Button>
          </Link>
        }
        style={{ borderRadius: 8 }}
      >
        {/* Search and Filter Section */}
        <Space style={{ marginBottom: 16, width: "100%", gap: 16 }}>
          <Input
            placeholder="Search by title, director, or genre..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: "300px" }}
          />
          <Select
            style={{ width: "150px" }}
            value={filterStatus}
            onChange={handleFilterStatus}
            options={[
              { label: "All Status", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Completed", value: "completed" },
              { label: "Overdue", value: "overdue" },
            ]}
          />
        </Space>

        {filteredTasks.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredTasks}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredTasks.length,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              pageSizeOptions: ["5", "10", "20"],
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tasks`,
              style: { marginTop: 16 },
            }}
            size="middle"
          />
        ) : (
          <Empty
            description={
              searchText || filterStatus !== "all"
                ? "No tasks match your filters"
                : "No tasks assigned to you yet"
            }
            style={{ marginTop: 48, marginBottom: 48 }}
          >
            {!searchText && filterStatus === "all" && (
              <Link to="/tasks/create">
                <Button type="primary" icon={<PlusOutlined />}>
                  Create Your First Task
                </Button>
              </Link>
            )}
          </Empty>
        )}
      </Card>
    </div>
  );
}
