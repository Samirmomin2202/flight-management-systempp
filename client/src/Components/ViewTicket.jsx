import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PlaneTakeoff, PlaneLanding, User, Calendar, CreditCard, MapPin, Clock, BadgeCheck, RefreshCw } from "lucide-react";
import { useSelector } from "react-redux";
import { user } from "./redux/userSlice";
import { accesstoken } from "./redux/tokenSlice";
import Cookies from "js-cookie";
// PDF dependencies (make sure to install: npm i html2canvas jspdf)
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const ViewTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [statusInfo, setStatusInfo] = useState(null);
  
  // Get user and token from Redux
  const currentUser = useSelector(user);
  const token = useSelector(accesstoken);

  // Print styles removed per request

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        console.log(`🎫 Fetching ticket details for booking: ${id}`);
        // First try unauthenticated
        let res = await axios.get(`http://localhost:5000/api/bookings/${id}`);
        if (res.status === 401 || res.status === 403) {
          // Fallback to authenticated fetch if server requires it
          const authToken = token || Cookies.get("token");
          const userEmail = currentUser?.email || "";
          if (!authToken) throw new Error("Authentication required");
          const config = { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } };
          const url = userEmail
            ? `http://localhost:5000/api/bookings/${id}?userEmail=${encodeURIComponent(userEmail)}`
            : `http://localhost:5000/api/bookings/${id}`;
          res = await axios.get(url, config);
        }

        if (res.data?.success && res.data.booking) {
          setBooking(res.data.booking);
          setPassengers(res.data.booking.passengers || []);
          setError("");
          // Fetch lightweight payment status details
          try {
            const statusRes = await axios.get(`http://localhost:5000/api/bookings/${id}/status`);
            if (statusRes.data?.success) setStatusInfo(statusRes.data);
          } catch (e) {
            // non-blocking
          }
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

  // Generate a QR code for the booking (encode booking ID)
  useEffect(() => {
    if (!booking?._id) return;
    const payload = `FMS:${booking._id}`;
    QRCode.toDataURL(payload, { width: 160, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR generation error:", err));
  }, [booking]);

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

  const effectiveStatus = (statusInfo?.status || booking?.status || 'pending').toString().toLowerCase();
  const isCancelled = effectiveStatus === 'cancelled' || effectiveStatus === 'canceled';

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

  // Generate a Boarding Pass PDF (one page per passenger)
  const handleDownloadBoardingPass = async () => {
    try {
      if (isCancelled) {
        toast.error("This ticket has been cancelled and cannot be downloaded.");
        return;
      }
      // Find all boarding pass cards in the hidden container
      const cards = document.querySelectorAll(".boarding-pass-card");
      if (!cards || cards.length === 0) {
        toast.error("No boarding pass content available to download");
        return;
      }
      const pdf = new jsPDF("landscape", "pt", "a4");
      let first = true;
      for (const el of cards) {
        // Render at higher scale for crispness
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        // Fit to page while preserving aspect ratio with small margins
        const margin = 24;
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;
        const ratio = Math.min(maxW / imgWidth, maxH / imgHeight);
        const renderW = imgWidth * ratio;
        const renderH = imgHeight * ratio;
        const x = (pageWidth - renderW) / 2;
        const y = (pageHeight - renderH) / 2;
        if (!first) pdf.addPage();
        first = false;
        pdf.addImage(imgData, "PNG", x, y, renderW, renderH);
      }
      const fname = `BoardingPass_${booking._id}.pdf`;
      pdf.save(fname);
      toast.success("Boarding pass downloaded");
    } catch (e) {
      console.error("Boarding pass PDF error:", e);
      toast.error("Failed to generate boarding pass PDF");
    }
  };

  // Generate the same PDF and email via backend
  const handleSendEmail = async () => {
    try {
      if (!booking?._id) return;
      if (isCancelled) {
        toast.error("Cancelled ticket cannot be emailed.");
        return;
      }
      const authToken = token || Cookies.get("token");
      if (!authToken) {
        toast.error("Please login to email your ticket");
        navigate(`/login?redirect=${encodeURIComponent(`/ticket/${booking._id}`)}`);
        return;
      }
      // Render all boarding pass cards into a single PDF
      const cards = document.querySelectorAll(".boarding-pass-card");
      if (!cards || cards.length === 0) {
        toast.error("No boarding pass content available to email");
        return;
      }
      const pdf = new jsPDF("landscape", "pt", "a4");
      let first = true;
      for (const el of cards) {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const margin = 24;
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;
        const ratio = Math.min(maxW / imgWidth, maxH / imgHeight);
        const renderW = imgWidth * ratio;
        const renderH = imgHeight * ratio;
        const x = (pageWidth - renderW) / 2;
        const y = (pageHeight - renderH) / 2;
        if (!first) pdf.addPage();
        first = false;
        pdf.addImage(imgData, "PNG", x, y, renderW, renderH);
      }
      const paxName = (passengers[0] ? `${passengers[0].firstName || ''}${passengers[0].lastName ? ' ' + passengers[0].lastName : ''}` : (booking.userEmail || 'Passenger')).replace(/\s+/g, '');
      const fname = `BoardingPass_${paxName}_${booking.flightNo || 'Flight'}.pdf`;
      const pdfBase64 = pdf.output('datauristring');

      await axios.post(
        `http://localhost:5000/api/bookings/${booking._id}/email`,
        { to: booking.userEmail, filename: fname, pdfBase64 },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast.success("✅ Ticket sent successfully");
    } catch (e) {
      console.error("Email ticket error:", e);
      toast.error(e.response?.data?.message || "Failed to send ticket");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✈️ Flight Ticket</h1>
          <p className="text-gray-600">Booking ID: {booking._id}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${
              (statusInfo?.paymentStatus || booking.paymentStatus) === 'completed'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : (statusInfo?.paymentStatus || booking.paymentStatus) === 'pending'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <BadgeCheck size={16} />
              Payment: {statusInfo?.paymentStatus || booking.paymentStatus || 'pending'}
              {statusInfo?.paymentAmount || booking.paymentAmount ? (
                <span className="ml-2 opacity-80">
                  {(statusInfo?.paymentCurrency || booking.paymentCurrency || 'INR')} {statusInfo?.paymentAmount || booking.paymentAmount}
                </span>
              ) : null}
            </span>
            <button
              onClick={async () => {
                try {
                  const s = await axios.get(`http://localhost:5000/api/bookings/${booking._id}/status`);
                  if (s.data?.success) {
                    setStatusInfo(s.data);
                    toast.success('Status refreshed');
                  }
                } catch (e) {
                  toast.error('Failed to refresh status');
                }
              }}
              className="inline-flex items-center gap-2 bg-white/70 hover:bg-white text-gray-700 px-3 py-1 rounded-full border shadow-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Main Ticket Card */}
  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 w-full">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold">{booking.from}</div>
                  <div className="text-sm opacity-90">Departure</div>
                  <div className="text-lg font-bold mt-1">{formatTime(booking.departure)}</div>
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
                  <div className="text-2xl font-bold">{booking.to}</div>
                  <div className="text-sm opacity-90">Arrival</div>
                  <div className="text-lg font-bold mt-1">{formatTime(booking.arrival)}</div>
                  <div className="text-sm opacity-90">{formatDate(booking.arrival)}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border bg-white/20">
                <span className="opacity-90">Status:</span>
                <span className={`font-semibold uppercase ${
                  effectiveStatus === 'confirmed' ? 'text-emerald-200' :
                  effectiveStatus === 'cancelled' || effectiveStatus === 'canceled' ? 'text-rose-200' :
                  'text-amber-200'
                }`}>
                  {effectiveStatus}
                </span>
              </div>
              {effectiveStatus === 'pending' && (
                <div className="mt-2 text-xs text-amber-100/90">
                  Awaiting admin confirmation. You’ll be able to download your boarding pass once it’s confirmed.
                </div>
              )}
            </div>
          </div>

          {/* Flight Details */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Departure Info */}
              <div className="bg-gray-50 rounded-xl p-4">
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
                    <span className="font-semibold text-2xl">{formatTime(booking.departure)}</span>
                  </div>
                </div>
              </div>

              {/* Arrival Info */}
              <div className="bg-gray-50 rounded-xl p-4">
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
                    <span className="font-semibold text-2xl">{formatTime(booking.arrival)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
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

            {/* Print-only summary removed */}

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
                      <div className="grid md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Seat</label>
                          <div className="font-semibold">{passenger.seat || "—"}</div>
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
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/bookings"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Bookings
              </Link>
              {/* Print Ticket removed */}
              {effectiveStatus === 'confirmed' ? (
                <button
                  onClick={handleDownloadBoardingPass}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Download Boarding Pass
                </button>
              ) : (
                <button
                  aria-disabled
                  title={isCancelled ? "Cancelled tickets cannot be downloaded" : "Boarding pass available after confirmation"}
                  className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  {isCancelled ? 'Download Disabled (Cancelled)' : 'Download Disabled (Pending)'}
                </button>
              )}
             {/* ! <button
                onClick={handleSendEmail}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Send via Email
              </button> */}
              <Link
                to={`/booked/${booking._id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Manage Booking
              </Link>
            </div>
          </div>
        </div>
        {/* Off-screen boarding pass render targets (one per passenger) - Styled like sample */}
  <div id="boarding-pass-render" style={{ position: "absolute", left: "-20000px", top: 0, width: "1400px", background: "#f3f4f6", padding: "24px 0" }}>
          {(passengers.length > 0 ? passengers : [{ firstName: booking.userEmail || "Guest", lastName: "" }]).map((p, i) => {
            const dep = new Date(booking.departure);
            const arr = new Date(booking.arrival);
            const boardingTill = new Date(dep.getTime() - 20 * 60000);
            const fmtShort = (d) => d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase();
            const fmtTime = (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            const seat = p.seat || "—";
            const paxName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || (booking.userEmail || "Guest");
            return (
              <div
                key={p._id || i}
                className="boarding-pass-card"
                style={{
                  width: "1200px",
                  margin: "20px auto",
                  borderRadius: "12px",
                  background: "#fff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Red top header */}
                <div style={{ background: "#ef4444", color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, letterSpacing: "0.06em" }}>FLIGHT HUB</div>
                  <div style={{ fontWeight: 800, letterSpacing: "0.08em" }}>BOARDING PASS</div>
                </div>

                {/* Ticket body split into main and stub with perforation */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", position: "relative" }}>
                  {/* Perforation */}
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "calc(100% - 320px)", width: "0", borderLeft: "2px dashed #e5e7eb" }} />

                  {/* Main ticket (left) */}
                  <div style={{ padding: "18px 20px 12px 20px" }}>
                    {/* Route row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "12px", paddingBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>From</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{booking.from}</div>
                      </div>
                      <div style={{ textAlign: "center", color: "#9ca3af" }}>✈</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>To</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{booking.to}</div>
                      </div>
                    </div>

                    {/* Detail grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f9fafb", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 8, columnGap: 10 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Issued By</div>
                        <div style={{ fontWeight: 700, color: "#111827" }}>fligth hub4</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Flight</div>
                        <div style={{ fontWeight: 700, color: "#111827" }}>{booking.flightNo || "—"}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Gate</div>
                        <div style={{ fontWeight: 700, color: "#111827" }}>{booking.gate || "02"}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Boarding Till</div>
                        <div style={{ fontWeight: 700, color: "#111827" }}>{fmtTime(boardingTill)}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 8, columnGap: 10 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Date</div>
                        <div style={{ fontWeight: 700, color: "#111827" }}>{fmtShort(dep)}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Time</div>
                        <div style={{ fontWeight: 800, color: "#111827" }}>{fmtTime(dep)}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Arrival</div>
                        <div style={{ fontWeight: 800, color: "#111827" }}>{fmtTime(arr)}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Seat</div>
                        <div style={{ fontWeight: 800, color: "#111827" }}>{seat}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Terminal</div>
                        <div style={{ fontWeight: 700, color: "#111827" }}>{booking.terminal || "02"}</div>
                      </div>
                    </div>

                    {/* Footer note */}
                    <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Boarding gate closes 15 minutes prior to departure time
                    </div>
                  </div>

                  {/* Ticket stub (right) */}
                  <div style={{ padding: "18px 18px 12px 18px" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#111827", marginBottom: 6 }}>BOARDING PASS</div>
                    <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 8, columnGap: 10 }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Issued By</div>
                      <div style={{ fontWeight: 700 }}>fligth hub4</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>From</div>
                      <div style={{ fontWeight: 700 }}>{booking.from}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>To</div>
                      <div style={{ fontWeight: 700 }}>{booking.to}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Flight</div>
                      <div style={{ fontWeight: 700 }}>{booking.flightNo || "—"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Date</div>
                      <div style={{ fontWeight: 700 }}>{fmtShort(dep)}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Time</div>
                      <div style={{ fontWeight: 800 }}>{fmtTime(dep)}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Seat</div>
                      <div style={{ fontWeight: 800 }}>{seat}</div>
                    </div>

                    {/* Barcode */}
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Booking ID: {booking._id}</div>
                        <div style={{ width: 110, height: 110, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="Booking QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>QR</div>
                          )}
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewTicket;