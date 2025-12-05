import React from "react";
import { Form, Input, Button, Card, message, Select, Alert } from "antd";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "../services/AuthService";

// RegisterPage: collects name, email, password and role
// - Password is hashed client-side before being sent (for local json-server storage)
// - Role determines access level: manager (can create/assign tasks) or employee (can view own tasks)
// - On success it redirects the user to the login page

const RegisterPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { name, email, password, role } = values;
    try {
      await AuthService.register({ name, email, password, role });
      message.success("Đăng ký thành công. Vui lòng đăng nhập.");
      navigate("/auth/login");
    } catch (err) {
      // Extract message if provided by API
      const apiMessage =
        err?.response?.data?.message || err?.message || "Lỗi khi đăng ký";
      message.error(apiMessage);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card title="Tạo tài khoản" style={{ width: 420 }}>
        <Alert
          message="Chọn role phù hợp"
          description="Manager: Có quyền tạo và gán task. Employee: Xem và cập nhật task của mình."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Tên của bạn" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Vai trò (Role)"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
            initialValue="employee"
          >
            <Select>
              <Select.Option value="manager">
                👔 Manager - Tạo & gán task
              </Select.Option>
              <Select.Option value="employee">
                👤 Employee - Xem & cập nhật task
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng ký
            </Button>
          </Form.Item>

          <div className="text-center">
            <span>Bạn đã có tài khoản? </span>
            <Link to="/auth/login">Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;

