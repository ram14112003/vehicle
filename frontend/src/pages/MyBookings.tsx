import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Search,
  Loader2,
  X,
  LogIn,
  CreditCard,
  Banknote,
  ShieldCheck,
  Phone,
  Navigation
} from "lucide-react";


import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Navigation/Footer";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { showToast, AlertContainer } from "../components/AlertBox";
import AuthModal from "../components/Auth/AuthModal";

interface BookingItem {
  bookingId: string;
  bookingCode: string;
  pickupPoint: string;
  dropPoint: string;
  distanceKm?: number;
  bookingDate: string;
  bookingTime: string;
  confirmStatus: string;
  bookingStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentTransactionId?: string;
  paidAt?: string;
  vehicleType?: string;
  vehicleName?: string;
  fare?: number;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  createdAt: string;
}


export const MyBookings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.userId || localStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "cancelled">("active");
  const [loading, setLoading] = useState<boolean>(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Pay Now Modal State
  const [payModalBooking, setPayModalBooking] = useState<BookingItem | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"Online" | "Cash">("Online");
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    bookingCode: string;
    amount: number;
    method: string;
    txnId: string;
  } | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setBookings([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(`/order/user/${userId}/all`);

      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped: BookingItem[] = res.data.data.map((b: any) => {
          const rawDate = b.bookingDate
            ? new Date(b.bookingDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })
            : "N/A";

          const vName = b.preferredType || b.vehicleType?.vehicleType || b.vehicle?.vehicleName || "Cab";
          const distVal = b.distanceKm && Number(b.distanceKm) > 0 ? Number(b.distanceKm) : 0;
          const finalFareVal =
            b.finalFare && Number(b.finalFare) > 0
              ? Number(b.finalFare)
              : b.invoice?.[0]?.invoiceAmount || b.invoice?.[0]?.totalAmount || 550;

          return {
            bookingId: b.bookingId,
            bookingCode: b.bookingCode || `BK${b.bookingId.slice(0, 8)}`,
            pickupPoint: b.pickupPoint || "Chennai",
            dropPoint: b.dropPoint || "Destination",
            distanceKm: distVal,
            bookingDate: rawDate,
            bookingTime: b.bookingTime ? b.bookingTime.substring(0, 5) : "10:00 AM",
            confirmStatus: b.confirmStatus || "Confirmed",
            bookingStatus: b.bookingStatus || b.confirmStatus || "CONFIRMED",
            paymentStatus: b.paymentStatus || "PENDING",
            paymentMethod: b.paymentMethod,
            paymentTransactionId: b.paymentTransactionId,
            paidAt: b.paidAt,
            vehicleType: vName,
            vehicleName: b.vehicle?.vehicleName || vName,
            fare: Number(finalFareVal),
            driverName: b.driver?.driverName,
            driverPhone: b.driver?.phno,
            vehicleNumber: b.vehicle?.vehicleNo || b.vehicleMaster?.vehicleNumber || undefined,
            vehicleModel: b.vehicle?.vehicleName || undefined,
            createdAt: b.createdAt || new Date().toISOString()
          };

        });
        setBookings(mapped);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error("Error fetching bookings from database:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real backend cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const res = await axiosInstance.put("/order/cancelBooking", {
        bookingId,
        remarks: "Cancelled by user via dashboard"
      });

      if (res.status === 200 || res.data?.success || res.data?.message) {
        showToast("Booking cancelled successfully", "success");
        setSelectedBooking(null);
        fetchBookings();
      } else {
        showToast(res.data?.message || "Failed to cancel booking", "error");
      }
    } catch (err: any) {
      console.error("Cancel booking error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to cancel booking";
      showToast(msg, "error");
    } finally {
      setCancellingId(null);
    }
  };

  // Process Post-Ride Payment
  const handleProcessPayment = async () => {
    if (!payModalBooking) return;
    setProcessingPayment(true);
    try {
      const res = await axiosInstance.post(`/order/pay-now/${payModalBooking.bookingId}`, {
        paymentMethod: selectedPaymentMethod
      });

      if (res.data?.success) {
        showToast(
          selectedPaymentMethod === "Online"
            ? "Payment verified! Thank you for riding with EasyRide."
            : "Cash payment recorded. Please hand fare to your chauffeur.",
          "success"
        );


        if (selectedPaymentMethod === "Online") {
          setPaymentSuccessData({
            bookingCode: payModalBooking.bookingCode,
            amount: payModalBooking.fare || 0,
            method: "Online (Card / UPI)",
            txnId: res.data?.data?.paymentTransactionId || `PAY-${Date.now()}`
          });
        } else {
          setPayModalBooking(null);
        }

        await fetchBookings();
      } else {
        showToast(res.data?.message || "Payment processing failed.", "error");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      showToast(err.response?.data?.message || "Payment failed. Please try again.", "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Filter bookings based on active tab and search query
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickupPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dropPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.vehicleType && b.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const s = (b.confirmStatus || "").toLowerCase();
    const isCompleted = s.includes("completed");
    const isCancelled = s.includes("cancelled") || s.includes("declined");
    const isActive = !isCompleted && !isCancelled;

    if (activeTab === "all") return true;
    if (activeTab === "active") return isActive;
    if (activeTab === "completed") return isCompleted;
    if (activeTab === "cancelled") return isCancelled;
    return true;
  });

  // Dynamic lifecycle status badge
  const getLifecycleBadge = (b: BookingItem) => {
    const cs = (b.confirmStatus || "").toLowerCase();
    const ps = (b.paymentStatus || "").toUpperCase();

    if (cs.includes("cancel") || cs.includes("decline")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle size={13} /> Cancelled
        </span>
      );
    }

    if (cs.includes("completed")) {
      if (ps === "PAID") {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} /> Completed (Paid)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <Clock size={13} /> Ride Completed (Payment Pending)
        </span>
      );
    }

    if (cs.includes("trip started") || cs.includes("started") || cs.includes("on_trip")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Navigation size={13} className="animate-spin" /> Trip In Progress
        </span>
      );
    }

    if (cs.includes("driver assigned") || cs.includes("assigned") || Boolean(b.driverName)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Car size={13} /> Driver Assigned
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={13} /> Confirmed (Waiting Driver)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <AlertContainer />
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Bookings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live status, chauffeur tracking, and post-ride checkout
            </p>
          </div>

          <Link
            to="/book"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all self-start sm:self-auto"
          >
            <Plus size={18} /> Book a New Ride
          </Link>
        </div>

        {/* Unauthenticated Prompt */}
        {!isAuthenticated && !userId ? (
          <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-slate-100 shadow-xl max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <LogIn size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Sign in to view your rides</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your bookings are privately linked to your EasyRide account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Sign In / Register
            </button>
          </div>
        ) : (
          <>
            {/* Tab Filters & Search Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-100 mb-8 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Segmented Tabs */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("active")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === "active"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Active Rides (
                    {
                      bookings.filter(
                        (b) =>
                          !b.confirmStatus.toLowerCase().includes("completed") &&
                          !b.confirmStatus.toLowerCase().includes("cancel")
                      ).length
                    }
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("completed")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === "completed"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Completed (
                    {bookings.filter((b) => b.confirmStatus.toLowerCase().includes("completed")).length}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("cancelled")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === "cancelled"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Cancelled (
                    {bookings.filter((b) => b.confirmStatus.toLowerCase().includes("cancel")).length}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({bookings.length})
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, route, car..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="animate-spin text-amber-500 mx-auto" size={32} />
                <p className="text-sm font-bold text-slate-600">Loading your rides from database...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-lg space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                  <Car size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">No rides found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You don't have any {activeTab !== "all" ? activeTab : ""} bookings recorded in the database.
                  </p>
                </div>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition-colors"
                >
                  Book a Ride Now
                </Link>
              </div>
            ) : (
              /* Dynamic Bookings Card List */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredBookings.map((b) => {
                  const isCompleted = (b.confirmStatus || "").toLowerCase().includes("completed");
                  const isPendingPayment = isCompleted && b.paymentStatus !== "PAID";

                  return (
                    <div
                      key={b.bookingId}
                      className={`bg-white rounded-3xl p-6 shadow-md hover:shadow-xl border transition-all flex flex-col justify-between space-y-5 ${
                        isPendingPayment
                          ? "border-amber-400 ring-2 ring-amber-200/60 bg-amber-50/10"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {/* Card Header: Code & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shadow-sm">
                            <Car size={18} />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-bold block">
                              Ref: {b.bookingCode}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{b.vehicleType}</h4>
                          </div>
                        </div>

                        {getLifecycleBadge(b)}
                      </div>

                      {/* Route */}
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-800">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span className="truncate">{b.pickupPoint}</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                          <span className="truncate">{b.dropPoint}</span>
                        </div>
                        {b.distanceKm ? (
                          <div className="pt-2 border-t border-slate-200/60 flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>Validated Distance:</span>
                            <span className="font-bold text-slate-800">{b.distanceKm} km</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Assigned Chauffeur Banner (if assigned) / Unassigned Status */}
                      {b.driverName ? (
                        <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                              {b.driverName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900">{b.driverName}</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-200/70 text-blue-900 font-bold text-[9px] uppercase">
                                  Assigned
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                                {b.vehicleName || b.vehicleType || "Cab"}
                                {b.vehicleNumber ? ` · ${b.vehicleNumber}` : ""}
                              </span>
                            </div>
                          </div>
                          {b.driverPhone && (
                            <a
                              href={`tel:${b.driverPhone}`}
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                              title="Call Driver"
                            >
                              <Phone size={13} /> Call Driver
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-amber-500" />
                            <span className="font-semibold text-slate-700">Driver not assigned yet</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                            Assigning soon
                          </span>
                        </div>
                      )}


                      {/* Post-Ride Payment Prompt Banner */}
                      {isPendingPayment && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 flex items-center justify-between shadow-md">
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-wider block text-slate-900/80">
                              Ride Completed
                            </span>
                            <span className="text-sm font-black">
                              Final Fare: ₹{b.fare}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPaymentMethod("Online");
                              setPayModalBooking(b);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        </div>
                      )}

                      {/* Footer / Schedule & Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Calendar size={13} /> {b.bookingDate} at {b.bookingTime}
                          </div>
                          <div className="text-base font-black text-slate-900 mt-0.5">
                            ₹{b.fare}{" "}
                            <span className="text-[10px] font-normal text-slate-400">
                              ({b.paymentStatus === "PAID" ? "Paid" : "Payable"})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Eye size={14} /> Details
                          </button>

                          {b.confirmStatus === "Pending" && (
                            <button
                              type="button"
                              disabled={cancellingId === b.bookingId}
                              onClick={() => handleCancelBooking(b.bookingId)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === b.bookingId ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Reference No</span>
                <h3 className="text-lg font-black text-slate-900">{selectedBooking.bookingCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status & Vehicle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold">Vehicle Category</span>
                <p className="text-sm font-bold text-slate-900">{selectedBooking.vehicleType}</p>
              </div>
              {getLifecycleBadge(selectedBooking)}
            </div>

            {/* Route Details */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs font-semibold text-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pickup Location
                </span>
                <p className="text-slate-900 mt-0.5">{selectedBooking.pickupPoint}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Drop Destination
                </span>
                <p className="text-slate-900 mt-0.5">{selectedBooking.dropPoint}</p>
              </div>
              {selectedBooking.distanceKm ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Trip Distance
                  </span>
                  <p className="text-slate-900 mt-0.5 font-bold">
                    {selectedBooking.distanceKm} km
                  </p>
                </div>
              ) : null}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Scheduled Date & Time
                </span>
                <p className="text-slate-900 mt-0.5">
                  {selectedBooking.bookingDate} at {selectedBooking.bookingTime}
                </p>
              </div>
            </div>

            {/* Assigned Driver Details (if assigned) / Unassigned Status */}
            {selectedBooking.driverName ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-blue-800 tracking-wider">
                    Assigned Chauffeur & Vehicle
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200/70 text-blue-900 text-[10px] font-bold">
                    Verified Driver
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">{selectedBooking.driverName}</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                      {selectedBooking.vehicleName || selectedBooking.vehicleType || "Cab"}
                      {selectedBooking.vehicleNumber ? ` · Plate: ${selectedBooking.vehicleNumber}` : ""}
                    </span>
                  </div>
                  {selectedBooking.driverPhone && (
                    <a
                      href={`tel:${selectedBooking.driverPhone}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <Phone size={13} /> Call Driver
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Driver not assigned yet</span>
                    <span className="text-[11px] text-slate-500">Admin is currently assigning the nearest available chauffeur.</span>
                  </div>
                </div>
              </div>
            )}


            {/* Total Fare & Payment Status */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Payment Status</span>
                <span
                  className={`font-black uppercase text-[11px] px-2 py-0.5 rounded-md ${
                    selectedBooking.paymentStatus === "PAID"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-amber-500 text-slate-950"
                  }`}
                >
                  {selectedBooking.paymentStatus || "PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Final Authoritative Fare</span>
                <span className="text-xl font-black text-amber-400">₹{selectedBooking.fare}</span>
              </div>
            </div>

            {/* Pay Now Button if completed & pending */}
            {selectedBooking.confirmStatus.toLowerCase().includes("completed") &&
              selectedBooking.paymentStatus !== "PAID" && (
                <button
                  type="button"
                  onClick={() => {
                    setPayModalBooking(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <CreditCard size={16} /> Pay ₹{selectedBooking.fare} Now
                </button>
              )}

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Ride Payment Modal */}
      {payModalBooking && !paymentSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-bold block">
                  Trip Completed · Checkout
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Pay for Ride #{payModalBooking.bookingCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Fare Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Trip Distance</span>
                <span>{payModalBooking.distanceKm || 1} km</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Vehicle Category</span>
                <span>{payModalBooking.vehicleType}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Total Final Amount
                </span>
                <span className="text-2xl font-black text-amber-400">
                  ₹{payModalBooking.fare}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-700 block">
                Choose Payment Method
              </span>

              {/* Online Payment Option */}
              <label
                onClick={() => setSelectedPaymentMethod("Online")}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod === "Online"
                    ? "border-amber-500 bg-amber-50/30 text-slate-950 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block">Online Payment</span>
                    <span className="text-xs text-slate-500">
                      Credit/Debit Card, UPI, NetBanking
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payMethod"
                  checked={selectedPaymentMethod === "Online"}
                  onChange={() => setSelectedPaymentMethod("Online")}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
              </label>

              {/* Cash Payment Option */}
              <label
                onClick={() => setSelectedPaymentMethod("Cash")}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod === "Cash"
                    ? "border-amber-500 bg-amber-50/30 text-slate-950 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block">Cash Payment</span>
                    <span className="text-xs text-slate-500">Pay cash directly to chauffeur</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payMethod"
                  checked={selectedPaymentMethod === "Cash"}
                  onChange={() => setSelectedPaymentMethod("Cash")}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Pay Action Button */}
            <button
              type="button"
              disabled={processingPayment}
              onClick={handleProcessPayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Verifying Transaction...
                </>
              ) : selectedPaymentMethod === "Online" ? (
                <>
                  <ShieldCheck size={18} /> Pay ₹{payModalBooking.fare} Securely
                </>
              ) : (
                <>
                  <Banknote size={18} /> Confirm Cash Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Receipt Modal */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                Payment Verified
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your ride payment has been confirmed and recorded in the database.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 font-semibold text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Booking Code:</span>
                <span className="font-mono font-bold text-slate-900">
                  {paymentSuccessData.bookingCode}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-black text-emerald-700 text-sm">
                  ₹{paymentSuccessData.amount}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-bold text-slate-900">{paymentSuccessData.method}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="font-mono text-[10px] text-slate-800 truncate max-w-[160px]">
                  {paymentSuccessData.txnId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentSuccessData(null);
                setPayModalBooking(null);
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
            >
              Done & View Bookings
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => fetchBookings()}
      />

      <Footer />
    </div>
  );
};

export default MyBookings;
