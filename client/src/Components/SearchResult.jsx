import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faUser } from "@fortawesome/free-solid-svg-icons";
import useFlightStore from "./zustand store/ZStore";
import { useNavigate } from "react-router-dom";
import Filters from "./Filters";
import airlineImg from "../Assets/airline.jpg";

const SearchResult = ({ showFilter, setShowFilter }) => {
  const { flightData, removeFlight, filteredResult, showResult, getResult } =
    useFlightStore();
  const navigateTo = useNavigate();
  const [filterDetails, setFilterDetails] = useState({});

  useEffect(() => {
    getResult(flightData);
  }, [flightData, getResult]);

  const handleClearSearch = () => {
    localStorage.removeItem("flight-data");
    removeFlight();
  };

const formatPriceINR = (price) => {
  if (price === null || price === undefined) return "₹0.00";

  // Convert price to number (float) explicitly
  let priceNumber = parseFloat(price.toString().replace(/,/g, ""));

  // Check if price has decimals (like 78.90)
  const hasDecimal = price.toString().includes(".");

  // If no decimal and large number, assume paise and divide by 100
  if (!hasDecimal && Number.isInteger(priceNumber) && priceNumber > 1000) {
    priceNumber = priceNumber / 100;
  }

  // Force to 2 decimals to avoid integer rounding issues
  priceNumber = Number(priceNumber.toFixed(2));

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceNumber);
};
const handleBookFlight = (id) => {
    navigateTo(`/flight-info/${id}`);
  };

  const DisplayResult = ({ value }) => {
    return (
      <div key={value.id} className="w-[98%] mt-3">
        <div className="w-full h-32 flex flex-row rounded-lg divide-2 border-2 shadow-sm">
          <div className="hidden w-[14%] md:flex flex-col justify-center items-center border-r border-slate-300 py-1">
            <img
              src={airlineImg}
              alt={`${value.airline} airline image`}
              className="h-full object-contain"
            />
            <span className="max-sm:hidden">{value.airline} Airline</span>
          </div>
          <div className="w-[43%] flex flex-row border-dashed border-r border-slate-300 items-center justify-center px-2 md:gap-10 py-2 md:py-7">
            <div className="flex flex-col items-center md:gap-2">
              <h2 className="font-semibold text-[17px] md:text-4xl tracking-wide md:tracking-wider">
                {value.departure.iataCode}
              </h2>
              <small className="text-slate-500 font-medium text-[9px] md:text-base">
                {typeof value?.departure?.at === 'string'
                  ? value.departure.at.substring(11)
                  : value?.departure?.at instanceof Date
                  ? value.departure.at.toISOString().substring(11)
                  : new Date(value?.departure ?? Date.now()).toISOString().substring(11)}
              </small>
            </div>
            <div className="flex flex-col items-center px-4 whitespace-nowrap gap-2 md:-mt-2">
              <small className="text-[9px] md:text-sm text-slate-500 font-medium">
                {value.duration.replace("hour", "hr").replace("minutes", "min")}
              </small>
              <FontAwesomeIcon icon={faPlane} className="text-lg text-blue-950" />
              <small className="text-[9px] md:text-sm text-center text-slate-500 font-medium">
                {"flight no. " + value.flightNumber}
              </small>
            </div>
            <div className="flex flex-col items-center md:gap-2">
              <p className="font-semibold text-[17px] md:text-4xl tracking-normal md:tracking-wide">
                {value.arrival.iataCode}
              </p>
              <small className="text-[9px] md:text-sm text-slate-500 font-medium">
                {value.arrival.at.substring(11)}
              </small>
            </div>
          </div>
          <div className="flex flex-row w-[43%] justify-between md:justify-end items-center md:gap-32 md:mx-5">
            <div className="flex flex-col w-full items-center gap-1">
              <small className="text-[9px] md:text-xs text-slate-500 font-medium">
                Price per seat
              </small>
              <h3 className="text-[16px] md:text-3xl font-semibold tracking-wide whitespace-nowrap">
                {formatPriceINR(value.price*100)}
              </h3>
              <small className="text-[9px] md:text-xs text-slate-500 font-medium">
                <FontAwesomeIcon icon={faUser} className="text-blue-950" /> First Class
              </small>
            </div>
            <div className="flex flex-col w-full items-end md:items-center md:gap-2">
              <button
                className="bg-blue-950 text-slate-200 text-[11px] md:text-sm w-fit py-1 md:py-2 px-1 md:px-3 rounded-lg"
                onClick={() => handleBookFlight(value.id)}
              >
                Book Now
              </button>
              <small className="text-[9px] md:text-xs text-center text-slate-500 font-medium">
                {value.numberOfBookableSeats + " Available Seat(s)"}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const searchResult =
    filteredResult && filteredResult.length !== 0
      ? filteredResult.map((value) => <DisplayResult value={value} key={value.id} />)
      : showResult && showResult.length !== 0
      ? showResult.map((value) => <DisplayResult value={value} key={value.id} />)
      : null;

  return (
    <>
      {flightData && flightData.length !== 0 ? (
        <div className={`w-full flex flex-col items-center ${showFilter && "hidden"}`}>
          {searchResult}
          <div>
            <button className="mt-5 text-sm md:text-base" onClick={handleClearSearch}>
              Clear search
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 mt-5">Search for flight details</p>
      )}
      <div className={`${!showFilter && "hidden"} w-full`}>
        <Filters
          setShowFilter={setShowFilter}
          filterDetails={filterDetails}
          setFilterDetails={setFilterDetails}
        />
      </div>
    </>
  );
};

export default SearchResult;
