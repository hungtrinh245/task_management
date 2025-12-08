// UserService: Helper to fetch all users for assignee dropdowns and profile management
import apiClient from "./apiClient";

const UserService = {
  // Get all users (for assignee dropdowns)
  getAllUsers: async () => {
    try {
      const users = await apiClient.get("/users");
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  },

  // Get single user by ID
  getUserById: async (userId) => {
    try {
      return await apiClient.get(`/users/${userId}`);
    } catch {
      return null;
    }
  },

  // Update user profile
  updateUserProfile: async (userId, profileData) => {
    try {
      const updatedUser = await apiClient.patch(`/users/${userId}`, {
        ...profileData,
        updatedAt: new Date().toISOString(),
      });
      return updatedUser;
    } catch {
      throw new Error("Failed to update profile");
    }
  },

  // Upload avatar
  uploadAvatar: async (userId, base64Data) => {
    try {
      // Update user with base64 avatar
      const updatedUser = await apiClient.patch(`/users/${userId}`, {
        avatar: base64Data,
        updatedAt: new Date().toISOString(),
      });
      return updatedUser;
    } catch {
      throw new Error("Failed to upload avatar");
    }
  },
};

export default UserService;
