import React, { useEffect, useState } from "react";
import adminHttp from "../../api/adminHttp";
import { PlaneTakeoff, PlaneLanding } from "lucide-react"; // Flight icons
import AdminSidebar from "./AdminSidebar";

const AdminFlights = () => {
  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState({
    flightNo: "",
    airline: "",
    from: "",
    to: "",
    departure: "",
    arrival: "",
    price: "",
    seatCapacity: "",
    cabinClass: "Economy",
  });
  const [editId, setEditId] = useState(null);

  // Fetch all flights
  const fetchFlights = async () => {
    try {
      const res = await adminHttp.get("/flights");
      if (res.data.success) setFlights(res.data.flights);
    } catch (err) {
      console.error("Error fetching flights:", err);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Add or Update flight
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.flightNo ||
      !form.airline ||
      !form.from ||
      !form.to ||
      !form.departure ||
      !form.arrival ||
      !form.price ||
      !form.seatCapacity ||
      !form.cabinClass
    ) {
      alert("Please fill all fields");
      return;
    }

    const depDate = new Date(form.departure);
    const arrDate = new Date(form.arrival);
    if (arrDate <= depDate) {
      alert("Arrival must be after departure!");
      return;
    }

    const capacityNum = Number(form.seatCapacity);
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      alert("Seat capacity must be a positive number");
      return;
    }

    const payload = {
      flightNo: form.flightNo.trim(),
      airline: form.airline.trim(),
      from: form.from.trim(),
      to: form.to.trim(),
      departure: depDate.toISOString(),
      arrival: arrDate.toISOString(),
      price: Number(form.price),
      seatCapacity: capacityNum,
      cabinClass: form.cabinClass,
    };

    try {
      let res;
      if (editId) {
        res = await adminHttp.put(`/flights/${editId}`, payload);
      } else {
        res = await adminHttp.post("/flights", payload);
      }
      if (res.data.success) {
        alert(res.data.message);
        setForm({
          flightNo: "",
          airline: "",
          from: "",
          to: "",
          departure: "",
          arrival: "",
          price: "",
          seatCapacity: "",
          cabinClass: "Economy",
        });
        setEditId(null);
        fetchFlights();
      }
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Operation failed!");
    }
  };

  // Delete flight
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this flight?")) return;
    try {
      await adminHttp.delete(`/flights/${id}`);
      fetchFlights();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // Edit flight
  const handleEdit = (flight) => {
    setForm({
      flightNo: flight.flightNo,
      airline: flight.airline || "",
      from: flight.from,
      to: flight.to,
      departure: new Date(flight.departure).toISOString().slice(0, 16),
      arrival: new Date(flight.arrival).toISOString().slice(0, 16),
      price: flight.price,
      seatCapacity: flight.seatCapacity ?? "",
      cabinClass: flight.cabinClass || "Economy",
    });
    setEditId(flight._id);
  };

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6 md:p-10 bg-gradient-to-br from-blue-50 to-blue-100">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-900">
          <PlaneTakeoff className="text-blue-700" /> Admin Flights
        </h2>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-3 bg-white shadow-md p-4 rounded-xl"
        >
          {[
            { key: "flightNo", type: "text", label: "Flight No" },
            { key: "airline", type: "text", label: "Airline" },
            { key: "from", type: "text", label: "From" },
            { key: "to", type: "text", label: "To" },
            { key: "departure", type: "datetime-local", label: "Departure" },
            { key: "arrival", type: "datetime-local", label: "Arrival" },
            { key: "price", type: "number", label: "Price" },
            { key: "seatCapacity", type: "number", label: "Seats" },
          ].map((f) => (
            <input
              key={f.key}
              name={f.key}
              type={f.type}
              value={form[f.key]}
              onChange={handleChange}
              placeholder={f.label}
              className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          ))}
          <select
            name="cabinClass"
            value={form.cabinClass}
            onChange={handleChange}
            className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option>Economy</option>
            <option>Premium Economy</option>
            <option>Business</option>
            <option>First</option>
          </select>
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 transition text-white p-2 rounded-lg col-span-1 md:col-span-3 lg:col-span-8 font-semibold shadow-md"
          >
            {editId ? "Update Flight" : "Add Flight"}
          </button>
        </form>

        {/* Flights Table */}
        <div className="overflow-x-auto shadow-md rounded-xl bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="p-3">Flight No</th>
                <th className="p-3">Airline</th>
                <th className="p-3">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <PlaneTakeoff className="w-4 h-4" /> From
                  </div>
                </th>
                <th className="p-3">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <PlaneLanding className="w-4 h-4" /> To
                  </div>
                </th>
                <th className="p-3">Departure</th>
                <th className="p-3">Arrival</th>
                <th className="p-3">Price</th>
                <th className="p-3">Seats</th>
                <th className="p-3">Type</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flights.length > 0 ? (
                flights.map((f) => (
                  <tr
                    key={f._id}
                    className="border-b hover:bg-blue-50 transition"
                  >
                    <td className="p-3 font-semibold">{f.flightNo}</td>
                    <td className="p-3">{f.airline || "-"}</td>
                    <td className="p-3">{f.from}</td>
                    <td className="p-3">{f.to}</td>
                    <td className="p-3">
                      {new Date(f.departure).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {new Date(f.arrival).toLocaleString()}
                    </td>
                    <td className="p-3 text-green-700 font-bold">
                      ₹{f.price.toLocaleString()}
                    </td>
                    <td className="p-3">{f.seatCapacity ?? 48}</td>
                    <td className="p-3">{f.cabinClass || "Economy"}</td>
                    <td className="p-3">
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <button
                          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium"
                          onClick={() => handleEdit(f)}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium"
                          onClick={() => handleDelete(f._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center p-4">
                    No flights found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFlights;
