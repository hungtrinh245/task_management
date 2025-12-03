import { Card, Form, Input, Select, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTasks } from '../contexts/TaskContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function CreateTaskPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { addTask } = useTasks();
  const [loading, setLoading] = useState(false);

  const genreOptions = [
    { label: '💻 Development', value: 'Development' },
    { label: '🎨 Design', value: 'Design' },
    { label: '🧪 Testing', value: 'Testing' },
    { label: '📚 Documentation', value: 'Documentation' },
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addTask({
        title: values.title,
        director: values.director,
        genre: values.genre,
        description: values.description || '',
        dueDate: values.dueDate || '',
      });

      message.success('Task created successfully!');
      navigate('/tasks');
    } catch {
      message.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ fontSize: 24 }} />
            <span>Create New Task</span>
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
          <Form.Item
            label="Task Title"
            name="title"
            rules={[
              { required: true, message: 'Please enter task title' },
              { min: 3, message: 'Title must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter task title" size="large" />
          </Form.Item>

          <Form.Item
            label="Director/Team"
            name="director"
            rules={[
              { required: true, message: 'Please enter director/team name' },
              { min: 2, message: 'Director name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="e.g., John Doe, Dev Team" size="large" />
          </Form.Item>

          <Form.Item
            label="Genre/Category"
            name="genre"
            rules={[{ required: true, message: 'Please select a genre' }]}
          >
            <Select placeholder="Select genre" options={genreOptions} size="large" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea
              placeholder="Enter task description (optional)"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="Due Date"
            name="dueDate"
          >
            <Input
              type="date"
              placeholder="Select due date (optional)"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large" loading={loading}>
                Create Task
              </Button>
              <Button size="large" onClick={() => navigate('/tasks')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
