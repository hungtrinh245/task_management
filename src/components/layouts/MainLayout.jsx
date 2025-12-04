import { Layout, Menu, Button, Modal, Dropdown, Avatar } from "antd";
import {
  HomeOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  LoginOutlined,
   ArrowRightOutlined
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";
// MainLayout: application shell containing Sider + Header + Content
// - Shows navigation links in the Sider
// - Displays a user menu in the Header when authenticated
// - Logout goes through a confirmation modal and clears auth state
import { LogoutOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Dropdown menu for user actions (profile, logout)
  // Use the `menu` prop with an items array (Antd v5) to avoid overlay children issues
  const userMenuItems = [
    { key: "profile", label: userName },
    { type: "divider" },
    { key: "logout", label: "Logout", onClick: showLogoutConfirm },
  ];

  // Build Sider menu items. We hide auth routes when the user is logged in
  const menuItems = [
    { key: "/", icon: <HomeOutlined />, label: <Link to="/">Dashboard</Link> },
    {
      key: "/tasks",
      icon: <UnorderedListOutlined />,
      label: <Link to="/tasks">Tasks</Link>,
    },
    {
      key: "/tasks/create",
      icon: <PlusOutlined />,
      label: <Link to="/tasks/create">Create Task</Link>,
    },
  ];

  if (!AuthService.isAuthenticated()) {
    // Only show register/login links when not authenticated
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

  const selectedKey =
    menuItems.find((item) =>
      location.pathname.includes(item.key.replace("/", ""))
    )?.key || "/";

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
            background: "#fff",
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
              color: "#001529",
            }}
          >
            Task Management System
          </h1>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            {/* Show user avatar + dropdown when authenticated */}
            {AuthService.isAuthenticated() ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button>
                  <Avatar style={{ marginRight: 8 }}>{userName[0]}</Avatar>
                  {userName}
                </Button>
              </Dropdown>
            ) : null}
          </div>
        </Header>

        <Content style={{ margin: "24px 16px", minHeight: 360 }}>
          <div
            style={{
              padding: 24,
              background: "#fff",
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
