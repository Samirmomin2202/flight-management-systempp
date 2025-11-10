# Boarding Pass Generator - Complete Documentation

## 📋 Overview

Professional, print-ready boarding pass system with both **backend PDF generation** (Node.js/PDFKit) and **frontend React component** (html2canvas + jsPDF) for multi-passenger support, QR codes, and realistic airline branding.

---

## 🎨 Design Analysis & Improvements

### Visual Design Features
- **Airline Branding Header**: Blue gradient (`#003DA5` → `#002366`) with logo placeholder
- **Typography**: 
  - Headers: Helvetica-Bold (airline standard)
  - Body: Helvetica (clean, print-friendly)
  - Sizes: 8px-32px (labels to large codes)
- **Color Palette**:
  ```
  Primary: #003DA5 (Airline Blue)
  Dark: #002366
  Light: #E8F4FF
  Success: #10B981 (Confirmed)
  Danger: #EF4444 (Cancelled)
  Warning: #F59E0B (Pending)
  ```
- **Security Elements**:
  - PNR (6-char alphanumeric booking reference)
  - IATA-style QR codes (M1 barcode format)
  - Tear-off perforation lines
  - Seat/Gate/Flight metadata grid
- **Accessibility**: High contrast text, large font sizes for codes, print-optimized spacing

### Top 5 Recommended Improvements (Already Implemented ✅)
1. **IATA-compliant QR payload** – M1 barcode format with passenger name, PNR, route, flight, day-of-year, seat, sequence
2. **Tear-off stub design** – Dashed perforation line separating main info from QR section
3. **Official color scheme** – Professional airline blue instead of generic colors
4. **Per-passenger boarding cards** – Individual QR codes and seat assignments
5. **Print-ready layout** – A4 margins, high-DPI export, proper spacing for printers

---

## 📦 Installation

### Backend (Node.js)
```bash
cd backend
npm install pdfkit qrcode
```

### Frontend (React)
```bash
cd client
npm install qrcode.react html2canvas jspdf
```

**Complete package.json additions:**
```json
{
  "dependencies": {
    "pdfkit": "^0.14.0",
    "qrcode": "^1.5.3",
    "qrcode.react": "^3.1.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1"
  }
}
```

---

## 🔧 Backend PDF Generator (PDFKit)

### Location
`backend/src/utils/ticketPdf.js`

### Features
- Server-side PDF generation via PDFKit
- IATA M1 barcode format QR codes
- Multi-passenger support (individual boarding cards)
- Professional airline branding
- A4 print-ready layout (210mm × 297mm)

### Usage
```javascript
import { generateTicketPdf } from './src/utils/ticketPdf.js';

// In your booking confirmation route:
const pdfBuffer = await generateTicketPdf(bookingWithPassengers);

// Attach to email
await sendEmail({
  to: customer.email,
  subject: 'Your Boarding Pass',
  attachments: [{
    filename: `BoardingPass-${booking.flightNo}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]
});
```

### Data Schema (Backend)
```javascript
{
  _id: "6912093d4a080ca823c9a33e",
  flightNo: "FH109",
  from: "Mumbai (BOM)",
  to: "Delhi (DEL)",
  departure: "2025-11-15T14:30:00.000Z",
  arrival: "2025-11-15T16:45:00.000Z",
  gate: "A12",
  status: "confirmed",
  price: 8500,
  userEmail: "customer@example.com",
  bookingDate: "2025-11-10T08:30:00.000Z",
  passengers: [
    {
      firstName: "John",
      lastName: "Doe",
      seat: "12A",
      passengerType: "Adult"
    }
  ]
}
```

---

## ⚛️ React Component (Frontend)

### Location
`client/src/Components/BoardingPassGenerator.jsx`

### Features
- Interactive boarding pass preview
- **Download Combined PDF** – All passengers in one multi-page PDF
- **Download Individual PDFs** – Separate PDF per passenger
- High-DPI export (scale: 3) for print quality
- Responsive Tailwind CSS design
- Real-time QR code generation

### Usage
```jsx
import BoardingPassGenerator from './Components/BoardingPassGenerator';

