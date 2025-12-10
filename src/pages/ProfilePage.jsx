import { Card, Avatar, Button, message, Form, Input, Select } from "antd";
import { useState, useEffect } from "react";
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
    <div className="max-w-2xl mx-auto p-4">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>Thông tin cá nhân</span>
            {!isEditing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                size="small"
              >
                Chỉnh sửa
              </Button>
            ) : (
              <div className="space-x-2">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSave}
                  size="small"
                >
                  Lưu
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  disabled={loading}
                  size="small"
                >
                  Hủy
                </Button>
              </div>
            )}
          </div>
        }
        className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}
        bodyStyle={{ padding: "16px" }}
      >
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <Avatar
              size={80}
              src={avatarPreview || user.avatar}
              alt={user.name}
              className={`border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity ${
                uploading ? "opacity-50" : ""
              }`}
              onClick={handleAvatarClick}
            >
              {user.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="text-white text-xs">Đang tải...</div>
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
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === "manager"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {user.role === "manager" ? "Quản lý" : "Nhân viên"}
              </span>
              <span className="text-xs text-gray-500">ID: {user.id}</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <Form
          form={form}
          layout="vertical"
          initialValues={user}
          disabled={!isEditing}
          size="small"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
              >
                <Select placeholder="Chọn phòng ban">
                  <Option value="Development">Development</Option>
                  <Option value="Testing">Testing</Option>
                  <Option value="Design">Design</Option>
                  <Option value="BA">BA</Option>
                  <Option value="Management">Management</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item label="Giới thiệu bản thân" name="bio">
              <TextArea
                rows={3}
                placeholder="Viết một chút về bản thân..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          </div>
        </Form>

        {/* Additional Info */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <span className="font-medium">Ngày tạo tài khoản:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </div>
      </Card>
    </div>
  );
}
