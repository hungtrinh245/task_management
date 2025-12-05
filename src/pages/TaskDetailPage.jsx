import React, { useState } from "react";
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
  List,
  Checkbox,
  Form,
  Input,
  message,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import { useNavigate, useParams } from "react-router-dom";

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

export default function TaskDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getTaskById, deleteTask, editTask } = useTasks();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  const task = getTaskById(id);

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

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Task",
      content: "Are you sure you want to delete this task?",
      okText: "Delete",
      okType: "danger",
      onOk() {
        deleteTask(task.id);
        navigate("/tasks");
      },
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/tasks")}
            />
            <span style={{ fontSize: 18, fontWeight: "bold" }}>
              {task.title}
            </span>
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/tasks/edit/${task.id}`)}
            >
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        {/* Basic Info */}
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 1, md: 1, sm: 1, xs: 1 }}
          size="small"
        >
          <Descriptions.Item label="Task ID" span={2}>
            <strong>#{task.id}</strong>
          </Descriptions.Item>

          <Descriptions.Item label="Description" span={2}>
            <div
              style={{
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 4,
                minHeight: 60,
                lineHeight: 1.6,
              }}
            >
              {task.description || (
                <span style={{ color: "#999" }}>No description provided</span>
              )}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Director/Team">
            <Tag color="blue">{task.director || "Not assigned"}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Assigned To">
            <Tag color="purple">{task.assignee || "Not assigned"}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Genre/Category">
            <Tag color="cyan">{task.genre || "Not set"}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Due Date">
            <span>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "Not set"}
              {isOverdue && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  ⚠️ Overdue
                </Tag>
              )}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Completion">
            <Tag color={task.completed ? "green" : "orange"}>
              {task.completed ? "✓ Completed" : "Pending"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Classification Section - READ-ONLY */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>📊 Classification</h4>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Status
            </label>
            <Tag
              color={
                task.status === "done"
                  ? "green"
                  : task.status === "overdue"
                  ? "red"
                  : task.status === "review"
                  ? "orange"
                  : "blue"
              }
            >
              {statusOptions.find((s) => s.value === task.status)?.label ||
                "Todo"}
            </Tag>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Priority
            </label>
            <Tag
              color={
                task.priority === "urgent"
                  ? "red"
                  : task.priority === "high"
                  ? "orange"
                  : task.priority === "low"
                  ? "green"
                  : "blue"
              }
            >
              {priorityOptions.find((p) => p.value === task.priority)?.label ||
                "Medium"}
            </Tag>
          </div>

          {/* Tags/Labels */}
          <div>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Tags / Labels
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(task.tags || []).length > 0 ? (
                (task.tags || []).map((tag) => (
                  <Tag key={tag} color="blue">
                    {tag}
                  </Tag>
                ))
              ) : (
                <span style={{ color: "#999" }}>No tags assigned</span>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* Summary Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 4, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#666" }}>Created</div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 4, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#666" }}>Last Updated</div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                {task.updatedAt
                  ? new Date(task.updatedAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 4, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#666" }}>Status</div>
              <div style={{ marginTop: 4 }}>
                <Tag
                  color={
                    task.status === "done"
                      ? "green"
                      : task.status === "overdue"
                      ? "red"
                      : "blue"
                  }
                >
                  {statusOptions.find((s) => s.value === task.status)?.label ||
                    "Todo"}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 4, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#666" }}>Priority</div>
              <div style={{ marginTop: 4 }}>
                <Tag
                  color={
                    task.priority === "urgent"
                      ? "red"
                      : task.priority === "high"
                      ? "orange"
                      : "blue"
                  }
                >
                  {priorityOptions.find((p) => p.value === task.priority)
                    ?.label || "Medium"}
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Checklist - Display Only */}
      <Card
        title={`Checklist (${
          (task.subtasks || []).filter((s) => s.completed).length
        }/${(task.subtasks || []).length})`}
        style={{ marginTop: 16 }}
      >
        {task.subtasks && task.subtasks.length > 0 ? (
          <>
            <div style={{ marginBottom: 16, fontSize: 12, color: "#666" }}>
              Progress:{" "}
              {Math.round(
                (task.subtasks.filter((s) => s.completed).length /
                  task.subtasks.length) *
                  100
              )}
              %
            </div>
            <List
              dataSource={task.subtasks}
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
                  <Checkbox checked={subtask.completed} disabled />
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
                </List.Item>
              )}
            />
          </>
        ) : (
          <Empty description="No subtasks" style={{ margin: "16px 0" }} />
        )}
        {/* Edit actions available on Edit page */}
      </Card>

      {/* Comments - Display Only */}
      <Card title="Comments" style={{ marginTop: 16 }}>
        {/* Add comment button in card header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div />
          <Button type="link" onClick={() => setIsModalVisible(true)}>
            Add Comment
          </Button>
        </div>
        {task.comments && task.comments.length > 0 ? (
          <List
            dataSource={task.comments}
            renderItem={(comment) => (
              <List.Item key={comment.id}>
                <List.Item.Meta
                  title={comment.author || "Anonymous"}
                  description={
                    comment.createdAt
                      ? new Date(comment.createdAt).toLocaleString()
                      : "Just now"
                  }
                  avatar={
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      {(comment.author?.[0] || "?").toUpperCase()}
                    </div>
                  }
                />
                <div style={{ padding: "8px 0", width: "100%" }}>
                  {comment.text}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No comments yet" style={{ margin: "16px 0" }} />
        )}
        {/* Comments are editable on the Edit page, or add quickly using the modal above */}
        <Modal
          title="Add Comment"
          visible={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          onOk={async () => {
            try {
              const values = await form.validateFields();
              const text = (values.text || "").trim();
              if (!text) {
                message.error("Please enter a comment");
                return;
              }
              setModalLoading(true);
              const author =
                (values.author && values.author.trim()) || "Anonymous";
              const newComment = {
                id: Date.now().toString(),
                author,
                text,
                createdAt: new Date().toISOString(),
              };

              // merge with full task object to avoid partial updates
              const merged = {
                ...task,
                comments: [...(task.comments || []), newComment],
                updatedAt: new Date().toISOString(),
              };

              await editTask(task.id, merged);
              message.success("Comment added");
              setIsModalVisible(false);
              form.resetFields();
            } catch (err) {
              // validation errors are handled by form; other errors:
              console.error(err);
              message.error("Failed to add comment");
            } finally {
              setModalLoading(false);
            }
          }}
          confirmLoading={modalLoading}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="author" label="Name (optional)">
              <Input placeholder="Your name" />
            </Form.Item>
            <Form.Item
              name="text"
              label="Comment"
              rules={[{ required: true, message: "Please enter a comment" }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>

      {/* Attachments - Display Only */}
      <Card title="Attachments" style={{ marginTop: 16 }}>
        {task.attachments && task.attachments.length > 0 ? (
          <List
            dataSource={task.attachments}
            renderItem={(attachment) => (
              <List.Item key={attachment.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {attachment.filename || "File"}
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
          <Empty description="No attachments" style={{ margin: "16px 0" }} />
        )}
        {/* Attachments are managed on the Edit page */}
      </Card>
    </div>
  );
}
