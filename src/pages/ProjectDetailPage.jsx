import React, { useState, useEffect } from "react";
import {
    Card,
    Button,
    Space,
    Tag,
    Divider,
    Row,
    Col,
    Descriptions,
    Empty,
    Modal,
    Table,
    Tabs,
    Progress,
    Alert,
    message,
    Popconfirm,
    Select,
    Input,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    UserAddOutlined,
    UserDeleteOutlined,
    PlusOutlined,
    EyeOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, Link } from "react-router-dom";
import ProjectService from "../services/ProjectService";
import TaskService from "../services/TaskService";
import UserService from "../services/UserService";
import AuthService from "../services/AuthService";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

const { TabPane } = Tabs;
const { Option } = Select;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function ProjectDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [teamStats, setTeamStats] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [assignTaskModalVisible, setAssignTaskModalVisible] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);

    const currentUser = AuthService.getUser();
    const role = currentUser?.role || "employee";
    const isManager = role === "manager" || role === "admin";

    useEffect(() => {
        loadProject();
        loadUsers();
    }, [id]);

    useEffect(() => {
        if (project) {
            loadProjectTasks();
            loadStats();
            loadTeamStats();
        }
    }, [project]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const data = await ProjectService.getProjectById(id);
            setProject(data);
        } catch (err) {
            setError("Failed to load project");
            console.error("Error loading project:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadProjectTasks = async () => {
        try {
            const projectTasks = await ProjectService.getProjectTasks(id);
            setTasks(projectTasks);
        } catch (err) {
            console.error("Error loading project tasks:", err);
        }
    };

    const loadAllTasks = async () => {
        try {
            const allTasksData = await TaskService.getTasks();
            // Filter out tasks that are already assigned to this project
            const unassignedTasks = allTasksData.filter(
                (task) => !task.projectId || task.projectId !== id
            );
            setAllTasks(unassignedTasks);
        } catch (err) {
            console.error("Error loading all tasks:", err);
        }
    };

    const loadUsers = async () => {
        try {
            const usersData = await UserService.getAllUsers();
            setUsers(usersData);
        } catch (err) {
            console.error("Error loading users:", err);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await ProjectService.getProjectStats(id);
            setStats(statsData);
        } catch (err) {
            console.error("Error loading status:", err);
        }
    };

    const loadTeamStats = async () => {
        try {
            const teamStatsData = await ProjectService.getProjectTeamStats(id);
            setTeamStats(teamStatsData);
        } catch (err) {
            console.error("Error loading team stats:", err);
        }
    };

    const handleDeleteProject = async () => {
        try {
            await ProjectService.deleteProject(id);
            message.success("Project deleted successfully");
            navigate("/projects");
        } catch (err) {
            message.error("Failed to delete project");
            console.error("Error deleting project:", err);
        }
    };

    const handleArchiveProject = async () => {
        try {
            await ProjectService.updateProject(id, { status: "archived" });
            message.success("Project archived successfully");
            loadProject();
        } catch (err) {
            message.error("Failed to archive project");
            console.error("Error archiving project:", err);
        }
    };

    const handleAddTeamMember = async (userId, role) => {
        try {
            const user = users.find((u) => u.id === userId || u.email === userId);
            const userName = user?.name || user?.email || userId;
            await ProjectService.addTeamMember(id, userId, userName, role);
            message.success("Team member added successfully");
            loadProject();
            loadTeamStats();
        } catch (err) {
            message.error("Failed to add team member");
            console.error("Error adding team member:", err);
        }
    };

    const handleRemoveTeamMember = async (userId) => {
        try {
            await ProjectService.removeTeamMember(id, userId);
            message.success("Team member removed successfully");
            loadProject();
            loadTeamStats();
        } catch (err) {
            message.error("Failed to remove team member");
            console.error("Error removing team member:", err);
        }
    };

    const handleAssignTask = async () => {
        if (!selectedTaskId) {
            message.warning("Please select a task to assign.");
            return;
        }
        if (!selectedAssignee) {
            message.warning("Please select an assignee from project team.");
            return;
        }
        try {
            await TaskService.updateTask(selectedTaskId, {
                projectId: id,
                assignee: selectedAssignee,
            });
            await ProjectService.assignTaskToProject(id, selectedTaskId);
            message.success("Task assigned to project successfully");
            loadProjectTasks();
            loadProject();
            loadStats();
            setAssignTaskModalVisible(false);
            setSelectedTaskId(null);
            setSelectedAssignee(null);
        } catch (err) {
            message.error("Failed to assign task");
            console.error("Error assigning task:", err);
        }
    };

    const handleRemoveTask = async (taskId) => {
        try {
            // Remove projectId from task
            await TaskService.updateTask(taskId, { projectId: null });
            // Remove task from project's taskIds
            await ProjectService.removeTaskFromProject(id, taskId);
            message.success("Task removed from project successfully");
            loadProjectTasks();
            loadProject();
            loadStats();
        } catch (err) {
            message.error("Failed to remove task");
            console.error("Error removing task:", err);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            active: "green",
            "on-hold": "orange",
            completed: "blue",
            archived: "default",
        };
        return colors[status] || "default";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: "red",
            medium: "orange",
            low: "green",
        };
        return colors[priority] || "default";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error || "Project not found"}</p>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/projects")}>
                    Back to Projects
                </Button>
            </div>
        );
    }

    // Prepare chart data
    const statusChartData = stats
        ? [
            { name: "Completed", value: stats.completedTasks },
            { name: "In Progress", value: stats.inProgressTasks },
            { name: "Pending", value: stats.pendingTasks },
        ]
        : [];

    const taskColumns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text, record) => (
                <Link to={`/tasks/${record.id}`}>{text}</Link>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
            ),
        },
        {
            title: "Priority",
            dataIndex: "priority",
            key: "priority",
            render: (priority) => (
                <Tag color={getPriorityColor(priority)}>{priority}</Tag>
            ),
        },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            key: "dueDate",
            render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Link to={`/tasks/${record.id}`}>
                        <Button icon={<EyeOutlined />} size="small">
                            View
                        </Button>
                    </Link>
                    {isManager && (
                        <Popconfirm
                            title="Remove task from project?"
                            onConfirm={() => handleRemoveTask(record.id)}
                        >
                            <Button icon={<CloseOutlined />} size="small" danger>
                                Remove
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const teamColumns = [
        {
            title: "Name",
            dataIndex: "userName",
            key: "userName",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => <Tag>{role}</Tag>,
        },
        {
            title: "Joined Date",
            dataIndex: "joinedAt",
            key: "joinedAt",
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) =>
                isManager && record.userId !== project.createdBy ? (
                    <Popconfirm
                        title="Remove team member?"
                        onConfirm={() => handleRemoveTeamMember(record.userId)}
                    >
                        <Button icon={<UserDeleteOutlined />} size="small" danger>
                            Remove
                        </Button>
                    </Popconfirm>
                ) : null,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/projects")}
                        style={{ marginBottom: 16 }}
                    >
                        Back to Projects
                    </Button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                        <Tag color={getStatusColor(project.status)}>{project.status}</Tag>
                    </div>
                    {project.description && (
                        <p className="text-gray-600 mt-2">{project.description}</p>
                    )}
                </div>
                {isManager && (
                    <Space>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/projects/${id}/edit`)}
                        >
                            Edit Project
                        </Button>
                        {project.status !== "archived" && (
                            <Button onClick={handleArchiveProject}>Archive</Button>
                        )}
                        <Popconfirm
                            title="Delete this project?"
                            description="Tasks will remain but will be unassigned from this project."
                            onConfirm={handleDeleteProject}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button icon={<DeleteOutlined />} danger>
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>
                )}
            </div>

            {/* Progress Bar */}
            {stats && (
                <Card>
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">Project Progress</span>
                            <span className="text-gray-600">
                                {stats.completedTasks} / {stats.totalTasks} tasks completed
                            </span>
                        </div>
                        <Progress
                            percent={stats.completionPercentage}
                            status="active"
                            strokeColor={{
                                "0%": "#108ee9",
                                "100%": "#87d068",
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.totalTasks}
                            </div>
                            <div className="text-sm text-gray-600">Total Tasks</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.completedTasks}
                            </div>
                            <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.inProgressTasks}
                            </div>
                            <div className="text-sm text-gray-600">In Progress</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-600">
                                {stats.pendingTasks}
                            </div>
                            <div className="text-sm text-gray-600">Pending</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Timeline */}
            <Card>
                <Descriptions title="Project Timeline" bordered column={2}>
                    <Descriptions.Item label="Start Date">
                        {new Date(project.startDate).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="End Date">
                        {new Date(project.endDate).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Duration">
                        {Math.ceil(
                            (new Date(project.endDate) - new Date(project.startDate)) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                    </Descriptions.Item>
                    <Descriptions.Item label="Days Remaining">
                        {Math.max(
                            0,
                            Math.ceil(
                                (new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                            )
                        )}{" "}
                        days
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Tabs */}
            <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    {/* Overview Tab */}
                    <TabPane tab="Overview" key="overview">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Descriptions title="Project Information" bordered column={1}>
                                    <Descriptions.Item label="Category">
                                        {project.category || "-"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Priority">
                                        <Tag color={getPriorityColor(project.priority)}>
                                            {project.priority}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Visibility">
                                        {project.visibility || "team"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Created By">
                                        {project.createdBy}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Created At">
                                        {new Date(project.createdAt).toLocaleString()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Last Updated">
                                        {new Date(project.updatedAt).toLocaleString()}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card title="Team Members" size="small">
                                    <div className="space-y-2">
                                        {project.teamMembers && project.teamMembers.length > 0 ? (
                                            project.teamMembers.map((member) => (
                                                <div
                                                    key={member.userId}
                                                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                                >
                                                    <div>
                                                        <span className="font-medium">{member.userName}</span>
                                                        <Tag className="ml-2">{member.role}</Tag>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(member.joinedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <Empty description="No team members" />
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* Tasks Tab */}
                    <TabPane tab={`Tasks (${tasks.length})`} key="tasks">
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                {isManager && (
                                    <>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => {
                                                loadAllTasks();
                                                setAssignTaskModalVisible(true);
                                            }}
                                        >
                                            Assign Task
                                        </Button>
                                        <Link to={`/tasks/create?projectId=${id}`}>
                                            <Button icon={<PlusOutlined />} className="ml-2">
                                                Create New Task
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        {tasks.length > 0 ? (
                            <Table
                                dataSource={tasks}
                                columns={taskColumns}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                            />
                        ) : (
                            <Empty description="No tasks in this project" />
                        )}

                        {/* Assign Task Modal */}
                        <Modal
                            title="Assign Task to Project"
                            open={assignTaskModalVisible}
                            onCancel={() => {
                                setAssignTaskModalVisible(false);
                                setSelectedTaskId(null);
                                setSelectedAssignee(null);
                            }}
                            onOk={handleAssignTask}
                            okText="Assign"
                            okButtonProps={{ disabled: !selectedTaskId || !selectedAssignee }}
                        >
                            <div className="space-y-4">
                                <div>
                                    <p className="mb-2">Select a task to assign:</p>
                                    <Select
                                        placeholder="Select task"
                                        style={{ width: "100%" }}
                                        value={selectedTaskId}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.children ?? "")
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
                                        onChange={(taskId) => setSelectedTaskId(taskId)}
                                    >
                                        {allTasks.map((task) => (
                                            <Option key={task.id} value={task.id}>
                                                {task.title} ({task.status})
                                            </Option>
                                        ))}
                                    </Select>
                                    {allTasks.length === 0 && (
                                        <p className="text-gray-500 text-sm mt-2">
                                            No available tasks to assign
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <p className="mb-2">Assign to team member:</p>
                                    <Select
                                        placeholder="Select assignee"
                                        style={{ width: "100%" }}
                                        value={selectedAssignee}
                                        onChange={(value) => setSelectedAssignee(value)}
                                    >
                                        {project.teamMembers?.map((member) => (
                                            <Option key={member.userId} value={member.userName}>
                                                {member.userName} ({member.role})
                                            </Option>
                                        ))}
                                    </Select>
                                    {(!project.teamMembers || project.teamMembers.length === 0) && (
                                        <p className="text-gray-500 text-sm mt-2">
                                            No team members available. Add team in Team tab first.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Modal>
                    </TabPane>

                    {/* Team Tab */}
                    <TabPane tab={`Team (${project.teamMembers?.length || 0})`} key="team">
                        {isManager && (
                            <div className="mb-4 flex gap-2 items-end">
                                <div style={{ flex: 1 }}>
                                    <p className="mb-2 text-sm font-medium">Select user:</p>
                                    <Select
                                        placeholder="Select user to add"
                                        style={{ width: "100%" }}
                                        value={selectedUserId}
                                        onChange={(userId) => {
                                            setSelectedUserId(userId);
                                        }}
                                    >
                                        {users
                                            .filter(
                                                (user) =>
                                                    !project.teamMembers?.some(
                                                        (member) => member.userId === user.id || member.userId === user.email
                                                    )
                                            )
                                            .map((user) => (
                                                <Option key={user.id || user.email} value={user.id || user.email}>
                                                    {user.name || user.email} ({user.role || "employee"})
                                                </Option>
                                            ))}
                                    </Select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className="mb-2 text-sm font-medium">Select role:</p>
                                    <Select
                                        placeholder="Select role"
                                        style={{ width: "100%" }}
                                        value={selectedRole}
                                        onChange={(role) => {
                                            setSelectedRole(role);
                                        }}
                                    >
                                        <Option value="developer">Developer</Option>
                                        <Option value="designer">Designer</Option>
                                        <Option value="tester">Tester</Option>
                                        <Option value="manager">Manager</Option>
                                    </Select>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<UserAddOutlined />}
                                    onClick={() => {
                                        if (!selectedUserId) {
                                            message.warning("Please select a user");
                                            return;
                                        }
                                        if (!selectedRole) {
                                            message.warning("Please select a role");
                                            return;
                                        }
                                        handleAddTeamMember(selectedUserId, selectedRole);
                                        setSelectedUserId(null);
                                        setSelectedRole(null);
                                    }}
                                >
                                    Add Member
                                </Button>
                                {users.filter(
                                    (user) =>
                                        !project.teamMembers?.some(
                                            (member) => member.userId === user.id || member.userId === user.email
                                        )
                                ).length === 0 && (
                                        <p className="text-gray-500 text-sm mt-2">
                                            No available users to add
                                        </p>
                                    )}
                            </div>
                        )}
                        <Table
                            dataSource={project.teamMembers || []}
                            columns={teamColumns}
                            rowKey="userId"
                            pagination={false}
                        />
                    </TabPane>

                    {/* Progress Tab */}
                    <TabPane tab="Progress" key="progress">
                        {stats && (
                            <div className="space-y-6">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Card title="Tasks by Status">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={statusChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) =>
                                                            `${name}: ${(percent * 100).toFixed(0)}%`
                                                        }
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {statusChartData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Card title="Tasks by Status (Bar)">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={statusChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="value" fill="#8884d8" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    </Col>
                                </Row>
                                {teamStats && (
                                    <Card title="Team Statistics">
                                        <Descriptions bordered column={2}>
                                            <Descriptions.Item label="Team Size">
                                                {teamStats.memberCount} members
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Productivity Score">
                                                {teamStats.productivityScore}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
}