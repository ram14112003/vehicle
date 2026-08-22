import React from "react";
import { Mail, Phone, Car } from "lucide-react";
import { Link } from "react-router-dom";

const SimpleHeader: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-sm">
      {/* 🔝 Top contact bar */}
      <div className="w-full bg-[#f8f9fa] border-b border-gray-200 text-sm">
        <div className="container mx-auto px-4 py-1.5 flex flex-col sm:flex-row justify-between items-center text-gray-700">
          {/* Email */}
          <div className="flex items-center space-x-2 mb-1 sm:mb-0">
            <Mail size={14} className="text-amber-600" />
            <a
              href="mailto:support@easyride.in"
              className="hover:text-amber-600 text-[13px] font-medium"
            >
              support@easyride.in
            </a>
          </div>

          {/* Phone Numbers */}
          <div className="flex items-center space-x-3">
            <Phone size={14} className="text-amber-600" />
            <a
              href="tel:9841722675"
              className="hover:text-amber-600 text-[13px] font-medium"
            >
              +91 98417 22675
            </a>
            <span className="text-gray-400">/</span>
            <a
              href="tel:9003241571"
              className="hover:text-amber-600 text-[13px] font-medium"
            >
              +91 90032 41571
            </a>
          </div>
        </div>
      </div>

      {/* 🟩 Logo Section */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-start">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Car className="text-slate-950 w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Easy<span className="text-amber-500 ml-0.5">Ride</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase -mt-1">
              Reliable Rides Everyday
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default SimpleHeader;