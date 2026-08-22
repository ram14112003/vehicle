import React from "react";
import { Link } from "react-router-dom";
import { Car, Phone, Mail, MapPin, ShieldCheck, Clock, Award } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-slate-800/80 mb-12">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-base">On-Time Guarantee</h4>
              <p className="text-xs text-slate-400 mt-0.5">Prompt pickup & real-time tracking for peace of mind.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-base">Verified & Safe Chauffeurs</h4>
              <p className="text-xs text-slate-400 mt-0.5">Background-checked, experienced professional drivers.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Award size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-base">Transparent Pricing</h4>
              <p className="text-xs text-slate-400 mt-0.5">No hidden charges. Clear upfront estimated fares.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
                <Car className="text-slate-950 w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Easy<span className="text-amber-500">Ride</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Your trusted partner for city commutes, outstation getaways, corporate transport, and premium chauffeur-driven cab services.
            </p>
            <div className="space-y-2 pt-2 text-sm">
              <a href="tel:+919841722675" className="flex items-center gap-3 text-slate-300 hover:text-amber-400 transition-colors">
                <Phone size={16} className="text-amber-500" />
                <span>+91 98417 22675</span>
              </a>
              <a href="mailto:support@easyride.in" className="flex items-center gap-3 text-slate-300 hover:text-amber-400 transition-colors">
                <Mail size={16} className="text-amber-500" />
                <span>support@easyride.in</span>
              </a>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={16} className="text-amber-500" />
                <span>Chennai & Pan-India Corporate Hubs</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-amber-400 transition-colors font-medium text-amber-400">Book a Ride</Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-amber-400 transition-colors">My Bookings</Link>
              </li>
              <li>
                <a href="/#fleet" className="hover:text-amber-400 transition-colors">Fleet & Cars</a>
              </li>
              <li>
                <a href="/#why-us" className="hover:text-amber-400 transition-colors">Why Choose Us</a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li><span className="text-slate-400">City Point-to-Point</span></li>
              <li><span className="text-slate-400">Airport & Railway Transfers</span></li>
              <li><span className="text-slate-400">Outstation Round Trips</span></li>
              <li><span className="text-slate-400">Hourly Local Rentals</span></li>
              <li><span className="text-slate-400">Corporate Employee Commute</span></li>
            </ul>
          </div>

          {/* Corporate & Legal */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Corporate & Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/adminlogin" className="hover:text-amber-400 transition-colors">Staff / Vendor Portal</Link>
              </li>
              <li>
                <Link to="/fromdata" className="hover:text-amber-400 transition-colors">Attach Car / Partner</Link>
              </li>
              <li>
                <Link to="/TermsAndConditions" className="hover:text-amber-400 transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/PrivacyPolicy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/CancelReservation" className="hover:text-amber-400 transition-colors">Cancellation Policy</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EasyRide. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <span>Built with precision for fast, seamless cab bookings.</span>
          </p>
        </div>


      </div>
    </footer>
  );
};

export default Footer;
