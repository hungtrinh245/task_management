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
import AuthService from "../services/AuthService";
import { Link } from "react-router-dom";
import { useState, useMemo, useCallback, useEffect } from "react";
import ProjectService from "../services/ProjectService";

export default function TaskListPage() {
  const { tasks, loading, error, deleteTask, toggleTask } = useTasks();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [projectMap, setProjectMap] = useState({});
  const [filterProject, setFilterProject] = useState("all");

  // Get current user
  const currentUser = AuthService.getUser();
  const currentUserRole = currentUser?.role || "employee";
  const currentUserName = currentUser?.name || currentUser?.email || "";
  const isManager = currentUserRole === "manager";

  const assigneeOptions = [
    { label: "👤 Nguyễn Văn A", value: "Nguyễn Văn A" },
    { label: "👤 Trần Thị B", value: "Trần Thị B" },
    { label: "👤 Lê Văn C", value: "Lê Văn C" },
    { label: "👤 Phạm Hồng D", value: "Phạm Hồng D" },
    { label: "👤 Vũ Minh E", value: "Vũ Minh E" },
  ];

  // Map projectId -> project name để hiển thị trong danh sách task
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await ProjectService.getProjects();
        const map = {};
        projects.forEach((p) => {
          map[p.id] = p.name;
        });
        setProjectMap(map);
      } catch (err) {
        // Không block UI nếu lỗi, chỉ log
        console.error("Failed to load projects for task list:", err);
      }
    };

    loadProjects();
  }, []);

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

  const handleFilterAssignee = useCallback((value) => {
    setFilterAssignee(value);
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

      const isOverdue =
        task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "completed" && task.completed) ||
        (filterStatus === "pending" && !task.completed && !isOverdue) ||
        (filterStatus === "overdue" && isOverdue);

      const matchesAssignee =
        filterAssignee === "all" || task.assignee === filterAssignee;

      const matchesProject =
        filterProject === "all" ||
        (task.projectId && String(task.projectId) === String(filterProject));

      // Employee can only see tasks assigned to them
      const matchesRole = isManager || task.assignee === currentUserName;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAssignee &&
        matchesProject &&
        matchesRole
      );
    });
  }, [
    tasks,
    searchText,
    filterStatus,
    filterAssignee,
    filterProject,
    isManager,
    currentUserName,
  ]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const completionRate =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

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
      title: "Project",
      dataIndex: "projectId",
      key: "projectId",
      render: (projectId) =>
        projectId
          ? projectMap[projectId] || projectId
          : "Not assigned",
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
              { label: "Overdue", value: "overdue" },
            ]}
          />
          {isManager && (
            <Select
              style={{ width: "180px" }}
              value={filterAssignee}
              onChange={handleFilterAssignee}
              options={[
                { label: "All Assignees", value: "all" },
                ...assigneeOptions,
              ]}
            />
          )}
          <Select
            style={{ width: "200px" }}
            value={filterProject}
            onChange={setFilterProject}
            options={[
              { label: "All Projects", value: "all" },
              ...Object.entries(projectMap).map(([id, name]) => ({
                label: name,
                value: id,
              })),
            ]}
            placeholder="Filter by project"
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
