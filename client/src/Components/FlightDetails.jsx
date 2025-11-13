import React, { useEffect, useState } from "react";
import { listAirlines } from "../api/airlinesApi";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AirlineStrip from "./AirlineStrip";

const FlightDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [airlines, setAirlines] = useState([]);

  const [passengerInfo, setPassengerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    dob: "",
    gender: "",
    passengerType: "",
  });

  const [formError, setFormError] = useState({});
  const [logoSrc, setLogoSrc] = useState(null);

  // load booking info
  useEffect(() => {
    let canceled = false;
    if (!id) {
      setError("No booking id provided");
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/bookings/${id}`);
        if (res?.data?.success && res.data.booking) {
          if (!canceled) setBooking(res.data.booking);
        } else {
          setError(res.data.message || "Booking not found");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    fetchBooking();
    // Fetch airlines for logo mapping
    (async () => {
      try {
        const data = await listAirlines();
        if (!canceled) setAirlines(data);
      } catch {}
    })();
    return () => {
      canceled = true;
    };
  }, [id]);

  // Derive logoSrc when booking or airlines change
  useEffect(() => {
    if (!booking) return;
    const airlineName = booking.airline || booking.flightNo || "Airline";
    const slug = airlineName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const publicLogo = slug ? `/airlines/${slug}.png` : null;
    const airlineLogoMap = airlines.reduce((acc,a)=>{ if(a?.name) acc[a.name.toLowerCase()] = a.tailLogoUrl || a.logoUrl; return acc; }, {});
    const dbLogo = airlineLogoMap[airlineName.toLowerCase()] || null;
    setLogoSrc(publicLogo || dbLogo);
  }, [booking, airlines]);

  const dep = booking?.departure ? new Date(booking.departure) : null;
  const arr = booking?.arrival ? new Date(booking.arrival) : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPassengerInfo((prev) => ({ ...prev, [name]: value }));
    setFormError((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!passengerInfo.firstName) errors.firstName = "First name is required";
    if (!passengerInfo.lastName) errors.lastName = "Last name is required";
    if (!passengerInfo.email) errors.email = "Email is required";
    if (!passengerInfo.phone) errors.phone = "Phone is required";
    if (!passengerInfo.country) errors.country = "Country is required";
    if (!passengerInfo.state) errors.state = "State is required";
    if (!passengerInfo.city) errors.city = "City is required";
    if (!passengerInfo.pincode) errors.pincode = "Pincode is required";
    if (!passengerInfo.dob) errors.dob = "Date of birth is required";
    if (!passengerInfo.gender) errors.gender = "Gender is required";
    if (!passengerInfo.passengerType)
      errors.passengerType = "Select Adult or Child";
    return errors;
  };

  // submit passenger
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/passengers", {
        bookingId: booking._id,
        ...passengerInfo,
      });

      if (res.data.success) {
        toast.success("Passenger details saved successfully!");
        // Redirect to booked page after a short delay
        setTimeout(() => {
          navigate(`/booked/${booking._id}`);
        }, 1500);
      } else {
        toast.error("Failed to save passenger details");
      }
    } catch (err) {
      console.error("Error saving passenger:", err);
      toast.error("Error saving passenger details");
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading flight details…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!booking) return <div className="p-6 text-gray-700">Booking not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-blue-800">
          ✈️ Flight Booking
        </h2>

        {/* Airline header with logo */}
        <div className="mb-8 flex items-center gap-4 bg-white/70 backdrop-blur border border-blue-100 rounded-xl p-4 shadow">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden relative">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={booking.airline || booking.flightNo || 'Airline'}
                className="w-full h-full object-contain p-2"
                onError={(e)=>{
                  const airlineName = booking.airline || booking.flightNo || "";
                  const slug = airlineName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  const publicLogo = slug ? `/airlines/${slug}.png` : null;
                  const airlineLogoMap = airlines.reduce((acc,a)=>{ if(a?.name) acc[a.name.toLowerCase()] = a.tailLogoUrl || a.logoUrl; return acc; }, {});
                  const dbLogo = airlineLogoMap[airlineName.toLowerCase()] || null;
                  if (logoSrc === publicLogo && dbLogo) setLogoSrc(dbLogo); else setLogoSrc(null);
                }}
              />
            ) : (
              // Generated fallback "logo" (initials + gradient) so no image is required
              <GeneratedLogo name={booking.airline || booking.flightNo || 'Air'} />
            )}
          </div>
          <div>
            <div className="text-lg font-bold text-blue-800">{booking.airline || 'Flight'}</div>
            {booking.flightNo && <div className="text-sm text-gray-600 font-medium">Flight No: {booking.flightNo}</div>}
            {booking.cabinClass && <div className="text-xs mt-1 inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{booking.cabinClass}</div>}
          </div>
        </div>

        <AirlineStrip airlines={airlines} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flight info */}
          <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-700 text-center">
              Flight Details
            </h3>
            <table className="min-w-full border-collapse table-auto text-sm">
              <tbody>
                {[
                  ["Flight No", booking.flightNo],
                  ["From", booking.from],
                  ["To", booking.to],
                  ["Departure", dep ? dep.toLocaleString() : "N/A"],
                  ["Arrival", arr ? arr.toLocaleString() : "N/A"],
                  ["Price", `₹${booking.price}`],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b">
                    <td className="px-4 py-3 font-semibold text-gray-700">{label}</td>
                    <td className="px-4 py-3 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Passenger form */}
          <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-700 text-center">
              Passenger Details
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="First Name" name="firstName" value={passengerInfo.firstName} onChange={handleChange} error={formError.firstName} />
                <InputField label="Last Name" name="lastName" value={passengerInfo.lastName} onChange={handleChange} error={formError.lastName} />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Email" type="email" name="email" value={passengerInfo.email} onChange={handleChange} error={formError.email} />
                <InputField label="Mobile Number" name="phone" value={passengerInfo.phone} onChange={handleChange} error={formError.phone} />
              </div>

              {/* Country & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Country" name="country" value={passengerInfo.country} onChange={handleChange} error={formError.country} />
                <InputField label="State" name="state" value={passengerInfo.state} onChange={handleChange} error={formError.state} />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="City" name="city" value={passengerInfo.city} onChange={handleChange} error={formError.city} />
                <InputField label="Pincode" name="pincode" value={passengerInfo.pincode} onChange={handleChange} error={formError.pincode} />
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Date of Birth" type="date" name="dob" value={passengerInfo.dob} onChange={handleChange} error={formError.dob} />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    name="gender"
                    value={passengerInfo.gender}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border p-2 focus:ring-blue-400 focus:border-blue-400 ${
                      formError.gender ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formError.gender && <p className="text-xs text-red-600">{formError.gender}</p>}
                </div>
              </div>

              {/* Adult / Child */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Passenger Type</label>
                <select
                  name="passengerType"
                  value={passengerInfo.passengerType}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border p-2 focus:ring-blue-400 focus:border-blue-400 ${
                    formError.passengerType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Adult </option>
                  <option value="Adult">Adult</option>
                  
                </select>
                {formError.passengerType && <p className="text-xs text-red-600">{formError.passengerType}</p>}
              </div>

              <div className="flex justify-center gap-4">
                <Link to="/" className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded shadow transition text-center">
                  ← Back to Home
                </Link>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow transition">
                  Book Flight →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

const InputField = ({ label, name, value, onChange, error, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`mt-1 block w-full rounded-md border p-2 focus:ring-blue-400 focus:border-blue-400 ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Generated placeholder logo (no image needed)
const GeneratedLogo = ({ name }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
  // Simple hash to pick a color pair
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const palette = [
    ["#1e3a8a", "#2563eb"],
    ["#7c2d12", "#ea580c"],
    ["#064e3b", "#10b981"],
    ["#581c87", "#7e22ce"],
    ["#0f172a", "#334155"],
    ["#78350f", "#d97706"],
  ];
  const colors = palette[Math.abs(hash) % palette.length];
  const style = {
    background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
  };
  return (
    <div
      className="w-full h-full flex items-center justify-center text-white font-bold text-xl select-none"
      style={style}
      title={name}
    >
      {initials || "AL"}
    </div>
  );
};

export default FlightDetails;
