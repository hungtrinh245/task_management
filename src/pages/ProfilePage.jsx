import { useState, useEffect } from "react";
import { Card, Avatar, Button, message, Form, Input, Select } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import AuthService from "../services/AuthService";
import UserService from "../services/UserService";
import { useTheme } from "../contexts/ThemeContext";
import { useRef } from "react";

const { TextArea } = Input;
const { Option } = Select;

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = AuthService.getUser();
      if (currentUser?.id) {
        const userData = await UserService.getUserById(currentUser.id);
        setUser(userData);
        form.setFieldsValue(userData);
      }
    } catch {
      message.error("Không thể tải thông tin hồ sơ");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.setFieldsValue(user);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const updatedUser = await UserService.updateUserProfile(user.id, values);
      setUser(updatedUser);
      setIsEditing(false);
      message.success("Cập nhật hồ sơ thành công");
    } catch {
      message.error("Cập nhật hồ sơ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      message.error("Chỉ chấp nhận file hình ảnh");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error("File không được vượt quá 5MB");
      return;
    }

    // Set preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const updatedUser = await UserService.uploadAvatar(user.id, base64);
      setUser(updatedUser);
      setAvatarPreview(null);
      message.success("Cập nhật avatar thành công");
    } catch {
      message.error("Cập nhật avatar thất bại");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card
        title="Thông tin cá nhân"
        extra={
          !isEditing ? (
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              Chỉnh sửa
            </Button>
          ) : (
            <div className="space-x-2">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={handleSave}
              >
                Lưu
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          )
        }
        className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar
                size={120}
                src={avatarPreview || user.avatar}
                alt={user.name}
                className={`border-4 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity ${
                  uploading ? "opacity-50" : ""
                }`}
                onClick={handleAvatarClick}
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="text-white text-sm">Đang tải...</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-500">{user.email}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm ${
                  user.role === "manager"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {user.role === "manager" ? "Quản lý" : "Nhân viên"}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <div className="flex-1">
            <Form
              form={form}
              layout="vertical"
              initialValues={user}
              disabled={!isEditing}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Họ và tên"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng nhập họ và tên" },
                  ]}
                >
                  <Input placeholder="Nhập họ và tên" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                >
                  <Input placeholder="Nhập email" />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>

                <Form.Item
                  label="Phòng ban"
                  name="department"
                  rules={[
                    { required: true, message: "Vui lòng chọn phòng ban" },
                  ]}
                >
                  <Select placeholder="Chọn phòng ban">
                    <Option value="Development">Development</Option>
                    <Option value="Testing">Testing</Option>
                    <Option value="Design">Design</Option>
                    <Option value="Management">Management</Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item label="Giới thiệu bản thân" name="bio">
                <TextArea
                  rows={4}
                  placeholder="Viết một chút về bản thân..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Ngày tạo tài khoản:</span>
              <p>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
            <div>
              <span className="font-medium">Vai trò:</span>
              <p>{user.role === "manager" ? "Quản lý" : "Nhân viên"}</p>
            </div>
            <div>
              <span className="font-medium">ID người dùng:</span>
              <p>{user.id}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
