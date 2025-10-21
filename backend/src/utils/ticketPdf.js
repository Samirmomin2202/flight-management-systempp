
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
          // Example: 6 Oct 2025, 3:04 PM
          return new Date(d).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        } catch { return formatDate(d); }
      };

      const formatPrice = (p) => {
        if (p == null || isNaN(Number(p))) return "-";
        try {
          return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(p));
        } catch {
          return `${String(p)}`;
        }
      };

      const statusColor = (() => {
        const s = String(b.status || "").toLowerCase();
        if (s === "confirmed") return colors.success;
        if (s === "cancelled" || s === "canceled") return colors.danger;
        return colors.warning; // pending or others
      })();

      // Helper: mask email for nicer display
      const maskEmail = (em) => {
        if (!em || typeof em !== "string") return "-";
        const [user, domain] = em.split("@");
        if (!domain) return em;
        const u = user.length <= 3 ? user : user.slice(0, 3) + "***";
        return `${u}@${domain}`;
      };

      // Helper: shrink or truncate text to fit max width
      const fitText = (txt, startSize, maxWidth, font = "Helvetica-Bold", minSize = 9) => {
        if (!txt) return { text: "-", size: startSize };
        let size = startSize;
        let safe = String(txt);
        while (size >= minSize && doc.widthOfString(safe, { font, size }) > maxWidth) {
          size -= 1;
        }
        if (size < minSize) {
          size = minSize;
          // Truncate with ellipsis if still too wide
          let t = safe;
          while (t.length > 4 && doc.widthOfString(t + "…", { font, size }) > maxWidth) {
            t = t.slice(0, -1);
          }
          safe = t + "…";
        }
        return { text: safe, size };
      };

  const doc = new PDFDocument({ size: "A4", margin: 36 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header banner
      const pageWidth = doc.page.width;
      const headerHeight = 84;
      doc.rect(0, 0, pageWidth, headerHeight).fill(colors.primary);
      doc
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("FlightHub", 36, 26, { align: "left" })
        .font("Helvetica")
        .fontSize(12)
        .fillColor(colors.white)
        .text("Boarding Pass", -36, 30, { align: "right" });

      // Card container
  let y = headerHeight + 18;
      const cardX = 36;
      const cardW = pageWidth - 72;
  // Increased to provide enough space for the right-side contact panel
  const cardH = 320;
  // subtle shadow layer
  doc.fillColor("#eef2ff").roundedRect(cardX, y + 2, cardW, cardH, 12).fill();
      doc.roundedRect(cardX, y, cardW, cardH, 10).fillAndStroke(colors.white, colors.gray200);

      // Left column: Route and times
      const pad = 16;
  const leftX = cardX + pad;
  const leftW = cardW * 0.58 - pad * 1.5;
  const rightX = cardX + cardW * 0.58;
  const rightW = cardW * 0.42 - pad;

      // Route
    doc.fillColor(colors.slate700).fontSize(10).text("FROM", leftX, y + pad);
  const fromFit = fitText(b.from || "-", 18, leftW - 8, "Helvetica-Bold", 10);
  doc.font("Helvetica-Bold").fontSize(fromFit.size).fillColor(colors.slate900).text(fromFit.text, leftX, doc.y + 4, { width: leftW - 8 });
    // Add extra vertical space between FROM and TO
    let toLabelY = doc.y + 18;
    doc.font("Helvetica").fillColor(colors.slate700).fontSize(10).text("TO", leftX, toLabelY);
  const toFit = fitText(b.to || "-", 18, leftW - 8, "Helvetica-Bold", 10);
  doc.font("Helvetica-Bold").fontSize(toFit.size).fillColor(colors.slate900).text(toFit.text, leftX, doc.y + 4, { width: leftW - 8 });
    // Reduce vertical space after TO before DEPARTURE
    y = doc.y + 8;

      // Times
    const timesY = y + 90;
  doc.fillColor(colors.slate700).fontSize(10).text("DEPARTURE", leftX, timesY);
  doc.fillColor(colors.slate900).fontSize(12).text(formatDateFancy(b.departure), leftX, doc.y + 2, { width: leftW / 2.1 });
  doc.fillColor(colors.slate700).fontSize(10).text("ARRIVAL", leftX + leftW / 2, timesY);
  doc.fillColor(colors.slate900).fontSize(12).text(formatDateFancy(b.arrival), leftX + leftW / 2, doc.y + 2, { width: leftW / 2.1 });

      // Flight details badges
      const badgesY = timesY + 56;
      const badgeGap = 12;
      const bw = Math.max(150, Math.min(170, Math.floor((leftW - badgeGap * 2 - 8) / 3)));
      const bh = 44;
      const drawBadge = (label, value, i) => {
        const bx = leftX + i * (bw + badgeGap);
        doc.roundedRect(bx, badgesY, bw, bh, 8).fillAndStroke(colors.gray100, colors.gray200);
        doc.fillColor(colors.slate700).fontSize(9).text(label, bx + 10, badgesY + 8, { width: bw - 20 });
        // Shorten Booking ID for better fit
        const displayVal = label === "BOOKING ID" && value ? ("…" + String(value).slice(-6)) : (value || "-");
        doc.fillColor(colors.slate900).fontSize(12).text(displayVal, bx + 10, badgesY + 22, { width: bw - 20 });
      };
      drawBadge("FLIGHT", b.flightNo, 0);
      drawBadge("BOOKING ID", b._id, 1);
      drawBadge("PASSENGERS", String(Array.isArray(b.passengers) ? b.passengers.length : (b.passengers || 1)), 2);

      // Right column: Price and status
      const rightPadY = y + pad;
      doc.fillColor(colors.slate700).fontSize(10).text("PRICE", rightX + pad, rightPadY);
  const priceText = formatPrice(b.price);
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(20).text(priceText, rightX + pad, doc.y + 2);
  doc.font("Helvetica");

  doc.fillColor(colors.slate700).fontSize(10).text("STATUS", rightX + pad, doc.y + 20);
      // Status pill
    const pillY = doc.y + 4;
    const pillText = (String(b.status || "").toUpperCase() || "-");
    const pillTextW = doc.widthOfString(pillText, { font: "Helvetica-Bold", size: 11 });
    const pillW = Math.max(124, pillTextW + 28);
  doc.roundedRect(rightX + pad, pillY, pillW, 26, 13).fill(statusColor);
  doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(11).text(pillText, rightX + pad + 12, pillY + 7, { width: pillW - 24, align: "left" });
  doc.font("Helvetica");

  // Contact panel moved below Passengers to avoid any collision with right-side content

    // Passengers table
      y = y + cardH + 20;
  const paxCount = Array.isArray(passengers) ? passengers.length : (passengers ? 1 : 0);
  const paxHeading = `Passengers${paxCount ? ` (${paxCount})` : ''}`;
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(14).text(paxHeading, cardX, y);
  doc.font("Helvetica");
      y += 10;

      const tableX = cardX;
      const colNameW = 260;
      const colSeatW = 120;
      const colTypeW = 120;
  const rowH = 28;

      const drawPassengerHeader = () => {
        doc.rect(tableX, y, cardW, rowH).fill(colors.gray100);
        doc.fillColor(colors.slate700).font("Helvetica-Bold").fontSize(10)
          .text("Name", tableX + 12, y + 8, { width: colNameW })
          .text("Seat", tableX + 12 + colNameW, y + 8, { width: colSeatW })
          .text("Type", tableX + 12 + colNameW + colSeatW, y + 8, { width: colTypeW });
        doc.rect(tableX, y, cardW, rowH).stroke(colors.gray200);
        doc.font("Helvetica");
        y += rowH;
      };

      // Ensure helper for page breaks
      const ensureSpace = (needed) => {
        if (y + needed > doc.page.height - 60) {
          doc.addPage();
          y = 36;
        }
      };

      drawPassengerHeader();

      if (!passengers.length) {
        doc.fillColor(colors.slate600).fontSize(11).text("No passengers on record.", tableX + 12, y + 8);
      } else {
        passengers.forEach((p, i) => {
          // Page break if needed before drawing next row
          ensureSpace(rowH + 10);
          if (y === 36) {
            // New page: redraw header
            drawPassengerHeader();
          }
          const alt = i % 2 === 1;
          doc.rect(tableX, y, cardW, rowH).fill(alt ? colors.white : "#fafafa");
          doc.rect(tableX, y, cardW, rowH).stroke(colors.gray200);
          const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Passenger";
          const seat = p.seat || "-";
          const type = p.passengerType || "Adult";
          doc.fillColor(colors.slate900).fontSize(12)
            .text(name, tableX + 12, y + 8, { width: colNameW })
            .text(seat, tableX + 12 + colNameW, y + 8, { width: colSeatW })
            .text(type, tableX + 12 + colNameW + colSeatW, y + 8, { width: colTypeW });
          y += rowH;
        });
      }

      // Contact panel placed AFTER passengers section to avoid any collision
      {
        const panelX = cardX;
        const panelW = cardW;
        const textX = panelX + 10;
        const textW = panelW - 20;
        const byLine = `Booked by: ${b.userEmail || '-'}`;
        const issuedRaw = formatDateFancy(b.bookingDate || new Date());
        const issuedClean = typeof issuedRaw === 'string' ? issuedRaw.replace(/\bAM\b/g, 'am').replace(/\bPM\b/g, 'pm') : issuedRaw;
        const issuedLine = `Issued on: ${issuedClean}`;
        doc.font('Helvetica').fontSize(10);
        const byH = doc.heightOfString(byLine, { width: textW });
        const issuedH = doc.heightOfString(issuedLine, { width: textW });
        const panelH = 14 + byH + 6 + issuedH + 6;
        ensureSpace(panelH + 16);
        // small top margin before panel
        y += 8;
        doc.roundedRect(panelX, y, panelW, panelH, 8).fillAndStroke(colors.gray100, colors.gray200);
        doc.fillColor(colors.slate700).fontSize(10).text(byLine, textX, y + 8, { width: textW });
        doc.fillColor(colors.slate700).fontSize(10).text(issuedLine, textX, y + 8 + byH + 6, { width: textW });
        y += panelH + 12;
      }

      // Per-passenger boarding pass stubs with QR (realistic feel)
      const pnr = (b._id ? String(b._id) : "").slice(-6).toUpperCase();
      const boardingTime = (() => {
        try { return new Date(new Date(b.departure).getTime() - 45 * 60000); } catch { return null; }
      })();

  y += 24;
  doc.fillColor(colors.slate900).font("Helvetica-Bold").fontSize(14).text("Boarding Pass", cardX, y);
  doc.font("Helvetica");
      y += 12;

  const stubHeight = 140;
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
        const rx = cardX + stubWidth * 0.70;
        const stubRightW = stubWidth * 0.30;

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

        // Row(s) of meta badges (kept within left section to avoid QR area)
        const metaY = routeY + 44;
        const leftAreaW = (rx - lx) - 16; // padding to stay clear of tear line
        const gap = 16;
        const colW = Math.floor((leftAreaW - gap * 2) / 3);
        const colX = (i) => lx + i * (colW + gap);
        const badge = (label, val, bx, by) => {
          doc.fillColor(colors.slate700).fontSize(8).text(label, bx, by, { width: colW });
          doc.fillColor(colors.slate900).fontSize(12).text(val || "-", bx, by + 12, { width: colW });
        };
        // First row
        badge("FLIGHT", b.flightNo, colX(0), metaY);
        badge("DATE", formatDateFancy(b.departure).split(",")[0], colX(1), metaY);
        badge("BOARDING", boardingTime ? formatDateFancy(boardingTime).split(",")[1]?.trim() : "—", colX(2), metaY);
        // Second row
        const metaY2 = metaY + 28;
        badge("SEAT", p.seat || "—", colX(0), metaY2);
        badge("GATE", b.gate || "—", colX(1), metaY2);
        badge("PNR", pnr || "—", colX(2), metaY2);

        // Right tear stub with QR (centered), with no additional details
        const payload = `FMS:${b._id || ""}:${p.seat || ""}`;
        let qrBuf = null;
        try {
          const dataUrl = await QRCode.toDataURL(payload, { margin: 0, scale: 3 });
          const base64 = dataUrl.split(",")[1];
          qrBuf = Buffer.from(base64, "base64");
        } catch {}
        // QR only (no text next to it)
        const qrSize = 108;
        const qrX = rx + (stubRightW - qrSize) / 2;
        const qrY = y + (stubHeight - qrSize) / 2;
        if (qrBuf) {
          doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize, fit: [qrSize, qrSize] });
        } else {
          doc.fillColor(colors.slate500).rect(qrX, qrY, qrSize, qrSize).stroke(colors.gray200);
          doc.fillColor(colors.slate500).fontSize(8).text("QR unavailable", qrX, qrY + qrSize / 2 - 6, { width: qrSize, align: "center" });
        }

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
