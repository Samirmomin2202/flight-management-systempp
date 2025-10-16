// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import Home from "./Components/Home";
import Navbar from "./Navbar";
import Flights from "./Components/Flights";
import Bookings from "./Components/Bookings";
import Contact from "./Components/Contact";
import Login from "./Components/Auth/Login";
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

import { useAdminStore } from "./stores/adminStore";
import { accesstoken } from "./Components/redux/tokenSlice";
import { user } from "./Components/redux/userSlice";

// Protected Admin Route
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated());
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

const AppContent = () => {
  const location = useLocation();
  const token = useSelector(accesstoken);
  const users = useSelector(user);

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

  return (
    <div className="min-h-screen w-full flex flex-col">
      {!shouldHideLayout && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/bookings" element={<Bookings />} />          {/* List of bookings */}
  <Route path="/booked" element={<Bookings />} />            {/* Legacy entry - show bookings list */}
        <Route path="/bookings/:id" element={<Booked />} />        {/* View single ticket */}
        <Route path="/ticket/:id" element={<ViewTicket />} />      {/* Enhanced ticket view */}
        <Route path="/booked/:id" element={<Booked />} />         {/* Single booking view */}
  <Route path="/details" element={<Details />} />          {/* User details form before booking */}
  <Route path="/details/:id" element={<Details />} />      {/* User details form after booking */}
        <Route path="/flight-info/:id" element={<FlightDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />
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

      {!shouldHideLayout && <Footer />}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