function BookingConfirmation() {
  const bookingData = {
    bookingId: '6912093d4a080ca823c9a33e',
    pnr: 'FH2K9P',
    airline: { code: 'FH', name: 'FlightHub Airlines' },
    flight: {
      number: 'FH109',
      from: 'Mumbai',
      to: 'Delhi',
      fromCode: 'BOM',
      toCode: 'DEL'
    },
    departure: '2025-11-15T14:30:00.000Z',
    arrival: '2025-11-15T16:45:00.000Z',
    boarding: '2025-11-15T13:45:00.000Z',
    gate: 'A12',
    status: 'confirmed',
    price: 8500,
    currency: 'INR',
    passengers: [
      {
        firstName: 'Samir',
        lastName: 'Momin',
        seat: '12A',
        type: 'Adult',
        sequenceNumber: 1
      }
    ],
    bookedBy: 'customer@example.com',
    bookedOn: '2025-11-10T08:30:00.000Z',
    cabinClass: 'Economy'
  };

  return <BoardingPassGenerator bookingData={bookingData} />;
}
```

### JSON Schema (Frontend)
```typescript
interface BoardingPassData {
  bookingId: string;
  pnr: string;
  airline: {
    code: string;
    name: string;
    logo?: string;
  };
  flight: {
    number: string;
    from: string;
    to: string;
    fromCode: string; // 3-letter IATA code
    toCode: string;
  };
  departure: string; // ISO 8601 date
  arrival: string;
  boarding: string;
  gate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  price: number;
  currency: string;
  passengers: Array<{
    firstName: string;
    lastName: string;
    seat: string; // e.g., "12A"
    type: 'Adult' | 'Child' | 'Infant';
    sequenceNumber: number;
  }>;
  bookedBy: string; // email
  bookedOn: string; // ISO 8601 date
  cabinClass?: 'Economy' | 'Premium Economy' | 'Business' | 'First';
}
```

---

## 🔐 QR Code Specification

### Format: IATA Aztec M1 Barcode
Standard airline boarding pass format recognized globally.

### Payload Structure
```
M1<NAME><PNR> <FROM><TO><AIRLINE><FLIGHT><DAY><SEAT><SEQ><STATUS>
```

### Example
```
M1DOE/JOHN          ABC123 BOMBOMDELELHFH50133401234A00010
```

### Field Breakdown
| Field | Length | Example | Description |
|-------|--------|---------|-------------|
| M1 | 2 | M1 | Format code |
| NAME | 20 | DOE/JOHN | Last/First (padded) |
| PNR | 7 | ABC123 | Booking reference |
| FROM | 3 | BOM | Departure airport |
| TO | 3 | DEL | Arrival airport |
| AIRLINE | 3 | FH | Carrier code |
| FLIGHT | 4 | 0501 | Flight number (zero-padded) |
| DAY | 3 | 334 | Day of year (001-366) |
| SEAT | 4 | 012A | Seat number |
| SEQ | 4 | 0001 | Passenger sequence |
| STATUS | 1 | 0 | 0=confirmed, 1=pending |

### QR Generation (React)
```jsx
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG
  value={generateQRPayload(passenger)}
  size={140}
  level="M"
  fgColor="#002366"
  includeMargin={true}
/>
```

### QR Generation (Node.js)
```javascript
import QRCode from 'qrcode';

const payload = generateBoardingPassPayload(passenger, booking, sequenceNumber);
const dataUrl = await QRCode.toDataURL(payload, {
  margin: 1,
  scale: 4,
  errorCorrectionLevel: 'M',
  color: { dark: '#002366', light: '#FFFFFF' }
});
const base64 = dataUrl.split(',')[1];
const qrBuffer = Buffer.from(base64, 'base64');
```

---

## 🖨️ PDF Export Quality

### Frontend (html2canvas + jsPDF)
```javascript
// High-DPI settings for print quality
const canvas = await html2canvas(element, {
  scale: 3,           // 3x resolution (approx 300 DPI)
  useCORS: true,      // Load external images
  backgroundColor: '#ffffff',
  windowWidth: 1200   // Render width
});

const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',       // 210 × 297mm
  compress: true
});

