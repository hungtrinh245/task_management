import React from "react";
import { Form, Input, Button, Card, message } from "antd";
import { Link } from "react-router-dom";
import AuthService from "../services/AuthService";

const LoginPage = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const response = await AuthService.login(values);
      if (response && response.token) {
        message.success("Đăng nhập thành công");
        // Token đã được lưu vào localStorage bởi AuthService.login()
        window.location.href = "/";
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message || err?.message || "Lỗi khi đăng nhập";
      message.error(apiMessage);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card title="Đăng nhập" style={{ width: 420 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Vui lòng nhập email" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng nhập
            </Button>
          </Form.Item>

          <div className="text-center">
            <span>Chưa có tài khoản? </span>
            <Link to="/auth/register">Đăng ký</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
