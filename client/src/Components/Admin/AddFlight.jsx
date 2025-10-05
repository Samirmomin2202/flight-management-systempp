import React, { useState } from "react";
import { API } from "../api";

const AddFlight = ({ refresh }) => {
  const [flight, setFlight] = useState({
    flightNumber: "", origin: "", destination: "", departureTime: "", arrivalTime: "", price: 0, seatsAvailable: 0
  });

  const handleChange = e => setFlight({ ...flight, [e.target.name]: e.target.value });
  const handleSubmit = e => {
    e.preventDefault();
    API.post("/flights", flight)
      .then(() => {
        refresh();
        setFlight({ flightNumber: "", origin: "", destination: "", departureTime: "", arrivalTime: "", price: 0, seatsAvailable: 0 });
      })
      .catch(err => console.log(err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Flight</h3>
      <input name="flightNumber" placeholder="Flight No" value={flight.flightNumber} onChange={handleChange} required />
      <input name="origin" placeholder="Origin" value={flight.origin} onChange={handleChange} required />
      <input name="destination" placeholder="Destination" value={flight.destination} onChange={handleChange} required />
      <input name="departureTime" placeholder="Departure Time" value={flight.departureTime} onChange={handleChange} required />
      <input name="arrivalTime" placeholder="Arrival Time" value={flight.arrivalTime} onChange={handleChange} required />
      <input name="price" placeholder="Price" type="number" value={flight.price} onChange={handleChange} required />
      <input name="seatsAvailable" placeholder="Seats" type="number" value={flight.seatsAvailable} onChange={handleChange} required />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddFlight;
