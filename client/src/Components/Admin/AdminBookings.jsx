import React, { useEffect, useState } from "react";
import adminHttp from "../../api/adminHttp";
import AdminSidebar from "./AdminSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusChanges, setStatusChanges] = useState({}); // bookingId -> status
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        // Fetch all bookings for admin
        const res = await adminHttp.get("/admin/bookings");
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      } catch (err) {
        console.error("Admin bookings error:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllBookings();
  }, []);

  const handleDelete = async (bookingId) => {
    if (!window.confirm("Delete this booking? This will also delete its passengers.")) return;
    try {
      const res = await adminHttp.delete(`/bookings/${bookingId}`);
      if (res.data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== bookingId));
        toast.success("Booking deleted successfully");
      } else {
        toast.error(res.data.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleStatusChange = (booking, value) => {
    setStatusChanges((prev) => ({ ...prev, [booking._id]: value }));
    // Auto-save on change
    handleSaveStatus(booking, value);
  };

  const handleSaveStatus = async (booking, selectedOverride) => {
    const selected = (selectedOverride || statusChanges[booking._id] || booking.status || "pending").toLowerCase();
    if (!["pending", "confirmed", "cancelled"].includes(selected)) {
      toast.error("Invalid status. Allowed: pending, confirmed or cancelled");
      return;
    }
    // If no change, no-op
    if ((booking.status || "pending").toLowerCase() === selected) return;
    try {
      setSavingId(booking._id);
      const res = await adminHttp.put(
        `/bookings/${booking._id}`,
        { status: selected }
      );
      if (res.data.success) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b._id !== booking._id) return b;
            const updated = res.data.booking || {};
            // Merge to preserve passengers list if API doesn't include it
            return {
              ...b,
              ...updated,
              passengers: updated.passengers ?? b.passengers,
            };
          })
        );
        setStatusChanges((prev) => {
          const next = { ...prev };
          delete next[booking._id];
          return next;
        });
        
        // Show appropriate message based on status with email notification
        if (selected === "confirmed") {
          // Check if email was actually sent (backend logs will show this)
          toast.success(`✅ Booking confirmed! Confirmation email with PDF ticket will be sent to ${booking.userEmail || "customer"}.`, {
            autoClose: 5000,
          });
          console.log("📧 Check backend console for email sending status. If emails are not being sent, configure EMAIL_PROVIDER in backend/.env");
        } else if (selected === "cancelled") {
          toast.success(`❌ Booking cancelled! Cancellation email will be sent to ${booking.userEmail || "customer"}.`, {
            autoClose: 5000,
          });
          console.log("📧 Check backend console for email sending status. If emails are not being sent, configure EMAIL_PROVIDER in backend/.env");
        } else {
          toast.success(`Status set to ${selected}`);
        }
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.response?.data?.message || err.message);
      // reset pending change
      setStatusChanges((prev) => {
        const next = { ...prev };
        delete next[booking._id];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleRefund = async (bookingId) => {
  if (!window.confirm("Refund this booking?")) return;
    toast.info("Refunds are handled offline for Razorpay in this build.");
  };

  if (loading) return <div className="p-6">Loading bookings…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 bg-gray-100 p-6 md:p-10">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          Booking Management
        </h1>

        <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
          <table className="w-full table-auto text-left border-collapse">
            <thead className="bg-blue-100 text-blue-900">
              <tr>
                <th className="px-4 py-2">Booking ID</th>
                <th className="px-4 py-2">User Email</th>
                <th className="px-4 py-2">Flight</th>
                <th className="px-4 py-2">From → To</th>
                <th className="px-4 py-2">Departure</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Passengers</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {bookings.map((b) => (
                <tr key={b._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{b._id}</td>
                  <td className="px-4 py-2">{b.userEmail || "No email"}</td>
                  <td className="px-4 py-2">{b.flightNo}</td>
                  <td className="px-4 py-2">
                    {b.from} → {b.to}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(b.departure).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2">₹{b.price}</td>
                  <td className="px-4 py-2">
                    <div className="text-sm">{b.paymentStatus || "pending"}</div>
                    {b.paymentAmount ? (
                      <div className="text-xs text-gray-600">{b.paymentCurrency || "INR"} {b.paymentAmount}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={(statusChanges[b._id] ?? (b.status || "pending")).toLowerCase()}
                      onChange={(e) => handleStatusChange(b, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    {b.passengers && b.passengers.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {b.passengers.map((p) => (
                          <li key={p._id}>
                            {p.firstName} {p.lastName}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        No passengers
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        onClick={() => handleSaveStatus(b)}
                        disabled={savingId === b._id || ((statusChanges[b._id] ?? (b.status || "pending")).toLowerCase() === (b.status || "pending").toLowerCase())}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${savingId === b._id ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
                      >
                        {savingId === b._id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        Delete
                      </button>
                      {b.paymentStatus === "completed" && (
                        <button
                          onClick={() => handleRefund(b._id)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminBookings;
