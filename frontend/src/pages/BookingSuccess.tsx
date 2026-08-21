import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Navigation/Footer";


export const BookingSuccess: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const location = useLocation();
  const state = location.state as any;

  const code = bookingCode || state?.bookingCode || "GRC20260801";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 text-center space-y-6">
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </div>

          <div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              Booking Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Your Ride has been Confirmed!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              We've assigned your request. Driver details will be dispatched prior to pickup.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">Booking ID</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wider">
              {code}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <Link
              to="/my-bookings"
              className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>View My Bookings</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} />
              <span>Back to Home</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingSuccess;
