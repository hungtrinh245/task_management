import { Card, Upload, Button, List, Empty, Space, Tag } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";

export default function AttachmentSection({ attachments = [], onAddAttachment, onDeleteAttachment }) {
  const handleUpload = (info) => {
    if (info.file) {
      onAddAttachment({
        id: Date.now().toString(),
        name: info.file.name,
        url: "#", // Placeholder URL
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <Card title={`Attachments (${attachments.length})`} style={{ marginTop: 16 }}>
      {attachments.length > 0 ? (
        <List
          dataSource={attachments}
          renderItem={(attachment) => (
            <List.Item key={attachment.id}>
              <span>{attachment.name}</span>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  href={attachment.url}
                  target="_blank"
                >
                  Download
                </Button>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => onDeleteAttachment(attachment.id)}
                />
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No attachments yet" style={{ margin: "16px 0" }} />
      )}

      <Upload
        maxCount={1}
        onChange={handleUpload}
        beforeUpload={() => false}
        style={{ marginTop: 16 }}
      >
        <Button icon={<PlusOutlined />} type="dashed" block>
          Upload File
        </Button>
      </Upload>
    </Card>
  );
}
