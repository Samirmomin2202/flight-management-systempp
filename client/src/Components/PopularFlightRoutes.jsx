import React from 'react';
import { Link } from 'react-router-dom';
import airlineImg from '../Assets/airline.jpg';
import heroImg from '../Assets/hero-image.jpeg';
import flightLogo from '../Assets/flight-logo.png';

// Simple data source (can be externalized later)
const ROUTES = [
  { city: 'Mumbai', routes: ['Goa', 'Delhi', 'Bangalore', 'Ahmedabad'], img: heroImg },
  { city: 'Delhi', routes: ['Mumbai', 'Goa', 'Bangalore', 'Pune'], img: airlineImg },
  { city: 'Kolkata', routes: ['Delhi', 'Bangalore', 'Bagdogra'], img: heroImg },
  { city: 'Chennai', routes: ['Mumbai', 'Delhi', 'Madurai', 'Coimbatore'], img: airlineImg },
  { city: 'Hyderabad', routes: ['Mumbai', 'Bangalore', 'Delhi'], img: heroImg },
  { city: 'Ahmedabad', routes: ['Delhi', 'Mumbai', 'Bangalore', 'Goa'], img: airlineImg },
];

/**
 * Displays popular flight origin cities with quick destination chips, inspired by ixigo style.
 */
const PopularFlightRoutes = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900">Popular Flight Routes</h3>
        <Link to="/flights" className="text-sm text-blue-700 hover:text-blue-900 font-semibold">View More →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ROUTES.map((r, i) => (
          <div key={r.city} className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md p-4 transition relative overflow-hidden">
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
              <img src={r.img} alt={r.city + ' flights'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-transparent" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                {r.city} Flights
              </h4>
              <div className="text-xs text-slate-500 mb-0.5">To:</div>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
                {r.routes.map(dest => (
                  <Link
                    key={dest}
                    to={`/flights?from=${encodeURIComponent(r.city)}&to=${encodeURIComponent(dest)}`}
                    className="text-blue-700 hover:text-blue-900 hover:underline whitespace-nowrap"
                  >
                    {dest}
                  </Link>
                ))}
              </div>
            </div>
            {/* subtle right gradient accent */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-blue-50 to-transparent" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularFlightRoutes;
