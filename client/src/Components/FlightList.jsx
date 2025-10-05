import React, { useEffect, useState } from "react";
import axios from "axios";

const FlightList = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://flight-search-api.onrender.com/flight/search", {
        params: { from, to } // send query params if your API supports search
      });
      setFlights(res.data.flights || res.data); // depends on your API response structure
    } catch (err) {
      console.error("Error fetching flights:", err);
    }
    setLoading(false);
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchFlights();
  };

  useEffect(() => {
    fetchFlights(); // fetch all flights on page load
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Available Flights</h2>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input type="text" placeholder="From" value={from} onChange={e => setFrom(e.target.value)} className="border p-2 rounded"/>
        <input type="text" placeholder="To" value={to} onChange={e => setTo(e.target.value)} className="border p-2 rounded"/>
        <button type="submit" className="bg-blue-800 text-white p-2 rounded">Search</button>
      </form>

      {loading ? <p>Loading flights...</p> :
        <table className="w-full border">
          <thead>
            <tr className="border-b">
              {["FlightNo", "From", "To", "Departure", "Arrival", "Price"].map(h => <th key={h} className="p-2">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {flights.map(f => (
              <tr key={f._id || f.flightNo} className="border-b">
                <td className="p-2">{f.flightNo}</td>
                <td className="p-2">{f.from}</td>
                <td className="p-2">{f.to}</td>
                <td className="p-2">{f.departure}</td>
                <td className="p-2">{f.arrival}</td>
                <td className="p-2">₹{f.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    </div>
  );
};

export default FlightList;
