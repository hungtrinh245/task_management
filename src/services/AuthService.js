// Authentication helper service
// - Handles register/login/logout logic for the frontend
// - Uses `apiClient` to call backend endpoints when available
// - Falls back to simple json-server behavior when auth endpoints are not provided
import apiClient from "./apiClient";
import bcrypt from "bcryptjs";

const AuthService = {
  // Register a new user
  // - Hashes the password with bcrypt before saving
  // - Tries /auth/register first; falls back to /users for json-server
  register: async (payload) => {
    // Hash password before sending to backend. We always store a hashed
    // password in the backend (even when using json-server) so plain text
    // passwords are not saved in the db.json file.
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userPayload = {
      name: payload.name,
      email: payload.email,
      password: hashedPassword, // Store hashed password, not plain text
      role: payload.role || "employee", // Default role is employee
      createdAt: new Date().toISOString(),
    };

    try {
      // If the real backend exposes /auth/register, prefer that.
      return await apiClient.post("/auth/register", userPayload);
    } catch {
      // Fallback to json-server's /users collection for local development.
      return apiClient.post("/users", userPayload);
    }
  },

  // Login a user
  // - Tries /auth/login first (real backend returning { token, user })
  // - If not available (json-server dev), finds user and compares bcrypt hash
  login: async (payload) => {
    try {
      // Try calling a real auth endpoint first. A typical backend would
      // return { token, user } on successful login.
      const response = await apiClient.post("/auth/login", payload);
      // If backend returns token, save it to localStorage for subsequent requests
      if (response && response.token) {
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      return response;
    } catch {
      // Fallback for local json-server: attempt to find the user record and
      // compare the provided password against the stored hash using bcrypt.
      const users = await apiClient.get(
        `/users?email=${encodeURIComponent(payload.email)}`
      );
      const user = Array.isArray(users) ? users[0] : users;

      if (user) {
        // Compare plain text password with hashed password stored in db
        const isPasswordValid = await bcrypt.compare(
          payload.password,
          user.password
        );
        if (isPasswordValid) {
          // Generate a mock token for local development and save user (without password)
          const mockToken = `mock-token-${Date.now()}`;
          localStorage.setItem("authToken", mockToken);
          const userToStore = { ...user };
          delete userToStore.password; // never store hashes client-side
          localStorage.setItem("user", JSON.stringify(userToStore));
          return { token: mockToken, user: userToStore };
        }
      }
      const error = new Error("Invalid credentials");
      throw error;
    }
  },

  // Logout: remove auth info from localStorage
  logout: () => {
    // Remove authentication data from localStorage. This function can be
    // called from anywhere in the app (UI logout, API 401 handler, etc.).
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  // Helper to read token from storage
  getToken: () => {
    return localStorage.getItem("authToken");
  },

  // Helper to read user object (without password)
  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Simple boolean helper indicating whether a token exists
  // (For production consider validating expiry or server-side verification)
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },
};

export default AuthService;
