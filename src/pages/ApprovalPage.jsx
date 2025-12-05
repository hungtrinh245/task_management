import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Empty,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useTasks } from "../hooks/useTasks";
import AuthService from "../services/AuthService";

export default function ApprovalPage() {
  const { tasks, editTask } = useTasks();
  const [loading, setLoading] = useState(false);

  // Get current logged-in user
  const currentUser = AuthService.getUser();
  const currentUserRole = currentUser?.role || "employee";
  const isManager = currentUserRole === "manager";

  // Only managers can view this page
  if (!isManager) {
    return (
      <Alert
        message="Access Denied"
        description="Only managers can access the approval page."
        type="error"
        showIcon
      />
    );
  }

  // Get tasks pending approval
  const pendingTasks = tasks.filter((t) => t.approvalStatus === "pending");
  const approvedTasks = tasks.filter((t) => t.approvalStatus === "approved");
  const rejectedTasks = tasks.filter((t) => t.approvalStatus === "rejected");

  const handleApprove = (taskId) => {
    Modal.confirm({
      title: "Approve Task",
      content:
        "Approving this task will allow the employee to update checklist items and progress. The task will be ready for work.",
      okText: "Approve",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setLoading(true);
          const task = tasks.find((t) => t.id === taskId);
          // Mark approved: only change approvalStatus, keep status as-is
          // Employee can now update checklist and status
          await editTask(taskId, {
            ...task,
            approvalStatus: "approved",
          });
          message.success(
            "Task approved! Employee can now start working on it."
          );
        } catch {
          message.error("Failed to approve task");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleReject = (taskId) => {
    Modal.confirm({
      title: "Reject Task",
      content:
        "Rejecting this task will send it back to the employee for revisions. They will not be able to update it until you approve it again.",
      okText: "Reject",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setLoading(true);
          const task = tasks.find((t) => t.id === taskId);
          await editTask(taskId, {
            ...task,
            approvalStatus: "rejected",
          });
          message.success("Task rejected! Employee has been notified.");
        } catch {
          message.error("Failed to reject task");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy) => <Tag color="blue">{createdBy || "Unknown"}</Tag>,
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
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const colors = {
          low: "green",
          medium: "blue",
          high: "orange",
          urgent: "red",
        };
        return <Tag color={colors[priority] || "default"}>{priority}</Tag>;
      },
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Status",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      render: (status) => {
        const colors = {
          pending: "orange",
          approved: "green",
          rejected: "red",
        };
        const labels = {
          pending: "⏳ Pending",
          approved: "✅ Approved",
          rejected: "❌ Rejected",
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => {
        if (record.approvalStatus === "pending") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
                loading={loading}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.id)}
                loading={loading}
              >
                Reject
              </Button>
            </Space>
          );
        }
        return (
          <Tag color={record.approvalStatus === "approved" ? "green" : "red"}>
            {record.approvalStatus === "approved"
              ? "✅ Approved"
              : "❌ Rejected"}
          </Tag>
        );
      },
    },
  ];

  return (
    <div style={{ background: "#f0f2f5", padding: "24px" }}>
      <h2>👔 Task Approval Dashboard</h2>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Pending Approval"
              value={pendingTasks.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Approved"
              value={approvedTasks.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Rejected"
              value={rejectedTasks.length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Tasks Table */}
      <Card
        title="⏳ Tasks Awaiting Your Approval"
        style={{ borderRadius: 8, marginBottom: 24 }}
      >
        {pendingTasks.length > 0 ? (
          <Table
            columns={columns.filter((col) => col.key !== "Status")}
            dataSource={pendingTasks}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            size="small"
          />
        ) : (
          <Empty description="No tasks awaiting approval" />
        )}
      </Card>

      {/* All Tasks History */}
      <Card title="📋 All Tasks History" style={{ borderRadius: 8 }}>
        {pendingTasks.length > 0 ||
        approvedTasks.length > 0 ||
        rejectedTasks.length > 0 ? (
          <Table
            columns={columns}
            dataSource={[...pendingTasks, ...approvedTasks, ...rejectedTasks]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            size="small"
          />
        ) : (
          <Empty description="No tasks" />
        )}
      </Card>
    </div>
  );
}
