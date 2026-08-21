import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Car, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  Users, 
  Star 
} from "lucide-react";

import Navbar from "../Navigation/Navbar";
import Footer from "../Navigation/Footer";
import QuickBookingWidget from "../Booking/QuickBookingWidget";

const VEHICLE_FLEET = [
  {
    name: "Sedan Prime",
    category: "City & Business",
    seats: 4,
    luggage: "2 Bags",
    startingFare: 250,
    ratePerKm: 14,
    description: "Dzire, Etios, or similar with comfortable AC seating and spacious trunk.",
    image: "/images/step2.jpeg",
    tag: "Most Popular"
  },
  {
    name: "SUV / Innova",
    category: "Family & Outstation",
    seats: 6,
    luggage: "4 Bags",
    startingFare: 450,
    ratePerKm: 19,
    description: "Innova, Ertiga with premium comfort, extra legroom, and generous luggage capacity.",
    image: "/images/step3.jpeg",
    tag: "Extra Space"
  },
  {
    name: "Mini / Hatchback",
    category: "Daily Commute",
    seats: 4,
    luggage: "1 Bag",
    startingFare: 180,
    ratePerKm: 12,
    description: "WagonR, Swift for fast, economical point-to-point city transfers.",
    image: "/images/step1.jpeg",
    tag: "Budget Friendly"
  },
  {
    name: "Executive Luxury",
    category: "Corporate VIP",
    seats: 4,
    luggage: "3 Bags",
    startingFare: 800,
    ratePerKm: 28,
    description: "Camry, Mercedes with elite chauffeurs for corporate executives and VIP guests.",
    image: "/images/GRACELOGO.jpg",
    tag: "Premium VIP"
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Enter Your Route",
    description: "Choose your pickup point, drop destination, and preferred date/time.",
    icon: MapPin
  },
  {
    step: "02",
    title: "Select Your Cab",
    description: "Compare vehicle types, seating capacities, and transparent upfront fares.",
    icon: Car
  },
  {
    step: "03",
    title: "Confirm & Ride",
    description: "Enter your contact details and get instant confirmation with real-time tracking.",
    icon: CheckCircle2
  }
];

const WHY_CHOOSE_ITEMS = [
  {
    title: "On-Time Pickup Guarantee",
    description: "Our professional chauffeurs arrive 10 minutes prior to your scheduled pickup time.",
    icon: Clock
  },
  {
    title: "100% Verified Chauffeurs",
    description: "Background-checked, polite, and well-trained corporate drivers for your safety.",
    icon: ShieldCheck
  },
  {
    title: "Transparent Fixed Pricing",
    description: "No surge pricing surprises. Upfront estimated rates with detailed receipts.",
    icon: CreditCard
  },
  {
    title: "Clean & Sanitized Fleet",
    description: "Every vehicle is inspected, air-conditioned, and sanitized before every trip.",
    icon: Sparkles
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar transparent={false} />

      {/* ================= HERO SECTION WITH BOOKING WIDGET ================= */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> Professional Cab Booking in Chennai & Pan-India
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
                Book Your Ride <br />
                <span className="text-amber-400">Fast, Simple & Safe</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                Experience seamless city commutes, airport transfers, and outstation trips with verified chauffeurs and transparent upfront fares.
              </p>

              {/* Quick Trust Highlights */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-amber-400" /> Instant Booking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-amber-400" /> Transparent Rates
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-amber-400" /> 24/7 Dedicated Support
                </span>
              </div>

            </div>

            {/* Right Hero Booking Widget */}
            <div className="lg:col-span-6 w-full max-w-xl mx-auto">
              <QuickBookingWidget />
            </div>

          </div>
        </div>
      </section>

      {/* ================= VEHICLE FLEET & CATEGORIES ================= */}
      <section id="fleet" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600">Our Modern Fleet</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Choose the Perfect Vehicle for Your Journey
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            From quick solo commutes to spacious family outstations and executive luxury cars.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VEHICLE_FLEET.map((fleet) => (
            <div
              key={fleet.name}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl border border-slate-100 transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {fleet.tag}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ₹{fleet.ratePerKm}/km
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  {fleet.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  {fleet.category}
                </p>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                  {fleet.description}
                </p>

                <div className="flex items-center gap-4 py-3 my-4 border-y border-slate-100 text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-amber-500" /> {fleet.seats} Seats
                  </span>
                  <span>•</span>
                  <span>{fleet.luggage}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">Fares from</span>
                  <span className="text-lg font-black text-slate-900">₹{fleet.startingFare}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/book")}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Book {fleet.name}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS (3 SIMPLE STEPS) ================= */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">Simple Process</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              How to Book Your Grace Cab in 3 Steps
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              No complicated screens, repeated details, or confusing navigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {HOW_IT_WORKS_STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700/80 relative space-y-4 hover:border-amber-500/50 transition-colors"
                >
                  <span className="text-3xl font-black text-amber-400 font-mono">
                    {item.step}
                  </span>
                  
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Car size={20} />
              Start Your Booking Now
            </Link>
          </div>

        </div>
      </section>

      {/* ================= WHY CHOOSE GRACE CABS ================= */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600">The Grace Cabs Advantage</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Trusted by 10,000+ Daily Commuters & Top Corporates
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We focus on one single goal: delivering a safe, punctual, and hassle-free cab ride every single time.
            </p>

            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className="text-xs font-bold text-slate-800 italic">
                "Grace Cabs transformed our daily airport and corporate transfers. Booking takes less than a minute and cars are always spotless."
              </p>
              <span className="text-[11px] font-bold text-slate-500 block">— Corporate Commuter, Chennai</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_CHOOSE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-3 hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
