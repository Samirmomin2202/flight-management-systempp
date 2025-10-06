import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faUser } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import useFlightStore from "./zustand store/ZStore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { user } from "./redux/userSlice";
import { accesstoken } from "./redux/tokenSlice";

// Create axios instance for bookings
const bookingAPI = axios.create({
  baseURL: "http://localhost:5000/api/bookings"
});

const Bookings = () => {
  const navigate = useNavigate();
  const { allBookings: storeBookings, removeBooking } = useFlightStore();
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  // Reverted: do not compute latest booking id for header button
  const handleViewCurrent = () => {
    const latest = allBookings && allBookings.length > 0 ? allBookings[0]._id : null;
    if (latest) {
      navigate(`/ticket/${latest}`);
    } else {
      toast.info("No current booking found.");
    }
  };
  
  // Get user and token from Redux
  const currentUser = useSelector(user);
  const token = useSelector(accesstoken);

  // Informational auth check (guest allowed)
  useEffect(() => {
    const cookieToken = Cookies.get("token");
    if (!token && !cookieToken) {
      console.log("ℹ️ No auth token present. Showing guest bookings if available.");
    }
  }, [token]);

  // Fetch bookings on mount and when user/token changes
  useEffect(() => {
    fetchBookings();
  }, [currentUser, token]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log("� Starting booking fetch process...");
      console.log("🔍 Current user:", currentUser);
      console.log("🔍 Token from Redux:", token);
      console.log("🔍 Token from Cookie:", Cookies.get("token"));
      
      // Use logged-in user's email if available; otherwise try last used contact email from localStorage.
      let userEmail = currentUser?.email;
      if (!userEmail) {
        try {
          const recent = localStorage.getItem('recentBookingEmail');
          if (recent) userEmail = recent;
        } catch {}
      }
      const authToken = token || Cookies.get("token");
      if (!userEmail) {
        console.log("ℹ️ No email available to query bookings.");
        setAllBookings([]);
        setLoading(false);
        return;
      }
      
      console.log(`🔍 Attempting to fetch bookings for user: ${userEmail}`);
      if (authToken) {
        console.log(`🔑 Using token: ${authToken.substring(0, 20)}...`);
      } else {
        console.log("� No token - proceeding as guest");
      }
      
      // Test basic server connectivity first
      try {
        console.log("🧪 Testing server connection...");
        await axios.get('http://localhost:5000/api/test');
        console.log("✅ Server connection test passed");
      } catch (serverError) {
        console.error("❌ Server connection failed:", serverError.message);
        toast.error("Server is not running. Please start the backend server.");
        setAllBookings([]);
        setLoading(false);
        return;
      }

        console.log(`🔍 Fetching bookings for user: ${userEmail}`);
        
        // Set up authorization header
        const config = authToken ? {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        } : {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        // Add user email as query parameter for fallback
  const url = userEmail ? `/?userEmail=${encodeURIComponent(userEmail)}` : '/';
  const response = await bookingAPI.get(url, config);
        
        if (response.data.success && response.data.bookings) {
          console.log("✅ Fetched bookings from MongoDB:", response.data.bookings);
          console.log(`📊 Total bookings found: ${response.data.count || response.data.bookings.length}`);
          setAllBookings(response.data.bookings);
          setLoading(false);
        } else {
          console.log("⚠️ No bookings found or API returned unsuccessful response");
          setAllBookings([]);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error fetching bookings from MongoDB:", error);
        
        if (error.response?.status === 401) {
          // In public-first mode, treat 401 as non-fatal (older servers may not require auth)
          toast.info("Authentication optional. Try logging in if you expected results.");
        } else if (error.response?.status === 403) {
          toast.error("Access denied. You can only view your own bookings.");
        } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          toast.error("Cannot connect to server. Please ensure the backend is running.");
        } else {
          toast.error("Failed to load your bookings. Please try again.");
        }
        
        console.error("Error details:", {
          status: error.response?.status,
          message: error.message,
          code: error.code
        });
        setAllBookings([]);
        setLoading(false);
      }
    };

  const handleCancel = async (bookingId) => {
    console.log("Attempting to cancel booking with id:", bookingId);
    
    if (!bookingId) {
      toast.error("Invalid booking ID");
      return;
    }
    
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (confirmCancel) {
      try {
        // 🔹 FIRST: Delete from database via API
        console.log("Deleting booking from database:", bookingId);
        const response = await bookingAPI.delete(`/${bookingId}`);
        
        if (response.data.success) {
          console.log("Booking successfully deleted from database");
          
          // THEN: Remove from local state
          setAllBookings(prev => prev.filter(booking => booking._id !== bookingId));
          
          // Remove from store if it exists there
          if (storeBookings) {
            removeBooking(bookingId);
          }
          
          toast.success("Booking cancelled successfully.");
        } else {
          throw new Error(response.data.message || "Failed to delete booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        
        // Check if it's a network error (server not running)
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          toast.error("Cannot connect to server. Removing booking locally only.");
          
          // Still remove from local state as fallback
          setAllBookings(prev => prev.filter(booking => booking._id !== bookingId));
          if (storeBookings) {
            removeBooking(bookingId);
          }
        } else if (error.response?.status === 404) {
          toast.error("Booking not found. It may have been already cancelled.");
          
          // Remove from local state since it doesn't exist in database
          setAllBookings(prev => prev.filter(booking => booking._id !== bookingId));
          if (storeBookings) {
            removeBooking(bookingId);
          }
        } else {
          toast.error("Failed to cancel booking: " + (error.response?.data?.message || error.message));
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-white flex flex-col mt-14 px-2">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg font-semibold">Loading bookings...</div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="h-full bg-white flex flex-col mt-14 px-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold sm:text-xl">
            ALL BOOKINGS ({allBookings ? allBookings.length : 0})
          </h2>
          <button
            type="button"
            onClick={handleViewCurrent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            View Current Booking
          </button>
        </div>

        {!allBookings || allBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-64 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
              
              {/* Debug Information */}
              <div className="bg-yellow-100 border border-yellow-400 rounded p-4 mb-4 text-left">
                <h4 className="font-semibold text-yellow-800 mb-2">🔍 Debug Info:</h4>
                <p className="text-sm text-yellow-700">
                  • Current User: {currentUser?.email || "Not logged in"}<br/>
                  • Token Available: {token ? "Yes" : "No"}<br/>
                  • Cookie Token: {Cookies.get("token") ? "Yes" : "No"}<br/>
                  • Store Bookings: {storeBookings?.length || 0} items<br/>
                  • All Bookings State: {allBookings?.length || 0} items
                </p>
              </div>
              
              <Link 
                to="/flights" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
              >
                Search Flights
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBookings.map((booking, index) => {
              console.log(`Rendering booking ${index + 1} in Bookings:`, booking);
              const dep = booking.departure ? new Date(booking.departure) : null;
              const arr = booking.arrival ? new Date(booking.arrival) : null;
              
              return (
                <div
                  key={booking._id || index}
                  className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">{booking.from}</span>
                        <FontAwesomeIcon icon={faPlane} className="text-white" />
                        <span className="font-bold text-lg">{booking.to}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm opacity-90">
                      Flight: {booking.flightNo || "N/A"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Aircraft Info */}
                      {booking.aircraftName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Aircraft:</span>
                          <span className="font-medium">{booking.aircraftName}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Departure:</span>
                        <span className="font-medium">
                          {dep ? dep.toLocaleDateString() : "N/A"} at{" "}
                          {dep ? dep.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Arrival:</span>
                        <span className="font-medium">
                          {arr ? arr.toLocaleDateString() : "N/A"} at{" "}
                          {arr ? arr.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-green-600">₹{booking.price || 0}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Passengers:</span>
                        <span className="font-medium">{booking.passengers || 1}</span>
                      </div>

                      {/* Flight Status */}
                      {booking.status && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            booking.status === 'boarding' ? 'bg-green-100 text-green-800' :
                            booking.status === 'departed' ? 'bg-purple-100 text-purple-800' :
                            booking.status === 'arrived' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      )}

                      {/* Flight Class */}
                      {booking.type && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Class:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.type === 'economy' ? 'bg-blue-100 text-blue-700' :
                            booking.type === 'business' ? 'bg-orange-100 text-orange-700' :
                            booking.type === 'firstclass' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.type === 'firstclass' ? 'First Class' : 
                             booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}
                          </span>
                        </div>
                      )}

                      {/* Available Seats (for admin view) */}
                      {booking.availableSeats !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available Seats:</span>
                          <span className={`font-medium ${
                            booking.availableSeats > 10 ? 'text-green-600' : 
                            booking.availableSeats > 0 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {booking.availableSeats}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Link
                         to={`/ticket/${booking._id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center text-sm transition-colors"
                      >
                        View Ticket
                      </Link>
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Bookings;