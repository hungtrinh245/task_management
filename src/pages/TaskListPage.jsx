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
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import { Link } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";

export default function TaskListPage() {
  const { tasks, loading, error, deleteTask, toggleTask } = useTasks();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Xử lý thay đổi search - reset trang về 1
  const handleSearch = useCallback((value) => {
    setSearchText(value);
    setCurrentPage(1);
  }, []);

  // Xử lý thay đổi filter - reset trang về 1
  const handleFilterStatus = useCallback((value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  }, []);

  // Lọc tasks dựa vào tìm kiếm và status
  const filteredTasks = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return tasks.filter((task) => {
      // Guard fields that may be undefined
      const title = String(task.title || "").toLowerCase();
      const director = String(task.director || "").toLowerCase();
      const genre = String(task.genre || "").toLowerCase();

      const matchesSearch =
        q === "" ||
        title.includes(q) ||
        director.includes(q) ||
        genre.includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "completed" && task.completed) ||
        (filterStatus === "pending" && !task.completed);

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchText, filterStatus]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const completionRate =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Hiển thị loading khi đang lấy dữ liệu
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
          {completed ? "✓ Completed" : "Pending"}
        </Tag>
      ),
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
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic title="Total Tasks" value={tasks.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Completed"
              value={completedCount}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Pending"
              value={pendingCount}
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

      {/* Tasks Table */}
      <Card
        title="All Tasks"
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
                : "No tasks yet"
            }
            style={{ marginTop: 48, marginBottom: 48 }}
          >
            {!searchText && filterStatus === "all" && (
              <Link to="/tasks/create">
                <Button type="primary" icon={<PlusOutlined />}>
                  Create First Task
                </Button>
              </Link>
            )}
          </Empty>
        )}
      </Card>
    </div>
  );
}
