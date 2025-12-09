import React from "react";
import { Card, List, Tag, Typography } from "antd";
import {
  BookOutlined,
  ExclamationCircleOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const KnowledgePanel = ({ task }) => {
  const tags = task.tags || [];
  const hasDesignTag = tags.some((tag) => tag.toLowerCase().includes("design"));
  const hasBugTag = tags.some((tag) => tag.toLowerCase().includes("bug"));

  if (!hasDesignTag && !hasBugTag) {
    return null; // No relevant tags, don't show the panel
  }

  const designDocuments = [
    {
      title: "UI/UX Design Principles",
      description:
        "Fundamental principles for creating user-friendly interfaces",
      url: "https://example.com/ui-ux-principles",
    },
    {
      title: "Color Theory Guide",
      description: "Understanding color psychology and combinations",
      url: "https://example.com/color-theory",
    },
    {
      title: "Wireframing Best Practices",
      description: "How to create effective wireframes for your designs",
      url: "https://example.com/wireframing",
    },
  ];

  const bugDocuments = [
    {
      title: "Debugging JavaScript",
      description: "Essential debugging techniques for JavaScript developers",
      url: "https://example.com/debug-js",
    },
    {
      title: "Common Bug Fixes",
      description: "Solutions to frequently encountered programming issues",
      url: "https://example.com/common-bugs",
    },
    {
      title: "Testing Strategies",
      description: "Comprehensive testing approaches for robust applications",
      url: "https://example.com/testing-strategies",
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case "design":
        return <BgColorsOutlined style={{ color: "#1890ff" }} />;
      case "bug":
        return <ExclamationCircleOutlined style={{ color: "#f5222d" }} />;
      default:
        return <BookOutlined />;
    }
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookOutlined />
          <span>Knowledge Panel - Tài liệu liên quan</span>
        </div>
      }
      style={{ marginTop: 16, borderRadius: 8 }}
    >
      {hasDesignTag && (
        <div style={{ marginBottom: hasBugTag ? 24 : 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {getIcon("design")}
            <Title level={5} style={{ margin: 0 }}>
              Design Resources
            </Title>
            <Tag color="blue">design</Tag>
          </div>
          <List
            dataSource={designDocuments}
            renderItem={(item) => (
              <List.Item
                style={{ padding: "8px 0" }}
                actions={[
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={<Text strong>{item.title}</Text>}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {hasBugTag && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {getIcon("bug")}
            <Title level={5} style={{ margin: 0 }}>
              Debug Resources
            </Title>
            <Tag color="red">bug</Tag>
          </div>
          <List
            dataSource={bugDocuments}
            renderItem={(item) => (
              <List.Item
                style={{ padding: "8px 0" }}
                actions={[
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={<Text strong>{item.title}</Text>}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );
};

export default KnowledgePanel;
