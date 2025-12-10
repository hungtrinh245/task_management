import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Divider,
  List,
  Empty,
  Upload,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthService from "../services/AuthService";
import UserService from "../services/UserService";
import SmartSuggestions from "../components/SmartSuggestions";

export default function CreateTaskPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { addTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [attachments, setAttachments] = useState([]);

  // Get current logged-in user
  const currentUser = AuthService.getUser();
  // Use user's name if available; fallback to email or empty string
  const currentUserName = currentUser?.name || currentUser?.email || "";
  const currentUserRole = currentUser?.role || "employee"; // Default role is employee
  const isManager = currentUserRole === "manager";

  // Guard: only manager can create task
  if (!isManager) {
    return (
      <Card style={{ borderRadius: 8, textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>Only managers can create tasks.</p>
        <Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>
      </Card>
    );
  }

  // Load assignee options from database
  useEffect(() => {
    const loadAssignees = async () => {
      const users = await UserService.getAllUsers();
      const options = users.map((user) => ({
        label: `👤 ${user.name}`,
        value: user.name,
      }));
      setAssigneeOptions(options);
    };
    loadAssignees();
  }, []);

  const genreOptions = [
    { label: "💻 Development", value: "Development" },
    { label: "🎨 Design", value: "Design" },
    { label: "🧪 Testing", value: "Testing" },
    { label: "📚 Documentation", value: "Documentation" },
  ];

  const statusOptions = [
    { label: "📋 Todo", value: "todo" },
    { label: "⏳ In Progress", value: "inprogress" },
    { label: "🔍 Review", value: "review" },
    { label: "✅ Complete", value: "done" },
    { label: "⚠️ Quá hạn", value: "overdue" },
  ];

  const priorityOptions = [
    { label: "🟢 Low", value: "low" },
    { label: "🟡 Medium", value: "medium" },
    { label: "🔴 High", value: "high" },
    { label: "⚡ Urgent", value: "urgent" },
  ];

  const availableTags = [
    "important",
    "bug",
    "feature",
    "enhancement",
    "documentation",
    "testing",
  ];

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask = {
        id: Date.now().toString(),
        title: newSubtaskTitle,
        completed: false,
      };
      const next = [...subtasks, newSubtask];
      setSubtasks(next);
      setNewSubtaskTitle("");
    }
  };

  const handleToggleSubtask = (subtaskId) => {
    const next = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(next);
  };

  const handleDeleteSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
  };

  const handleAddComment = () => {
    const text = (newCommentText || "").trim();
    if (!text) return;
    const newComment = {
      id: Date.now().toString(),
      author: (newCommentAuthor && newCommentAuthor.trim()) || "Anonymous",
      text,
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
    setNewCommentText("");
    setNewCommentAuthor("");
  };

  const handleAddAttachment = (file) => {
    const newAttachment = {
      id: Date.now().toString(),
      filename: file.name,
      filesize: file.size,
      uploadedAt: new Date().toISOString(),
    };
    setAttachments([...attachments, newAttachment]);
    return false; // prevent default upload
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Determine status based on subtasks and apply review/approval rules.
      let status = values.status || "todo";
      let completed = false;

      if (subtasks && subtasks.length > 0) {
        const allDone = subtasks.every((s) => s.completed === true);
        if (allDone) {
          // Move to review when all checklist items are completed.
          status = "review";
          completed = false; // final completion requires manager approval
        }
      } else {
        // No subtasks: allow immediate completion only if creator is manager
        if (status === "done") {
          if (isManager) {
            completed = true;
          } else {
            // Employees cannot mark as done without approval — put into review
            status = "review";
            completed = false;
          }
        }
      }

      // If due date is in the past and task not completed, mark as overdue
      if (
        !completed &&
        values.dueDate &&
        new Date(values.dueDate) < new Date()
      ) {
        status = "overdue";
      }

      await addTask({
        title: values.title,
        director: values.director,
        genre: values.genre,
        description: values.description || "",
        dueDate: values.dueDate || "",
        status,
        priority: values.priority || "medium",
        assignee: values.assignee || currentUserName, // Auto-assign to self if not manager
        tags: values.tags || [],
        subtasks,
        comments,
        attachments,
        completed,
        createdBy: currentUserName, // Track who created this task
        approvalStatus: isManager ? "approved" : "pending", // Manager tasks auto-approved, employee tasks pending
      });

      message.success("Task created successfully!");
      navigate("/tasks");
    } catch {
      message.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ fontSize: 24 }} />
            <span>Create New Task</span>
          </div>
        }
        style={{ borderRadius: 8 }}
      >
        <SmartSuggestions
          form={form}
          onSuggestionApply={(type, value) => {
            if (type === "subtasks") {
              setSubtasks(value);
            }
          }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            assignee: currentUserName,
          }}
        >
          <Form.Item
            label="Task Title"
            name="title"
            rules={[
              { required: true, message: "Please enter task title" },
              { min: 3, message: "Title must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter task title" size="large" />
          </Form.Item>

          <Form.Item
            label="Director/Team"
            name="director"
            rules={[
              { required: true, message: "Please enter director/team name" },
              {
                min: 2,
                message: "Director name must be at least 2 characters",
              },
            ]}
          >
            <Input placeholder="e.g., John Doe, Dev Team" size="large" />
          </Form.Item>

          <Form.Item
            label="Genre/Category"
            name="genre"
            rules={[{ required: true, message: "Please select a genre" }]}
          >
            <Select
              placeholder="Select genre"
              options={genreOptions}
              size="large"
            />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              placeholder="Enter task description (optional)"
              rows={4}
            />
          </Form.Item>

          <Form.Item label="Due Date" name="dueDate">
            <Input
              type="date"
              placeholder="Select due date (optional)"
              size="large"
            />
          </Form.Item>

          <Divider />

          {/* Classification */}
          <h4>📊 Classification</h4>
          <Form.Item label="Status" name="status" initialValue="todo">
            <Select
              placeholder="Select status"
              options={statusOptions}
              size="large"
            />
          </Form.Item>

          <Form.Item label="Priority" name="priority" initialValue="medium">
            <Select
              placeholder="Select priority"
              options={priorityOptions}
              size="large"
            />
          </Form.Item>

          {isManager ? (
            <Form.Item label="👔 Assign To (Manager only)" name="assignee">
              <Select
                placeholder="Select person to assign"
                options={assigneeOptions}
                allowClear
                size="large"
              />
            </Form.Item>
          ) : (
            <Form.Item hidden name="assignee" initialValue={currentUserName}>
              <Input type="hidden" />
            </Form.Item>
          )}

          <Form.Item label="Tags / Labels" name="tags">
            <Select
              mode="multiple"
              placeholder="Select tags..."
              options={availableTags.map((tag) => ({ label: tag, value: tag }))}
            />
          </Form.Item>

          <Divider />

          {/* Subtasks / Checklist */}
          <h4>✅ Subtasks / Checklist</h4>
          <Card
            size="small"
            style={{ marginBottom: 16, background: "#fafafa" }}
          >
            {subtasks.length > 0 ? (
              <List
                dataSource={subtasks}
                renderItem={(subtask) => (
                  <List.Item
                    key={subtask.id}
                    style={{
                      padding: "8px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      style={{
                        flex: 1,
                        textDecoration: subtask.completed
                          ? "line-through"
                          : "none",
                        opacity: subtask.completed ? 0.6 : 1,
                      }}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No subtasks yet"
                style={{ margin: "16px 0" }}
              />
            )}
          </Card>

          <Space style={{ width: "100%", marginBottom: 16 }}>
            <Input
              placeholder="Add new subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onPressEnter={handleAddSubtask}
              size="small"
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddSubtask}
            >
              Add
            </Button>
          </Space>

          <Divider />

          {/* Comments */}
          <h4>💬 Comments (optional)</h4>
          <Card
            size="small"
            style={{ marginBottom: 16, background: "#fafafa" }}
          >
            {comments.length > 0 ? (
              <List
                dataSource={comments}
                renderItem={(comment) => (
                  <List.Item
                    key={comment.id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid #e8e8e8",
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <strong>{comment.author}</strong>
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                      >
                        {comment.createdAt
                          ? new Date(comment.createdAt).toLocaleString()
                          : ""}
                      </div>
                      <div>{comment.text}</div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No comments yet"
                style={{ margin: "16px 0" }}
              />
            )}
          </Card>

          <Space
            style={{
              width: "100%",
              gap: 0,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <Input
              placeholder="Your name"
              value={newCommentAuthor}
              onChange={(e) => setNewCommentAuthor(e.target.value)}
              size="small"
              style={{ flex: "0 0 20%" }}
            />
            <Input.TextArea
              placeholder="Add comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={2}
              style={{ flex: 1, marginLeft: 8, marginRight: 8 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddComment}
            >
              Add
            </Button>
          </Space>

          <Divider />

          {/* Attachments */}
          <h4>📎 Attachments (optional)</h4>
          <Card
            size="small"
            style={{ marginBottom: 16, background: "#fafafa" }}
          >
            {attachments.length > 0 ? (
              <List
                dataSource={attachments}
                renderItem={(attachment) => (
                  <List.Item key={attachment.id} style={{ padding: "8px 0" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>
                        {attachment.filename}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {attachment.filesize
                          ? `${(attachment.filesize / 1024).toFixed(2)} KB`
                          : ""}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No attachments"
                style={{ margin: "16px 0" }}
              />
            )}
          </Card>

          <Upload
            beforeUpload={handleAddAttachment}
            maxCount={1}
            style={{ marginBottom: 16 }}
          >
            <Button icon={<PlusOutlined />}>Upload Attachment</Button>
          </Upload>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
              >
                Create Task
              </Button>
              <Button size="large" onClick={() => navigate("/tasks")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
