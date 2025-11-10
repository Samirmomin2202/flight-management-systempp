// Example usage of BoardingPassGenerator component

import React from 'react';
import BoardingPassGenerator from './Components/BoardingPassGenerator';

function App() {
  // Sample booking data (replace with actual data from your booking system)
  const sampleBooking = {
    bookingId: '6912093d4a080ca823c9a33e',
    pnr: 'FH2K9P',
    airline: {
      code: 'FH',
      name: 'FlightHub Airlines',
    },
    flight: {
      number: 'FH109',
      from: 'Mumbai (Chhatrapati Shivaji)',
      to: 'Delhi (Indira Gandhi)',
      fromCode: 'BOM',
      toCode: 'DEL',
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
        sequenceNumber: 1,
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        seat: '12B',
        type: 'Adult',
        sequenceNumber: 2,
      },
    ],
    bookedBy: 'mominsamir2202@gmail.com',
    bookedOn: '2025-11-10T08:30:00.000Z',
    cabinClass: 'Economy',
  };

  return (
    <div className="App">
      <BoardingPassGenerator bookingData={sampleBooking} />
    </div>
  );
}

export default App;

/* ============================================
   INTEGRATION WITH YOUR EXISTING BOOKING FLOW
   ============================================ */

// Example: After booking confirmation, redirect to boarding pass page

// In your Bookings.jsx or booking confirmation component:
/*
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function BookingConfirmation() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);

  // After successful booking API call:
  const handleBookingSuccess = async (bookingResponse) => {
    // Transform API response to boarding pass format
    const boardingPassData = {
      bookingId: bookingResponse._id,
      pnr: bookingResponse._id.slice(-6).toUpperCase(),
      airline: {
        code: 'FH',
        name: 'FlightHub Airlines',
      },
      flight: {
        number: bookingResponse.flightNo,
        from: bookingResponse.from,
        to: bookingResponse.to,
        fromCode: extractAirportCode(bookingResponse.from),
        toCode: extractAirportCode(bookingResponse.to),
      },
      departure: bookingResponse.departure,
      arrival: bookingResponse.arrival,
      boarding: new Date(new Date(bookingResponse.departure).getTime() - 45 * 60000).toISOString(),
      gate: bookingResponse.gate || 'TBA',
      status: bookingResponse.status,
      price: bookingResponse.price,
      currency: 'INR',
      passengers: bookingResponse.passengers.map((p, i) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        seat: p.seat || `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
        type: p.passengerType,
        sequenceNumber: i + 1,
      })),
      bookedBy: bookingResponse.userEmail,
      bookedOn: bookingResponse.bookingDate || new Date().toISOString(),
      cabinClass: bookingResponse.cabinClass || 'Economy',
    };

    setBookingData(boardingPassData);
    
    // Navigate to boarding pass page with data
    navigate('/boarding-pass', { state: { bookingData: boardingPassData } });
  };

  // Helper function to extract airport codes
  const extractAirportCode = (cityString) => {
    const match = cityString.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : cityString.slice(0, 3).toUpperCase();
  };

  return (
    <div>
      <button onClick={() => handleBookingSuccess(bookingResponse)}>
        View Boarding Pass
      </button>
    </div>
  );
}
*/

/* ============================================
   ROUTE CONFIGURATION
   ============================================ */

// In your App.jsx or router configuration:
/*
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardingPassGenerator from './Components/BoardingPassGenerator';
import { useLocation } from 'react-router-dom';

function BoardingPassPage() {
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Booking Data Found
          </h2>
          <p className="text-gray-600 mb-4">
            Please complete a booking to view your boarding pass.
          </p>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return <BoardingPassGenerator bookingData={bookingData} />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Bookings />} />
        <Route path="/boarding-pass" element={<BoardingPassPage />} />
        // ... other routes
      </Routes>
    </BrowserRouter>
  );
}
*/
