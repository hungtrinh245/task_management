import React from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/AuthService";

// PrivateRoute component
// - Wraps routes that require authentication
// - If user is not authenticated (no token), redirect to /auth/login
const PrivateRoute = ({ children }) => {
  const isAuth = AuthService.isAuthenticated();
  if (!isAuth) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

export default PrivateRoute;
