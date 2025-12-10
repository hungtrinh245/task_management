import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  InputNumber,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
// import dayjs from "dayjs";
import ProjectService from "../services/ProjectService";
import AuthService from "../services/AuthService";

const { TextArea } = Input;
const { Option } = Select;

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const currentUser = AuthService.getUser();
  const currentRole = currentUser?.role || "employee";
  const isManager = currentRole === "manager" || currentRole === "admin";

  // Check if user is manager/admin
  if (!isManager) {
    return (
      <Card style={{ borderRadius: 8, textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>Only managers/admin can create projects.</p>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/projects")}
        >
          Back to Projects
        </Button>
      </Card>
    );
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const projectData = {
        ...values,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        status: "active",
        createdBy:
          currentUser?.name ||
          currentUser?.email ||
          currentUser?.username ||
          "manager",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        taskIds: [],
        teamMembers: values.teamMembers
          ? values.teamMembers.map((userId) => ({
              userId,
              userName: userId, // In a real app, you'd fetch user names
              role: "developer", // Default role
              joinedAt: new Date().toISOString().split("T")[0],
            }))
          : [],
      };

      await ProjectService.createProject(projectData);
      message.success("Project created successfully!");
      navigate("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      message.error("Failed to create project. Please try again.");
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/projects")}
          style={{ marginBottom: 16 }}
        >
          Back to Projects
        </Button>
        <h1>Create New Project</h1>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priority: "medium",
            visibility: "team",
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

          <Form.Item name="visibility" label="Visibility">
            <Select>
              <Option value="private">Private</Option>
              <Option value="team">Team</Option>
              <Option value="public">Public</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="teamMembers"
            label="Initial Team Members"
            help="You can add more team members after creating the project"
          >
            <Select
              mode="multiple"
              placeholder="Select team members"
              allowClear
            >
              {/* In a real app, you'd fetch users from UserService */}
              <Option value="emp001">John (Developer)</Option>
              <Option value="emp002">Jane (Designer)</Option>
              <Option value="emp003">Bob (QA)</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create Project
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateProjectPage;
