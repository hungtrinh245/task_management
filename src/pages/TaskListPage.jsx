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
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTasks } from "../contexts/TaskContext";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

export default function TaskListPage() {
  const { tasks, deleteTask, toggleTask } = useTasks();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Lọc tasks dựa vào tìm kiếm và status
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchText.toLowerCase()) ||
        task.director.toLowerCase().includes(searchText.toLowerCase()) ||
        task.genre.toLowerCase().includes(searchText.toLowerCase());

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

  const columns = [
    {
      title: "",
      dataIndex: "id",
      key: "checkbox",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.completed}
          onChange={() => toggleTask(record.id)}
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
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "300px" }}
          />
          <Select
            style={{ width: "150px" }}
            value={filterStatus}
            onChange={setFilterStatus}
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
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        ) : (
          <Empty
            description={searchText || filterStatus !== "all" ? "No tasks match your filters" : "No tasks yet"}
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
