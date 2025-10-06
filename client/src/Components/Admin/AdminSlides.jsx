import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminSlides = () => {
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState({ imageUrl: "", title: "", subtitle: "", order: 0, active: true });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:5000/api/slides";

  const load = async () => {
    try {
      const res = await axios.get(API);
      if (res.data.success) setSlides(res.data.slides || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const create = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("title", form.title || "");
        fd.append("subtitle", form.subtitle || "");
        fd.append("order", String(Number(form.order) || 0));
        fd.append("active", String(!!form.active));
        res = await axios.post(`${API}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        res = await axios.post(API, { ...form, order: Number(form.order) || 0, active: !!form.active });
      }
      if (res.data.success) {
        setForm({ imageUrl: "", title: "", subtitle: "", order: 0, active: true });
        setFile(null);
        await load();
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const update = async (id, patch) => {
    try { await axios.put(`${API}/${id}`, patch); await load(); } catch (e) { console.error(e); }
  };

  const remove = async (id) => {
    try { await axios.delete(`${API}/${id}`); await load(); } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6 ml-64">
      <h1 className="text-2xl font-bold mb-4">Manage Hero Slides</h1>

      <form onSubmit={create} className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Image URL</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="text-sm font-medium">Or Upload Image</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Subtitle</label>
          <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Order</label>
          <input name="order" type="number" value={form.order} onChange={handleChange} className="w-24 border rounded-lg px-3 py-2" />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> Active
        </label>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg">{loading ? 'Saving...' : 'Add Slide'}</button>
      </form>

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slides.map((s) => (
          <div key={s._id} className="bg-white rounded-lg shadow overflow-hidden border">
            <div className="h-40 bg-gray-100" style={{ backgroundImage: `url(${s.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="p-3 text-sm">
              <div className="font-semibold">{s.title || '—'}</div>
              <div className="text-gray-600">{s.subtitle || ''}</div>
              <div className="mt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!s.active} onChange={(e) => update(s._id, { active: e.target.checked })} /> Active
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={s.order || 0} onBlur={(e) => update(s._id, { order: Number(e.target.value) || 0 })} className="w-20 border rounded px-2 py-1" />
                  <button onClick={() => remove(s._id)} className="text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSlides;
