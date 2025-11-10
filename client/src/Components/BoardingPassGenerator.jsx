/**
 * Professional Boarding Pass Generator Component
 * 
 * Features:
 * - Realistic airline boarding pass design
 * - Multi-passenger support with individual QR codes
 * - Print-ready PDF export (high DPI)
 * - Individual or combined PDF download
 * - IATA-style QR code payload
 * - Responsive design with Tailwind CSS
 * 
 * Dependencies:
 * - qrcode.react: QR code generation
 * - html2canvas: HTML to canvas conversion
 * - jspdf: PDF generation
 * 
 * @author FlightHub Development Team
 */

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * JSON Schema for Boarding Pass Data:
 * {
 *   bookingId: string,
 *   pnr: string,
 *   airline: { code: string, name: string, logo?: string },
 *   flight: { number: string, from: string, to: string, fromCode: string, toCode: string },
 *   departure: string (ISO date),
 *   arrival: string (ISO date),
 *   boarding: string (ISO date),
 *   gate: string,
 *   status: 'confirmed' | 'pending' | 'cancelled',
 *   price: number,
 *   currency: string,
 *   passengers: Array<{
 *     firstName: string,
 *     lastName: string,
 *     seat: string,
 *     type: 'Adult' | 'Child' | 'Infant',
 *     sequenceNumber: number
 *   }>,
 *   bookedBy: string (email),
 *   bookedOn: string (ISO date),
 *   cabinClass: 'Economy' | 'Premium Economy' | 'Business' | 'First'
 * }
 */

