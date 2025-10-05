import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        // Fetch all bookings for admin
        const res = await axios.get("http://localhost:5000/api/admin/bookings");
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
      const res = await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`);
      if (res.data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      } else {
        alert(res.data.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = async (booking) => {
    // Minimal inline edit: change status and price
    const newStatus = prompt("Enter new status (confirmed, cancelled, scheduled, etc)", booking.status || "confirmed");
    if (newStatus === null) return;
    const newPriceStr = prompt("Enter new price", String(booking.price ?? ""));
    if (newPriceStr === null) return;
    const newPrice = Number(newPriceStr);
    if (Number.isNaN(newPrice)) {
      return alert("Invalid price");
    }
    try {
      const res = await axios.put(`http://localhost:5000/api/bookings/${booking._id}`, {
        status: newStatus,
        price: newPrice,
      });
      if (res.data.success) {
        setBookings((prev) => prev.map((b) => (b._id === booking._id ? res.data.booking : b)));
      } else {
        alert(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.response?.data?.message || err.message);
    }
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
                  <td className="px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(b)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
