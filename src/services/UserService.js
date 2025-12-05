// UserService: Helper to fetch all users for assignee dropdowns
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
};

export default UserService;