const BoardingPassGenerator = ({ bookingData }) => {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const boardingPassRefs = useRef([]);

  // Default data structure if not provided
  const defaultData = {
    bookingId: 'FH123456789',
    pnr: 'ABC123',
    airline: {
      code: 'FH',
      name: 'FlightHub Airlines',
    },
    flight: {
      number: 'FH501',
      from: 'Mumbai',
      to: 'Delhi',
      fromCode: 'BOM',
      toCode: 'DEL',
    },
    departure: new Date(Date.now() + 86400000).toISOString(),
    arrival: new Date(Date.now() + 90000000).toISOString(),
    boarding: new Date(Date.now() + 83700000).toISOString(),
    gate: 'A12',
    status: 'confirmed',
    price: 5500,
    currency: 'INR',
    passengers: [
      {
        firstName: 'John',
        lastName: 'Doe',
        seat: '12A',
        type: 'Adult',
        sequenceNumber: 1,
      },
    ],
    bookedBy: 'customer@example.com',
    bookedOn: new Date().toISOString(),
    cabinClass: 'Economy',
  };

  const data = bookingData || defaultData;

  // Format dates
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoDate) => {
    return new Date(isoDate).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateTime = (isoDate) => {
    return `${formatDate(isoDate)}, ${formatTime(isoDate)}`;
  };

  const formatPrice = (price, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate IATA-style QR payload (M1 barcode format)
  const generateQRPayload = (passenger) => {
    const formatName = (first = '', last = '') => {
      const f = first.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 10);
      const l = last.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 15);
      return `${l}/${f}`.padEnd(20, ' ');
    };

    const pnr = data.pnr.toUpperCase().padEnd(7, ' ');
    const from = data.flight.fromCode.toUpperCase().padEnd(3, 'X');
    const to = data.flight.toCode.toUpperCase().padEnd(3, 'X');
    const airline = data.airline.code.padEnd(3, 'X').slice(0, 3);
    const flight = data.flight.number.padStart(4, '0').slice(0, 4);

    // Day of year (001-366)
    const depDate = new Date(data.departure);
    const dayOfYear = Math.floor(
      (depDate - new Date(depDate.getFullYear(), 0, 0)) / 86400000
    );
    const day = String(dayOfYear).padStart(3, '0');

    const seat = passenger.seat.padStart(4, '0');
    const seq = String(passenger.sequenceNumber).padStart(4, '0');
    const status = data.status === 'confirmed' ? '0' : '1';

    const name = formatName(passenger.firstName, passenger.lastName);

    return `M1${name}${pnr} ${from}${to}${airline}${flight}${day}${seat}${seq}${status}`;
  };

  // Status colors
  const getStatusColor = () => {
    switch (data.status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Export to PDF (high quality)
  const exportToPDF = async (individual = false) => {
    setExporting(true);
    setExportProgress('Preparing export...');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      let addedPages = 0;

      for (let i = 0; i < boardingPassRefs.current.length; i++) {
        const element = boardingPassRefs.current[i];
        if (!element) continue;

        setExportProgress(`Rendering boarding pass ${i + 1}/${data.passengers.length}...`);

        // High-quality canvas rendering
        const canvas = await html2canvas(element, {
          scale: 3, // High DPI for print quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (individual) {
          // Individual PDFs for each passenger
          const singlePDF = new jsPDF({
            orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
            unit: 'mm',
            format: 'a4',
          });
          singlePDF.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          singlePDF.save(
            `BoardingPass-${data.flight.number}-${data.passengers[i].lastName}-${data.passengers[i].seat}.pdf`
          );
        } else {
          // Combined PDF
          if (addedPages > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          addedPages++;
        }

        // Small delay between renders
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!individual) {
        setExportProgress('Generating PDF file...');
        pdf.save(
          `BoardingPass-${data.flight.number}-${data.pnr}-${data.passengers.length}pax.pdf`
        );
      }

      setExportProgress('Export complete!');
      setTimeout(() => {
        setExporting(false);
        setExportProgress('');
      }, 2000);
    } catch (error) {
      console.error('PDF Export Error:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => {
        setExporting(false);
        setExportProgress('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Boarding Pass Generator
          </h1>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => exportToPDF(false)}
              disabled={exporting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {exporting ? 'Exporting...' : 'Download Combined PDF'}
            </button>
            {data.passengers.length > 1 && (
              <button
                onClick={() => exportToPDF(true)}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Download Individual PDFs
              </button>
            )}
          </div>
          {exportProgress && (
            <p className="mt-4 text-sm text-gray-600">{exportProgress}</p>
          )}
        </div>

        {/* Boarding Passes */}
        {data.passengers.map((passenger, index) => (
          <div
            key={index}
            ref={(el) => (boardingPassRefs.current[index] = el)}
            className="mb-8 bg-white"
          >
            {/* Airline Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-900">
                      {data.airline.code}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {data.airline.name}
                    </h2>
                    <p className="text-blue-200 text-sm">Electronic Boarding Pass</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs mb-1">Booking Reference</p>
                  <p className="text-white font-bold text-lg">{data.pnr}</p>
                </div>
              </div>
            </div>

            {/* Flight Summary Card */}
            <div className="border-2 border-gray-200 px-8 py-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Route Info */}
                <div className="col-span-2">
                  <div className="mb-6">
                    <p className="text-xs text-gray-600 mb-1">FROM</p>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {data.flight.from}
                    </p>
                    <p className="text-4xl font-bold text-blue-700">
                      {data.flight.fromCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-2xl text-gray-400">→</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">TO</p>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {data.flight.to}
                    </p>
                    <p className="text-4xl font-bold text-blue-700">
                      {data.flight.toCode}
                    </p>
                  </div>

                  {/* Times */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">DEPARTURE</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateTime(data.departure)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">ARRIVAL</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateTime(data.arrival)}
                      </p>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        FLIGHT
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {data.flight.number}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        BOOKING
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {data.bookingId.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        PASSENGERS
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {data.passengers.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price & Status */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-700 font-semibold mb-2">
                      TOTAL FARE
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(data.price, data.currency)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {data.passengers.length} passenger(s)
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-2">STATUS</p>
                    <div
                      className={`${getStatusColor()} text-white font-bold text-center py-2 px-4 rounded-full`}
                    >
                      {data.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 mt-4">
                    <p className="font-semibold">Booked by:</p>
                    <p className="break-all">{data.bookedBy}</p>
                    <p className="font-semibold mt-2">Issued:</p>
                    <p>{formatDateTime(data.bookedOn)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boarding Pass Stub */}
            <div className="border-2 border-t-0 border-blue-700 rounded-b-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-white">
                {/* Left: Passenger Details */}
                <div className="col-span-2 p-6 border-r-2 border-dashed border-gray-300">
                  <div className="mb-4">
                    <p className="text-xs text-blue-700 font-semibold mb-1">
                      PASSENGER
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {passenger.firstName} {passenger.lastName}
                    </p>
                  </div>

                  <div className="flex gap-8 mb-6">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        FROM
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {data.flight.fromCode}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl text-gray-400">→</span>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">TO</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {data.flight.toCode}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        FLIGHT
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {data.flight.number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        DATE
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(data.departure)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        BOARDING
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatTime(data.boarding)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        SEAT
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {passenger.seat}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        GATE
                      </p>
                      <p className="text-lg font-bold text-gray-900">{data.gate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold mb-1">PNR</p>
                      <p className="text-lg font-bold text-gray-900">{data.pnr}</p>
                    </div>
                  </div>
                </div>

                {/* Right: QR Code */}
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white">
                  <QRCodeSVG
                    value={generateQRPayload(passenger)}
                    size={140}
                    level="M"
                    includeMargin={true}
                    fgColor="#002366"
                  />
                  <p className="text-xs text-blue-700 font-bold mt-3">
                    SCAN TO BOARD
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Important: Present a valid government-issued photo ID at security.
                  Boarding gates close 20 minutes before departure.
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Legal Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pb-8">
          <p>FlightHub Airlines • Customer Support: support@flighthub.com</p>
          <p className="mt-2">
            This is a demo boarding pass for legitimate testing purposes only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoardingPassGenerator;
