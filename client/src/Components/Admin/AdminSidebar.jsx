import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminStore } from "../../stores/adminStore";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const logout = useAdminStore((state) => state.logout);
  const adminUser = useAdminStore((state) => state.adminUser);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-blue-900 text-white h-screen fixed top-0 left-0 shadow-lg flex flex-col justify-between">
      <div>
        <div className="p-6 text-2xl font-bold border-b border-blue-700">
          Admin Panel
        </div>

        {adminUser && (
          <div className="p-4 border-b border-blue-700 flex items-center gap-3">
            <img
              src={adminUser.avatarBase64 || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-blue-700"
            />
            <div className="flex flex-col">
              <span className="font-medium leading-tight">{adminUser.name || "Admin"}</span>
              <span className="text-xs text-blue-200">{adminUser.email}</span>
            </div>
          </div>
        )}

        <nav className="mt-4 flex flex-col gap-2 px-4">
          <Link
            to="/admin/dashboard"
            className="hover:bg-blue-700 p-2 rounded"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/profile"
            className="hover:bg-blue-700 p-2 rounded"
          >
            Profile
          </Link>
          <Link
            to="/admin/flights"
            className="hover:bg-blue-700 p-2 rounded"
          >
            Flights
          </Link>
          <Link
            to="/admin/bookings"
            className="hover:bg-blue-700 p-2 rounded"
          >
            Bookings
          </Link>
          <Link
            to="/admin/users"
            className="hover:bg-blue-700 p-2 rounded"
          >
            Users
          </Link>
          <Link
            to="/admin/airlines"
            className="hover:bg-blue-700 p-2 rounded"
          >
            Airlines
          </Link>
          
          <Link
  to="/admin/contacts"
  className="hover:bg-blue-700 p-2 rounded"
>
  Contact Messages
</Link>

          
          <Link
            to="/"
            className="mt-10 text-sm hover:underline"
          >
            ← Back to Home
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
