// src/Components/Admin/AdminUsers.jsx

import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        // Optional: quick health check
        await fetch("http://localhost:5000/api/test");
        const res = await fetch("http://localhost:5000/api/user/all");
        const data = await res.json();
        if (!canceled) {
          if (data.success) setUsers(data.data || []);
          else setError(data.message || "Failed to load users");
        }
      } catch (e) {
        if (!canceled) setError(e.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />

      <div className="flex-1 ml-64 bg-gray-100 p-6 md:p-10">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">User Management</h1>

        <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
          {loading && <div className="p-4">Loading users…</div>}
          {error && !loading && (
            <div className="p-4 text-red-600">Error: {error}</div>
          )}
          <table className="w-full table-auto text-left border-collapse">
            <thead className="bg-blue-100 text-blue-900">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {users.length === 0 && !loading ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={5}>No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{u._id}</td>
                    <td className="px-4 py-2">{u.username} {u.surname}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">User</td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                        Edit
                      </button>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
