
import React from "react";
import { Mail, Phone } from "lucide-react";
import gracelogo from "../../assets/logo.png";
import { Link } from "react-router-dom";
const SimpleHeader: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-sm">
      {/* 🔝 Top contact bar */}
      <div className="w-full bg-[#f8f9fa] border-b border-gray-200 text-sm">
        <div className="container mx-auto px-4 py-1 flex flex-col sm:flex-row justify-between items-center text-gray-700">
          {/* Email */}
          <div className="flex items-center space-x-2 mb-1 sm:mb-0">
            <Mail size={14} className="text-green-600" />
            <a
              href="mailto:traveldesk@gracecabs.com"
              className="hover:text-green-600 text-[13px]"
            >
              traveldesk@gracecabs.com
            </a>
          </div>

          {/* Phone Numbers */}
          <div className="flex items-center space-x-3">
            <Phone size={14} className="text-green-600" />
            <a
              href="tel:9841722675"
              className="hover:text-green-600 text-[13px]"
            >
              +91 98417 22675
            </a>
            <span className="text-gray-400">/</span>
            <a
              href="tel:9003241571"
              className="hover:text-green-600 text-[13px]"
            >
              +91 90032 41571
            </a>
          </div>
        </div>
      </div>

      {/* 🟩 Logo Section */}
<div className="container mx-auto px-4 py-3 flex items-center justify-start">
  <Link to="/">
    <img
      src={gracelogo}
      alt="Grace Cabs Logo"
      className="w-70 h-auto object-contain mr-3 cursor-pointer"
    />
  </Link>
</div>

    </header>
  );
};

export default SimpleHeader;