import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface DriverProtectedRouteProps {
  children: JSX.Element;
}

const DriverProtectedRoute: React.FC<DriverProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const role = (localStorage.getItem("role") || user?.role || "").toLowerCase();
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

  if (!token || !isAuthenticated) {
    return <Navigate to="/driver/login" replace />;
  }

  if (role !== "driver") {
    return <Navigate to="/driver/login" replace />;
  }

  return children;
};

export default DriverProtectedRoute;

