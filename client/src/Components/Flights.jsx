import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plane, ArrowRight } from "lucide-react";
import FlightFiltersSidebar from "./FlightFiltersSidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useFlightStore from "./zustand store/ZStore";
import { useSelector } from "react-redux";
import Cookies from "js-cookie";
import { accesstoken } from "./redux/tokenSlice";
import { user } from "./redux/userSlice";
import airlineImg from "../Assets/airline.jpg";
import { listAirlines } from "../api/airlinesApi"; // fetch airline data for dynamic logos
import { API_BASE } from "../api/base"; // ensure uploaded logos resolve
import heroImage from "../Assets/hero-image.jpeg";

const Flights = () => {
  const [allFlights, setAllFlights] = useState([]); // raw from API
  const [flights, setFlights] = useState([]); // upcoming only
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [airlines, setAirlines] = useState([]); // list from backend
  const [showAll, setShowAll] = useState(true); // default: show all flights
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
    cabinClass: "All",
  });
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("price"); // price | duration | departure
  const [timeOfDay, setTimeOfDay] = useState("All"); // All | Morning | Afternoon | Evening | Night
  const [airlineFilter, setAirlineFilter] = useState("All");
  const PRICE_MIN = 0;
  const PRICE_MAX = 100000;
  const [priceRange, setPriceRange] = useState({ absMin: PRICE_MIN, absMax: PRICE_MAX, min: PRICE_MIN, max: PRICE_MAX });
  // Use env base (fallback to localhost already handled in API_BASE)
  const API_URL = `${API_BASE}/api/flights`;
  const navigate = useNavigate();
  // Store helpers
  const { getBookedFlight, getPassengers } = useFlightStore();

  // Memoized list of unique airlines for filter dropdown
  const airlineOptions = useMemo(
    () => Array.from(new Set((allFlights || []).map((f) => f.airline).filter(Boolean))),
    [allFlights]
  );

  // Fixed absolute price range like design reference
  useEffect(() => {
    setPriceRange((prev) => ({ absMin: PRICE_MIN, absMax: PRICE_MAX, min: prev.min ?? PRICE_MIN, max: prev.max ?? PRICE_MAX }));
  }, []);

  // Hero slider images (local)
  const heroSlides = useMemo(() => [heroImage, airlineImg], []);
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    if (!heroSlides.length) return;
    const id = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [heroSlides]);

  // No remote slides fetch (reverted)

  // 🔹 Grab token & user from Redux
  const token = useSelector(accesstoken); // token from Redux slice
  const currentUser = useSelector(user);  // user object from Redux slice

  // Filter out past flights
  const filterUpcomingFlights = (flightsArray) => {
    const now = new Date();
    return flightsArray.filter((f) => new Date(f.departure) >= now);
  };

  const getDurationLabel = (dep, arr) => {
    try {
      const ms = new Date(arr) - new Date(dep);
      if (!isFinite(ms) || ms <= 0) return "-";
      const minutes = Math.floor(ms / 60000);
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m}m`;
    } catch {
      return "-";
    }
  };

  const getTimeOfDayBucket = (date) => {
    const h = new Date(date).getHours();
    if (h >= 5 && h < 12) return "Morning";
    if (h >= 12 && h < 17) return "Afternoon";
    if (h >= 17 && h < 21) return "Evening";
    return "Night"; // 21-5
  };

  const fetchFlights = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching flights from:", API_URL);
      const res = await axios.get(API_URL);
      console.log("📡 API Response:", res.data);
      
      if (res.data.success) {
        console.log("✅ Raw flights from API:", res.data.flights);
        setAllFlights(res.data.flights || []);
        const upcomingFlights = filterUpcomingFlights(res.data.flights || []);
        console.log("🕒 Upcoming flights after filtering:", upcomingFlights);
        setFlights(upcomingFlights);
        setFilteredFlights(showAll ? (res.data.flights || []) : upcomingFlights);
      } else {
        console.warn("⚠️ API returned success: false");
      }
    } catch (err) {
      console.error("❌ Error fetching flights:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchFlights();
    // fetch airlines for logo resolution
    (async () => {
      try {
        const data = await listAirlines();
        setAirlines(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn("Failed to load airlines", e);
      }
    })();
  }, [fetchFlights]);

  // Re-apply current filters when showAll toggles or lists update
  const runFilter = useCallback(() => {
    const { from, to, date, cabinClass } = search;
    const base = showAll ? allFlights : flights;
    let filtered = [...base];
    if (from) filtered = filtered.filter((f) => f.from.toLowerCase().includes(from.toLowerCase()));
    if (to) filtered = filtered.filter((f) => f.to.toLowerCase().includes(to.toLowerCase()));
    if (date) {
      filtered = filtered.filter((f) => new Date(f.departure).toISOString().slice(0, 10) === date);
    }
    if (search.cabinClass && search.cabinClass !== "All") {
      filtered = filtered.filter((f) => (f.cabinClass || "Economy") === search.cabinClass);
    }
    if (timeOfDay !== "All") {
      filtered = filtered.filter((f) => getTimeOfDayBucket(f.departure) === timeOfDay);
    }
    if (airlineFilter !== "All") {
      filtered = filtered.filter((f) => (f.airline || "").toLowerCase() === airlineFilter.toLowerCase());
    }
    // Price range
    if (priceRange && (priceRange.min || priceRange.max)) {
      filtered = filtered.filter((f) => {
        const p = Number(f.price) || 0;
        const min = priceRange.min ?? priceRange.absMin;
        const max = priceRange.max ?? priceRange.absMax;
        return p >= min && p <= max;
      });
    }

    // Sorting similar to MMT toggles
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "price") {
        const pa = Number(a.price) || 0;
        const pb = Number(b.price) || 0;
        return sortOrder === "asc" ? pa - pb : pb - pa;
      }
      if (sortBy === "departure") {
        const da = new Date(a.departure).getTime();
        const db = new Date(b.departure).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      }
      const dura = new Date(a.arrival) - new Date(a.departure);
      const durb = new Date(b.arrival) - new Date(b.departure);
      return sortOrder === "asc" ? dura - durb : durb - dura;
    });
    setFilteredFlights(sorted);
  }, [search, showAll, allFlights, flights, timeOfDay, airlineFilter, sortBy, sortOrder]);

  useEffect(() => {
    runFilter();
  }, [showAll, allFlights, flights, runFilter]);

  // Build a lookup map for airline names -> logo URL (tailLogoUrl preferred)
  const airlineLogoMap = useMemo(() => {
    const map = {};
    (airlines || []).forEach(a => {
      if (!a?.name) return;
      const key = a.name.toLowerCase().trim();
      const raw = a.tailLogoUrl || a.logoUrl;
      if (!raw) return;
      // Normalize uploaded path to absolute
      if (/^uploads\//.test(raw)) {
        map[key] = `${API_BASE}/${raw}`;
      } else if (/^\/uploads\//.test(raw)) {
        map[key] = `${API_BASE}${raw}`;
      } else {
        map[key] = raw; // assume public path or full URL
      }
    });
    return map;
  }, [airlines]);

  // Component to attempt multiple public logo paths (then DB logo) with graceful fallback
  const AirlineLogo = ({ name }) => {
    const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const dbLogo = airlineLogoMap[slug];
    const attempts = [
      `/airlines/${slug}/logo.png`,
      `/airlines/${slug}.png`,
      `/airlines/${slug}.jpg`,
      `/airlines/${slug}.jpeg`,
    ];
    if (dbLogo) attempts.push(dbLogo);
    attempts.push(airlineImg); // final placeholder
    const [idx, setIdx] = useState(0);
    const [processedSrc, setProcessedSrc] = useState(null);

    // Airlines requiring background removal
    const needsBgRemoval = ["spicejet","akasa-air","indigo"].includes(slug);

    const handleLoad = (e) => {
      if (!needsBgRemoval || processedSrc) return; // skip if not needed or already processed
      try {
        const img = e.currentTarget;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        const imageData = ctx.getImageData(0,0,w,h);
        const data = imageData.data;
        // Sample corner/background colors
        const sample = (x,y) => {
          const i = (y*w + x)*4; return [data[i],data[i+1],data[i+2]];
        };
        const samples = [
          sample(0,0), sample(w-1,0), sample(0,h-1), sample(w-1,h-1), sample(Math.floor(w/2),0)
        ];
        const avg = samples.reduce((a,c)=>[a[0]+c[0],a[1]+c[1],a[2]+c[2]], [0,0,0]).map(v=>v/samples.length);
        const isBg = (r,g,b) => {
          const brightness = (r+g+b)/3;
          const diff = Math.abs(r-avg[0])+Math.abs(g-avg[1])+Math.abs(b-avg[2]);
          return brightness > 200 && diff < 90; // near-light & similar to avg
        };
        for (let y=0; y<h; y++) {
          for (let x=0; x<w; x++) {
            const i = (y*w + x)*4;
            const r=data[i], g=data[i+1], b=data[i+2];
            if (isBg(r,g,b)) data[i+3]=0; // make transparent
          }
        }
        ctx.putImageData(imageData,0,0);
        // Optional crop transparent edges
        const cropBounds = () => {
          let top=h, left=w, right=0, bottom=0;
          for (let y=0; y<h; y++) {
            for (let x=0; x<w; x++) {
              const a = data[(y*w + x)*4 + 3];
              if (a>0){
                if (y<top) top=y; if (y>bottom) bottom=y; if (x<left) left=x; if (x>right) right=x;
              }
            }
          }
          if (right<=left || bottom<=top) return null;
          return {top,left,right,bottom};
        };
        const b = cropBounds();
        let finalDataUrl = canvas.toDataURL('image/png');
        if (b){
          const cw = b.right - b.left + 1;
          const ch = b.bottom - b.top + 1;
          const c2 = document.createElement('canvas');
          c2.width=cw; c2.height=ch;
          const c2ctx = c2.getContext('2d');
          c2ctx.drawImage(canvas, b.left, b.top, cw, ch, 0,0,cw,ch);
          finalDataUrl = c2.toDataURL('image/png');
        }
        setProcessedSrc(finalDataUrl);
      } catch(err) {
        console.warn('Logo bg removal failed', err);
      }
    };
    return (
      <img
        src={processedSrc || attempts[idx]}
        alt={name || 'Airline'}
        className="w-full h-full object-contain p-1"
        onError={() => setIdx(i => (i < attempts.length - 1 ? i + 1 : i))}
        onLoad={handleLoad}
      />
    );
  };

  const handleChange = (e) => {
    setSearch((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runFilter();
  };

  const handleSort = (field) => {
    setSortBy(field);
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    runFilter();
  };

  // 🔹 New flow: go to details first, collect passengers, then create booking
  const handleBook = (flight) => {
    console.log("� Proceed to details for flight:", flight);
    const authToken = token || Cookies.get("token");
    if (!authToken) {
      toast.info("Please login to continue booking.");
      return navigate(`/login?redirect=${encodeURIComponent('/details')}`);
    }
    // Save selected flight and passengers count in store/localStorage
    getBookedFlight(flight);
    getPassengers(search.passengers || 1);
    // Navigate to details form (no booking created yet)
    navigate("/details");
  };

  return (
    <div className="p-0 md:p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[260px] md:h-[360px] w-full">
          {/* Slides */}
          {heroSlides.map((src, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
          {/* Headline */}
          <div className="relative h-full max-w-6xl mx-auto px-4 flex items-center">
            <div className="text-white">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Best deals are waiting for you</h1>
              <p className="mt-2 text-sm md:text-base text-white/85">Find flights faster with our smart search</p>
            </div>
          </div>

          {/* Search Card */}
          <form
            onSubmit={handleSearch}
            className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[94%] md:w-auto max-w-6xl"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 md:p-4 flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-semibold text-gray-600">From</label>
                <input
                  type="text"
                  name="from"
                  value={search.from}
                  onChange={handleChange}
                  placeholder="City or Airport"
                  className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-semibold text-gray-600">To</label>
                <input
                  type="text"
                  name="to"
                  value={search.to}
                  onChange={handleChange}
                  placeholder="City or Airport"
                  className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="min-w-[160px]">
                <label className="text-xs font-semibold text-gray-600">Departure</label>
                <input
                  type="date"
                  name="date"
                  value={search.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="min-w-[150px]">
                <label className="text-xs font-semibold text-gray-600">Passengers</label>
                <input
                  type="number"
                  name="passengers"
                  min="1"
                  value={search.passengers}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="min-w-[180px]">
                <label className="text-xs font-semibold text-gray-600">Class</label>
                <select
                  name="cabinClass"
                  value={search.cabinClass}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All</option>
                  <option>Economy</option>
                  <option>Premium Economy</option>
                  <option>Business</option>
                  <option>First</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="h-[46px] md:h-[48px] w-[56px] md:w-[56px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg"
                  title="Search"
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
            <div className="mt-2 pl-1">
              <button
                type="button"
                onClick={() => { setSearch({ from: "", to: "", date: "", passengers: 1, cabinClass: "All" }); setShowAll(true); setFilteredFlights(allFlights); setTimeOfDay('All'); setAirlineFilter('All'); setPriceRange({ absMin: PRICE_MIN, absMax: PRICE_MAX, min: PRICE_MIN, max: PRICE_MAX }); runFilter(); }}
                className="text-xs text-gray-700 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>
          </form>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className={`h-2.5 w-2.5 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/70'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
          <Plane className="text-blue-700" /> Available Flights
        </h2>
        {/* Popular Airlines Strip */}
        <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-600">Popular Domestic Airlines</div>
            {airlineFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setAirlineFilter('All')}
                className="text-[11px] text-blue-600 hover:underline"
              >Clear</button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {['Air India','Akasa Air','Alliance Air','Emirates','Indigo','SpiceJet'].map(name => {
              const active = airlineFilter === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setAirlineFilter(prev => prev === name ? 'All' : name)}
                  className={`flex flex-col items-center justify-start rounded-lg px-2 py-2 h-24 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${active ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-50 hover:bg-gray-100'}`}
                  title={name}
                >
                  <div className="h-12 w-full flex items-center justify-center overflow-hidden">
                    <AirlineLogo name={name} />
                  </div>
                  <span className={`mt-1 text-[11px] font-medium text-center w-full truncate ${active ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      {/* Sidebar + Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <FlightFiltersSidebar
            showAll={showAll}
            onToggleShowAll={setShowAll}
            timeOfDay={timeOfDay}
            setTimeOfDay={setTimeOfDay}
            airlineFilter={airlineFilter}
            setAirlineFilter={setAirlineFilter}
            airlineOptions={airlineOptions}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onReload={fetchFlights}
            priceRange={priceRange}
            onPriceChange={(next) => {
              // keep min <= max
              const clamped = {
                absMin: next.absMin,
                absMax: next.absMax,
                min: Math.min(next.min, next.max),
                max: Math.max(next.min, next.max),
              };
              setPriceRange(clamped);
              runFilter();
            }}
          />
        </div>
        <div className="md:col-span-3">
          {/* Results list */}
          <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-5 animate-pulse">
              <div className="h-5 w-1/3 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-6 h-9 w-full bg-gray-200 rounded"></div>
            </div>
          ))
        ) : filteredFlights.length > 0 ? (
          filteredFlights.map((f) => (
            <div key={f._id} className="bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 p-4 flex items-center gap-4">
              {/* Airline */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <AirlineLogo name={f.airline} />
                      </div>
              <div className="min-w-[140px]">
                <div className="text-sm text-gray-500">Airline</div>
                <div className="text-2xl font-extrabold text-blue-800">{f.airline || '—'}</div>
                <div className="text-sm text-gray-700 font-bold">{f.flightNo}</div>
              </div>

              {/* Times */}
              <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                <div>
                  <div className="text-2xl font-bold">{new Date(f.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-xs text-gray-500">{new Date(f.departure).toLocaleDateString()}</div>
                  <div className="text-xl font-extrabold text-slate-900">{f.from}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">{getDurationLabel(f.departure, f.arrival)}</div>
                  <div className="h-0.5 bg-gray-200 my-1" />
                  <div className="text-xs text-gray-500">Non-stop</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{new Date(f.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-xs text-gray-500">{new Date(f.arrival).toLocaleDateString()}</div>
                  <div className="text-xl font-extrabold text-slate-900">{f.to}</div>
                </div>
              </div>

              {/* Right: price & CTA */}
              <div className="min-w-[160px] text-right">
                <div className="text-xl font-bold text-green-700">₹{Number(f.price).toLocaleString('en-IN')}</div>
                <div className="flex gap-2 justify-end mt-2">
                  {f.cabinClass && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{f.cabinClass}</span>
                  )}
                  {typeof f.seatCapacity !== 'undefined' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{f.seatCapacity} seats</span>
                  )}
                </div>
                <button
                  onClick={() => handleBook(f)}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full"
                >
                  Book
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center col-span-full text-gray-600 space-y-3">
            <p>No flights match your filters.</p>
            <div>
              <button
                type="button"
                onClick={() => { setSearch({ from: "", to: "", date: "", passengers: 1, cabinClass: "All" }); setTimeOfDay('All'); setAirlineFilter('All'); setShowAll(true); setFilteredFlights(allFlights); }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Flights;