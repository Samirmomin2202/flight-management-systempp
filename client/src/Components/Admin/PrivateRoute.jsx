import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminStore } from "../../stores/adminStore";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated());
  const adminUser = useAdminStore((state) => state.adminUser);

  // Check if admin is authenticated
  if (!isAuthenticated() || !adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default PrivateRoute;