const imgWidth = 210; // A4 width
const imgHeight = (canvas.height * imgWidth) / canvas.width;
pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidth, imgHeight);
```

### Backend (PDFKit)
```javascript
const doc = new PDFDocument({
  size: 'A4',
  margin: 36, // ~0.5 inch margins
  info: {
    Title: `Boarding Pass - ${booking.flightNo}`,
    Author: 'FlightHub Airlines',
    Subject: `PNR: ${pnr}`,
    Producer: 'FlightHub Ticket System v2.0'
  }
});
```

### Print Recommendations
- **DPI**: 300 (scale: 3 in html2canvas)
- **Format**: A4 (210mm × 297mm) or Letter (8.5″ × 11″)
- **Margins**: 36pt (~12.7mm / 0.5″) for printer bleed
- **Color**: JPEG at 95% quality for file size balance
- **Fonts**: Helvetica (pre-installed on most systems)

---

## 🎨 Fonts & Assets

### Recommended Fonts (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
```

**CSS fallback:**
```css
body {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

### Airline Logo SVG (Placeholder)
```jsx
// In your component:
const AirlineLogo = () => (
  <svg width="50" height="50" viewBox="0 0 50 50">
    <rect width="50" height="50" rx="8" fill="#FFFFFF" />
    <text
      x="25"
      y="32"
      fontSize="20"
      fontWeight="bold"
      fill="#003DA5"
      textAnchor="middle"
    >
      FH
    </text>
  </svg>
);
```

### Status Badge SVG
```jsx
const StatusBadge = ({ status }) => {
  const color = status === 'confirmed' ? '#10B981' : '#F59E0B';
  return (
    <div
      className="inline-flex items-center px-4 py-2 rounded-full"
      style={{ backgroundColor: color }}
    >
      <svg className="w-4 h-4 mr-2" fill="white" viewBox="0 0 20 20">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
      </svg>
      <span className="text-white font-bold text-sm">{status.toUpperCase()}</span>
    </div>
  );
};
```

---

## 📂 Sample Output Files

### Filename Conventions
**Combined PDF:**
```
BoardingPass-FH109-FH2K9P-2pax.pdf
```

**Individual PDF:**
```
BoardingPass-FH109-Momin-12A.pdf
BoardingPass-FH109-Sharma-12B.pdf
```

### Sample HTML/CSS Snippet (Single Card)
```html
<div class="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
          <span class="text-2xl font-bold text-blue-900">FH</span>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-white">FlightHub Airlines</h2>
          <p class="text-blue-200 text-sm">Electronic Boarding Pass</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-blue-200 text-xs">Booking Reference</p>
        <p class="text-white font-bold text-lg">FH2K9P</p>
      </div>
    </div>
  </div>
  
  <!-- Content -->
  <div class="border-2 border-gray-200 p-6">
    <div class="flex justify-between mb-4">
      <div>
        <p class="text-xs text-gray-600">FROM</p>
        <p class="text-4xl font-bold text-blue-700">BOM</p>
      </div>
      <div class="text-2xl text-gray-400 self-center">→</div>
      <div>
        <p class="text-xs text-gray-600">TO</p>
        <p class="text-4xl font-bold text-blue-700">DEL</p>
      </div>
    </div>
  </div>
  
  <!-- QR Section -->
  <div class="border-t-2 border-dashed border-gray-300 p-6 text-center">
    <img src="qr-code.png" alt="QR" class="w-32 h-32 mx-auto" />
    <p class="text-xs text-blue-700 font-bold mt-2">SCAN TO BOARD</p>
  </div>
</div>
```

---

## 🔄 Multi-Passenger Workflow

### Backend (PDFKit)
```javascript
// Automatic per-passenger boarding cards
for (let i = 0; i < passengers.length; i++) {
  await drawStub(passengers[i], i + 1); // Sequence numbers 1, 2, 3...
}
```

### Frontend (React)
```javascript
// Individual PDFs
const exportToPDF = async (individual = true) => {
  for (let i = 0; i < passengers.length; i++) {
    const canvas = await html2canvas(boardingPassRefs.current[i]);
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, height);
    pdf.save(`BoardingPass-${flight.number}-${passengers[i].lastName}-${passengers[i].seat}.pdf`);
  }
};

