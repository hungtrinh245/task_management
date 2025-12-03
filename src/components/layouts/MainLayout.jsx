import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  UnorderedListOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

export default function MainLayout({ children }) {
  const location = useLocation();

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
