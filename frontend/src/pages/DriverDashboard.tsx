import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Play,
  LogOut,
  Power,
  RefreshCw,
  User,
  Shield
} from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { showToast, AlertContainer } from "../components/AlertBox";


interface BookingItem {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropLocation: string;
  vehicleName: string;
  vehicleNumber: string;
  fare: number;
  distanceKm?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  status: string;
  confirmStatus: string;
}

interface DriverProfile {
  driverId: string;
  driverName: string;
  phno: string;
  driverEmail?: string;
  licenseNo?: string;
  status: string;
  isAvailable: boolean;
  vehicleName?: string;
  vehicleNumber?: string;
  city?: string;
  state?: string;
}

export const DriverDashboard: React.FC = () => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [activeTrip, setActiveTrip] = useState<BookingItem | null>(null);
  const [assignedRides, setAssignedRides] = useState<BookingItem[]>([]);
  const [todayRides, setTodayRides] = useState<BookingItem[]>([]);
  const [upcomingRides, setUpcomingRides] = useState<BookingItem[]>([]);
  const [completedRides, setCompletedRides] = useState<BookingItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"assigned" | "today" | "upcoming" | "completed" | "profile">("assigned");

  // Modal States
  const [startTripModalBooking, setStartTripModalBooking] = useState<BookingItem | null>(null);
  const [completeTripModalBooking, setCompleteTripModalBooking] = useState<BookingItem | null>(null);
  const [cashCollected, setCashCollected] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Fetch all driver data
  const fetchDriverData = useCallback(async (showToastMsg = false) => {
    try {
      if (showToastMsg) setRefreshing(true);
      const [profileRes, bookingsRes] = await Promise.all([
        axiosInstance.get("/driver/me"),
        axiosInstance.get("/driver/my-bookings")
      ]);

      if (profileRes.data?.success && profileRes.data?.driver) {
        setProfile(profileRes.data.driver);
      }

      if (bookingsRes.data?.success && bookingsRes.data?.data) {
        const d = bookingsRes.data.data;
        setActiveTrip(d.activeTrip || null);
        setAssignedRides(d.assignedRides || []);
        setTodayRides(d.todayRides || []);
        setUpcomingRides(d.upcomingRides || []);
        setCompletedRides(d.completedRides || []);
      }

      if (showToastMsg) {
        showToast("Rides and status refreshed!", "success");
      }
    } catch (err: any) {
      console.error("Error fetching driver data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/driver/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchDriverData();

    // Heartbeat every 45 seconds to keep driver online while page is active
    const heartbeatInterval = setInterval(async () => {
      try {
        await axiosInstance.post("/driver/heartbeat");
      } catch (e) {
        // silent fail
      }
    }, 45000);

    // Auto-refresh rides every 20 seconds
    const refreshInterval = setInterval(() => {
      fetchDriverData(false);
    }, 20000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(refreshInterval);
    };
  }, [fetchDriverData]);

  // Toggle Availability
  const handleToggleAvailability = async () => {
    if (!profile) return;
    if (profile.status === "ON_TRIP" || activeTrip) {
      showToast("Cannot change availability while currently on an active trip!", "warn");
      return;
    }

    const newTargetStatus = profile.status === "AVAILABLE" ? "OFFLINE" : "AVAILABLE";
    const newIsAvailable = newTargetStatus === "AVAILABLE";

    try {
      const res = await axiosInstance.patch("/driver/availability", {
        status: newTargetStatus,
        isAvailable: newIsAvailable
      });

      if (res.data?.success) {
        setProfile((prev) => (prev ? { ...prev, status: newTargetStatus, isAvailable: newIsAvailable } : null));
        showToast(`Status updated to ${newTargetStatus}!`, "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update availability", "error");
    }
  };

  // Start Trip Action
  const handleConfirmStartTrip = async () => {
    if (!startTripModalBooking) return;
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/driver/bookings/${startTripModalBooking.bookingId}/start`);
      if (res.data?.success) {
        showToast(`Trip #${res.data.bookingCode || "started"} is now in progress!`, "success");
        setStartTripModalBooking(null);
        await fetchDriverData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to start trip", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Trip Action
  const handleConfirmCompleteTrip = async () => {
    if (!completeTripModalBooking) return;
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/driver/bookings/${completeTripModalBooking.bookingId}/complete`, {
        paymentMethod: cashCollected ? "CASH" : "ONLINE",
        amountPaid: completeTripModalBooking.fare
      });

      if (res.data?.success) {
        showToast(`Trip #${res.data.bookingCode || "completed"} completed successfully!`, "success");
        setCompleteTripModalBooking(null);
        await fetchDriverData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to complete trip", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/driver/logout").catch(() => {});
    } finally {
      localStorage.clear();
      logout();
      showToast("Logged out successfully. Status is now OFFLINE.", "info");
      navigate("/driver/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-300 text-sm tracking-wide">Loading Driver Portal...</p>
      </div>
    );
  }

  const isOnline = profile?.status === "AVAILABLE";
  const isOnTrip = profile?.status === "ON_TRIP" || !!activeTrip;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      <AlertContainer />

      {/* Top Mobile/Desktop Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Car className="text-slate-950 w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">Easy<span className="text-amber-500">Ride</span></span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                Driver
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {profile?.driverName || "Driver"} ({profile?.phno || "N/A"})
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDriverData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh rides"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin text-amber-400" : ""} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Driver Status & Vehicle Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          
          {/* Availability Control */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Driver Status</span>
              {isOnTrip ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> On Trip
                </span>
              ) : isOnline ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Online & Available
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" /> Offline
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {isOnTrip
                ? "You are currently servicing a ride. Complete the active trip to receive new bookings."
                : isOnline
                ? "You are visible to Admin dispatchers and ready for assigned bookings."
                : "You are currently marked OFFLINE. Toggle below when ready to accept rides."}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex md:justify-end items-center gap-3">
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={isOnTrip}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
                isOnTrip
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : isOnline
                  ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20"
              }`}
            >
              <Power size={18} />
              <span>{isOnline ? "Go Offline" : "Go Online (Available)"}</span>
            </button>
          </div>

          {/* Assigned Cab Info Banner */}
          <div className="md:col-span-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-amber-400" />
              <span className="text-slate-400">Assigned Vehicle:</span>
              <span className="font-bold text-white uppercase">{profile?.vehicleName || "Omni / Standard"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Vehicle Registration No:</span>
              <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                {profile?.vehicleNumber || "Not Added"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-slate-400">License:</span>
              <span className="font-bold text-slate-200">{profile?.licenseNo || "Verified"}</span>
            </div>
          </div>
        </div>

        {/* ACTIVE ONGOING TRIP CARD (Highlighted) */}
        {activeTrip && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="font-black text-amber-400 text-xs uppercase tracking-wider">
                  Active Ride in Progress
                </span>
                <span className="font-mono text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-md">
                  #{activeTrip.bookingCode}
                </span>
              </div>
              <span className="font-black text-lg text-emerald-400">₹{activeTrip.fare}</span>
            </div>

            {/* Customer & Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Passenger Details</span>
                <p className="font-bold text-white text-base mt-0.5">{activeTrip.customerName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={`tel:${activeTrip.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                  >
                    <Phone size={13} />
                    <span>Call Passenger ({activeTrip.customerPhone})</span>
                  </a>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cab & Vehicle</span>
                <p className="font-bold text-slate-200 mt-0.5">{activeTrip.vehicleName}</p>
                <span className="font-mono text-xs font-bold text-amber-400 block mt-1">
                  Reg No: {activeTrip.vehicleNumber}
                </span>
              </div>
            </div>

            {/* Route Points */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Pickup Location:</span>
                  <span className="font-semibold text-white">{activeTrip.pickupLocation}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Drop Location:</span>
                  <span className="font-semibold text-white">{activeTrip.dropLocation}</span>
                </div>
              </div>
            </div>

            {/* Complete Trip CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompleteTripModalBooking(activeTrip);
                  setCashCollected(true);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                <span>Complete Trip & Collect Fare</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "assigned"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <span>Assigned Rides</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "assigned" ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-300"
            }`}>
              {assignedRides.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "today"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <span>Today's Rides</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "today" ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-300"
            }`}>
              {todayRides.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "upcoming"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <span>Upcoming</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "upcoming" ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-300"
            }`}>
              {upcomingRides.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "completed"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <span>Completed Rides</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "completed" ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-300"
            }`}>
              {completedRides.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <User size={15} />
            <span>Driver Profile</span>
          </button>
        </div>

        {/* TAB CONTENTS */}

        {/* 1. Assigned Rides Tab */}
        {activeTab === "assigned" && (
          <div className="space-y-4">
            {assignedRides.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                <Car size={36} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-bold text-white text-base">No Assigned Rides Currently</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  New rides assigned to you by EasyRide admin dispatchers will appear here automatically. Keep your status Online.
                </p>
              </div>
            ) : (
              assignedRides.map((ride) => (
                <div
                  key={ride.bookingId}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs">
                          NEW ASSIGNMENT
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          #{ride.bookingCode}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-white mt-1">{ride.customerName}</h4>
                      <a
                        href={`tel:${ride.customerPhone}`}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold hover:underline mt-0.5"
                      >
                        <Phone size={12} /> {ride.customerPhone}
                      </a>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-xl text-emerald-400">₹{ride.fare}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {ride.distanceKm ? `${ride.distanceKm} km estimated` : "One Way Trip"}
                      </span>
                    </div>
                  </div>

                  {/* Route & Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Pickup:</span>
                          <span className="text-slate-200 font-medium">{ride.pickupLocation}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Drop:</span>
                          <span className="text-slate-200 font-medium">{ride.dropLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:border-l sm:border-slate-800 sm:pl-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar size={14} className="text-amber-400" />
                        <span>Date: <strong className="text-white">{ride.bookingDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={14} className="text-amber-400" />
                        <span>Time: <strong className="text-white">{ride.bookingTime}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Car size={14} className="text-amber-400" />
                        <span>Vehicle: <strong className="text-white">{ride.vehicleName} ({ride.vehicleNumber})</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Start Trip CTA */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setStartTripModalBooking(ride)}
                      disabled={isOnTrip}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={16} className="fill-slate-950" />
                      <span>{isOnTrip ? "Finish Active Trip First" : "Start Trip"}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. Today's Rides Tab */}
        {activeTab === "today" && (
          <div className="space-y-4">
            {todayRides.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                <Calendar size={36} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-bold text-white text-base">No Rides Scheduled for Today</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Assigned trips for today will appear here.
                </p>
              </div>
            ) : (
              todayRides.map((ride) => (
                <div
                  key={ride.bookingId}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-amber-400 font-bold">#{ride.bookingCode}</span>
                      <h4 className="font-bold text-white text-base">{ride.customerName}</h4>
                    </div>
                    <span className="font-black text-emerald-400 text-lg">₹{ride.fare}</span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Pickup: <strong>{ride.pickupLocation}</strong></p>
                    <p>Drop: <strong>{ride.dropLocation}</strong></p>
                    <p>Time: <strong>{ride.bookingTime}</strong></p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStartTripModalBooking(ride)}
                    disabled={isOnTrip}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Start Trip
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. Upcoming Rides Tab */}
        {activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcomingRides.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                <Clock size={36} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-bold text-white text-base">No Upcoming Scheduled Rides</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Future advance bookings will appear here.
                </p>
              </div>
            ) : (
              upcomingRides.map((ride) => (
                <div
                  key={ride.bookingId}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-amber-400 font-bold">#{ride.bookingCode}</span>
                      <h4 className="font-bold text-white text-base">{ride.customerName}</h4>
                    </div>
                    <span className="font-black text-emerald-400 text-base">₹{ride.fare}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span>Date: {ride.bookingDate} at {ride.bookingTime}</span>
                    <p className="text-slate-300 mt-1">{ride.pickupLocation} → {ride.dropLocation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. Completed Rides Tab */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            {completedRides.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                <CheckCircle size={36} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-bold text-white text-base">No Completed Trips Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your finished ride history and earnings will be listed here.
                </p>
              </div>
            ) : (
              completedRides.map((ride) => (
                <div
                  key={ride.bookingId}
                  className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 font-bold">#{ride.bookingCode}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        COMPLETED
                      </span>
                    </div>
                    <p className="font-bold text-white text-sm mt-0.5">{ride.customerName}</p>
                    <p className="text-xs text-slate-400">{ride.pickupLocation} → {ride.dropLocation}</p>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Date: {ride.bookingDate}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-lg text-emerald-400">₹{ride.fare}</span>
                    <span className="block text-[11px] text-slate-400">Paid Cash/Online</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 5. Driver Profile Tab */}
        {activeTab === "profile" && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white">Driver Profile Details</h3>
              <p className="text-xs text-slate-400">Your registered details in EasyRide cab management system</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Driver Full Name</span>
                <p className="font-bold text-white text-sm mt-0.5">{profile?.driverName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Mobile Number</span>
                <p className="font-bold text-white text-sm mt-0.5">{profile?.phno}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Email Address</span>
                <p className="font-bold text-white text-sm mt-0.5">{profile?.driverEmail || "Not Provided"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">License Number</span>
                <p className="font-bold text-amber-400 font-mono text-sm mt-0.5">{profile?.licenseNo || "Verified"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Assigned Cab</span>
                <p className="font-bold text-white text-sm mt-0.5">{profile?.vehicleName || "Standard"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Vehicle Registration No</span>
                <p className="font-mono font-bold text-amber-400 text-sm mt-0.5">{profile?.vehicleNumber || "Not Added"}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <LogOut size={15} />
                <span>Log Out of Driver Portal</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* START TRIP CONFIRMATION MODAL */}
      {startTripModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Play size={20} className="fill-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Start This Trip?</h4>
                <p className="text-xs text-slate-400">Ride #{startTripModalBooking.bookingCode}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <p>Passenger: <strong className="text-white">{startTripModalBooking.customerName}</strong> ({startTripModalBooking.customerPhone})</p>
              <p>Pickup: <strong className="text-slate-200">{startTripModalBooking.pickupLocation}</strong></p>
              <p>Drop: <strong className="text-slate-200">{startTripModalBooking.dropLocation}</strong></p>
              <p>Fare: <strong className="text-emerald-400">₹{startTripModalBooking.fare}</strong></p>
            </div>

            <p className="text-xs text-slate-400">
              Starting this trip will set your status to <strong className="text-amber-400">ON TRIP</strong>.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStartTripModalBooking(null)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStartTrip}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? "Starting..." : "Confirm & Start Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE TRIP CONFIRMATION MODAL */}
      {completeTripModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Complete Ride #{completeTripModalBooking.bookingCode}</h4>
                <p className="text-xs text-slate-400">Confirm trip destination reached and collect fare</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-bold">Total Fare to Collect:</span>
                <span className="font-black text-emerald-400 text-lg">₹{completeTripModalBooking.fare}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cashCheck"
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <label htmlFor="cashCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Fare amount ₹{completeTripModalBooking.fare} collected from passenger (Cash)
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompleteTripModalBooking(null)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteTrip}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? "Completing..." : "Confirm & Complete Trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
