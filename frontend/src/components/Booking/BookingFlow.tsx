import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, 
  Car, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  Clock, 
  Calendar, 
  Loader2, 
  ArrowRightLeft, 
  AlertCircle, 
  LogIn 
} from "lucide-react";

import axiosInstance from "../../utils/axiosInstance";
import config from "../../config/config";
import { useAuth } from "../../context/AuthContext";
import { showToast, AlertContainer } from "../AlertBox";
import AuthModal from "../Auth/AuthModal";

export interface VehicleOption {
  id: string;
  vehicleId?: string;
  name: string;
  type: string;
  seats: number;
  image: string;
  baseFare: number;
  perKmRate: number;
  estimatedFare: number;
  estimatedTime: string;
  description: string;
  advanceMinutes: number;
}

export const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Load passed state from QuickBookingWidget or homepage
  const incoming = location.state as any;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Stepper state: 1 = Route & Vehicles, 2 = Review & Rider, 3 = Confirmation Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Booking details
  const [pickup, setPickup] = useState(incoming?.pickup || "");
  const [drop, setDrop] = useState(incoming?.drop || "");
  const [date, setDate] = useState(incoming?.date || todayStr);
  const [time, setTime] = useState(incoming?.time || timeStr);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">(incoming?.tripType || "oneway");
  const [passengers, setPassengers] = useState<number>(incoming?.passengers || 1);

  // Estimated route distance & travel time
  const [distanceKm, setDistanceKm] = useState<number>(20);
  const [estimatedMins, setEstimatedMins] = useState<number>(35);

  // Dynamic vehicles list from DB
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  // Passenger details
  const [riderName, setRiderName] = useState(user?.username || user?.name || "");
  const [riderPhone, setRiderPhone] = useState(user?.mobile || "");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Sync rider details when auth user changes
  useEffect(() => {
    if (user) {
      if (!riderName) setRiderName(user.username || user.name || "");
      if (!riderPhone) setRiderPhone(user.mobile || "");
    }
  }, [user]);

  // Route distance calculation via backend single source of truth
  useEffect(() => {
    let isCurrent = true;
    if (pickup.trim() && drop.trim()) {
      const timer = setTimeout(async () => {
        try {
          const res = await axiosInstance.post("/vehicleType/calculate-distance", {
            pickup: pickup.trim(),
            drop: drop.trim()
          });
          if (isCurrent && res.data?.success && res.data.data?.distanceKm) {
            setDistanceKm(res.data.data.distanceKm);
            setEstimatedMins(res.data.data.durationMins || Math.round(res.data.data.distanceKm * 1.8));
          }
        } catch (err) {
          console.error("Distance API error:", err);
        }
      }, 350);

      return () => {
        isCurrent = false;
        clearTimeout(timer);
      };
    }
  }, [pickup, drop]);

  // Fetch real vehicles from backend database
  const fetchVehicleFleet = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const res = await axiosInstance.get("/vehicleType/vehicleTypeWithVehicles");
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const apiTypes: any[] = res.data.data;
        const BASE_URL = config.baseurl.apibaseurl || "http://localhost:5000";

        const mapped: VehicleOption[] = apiTypes.map((t: any, idx: number) => {
          const seats = t.seatCapacity || 4;
          const typeName = t.vehicleType || `Vehicle Type ${idx + 1}`;
          const firstVeh = t.vehicles?.[0] || t.vehicle?.[0];
          
          let img = "/images/step2.jpeg";
          if (t.vehicleImg && Array.isArray(t.vehicleImg) && t.vehicleImg.length > 0) {
            const raw = t.vehicleImg[0];
            img = raw.startsWith("http") || raw.startsWith("/images") ? raw : `${BASE_URL}/uploads/vehicleImg/${raw}`;
          } else if (firstVeh?.vehicleImg) {
            const rawImg = Array.isArray(firstVeh.vehicleImg) ? firstVeh.vehicleImg[0] : firstVeh.vehicleImg;
            if (rawImg) {
              img = rawImg.startsWith("http") || rawImg.startsWith("/images") ? rawImg : `${BASE_URL}/uploads/vehicleImg/${rawImg}`;
            }
          } else if (typeName.toLowerCase().includes("suv") || typeName.toLowerCase().includes("innova")) {
            img = "/images/step3.jpeg";
          } else if (typeName.toLowerCase().includes("hatch")) {
            img = "/images/step1.jpeg";
          }

          // Dynamic Base Fare & Per KM Rate from DB (configured by Admin)
          const baseRate = (t.baseFare !== undefined && t.baseFare !== null && Number(t.baseFare) > 0)
            ? Number(t.baseFare)
            : 250;
          const kmRate = (t.perKmRate !== undefined && t.perKmRate !== null && Number(t.perKmRate) > 0)
            ? Number(t.perKmRate)
            : 14;


          const multiplier = tripType === "roundtrip" ? 1.8 : 1.0;
          const fare = Math.round(baseRate + (distanceKm * kmRate * multiplier));

          return {
            id: t.vehicleTypeId,
            vehicleId: firstVeh?.vehicleId || undefined,
            name: typeName,
            type: typeName,
            seats: seats,
            image: img,
            baseFare: baseRate,
            perKmRate: kmRate,
            estimatedFare: fare,
            estimatedTime: `${estimatedMins} mins`,
            description: `${seats} comfortable seats, Air Conditioned, professional driver`,
            advanceMinutes: t.priorMinutes || 30
          };
        });

        setVehicles(mapped);
        if (mapped.length > 0) {
          setSelectedVehicle(mapped[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching vehicles from database:", err);
      showToast("Unable to load live fleet. Please check your connection.", "error");
    } finally {
      setLoadingVehicles(false);
    }
  }, [distanceKm, tripType, estimatedMins]);

  useEffect(() => {
    fetchVehicleFleet();
  }, [fetchVehicleFleet]);

  // Recalculate fares with backend calculate-fare endpoint
  useEffect(() => {
    if (vehicles.length > 0) {
      setVehicles((prev) =>
        prev.map((v) => {
          const multiplier = tripType === "roundtrip" ? 1.8 : 1.0;
          const fare = Math.round(v.baseFare + (distanceKm * v.perKmRate * multiplier));
          return {
            ...v,
            estimatedFare: fare,
            estimatedTime: `${estimatedMins} mins`
          };
        })
      );
    }
  }, [distanceKm, tripType, estimatedMins]);

  // Swap pickup & drop
  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  // Step 1 -> Step 2
  const handleProceedToReview = (vehicle: VehicleOption) => {
    if (!pickup.trim()) {
      showToast("Please enter a pickup location", "error");
      return;
    }
    if (!drop.trim()) {
      showToast("Please enter a drop location", "error");
      return;
    }
    setSelectedVehicle(vehicle);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validate passenger inputs
  const validateRiderForm = () => {
    const errors: { [key: string]: string } = {};
    if (!riderName.trim()) errors.riderName = "Passenger name is required";
    if (!riderPhone.trim()) errors.riderPhone = "Mobile number is required";
    else if (!/^\+?[0-9]{10,13}$/.test(riderPhone.replace(/\D/g, ""))) {
      errors.riderPhone = "Enter a valid 10-digit mobile number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real backend booking submission
  const handleConfirmBooking = async () => {
    if (!validateRiderForm()) {
      showToast("Please provide valid passenger details", "error");
      return;
    }

    if (!selectedVehicle) {
      showToast("Please select a vehicle", "error");
      return;
    }

    setSubmittingBooking(true);

    try {
      const activeUserId = user?.userId || localStorage.getItem("userId") || null;

      const payload = {
        bookingDate: `${date}T${time}:00.000Z`,
        bookingTime: `${time}:00`,
        pickupPoint: pickup.trim(),
        dropPoint: drop.trim(),
        distanceKm: distanceKm,
        pickupCity: "Chennai",
        travellersCount: Number(passengers) || 1,
        femaleCount: 0,
        maleCount: Number(passengers) || 1,
        remarks: notes.trim() || "Online Cab Booking",
        purpose: "Cab Booking",
        confirmStatus: "Pending",
        bookingStatus: "Pending",
        preferredType: selectedVehicle.name,
        roundTrip: tripType === "roundtrip" ? "Yes" : "No",
        notes: notes.trim() || null,
        userId: activeUserId,
        behalfOfName: riderName.trim(),
        behalfOfPhone: riderPhone.trim(),
        vehicleTypeId: selectedVehicle.id,
        vehicleId: selectedVehicle.vehicleId || null
      };

      const res = await axiosInstance.post("/emp/createBookingForWeb", payload);

      if (res.data?.success && res.data?.booking) {
        const bk = res.data.booking;

        const finalConfirmed = {
          bookingId: bk.bookingId,
          bookingCode: bk.bookingCode || `BK${bk.bookingId?.slice(0, 8)}`,
          pickup: bk.pickupPoint || pickup,
          drop: bk.dropPoint || drop,
          distanceKm: bk.distanceKm || distanceKm,
          date: date,
          time: time,
          vehicle: selectedVehicle.name,
          fare: bk.finalFare || selectedVehicle.estimatedFare,
          riderName: riderName.trim(),
          riderPhone: riderPhone.trim(),
          status: bk.confirmStatus === "1" ? "Confirmed" : (bk.confirmStatus || "Pending")
        };

        setConfirmedBooking(finalConfirmed);
        setCurrentStep(3);
        showToast("Ride booked successfully!", "success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const errorMsg = res.data?.message || "Could not complete booking. Please try again.";
        showToast(errorMsg, "error");
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to confirm booking. Please try again.";
      showToast(msg, "error");
    } finally {
      setSubmittingBooking(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <AlertContainer />

      {/* Modern Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          
          {/* Step 1 Indicator */}
          <div className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              currentStep >= 1 ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-4 ring-amber-100" : "bg-slate-200 text-slate-500"
            }`}>
              1
            </div>
            <span className="text-xs font-bold mt-1.5 text-slate-800">Route & Vehicle</span>
          </div>

          {/* Line 1 */}
          <div className={`flex-1 h-1 mx-2 -mt-5 rounded transition-all ${
            currentStep >= 2 ? "bg-amber-500" : "bg-slate-200"
          }`} />

          {/* Step 2 Indicator */}
          <div className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              currentStep >= 2 ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-4 ring-amber-100" : "bg-slate-200 text-slate-500"
            }`}>
              2
            </div>
            <span className="text-xs font-bold mt-1.5 text-slate-800">Review Fare</span>
          </div>

          {/* Line 2 */}
          <div className={`flex-1 h-1 mx-2 -mt-5 rounded transition-all ${
            currentStep >= 3 ? "bg-emerald-500" : "bg-slate-200"
          }`} />

          {/* Step 3 Indicator */}
          <div className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              currentStep >= 3 ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-4 ring-emerald-100" : "bg-slate-200 text-slate-500"
            }`}>
              3
            </div>
            <span className="text-xs font-bold mt-1.5 text-slate-800">Confirmed</span>
          </div>

        </div>
      </div>

      {/* ================= STEP 1: ROUTE & VEHICLE SELECTION ================= */}
      {currentStep === 1 && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Top Route Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="text-amber-500" size={20} />
              Enter Your Trip Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              
              {/* Pickup */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Pickup Location
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                    <MapPin size={18} />
                  </div>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup address, airport, station..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Swap Button for Desktop */}
              <div className="hidden md:flex absolute left-1/2 top-[32px] -translate-x-1/2 -translate-y-1/2 z-10">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 hover:border-amber-500 shadow-sm flex items-center justify-center text-slate-600 hover:text-amber-600 hover:rotate-180 transition-all"
                >
                  <ArrowRightLeft size={13} />
                </button>
              </div>

              {/* Drop */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Drop Destination</span>
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="md:hidden text-[11px] text-amber-600 font-semibold flex items-center gap-1"
                  >
                    <ArrowRightLeft size={11} /> Swap
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-600">
                    <MapPin size={18} />
                  </div>
                  <input
                    type="text"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    placeholder="Enter destination location..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Date, Time & Trip Details Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
              <div>
                <label className="text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  min={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Trip Type</label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                >
                  <option value="oneway">One-Way</option>
                  <option value="roundtrip">Round Trip</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Passengers</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                >
                  <option value={1}>1 Person</option>
                  <option value={2}>2 People</option>
                  <option value={3}>3 People</option>
                  <option value={4}>4 People (Sedan)</option>
                  <option value={6}>6 People (SUV)</option>
                </select>
              </div>
            </div>

            {/* Estimated Route Strip */}
            {pickup && drop && (
              <div className="mt-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
                <span className="font-semibold flex items-center gap-2">
                  <Clock size={15} className="text-amber-600" />
                  Estimated Distance: <strong>~{distanceKm} km</strong> • Travel Time: <strong>~{estimatedMins} mins</strong>
                </span>
                <span className="text-[11px] font-medium text-amber-700">Calculated from route</span>
              </div>
            )}

          </div>

          {/* Vehicle Selection Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Select Available Vehicle</h3>
              <p className="text-xs text-slate-500">Live verified vehicles synced with database</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {vehicles.length} Available
            </span>
          </div>

          {/* Loading State for Vehicles */}
          {loadingVehicles ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
              <Loader2 className="animate-spin text-amber-500 mx-auto" size={32} />
              <p className="text-sm font-bold text-slate-600">Loading available cabs from database...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 space-y-2">
              <AlertCircle size={32} className="text-amber-500 mx-auto" />
              <h4 className="font-bold text-slate-900">No vehicles currently available</h4>
              <p className="text-xs text-slate-500">Please try adjusting your pickup or destination.</p>
            </div>
          ) : (
            /* Dynamic Vehicles Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl relative flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20 bg-amber-50/10"
                        : "border-slate-200/80 hover:border-slate-300 shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">{v.name}</h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                              <Users size={12} /> {v.seats} Seats
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                        </div>

                        {/* Live Estimated Fare */}
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-950">
                            ₹{v.estimatedFare}
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Estimated Total
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-y border-slate-100 my-3">
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-amber-500" /> ~{v.estimatedTime}
                          </span>
                          <span>•</span>
                          <span>₹{v.perKmRate}/km</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          {v.advanceMinutes}m Advance
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProceedToReview(v);
                        }}
                        className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <span>Select {v.name}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ================= STEP 2: REVIEW & CONFIRM BOOKING ================= */}
      {currentStep === 2 && selectedVehicle && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Change Vehicle or Route
          </button>

          {/* Trip Summary Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Review & Confirm Ride</h3>
                <p className="text-xs text-slate-500">Real-time fare verification & driver dispatch</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Car size={26} />
              </div>
            </div>

            {/* Route Summary */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
              
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pickup Location</span>
                  <p className="text-sm font-bold text-slate-900">{pickup}</p>
                </div>
              </div>

              <div className="ml-3 w-0.5 h-4 bg-slate-300" />

              {/* Drop */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</span>
                  <p className="text-sm font-bold text-slate-900">{drop}</p>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" /> {date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" /> {time}
                </span>
                <span className="flex items-center gap-1">
                  <Car size={14} className="text-slate-400" /> {selectedVehicle.name} ({selectedVehicle.seats} Seats)
                </span>
              </div>

            </div>

            {/* Passenger Details Form */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Passenger Details
                </h4>

                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <LogIn size={13} /> Sign in for faster checkout
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passenger Name *
                  </label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={(e) => { setRiderName(e.target.value); setFormErrors({}); }}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                  {formErrors.riderName && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.riderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={riderPhone}
                    onChange={(e) => { setRiderPhone(e.target.value); setFormErrors({}); }}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                  {formErrors.riderPhone && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.riderPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Notes for Chauffeur (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Near airport terminal 2 gate, will call on arrival"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Fare Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Base Fare</span>
                <span>₹{selectedVehicle.baseFare}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Distance Rate (~{distanceKm} km × ₹{selectedVehicle.perKmRate})</span>
                <span>₹{Math.round(distanceKm * selectedVehicle.perKmRate * (tripType === "roundtrip" ? 1.8 : 1))}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Taxes & Service Charges</span>
                <span className="text-emerald-400 font-bold">Included (0% Surcharge)</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Total Payable Fare</span>
                  <span className="text-[11px] text-slate-400">Pay directly to chauffeur or online</span>
                </div>
                <div className="text-2xl font-black text-amber-400">
                  ₹{selectedVehicle.estimatedFare}
                </div>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              disabled={submittingBooking}
              onClick={handleConfirmBooking}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {submittingBooking ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving Booking to Database...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} className="stroke-[2.5]" />
                  Confirm Booking Now
                </>
              )}
            </button>

          </div>
        </div>
      )}

      {/* ================= STEP 3: REAL BOOKING SUCCESS ================= */}
      {currentStep === 3 && confirmedBooking && (
        <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
          
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-6">
            
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={44} className="stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                Database Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                Your Ride is Booked!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your booking has been saved to the database. Chauffeur details will be dispatched prior to pickup.
              </p>
            </div>

            {/* Real Sequential Booking Code */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Official Booking Reference ID</span>
              <span className="text-2xl font-black text-slate-900 tracking-wider font-mono">
                {confirmedBooking.bookingCode}
              </span>
            </div>

            {/* Summary Details */}
            <div className="space-y-3 text-left bg-slate-50/80 p-5 rounded-2xl text-xs font-semibold text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Vehicle:</span>
                <span className="text-slate-900 font-bold">{confirmedBooking.vehicle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Pickup:</span>
                <span className="text-slate-900 font-bold max-w-[60%] text-right truncate">{confirmedBooking.pickup}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Drop:</span>
                <span className="text-slate-900 font-bold max-w-[60%] text-right truncate">{confirmedBooking.drop}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Schedule:</span>
                <span className="text-slate-900 font-bold">{confirmedBooking.date} at {confirmedBooking.time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Trip Distance:</span>
                <span className="text-slate-900 font-bold">{confirmedBooking.distanceKm} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Passenger:</span>
                <span className="text-slate-900 font-bold">{confirmedBooking.riderName} ({confirmedBooking.riderPhone})</span>
              </div>
              <div className="flex justify-between py-1 pt-2">
                <span className="text-slate-900 font-bold text-sm">Final Fare:</span>
                <span className="text-emerald-700 font-black text-base">₹{confirmedBooking.fare}</span>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/my-bookings")}
                className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
              >
                View in My Bookings
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setPickup("");
                  setDrop("");
                  setConfirmedBooking(null);
                }}
                className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all"
              >
                Book Another Ride
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Auth Modal if triggered */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          if (user) {
            setRiderName(user.username || user.name || "");
            setRiderPhone(user.mobile || "");
          }
        }}
      />

    </div>
  );
};

export default BookingFlow;
