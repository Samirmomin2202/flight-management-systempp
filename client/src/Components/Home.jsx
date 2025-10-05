import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { useSelector } from "react-redux";
import { accesstoken } from "./redux/tokenSlice";
import useFlightStore from "./zustand store/ZStore";
import FlightSearchMobile from "./FlightSearchMobile";
import SearchResult from "./SearchResult";
import Footer from "./Footer";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const token = useSelector(accesstoken);
  const { flightData } = useFlightStore();

  // Slider settings
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className="w-full sm:min-h-screen">
      {/* ---------- Desktop / Large screen ---------- */}
      <div className="hidden sm:block bg-hero-img bg-cover bg-center w-full h-[90vh]">
        <div className="flex flex-col h-full justify-center px-8">
          <div className="text-white font-bold font-sans text-6xl md:text-8xl tracking-wider gap-2">
            <h1>Ready To</h1>
            <h1>Takeoff?</h1>
          </div>
          <div className="text-xl text-slate-100 font-medium mt-6">
            <p>It’s a big world out there, book your flight</p>
            <p>tickets easily and explore your dream destination.</p>
          </div>
          <div>
            <Link to="/flights">
              <button className="text-white text-2xl font-medium mt-6 px-9 rounded-md bg-blue-950 py-2 hover:bg-blue-800 transition">
                Book Now
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ---------- Mobile view ---------- */}
      <div className="w-full p-2 bg-white mt-8 sm:hidden">
        <div className="flex flex-col">
          <h3 className="text-lg text-blue-950 font-bold">Welcome,</h3>
          <p>
            It’s a big world out there, book your flight tickets easily and
            explore your dream destinations
          </p>
        </div>

        {/* Mobile Flight Search */}
        <FlightSearchMobile />

        {/* Search Result on mobile */}
        {flightData && (
          <div className="w-full flex flex-col items-center mt-4">
            <SearchResult />
          </div>
        )}

        {/* ---------- Top Deals Slider ---------- */}
        <div className="mt-7 font-semibold text-lg">
          <h2>Top Deals</h2>
          <div className="w-full flex flex-col h-44 mt-2">
            <Slider {...settings} className="w-[95%] h-full">
              {/* Deal 1 */}
              <div className="flex flex-col h-44 bg-hero-img bg-cover p-2 rounded-md shadow">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <h1 className="text-white font-normal">Lagos - London</h1>
                    <p className="text-white font-thin text-sm">
                      29 July - 30 August
                    </p>
                  </div>
                  <div className="flex flex-row justify-end py-2 px-2">
                    <button className="bg-blue-950 text-base text-white rounded py-1 px-3 hover:bg-blue-800 transition">
                      Pay $1100
                    </button>
                  </div>
                </div>
              </div>
              {/* Deal 2 */}
              <div className="flex flex-col h-44 bg-hero-img bg-cover p-2 rounded-md shadow">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <h1 className="text-white font-normal">Lagos - Dubai</h1>
                    <p className="text-white font-thin text-sm">
                      19 June - 10 September
                    </p>
                  </div>
                  <div className="flex flex-row justify-end py-2 px-2">
                    <button className="bg-blue-950 text-base text-white rounded py-1 px-3 hover:bg-blue-800 transition">
                      Pay $1100
                    </button>
                  </div>
                </div>
              </div>
            </Slider>
          </div>
        </div>

        {/* ---------- Subscription ---------- */}
        <div className="bg-[#fbfeff] mt-10 pt-6 pb-3 mb-6 rounded-md shadow">
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-lg">
              Get exclusive deals & travel updates
            </h3>
            <p className="text-xs text-slate-400">
              Enter your email and subscribe!
            </p>
          </div>
          <form className="mt-6 w-full px-2 mb-6">
            <div className="flex flex-row w-full">
              <input
                className="w-full py-2 border rounded-l-sm text-base px-2 focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Email"
                type="email"
              />
              <button
                type="submit"
                className="bg-blue-950 text-white font-medium text-base rounded-r-sm px-4 py-2 hover:bg-blue-800 transition"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer only on mobile */}
      <div className="sm:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