// Combined PDF
const exportCombined = async () => {
  const pdf = new jsPDF();
  for (let i = 0; i < passengers.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await html2canvas(boardingPassRefs.current[i]);
    pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, height);
  }
  pdf.save(`BoardingPass-${flight.number}-${pnr}-${passengers.length}pax.pdf`);
};
```

---

## ⚠️ Safety & Ethics Notice

**This boarding pass system is for LEGITIMATE, AUTHORIZED use only:**

✅ **Allowed:**
- Generating boarding passes for your own flight booking platform
- Demo/testing purposes for application development
- Educational projects and tutorials

❌ **Prohibited:**
- Impersonating real airlines or creating fake tickets
- Using generated passes to board actual flights without valid tickets
- Fraudulent activity or identity theft
- Unauthorized access to airport security areas

**Legal Disclaimer:** This tool generates demo boarding passes for software development. Do not use for fraud, impersonation, or any illegal activity. Always purchase valid tickets through authorized channels.

---

## 📞 Support & Customization

### Common Customizations

**1. Change Airline Branding**
```javascript
// In ticketPdf.js or BoardingPassGenerator.jsx
const colors = {
  airlineBlue: '#YOUR_COLOR',    // Primary brand color
  airlineDark: '#YOUR_DARK',     // Header/QR color
  airlineLight: '#YOUR_LIGHT',   // Badge backgrounds
};

const airline = {
  code: 'AA',                    // Your airline code
  name: 'Your Airline Name',
  logo: '/path/to/logo.png'
};
```

**2. Add Real Logo Image**
```javascript
// Backend (PDFKit)
doc.image('path/to/logo.png', 36, 20, { width: 50, height: 50 });

// Frontend (React)
<img src="/assets/airline-logo.png" alt="Logo" className="w-14 h-14" />
```

**3. Custom QR Payload**
```javascript
// Modify generateBoardingPassPayload() to include:
// - Baggage allowance
// - Frequent flyer number
// - Boarding group
// - TSA PreCheck status
```

**4. Email Integration**
```javascript
// In bookings.js confirmation route
const pdfBuffer = await generateTicketPdf(booking);
await sendEmail({
  to: booking.userEmail,
  subject: `Boarding Pass - ${booking.flightNo}`,
  html: '<h2>Your boarding pass is attached</h2>',
  attachments: [{
    filename: `BoardingPass-${booking.flightNo}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]
});
```

---

## 🚀 Quick Start Commands

```bash
# Backend setup
cd backend
npm install pdfkit qrcode
node server.js

# Frontend setup
cd client
npm install qrcode.react html2canvas jspdf
npm run dev

# Test PDF generation
curl -X POST http://localhost:5000/api/bookings/:id/confirm

# View React component
# Navigate to http://localhost:5173/boarding-pass
```

---

## 📊 Technical Specifications

| Feature | Backend (PDFKit) | Frontend (React) |
|---------|------------------|------------------|
| **Output** | PDF Buffer | PDF File Download |
| **DPI** | Vector (scalable) | 300 DPI (raster) |
| **QR Size** | 116×116 px | 140×140 px |
| **Page Size** | A4 (210×297mm) | A4 (210×297mm) |
| **Color Space** | RGB | RGB (JPEG) |
| **File Size** | ~50-150KB | ~200-500KB |
| **Generation Time** | 100-300ms | 1-3s per page |
| **Multi-page** | Native | html2canvas loop |
| **Best For** | Email attachments | User downloads |

---

## 🎯 Next Steps

1. **Test with Real Data**: Replace sample data with actual booking API response
2. **Add Route**: Create `/boarding-pass` route in your React router
3. **Email Integration**: Connect POST `/api/bookings/:id/confirm` to email service
4. **Customize Branding**: Update colors, logo, and airline name
5. **Add Analytics**: Track PDF downloads and email opens
6. **Mobile Optimization**: Test responsive design on mobile devices
7. **Print Testing**: Verify output on physical printers (A4/Letter)

---

**Created by:** FlightHub Development Team  
**Version:** 2.0  
**Last Updated:** November 10, 2025

