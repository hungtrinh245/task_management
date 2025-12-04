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
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

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
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [attachments, setAttachments] = useState([]);

  const task = getTaskById(id);

  const genreOptions = [
    { label: "💻 Development", value: "Development" },
    { label: "🎨 Design", value: "Design" },
    { label: "🧪 Testing", value: "Testing" },
    { label: "📚 Documentation", value: "Documentation" },
  ];

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

  // Whenever subtasks change, if all subtasks are completed we can auto-set
  // the task status to `done`. This keeps status in sync with the checklist.
  const syncStatusWithSubtasks = (nextSubtasks) => {
    if (!nextSubtasks || nextSubtasks.length === 0) return;
    const allDone = nextSubtasks.every((s) => s.completed === true);
    if (allDone) {
      // Update the form field so user sees the change in the UI
      form.setFieldsValue({ status: "done" });
      // Persist change immediately: mark task as done on server
      (async () => {
        try {
          const values = form.getFieldsValue();
          await editTask(id, {
            title: values.title || task.title,
            director: values.director || task.director,
            genre: values.genre || task.genre,
            description: values.description || task.description || "",
            dueDate: values.dueDate || task.dueDate || "",
            status: "done",
            priority: values.priority || task.priority || "medium",
            tags: values.tags || task.tags || [],
            subtasks: nextSubtasks,
            comments: comments,
            attachments: attachments,
            completed: true,
          });
          message.success(
            "Task marked complete because all subtasks are done."
          );
        } catch (err) {
          console.error("Auto-save on subtasks completion failed:", err);
        }
      })();
    }
  };

  const handleToggleSubtask = (subtaskId) => {
    const next = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(next);
    syncStatusWithSubtasks(next);
  };

  const handleDeleteSubtask = (subtaskId) => {
    const next = subtasks.filter((s) => s.id !== subtaskId);
    setSubtasks(next);
    syncStatusWithSubtasks(next);
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

      // Determine completed based on status or subtasks
      let status = values.status || "todo";
      let completed = false;
      if (subtasks && subtasks.length > 0) {
        const allDone = subtasks.every((s) => s.completed === true);
        if (allDone) {
          status = "done";
          completed = true;
        }
      } else {
        completed = status === "done";
      }

      // If due date is in the past and task not completed, mark as overdue
      if (!completed && values.dueDate && new Date(values.dueDate) < new Date()) {
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
        tags: values.tags || [],
        subtasks,
        comments,
        attachments,
        completed,
      });

      message.success("Task updated successfully!");
      navigate("/tasks");
    } catch {
      message.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Basic Information Section */}
          <h4 style={{ marginTop: 0 }}>📋 Basic Information</h4>

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

          {/* Classification Section */}
          <h4>📊 Classification</h4>

          <Form.Item label="Status" name="status">
            <Select
              placeholder="Select status"
              options={statusOptions}
              size="large"
            />
          </Form.Item>

          <Form.Item label="Priority" name="priority">
            <Select
              placeholder="Select priority"
              options={priorityOptions}
              size="large"
            />
          </Form.Item>

          <Form.Item label="Tags / Labels" name="tags">
            <Select
              mode="multiple"
              placeholder="Select tags..."
              options={availableTags.map((tag) => ({
                label: tag,
                value: tag,
              }))}
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
