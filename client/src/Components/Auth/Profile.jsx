import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react"; // ✅ Logout icon

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: "", surname: "", avatarBase64: "" });
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/signup", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data?.data);
        const d = res.data?.data || {};
        setForm({ username: d.username || "", surname: d.surname || "", avatarBase64: d.avatarBase64 || "" });
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err);
        Cookies.remove("token");
        navigate("/signup", { replace: true });
      });
  }, [navigate]);

  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    navigate("/login");
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    reader.onload = () => setForm((p) => ({ ...p, avatarBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const onSave = async (e) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) return;
    setSaving(true);
    try {
      const res = await axios.put("http://localhost:5000/api/user/me", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res.data?.data;
      setUser(updated);
      // Keep local form in sync with saved user so avatar/details reflect immediately after save
      setForm({
        username: updated?.username || "",
        surname: updated?.surname || "",
        avatarBase64: updated?.avatarBase64 || "",
      });
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save profile failed", err);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    // Reset form back to current user values and exit edit mode
    const d = user || {};
    setForm({ username: d.username || "", surname: d.surname || "", avatarBase64: d.avatarBase64 || "" });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
        <p className="text-lg font-semibold text-slate-700 animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl border border-slate-100">
        {saved && (
          <div className="absolute left-1/2 -translate-x-1/2 top-6 z-10 bg-emerald-600 text-white px-4 py-2 rounded shadow">
            Profile updated successfully
          </div>
        )}
        {/* Left Side Image */}
        <div className="md:w-1/2 bg-gradient-to-br from-indigo-100 to-blue-100 flex flex-col items-center justify-center p-8">
          <img
            src={form.avatarBase64 || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="User avatar"
            className="rounded-full w-44 h-44 border-4 border-white shadow-xl transition hover:scale-105"
          />
          {isEditing && (
            <div className="mt-4">
              <label className="block text-sm text-slate-700 mb-1">Change Avatar</label>
              <input type="file" accept="image/*" onChange={onFileChange} />
              {uploadError && <p className="text-red-600 text-sm mt-1">{uploadError}</p>}
            </div>
          )}
          <h3 className="mt-4 text-xl font-bold text-slate-700">{user.username}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>

        {/* Right Side Content */}
        <div className="md:w-1/2 p-10 flex flex-col justify-between bg-white">
          {isEditing ? (
            <form onSubmit={onSave}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-indigo-800 tracking-tight">Edit Profile</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={onCancel} className="px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className={`px-4 py-2 rounded text-white ${saving ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">First Name</label>
                  <input type="text" name="username" value={form.username} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Surname</label>
                  <input type="text" name="surname" value={form.surname} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-indigo-800 tracking-tight">Profile Overview</h2>
                <button onClick={() => setIsEditing(true)} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Edit</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="font-semibold text-indigo-700">Username:</strong> {user.username}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="font-semibold text-indigo-700">Email:</strong> {user.email}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 md:col-span-2">
                  <strong className="font-semibold text-indigo-700">User ID:</strong> {user._id}
                </div>
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="mt-10 w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
