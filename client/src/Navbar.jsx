import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import logo from './Assets/flight-logo.png';
import { accesstoken } from './Components/redux/tokenSlice';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faClose, faUser } from '@fortawesome/free-solid-svg-icons';

function Navbar() {
  const token = useSelector(accesstoken);
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const navigate = useNavigate();

  return (
    <nav className='w-full'>
      <div className='relative flex'>
        {/* Toggle mobile menu button */}
        <div className='flex items-center sm:hidden'>
          <button
            type='button'
            className='fixed top-1 inline-flex items-center justify-center p-2 rounded-md text-blue-950 text-xl hover:text-white hover:bg-gray-700 focus:outline-none'
            onClick={() => {
              if (!token) {
                navigate('/login');
              } else {
                toggleMenu();
              }
            }}
          >
            {isOpen ? <FontAwesomeIcon icon={faTimes} /> : <FontAwesomeIcon icon={faBars} />}
          </button>
        </div>

        {/* Desktop Navbar */}
        <div className='hidden sm:flex flex-rows w-full bg-hero-img box-content py-4 px-10'>
          <div className='flex flex-row w-full justify-between items-center'>
            {/* Logo */}
            <NavLink to='/' className='flex flex-row text-white gap-2 font-semibold text-xl'>
              <img src={logo} alt='logo' className='absolute w-24 h-24 -mt-8 -ml-9' />
              <h6 className='ml-8'>FlightHub</h6>
            </NavLink>

            {/* Links */}
            <div className='flex flex-row gap-5 text-white font-medium text-lg'>
              <NavLink to='/flights' className={({ isActive }) => (isActive ? 'activelink' : 'pendinglink')}>
                Flights
              </NavLink>
              <NavLink to='/bookings' className={({ isActive }) => (isActive ? 'activelink' : 'pendinglink')}>
                Bookings
              </NavLink>
              <NavLink to='/contact' className={({ isActive }) => (isActive ? 'activelink' : 'pendinglink')}>
                Contact Us
              </NavLink>
              {/* ✅ Admin link visible to all */}
             
                
             
            </div>

            {/* User Icon */}
            <div className='text-white text-xl ml-4'>
              <Link to={token ? '/profile' : '/signup'} title={token ? 'Profile' : 'Sign Up'}>
                <FontAwesomeIcon icon={faUser} className='hover:text-gray-300 cursor-pointer' />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Menu */}
        <div
          className={`sm:hidden fixed max-h-screen z-50 inset-y-0 left-0 top-0 w-64 bg-blue-950 overflow-y-auto transition duration-500 transform ${
            isOpen ? 'translate-x-0 ease-in' : '-translate-x-full ease-out'
          }`}
        >
          <button
            className='absolute right-0 left-0 py-3 text-white hover:text-gray-500 focus:outline-none'
            onClick={closeMenu}
          >
            <FontAwesomeIcon icon={faClose} className='text-2xl' />
          </button>

          <div className='px-2 mt-12 pt-2 pb-3 divide-y-2 divide-gray-400 space-y-1'>
            <Link to='/' className='text-white block px-3 py-2 rounded-md text-base font-medium' onClick={closeMenu}>
              Home
            </Link>
            <Link
              to='/bookings'
              className='text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
              onClick={closeMenu}
            >
              Bookings
            </Link>
            <Link
              to='/contact'
              className='text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
              onClick={closeMenu}
            >
              Contact Us
            </Link>
            {/* ✅ Admin link in mobile menu */}
            <Link
              to='/admin/login'
              className='text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
              onClick={closeMenu}
            >
              Admin
            </Link>

            {/* Show auth links only if not logged in */}
            {!token && (
              <>
                <Link
                  to='/login'
                  className='text-gray-900 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to='/signup'
                  className='text-gray-900 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
