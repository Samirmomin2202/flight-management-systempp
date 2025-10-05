import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { user } from "./redux/userSlice";
import { accesstoken } from "./redux/tokenSlice";
import Cookies from "js-cookie";

import { FeeSummary } from "./FlightInfo";
import useFlightStore from "./zustand store/ZStore";
import { v4 as uuidv4 } from "uuid";
import { toast, ToastContainer } from "react-toastify";

const PassengerData = ({ filledFormList, setFilledFormList, bookingId }) => {
  const { passengers, bookedFlight, getAllBookings, allBookings, getPassengersInfo } =
    useFlightStore();
  const currentUser = useSelector(user); // Get current user from Redux
  
  // Debug logging
  console.log("🔍 Debug - PassengerData component loaded");
  console.log("🔍 Debug - Current user:", currentUser);
  console.log("🔍 Debug - Booking ID:", bookingId);
  console.log("🔍 Debug - Booked flight from store:", bookedFlight);
  console.log("🔍 Debug - Passengers count:", passengers);
  
  const randomId = uuidv4();
  const [genderSelected, setGenderSelected] = useState("null");
  const [passengerInfo, setPassengerInfo] = useState({
    sex: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: currentUser?.email || "", // Auto-populate email from signed-in user
    country: "",
    state: "",
    city: "",
    pincode: "",
    dob: "",
  });
  
  // Initialize bookFlight state with safe defaults
  const [bookFlight, setBookFlight] = useState({
    origin: "DEL",
    destination: "BOM", 
    departure_date: new Date().toISOString().substring(0, 10),
    adults: String(passengers || 1),
    travelerId: "0",
    dateOfBirth: "2023-07-31",
    firstName: "",
    lastName: "",
    gender: "MALE",
    email: currentUser?.email || "",
    countryCode: "+91",
    phone: "",
  });
  
  // Update bookFlight when bookedFlight is available
  useEffect(() => {
    if (bookedFlight) {
      console.log("🔍 Debug - Updating bookFlight with bookedFlight data:", bookedFlight);
      setBookFlight(prev => {
        // Normalize departure date: handle cases where bookedFlight.departure is
        // - a string ISO datetime
        // - an object with .at string or Date
        // - or missing
        const rawDeparture = bookedFlight?.departure;
        let depDateISO = prev.departure_date;
        if (rawDeparture) {
          if (typeof rawDeparture === 'string') {
            // e.g. "2025-10-04T12:30:00Z"
            depDateISO = rawDeparture.substring(0, 10);
          } else if (typeof rawDeparture === 'object') {
            const atVal = rawDeparture.at;
            if (typeof atVal === 'string') {
              depDateISO = atVal.substring(0, 10);
            } else if (atVal instanceof Date) {
              depDateISO = atVal.toISOString().substring(0, 10);
            }
          }
        }

        return {
          ...prev,
          origin: bookedFlight?.departure?.iataCode || bookedFlight?.from || prev.origin,
          destination: bookedFlight?.arrival?.iataCode || bookedFlight?.to || prev.destination,
          departure_date: depDateISO,
        };
      });
    }
  }, [bookedFlight]);
  const [error, setError] = useState(null);
  const [formFilled, setFormFilled] = useState(false);
  const storeData = (allDetails) => {
    const updateBookings = allBookings
      ? [...allBookings, { ...allDetails }]
      : [{ ...allDetails }];
    localStorage.setItem("all-bookings", JSON.stringify(updateBookings));
    getAllBookings(allDetails);
    setFilledFormList((prevVals) => [...prevVals, "filled"]);
  };
  const handleOnchange = (event) => {
    const { name, value } = event.target;
    setPassengerInfo((prevVal) => ({ ...prevVal, [name]: value }));
    setError((prevVal) => ({ ...prevVal, [name]: "" }));
    setBookFlight((prevVals) => ({ ...prevVals, [name]: value }));
  };
  const handleGenderClick = (genderClick) => {
    setGenderSelected(genderClick);
    // Store a normalized gender string matching backend examples
    const normalized = genderClick === "Mr" ? "Male" : "Female";
    setPassengerInfo((prevVal) => ({ ...prevVal, sex: normalized }));
    setBookFlight((prevVals) => ({ ...prevVals, gender: normalized.toUpperCase() }));
    setError((prevVal) => ({ ...prevVal, sex: "" }));
  };
  const handleConfirm = async (event) => {
    event.preventDefault();
    const validated = validateInputs();
    if (Object.keys(validated).length === 0) {
      try {
        console.log("💾 Handling passenger details; bookingId:", bookingId || "<none yet>");

        // If we don't yet have a booking (arrived via /details), just cache the passenger locally
        if (!bookingId) {
          // Cache locally and mark this form as filled so parent can proceed
          getPassengersInfo({ ...passengerInfo });
          // Persist primary contact email for later Bookings fetch if user isn't logged in
          if (passengerInfo.email) {
            try { localStorage.setItem('recentBookingEmail', passengerInfo.email); } catch {}
          }
          setFilledFormList((prev) => [...prev, "filled"]);
          toast.success("Passenger details saved. We'll create the booking next.");
          setFormFilled(true);
          return;
        }

        // If a booking already exists (arrived via /details/:id) then save passenger to backend immediately
        const passengerData = {
          bookingId: bookingId,
          firstName: passengerInfo.firstName,
          lastName: passengerInfo.lastName,
          email: passengerInfo.email,
          phone: passengerInfo.phone,
          country: passengerInfo.country,
          state: passengerInfo.state,
          city: passengerInfo.city,
          pincode: passengerInfo.pincode,
          dob: passengerInfo.dob ? new Date(passengerInfo.dob) : undefined,
          gender: passengerInfo.sex,
          passengerType: "Adult",
        };

        console.log("📤 Sending passenger data:", passengerData);
        const response = await fetch("http://localhost:5000/api/passengers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passengerData),
        });
        const result = await response.json();
        console.log("📥 Passenger save response:", result);

        if (result.success) {
          toast.success("Passenger details saved successfully!");
          // Store local data (optional legacy)
          let allDetails = {
            ticketId: randomId,
            passengerData: passengerInfo,
            flightInfo: bookedFlight,
          };
          storeData(allDetails);
          // Persist primary contact email
          if (passengerInfo.email) {
            try { localStorage.setItem('recentBookingEmail', passengerInfo.email); } catch {}
          }
          setFormFilled(true);
        } else {
          console.error("❌ Failed to save passenger details:", result.message);
          toast.error("Failed to save passenger details");
        }
      } catch (error) {
        console.error("❌ Error saving passenger details:", error);
        toast.error("Error saving passenger details");
      }
    } else {
      setError(validated);
      console.log("❌ Form validation errors:", validated);
    }
  };
  const validateInputs = () => {
    let error = {};
    if (passengerInfo.sex === "") {
      error.sex = "Please select your gender";
    }
    if (passengerInfo.firstName === "") {
      error.firstName = "Please enter First Name";
    }
    if (passengerInfo.lastName === "") {
      error.lastName = "Please enter Last Name";
    }
    if (passengerInfo.email === "") {
      error.email = "Please enter your Email";
    }
    if (passengerInfo.phone === "") {
      error.tel = "Please enter your phone number";
    } else if (passengerInfo.phone.length < 10) {
      error.tel = "Enter a valid phone number";
    }
    return error;
  };
  const gender = (
    <div className="w-fit flex flex-row items-center divide-x">
      <button
        type="button"
        className={` rounded px-2 py-1 text-xs ${
          genderSelected === "Mr" ? "bg-blue-900 text-white" : " text-black"
        } ${error && error.sex && "border border-red-600"}`}
        onClick={() => handleGenderClick("Mr")}
      >
        MR
      </button>
      <button
        type="button"
        className={`w-fit rounded px-2 py-1 text-xs ${
          genderSelected === "Mrs"
            ? "bg-blue-900 text-white text-sm"
            : " text-black"
        } ${error && error.sex && "border border-red-600"}`}
        onClick={() => handleGenderClick("Mrs")}
      >
        MRS
      </button>
    </div>
  );

  return (
    <form className="passenger-form" onSubmit={handleConfirm}>
      <fieldset disabled={formFilled}>
        <div className="flex flex-col border-2 rounded-lg mt-5 mb-4 bg-white w-full gap-8 ">
          <h5 className="text-base font-semibold border-b py-1 px-2">
            Passenger 1
          </h5>
          <div>
            <div className="flex flex-col sm:flex-row w-full gap-5 mb-7">
              <div className="w-fit flex flex-row border rounded divide-x text-base mx-2 ">
                {gender}
              </div>
              <div className="sm:w-[70%] flex flex-row text-base border rounded divide-x mx-1 gap-4">
                <div className="flex flex-col w-full">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={passengerInfo.firstName}
                    onChange={handleOnchange}
                    className={`w-[100%] py-1 px-2 focus-visible:outline-none ${
                      error && error.firstName && "border border-red-600"
                    }`}
                  />
                  <p className="text-xs text-red-600">
                    {error && error.firstName}
                  </p>
                </div>
                <div className="flex flex-col w-full">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={passengerInfo.lastName}
                    onChange={handleOnchange}
                    className={`w-[100%] py-1 px-2 focus-visible:outline-none ${
                      error && error.firstName && "border border-red-600"
                    }`}
                  />
                  <p className="text-xs text-red-600">
                    {error && error.lastName}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
              <input
                type="date"
                name="dob"
                value={passengerInfo.dob}
                onChange={handleOnchange}
                className="border rounded p-2"
                placeholder="Date of birth"
              />
              <input
                type="text"
                name="country"
                value={passengerInfo.country}
                onChange={handleOnchange}
                placeholder="Country (e.g., India)"
                className="border rounded p-2"
              />
              <input
                type="text"
                name="state"
                value={passengerInfo.state}
                onChange={handleOnchange}
                placeholder="State (e.g., Gujarat)"
                className="border rounded p-2"
              />
              <input
                type="text"
                name="city"
                value={passengerInfo.city}
                onChange={handleOnchange}
                placeholder="City (e.g., Ahmedabad)"
                className="border rounded p-2"
              />
              <input
                type="text"
                name="pincode"
                value={passengerInfo.pincode}
                onChange={handleOnchange}
                placeholder="Pincode / ZIP"
                className="border rounded p-2"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col border rounder-lg mt-3 bg-white w-full">
          <h5 className="text-base py-1 px-2 border-b ">Contact Information</h5>
          <div className="flex flex-row w-full mt-6 mb-8">
            <div className="w-full flex flex-row gap-3 text-base border rounded divide-x mx-1 sm:mx-5">
              <div className="w-14 flex flex-col justify-center">
                <input
                  type="text"
                  name="countryCode"
                  value={bookFlight.countryCode}
                  onChange={handleOnchange}
                  placeholder="+91"
                  className="w-10 px-1"
                />
              </div>
              <div className="w-full flex flex-col">
                <input
                  type="tel"
                  name="phone"
                  minLength={10}
                  maxLength={14}
                  placeholder="Phone number"
                  value={passengerInfo.phone}
                  onChange={handleOnchange}
                  className={`w-[100%] py-1 px-2 focus-visible:outline-none ${
                    error && error.tel && "border border-red-600"
                  }`}
                />
                <p className="text-xs text-red-600">{error && error.tel}</p>
              </div>
              <div className="w-full flex flex-col">
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={passengerInfo.email}
                  onChange={handleOnchange}
                  className={`w-[100%] py-1 px-2 focus-visible:outline-none ${
                    error && error.email && "border border-red-600"
                  }`}
                />
                <p className="text-xs text-red-600">{error && error.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className=" flex flex-row justify-start mb-4 mt-4">
          <button
            disabled={formFilled}
            type="submit"
            className={`bg-transparent border border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white text-sm font-medium px-8 py-2 rounded ${
              formFilled && "bg-blue-800 text-white border-none opacity-20"
            }`}
          >
            {formFilled ? (
              <span>
                Confirmed <FontAwesomeIcon icon={faCheck} />{" "}
              </span>
            ) : (
              <span>Confirm</span>
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
};

const Details = () => {
  const { flightData, passengers, isLoggedIn, bookedFlight, passengersInfo } = useFlightStore();
  const { id } = useParams(); // When present, booking already exists
  const [filledFormList, setFilledFormList] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);
  const navigateTo = useNavigate();
  
  console.log("🔍 Debug - Details component booking ID:", id);
  
  // Get user and token from Redux
  const currentUser = useSelector(user);
  const token = useSelector(accesstoken);

  // When we have an id, fetch booking details from database
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        console.log("🔍 Debug - Fetching booking details for ID:", id);
        
        // Try without authentication first (new backend setup)
        let response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        let result = await response.json();
        
        // If unauthorized, try with authentication (fallback for old backend)
        if (response.status === 401) {
          console.log("🔑 Debug - Authentication required, trying with token...");
          const authToken = token || Cookies.get("token");
          
          if (authToken) {
            response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            result = await response.json();
          } else {
            console.log("❌ Debug - No token available for authentication");
          }
        }
        
        if (result.success) {
          console.log("✅ Debug - Booking details fetched:", result.booking);
          setBookingDetails(result.booking);
        } else {
          console.error("❌ Debug - Failed to fetch booking:", result.message);
          // If we still can't fetch, try to use the flightData as fallback
          if (flightData && flightData.length > 0) {
            console.log("⚠️ Debug - Using flightData as fallback");
            setBookingDetails(flightData[0]);
          }
        }
      } catch (error) {
        console.error("❌ Debug - Error fetching booking:", error);
        // Try to use flightData as fallback
        if (flightData && flightData.length > 0) {
          console.log("⚠️ Debug - Using flightData as fallback due to error");
          setBookingDetails(flightData[0]);
        }
      }
    };
    
    if (id) {
      fetchBookingDetails();
    }
  }, [id, token]);
  
  // When arriving without id, prefill summary from store
  useEffect(() => {
    if (!id && bookedFlight) {
      console.log("🧭 Prefilling details from selected flight in store", bookedFlight);
      setBookingDetails({
        flightNo: bookedFlight.flightNo,
        from: bookedFlight.from,
        to: bookedFlight.to,
        departure: bookedFlight.departure,
        arrival: bookedFlight.arrival,
        price: bookedFlight.price,
        passengers: passengers || 1,
      });
    }
  }, [id, bookedFlight, passengers]);
  
  // Use booking details instead of filtering flightData
  const flightInfo = bookingDetails ? [bookingDetails] : [];
  
  console.log("🔍 Debug - Flight info for display:", flightInfo);
  
  const notify = (text) => toast(text);
  const passengerArray = new Array(Number(passengers || 1)).fill(null);
  
  // Create booking (if needed) after passenger forms are completed
  const handleBookFlight = async () => {
    // Auto-submit all passenger forms to register filled forms
    try {
      const forms = document.querySelectorAll('.passenger-form');
      forms.forEach((f) => {
        if (f && typeof f.requestSubmit === 'function') {
          f.requestSubmit();
        } else if (f && typeof f.submit === 'function') {
          f.submit();
        }
      });
      // Allow state updates to settle
      await new Promise((r) => setTimeout(r, 120));
    } catch {}

    const paxCount = Number(passengers || 1);
    if (filledFormList.length !== paxCount) {
      return notify("Please fill the passenger details to continue");
    }

    // If we already have booking id in URL, just go to bookings
    if (id) {
      toast.success("All passenger details completed!");
      setTimeout(() => navigateTo("/bookings"), 1200);
      return;
    }

    // Otherwise create booking first using bookingDetails (prefilled) or bookedFlight
    try {
      const base = bookingDetails || bookedFlight;
      if (!base) {
        return notify("Missing flight selection. Please go back and choose a flight.");
      }
      const payload = {
        flightNo: base.flightNo,
        from: base.from,
        to: base.to,
        departure: base.departure,
        arrival: base.arrival,
        price: base.price,
        passengers: paxCount,
        // Prefer the email the user typed in the passenger form for the first passenger,
        // otherwise fallback to logged-in user's email if available.
        userEmail: (Array.isArray(passengersInfo) && passengersInfo[0]?.email) || currentUser?.email,
      };

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Booking create failed", data);
        return toast.error("Booking failed: " + (data.message || "Unknown error"));
      }
      const newBookingId = data.booking._id;

      // After creating booking, persist all collected passenger details
      if (Array.isArray(passengersInfo) && passengersInfo.length > 0) {
        try {
          await Promise.all(
            passengersInfo.map(async (p) => {
              const payload = {
                bookingId: newBookingId,
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
                phone: p.phone,
                country: p.country,
                state: p.state,
                city: p.city,
                pincode: p.pincode,
                dob: p.dob ? new Date(p.dob) : undefined,
                gender: p.sex,
                passengerType: "Adult",
              };
              const r = await fetch("http://localhost:5000/api/passengers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const j = await r.json();
              if (!j.success) {
                console.warn("Passenger save failed for", p, j);
              }
            })
          );
        } catch (e) {
          console.error("Error saving passengers after booking", e);
        }
      }

  toast.success("Booking created! Opening your ticket...");
  setTimeout(() => navigateTo(`/booked/${newBookingId}`), 600);
    } catch (e) {
      console.error("Error creating booking after details", e);
      toast.error("Network error. Please ensure server is running.");
    }
  };
  return (
    <div className="w-full bg-white h-full">
     
      <ToastContainer />
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 mt-10 sm:mt-20 gap-y-10 sm:gap-20 items-between px-2 sm:px-16">
        <div className=" col-span-2 w- flex flex-col bg-[#fbfeff] pt-2">
          <div className="flex flex-row justify-center border-b border-b-slate-300 pb-1 border-slate-400">
            <h3 className="text-xl font-medium">Passenger Details</h3>
          </div>
          {passengerArray.map((_, index) => (
            <div key={index}>
              <PassengerData
                filledFormList={filledFormList}
                setFilledFormList={setFilledFormList}
                bookingId={id}
              />
            </div>
          ))}
        </div>
        {bookingDetails && <FeeSummary flightInfo={flightInfo} />}
      </div>
      <div className=" flex flex-row justify-center mb-4 mt-4">
        <button
          type="submit"
          onClick={handleBookFlight}
          className="bg-blue-950 hover:bg-blue-900 text-white text-xl font-semibold px-12 py-2 rounded"
        >
          Book Flight
        </button>
      </div>
    </div>
  );
};

export default Details;
