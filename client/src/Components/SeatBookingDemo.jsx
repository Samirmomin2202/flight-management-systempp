import React, { useEffect, useMemo, useRef, useState } from "react";

// Seat Booking Demo (client-only)
// - Grid: Rows A–E, Numbers 1–10 => A1..A10, ... E1..E10
// - States: available, selected (local temp), booked
// - Persisted in localStorage, real-time across tabs via 'storage' event

const STORAGE_KEY = "seat-grid-state-v1";
const CLIENT_KEY = "seat-grid-client-id";

const makeClientId = () => Math.random().toString(36).slice(2, 10);

const initState = (rows, cols) => {
  const seats = {};
  rows.forEach((r) => {
    cols.forEach((c) => {
      const id = `${r}${c}`;
      seats[id] = { status: "available", owner: null };
    });
  });
  return { seats, lastUpdated: Date.now() };
};

const readStore = (rows, cols) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initState(rows, cols);
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.seats) return initState(rows, cols);
    return parsed;
  } catch {
    return initState(rows, cols);
  }
};

const writeStore = (state) => {
  const next = { ...state, lastUpdated: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

const SeatBox = ({ id, state, isSelected, onClick }) => {
  const booked = state?.status === "booked";
  const classes = [
    "w-10 h-10 md:w-12 md:h-12 border rounded flex items-center justify-center text-xs md:text-sm font-medium select-none transition relative",
  ];
  if (booked) classes.push("bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed line-through");
  else if (isSelected) classes.push("bg-blue-500 text-white border-blue-600 hover:bg-blue-600");
  else classes.push("bg-green-100 text-green-900 border-green-300 hover:bg-green-200");

  return (
    <button type="button" className={classes.join(" ")} onClick={onClick} disabled={booked} title={id}>
      {id}
      {booked && (
        <span className="absolute text-base md:text-lg" style={{ top: 0, right: 2 }}>❌</span>
      )}
    </button>
  );
};

const Legend = () => (
  <div className="flex items-center gap-4 text-sm mb-4">
    <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 bg-green-200 border border-green-400 rounded" /> Available</div>
    <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 bg-blue-500 border border-blue-600 rounded" /> Selected</div>
    <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 bg-gray-300 border border-gray-400 rounded relative"><span className="absolute -top-2 text-xs">❌</span></span> Booked</div>
  </div>
);

const SeatBookingDemo = () => {
  const rows = useMemo(() => ["A", "B", "C", "D", "E"], []);
  const cols = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  const [store, setStore] = useState(() => readStore(rows, cols));
  const [selected, setSelected] = useState(() => new Set());
  const clientIdRef = useRef(null);

  // Ensure a client id
  useEffect(() => {
    let cid = localStorage.getItem(CLIENT_KEY);
    if (!cid) {
      cid = makeClientId();
      localStorage.setItem(CLIENT_KEY, cid);
    }
    clientIdRef.current = cid;
  }, []);

  // Listen for cross-tab updates
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setStore(readStore(rows, cols));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [rows, cols]);

  const toggleSeat = (id) => {
    const seat = store.seats[id];
    if (!seat || seat.status === "booked") return; // cannot toggle booked
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const confirmBooking = () => {
    if (selected.size === 0) return;
    const cid = clientIdRef.current;
    const next = { ...store, seats: { ...store.seats } };
    selected.forEach((id) => {
      const s = next.seats[id];
      if (s && s.status !== "booked") {
        next.seats[id] = { status: "booked", owner: cid };
      }
    });
    const written = writeStore(next);
    setStore(written);
    setSelected(new Set());
  };

  const cancelMyBookings = () => {
    const cid = clientIdRef.current;
    const next = { ...store, seats: { ...store.seats } };
    let changed = false;
    Object.entries(next.seats).forEach(([id, s]) => {
      if (s?.status === "booked" && s.owner === cid) {
        next.seats[id] = { status: "available", owner: null };
        changed = true;
      }
    });
    if (!changed) return;
    const written = writeStore(next);
    setStore(written);
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Seat Booking Demo</h1>
        <p className="text-slate-600 mb-4">Click seats to select. Confirm to book. Cancel reverts your own bookings.</p>

        <Legend />

        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full border-collapse">
            <tbody>
              {rows.map((r) => (
                <tr key={r} className="border-b">
                  <td className="px-2 py-2 text-xs md:text-sm text-slate-500 w-8 align-middle">{r}</td>
                  <td className="px-2 py-2">
                    <div className="grid grid-cols-10 gap-2">
                      {cols.map((c) => {
                        const id = `${r}${c}`;
                        const seatState = store.seats[id];
                        return (
                          <SeatBox
                            key={id}
                            id={id}
                            state={seatState}
                            isSelected={selected.has(id)}
                            onClick={() => toggleSeat(id)}
                          />
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={confirmBooking} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm">Confirm Booking</button>
          <button onClick={cancelMyBookings} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow text-sm">Cancel My Bookings</button>
        </div>

        <div className="text-xs text-slate-500 mt-4">Last updated: {new Date(store.lastUpdated).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default SeatBookingDemo;
