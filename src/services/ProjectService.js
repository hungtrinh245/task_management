import apiClient from "./apiClient";

const BASE_ENDPOINT = "/projects";

const ProjectService = {
  /**
   * Lấy danh sách projects với filter, search, pagination
   * @param {Object} params - { search, status, page, limit }
   * @returns {Promise<Project[]>}
   */
  async getProjects(params = {}) {
    try {
      const response = await apiClient.get(BASE_ENDPOINT, { params });
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("ProjectService.getProjects error:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết 1 project theo ID
   * @param {string} id
   * @returns {Promise<Project>}
   */
  async getProjectById(id) {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
      return response;
    } catch (error) {
      console.error(`ProjectService.getProjectById(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Tạo project mới
   * @param {Object} projectData - { name, description, startDate, endDate, budget, category, priority }
   * @returns {Promise<Project>}
   */
  async createProject(projectData) {
    try {
      const response = await apiClient.post(BASE_ENDPOINT, {
        ...projectData,
        status: "active",
        visibility: "team",
        taskIds: [],
        teamMembers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error("ProjectService.createProject error:", error);
      throw error;
    }
  },

  /**
   * Cập nhật project
   * @param {string} id
   * @param {Object} updates - { name, description, status, startDate, endDate, budget, priority }
   * @returns {Promise<Project>}
   */
  async updateProject(id, updates) {
    try {
      const response = await apiClient.put(`${BASE_ENDPOINT}/${id}`, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error(`ProjectService.updateProject(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Xoá project
   * @param {string} id
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteProject(id) {
    try {
      const response = await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
      return response || { success: true };
    } catch (error) {
      console.error(`ProjectService.deleteProject(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Thêm team member vào project
   * @param {string} projectId
   * @param {string} userId
   * @param {string} userName
   * @param {string} role - developer, designer, tester, manager
   * @returns {Promise<Project>}
   */
  async addTeamMember(projectId, userId, userName, role = "developer") {
    try {
      const project = await this.getProjectById(projectId);
      const newMember = {
        userId,
        userName,
        role,
        joinedAt: new Date().toISOString(),
      };

      const updatedTeamMembers = [...project.teamMembers, newMember];

      return await this.updateProject(projectId, {
        teamMembers: updatedTeamMembers,
      });
    } catch (error) {
      console.error(
        `ProjectService.addTeamMember(${projectId}, ${userId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Xoá team member khỏi project
   * @param {string} projectId
   * @param {string} userId
   * @returns {Promise<Project>}
   */
  async removeTeamMember(projectId, userId) {
    try {
      const project = await this.getProjectById(projectId);
      const updatedTeamMembers = project.teamMembers.filter(
        (member) => member.userId !== userId
      );

      return await this.updateProject(projectId, {
        teamMembers: updatedTeamMembers,
      });
    } catch (error) {
      console.error(
        `ProjectService.removeTeamMember(${projectId}, ${userId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật role của team member
   * @param {string} projectId
   * @param {string} userId
   * @param {string} newRole
   * @returns {Promise<Project>}
   */
  async updateTeamMemberRole(projectId, userId, newRole) {
    try {
      const project = await this.getProjectById(projectId);
      const updatedTeamMembers = project.teamMembers.map((member) =>
        member.userId === userId ? { ...member, role: newRole } : member
      );

      return await this.updateProject(projectId, {
        teamMembers: updatedTeamMembers,
      });
    } catch (error) {
      console.error(
        `ProjectService.updateTeamMemberRole(${projectId}, ${userId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Gán task vào project
   * @param {string} projectId
   * @param {number} taskId
   * @returns {Promise<Project>}
   */
  async assignTaskToProject(projectId, taskId) {
    try {
      const project = await this.getProjectById(projectId);
      const currentIds = Array.isArray(project.taskIds)
        ? project.taskIds.map((id) => String(id))
        : [];
      const nextIds = currentIds.includes(String(taskId))
        ? currentIds
        : [...currentIds, String(taskId)];
      return await this.updateProject(projectId, { taskIds: nextIds });
    } catch (error) {
      console.error(
        `ProjectService.assignTaskToProject(${projectId}, ${taskId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Gỡ task khỏi project
   * @param {string} projectId
   * @param {number} taskId
   * @returns {Promise<Project>}
   */
  async removeTaskFromProject(projectId, taskId) {
    try {
      const project = await this.getProjectById(projectId);
      const updatedTaskIds = (project.taskIds || [])
        .map((id) => String(id))
        .filter((id) => id !== String(taskId));
      return await this.updateProject(projectId, { taskIds: updatedTaskIds });
    } catch (error) {
      console.error(
        `ProjectService.removeTaskFromProject(${projectId}, ${taskId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Lấy danh sách tasks của project
   * @param {string} projectId
   * @returns {Promise<Task[]>}
   */
  async getProjectTasks(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project.taskIds || project.taskIds.length === 0) {
        return [];
      }

      // Import TaskService để tránh circular dependency
      const TaskService = (await import("./TaskService")).default;
      const allTasks = await TaskService.getTasks();
      const ids = project.taskIds.map((id) => String(id));
      return allTasks.filter((task) => ids.includes(String(task.id)));
    } catch (error) {
      console.error(
        `ProjectService.getProjectTasks(${projectId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Lấy thống kê của project
   * @param {string} projectId
   * @returns {Promise<Object>} - { totalTasks, completedTasks, inProgressTasks, pendingTasks, completionPercentage }
   */
  async getProjectStats(projectId) {
    try {
      const tasks = await this.getProjectTasks(projectId);
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => task.status === "completed")
          .length,
        inProgressTasks: tasks.filter((task) => task.status === "in-progress")
          .length,
        pendingTasks: tasks.filter((task) => task.status === "pending").length,
        completionPercentage:
          tasks.length > 0
            ? Math.round(
                (tasks.filter((task) => task.status === "completed").length /
                  tasks.length) *
                  100
              )
            : 0,
      };
      return stats;
    } catch (error) {
      console.error(
        `ProjectService.getProjectStats(${projectId}) error:`,
        error
      );
      throw error;
    }
  },

  /**
   * Lấy thống kê team của project
   * @param {string} projectId
   * @returns {Promise<Object>} - { memberCount, tasksPerMember, productivityScore }
   */
  async getProjectTeamStats(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      const tasks = await this.getProjectTasks(projectId);

      const tasksPerMember = {};
      tasks.forEach((task) => {
        // Giả sử task có assignee field, nếu không có thì bỏ qua
        if (task.assignee) {
          tasksPerMember[task.assignee] =
            (tasksPerMember[task.assignee] || 0) + 1;
        }
      });

      const stats = {
        memberCount: project.teamMembers.length,
        tasksPerMember,
        productivityScore:
          tasks.length > 0 && project.teamMembers.length > 0
            ? Math.round(tasks.length / project.teamMembers.length)
            : 0,
      };

      return stats;
    } catch (error) {
      console.error(
        `ProjectService.getProjectTeamStats(${projectId}) error:`,
        error
      );
      throw error;
    }
  },
};

export default ProjectService;