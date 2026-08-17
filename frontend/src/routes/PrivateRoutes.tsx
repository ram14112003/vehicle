import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/adminlogin" replace />;
};

export default PrivateRoute;