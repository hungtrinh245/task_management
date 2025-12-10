import { Layout, Menu, Button, Modal, Dropdown, Avatar, Badge } from "antd";
import {
  HomeOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  LoginOutlined,
  ArrowRightOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";
import { useTasks } from "../../hooks/useTasks";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationBell from "../NotificationBell";
import AuditService from "../../services/AuditService";
import { useState, useEffect } from "react";
// MainLayout: application shell containing Sider + Header + Content
// - Shows navigation links in the Sider
// - Displays a user menu in the Header when authenticated
// - Logout goes through a confirmation modal and clears auth state
import { LogoutOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { isDarkMode, toggleTheme } = useTheme();

  const showLogoutConfirm = () => {
    Modal.confirm({
      title: "Xác nhận đăng xuất",
      content: "Bạn có chắc muốn đăng xuất khỏi hệ thống không?",
      okText: "Đăng xuất",
      cancelText: "Hủy",
      onOk() {
        AuthService.logout();
        navigate("/auth/login");
      },
    });
  };

  // Get current user (may be null). We read this synchronously from localStorage.
  const user = AuthService.getUser();
  const userName = user?.name || user?.email || "User";
  const userRole = user?.role || "employee";
  const isManager = userRole === "manager";

  // Dropdown menu for user actions (profile, logout)
  // Use the `menu` prop with an items array (Antd v5) to avoid overlay children issues
  const userMenuItems = [
    { key: "profile", label: userName },
    { type: "divider" },
    { key: "logout", label: "Logout", onClick: showLogoutConfirm },
  ];

  // Build Sider menu items. We hide auth routes when the user is logged in
  const pendingApprovalsCount = tasks.filter(
    (t) => t.approvalStatus === "pending"
  ).length;

  const menuItems = [
    { key: "/", icon: <HomeOutlined />, label: <Link to="/">Dashboard</Link> },
   {
      key: "/projects",
      icon: <ProjectOutlined />,
      label: <Link to="/projects">Projects</Link>,
    },
    {
      key: "/tasks",
      icon: <UnorderedListOutlined />,
      label: <Link to="/tasks">All Tasks</Link>,
    },

    {
      key: "/my-tasks",
      icon: <UserOutlined />,
      label: <Link to="/my-tasks">My Tasks</Link>,
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>,
    },
    {
      key: "/tasks/create",
      icon: <PlusOutlined />,
      label: <Link to="/tasks/create">Create Task</Link>,
    },
  ];

  // Add approval menu for managers
  if (isManager && AuthService.isAuthenticated()) {
    menuItems.push({
      key: "/approvals",
      icon: <CheckCircleOutlined />,
      label: (
        <span>
          <Link to="/approvals">Approvals</Link>
          {pendingApprovalsCount > 0 && (
            <Badge
              count={pendingApprovalsCount}
              style={{ marginLeft: 8, backgroundColor: "#faad14" }}
            />
          )}
        </span>
      ),
    });
  }

  if (!AuthService.isAuthenticated()) {
    // Chỉ hiển thị liên kết đăng ký/đăng nhập khi chưa được xác thực
    menuItems.push({
      key: "/auth/register",
      icon: <ArrowRightOutlined />,
      label: <Link to="/auth/register">Register</Link>,
    });
    menuItems.push({
      key: "/auth/login",
      icon: <LoginOutlined />,
      label: <Link to="/auth/login">Login</Link>,
    });
  }

  const selectedKey = (() => {
    //approvals
    if (location.pathname === "/approvals") return "/approvals";
    //my-tasks
    if (location.pathname === "/my-tasks") return "/my-tasks";
    //profile
    if (location.pathname === "/profile") return "/profile";
    //tasks/create, /tasks/:id, /tasks/edit/:id
    if (location.pathname.startsWith("/tasks")) return "/tasks";
    // Exact match: /
    if (location.pathname === "/") return "/";
    // Default
    return "/";
  })();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        style={{
          background: "linear-gradient(180deg, #001529 0%, #002040 100%)",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          📋 Task Manager
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ border: "none" }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: isDarkMode ? "#141414" : "#fff",
            padding: "0 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: isDarkMode ? "#ffffff" : "#001529",
            }}
          >
            Task Management System
          </h1>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {/* Theme toggle button */}
            <Button type="text" onClick={toggleTheme} style={{ fontSize: 18 }}>
              {isDarkMode ? "☀️" : "🌙"}
            </Button>
            {/* Notification Bell - only show when authenticated */}
            {AuthService.isAuthenticated() && <NotificationBell />}
            {/* Show user avatar + dropdown when authenticated */}
            {AuthService.isAuthenticated() ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Avatar style={{ marginRight: 8 }}>{userName[0]}</Avatar>
                  <span>{userName}</span>
                </Button>
              </Dropdown>
            ) : null}
          </div>
        </Header>

        <Content style={{ margin: "24px 16px", minHeight: 360 }}>
          <div
            style={{
              padding: 24,
              background: isDarkMode ? "#262626" : "#fff",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
