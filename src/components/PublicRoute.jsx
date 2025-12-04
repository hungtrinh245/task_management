import React from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/AuthService";

// PublicRoute component
// - Wraps routes that should be accessible only when the user is NOT logged in
// - For example: login/register pages. If user is authenticated, redirect to home
const PublicRoute = ({ children }) => {
  const isAuth = AuthService.isAuthenticated();
  if (isAuth) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default PublicRoute;
