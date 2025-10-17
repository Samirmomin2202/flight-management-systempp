import PDFDocument from "pdfkit";

export async function generateTicketPdf(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc
        .fontSize(20)
        .text("Flight Ticket", { align: "center" })
        .moveDown();

      // Booking details
      const b = booking || {};
      doc.fontSize(12);
      doc.text(`Booking ID: ${b._id || "-"}`);
      doc.text(`Flight: ${b.flightNo || "-"}`);
      doc.text(`From: ${b.from || "-"}`);
      doc.text(`To: ${b.to || "-"}`);
      if (b.departure) doc.text(`Departure: ${new Date(b.departure).toLocaleString()}`);
      if (b.arrival) doc.text(`Arrival: ${new Date(b.arrival).toLocaleString()}`);
      if (b.price != null) doc.text(`Total Price: ₹${b.price}`);
      doc.text(`Status: ${b.status || "-"}`);
      doc.moveDown();

      // Passengers
      doc.fontSize(14).text("Passengers:").moveDown(0.5);
      const passengers = b.passengers || [];
      if (!passengers.length) {
        doc.fontSize(12).text("No passengers on record.");
      } else {
        passengers.forEach((p, idx) => {
          const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
          const seat = p.seat ? ` (Seat ${p.seat})` : "";
          doc.fontSize(12).text(`${idx + 1}. ${name || "Passenger"}${seat}`);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
