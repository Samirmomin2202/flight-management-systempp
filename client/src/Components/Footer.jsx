import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebook,
  faTwitter,
  faLinkedin,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <div className="border-t mt-12 py-6 bg-white">
      {/* Social Icons */}
      <div className="flex justify-center space-x-6 text-2xl">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-900 hover:text-blue-700"
        >
          <FontAwesomeIcon icon={faFacebook} />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-400"
        >
          <FontAwesomeIcon icon={faTwitter} />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-900 hover:text-blue-700"
        >
          <FontAwesomeIcon icon={faLinkedin} />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-500"
        >
          <FontAwesomeIcon icon={faInstagram} />
        </a>
      </div>

      {/* Copyright */}
      <p className="text-center text-sm text-gray-500 mt-4">
        &copy; {new Date().getFullYear()} Travel. All rights reserved.
      </p>
    </div>
  );
};

export default Footer;
