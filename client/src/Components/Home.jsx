import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { useSelector } from "react-redux";
import { accesstoken } from "./redux/tokenSlice";
import useFlightStore from "./zustand store/ZStore";
import FlightSearchMobile from "./FlightSearchMobile";
import SearchResult from "./SearchResult";
import Footer from "./Footer";
import airlineImg from "../Assets/airline.jpg";
import fly from "../Assets/fly.jpeg";
import { listSlides } from "../api/slidesApi";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const token = useSelector(accesstoken);
  const { flightData } = useFlightStore();
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listSlides(true);
        if (mounted) setSlides(data);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Slider settings
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
        <img src={fly} alt="Flight" className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-700/60 to-blue-400/40" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-4 max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-lg mb-4">Book Your Next Flight<br />with <span className="text-amber-300">FlightHub</span></h1>
          <p className="text-lg md:text-2xl font-medium mb-8 drop-shadow">Fast, secure, and transparent flight booking for India’s travelers.</p>
          <Link to="/flights" className="inline-block bg-amber-400 hover:bg-amber-500 text-blue-900 font-bold px-8 py-3 rounded-xl shadow-lg text-lg transition">Search Flights</Link>
        </div>
      </section>

  {/* ---------- Desktop informational sections ---------- */}
  <div className="hidden sm:block animate-fade-in-up">
        {/* Trust band */}
  <div className="bg-white border-y rounded-xl shadow-md mx-4 mt-[-3rem] relative z-20">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl">🛡️</div>
              <p className="mt-2 text-sm text-slate-600">Secure Razorpay Payments</p>
            </div>
            <div>
              <div className="text-3xl">⏱️</div>
              <p className="mt-2 text-sm text-slate-600">Instant Ticket Confirmation</p>
            </div>
            <div>
              <div className="text-3xl">📞</div>
              <p className="mt-2 text-sm text-slate-600">24×7 Support</p>
            </div>
            <div>
              <div className="text-3xl">🔁</div>
              <p className="mt-2 text-sm text-slate-600">Easy Cancellations</p>
            </div>
          </div>
        </div>

        {/* Why choose FlightHub */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative w-full h-[320px] flex items-center justify-center">
            <img src={airlineImg} alt="Airline" className="rounded-2xl shadow-xl object-cover w-full h-full border-4 border-white" />
            <div className="absolute top-4 left-4 bg-white/80 text-blue-900 px-4 py-2 rounded-lg shadow font-bold text-lg animate-bounce">Best Price Guarantee</div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-blue-900">Why choose FlightHub?</h2>
            <p className="mt-3 text-blue-800 leading-relaxed text-lg">No hidden charges, instant tickets, and a seamless booking experience for every traveler.</p>
            <ul className="mt-5 space-y-3 text-blue-900 font-medium">
              <li>✔ Best fares on popular domestic routes</li>
              <li>✔ Transparent pricing with GST-ready invoices</li>
              <li>✔ Instant ticket PDF on confirmation</li>
              <li>✔ Secure payments powered by Razorpay</li>
            </ul>
            <Link to="/flights" className="inline-block mt-8 bg-blue-700 hover:bg-blue-800 text-white px-7 py-3 rounded-xl shadow-lg text-lg transition">Search Flights</Link>
          </div>
        </section>

        {/* Popular Routes */}
  <section className="bg-slate-50 rounded-xl shadow-inner mx-4 my-8">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h3 className="text-2xl font-bold text-slate-900">Popular Routes</h3>
            <p className="text-slate-600 mt-1">Grab great deals on frequently traveled routes</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[ 
                { from: 'Delhi', to: 'Mumbai', price: 3200 },
                { from: 'Bengaluru', to: 'Chennai', price: 2800 },
                { from: 'Ahmedabad', to: 'Goa', price: 3500 },
                { from: 'Kolkata', to: 'Hyderabad', price: 3000 },
              ].map((r, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 hover:scale-105 hover:shadow-2xl transition-transform duration-200">
                  <div className="text-sm text-slate-500">From</div>
                  <div className="text-lg font-semibold">{r.from}</div>
                  <div className="text-sm text-slate-500 mt-2">To</div>
                  <div className="text-lg font-semibold">{r.to}</div>
                  <div className="mt-3 text-emerald-700 font-bold">₹{r.price.toLocaleString('en-IN')}</div>
                  <Link to="/flights" className="mt-4 inline-block text-sm bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded">Book</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
  <section className="max-w-7xl mx-auto px-6 py-12 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-slate-900">How it works</h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 text-center hover:shadow-2xl transition">
              <div className="text-3xl">🔎</div>
              <h4 className="mt-2 font-semibold">Search</h4>
              <p className="text-sm text-slate-600 mt-1">Find flights by city, date, and class</p>
            </div>
            <div className="bg-white rounded-xl shadow border p-6 text-center">
              <div className="text-3xl">💳</div>
              <h4 className="mt-2 font-semibold">Book</h4>
              <p className="text-sm text-slate-600 mt-1">Pay securely with Razorpay</p>
            </div>
            <div className="bg-white rounded-xl shadow border p-6 text-center">
              <div className="text-3xl">🧾</div>
              <h4 className="mt-2 font-semibold">Get Ticket</h4>
              <p className="text-sm text-slate-600 mt-1">Receive your ticket PDF in email</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
  <section className="bg-white animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h3 className="text-2xl font-bold text-slate-900">What travelers say</h3>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Aman, Delhi', text: 'Smooth booking and instant ticket on email. Prices were competitive!' },
                { name: 'Priya, Bengaluru', text: 'Loved the clean UI and quick Razorpay checkout. 5 stars.' },
                { name: 'Rahul, Mumbai', text: 'Got my refund quickly after a schedule change. Support was helpful.' },
              ].map((t, i) => (
                <div key={i} className="border rounded-xl shadow-lg p-8 bg-gradient-to-br from-blue-50 to-blue-100 hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={fly} alt="Traveler" className="h-10 w-10 rounded-full object-cover border-2 border-amber-300" />
                    <div className="text-amber-500 text-lg">★★★★★</div>
                  </div>
                  <p className="mt-3 text-blue-900 font-medium">“{t.text}”</p>
                  <div className="mt-4 text-sm text-blue-700 font-semibold">— {t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* Bottom CTA */}
        <section className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
          <div className="rounded-2xl border shadow-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-bold mb-2">Plan your next journey</h3>
              <p className="text-blue-100 text-lg">Find great fares across popular routes in India.</p>
            </div>
            <Link to="/flights" className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-blue-50 text-lg transition">Search Flights</Link>
          </div>
        </section>
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
                    <h1 className="text-white font-normal">Delhi - Mumbai</h1>
                    <p className="text-white font-thin text-sm">29 Oct - 30 Nov</p>
                  </div>
                  <div className="flex flex-row justify-end py-2 px-2">
                    <button className="bg-blue-700 text-base text-white rounded py-1 px-3 hover:bg-blue-800 transition">
                      Book ₹3,200
                    </button>
                  </div>
                </div>
              </div>
              {/* Deal 2 */}
              <div className="flex flex-col h-44 bg-hero-img bg-cover p-2 rounded-md shadow">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <h1 className="text-white font-normal">Bengaluru - Chennai</h1>
                    <p className="text-white font-thin text-sm">19 Nov - 10 Dec</p>
                  </div>
                  <div className="flex flex-row justify-end py-2 px-2">
                    <button className="bg-blue-700 text-base text-white rounded py-1 px-3 hover:bg-blue-800 transition">
                      Book ₹2,800
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
