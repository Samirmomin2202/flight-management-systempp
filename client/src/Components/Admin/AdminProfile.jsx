import React, { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/adminStore";
import AdminSidebar from "./AdminSidebar";

const AdminProfile = () => {
  const adminUser = useAdminStore((s) => s.adminUser);
  const updateAdmin = useAdminStore((s) => s.updateAdmin);
  const [form, setForm] = useState({
    email: "",
    name: "",
    avatarBase64: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (adminUser) {
      setForm({
        email: adminUser.email || "",
        name: adminUser.name || "",
        avatarBase64: adminUser.avatarBase64 || "",
      });
    }
  }, [adminUser]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In this app, admin is locally stored via adminStore; update and persist
      updateAdmin({ ...adminUser, ...form });
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (adminUser) {
      setForm({
        email: adminUser.email || "",
        name: adminUser.name || "",
        avatarBase64: adminUser.avatarBase64 || "",
      });
    }
    setIsEditing(false);
  };

  const onFileChange = (e) => {
    setUploadError("");
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    const maxMB = 2;
    if (file.size > maxMB * 1024 * 1024) {
      setUploadError(`Image too large. Max ${maxMB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded shadow">Please login as admin.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 bg-gray-100 p-6 min-h-screen relative">
        {saved && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 z-10 bg-emerald-600 text-white px-4 py-2 rounded shadow">
            Profile updated successfully
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded shadow">
            <div className="flex flex-col items-center">
              <img
                src={form.avatarBase64 || 
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="avatar"
                className="w-28 h-28 rounded-full object-cover border"
              />
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                {form.name || "Admin"}
              </h3>
              <p className="text-sm text-gray-500">{form.email}</p>
              {isEditing && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">Upload Avatar</label>
                  <input type="file" accept="image/*" onChange={onFileChange} />
                  {uploadError && (
                    <p className="text-red-600 text-sm mt-1">{uploadError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded shadow">
            {isEditing ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>
                  <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button type="button" onClick={onSubmit} disabled={saving} className={`px-3 py-1.5 rounded text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{saving ? 'Saving…' : 'Save Changes'}</button>
                  </div>
                </div>
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Admin name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      placeholder="admin@example.com"
                    />
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Profile Overview</h2>
                  <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Edit</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded border">
                    <strong className="text-gray-700">Name:</strong> {form.name || 'Admin'}
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <strong className="text-gray-700">Email:</strong> {form.email}
                  </div>
                  <div className="p-3 bg-gray-50 rounded border md:col-span-2">
                    <strong className="text-gray-700">Role:</strong> admin
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
