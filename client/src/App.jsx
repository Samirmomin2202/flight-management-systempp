// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Cookies from "js-cookie";

import Home from "./Components/Home";
import Navbar from "./Navbar";
import Flights from "./Components/Flights";
import Bookings from "./Components/Bookings";
import Contact from "./Components/Contact";
import Login from "./Components/Auth/Login";
import Welcome from "./Components/Auth/Welcome";
import Signup from "./Components/Auth/Signup";
import Booked from "./Components/Booked";
import Footer from "./Components/Footer";

import AdminLogin from "./Components/Admin/AdminLogin";
import Profile from "./Components/Auth/Profile";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import AdminFlights from "./Components/Admin/AdminFlights";
import AdminBookings from "./Components/Admin/AdminBookings";
import AdminUsers from "./Components/Admin/AdminUsers";
import AdminContacts from "./Components/Admin/AdminContacts";
import AdminProfile from "./Components/Admin/AdminProfile";
import FlightDetails from "./Components/FlightDetails";
import ViewTicket from "./Components/ViewTicket";
import Details from "./Components/Details";
import ForgotPassword from "./Components/Auth/ForgotPassword";
import SeatBookingDemo from "./Components/SeatBookingDemo";
import SeatBooking from "./Components/SeatBooking";

import { useAdminStore } from "./stores/adminStore";
import { accesstoken } from "./Components/redux/tokenSlice";
import { user } from "./Components/redux/userSlice";

// Protected Admin Route
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated);
  const adminUser = useAdminStore((state) => state.adminUser);
  const adminToken = useAdminStore((state) => state.adminToken);
  
  const authStatus = isAuthenticated();
  
  console.log("🛡️ ProtectedRoute check:", {
    isAuthenticated: authStatus,
    adminUser: adminUser ? "Exists" : "Missing",
    adminToken: adminToken ? "Set" : "Missing",
    role: adminUser?.role
  });
  
  if (!authStatus || !adminUser || !adminToken) {
    console.log("🚫 Redirecting to admin login - not authenticated");
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

// Simple user auth guard for booking flow
const RequireAuth = ({ children }) => {
  const token = useSelector(accesstoken);
  const cookieToken = Cookies.get("token");
  const location = useLocation();
  if (!token && !cookieToken) {
    const redirect = encodeURIComponent(location.pathname + (location.search || ""));
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const token = useSelector(accesstoken);
  const users = useSelector(user);
  const navigate = useNavigate();
  const [welcomeOverlay, setWelcomeOverlay] = useState(null);

  const hideLayoutRoutes = [
    "/login",
    "/signup",
    "/admin/login",
    "/admin/dashboard",
    "/admin/flights",
    "/admin/bookings",
    "/admin/users",
    "/admin/contacts",
    
  ];
  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Show a transient welcome overlay on top of the current page (e.g., Home)
  useEffect(() => {
    const s = location.state;
    if (s && s.showWelcomeOverlay) {
      setWelcomeOverlay({ name: s.welcomeName || "" });
      // Clear state so back/forward doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Hide overlay after a short delay once shown. This avoids StrictMode double-effect issues.
  useEffect(() => {
    if (!welcomeOverlay) return;
    const t = setTimeout(() => setWelcomeOverlay(null), 3000);
    return () => clearTimeout(t);
  }, [welcomeOverlay]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      {!shouldHideLayout && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
      )}

  <div className={shouldHideLayout ? "" : "flex-1 pt-14"}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/bookings" element={<Bookings />} />          {/* List of bookings */}
        <Route path="/booked" element={<Bookings />} />            {/* Legacy entry - show bookings list */}
        <Route path="/bookings/:id" element={<Booked />} />        {/* View single ticket */}
        <Route path="/ticket/:id" element={<ViewTicket />} />      {/* Enhanced ticket view */}
        <Route path="/booked/:id" element={<Booked />} />         {/* Single booking view */}
  <Route path="/details" element={<RequireAuth><Details /></RequireAuth>} />          {/* User details form before booking */}
  <Route path="/details/:id" element={<RequireAuth><Details /></RequireAuth>} />      {/* User details form after booking */}
        <Route path="/flight-info/:id" element={<FlightDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<RequireAuth><Welcome /></RequireAuth>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile />} />
  <Route path="/demo/seats" element={<SeatBookingDemo />} />
  <Route path="/demo/seat-grid" element={<SeatBooking />} />

        {/* Admin Protected Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/flights"
          element={
            <ProtectedRoute>
              <AdminFlights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute>
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contacts"
          element={
            <ProtectedRoute>
              <AdminContacts />
            </ProtectedRoute>
          }
        />
      </Routes>
      </div>
      {!shouldHideLayout && <Footer />}

      {/* Global welcome overlay */}
      {welcomeOverlay && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-blue-100 p-10 text-center">
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900">
              Welcome to Flight Hub, <span className="text-amber-400">{welcomeOverlay.name || "Traveler"}</span>
            </h2>
            <p className="mt-2 text-slate-700">We’re getting things ready for you...</p>
            <p className="mt-2 text-xs text-slate-500">This will just take a second</p>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
