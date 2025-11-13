import React, { useEffect, useMemo, useState } from "react";
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
import heroImage from "../Assets/hero-image.jpeg";
import { listAirlines } from "../api/airlinesApi";
import AirlineStrip from "./AirlineStrip";

const Flights = () => {
  const [allFlights, setAllFlights] = useState([]); // raw from API
  const [flights, setFlights] = useState([]); // upcoming only
  const [filteredFlights, setFilteredFlights] = useState([]);
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
  const [airlines, setAirlines] = useState([]);
  const PRICE_MIN = 0;
  const PRICE_MAX = 100000;
  const [priceRange, setPriceRange] = useState({ absMin: PRICE_MIN, absMax: PRICE_MAX, min: PRICE_MIN, max: PRICE_MAX });
  const API_URL = "http://localhost:5000/api/flights";
  const navigate = useNavigate();
  // Store helpers
  const { getBookedFlight, getPassengers } = useFlightStore();

  // Memoized list of unique airlines for filter dropdown
  const airlineOptions = useMemo(
    () => Array.from(new Set((allFlights || []).map((f) => f.airline).filter(Boolean))),
    [allFlights]
  );
  // Map airline name -> logo for quick lookup in flight cards
  const API_BASE = "http://localhost:5000"; // TODO: move to env for production
  const airlineLogoMap = useMemo(() => {
    const map = {};
    const normalize = (p) => {
      if (!p) return null;
      if (/^https?:/i.test(p)) return p; // already absolute
      const cleaned = p.replace(/^\.\//, "");
      if (cleaned.startsWith("uploads/")) return `${API_BASE}/${cleaned}`;
      if (cleaned.startsWith("/uploads/")) return `${API_BASE}${cleaned}`;
      return cleaned; // assume public folder or direct asset
    };
    (airlines || []).forEach(a => {
      if (a?.name) {
        const key = a.name.toLowerCase().trim();
        const raw = a.tailLogoUrl || a.logoUrl;
        map[key] = normalize(raw);
      }
    });
    return map;
  }, [airlines]);

  // Helper to resolve logo even if naming mismatches slightly
  const resolveAirlineLogo = (name) => {
    if (!name) return null;
    const norm = name.toLowerCase().trim();
    if (airlineLogoMap[norm]) return airlineLogoMap[norm];
    const compact = norm.replace(/\s+/g,' ');
    if (airlineLogoMap[compact]) return airlineLogoMap[compact];
    const partial = Object.entries(airlineLogoMap).find(([k]) => compact.includes(k));
    if (partial) return partial[1];
    return null;
  };

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

  const fetchFlights = React.useCallback(async () => {
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
  }, [fetchFlights]);

  // Fetch airlines with logos (seeded automatically on backend)
  useEffect(() => {
    (async () => {
      try {
        const data = await listAirlines();
        setAirlines(data);
      } catch (e) {
        console.warn('Failed loading airlines', e.message);
      }
    })();
  }, []);

  // Re-apply current filters when showAll toggles or lists update
  const runFilter = React.useCallback(() => {
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
        {/* Airline logos strip */}
        <AirlineStrip airlines={airlines} />
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
          filteredFlights.map((f) => {
            const airlineName = f.airline || '';
            const logo = resolveAirlineLogo(airlineName);
            const slug = airlineName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
            const publicLogo = slug ? `/airlines/${slug}.png` : null;
            const chosenLogo = publicLogo || logo; // public preferred
            return (
            <div key={f._id} className="bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 p-4 flex items-center gap-4">
              {/* Airline */}
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                <FlightCardLogo airlineName={airlineName} dbUrl={logo} />
              </div>
              <div className="min-w-[140px]">
                <div className="text-sm text-gray-500">Airline</div>
                <div className="text-2xl font-extrabold text-blue-800">{airlineName || '—'}</div>
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
          ); })
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
// Inline utility to create a JSX fallback if <img> fails (used inside onError where hooks not available)
function GeneratedLogoElement(name){
  const initials = (name||'AL')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0,2)
    .map(w=>w[0].toUpperCase())
    .join('');
  // deterministic color
  let hash=0; for (let i=0;i<name.length;i++){ hash = name.charCodeAt(i) + ((hash<<5)-hash); }
  const palette=[["#1e3a8a","#2563eb"],["#7c2d12","#ea580c"],["#064e3b","#10b981"],["#581c87","#7e22ce"],["#0f172a","#334155"],["#78350f","#d97706"]];
  const colors = palette[Math.abs(hash)%palette.length];
  const div = document.createElement('div');
  div.className='w-full h-full flex items-center justify-center font-bold text-white text-xs';
  div.style.background=`linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  div.textContent=initials||'AL';
  div.title=name;
  return div;
}

// React component fallback version
const GeneratedLogo = ({name}) => {
  const initials = (name||'AL')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0,2)
    .map(w=>w[0].toUpperCase())
    .join('');
  let hash=0; for (let i=0;i<name.length;i++){ hash = name.charCodeAt(i) + ((hash<<5)-hash); }
  const palette=[["#1e3a8a","#2563eb"],["#7c2d12","#ea580c"],["#064e3b","#10b981"],["#581c87","#7e22ce"],["#0f172a","#334155"],["#78350f","#d97706"]];
  const colors = palette[Math.abs(hash)%palette.length];
  return (
    <div
      className="w-full h-full flex items-center justify-center font-bold text-white text-xs"
      style={{background:`linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`}}
      title={name}
    >{initials||'AL'}</div>
  );
};

// Flight card logo with multi-source fallback (.png/.jpg/.jpeg + DB + default + generated)
const FlightCardLogo = ({ airlineName, dbUrl }) => {
  const slug = (airlineName||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const noSpace = (airlineName||'').toLowerCase().replace(/\s+/g,'');
  const sources = [
    slug && `/airlines/${slug}/logo.png`,
    slug && `/airlines/${slug}/logo.jpg`,
    slug && `/airlines/${slug}/logo.jpeg`,
    slug && `/airlines/${slug}.png`,
    slug && `/airlines/${slug}.jpg`,
    slug && `/airlines/${slug}.jpeg`,
    noSpace && `/airlines/${noSpace}.png`,
    noSpace && `/airlines/${noSpace}.jpg`,
    noSpace && `/airlines/${noSpace}.jpeg`,
    dbUrl || null,
    '/airlines/default.svg'
  ].filter(Boolean);
  const [idx, setIdx] = React.useState(0);
  const current = sources[idx];
  const handleError = (e) => {
    if (idx < sources.length - 1) setIdx(i => i + 1); else {
      // Final fallback: replace with generated logo element
      e.currentTarget.replaceWith(GeneratedLogoElement(airlineName));
    }
  };
  const handleLoad = (e) => {
    if (!/(^emirates$|^air india$|^akasa air$)/i.test(airlineName)) return;
    try {
      const img = e.currentTarget;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      const { width, height } = canvas;
      const imgData = ctx.getImageData(0,0,width,height);
      const d = imgData.data;
      const samples = [];
      const pushSample = (x,y)=>{ const i=(y*width+x)*4; samples.push([d[i],d[i+1],d[i+2]]); };
      pushSample(0,0); pushSample(width-1,0); pushSample(0,height-1); pushSample(width-1,height-1); pushSample(Math.floor(width/2),0); pushSample(Math.floor(width/2),height-1);
      const avg = samples.reduce((a,[r,g,b])=>[a[0]+r,a[1]+g,a[2]+b],[0,0,0]).map(v=>v/samples.length);
      const [br,bg,bb] = avg; const brightness = (br+bg+bb)/3;
      for (let i=0;i<d.length;i+=4){
        const r=d[i], g=d[i+1], b=d[i+2];
        const pixelBrightness=(r+g+b)/3;
        const max=Math.max(r,g,b), min=Math.min(r,g,b);
        const saturation = max===0?0: (max-min)/max;
        if (pixelBrightness > 180 && Math.abs(pixelBrightness-brightness) < 40 && saturation < 0.15){
          d[i+3]=0;
        }
      }
      ctx.putImageData(imgData,0,0);
      // Crop edges
      let top=0,bottom=height-1,left=0,right=width-1;
      const isRowTransparent = (y)=>{ for(let x=0;x<width;x++){ const ii=(y*width+x)*4; if(d[ii+3]>10) return false; } return true; };
      const isColTransparent = (x)=>{ for(let y=0;y<height;y++){ const ii=(y*width+x)*4; if(d[ii+3]>10) return false; } return true; };
      while(top<bottom && isRowTransparent(top)) top++;
      while(bottom>top && isRowTransparent(bottom)) bottom--;
      while(left<right && isColTransparent(left)) left++;
      while(right>left && isColTransparent(right)) right--;
      const cropW = right-left+1; const cropH = bottom-top+1;
      const cropped = ctx.getImageData(left,top,cropW,cropH);
      canvas.width=cropW; canvas.height=cropH; ctx.putImageData(cropped,0,0);
      img.src = canvas.toDataURL('image/png');
    } catch {}
  };
  if (!current) return <GeneratedLogo name={airlineName || 'FL'} />;
  return (
    <img
      src={current}
      alt={airlineName}
      className="w-full h-full object-contain p-2"
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};