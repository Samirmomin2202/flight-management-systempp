import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PlaneTakeoff, PlaneLanding, User, Calendar, CreditCard, MapPin, Clock } from "lucide-react";
import { useSelector } from "react-redux";
import { user } from "./redux/userSlice";
import { accesstoken } from "./redux/tokenSlice";
import Cookies from "js-cookie";

const ViewTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Get user and token from Redux
  const currentUser = useSelector(user);
  const token = useSelector(accesstoken);

  // Add print styles
  useEffect(() => {
    const printStyles = `
      <style>
        @media print {
          body * {
            visibility: hidden;
          }
          .print-ticket, .print-ticket * {
            visibility: visible;
          }
          .print-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-time {
            font-size: 24px !important;
            font-weight: bold !important;
            color: #000 !important;
          }
          .print-location {
            font-size: 20px !important;
            font-weight: bold !important;
            color: #000 !important;
          }
          .print-header {
            background: #1e40af !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-details {
            border: 2px solid #000 !important;
            padding: 20px !important;
            margin: 10px 0 !important;
          }
        }
      </style>
    `;
    
    const existingStyle = document.getElementById('print-styles');
    if (!existingStyle) {
      const styleElement = document.createElement('div');
      styleElement.id = 'print-styles';
      styleElement.innerHTML = printStyles;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      const styleElement = document.getElementById('print-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        console.log(`🎫 Fetching ticket details for booking: ${id}`);
        // First try unauthenticated (our backend allows GET /bookings/:id without auth)
        let res = await axios.get(`http://localhost:5000/api/bookings/${id}`);

        // If unauthorized (older backends), fallback to token if present
        if (res.status === 401) {
          const authToken = token || Cookies.get("token");
          const userEmail = currentUser?.email;
          if (!authToken) throw new Error("Authentication required");
          const config = { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } };
          const url = userEmail ?
            `http://localhost:5000/api/bookings/${id}?userEmail=${encodeURIComponent(userEmail)}` :
            `http://localhost:5000/api/bookings/${id}`;
          res = await axios.get(url, config);
        }

        if (res.data?.success && res.data.booking) {
          setBooking(res.data.booking);
          setPassengers(res.data.booking.passengers || []);
          setError("");
        } else {
          setError("Ticket not found");
          toast.error("Ticket not found");
        }
      } catch (err) {
        console.error("❌ Error fetching ticket from MongoDB:", err);
        const status = err.response?.status;
        if (status === 401) {
          setError("Authentication required");
          toast.error("Please login to view your ticket");
          // Do NOT auto-redirect; let user decide
        } else if (status === 403) {
          setError("Access denied");
          toast.error("Access denied. You can only view your own tickets.");
        } else if (status === 404) {
          setError("Ticket not found");
          toast.error("Ticket not found");
        } else {
          setError(err.response?.data?.message || "Failed to load ticket");
          toast.error("Failed to load ticket details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError("No ticket ID provided");
      setLoading(false);
      return;
    }
    fetchTicketData();
  }, [id, token, currentUser]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <Link to="/bookings" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-xl">Ticket not found</p>
          <Link to="/bookings" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mt-4 inline-block">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✈️ Flight Ticket</h1>
          <p className="text-gray-600">Booking ID: {booking._id}</p>
        </div>

        {/* Main Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 print-ticket">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 print-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 w-full">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold print-location">{booking.from}</div>
                  <div className="text-sm opacity-90">Departure</div>
                  <div className="text-lg font-bold mt-1 print-time">{formatTime(booking.departure)}</div>
                  <div className="text-sm opacity-90">{formatDate(booking.departure)}</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <PlaneTakeoff className="mx-2" />
                  <div className="border-t-2 border-dashed border-white/30 flex-1"></div>
                  <div className="text-center mx-4">
                    <div className="text-sm font-semibold">Flight {booking.flightNo}</div>
                  </div>
                  <div className="border-t-2 border-dashed border-white/30 flex-1"></div>
                  <PlaneLanding className="mx-2" />
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold print-location">{booking.to}</div>
                  <div className="text-sm opacity-90">Arrival</div>
                  <div className="text-lg font-bold mt-1 print-time">{formatTime(booking.arrival)}</div>
                  <div className="text-sm opacity-90">{formatDate(booking.arrival)}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm opacity-90">
                Status: <span className="font-semibold">{booking.status || "Confirmed"}</span>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Departure Info */}
              <div className="bg-gray-50 rounded-xl p-4 print-details">
                <div className="flex items-center mb-3">
                  <PlaneTakeoff className="text-blue-600 mr-2" size={20} />
                  <h3 className="font-semibold text-gray-800">Departure Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="text-gray-500 mr-2" size={16} />
                    <span className="font-medium">{booking.from}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="text-gray-500 mr-2" size={16} />
                    <span>{formatDate(booking.departure)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="text-gray-500 mr-2" size={16} />
                    <span className="font-semibold text-2xl print-time">{formatTime(booking.departure)}</span>
                  </div>
                </div>
              </div>

              {/* Arrival Info */}
              <div className="bg-gray-50 rounded-xl p-4 print-details">
                <div className="flex items-center mb-3">
                  <PlaneLanding className="text-green-600 mr-2" size={20} />
                  <h3 className="font-semibold text-gray-800">Arrival Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="text-gray-500 mr-2" size={16} />
                    <span className="font-medium">{booking.to}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="text-gray-500 mr-2" size={16} />
                    <span>{formatDate(booking.arrival)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="text-gray-500 mr-2" size={16} />
                    <span className="font-semibold text-2xl print-time">{formatTime(booking.arrival)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 print-details">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <User className="text-green-600 mr-2" size={20} />
                    <span className="font-semibold">Passengers</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{passengers.length || booking.passengers}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CreditCard className="text-green-600 mr-2" size={20} />
                    <span className="font-semibold">Total Price</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{formatPrice(booking.price)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="text-green-600 mr-2" size={20} />
                    <span className="font-semibold">Booked On</span>
                  </div>
                  <div className="text-lg font-semibold text-green-700">
                    {booking.bookingDate ? formatDate(booking.bookingDate) : formatDate(booking.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Print-only Time Summary */}
            <div className="hidden print:block bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-center mb-4">⏰ FLIGHT SCHEDULE</h3>
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="border-r-2 border-yellow-400">
                  <h4 className="font-bold text-lg mb-2">DEPARTURE</h4>
                  <div className="text-3xl font-bold print-time">{formatTime(booking.departure)}</div>
                  <div className="text-lg">{formatDate(booking.departure)}</div>
                  <div className="text-lg font-semibold">{booking.from}</div>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">ARRIVAL</h4>
                  <div className="text-3xl font-bold print-time">{formatTime(booking.arrival)}</div>
                  <div className="text-lg">{formatDate(booking.arrival)}</div>
                  <div className="text-lg font-semibold">{booking.to}</div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            {passengers.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <User className="mr-2" size={20} />
                  Passenger Details
                </h3>
                <div className="space-y-4">
                  {passengers.map((passenger, index) => (
                    <div key={passenger._id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Full Name</label>
                          <div className="font-semibold">{passenger.firstName} {passenger.lastName}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <div>{passenger.email || "N/A"}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <div>{passenger.phone || "N/A"}</div>
                        </div>
                      </div>
                      {passenger.gender && (
                        <div className="mt-2">
                          <label className="text-sm font-medium text-gray-500">Gender</label>
                          <div>{passenger.gender}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center no-print">
              <Link
                to="/bookings"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Bookings
              </Link>
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Print Ticket
              </button>
              <Link
                to={`/booked/${booking._id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Manage Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewTicket;