export function renderBoardingPassEmail(booking) {
  const b = booking || {};
  const fmt = (d) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); } catch { return String(d); }
  };
  const boardingTime = (() => {
    try { return new Date(new Date(b.departure).getTime() - 45 * 60000); } catch { return null; }
  })();
  const pnr = (b._id ? String(b._id) : "").slice(-6).toUpperCase();
  const route = `${b.from || "-"} → ${b.to || "-"}`;
  const clientBase = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";
  const ticketUrl = `${clientBase}/ticket/${b._id || ""}`;

  // Lightweight, inline-styled HTML for broad client support
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827;">
    <div style="background:#0b5cff; color:#fff; padding:16px 20px; border-radius:10px 10px 0 0;">
      <h1 style="margin:0; font-size:20px;">FlightHub · Boarding Pass</h1>
      <div style="opacity:.9; font-size:13px;">Your ticket is confirmed</div>
    </div>

    <div style="border:1px solid #e5e7eb; border-top:0; border-radius:0 0 10px 10px; padding:16px;">
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start;">
        <div style="flex:1; min-width:260px;">
          <div style="color:#374151; font-size:12px;">Route</div>
          <div style="font-size:22px; font-weight:700;">${route}</div>
          <div style="margin-top:10px; display:flex; gap:24px;">
            <div>
              <div style="color:#374151; font-size:12px;">Flight</div>
              <div style="font-size:14px; font-weight:600;">${b.flightNo || "-"}</div>
            </div>
            <div>
              <div style="color:#374151; font-size:12px;">PNR</div>
              <div style="font-size:14px; font-weight:600;">${pnr || "-"}</div>
            </div>
            <div>
              <div style="color:#374151; font-size:12px;">Gate</div>
              <div style="font-size:14px; font-weight:600;">${b.gate || "—"}</div>
            </div>
          </div>
        </div>
        <div style="min-width:220px;">
          <div style="color:#374151; font-size:12px;">Departure</div>
          <div style="font-size:14px; font-weight:600;">${fmt(b.departure)}</div>
          <div style="margin-top:8px; color:#374151; font-size:12px;">Boarding</div>
          <div style="font-size:14px; font-weight:600;">${boardingTime ? fmt(boardingTime) : "—"}</div>
          <div style="margin-top:8px; color:#374151; font-size:12px;">Arrival</div>
          <div style="font-size:14px; font-weight:600;">${fmt(b.arrival)}</div>
        </div>
      </div>

      <div style="margin-top:16px; font-size:12px; color:#374151;">Passengers</div>
      <ul style="margin:6px 0 0; padding-left:18px;">
        ${(Array.isArray(b.passengers) ? b.passengers : []).map(p => {
          const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Passenger";
          const seat = p.seat || "—";
          return `<li style=\"margin:2px 0; font-size:13px;\">${name} · Seat <strong>${seat}</strong></li>`;
        }).join("") || '<li style="font-size:13px;">No passengers on record</li>'}
      </ul>

      <div style="margin-top:16px;">
        <a href="${ticketUrl}"
           style="background:#0b5cff; color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block;">
          View Ticket
        </a>
        ${b.price != null ? `<span style="margin-left:12px; color:#111827; font-weight:600;">Total: ₹${b.price}</span>` : ""}
      </div>

      <div style="margin-top:16px; font-size:12px; color:#6b7280;">
        Please carry a valid photo ID. Boarding gates close 20 minutes before departure.
      </div>
    </div>
  </div>`;
}
