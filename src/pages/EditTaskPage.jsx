import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Empty,
  Table,
  Divider,
  List,
  Upload,
  Alert,
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthService from "../services/AuthService";
import UserService from "../services/UserService";

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

export default function EditTaskPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const { getTaskById, editTask } = useTasks();
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
  const currentUserRole = currentUser?.role || "employee"; // Default role is employee
  const isManager = currentUserRole === "manager";
  const currentUserName = currentUser?.name || currentUser?.email || "";

  const task = getTaskById(id);

  const genreOptions = [
    { label: "💻 Development", value: "Development" },
    { label: "🎨 Design", value: "Design" },
    { label: "🧪 Testing", value: "Testing" },
    { label: "📚 Documentation", value: "Documentation" },
  ];

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

  useEffect(() => {
    if (task) {
      form.setFieldsValue({
        title: task.title,
        director: task.director || "",
        genre: task.genre || "",
        description: task.description || "",
        dueDate: task.dueDate || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assignee: task.assignee || "",
        tags: task.tags || [],
      });
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
      setAttachments(task.attachments || []);
    }
  }, [task, form]);

  if (!task) {
    return (
      <Card style={{ borderRadius: 8, textAlign: "center" }}>
        <Empty description="Task not found" />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/tasks")}
          style={{ marginTop: 16 }}
        >
          Back to Tasks
        </Button>
      </Card>
    );
  }

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask = {
        id: Date.now().toString(),
        title: newSubtaskTitle,
        completed: false,
      };
      const next = [...subtasks, newSubtask];
      setSubtasks(next);
      syncStatusWithSubtasks(next);
      setNewSubtaskTitle("");
    }
  };

  // Whenever subtasks change, if all subtasks are completed we move the
  // task into the `review` status (not directly to `done`). Final
  // completion must occur after manager approval. This keeps status in
  // sync with the checklist while enforcing review/approval workflow.
  const statusOrder = ["todo", "inprogress", "review", "done", "overdue"];
  const syncStatusWithSubtasks = (nextSubtasks) => {
    if (!nextSubtasks || nextSubtasks.length === 0) return;
    const allDone = nextSubtasks.every((s) => s.completed === true);
    if (allDone) {
      // Update the form field so user sees the change in the UI
      form.setFieldsValue({ status: "review" });
      // Persist change immediately: move task to review (approval remains as-is)
      (async () => {
        try {
          const values = form.getFieldsValue();
          await editTask(id, {
            title: values.title || task.title,
            director: values.director || task.director,
            genre: values.genre || task.genre,
            description: values.description || task.description || "",
            dueDate: values.dueDate || task.dueDate || "",
            status: "review",
            priority: values.priority || task.priority || "medium",
            tags: values.tags || task.tags || [],
            subtasks: nextSubtasks,
            comments: comments,
            attachments: attachments,
            completed: false, // not completed until manager approves
            approvalStatus: task.approvalStatus || "pending",
          });
          message.info("All subtasks completed — task moved to Review.");
        } catch (err) {
          console.error("Auto-save on subtasks completion failed:", err);
        }
      })();
    }
  };

  // Only allow toggling subtasks if task is approved (or manager)
  const canToggleSubtask =
    isManager || task.approvalStatus === "approved";

  const handleToggleSubtask = (subtaskId) => {
    if (!canToggleSubtask) {
      message.warning(
        "Task must be approved by manager before you can update checklist items."
      );
      return;
    }
    const next = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(next);
    syncStatusWithSubtasks(next);
  };

  const handleDeleteSubtask = (subtaskId) => {
    if (!canToggleSubtask) {
      message.warning(
        "Task must be approved by manager before you can modify checklist items."
      );
      return;
    }
    const next = subtasks.filter((s) => s.id !== subtaskId);
    setSubtasks(next);
    syncStatusWithSubtasks(next);
  };

  const handleAddComment = () => {
    // Employees can only comment if task is approved
    if (!isManager && task.approvalStatus !== "approved") {
      message.warning(
        "Task must be approved by manager before you can add comments."
      );
      return;
    }

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

  const handleDeleteComment = (commentId) => {
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const handleAddAttachment = (file) => {
    const newAttachment = {
      id: Date.now().toString(),
      filename: file.name,
      filesize: file.size,
      uploadedAt: new Date().toISOString(),
    };
    setAttachments([...attachments, newAttachment]);
    return false; // Prevent default upload behavior
  };

  const handleDeleteAttachment = (attachmentId) => {
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Determine status & completed with review/approval workflow
      const statusOrder = ["todo", "inprogress", "review", "done", "overdue"];
      const originalStatus = task.status || "todo";
      let status = values.status || originalStatus;
      let completed = false;

      // If there are subtasks and all are done, move to review (not done)
      if (subtasks && subtasks.length > 0) {
        const allDone = subtasks.every((s) => s.completed === true);
        if (allDone) {
          status = "review";
          completed = false; // final completion requires approval
        }
      } else {
        // No subtasks: treat 'done' as completed
        completed = status === "done";
      }

      // Prevent moving backwards in status order (once progressed, cannot go back)
      const originalIdx = statusOrder.indexOf(originalStatus);
      const desiredIdx = statusOrder.indexOf(status);
      if (desiredIdx < originalIdx) {
        // ignore backward change and keep original
        status = originalStatus;
      }

      // Do not allow marking as 'done' unless task has been approved
      if (status === "done" && task.approvalStatus !== "approved") {
        // If approval not granted, keep status at review (or original)
        status = originalStatus === "review" ? "review" : originalStatus;
        completed = false;
      }

      // If due date is in the past and task not completed, mark as overdue
      if (
        !completed &&
        values.dueDate &&
        new Date(values.dueDate) < new Date()
      ) {
        status = "overdue";
      }

      await editTask(id, {
        title: values.title,
        director: values.director,
        genre: values.genre,
        description: values.description || "",
        dueDate: values.dueDate || "",
        status,
        priority: values.priority || "medium",
        assignee: isManager ? values.assignee || "" : task.assignee, // Only manager can reassign
        tags: values.tags || [],
        subtasks,
        comments,
        attachments,
        completed,
        createdBy: task.createdBy || currentUserName, // Keep original creator
        approvalStatus: task.approvalStatus || "pending", // Keep original approval status
      });

      message.success("Task updated successfully!");
      navigate("/tasks");
    } catch {
      message.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  // Compute which status options should be disabled so users cannot move
  // backwards. Also, prevent selecting `done` until the task has been
  // approved by a manager.
  const currentTaskStatus = task.status || "todo";
  const currentStatusIndex = statusOrder.indexOf(currentTaskStatus);
  const optionsWithDisabled = statusOptions.map((opt) => {
    const idx = statusOrder.indexOf(opt.value);
    let disabled = idx < currentStatusIndex; // cannot go back
    if (opt.value === "done" && task.approvalStatus !== "approved") {
      disabled = true; // completed only after approval
    }
    return { ...opt, disabled };
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EditOutlined style={{ fontSize: 24 }} />
            <span>Edit Task: {task.title}</span>
          </div>
        }
        style={{ borderRadius: 8 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {!isManager && (
            <>
              <Alert
                message="Limited Edit Permissions"
                description="As an employee, you can only update the task status, subtasks, comments, and attachments. Other fields are managed by your manager."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {task.approvalStatus !== "approved" && (
                <Alert
                  message="⏳ Awaiting Approval"
                  description="This task is pending manager approval. You cannot update checklist, status, or comments until it is approved. Please contact your manager."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </>
          )}

          {/* Basic Information Section */}
          <h4 style={{ marginTop: 0 }}>📋 Basic Information</h4>

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Task Title{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Task Title"
              )
            }
            name="title"
            rules={[
              { required: true, message: "Please enter task title" },
              { min: 3, message: "Title must be at least 3 characters" },
            ]}
          >
            <Input
              placeholder="Enter task title"
              size="large"
              disabled={!isManager}
            />
          </Form.Item>

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Director/Team{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Director/Team"
              )
            }
            name="director"
            rules={[
              { required: true, message: "Please enter director/team name" },
              {
                min: 2,
                message: "Director name must be at least 2 characters",
              },
            ]}
          >
            <Input
              placeholder="e.g., John Doe, Dev Team"
              size="large"
              disabled={!isManager}
            />
          </Form.Item>

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Genre/Category{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Genre/Category"
              )
            }
            name="genre"
            rules={[{ required: true, message: "Please select a genre" }]}
          >
            <Select
              placeholder="Select genre"
              options={genreOptions}
              size="large"
              disabled={!isManager}
            />
          </Form.Item>

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Description{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Description"
              )
            }
            name="description"
          >
            <Input.TextArea
              placeholder="Enter task description (optional)"
              rows={4}
              disabled={!isManager}
            />
          </Form.Item>

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Due Date{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Due Date"
              )
            }
            name="dueDate"
          >
            <Input
              type="date"
              placeholder="Select due date (optional)"
              size="large"
              disabled={!isManager}
            />
          </Form.Item>

          <Divider />

          {/* Classification Section */}
          <h4>📊 Classification</h4>

          <Form.Item label="Status" name="status">
            <Select
              placeholder="Select status"
              options={optionsWithDisabled}
              size="large"
              disabled={!isManager && task.approvalStatus !== "approved"}
            />
          </Form.Item>

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Priority{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Priority"
              )
            }
            name="priority"
          >
            <Select
              placeholder="Select priority"
              options={priorityOptions}
              size="large"
              disabled={!isManager}
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
            <div
              style={{
                padding: "8px 12px",
                background: "#f5f5f5",
                borderRadius: 4,
                marginBottom: 16,
              }}
            >
              <strong>Assigned to:</strong> {task?.assignee || "Not assigned"}
              <br />
              <small style={{ color: "#999" }}>
                (Employees cannot reassign tasks)
              </small>
            </div>
          )}

          <Form.Item
            label={
              !isManager ? (
                <span>
                  Tags / Labels{" "}
                  <LockOutlined style={{ marginLeft: 4, color: "red" }} />
                </span>
              ) : (
                "Tags / Labels"
              )
            }
            name="tags"
          >
            <Select
              mode="multiple"
              placeholder="Select tags..."
              options={availableTags.map((tag) => ({
                label: tag,
                value: tag,
              }))}
              disabled={!isManager}
            />
          </Form.Item>

          <Divider />

          {/* Subtasks Section */}
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

          {/* Comments Section */}
          <h4>💬 Comments</h4>
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
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteComment(comment.id)}
                        />
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

          {/* Attachments Section */}
          <h4>📎 Attachments</h4>
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
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteAttachment(attachment.id)}
                    />
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

          <Divider />

          {/* Form Actions */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
              >
                Update Task
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
