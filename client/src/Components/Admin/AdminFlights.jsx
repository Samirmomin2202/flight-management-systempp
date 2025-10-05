import React, { useEffect, useState } from "react";
import axios from "axios";
import { PlaneTakeoff, PlaneLanding } from "lucide-react"; // Flight icons

const AdminFlights = () => {
  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState({
    flightNo: "",
    from: "",
    to: "",
    departure: "",
    arrival: "",
    price: "",
  });
  const [editId, setEditId] = useState(null);

  const API_URL = "http://localhost:5000/api/flights";

  // Fetch all flights
  const fetchFlights = async () => {
    try {
      const res = await axios.get(API_URL);
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
      !form.from ||
      !form.to ||
      !form.departure ||
      !form.arrival ||
      !form.price
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

    const payload = {
      flightNo: form.flightNo.trim(),
      from: form.from.trim(),
      to: form.to.trim(),
      departure: depDate.toISOString(),
      arrival: arrDate.toISOString(),
      price: Number(form.price),
    };

    try {
      let res;
      if (editId) {
        res = await axios.put(`${API_URL}/${editId}`, payload);
      } else {
        res = await axios.post(API_URL, payload);
      }
      if (res.data.success) {
        alert(res.data.message);
        setForm({
          flightNo: "",
          from: "",
          to: "",
          departure: "",
          arrival: "",
          price: "",
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
      await axios.delete(`${API_URL}/${id}`);
      fetchFlights();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Edit flight
  const handleEdit = (flight) => {
    setForm({
      flightNo: flight.flightNo,
      from: flight.from,
      to: flight.to,
      departure: new Date(flight.departure).toISOString().slice(0, 16),
      arrival: new Date(flight.arrival).toISOString().slice(0, 16),
      price: flight.price,
    });
    setEditId(flight._id);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-900">
        <PlaneTakeoff className="text-blue-700" /> Admin Flights
      </h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-white shadow-md p-4 rounded-xl"
      >
        {["flightNo", "from", "to", "departure", "arrival", "price"].map(
          (field) => (
            <input
              key={field}
              name={field}
              type={
                field === "price"
                  ? "number"
                  : field === "departure" || field === "arrival"
                  ? "datetime-local"
                  : "text"
              }
              value={form[field]}
              onChange={handleChange}
              placeholder={
                field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")
              }
              className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          )
        )}
        <button
          type="submit"
          className="bg-blue-700 hover:bg-blue-800 transition text-white p-2 rounded-lg col-span-1 md:col-span-3 lg:col-span-6 font-semibold shadow-md"
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
                  <td className="p-3 flex gap-2">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg shadow"
                      onClick={() => handleEdit(f)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow"
                      onClick={() => handleDelete(f._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No flights found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFlights;
