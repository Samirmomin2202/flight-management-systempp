import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { listSlides, createSlide, updateSlide, deleteSlide } from "../../api/slidesApi";

const emptyForm = {
  title: "",
  subtitle: "",
  imageBase64: "",
  imageUrl: "",
  ctaText: "",
  ctaUrl: "",
  isActive: true,
  sortOrder: 0,
};

const AdminSlides = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await listSlides(false);
      setSlides(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (editingId) {
        await updateSlide(editingId, payload);
      } else {
        await createSlide(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchSlides();
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (slide) => {
    setEditingId(slide._id);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      imageBase64: slide.imageBase64 || "",
      imageUrl: slide.imageUrl || "",
      ctaText: slide.ctaText || "",
      ctaUrl: slide.ctaUrl || "",
      isActive: !!slide.isActive,
      sortOrder: slide.sortOrder || 0,
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this slide?")) return;
    setLoading(true);
    try {
      await deleteSlide(id);
      await fetchSlides();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Slides</h1>

        <form className="bg-white border rounded p-4 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="mt-1 w-full border rounded p-2" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Subtitle</label>
            <input className="mt-1 w-full border rounded p-2" value={form.subtitle} onChange={e=>setForm({...form, subtitle:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">CTA Text</label>
            <input className="mt-1 w-full border rounded p-2" value={form.ctaText} onChange={e=>setForm({...form, ctaText:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">CTA URL</label>
            <input className="mt-1 w-full border rounded p-2" value={form.ctaUrl} onChange={e=>setForm({...form, ctaUrl:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input className="mt-1 w-full border rounded p-2" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium">Or Upload Image</label>
            <input type="file" accept="image/*" className="mt-1 w-full" onChange={async e=>{
              const f = e.target.files?.[0];
              if (f) {
                const base64 = await handleFile(f);
                setForm({...form, imageBase64: base64});
              }
            }} />
          </div>
          <div>
            <label className="block text-sm font-medium">Sort Order</label>
            <input type="number" className="mt-1 w-full border rounded p-2" value={form.sortOrder} onChange={e=>setForm({...form, sortOrder:Number(e.target.value)})} />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.isActive} onChange={e=>setForm({...form, isActive:e.target.checked})} />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button type="button" className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm(emptyForm); }}>Cancel</button>
            )}
          </div>
        </form>

        <div className="bg-white border rounded">
          <div className="p-4 border-b font-semibold">All Slides</div>
          <div className="divide-y">
            {slides.map((s) => (
              <div key={s._id} className="p-4 flex items-center gap-4">
                <div className="w-24 h-14 bg-slate-100 border rounded overflow-hidden flex items-center justify-center">
                  {s.imageBase64 ? (
                    <img src={s.imageBase64} alt="slide" className="object-cover w-full h-full" />
                  ) : s.imageUrl ? (
                    <img src={s.imageUrl} alt="slide" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-slate-400">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-slate-600">{s.subtitle}</div>
                  <div className="text-xs text-slate-500 mt-1">CTA: {s.ctaText || '-'} → {s.ctaUrl || '-'}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full border {s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}">
                  {s.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="w-24 text-sm text-slate-500">Sort: {s.sortOrder ?? 0}</div>
                <div className="flex gap-2">
                  <button className="text-blue-700 hover:underline" onClick={()=>onEdit(s)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={()=>onDelete(s._id)}>Delete</button>
                </div>
              </div>
            ))}
            {slides.length === 0 && (
              <div className="p-6 text-center text-slate-500">No slides yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSlides;
