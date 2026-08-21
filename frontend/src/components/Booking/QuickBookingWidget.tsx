import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Navigation, 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  Users, 
  Search
} from "lucide-react";


interface QuickBookingWidgetProps {
  initialPickup?: string;
  initialDrop?: string;
  onSearch?: (data: BookingWidgetData) => void;
  compact?: boolean;
}

export interface BookingWidgetData {
  pickup: string;
  drop: string;
  date: string;
  time: string;
  tripType: "oneway" | "roundtrip";
  passengers: number;
}

const POPULAR_LOCATIONS = [
  "Chennai Airport (MAA)",
  "Chennai Central Railway Station",
  "Koyambedu CMBT",
  "OMR IT Corridor (Tidel Park)",
  "T. Nagar",
  "Guindy",
  "Anna Nagar",
  "Tambaram"
];

export const QuickBookingWidget: React.FC<QuickBookingWidgetProps> = ({
  initialPickup = "",
  initialDrop = "",
  onSearch,
  compact = false,
}) => {
  const navigate = useNavigate();

  // Get current date/time in YYYY-MM-DD and HH:MM format
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [pickup, setPickup] = useState(initialPickup);
  const [drop, setDrop] = useState(initialDrop);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeStr);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [passengers, setPassengers] = useState(1);
  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropFocused, setDropFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPickup("Current Location (GPS)");
        },
        () => {
          setPickup("Current Location");
        }
      );
    } else {
      setPickup("Current Location");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim()) {
      setError("Please enter a pickup location");
      return;
    }
    if (!drop.trim()) {
      setError("Please enter a drop destination");
      return;
    }
    setError(null);

    const data: BookingWidgetData = {
      pickup: pickup.trim(),
      drop: drop.trim(),
      date,
      time,
      tripType,
      passengers
    };

    if (onSearch) {
      onSearch(data);
    } else {
      // Navigate to /book with state
      navigate("/book", { state: data });
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-2xl border border-slate-100 ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}`}>
      
      {/* Trip Type Tabs */}
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setTripType("oneway")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tripType === "oneway"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          One-Way City / Outstation
        </button>
        <button
          type="button"
          onClick={() => setTripType("roundtrip")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tripType === "roundtrip"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Round Trip / Hourly Rental
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Pickup and Drop Row */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Pickup Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Pickup Location
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold normal-case flex items-center gap-1"
              >
                <Navigation size={12} /> Use GPS
              </button>
            </label>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin size={18} className="text-emerald-600" />
              </div>
              <input
                type="text"
                value={pickup}
                onChange={(e) => { setPickup(e.target.value); setError(null); }}
                onFocus={() => setPickupFocused(true)}
                onBlur={() => setTimeout(() => setPickupFocused(false), 200)}
                placeholder="Enter pickup address, airport, station..."
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>

            {/* Pickup Suggestions Dropdown */}
            {pickupFocused && !pickup && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-in fade-in zoom-in-95">
                <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">Popular Pickups</p>
                <div className="max-h-48 overflow-y-auto">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onMouseDown={() => setPickup(loc)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2"
                    >
                      <MapPin size={13} className="text-slate-400" /> {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Swap Button (Desktop Centered / Mobile Floating) */}
          <div className="hidden md:flex absolute left-1/2 top-[34px] -translate-x-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Locations"
              className="w-9 h-9 rounded-full bg-white border-2 border-slate-200 hover:border-amber-500 shadow-md flex items-center justify-center text-slate-600 hover:text-amber-600 hover:rotate-180 transition-all"
            >
              <ArrowRightLeft size={14} />
            </button>
          </div>

          {/* Drop Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Drop Destination
              </span>
              <button
                type="button"
                onClick={handleSwap}
                className="md:hidden text-[11px] text-slate-500 hover:text-amber-600 font-semibold normal-case flex items-center gap-1"
              >
                <ArrowRightLeft size={12} /> Swap
              </button>
            </label>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin size={18} className="text-rose-600" />
              </div>
              <input
                type="text"
                value={drop}
                onChange={(e) => { setDrop(e.target.value); setError(null); }}
                onFocus={() => setDropFocused(true)}
                onBlur={() => setTimeout(() => setDropFocused(false), 200)}
                placeholder="Enter destination or landmark..."
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>

            {/* Drop Suggestions Dropdown */}
            {dropFocused && !drop && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-in fade-in zoom-in-95">
                <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">Popular Destinations</p>
                <div className="max-h-48 overflow-y-auto">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onMouseDown={() => setDrop(loc)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2"
                    >
                      <MapPin size={13} className="text-slate-400" /> {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Date, Time & Passengers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pickup Date
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pickup Time
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Clock size={16} />
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Passengers
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Users size={16} />
              </div>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full pl-9 pr-8 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value={1}>1 Passenger</option>
                <option value={2}>2 Passengers</option>
                <option value={3}>3 Passengers</option>
                <option value={4}>4 Passengers (Sedan)</option>
                <option value={6}>6 Passengers (SUV/Innova)</option>
                <option value={7}>7+ Passengers (Tempo)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
          >
            <Search size={22} className="stroke-[2.5]" />
            Find Available Cabs
          </button>
        </div>

      </form>
    </div>
  );
};

export default QuickBookingWidget;
