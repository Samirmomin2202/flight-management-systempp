import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { user } from "./redux/userSlice";
import { accesstoken } from "./redux/tokenSlice";
import Cookies from "js-cookie";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PlaneTakeoff, PlaneLanding, Eye } from "lucide-react";

const Booked = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = useSelector(user);
  const token = useSelector(accesstoken);

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);

  // Fetch booking and passengers
  useEffect(() => {
    let canceled = false;
    const fetchData = async () => {
      try {
        // Public-first fetch
        let resBooking = await axios.get(`http://localhost:5000/api/bookings/${id}`);
        if (resBooking.status === 401 || resBooking.status === 403) {
          const authToken = token || Cookies.get("token");
          const userEmail = currentUser?.email || "";
          if (!authToken) throw new Error("Authentication required");
          const config = { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } };
          const url = userEmail
            ? `http://localhost:5000/api/bookings/${id}?userEmail=${encodeURIComponent(userEmail)}`
            : `http://localhost:5000/api/bookings/${id}`;
          resBooking = await axios.get(url, config);
        }
        if (resBooking?.data?.success && resBooking.data.booking) {
          if (!canceled) {
            setBooking(resBooking.data.booking);
            // If API already returned passengers with booking, use them immediately
            if (Array.isArray(resBooking.data.booking.passengers)) {
              setPassengers(resBooking.data.booking.passengers);
            }
          }
        }

        const resPassengers = await axios.get(
          `http://localhost:5000/api/passengers/booking/${id}`
        );
        if (resPassengers?.data?.success) {
          if (!canceled) setPassengers(resPassengers.data.passengers);
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) {
          setError("Authentication required");
        } else if (status === 403) {
          setError("Access denied. You can only view your own ticket.");
        } else if (status === 404) {
          setError("Ticket not found");
        } else {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    fetchData();
    return () => (canceled = true);
  }, [id]);

  const dep = booking?.departure
    ? new Date(booking.departure).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
  const arr = booking?.arrival
    ? new Date(booking.arrival).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this ticket?")) return;

    try {
      const authToken = token || Cookies.get("token");
      if (!authToken) {
        toast.error("Please log in to cancel your booking.", { theme: "colored" });
        return;
      }
      const res = await axios.delete(
        `http://localhost:5000/api/bookings/${id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        toast.success("✅ Ticket canceled successfully!", {
          position: "top-right",
          autoClose: 2500,
          theme: "colored",
          transition: Slide,
        });
        setBooking(null);
        setPassengers([]);
        setTimeout(() => navigate("/"), 1500);
      } else {
        toast.error("❌ Failed to cancel ticket!", {
          theme: "colored",
        });
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      toast.error("⚠️ Error canceling ticket!", { theme: "colored" });
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading booking details…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!booking)
    return (
      <div className="p-6 text-gray-700 text-center">
        Booking not found or already canceled.
        <div className="mt-4">
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-2 rounded-xl shadow"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-10">
      <div className="max-w-6xl mx-auto p-6">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-indigo-200 via-sky-200 to-cyan-200 text-indigo-900 px-6 py-5 rounded-3xl shadow mb-6 text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Eye className="inline-block text-indigo-600" /> You have  Successfully Booked ticket
          </h2>
          <p className="text-sm mt-1 font-mono">Booking ID: {booking._id}</p>
          <div className="mt-3">
            <div className="inline-block bg-white/80 px-3 py-1 rounded-full border">
              Payment: <span className="font-semibold">{booking.paymentStatus || "pending"}</span>
              {booking.paymentAmount ? (
                <span className="ml-2 text-sm text-gray-600">{booking.paymentCurrency || "INR"} {booking.paymentAmount}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="backdrop-blur-md bg-white/95 rounded-3xl shadow-xl border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6 text-indigo-700 text-center tracking-wide">
            ✈️ Flight Details
          </h3>
          {/* FROM above departure / TO above arrival */}
          <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-around mb-6">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">From</span>
              <div className="flex items-center gap-2 text-gray-700 text-lg font-semibold">
                <PlaneTakeoff className="text-indigo-600 w-5 h-5" /> {booking.from}
              </div>
              <span className="text-xs text-gray-400">{dep}</span>
            </div>
            <div className="hidden sm:block text-gray-400 text-sm font-mono">——————✈︎——————</div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">To</span>
              <div className="flex items-center gap-2 text-gray-700 text-lg font-semibold">
                <PlaneLanding className="text-indigo-600 w-5 h-5" /> {booking.to}
              </div>
              <span className="text-xs text-gray-400">{arr}</span>
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 font-medium">Flight No</p>
              <p className="font-semibold text-gray-700">{booking.flightNo}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 font-medium">Departure</p>
              <p className="font-semibold text-gray-700">{dep || "N/A"}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 font-medium">Arrival</p>
              <p className="font-semibold text-gray-700">{arr || "N/A"}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 font-medium">Price</p>
              <p className="font-semibold text-gray-700">{formatPrice(booking.price)}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 shadow-sm md:col-span-2">
              <p className="text-gray-500 font-medium">Booked By</p>
              <p className="font-semibold text-gray-700 break-all">{booking.userEmail || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Passenger Details */}
        <div className="backdrop-blur-md bg-white/95 rounded-3xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-xl font-semibold mb-4 text-indigo-700 text-center tracking-wide">
            🧑‍✈️ Passenger Details ({passengers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-cyan-50 border-b">
                  <th className="p-3 text-left font-medium text-gray-600">Name</th>
                  <th className="p-3 text-left font-medium text-gray-600">Email</th>
                  <th className="p-3 text-left font-medium text-gray-600">Phone</th>
                  <th className="p-3 text-left font-medium text-gray-600">Seat</th>
                  <th className="p-3 text-left font-medium text-gray-600">Type</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-indigo-50 transition">
                    <td className="p-3">{p.firstName} {p.lastName}</td>
                    <td className="p-3">{p.email}</td>
                    <td className="p-3">{p.phone}</td>
                    <td className="p-3 font-semibold">{p.seat || "-"}</td>
                    <td className="p-3">{p.passengerType}</td>
                  </tr>
                ))}
                {passengers.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={5}>No passenger data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8 flex-wrap">
          <button
            onClick={handleCancel}
            className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 px-6 py-2 rounded-xl shadow transition font-medium"
          >
            Cancel Ticket
          </button>
          {(!booking.paymentStatus || booking.paymentStatus === "pending") && (
            <button
              onClick={() => toast.info("Please complete payment during booking via Razorpay.")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-xl shadow transition font-medium"
            >
              Pay Now
            </button>
          )}
          <Link
            to={`/ticket/${booking._id}`}  // Use the new enhanced ticket view
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-6 py-2 rounded-xl shadow transition font-medium flex items-center gap-2"
          >
            <Eye /> View Enhanced Ticket
          </Link>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Slide}
      />
    </div>
  );
};

export default Booked;
