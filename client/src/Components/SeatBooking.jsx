import React, { useEffect, useMemo, useState } from "react";

// Demo Seat Booking System (self-contained)
// - Grid: Rows A–E, Numbers 1–10 (A1..E10)
// - States: available | selected | booked
// - Confirm Booking -> selected -> booked
// - Cancel Booking -> revert last confirmed seats by this client
// - Persistence: localStorage + 'storage' event for multi-tab updates

const ROWS = ["A", "B", "C", "D", "E"];
const COLS = Array.from({ length: 10 }, (_, i) => i + 1);
const STORAGE_KEY = "seat-booking-demo:seats";
const LAST_BOOKED_KEY = "seat-booking-demo:lastBooked";

function buildInitialSeats() {
  const seats = [];
  for (const r of ROWS) {
    for (const c of COLS) {
      seats.push({ id: `${r}${c}`, status: "available" });
    }
  }
  return seats;
}

function readSeats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialSeats();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(s => s && typeof s.id === "string" && s.status)) {
      return parsed;
    }
    return buildInitialSeats();
  } catch {
    return buildInitialSeats();
  }
}

function writeSeats(seats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seats)); } catch {}
}

function readLastBooked() {
  try {
    const raw = localStorage.getItem(LAST_BOOKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeLastBooked(ids) {
  try { localStorage.setItem(LAST_BOOKED_KEY, JSON.stringify(ids)); } catch {}
}

export default function SeatBooking() {
  const [seats, setSeats] = useState(() => readSeats());
  const [selected, setSelected] = useState(() => new Set());

  // Sync with other tabs/windows in real-time
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setSeats(readSeats());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSeat = (id) => {
    const seat = seats.find(s => s.id === id);
    if (!seat) return;
    if (seat.status === "booked") return; // unclickable
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmBooking = () => {
    if (selected.size === 0) return;
    setSeats(prev => {
      const next = prev.map(s => selected.has(s.id) && s.status !== "booked" ? { ...s, status: "booked" } : s);
      writeSeats(next);
      writeLastBooked(Array.from(selected));
      return next;
    });
    setSelected(new Set());
  };

  const cancelBooking = () => {
    const last = readLastBooked();
    if (!last.length) return;
    setSeats(prev => {
      const next = prev.map(s => last.includes(s.id) ? { ...s, status: "available" } : s);
      writeSeats(next);
      writeLastBooked([]);
      return next;
    });
  };

  const grid = useMemo(() => {
    const map = new Map(seats.map(s => [s.id, s.status]));
    return ROWS.map(r => COLS.map(c => {
      const id = `${r}${c}`;
      return { id, status: map.get(id) || "available" };
    }));
  }, [seats]);

  const seatClass = (status, isSelected) => {
    const base = "relative w-10 h-10 flex items-center justify-center rounded border text-xs font-semibold select-none transition";
    if (status === "booked") return `${base} bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed`;
    if (isSelected) return `${base} bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300`;
    return `${base} bg-green-50 hover:bg-green-100 text-green-800 border-green-500 cursor-pointer`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded border border-green-600 bg-green-50" /> 🟩 Available</div>
        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded border border-blue-700 bg-blue-600" /> 🟦 Selected</div>
        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded border border-gray-300 bg-gray-200" /> ❌ Booked</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div className="flex flex-col gap-2 mt-6">
          {ROWS.map(r => (
            <div key={r} className="w-6 text-slate-500 text-sm text-right">{r}</div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-10 gap-2 text-center text-slate-500 text-xs">
            {COLS.map(c => (<div key={`head-${c}`}>{c}</div>))}
          </div>
          {grid.map((row, idx) => (
            <div key={ROWS[idx]} className="grid grid-cols-10 gap-2">
              {row.map(({ id, status }) => {
                const isSelected = selected.has(id);
                return (
                  <button key={id} className={seatClass(status, isSelected)} onClick={() => toggleSeat(id)} disabled={status === "booked"} title={`${id} • ${status}`}>
                    {/* Cross overlay for booked */}
                    {status === "booked" && (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-base">❌</span>
                    )}
                    <span className={status === "booked" ? "opacity-70" : ""}>{id}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={confirmBooking} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">Confirm Booking</button>
        <button onClick={cancelBooking} className="w-full sm:w-auto px-6 py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-300 hover:scale-105">Cancel Booking</button>
      </div>

      <div className="mt-3 text-xs text-slate-500">Data persists in this browser via localStorage and syncs across tabs using the storage event.</div>
    </div>
  );
}
