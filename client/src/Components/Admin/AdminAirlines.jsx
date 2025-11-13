import React, { useEffect, useState } from 'react';
import { listAirlines, createAirline } from '../../api/airlinesApi';
import { toast } from 'react-toastify';

export default function AdminAirlines() {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', country:'India' });
  const [logoFile, setLogoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setAirlines(await listAirlines()); } catch(e){ toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name) return toast.warn('Name required');
    setSubmitting(true);
    try {
      const res = await createAirline({ ...form, logoFile });
      if (res.success) {
        toast.success('Airline added');
        setForm({ name:'', country:'India' });
        setLogoFile(null);
        load();
      } else toast.error(res.message || 'Failed');
    } catch(e){ toast.error(e.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Airlines</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-sm font-semibold">Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="mt-1 border rounded px-3 py-2" placeholder="SpiceJet" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold">Country</label>
          <input name="country" value={form.country} onChange={handleChange} className="mt-1 border rounded px-3 py-2" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold">Upload Logo</label>
          <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files[0])} className="mt-1" />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
            {submitting ? 'Saving...' : 'Add Airline'}
          </button>
        </div>
      </form>

      <h3 className="text-xl font-semibold mt-8 mb-3">Existing Airlines</h3>
      {loading ? <div>Loading...</div> : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {airlines.map(a => (
            <div key={a._id} className="bg-white border rounded-lg p-4 flex flex-col items-center shadow-sm">
              <div className="h-20 flex items-center justify-center w-full overflow-hidden">
                {a.tailLogoUrl || a.logoUrl ? (
                  <img src={a.tailLogoUrl || a.logoUrl} alt={a.name} className="max-h-20 object-contain" loading="lazy" />
                ) : <span className="text-sm text-gray-500">No Logo</span>}
              </div>
              <div className="mt-2 font-semibold text-sm text-center">{a.name}</div>
              <div className="text-xs text-gray-500">{a.country || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
