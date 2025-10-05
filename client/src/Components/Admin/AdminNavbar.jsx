import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAdminStore from "../../stores/adminStore";

const AdminNavbar = () => {
  const logout = useAdminStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <nav className="admin-navbar">
      <ul>
        <li>
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
        </li>
        <li>
          <NavLink to="/admin/flights">Flight Management</NavLink>
        </li>
        <li>
          <NavLink to="/admin/routes">Route & Schedule</NavLink>
        </li>
        <li>
          <NavLink to="/admin/bookings">Booking Management</NavLink>
        </li>
        <li>
          <NavLink to="/admin/users">User Management</NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports">Reports</NavLink>
        </li>
        
        <li>
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNavbar;
