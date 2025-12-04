import { Card, Form, Button, Input, List, Empty, Avatar } from "antd";
import { useState } from "react";

export default function CommentSection({ comments = [], onAddComment }) {
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState("");

  const handleAddComment = () => {
    if (newComment.trim() && author.trim()) {
      onAddComment({
        author,
        text: newComment,
        createdAt: new Date().toISOString(),
      });
      setNewComment("");
      setAuthor("");
    }
  };

  return (
    <Card title={`Comments (${comments.length})`} style={{ marginTop: 16 }}>
      {comments.length > 0 ? (
        <List
          dataSource={comments}
          renderItem={(comment) => (
            <div
              key={comment.id}
              style={{
                padding: "12px",
                borderLeft: "3px solid #1890ff",
                marginBottom: 12,
                backgroundColor: "#fafafa",
                borderRadius: 4,
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <Avatar>{comment.author?.charAt(0).toUpperCase()}</Avatar>
                <div style={{ flex: 1 }}>
                  <strong>{comment.author}</strong>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#999" }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, marginLeft: 40, color: "#333" }}>
                {comment.text}
              </p>
            </div>
          )}
        />
      ) : (
        <Empty description="No comments yet" style={{ margin: "16px 0" }} />
      )}

      <Form style={{ marginTop: 16 }} layout="vertical">
        <Form.Item label="Your Name" required>
          <Input
            placeholder="Enter your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            size="small"
          />
        </Form.Item>

        <Form.Item label="Comment" required>
          <Input.TextArea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
        </Form.Item>

        <Button
          type="primary"
          onClick={handleAddComment}
          disabled={!newComment.trim() || !author.trim()}
        >
          Post Comment
        </Button>
      </Form>
    </Card>
  );
}
