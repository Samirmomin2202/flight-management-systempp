import React from "react";
import { Navigate } from "react-router-dom";
import useAdminStore from "../../Adminstore/adminStore";

const PrivateRoute = ({ children }) => {
  const adminUser = useAdminStore((state) => state.adminUser);

  if (!adminUser) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};

export default PrivateRoute;
