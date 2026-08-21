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
  LogIn
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
  bookingDate: string;
  bookingTime: string;
  confirmStatus: string;
  bookingStatus: string;
  vehicleType?: string;
  fare?: number;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
}

export const MyBookings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.userId || localStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed" | "cancelled">("upcoming");
  const [loading, setLoading] = useState<boolean>(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
          const rawDate = b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }) : "N/A";

          let status = "Pending";
          if (b.confirmStatus === "1" || b.confirmStatus === "Confirmed") status = "Confirmed";
          else if (b.confirmStatus === "6" || b.confirmStatus === "Cancelled") status = "Cancelled";
          else if (b.confirmStatus === "5" || b.bookingStatus === "Completed") status = "Completed";

          const vName = b.preferredType || b.vehicleType?.vehicleType || b.vehicle?.vehicleName || "Sedan Prime";
          const invoiceAmount = b.invoice?.[0]?.invoiceAmount || b.invoice?.[0]?.totalAmount;

          return {
            bookingId: b.bookingId,
            bookingCode: b.bookingCode || `BK${b.bookingId.slice(0, 8)}`,
            pickupPoint: b.pickupPoint || "Chennai",
            dropPoint: b.dropPoint || "Destination",
            bookingDate: rawDate,
            bookingTime: b.bookingTime ? b.bookingTime.substring(0, 5) : "10:00 AM",
            confirmStatus: status,
            bookingStatus: b.bookingStatus || status,
            vehicleType: vName,
            fare: invoiceAmount ? Number(invoiceAmount) : 550,
            driverName: b.driver?.driverName,
            driverPhone: b.driver?.phno,
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

  // Filter bookings based on active tab and search query
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickupPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dropPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.vehicleType && b.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return b.confirmStatus === "Pending" || b.confirmStatus === "Confirmed";
    if (activeTab === "completed") return b.confirmStatus === "Completed";
    if (activeTab === "cancelled") return b.confirmStatus === "Cancelled";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} /> Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={13} /> Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
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
              Live database tracking for your upcoming and past rides
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
                Your bookings are privately linked to your Grace Cabs account.
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
                    onClick={() => setActiveTab("upcoming")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      activeTab === "upcoming"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Upcoming ({bookings.filter(b => b.confirmStatus === "Pending" || b.confirmStatus === "Confirmed").length})
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
                    Completed ({bookings.filter(b => b.confirmStatus === "Completed").length})
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
                    Cancelled ({bookings.filter(b => b.confirmStatus === "Cancelled").length})
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
                {filteredBookings.map((b) => (
                  <div
                    key={b.bookingId}
                    className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col justify-between space-y-5"
                  >
                    {/* Card Header: Code & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 font-black text-xs">
                          <Car size={20} className="text-amber-500" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 font-bold block">ID: {b.bookingCode}</span>
                          <h4 className="text-sm font-black text-slate-900">{b.vehicleType}</h4>
                        </div>
                      </div>

                      {getStatusBadge(b.confirmStatus)}
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
                    </div>

                    {/* Footer / Schedule & Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Calendar size={13} /> {b.bookingDate} at {b.bookingTime}
                        </div>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          ₹{b.fare}
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
                ))}
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
                <span className="text-xs text-slate-500">Vehicle Type</span>
                <p className="text-sm font-bold text-slate-900">{selectedBooking.vehicleType}</p>
              </div>
              {getStatusBadge(selectedBooking.confirmStatus)}
            </div>

            {/* Route Details */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs font-semibold text-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Location</span>
                <p className="text-slate-900 mt-0.5">{selectedBooking.pickupPoint}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Drop Destination</span>
                <p className="text-slate-900 mt-0.5">{selectedBooking.dropPoint}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Date & Time</span>
                <p className="text-slate-900 mt-0.5">{selectedBooking.bookingDate} at {selectedBooking.bookingTime}</p>
              </div>
            </div>

            {/* Driver Info if assigned in DB */}
            {selectedBooking.driverName && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Assigned Chauffeur</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-900">{selectedBooking.driverName}</span>
                  <a href={`tel:${selectedBooking.driverPhone}`} className="text-amber-800 font-bold hover:underline">
                    {selectedBooking.driverPhone}
                  </a>
                </div>
              </div>
            )}

            {/* Total Fare */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 text-white">
              <span className="text-xs text-slate-400">Payable Total Fare</span>
              <span className="text-xl font-black text-amber-400">₹{selectedBooking.fare}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close
              </button>
              {selectedBooking.confirmStatus === "Pending" && (
                <button
                  type="button"
                  disabled={cancellingId === selectedBooking.bookingId}
                  onClick={() => handleCancelBooking(selectedBooking.bookingId)}
                  className="w-full py-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs disabled:opacity-50"
                >
                  {cancellingId === selectedBooking.bookingId ? "Cancelling..." : "Cancel Ride"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Auth Modal if needed */}
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
