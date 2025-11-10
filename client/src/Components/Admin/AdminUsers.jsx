// src/Components/Admin/AdminUsers.jsx

import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import adminHttp from "../../api/adminHttp";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAdminStore } from "../../stores/adminStore";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    surname: "",
    email: "",
    role: "user",
  });
  const currentAdmin = useAdminStore((state) => state.adminUser);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminHttp.get("/user/all");
      if (res.data.success) {
        setUsers(res.data.data || []);
        setError("");
      } else {
        setError(res.data.message || "Failed to load users");
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || "Failed to load users";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      surname: user.surname || "",
      email: user.email || "",
      role: user.role || "user",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser || isUpdating) return;

    setIsUpdating(true);
    try {
      console.log("📝 Updating user:", editingUser._id, editForm);
      const res = await adminHttp.put(`/user/${editingUser._id}`, editForm);
      console.log("✅ Update response:", res.data);
      
      if (res.data.success) {
        toast.success("User updated successfully!");
        setShowEditModal(false);
        setEditingUser(null);
        // Reset form
        setEditForm({
          username: "",
          surname: "",
          email: "",
          role: "user",
        });
        fetchUsers(); // Refresh the list
      } else {
        toast.error(res.data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("❌ Update error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update user";
      toast.error(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await adminHttp.delete(`/user/${userId}`);
      if (res.data.success) {
        toast.success("User deleted successfully!");
        setShowDeleteModal(null);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(res.data.message || "Failed to delete user");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete user";
      toast.error(errorMsg);
    }
  };

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
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === "admin" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(u._id)}
                          disabled={currentAdmin?.id === u._id || currentAdmin?.id?.toString() === u._id?.toString()}
                          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                            (currentAdmin?.id === u._id || currentAdmin?.id?.toString() === u._id?.toString())
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                          title={(currentAdmin?.id === u._id || currentAdmin?.id?.toString() === u._id?.toString()) ? "Cannot delete your own account" : "Delete user"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                <input
                  type="text"
                  value={editForm.surname}
                  onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl ${
                    isUpdating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-600">Delete User</h3>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-700 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>

            {users.find(u => u._id === showDeleteModal) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800">
                  <strong>User:</strong> {users.find(u => u._id === showDeleteModal)?.username} {users.find(u => u._id === showDeleteModal)?.surname}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Email:</strong> {users.find(u => u._id === showDeleteModal)?.email}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminUsers;
