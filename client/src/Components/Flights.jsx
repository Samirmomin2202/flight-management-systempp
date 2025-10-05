import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useFlightStore from "./zustand store/ZStore";
import { useSelector } from "react-redux";
import { accesstoken } from "./redux/tokenSlice";
import { user } from "./redux/userSlice";

const Flights = () => {
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [search, setSearch] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });
  const [sortOrder, setSortOrder] = useState("asc");
  const API_URL = "http://localhost:5000/api/flights";
  const navigate = useNavigate();
  // Store helpers
  const { getBookedFlight, getPassengers } = useFlightStore();

  // 🔹 Grab token & user from Redux
  const token = useSelector(accesstoken); // token from Redux slice
  const currentUser = useSelector(user);  // user object from Redux slice

  // Filter out past flights
  const filterUpcomingFlights = (flightsArray) => {
    const now = new Date();
    return flightsArray.filter((f) => new Date(f.departure) >= now);
  };

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        console.log("🔍 Fetching flights from:", API_URL);
        const res = await axios.get(API_URL);
        console.log("📡 API Response:", res.data);
        
        if (res.data.success) {
          console.log("✅ Raw flights from API:", res.data.flights);
          const upcomingFlights = filterUpcomingFlights(res.data.flights);
          console.log("🕒 Upcoming flights after filtering:", upcomingFlights);
          setFlights(upcomingFlights);
          setFilteredFlights(upcomingFlights);
        } else {
          console.warn("⚠️ API returned success: false");
        }
      } catch (err) {
        console.error("❌ Error fetching flights:", err);
        console.error("❌ Error details:", err.response?.data || err.message);
      }
    };
    fetchFlights();
  }, []);

  const handleChange = (e) => {
    setSearch((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const { from, to, date } = search;
    let filtered = filterUpcomingFlights(flights);
    if (from)
      filtered = filtered.filter((f) =>
        f.from.toLowerCase().includes(from.toLowerCase())
      );
    if (to)
      filtered = filtered.filter((f) =>
        f.to.toLowerCase().includes(to.toLowerCase())
      );
    if (date) {
      filtered = filtered.filter((f) => {
        const flightDate = new Date(f.departure).toISOString().slice(0, 10);
        return flightDate === date;
      });
    }
    setFilteredFlights(filtered);
  };

  const handleSort = (field) => {
    let sortedFlights = [...filteredFlights];
    sortedFlights.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      if (field === "price") {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredFlights(sortedFlights);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // 🔹 New flow: go to details first, collect passengers, then create booking
  const handleBook = (flight) => {
    console.log("� Proceed to details for flight:", flight);
    // Save selected flight and passengers count in store/localStorage
    getBookedFlight(flight);
    getPassengers(search.passengers || 1);
    // Navigate to details form (no booking created yet)
    navigate("/details");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Plane className="text-blue-700" /> Available Flights
      </h2>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="mb-8 bg-white p-4 rounded-xl shadow flex flex-col lg:flex-row lg:items-end lg:gap-4 gap-4"
      >
        <div className="flex flex-col flex-1">
          <label className="text-sm font-semibold">From:</label>
          <input
            type="text"
            name="from"
            value={search.from}
            onChange={handleChange}
            placeholder="Source"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-sm font-semibold">To:</label>
          <input
            type="text"
            name="to"
            value={search.to}
            onChange={handleChange}
            placeholder="Destination"
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-sm font-semibold">Date:</label>
          <input
            type="date"
            name="date"
            value={search.date}
            onChange={handleChange}
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="flex flex-col w-28">
          <label className="text-sm font-semibold">Passengers:</label>
          <input
            type="number"
            name="passengers"
            min="1"
            value={search.passengers}
            onChange={handleChange}
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition self-start lg:self-auto"
        >
          Search
        </button>
      </form>

      {/* Sort Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          onClick={() => handleSort("from")}
        >
          Sort by From
        </button>
        <button
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          onClick={() => handleSort("to")}
        >
          Sort by To
        </button>
        <button
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          onClick={() => handleSort("price")}
        >
          Sort by Price
        </button>
      </div>

      {/* Flight Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFlights.length > 0 ? (
          filteredFlights.map((f) => (
            <div
              key={f._id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="text-blue-700" />
                  <h3 className="text-lg font-bold">{f.flightNo}</h3>
                </div>
                <p className="text-sm">
                  <span className="font-semibold">From:</span> {f.from}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">To:</span> {f.to}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Departure:</span>{" "}
                  {new Date(f.departure).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Arrival:</span>{" "}
                  {new Date(f.arrival).toLocaleString()}
                </p>
                <p className="text-sm mt-2 font-semibold text-green-700">
                  Price: ₹{f.price}
                </p>
              </div>
              <button
                onClick={() => handleBook(f)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Book Now
              </button>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No flights found.
          </p>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Flights;
