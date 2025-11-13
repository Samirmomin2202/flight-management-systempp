
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/**
 * Classic Airline Boarding Pass PDF Generator (Pinterest Style)
 * 
 * Design based on traditional airline boarding passes:
 * - Blue header bar with "AIR TICKET" and "BOARDING PASS"
 * - Tear-off stub design with perforation line
 * - Left section: Full passenger and flight details
 * - Right section: QR code and minimal info for gate scanning
 * - Economy class indicator
 * 
 * @param {Object} booking - Booking object with passengers array
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function generateTicketPdf(booking) {
  return new Promise((resolve, reject) => {
    try {
      const b = booking || {};
      const passengers = Array.isArray(b.passengers) ? b.passengers : [];

      // Colors - Classic airline blue boarding pass theme
      const colors = {
        primaryBlue: "#1E5BA8",      // Classic airline blue (header)
        darkBlue: "#154A8C",         // Darker blue variant
        lightBlue: "#E8F1FC",        // Light blue background
        white: "#FFFFFF",
        black: "#000000",
        darkGray: "#333333",
        mediumGray: "#666666",
        lightGray: "#999999",
        borderGray: "#CCCCCC",
        success: "#10B981",
      };

      // Simple date/time formatters for boarding pass
      const formatDate = (d) => {
        if (!d) return "-";
        try {
          return new Date(d).toLocaleDateString("en-US", { 
            day: "2-digit", 
            month: "short", 
            year: "numeric" 
          }).toUpperCase();
        } catch { return "-"; }
      };

      const formatTime = (d) => {
        if (!d) return "-";
        try {
          return new Date(d).toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: false 
          });
        } catch { return "-"; }
      };

      // Helper: Generate IATA-style QR payload (M1 barcode format)
      const generateBoardingPassPayload = (passenger, booking, sequenceNumber = 1) => {
        const formatName = (first = "", last = "") => {
          const f = String(first || "").replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 10);
          const l = String(last || "").replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 15);
          return `${l}/${f}`.padEnd(20, " ");
        };
        
        const pnr = (booking._id ? String(booking._id).slice(-6).toUpperCase() : "ABC123");
        const from = String(booking.from || "XXX").slice(0, 3).toUpperCase().padEnd(3, "X");
        const to = String(booking.to || "XXX").slice(0, 3).toUpperCase().padEnd(3, "X");
        const airline = "FH"; // FlightHub airline code
        const flight = String(booking.flightNo || "0000").padStart(4, "0").slice(0, 4);
        
        // Day of year (001-366)
        const depDate = new Date(booking.departure || Date.now());
        const dayOfYear = Math.floor((depDate - new Date(depDate.getFullYear(), 0, 0)) / 86400000);
        const day = String(dayOfYear).padStart(3, "0");
        
        const seat = String(passenger.seat || "0A").padStart(4, "0");
        const seq = String(sequenceNumber).padStart(4, "0");
        const status = booking.status === "confirmed" ? "0" : "1"; // 0=OK, 1=Check-in required
        
        const name = formatName(passenger.firstName, passenger.lastName);
        
        // IATA Aztec-style: M1<NAME><PNR> <FROM><TO><AIRLINE><FLIGHT><DAY><SEAT><SEQ><STATUS>
        return `M1${name}${pnr} ${from}${to}${airline}${flight}${day}${seat}${seq}${status}`;
      };

      // Convert ObjectId to string safely
      const bookingId = booking._id ? String(booking._id) : '';
      const pnr = bookingId.slice(-6).toUpperCase() || 'ABC123';

      const doc = new PDFDocument({ 
        size: "A4", 
        margin: 36,
        info: {
          Title: `Boarding Pass - ${booking.flightNo || 'Flight'}`,
          Author: 'FlightHub Airlines',
          Subject: `PNR: ${pnr}`,
          Keywords: 'boarding pass, flight ticket, e-ticket',
          Producer: 'FlightHub Ticket System v2.0'
        }
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ========== BOARDING PASS STUBS (Pinterest Style) ==========
      // Generate individual boarding pass for each passenger
      
      const stubHeight = 220; // Taller to match Pinterest design
      const stubWidth = 520;  // Standard boarding pass width
      const stubX = (pageWidth - stubWidth) / 2; // Center horizontally
      let y = 60; // Start position

      const drawBoardingPass = async (passenger, sequenceNumber) => {
        // Check if we need a new page
        if (y + stubHeight > pageHeight - 60) {
          doc.addPage();
          y = 60;
        }

        const leftSectionW = stubWidth * 0.68;
        const rightSectionW = stubWidth * 0.32;
        const tearLineX = stubX + leftSectionW;

        // ===== BLUE HEADER BAR =====
        doc.rect(stubX, y, stubWidth, 32).fill(colors.primaryBlue);
        
        // "AIR TICKET" text (left side)
        doc.fillColor(colors.white)
           .font("Helvetica-Bold")
           .fontSize(14)
           .text("Flight Hub", stubX + 20, y + 10);
        
        // "BOARDING PASS" text (center-left)
        doc.fillColor(colors.white)
           .font("Helvetica-Bold")
           .fontSize(14)
           .text("BOARDING PASS", stubX + 150, y + 10);
        
        // "ECONOMY" text (right side)
        doc.fillColor(colors.white)
           .font("Helvetica")
           .fontSize(12)
           .text("ECONOMY", tearLineX - 80, y + 11);
        
        // Small airline logo placeholder (top right corner)
        const logoSize = 24;
        doc.fillColor(colors.white)
           .fontSize(8)
           .text("✈", stubX + stubWidth - 35, y + 8);

        // ===== MAIN BODY (White background) =====
        const bodyY = y + 32;
        const bodyH = stubHeight - 32;
        doc.rect(stubX, bodyY, stubWidth, bodyH).fill(colors.white);
        doc.rect(stubX, bodyY, stubWidth, bodyH).stroke(colors.primaryBlue);

        // ===== LEFT SECTION: Passenger & Flight Details =====
        let currentY = bodyY + 15;
        const leftPad = stubX + 15;
        const labelSize = 8;
        const valueSize = 11;
        const rowGap = 22;

        const drawField = (label, value, x, yPos, labelW = 120) => {
          doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(labelSize).text(label, x, yPos);
          doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(valueSize).text(value || "-", x, yPos + 10, { width: labelW });
        };

        // Row 1: NAME OF PASSENGER
        drawField("NAME OF PASSENGER", `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim().toUpperCase(), leftPad, currentY, leftSectionW - 30);
        currentY += rowGap;

        // Row 2: DATE, BOARDING TIME, FLIGHT (3 columns)
        const col1X = leftPad;
        const col2X = leftPad + 90;
        const col3X = leftPad + 200;
        
        drawField("DATE", formatDate(booking.departure), col1X, currentY, 80);
        const boardingTime = (() => {
          try { return formatTime(new Date(new Date(booking.departure).getTime() - 45 * 60000)); } 
          catch { return "—"; }
        })();
        drawField("BOARDING TIME", boardingTime, col2X, currentY, 100);
        drawField("FLIGHT", booking.flightNo || "-", col3X, currentY, 80);
        currentY += rowGap + 8;

        // Row 3: FROM / TO (large)
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(labelSize).text("FROM:", leftPad, currentY);
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(labelSize).text("TO:", leftPad + 130, currentY);
        
        const fromCity = String(booking.from || "").split("(")[0].trim();
        const toCity = String(booking.to || "").split("(")[0].trim();
        
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(13).text(fromCity.toUpperCase(), leftPad, currentY + 10, { width: 110 });
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(13).text(toCity.toUpperCase(), leftPad + 130, currentY + 10, { width: 110 });
        currentY += rowGap + 5;

        // Row 4: GATE, SEAT (2 columns)
        drawField("GATE", booking.gate || "-", leftPad, currentY, 60);
        drawField("SEAT", passenger.seat || "-", leftPad + 100, currentY, 60);
        currentY += rowGap + 5;

        // Row 5: Confirmation number
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text(`ETN:${String(booking._id || "").slice(-12).toUpperCase()}`, leftPad, currentY);

        // Bottom blue bar with gate closure note
        const bottomBarY = y + stubHeight - 22;
        doc.rect(stubX, bottomBarY, stubWidth, 22).fill(colors.primaryBlue);
        doc.fillColor(colors.white)
           .font("Helvetica")
           .fontSize(8)
           .text("GATE CLOSES 30 MINUTES BEFORE DEPARTURE", stubX + 20, bottomBarY + 7, { width: leftSectionW - 40 });

        // ===== PERFORATION LINE =====
        doc.moveTo(tearLineX, bodyY + 5)
           .lineTo(tearLineX, y + stubHeight - 27)
           .dash(4, { space: 4 })
           .stroke(colors.borderGray)
           .undash();

        // ===== RIGHT SECTION: QR Code & Minimal Info =====
        const rightPad = tearLineX + 15;
        const rightY = bodyY + 15;

        // "NAME OF PASSENGER" (small)
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("NAME OF PASSENGER", rightPad, rightY, { width: rightSectionW - 30 });
        const passengerName = `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim();
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(passengerName.toUpperCase(), rightPad, rightY + 9, { width: rightSectionW - 30 });

        // FROM / TO (compact)
        let rightRowY = rightY + 30;
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("FROM:", rightPad, rightRowY);
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("TO:", rightPad, rightRowY + 12);
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(fromCity, rightPad + 24, rightRowY);
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(toCity, rightPad + 24, rightRowY + 12);
        rightRowY += 35;

        // GATE, SEAT, FLIGHT (compact)
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("GATE", rightPad, rightRowY);
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("SEAT", rightPad + 40, rightRowY);
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("FLIGHT", rightPad + 80, rightRowY);
        
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(booking.gate || "-", rightPad, rightRowY + 10);
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(passenger.seat || "-", rightPad + 40, rightRowY + 10);
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(booking.flightNo || "-", rightPad + 80, rightRowY + 10);
        rightRowY += 30;

        // BOARDING TIME
        doc.fillColor(colors.mediumGray).font("Helvetica").fontSize(7).text("BOARDING TIME", rightPad, rightRowY);
        doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9).text(boardingTime, rightPad, rightRowY + 10);

        // QR CODE (centered in right section, below text)
        const qrSize = 90;
        const qrX = tearLineX + (rightSectionW - qrSize) / 2;
        const qrY = bodyY + bodyH - qrSize - 35;

        const payload = generateBoardingPassPayload(passenger, booking, sequenceNumber);
        let qrBuf = null;
        try {
          const dataUrl = await QRCode.toDataURL(payload, {
            margin: 1,
            scale: 4,
            errorCorrectionLevel: 'M',
            color: { dark: colors.black, light: colors.white }
          });
          qrBuf = Buffer.from(dataUrl.split(",")[1], "base64");
        } catch (err) {
          console.error("QR generation error:", err);
        }

        if (qrBuf) {
          doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
        } else {
          doc.rect(qrX, qrY, qrSize, qrSize).stroke(colors.borderGray);
          doc.fillColor(colors.lightGray).fontSize(8).text("QR Error", qrX, qrY + qrSize / 2 - 4, { width: qrSize, align: "center" });
        }

        // Small airline logo on right stub
        doc.fillColor(colors.primaryBlue).fontSize(8).text("✈ Flight Hub", rightPad, bottomBarY + 5, { width: rightSectionW - 30, align: "center" });

        y += stubHeight + 25; // Space before next boarding pass
      };

      // ===== GENERATE BOARDING PASSES =====
      const run = async () => {
        if (!passengers.length) {
          await drawBoardingPass({ firstName: "Guest", lastName: "Passenger", seat: "-" }, 1);
        } else {
          for (let i = 0; i < passengers.length; i++) {
            await drawBoardingPass(passengers[i], i + 1);
          }
        }

        doc.end();
      };

      run();
    } catch (err) {
      reject(err);
    }
  });
}
