import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Improved, modern boarding pass with a clean color palette and sections
export async function generateTicketPdf(booking) {
  return new Promise((resolve, reject) => {
    try {
      const b = booking || {};
      const passengers = Array.isArray(b.passengers) ? b.passengers : [];

      // Colors and helpers
      const colors = {
        primary: "#0b5cff", // brand blue
        primaryDark: "#0a4fdc",
        slate900: "#111827",
        slate700: "#374151",
        slate600: "#4b5563",
        slate500: "#6b7280",
        gray200: "#e5e7eb",
        gray100: "#f3f4f6",
        white: "#ffffff",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
      };

      const formatDate = (d) => {
        if (!d) return "-";
        try { return new Date(d).toLocaleString("en-IN"); } catch { return String(d); }
      };

      const formatDateFancy = (d) => {
        if (!d) return "-";
        try {
          return new Date(d).toLocaleString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch { return formatDate(d); }
      };

      const formatPrice = (p) => {
        if (p == null || isNaN(Number(p))) return "-";
        try {
          return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(p));
        } catch {
          return `₹${String(p)}`;
        }
      };

      const statusColor = (() => {
        const s = String(b.status || "").toLowerCase();
        if (s === "confirmed") return colors.success;
        if (s === "cancelled" || s === "canceled") return colors.danger;
        return colors.warning; // pending or others
      })();

  const doc = new PDFDocument({ size: "A4", margin: 36 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header banner
      const pageWidth = doc.page.width;
      const headerHeight = 72;
      doc.rect(0, 0, pageWidth, headerHeight).fill(colors.primary);
      doc
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("FlightHub", 36, 22, { align: "left" })
        .font("Helvetica")
        .fontSize(12)
        .fillColor(colors.white)
        .text("Boarding Pass", -36, 26, { align: "right" });

      // Card container
  let y = headerHeight + 16;
      const cardX = 36;
      const cardW = pageWidth - 72;
  const cardH = 230;
  // subtle shadow layer
  doc.fillColor("#eef2ff").roundedRect(cardX, y + 2, cardW, cardH, 12).fill();
      doc.roundedRect(cardX, y, cardW, cardH, 10).fillAndStroke(colors.white, colors.gray200);

      // Left column: Route and times
      const pad = 16;
      const leftX = cardX + pad;
      const leftW = cardW * 0.6 - pad * 1.5;
      const rightX = cardX + cardW * 0.6;
      const rightW = cardW * 0.4 - pad;

      // Route
  doc.fillColor(colors.slate700).fontSize(10).text("FROM", leftX, y + pad);
  doc.font("Helvetica-Bold").fontSize(28).fillColor(colors.slate900).text(b.from || "-", leftX, doc.y - 4);
  doc.font("Helvetica").fillColor(colors.slate700).fontSize(10).text("TO", leftX + leftW / 2, y + pad);
  doc.font("Helvetica-Bold").fontSize(28).fillColor(colors.slate900).text(b.to || "-", leftX + leftW / 2, doc.y - 4);

      // Times
      const timesY = y + 78;
  doc.fillColor(colors.slate700).fontSize(10).text("DEPARTURE", leftX, timesY);
  doc.fillColor(colors.slate900).fontSize(12).text(formatDateFancy(b.departure), leftX, doc.y + 2, { width: leftW / 2.2 });
  doc.fillColor(colors.slate700).fontSize(10).text("ARRIVAL", leftX + leftW / 2, timesY);
  doc.fillColor(colors.slate900).fontSize(12).text(formatDateFancy(b.arrival), leftX + leftW / 2, doc.y + 2, { width: leftW / 2.2 });

      // Flight details badges
      const badgesY = timesY + 54;
      const drawBadge = (label, value, bx) => {
        const bw = 150;
        const bh = 42;
        doc.roundedRect(bx, badgesY, bw, bh, 8).fillAndStroke(colors.gray100, colors.gray200);
        doc.fillColor(colors.slate700).fontSize(9).text(label, bx + 10, badgesY + 8);
        doc.fillColor(colors.slate900).fontSize(12).text(value || "-", bx + 10, badgesY + 22);
      };
      drawBadge("FLIGHT", b.flightNo, leftX);
      drawBadge("BOOKING ID", b._id, leftX + 160);
      drawBadge("PASSENGERS", String(b.passengers?.length || b.passengers || 1), leftX + 320);

      // Right column: Price and status
      const rightPadY = y + pad;
      doc.fillColor(colors.slate700).fontSize(10).text("PRICE", rightX + pad, rightPadY);
  const priceText = formatPrice(b.price);
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(18).text(priceText, rightX + pad, doc.y + 2);
  doc.font("Helvetica");

  doc.fillColor(colors.slate700).fontSize(10).text("STATUS", rightX + pad, doc.y + 18);
      // Status pill
      const pillY = doc.y + 4;
  doc.roundedRect(rightX + pad, pillY, 124, 24, 12).fill(statusColor);
  doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(11).text(String(b.status || "").toUpperCase() || "-", rightX + pad + 10, pillY + 6);
  doc.font("Helvetica");

      // Contact
      doc.fillColor(colors.slate700).fontSize(10).text("BOOKED BY", rightX + pad, pillY + 36);
      doc.fillColor(colors.slate900).fontSize(11).text(b.userEmail || "-", rightX + pad, doc.y + 2, { width: rightW - pad * 2 });

      // Passengers table
      y = y + cardH + 20;
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(14).text("Passengers", cardX, y);
  doc.font("Helvetica");
      y += 10;

      const tableX = cardX;
      const colNameW = 260;
      const colSeatW = 120;
      const colTypeW = 120;
      const rowH = 26;

      // Header row
      doc.rect(tableX, y, cardW, rowH).fill(colors.gray100);
      doc.fillColor(colors.slate700).font("Helvetica-Bold").fontSize(10)
        .text("Name", tableX + 12, y + 8, { width: colNameW })
        .text("Seat", tableX + 12 + colNameW, y + 8, { width: colSeatW })
        .text("Type", tableX + 12 + colNameW + colSeatW, y + 8, { width: colTypeW });
      doc.rect(tableX, y, cardW, rowH).stroke(colors.gray200);
      doc.font("Helvetica");
      y += rowH;

      if (!passengers.length) {
        doc.fillColor(colors.slate600).fontSize(11).text("No passengers on record.", tableX + 12, y + 8);
      } else {
        passengers.forEach((p, i) => {
          const alt = i % 2 === 1;
          doc.rect(tableX, y, cardW, rowH).fill(alt ? colors.white : "#fafafa");
          doc.rect(tableX, y, cardW, rowH).stroke(colors.gray200);
          const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Passenger";
          const seat = p.seat || "-";
          const type = p.passengerType || "Adult";
          doc.fillColor(colors.slate900).fontSize(11)
            .text(name, tableX + 12, y + 8, { width: colNameW })
            .text(seat, tableX + 12 + colNameW, y + 8, { width: colSeatW })
            .text(type, tableX + 12 + colNameW + colSeatW, y + 8, { width: colTypeW });
          y += rowH;
        });
      }

      // Per-passenger boarding pass stubs with QR (realistic feel)
      const pnr = (b._id ? String(b._id) : "").slice(-6).toUpperCase();
      const boardingTime = (() => {
        try { return new Date(new Date(b.departure).getTime() - 45 * 60000); } catch { return null; }
      })();

      const ensureSpace = (needed) => {
        if (y + needed > doc.page.height - 60) {
          doc.addPage();
          y = 36;
        }
      };

      y += 24;
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(14).text("Boarding Pass", cardX, y);
  doc.font("Helvetica");
      y += 12;

      const stubHeight = 120;
      const stubWidth = cardW;

      const drawStub = async (p) => {
        ensureSpace(stubHeight + 24);
        // Frame
        doc.roundedRect(cardX, y, stubWidth, stubHeight, 8).fillAndStroke(colors.white, colors.gray200);
        // Tear line
        doc.moveTo(cardX + stubWidth * 0.7, y).lineTo(cardX + stubWidth * 0.7, y + stubHeight)
          .dash(3, { space: 3 }).stroke(colors.gray200).undash();

        // Left main section
        const lx = cardX + 12;
        const rx = cardX + stubWidth * 0.72;

  const paxName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || (b.userEmail || "Passenger");
  doc.fillColor(colors.slate700).fontSize(9).text("PASSENGER", lx, y + 10);
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(14).text(paxName, lx, doc.y + 2, { width: stubWidth * 0.6 });
  doc.font("Helvetica");

        // Route bold
        const routeY = y + 38;
        doc.fillColor(colors.slate700).fontSize(9).text("FROM", lx, routeY);
        doc.fillColor(colors.slate900).fontSize(20).text(b.from || "-", lx, doc.y + 2);
        doc.fillColor(colors.slate700).fontSize(9).text("TO", lx + 160, routeY);
        doc.fillColor(colors.slate900).fontSize(20).text(b.to || "-", lx + 160, doc.y + 2);

        // Row of meta badges
        const metaY = routeY + 44;
        const badge = (label, val, bx) => {
          doc.fillColor(colors.slate700).fontSize(8).text(label, bx, metaY);
          doc.fillColor(colors.slate900).fontSize(12).text(val || "-", bx, doc.y + 2);
        };
        badge("FLIGHT", b.flightNo, lx);
        badge("DATE", formatDateFancy(b.departure).split(",")[0], lx + 110);
        badge("BOARDING", boardingTime ? formatDateFancy(boardingTime).split(",")[1]?.trim() : "—", lx + 220);
        badge("SEAT", p.seat || "—", lx + 330);
        badge("GATE", b.gate || "—", lx + 420);
        badge("PNR", pnr || "—", lx + 500);

        // Right tear stub with QR
        const payload = `FMS:${b._id || ""}:${p.seat || ""}`;
        let qrBuf = null;
        try {
          const dataUrl = await QRCode.toDataURL(payload, { margin: 0, scale: 3 });
          const base64 = dataUrl.split(",")[1];
          qrBuf = Buffer.from(base64, "base64");
        } catch {}
        // Stub header
        doc.rect(rx + 6, y + 8, stubWidth * 0.27 - 18, 20).fill(colors.primary);
        doc.fillColor(colors.white).fontSize(10).text("BOARDING PASS", rx + 10, y + 12, { width: stubWidth * 0.27 - 24, align: "center" });
        // QR or fallback
        if (qrBuf) {
          doc.image(qrBuf, rx + 26, y + 30, { width: 96, height: 96, fit: [96, 96] });
        } else {
          doc.fillColor(colors.slate500).rect(rx + 30, y + 36, 80, 80).stroke(colors.gray200);
          doc.fillColor(colors.slate500).fontSize(8).text("QR unavailable", rx + 30, y + 72, { width: 80, align: "center" });
        }
        // Stub details
        doc.fillColor(colors.slate700).fontSize(8).text("NAME", rx + 130, y + 36);
        doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(10).text(paxName, rx + 130, doc.y + 2, { width: stubWidth * 0.27 - 150 });
        doc.font("Helvetica").fillColor(colors.slate700).fontSize(8).text("FLIGHT", rx + 130, doc.y + 8);
        doc.fillColor(colors.slate900).fontSize(10).text(b.flightNo || "-", rx + 130, doc.y + 2);
        doc.fillColor(colors.slate700).fontSize(8).text("SEAT", rx + 130, doc.y + 8);
        doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(12).text(p.seat || "—", rx + 130, doc.y + 2);

        y += stubHeight + 16;
      };

      const run = async () => {
        if (!passengers.length) {
          // Single generic stub (no passenger breakdown)
          await drawStub({});
        } else {
          for (const p of passengers) {
            await drawStub(p);
          }
        }

        // Footer note
        ensureSpace(40);
        doc.moveTo(cardX, y).lineTo(cardX + cardW, y).stroke(colors.gray200);
        doc.fillColor(colors.slate500).fontSize(9).text(
          "Please carry a valid photo ID. Boarding gates close 20 minutes before departure.",
          cardX, y + 10, { width: cardW }
        );

        doc.end();
      };

  // Start async drawing for QR
  run();
    } catch (err) {
      reject(err);
    }
  });
}
