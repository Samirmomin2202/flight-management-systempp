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
    <div className="w-full sm:min-h-screen">
      {/* ---------- Desktop / Large screen ---------- */}
      <div className="hidden sm:block w-full h-[90vh]">
        {slides.length > 0 ? (
          <Slider dots={true} infinite={true} autoplay={true} autoplaySpeed={4000} arrows={false}>
            {slides.map((s) => (
              <div key={s._id} className="w-full h-[90vh] relative">
                {s.imageBase64 || s.imageUrl ? (
                  <img src={s.imageBase64 || s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-hero-img bg-cover bg-center" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col justify-center px-12 text-white max-w-3xl">
                  <h2 className="text-5xl md:text-7xl font-extrabold leading-tight drop-shadow">{s.title}</h2>
                  {s.subtitle && <p className="mt-3 text-lg text-slate-100">{s.subtitle}</p>}
                  {s.ctaUrl && (
                    <Link to={s.ctaUrl} className="mt-6 inline-block bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-md">
                      {s.ctaText || "Explore"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </Slider>
        ) : (
          <div className="bg-hero-img bg-cover bg-center w-full h-full">
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
        )}
      </div>

  {/* ---------- Desktop informational sections ---------- */}
      <div className="hidden sm:block">
        {/* Trust band */}
        <div className="bg-white border-y">
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
        <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <img src={airlineImg} alt="Airline" className="rounded-2xl shadow object-cover w-full h-[320px]" />
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Why choose FlightHub?</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              We make flight booking simple and transparent—no hidden charges, fast checkouts, and a clean experience
              tailored for travelers across India.
            </p>
            <ul className="mt-5 space-y-3 text-slate-700">
              <li>• Best fares on popular domestic routes</li>
              <li>• Transparent pricing with GST-ready invoices</li>
              <li>• Ticket PDF emailed instantly on confirmation</li>
              <li>• Secure payments powered by Razorpay</li>
            </ul>
            <Link to="/flights" className="inline-block mt-6 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md shadow">Search Flights</Link>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="bg-slate-50">
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
                <div key={i} className="bg-white rounded-xl shadow border p-4">
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
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-2xl font-bold text-slate-900">How it works</h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow border p-6 text-center">
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
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h3 className="text-2xl font-bold text-slate-900">What travelers say</h3>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Aman, Delhi', text: 'Smooth booking and instant ticket on email. Prices were competitive!' },
                { name: 'Priya, Bengaluru', text: 'Loved the clean UI and quick Razorpay checkout. 5 stars.' },
                { name: 'Rahul, Mumbai', text: 'Got my refund quickly after a schedule change. Support was helpful.' },
              ].map((t, i) => (
                <div key={i} className="border rounded-xl shadow-sm p-6 bg-slate-50">
                  <div className="text-amber-500">★★★★★</div>
                  <p className="mt-3 text-slate-700">“{t.text}”</p>
                  <div className="mt-4 text-sm text-slate-500">— {t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* Bottom CTA */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="rounded-2xl border shadow bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">Plan your next journey</h3>
              <p className="text-blue-100 mt-1">Find great fares across popular routes in India.</p>
            </div>
            <Link to="/flights" className="bg-white text-blue-900 font-semibold px-5 py-2.5 rounded-md shadow hover:bg-blue-50">Search Flights</Link>
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
