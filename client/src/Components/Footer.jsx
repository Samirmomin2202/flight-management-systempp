import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../Assets/flight-logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebook,
  faTwitter,
  faLinkedin,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="mt-12 bg-blue-950 text-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & About */}
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="FlightHub" className="w-10 h-10 object-contain" />
              <span className="text-xl font-semibold">FlightHub</span>
            </div>
            <p className="mt-3 text-sm text-blue-200 leading-relaxed">
              Your one-stop platform to search flights, book tickets, and manage your journeys with ease.
              Trusted by travelers across India.
            </p>
            <div className="mt-4 flex items-center gap-4 text-2xl">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/flights" className="hover:underline">Flights</Link></li>
              <li><Link to="/bookings" className="hover:underline">Bookings</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Admin</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin/login" className="hover:underline">Admin Login</Link></li>
              <li><Link to="/admin/dashboard" className="hover:underline">Dashboard</Link></li>
              <li><Link to="/admin/flights" className="hover:underline">Manage Flights</Link></li>
              <li><Link to="/admin/bookings" className="hover:underline">Manage Bookings</Link></li>
              <li><Link to="/admin/users" className="hover:underline">Manage Users</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <span className="block text-blue-300">Email</span>
                <a href="mailto:support@flighthub.com" className="hover:underline text-blue-100">support@flighthub.com</a>
              </li>
              <li>
                <span className="block text-blue-300">Phone</span>
                <a href="tel:+919876543210" className="hover:underline text-blue-100">+91 98765 43210</a>
              </li>
              <li>
                <span className="block text-blue-300">Address</span>
                <span>Ahmedabad, Gujarat, India</span>
              </li>
              <li>
                <span className="block text-blue-300">Support Hours</span>
                <span>Mon–Sat, 9:00 AM – 6:00 PM IST</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-blue-800 flex flex-col md:flex-row items-center justify-between text-sm text-blue-300 gap-3">
          <p>© {new Date().getFullYear()} FlightHub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="hover:underline">Support</Link>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
