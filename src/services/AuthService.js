import apiClient from "./apiClient";
import bcrypt from "bcryptjs";

const AuthService = {
  register: async (payload) => {
    // Hash password before sending to backend
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userPayload = {
      name: payload.name,
      email: payload.email,
      password: hashedPassword, // Store hashed password, not plain text
      createdAt: new Date().toISOString(),
    };

    try {
      return await apiClient.post("/auth/register", userPayload);
    } catch {
      // If backend doesn't support /auth/register (e.g., json-server), POST to /users
      return apiClient.post("/users", userPayload);
    }
  },

  login: async (payload) => {
    try {
      const response = await apiClient.post("/auth/login", payload);
      // If backend returns token, save it
      if (response && response.token) {
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      return response;
    } catch {
      // fallback: attempt to get users and simulate login
      // Note: json-server doesn't authenticate; this is a simple simulation
      const users = await apiClient.get(
        `/users?email=${encodeURIComponent(payload.email)}`
      );
      const user = Array.isArray(users) ? users[0] : users;

      if (user) {
        // Compare plain text password with hashed password
        const isPasswordValid = await bcrypt.compare(
          payload.password,
          user.password
        );
        if (isPasswordValid) {
          // Generate mock token and save to localStorage
          const mockToken = `mock-token-${Date.now()}`;
          localStorage.setItem("authToken", mockToken);
          // Don't store hashed password in user object
          const userToStore = { ...user };
          delete userToStore.password;
          localStorage.setItem("user", JSON.stringify(userToStore));
          return { token: mockToken, user: userToStore };
        }
      }
      const error = new Error("Invalid credentials");
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  getToken: () => {
    return localStorage.getItem("authToken");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },
};

export default AuthService;
