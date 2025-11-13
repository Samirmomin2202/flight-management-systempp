import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { useSelector } from "react-redux";
import { accesstoken } from "./redux/tokenSlice";
import useFlightStore from "./zustand store/ZStore";
import FlightSearchMobile from "./FlightSearchMobile";
import SearchResult from "./SearchResult";
import Footer from "./Footer";
import PopularFlightRoutes from "./PopularFlightRoutes";
import airlineImg from "../Assets/airline.jpg";
import fly from "../Assets/fly.jpeg";
import { listSlides } from "../api/slidesApi";
import http from "../api/http";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
//import { image } from "html2canvas/dist/types/css/types/image";

const Home = () => {
  const token = useSelector(accesstoken);
  const { flightData } = useFlightStore();
  const [slides, setSlides] = useState([]);
  const [popularFlights, setPopularFlights] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll(
      '.fade-in-on-scroll, .slide-in-left-on-scroll, .slide-in-right-on-scroll, .scale-in-on-scroll'
    );
    
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, [popularFlights]);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPopularLoading(true);
        const res = await http.get("/flights");
        const flights = res?.data?.flights || [];
        // Sort by price ascending and pick top 4 upcoming
        const now = Date.now();
        const upcoming = flights.filter(f => new Date(f?.departure || f?.date || 0).getTime() >= now);
        const top = (upcoming.length ? upcoming : flights)
          .filter(f => f?.from && f?.to)
          .sort((a,b) => (Number(a?.price)||0) - (Number(b?.price)||0))
          .slice(0,4);
        if (mounted) setPopularFlights(top);
      } catch {}
      finally { setPopularLoading(false); }
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
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Animated background image with parallax effect */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={fly} 
            alt="Flight" 
            className="absolute inset-0 w-full h-full object-cover object-center animate-scale-in" 
            style={{ 
              transform: 'scale(1.1)',
              transition: 'transform 0.3s ease-out'
            }}
            loading="lazy" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-blue-700/15 to-blue-400/10 animate-fade-in" />
        </div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-4 max-w-2xl mx-auto animate-slide-down">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold drop-shadow-2xl mb-4 leading-tight">
            Book Your Next Flight<br />
            with <span className="text-amber-300 animate-pulse-glow inline-block px-2">FlightHub</span>
          </h1>
          <p className="text-lg md:text-2xl font-medium mb-8 drop-shadow-lg animate-fade-in">
            Fast, secure, and transparent flight booking for India's travelers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center animate-scale-in">
            <Link 
              to="/flights" 
              className="text-white/90 hover:text-white underline text-lg transition-all duration-300 hover:scale-110"
            >
              Discover all routes →
            </Link>
            <Link 
              to="/flights" 
              className="inline-block bg-amber-400 hover:bg-amber-500 text-blue-900 font-bold px-8 py-4 rounded-xl shadow-2xl text-lg transition-all duration-300 hover:scale-110 hover:shadow-amber-500/50 transform hover:-translate-y-1"
            >
              Search Flights
            </Link>
          </div>
        </div>
      </section>

  {/* ---------- Desktop informational sections ---------- */}
  <div className="hidden sm:block">
        {/* Trust band */}
  <div className="bg-white border-y rounded-xl shadow-xl mx-4 mt-[-3rem] relative z-20 hover-lift">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🛡️', text: 'Secure Razorpay Payments' },
              { icon: '⏱️', text: 'Instant Ticket Confirmation' },
              { icon: '📞', text: '24×7 Support' },
              { icon: '🔁', text: 'Easy Cancellations' }
            ].map((item, i) => (
              <div 
                key={i} 
                className="fade-in-on-scroll stagger-1 hover:scale-110 transition-transform duration-300 cursor-default"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="text-4xl mb-3 animate-float" style={{ animationDelay: `${i * 0.2}s` }}>{item.icon}</div>
                <p className="mt-2 text-sm text-slate-600 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why choose FlightHub */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative w-full h-[320px] flex items-center justify-center slide-in-left-on-scroll overflow-hidden group">
            <img 
              src={airlineImg} 
              alt="Airline" 
              className="rounded-2xl shadow-xl object-cover w-full h-full border-4 border-white transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-900 px-5 py-3 rounded-lg shadow-xl font-bold text-lg animate-pulse-glow hover:scale-105 transition-transform">
              Best Price Guarantee
            </div>
          </div>
          <div className="slide-in-right-on-scroll">
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-4">Why choose FlightHub?</h2>
            <p className="mt-3 text-blue-800 leading-relaxed text-lg mb-6">No hidden charges, instant tickets, and a seamless booking experience for every traveler.</p>
            <ul className="mt-5 space-y-4 text-blue-900 font-medium">
              {[
                'Best fares on popular domestic routes',
                'Transparent pricing with GST-ready invoices',
                'Instant ticket PDF on confirmation',
                'Secure payments powered by Razorpay'
              ].map((item, i) => (
                <li 
                  key={i} 
                  className="flex items-center gap-3 fade-in-on-scroll"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <span className="text-2xl">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link 
              to="/flights" 
              className="inline-block mt-8 bg-blue-700 hover:bg-blue-800 text-white px-7 py-3 rounded-xl shadow-lg text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl transform hover:-translate-y-1"
            >
              Search Flights
            </Link>
          </div>
        </section>

        {/* Popular Flight Routes (new ixigo-style component) */}
        <div className="mx-4 my-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 fade-in-on-scroll">
          <PopularFlightRoutes />
        </div>

        {/* How it works */}
  <section className="max-w-7xl mx-auto px-6 py-12 fade-in-on-scroll">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">How it works</h3>
          <p className="text-center text-slate-600 mb-8">Simple steps to book your perfect flight</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🔎', title: 'Search', desc: 'Find flights by city, date, and class', color: 'from-blue-500 to-blue-600' },
              { icon: '💳', title: 'Book', desc: 'Pay securely with Razorpay', color: 'from-emerald-500 to-emerald-600' },
              { icon: '🧾', title: 'Get Ticket', desc: 'Receive your ticket PDF in email', color: 'from-amber-500 to-amber-600' }
            ].map((step, i) => (
              <div 
                key={i}
                className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 text-center hover-lift scale-in-on-scroll group relative overflow-hidden"
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                     style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                ></div>
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                <h4 className="mt-2 font-bold text-xl text-blue-900 mb-2">{step.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                <div className="mt-4 text-blue-500 font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Step {i + 1}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
  <section className="bg-gradient-to-b from-white to-blue-50 fade-in-on-scroll">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">What travelers say</h3>
            <p className="text-center text-slate-600 mb-8">Real experiences from our customers</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Aman, Delhi', text: 'Smooth booking and instant ticket on email. Prices were competitive!', avatar: '👨‍💼' },
                { name: 'Priya, Bengaluru', text: 'Loved the clean UI and quick Razorpay checkout. 5 stars.', avatar: '👩‍💼' },
                { name: 'Rahul, Mumbai', text: 'Got my refund quickly after a schedule change. Support was helpful.', avatar: '👨‍💻' },
              ].map((t, i) => (
                <div 
                  key={i} 
                  className="border rounded-xl shadow-lg p-8 bg-gradient-to-br from-blue-50 to-blue-100 hover-lift scale-in-on-scroll group"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl border-2 border-white shadow-md">
                      {t.avatar}
                    </div>
                    <div className="text-amber-500 text-lg">★★★★★</div>
                  </div>
                  <p className="mt-3 text-blue-900 font-medium leading-relaxed">"{t.text}"</p>
                  <div className="mt-4 text-sm text-blue-700 font-semibold flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-blue-700"></span>
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* Bottom CTA */}
        <section className="max-w-7xl mx-auto px-6 py-12 fade-in-on-scroll">
          <div className="rounded-2xl border shadow-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-6 hover-glow relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-300 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-2">Plan your next journey</h3>
              <p className="text-blue-100 text-lg">Find great fares across popular routes in India.</p>
            </div>
            <Link 
              to="/flights" 
              className="relative z-10 bg-white text-blue-900 font-bold px-8 py-4 rounded-xl shadow-2xl hover:bg-blue-50 text-lg transition-all duration-300 transform hover:scale-110 hover:-translate-y-1"
            >
              Search Flights
            </Link>
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
