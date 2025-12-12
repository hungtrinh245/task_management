import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Space, Progress, Popconfirm, message } from "antd";
import { EditOutlined, DeleteOutlined, InboxOutlined  } from "@ant-design/icons";
import ProjectService from "../services/ProjectService";
import AuthService from "../services/AuthService";
import Card from "../components/common/Card";

const ProjectListPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const currentUser = AuthService.getUser();
  const isManager = currentUser?.role === "manager";

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProjects();
      setProjects(data);
      
      // Load stats for each project
      const statsPromises = data.map(async (project) => {
        try {
          const stats = await ProjectService.getProjectStats(project.id);
          return { projectId: project.id, stats };
        } catch (err) {
          console.error(`Error loading stats for project ${project.id}:`, err);
          return { projectId: project.id, stats: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ projectId, stats }) => {
        statsMap[projectId] = stats;
      });
      setProjectStats(statsMap);
    } catch (err) {
      setError("Failed to load projects");
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (projectId) => {
    try {
      await ProjectService.updateProject(projectId, { status: "archived" });
      message.success("Project archived successfully");
      loadProjects();
    } catch (err) {
      message.error("Failed to archive project");
      console.error("Error archiving project:", err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await ProjectService.deleteProject(projectId);
      message.success("Project deleted successfully");
      loadProjects();
    } catch (err) {
      message.error("Failed to delete project");
      console.error("Error deleting project:", err);
    }
  };

  const filteredProjects = projects.filter((project) => {
  const matchesSearch =
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = !statusFilter || project.status === statusFilter;
  return matchesSearch && matchesStatus;
});

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      "on-hold": "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      archived: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusClasses[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadProjects}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link
          to="/projects/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No projects found</p>
          <Link
            to="/projects/create"
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {project.name}
                  </h3>
                  {getStatusBadge(project.status)}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tasks:</span>
                    <span className="font-medium">
                      {projectStats[project.id]?.totalTasks || project.taskIds?.length || 0}
                    </span>
                  </div>
                  {projectStats[project.id] && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Completion:</span>
                        <span>{projectStats[project.id].completionPercentage}%</span>
                      </div>
                      <Progress
                        percent={projectStats[project.id].completionPercentage}
                        size="small"
                        strokeColor={{
                          "0%": "#108ee9",
                          "100%": "#87d068",
                        }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Team:</span>
                    <span className="font-medium">
                      {project.teamMembers?.length || 0} members
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Priority:</span>
                    <span
                      className={`font-medium ${
                        project.priority === "high"
                          ? "text-red-600"
                          : project.priority === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {project.priority}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>
                    {formatDate(project.startDate)} -{" "}
                    {formatDate(project.endDate)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
                  >
                    View Details
                  </Link>
                  {isManager && (
                    <Space>
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => navigate(`/projects/${project.id}/edit`)}
                      />
                      {project.status !== "archived" && (
                        <Popconfirm
                          title="Archive this project?"
                          onConfirm={() => handleArchiveProject(project.id)}
                        >
                          <Button
                            icon={<InboxOutlined  />}
                            size="small"
                          />
                        </Popconfirm>
                      )}
                      <Popconfirm
                        title="Delete this project?"
                        description="Tasks will remain but will be unassigned."
                        onConfirm={() => handleDeleteProject(project.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          icon={<DeleteOutlined />}
                          size="small"
                          danger
                        />
                      </Popconfirm>
                    </Space>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectListPage;