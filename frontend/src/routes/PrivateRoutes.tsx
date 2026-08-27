import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  const role = localStorage.getItem('role') || user?.role;

  if (!isAuthenticated) {
    return <Navigate to="/adminlogin" replace />;
  }

  // If driver attempts to access admin layout, redirect to Driver Dashboard
  if (role === 'driver') {
    return <Navigate to="/driver/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;