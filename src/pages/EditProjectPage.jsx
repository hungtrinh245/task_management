import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  InputNumber,
  message,
  Alert,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import ProjectService from "../services/ProjectService";
import AuthService from "../services/AuthService";

const { TextArea } = Input;
const { Option } = Select;

const EditProjectPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [form] = Form.useForm();

  const currentUser = AuthService.getUser();

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoadingProject(true);
      const data = await ProjectService.getProjectById(id);
      setProject(data);

      // Populate form with project data
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        category: data.category,
        startDate: dayjs(data.startDate),
        endDate: dayjs(data.endDate),
        budget: data.budget,
        priority: data.priority,
        status: data.status,
        visibility: data.visibility || "team",
      });
    } catch (err) {
      message.error("Failed to load project");
      console.error("Error loading project:", err);
    } finally {
      setLoadingProject(false);
    }
  };

  // Check if user is manager
  if (!currentUser || currentUser.role !== "manager") {
    return (
      <Card style={{ borderRadius: 8, textAlign: "center" }}>
        <Alert
          message="Access Denied"
          description="Only managers can edit projects."
          type="error"
          showIcon
        />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/projects/${id}`)}
          style={{ marginTop: 16 }}
        >
          Back to Project
        </Button>
      </Card>
    );
  }

  if (loadingProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Project not found</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const projectData = {
        ...values,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        updatedAt: new Date().toISOString(),
        // Preserve existing fields
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        taskIds: project.taskIds || [],
        teamMembers: project.teamMembers || [],
      };

      await ProjectService.updateProject(id, projectData);
      message.success("Project updated successfully!");
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      message.error("Failed to update project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateEndDate = (_, value) => {
    const startDate = form.getFieldValue("startDate");
    if (startDate && value && value.isBefore(startDate)) {
      return Promise.reject(new Error("End date must be after start date"));
    }
    return Promise.resolve();
  };

  const getStatusOptions = () => {
    const currentStatus = project.status;
    const options = [];

    if (currentStatus === "active") {
      options.push(
        { value: "active", label: "Active" },
        { value: "on-hold", label: "On Hold" },
        { value: "completed", label: "Completed" }
      );
    } else if (currentStatus === "on-hold") {
      options.push(
        { value: "on-hold", label: "On Hold" },
        { value: "active", label: "Resume (Active)" },
        { value: "completed", label: "Completed" }
      );
    } else if (currentStatus === "completed") {
      options.push(
        { value: "completed", label: "Completed" },
        { value: "archived", label: "Archive" }
      );
    } else if (currentStatus === "archived") {
      options.push({ value: "archived", label: "Archived (Read-only)" });
    }

    return options;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/projects/${id}`)}
          style={{ marginBottom: 16 }}
        >
          Back to Project
        </Button>
        <h1>Edit Project: {project.name}</h1>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Alert
          message="Note"
          description="Tasks and team members are managed from the project details page."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priority: project.priority || "medium",
            visibility: project.visibility || "team",
            status: project.status,
          }}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: "Please enter project name" },
              { min: 3, message: "Project name must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={4}
              placeholder="Describe the project goals and scope"
            />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Select placeholder="Select project category">
              <Option value="web-development">Web Development</Option>
              <Option value="mobile">Mobile Development</Option>
              <Option value="design">Design</Option>
              <Option value="qa">Quality Assurance</Option>
              <Option value="marketing">Marketing</Option>
              <Option value="backend">Backend</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: "Please select start date" }]}
              style={{ flex: 1 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select start date"
              />
            </Form.Item>

            <Form.Item
              name="endDate"
              label="End Date"
              rules={[
                { required: true, message: "Please select end date" },
                { validator: validateEndDate },
              ]}
              style={{ flex: 1 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select end date"
              />
            </Form.Item>
          </div>


          <Form.Item name="priority" label="Priority">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              {getStatusOptions().map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="visibility" label="Visibility">
            <Select>
              <Option value="private">Private</Option>
              <Option value="team">Team</Option>
              <Option value="public">Public</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update Project
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Read-only info */}
      <Card style={{ marginTop: 16, borderRadius: 8 }}>
        <h3>Project Information (Read-only)</h3>
        <div style={{ marginTop: 16 }}>
          <p>
            <strong>Created By:</strong> {project.createdBy}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(project.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Tasks:</strong> {project.taskIds?.length || 0} tasks
          </p>
          <p>
            <strong>Team Members:</strong> {project.teamMembers?.length || 0}{" "}
            members
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EditProjectPage;

