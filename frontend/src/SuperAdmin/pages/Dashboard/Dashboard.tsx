import React, { useEffect, useState, useCallback } from 'react';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import ConfirmModal from '../../../components/ConfirmModal';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  Users,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalBookings: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  totalUsers: number;
  activeVehicles: number;
  totalRevenue: number;
}

interface BookingRecord {
  bookingId: string;
  bookingCode: string;
  pickupPoint: string;
  dropPoint: string;
  distanceKm: number;
  finalFare: number;
  baseFare?: number;
  perKmRate?: number;
  bookingDate: string;
  bookingTime: string;
  confirmStatus: string;
  bookingStatus: string;
  preferredType?: string;
  vehicleType?: {
    vehicleType: string;
    seatCapacity: number;
  };
  vehicle?: {
    vehicleName: string;
  };
  user?: {
    userId: string;
    username: string;
    mobile: string;
    email: string;
  };
  behalfOfName?: string;
  behalfOfPhone?: string;
  createdAt: string;
}

const formatCustomDate = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const t = timeStr ? ` at ${timeStr.substring(0, 5)}` : '';
  return `${day} ${month} ${year}${t}`;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalUsers: 0,
    activeVehicles: 0,
    totalRevenue: 0
  });

  const [pendingBookings, setPendingBookings] = useState<BookingRecord[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  // Reusable Confirmation Popup State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    booking: BookingRecord | null;
    targetStatus: 'Confirmed' | 'Completed' | 'Cancelled';
  }>({
    isOpen: false,
    booking: null,
    targetStatus: 'Confirmed'
  });

  // Fetch real statistics and bookings
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch live DB counts
      const statsRes = await axiosInstance.get('/order/admin/dashboard-stats');
      if (statsRes.data?.success && statsRes.data?.data) {
        setStats(statsRes.data.data);
      }

      // 2. Fetch pending bookings for Action Required section
      const pendingRes = await axiosInstance.get('/order/admin/all-bookings?status=pending&limit=6');
      if (pendingRes.data?.success && Array.isArray(pendingRes.data.data)) {
        setPendingBookings(pendingRes.data.data);
      }

      // 3. Fetch recent bookings
      const recentRes = await axiosInstance.get('/order/admin/all-bookings?limit=8');
      if (recentRes.data?.success && Array.isArray(recentRes.data.data)) {
        setRecentBookings(recentRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      showToast('Failed to sync live dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Open confirmation modal
  const promptStatusChange = (booking: BookingRecord, targetStatus: 'Confirmed' | 'Completed' | 'Cancelled') => {
    setConfirmModal({
      isOpen: true,
      booking,
      targetStatus
    });
  };

  // Execute confirmed status change
  const executeStatusChange = async () => {
    if (!confirmModal.booking) return;
    const bookingId = confirmModal.booking.bookingId;
    const newStatus = confirmModal.targetStatus;

    setActionLoading(true);
    try {
      const res = await axiosInstance.put('/order/update-status', {
        bookingId,
        status: newStatus
      });

      if (res.data?.success) {
        showToast(`Booking #${confirmModal.booking.bookingCode} marked as ${newStatus}!`, 'success');
        if (selectedBooking?.bookingId === bookingId) {
          setSelectedBooking((prev) => (prev ? { ...prev, confirmStatus: newStatus } : null));
        }
        setConfirmModal({ isOpen: false, booking: null, targetStatus: 'Confirmed' });
        await loadDashboardData();
      } else {
        showToast(res.data?.message || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed' || s === '1') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 size={12} /> Confirmed
        </span>
      );
    }
    if (s === 'completed' || s === '5') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    }
    if (s === 'cancelled' || s === '6') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle size={12} /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock size={12} /> Pending
      </span>
    );
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Overview</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                Live DB Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time bookings, fleet operations, and action-required queues.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to="/orders"
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>Manage All Bookings</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 1. Real-Time Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Bookings */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Rides</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Car size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalBookings}</div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">All time bookings</div>
          </div>

          {/* Pending Action */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Action</span>
              <div className="w-8 h-8 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-900">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-950">{stats.pendingCount}</div>
            <div className="text-[11px] text-amber-800 font-bold mt-1">Needs confirmation</div>
          </div>

          {/* Confirmed */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Confirmed</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.confirmedCount}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">Ready for pickup</div>
          </div>

          {/* Completed */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.completedCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Successfully finished</div>
          </div>

          {/* Cancelled */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-rose-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cancelled</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700">
                <XCircle size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.cancelledCount}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">Cancelled by user/admin</div>
          </div>
        </div>

        {/* 2. ACTION REQUIRED: Pending Bookings Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Action Required ({pendingBookings.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Confirm or manage incoming ride requests
            </span>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">All clear! No pending rides</h3>
              <p className="text-xs text-slate-500">Every new booking will automatically appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBookings.map((bk) => {
                const customerName = bk.user?.username || bk.behalfOfName || 'Customer';
                const customerPhone = bk.user?.mobile || bk.behalfOfPhone || 'N/A';
                const vehicleName = bk.preferredType || bk.vehicleType?.vehicleType || 'Cab';

                return (
                  <div
                    key={bk.bookingId}
                    className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono">
                          {bk.bookingCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{customerName}</h4>
                        <span className="text-xs text-slate-500">{customerPhone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-700">₹{bk.finalFare || 550}</span>
                        <span className="block text-[11px] font-bold text-slate-500">
                          {bk.distanceKm ? `${bk.distanceKm} km` : 'Standard'}
                        </span>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                        <span className="truncate">{bk.pickupPoint}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                        <span className="truncate">{bk.dropPoint}</span>
                      </div>
                    </div>

                    {/* Schedule & Vehicle */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="font-semibold">
                        <Calendar size={12} className="inline mr-1" />
                        {formatCustomDate(bk.bookingDate, bk.bookingTime)}
                      </span>
                      <span className="font-bold text-slate-800">{vehicleName}</span>
                    </div>

                    {/* Quick Action Buttons (Triggers Reusable Popup) */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => promptStatusChange(bk, 'Confirmed')}
                        className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={14} />
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => promptStatusChange(bk, 'Cancelled')}
                        className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(bk)}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. RECENT BOOKINGS Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Recent Bookings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real database booking history and statuses.</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="pb-3 px-3">Booking ID</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Route</th>
                  <th className="pb-3 px-3">Distance</th>
                  <th className="pb-3 px-3">Vehicle</th>
                  <th className="pb-3 px-3">Fare</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                      No bookings recorded in database yet.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((bk) => (
                    <tr key={bk.bookingId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {bk.bookingCode}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">
                          {bk.user?.username || bk.behalfOfName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {bk.user?.mobile || bk.behalfOfPhone || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-[220px]">
                        <div className="truncate text-slate-800">
                          <span className="text-emerald-700">{bk.pickupPoint}</span>
                          <span className="text-slate-400"> → </span>
                          <span className="text-rose-700">{bk.dropPoint}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatCustomDate(bk.bookingDate, bk.bookingTime)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {bk.distanceKm ? `${bk.distanceKm} km` : '-'}
                      </td>
                      <td className="py-3.5 px-3">
                        {bk.preferredType || bk.vehicleType?.vehicleType || 'Cab'}
                      </td>
                      <td className="py-3.5 px-3 font-black text-emerald-700 text-sm">
                        ₹{bk.finalFare || 550}
                      </td>
                      <td className="py-3.5 px-3">{getStatusBadge(bk.confirmStatus)}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(bk)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Unified Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Booking Reference</span>
                  <h3 className="text-xl font-black text-slate-900 font-mono">
                    {selectedBooking.bookingCode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Current Trip Status</span>
                {getStatusBadge(selectedBooking.confirmStatus)}
              </div>

              {/* Customer & Trip Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <p className="font-bold text-slate-900">
                    {selectedBooking.user?.username || selectedBooking.behalfOfName || 'Customer'}
                  </p>
                  <p className="text-slate-500 font-semibold">
                    {selectedBooking.user?.mobile || selectedBooking.behalfOfPhone || 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle Category</span>
                  <p className="font-bold text-slate-900">
                    {selectedBooking.preferredType || selectedBooking.vehicleType?.vehicleType || 'Cab'}
                  </p>
                  <p className="text-slate-500 font-semibold">
                    {formatCustomDate(selectedBooking.bookingDate, selectedBooking.bookingTime)}
                  </p>
                </div>
              </div>

              {/* Route */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs font-semibold">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Pickup Location</span>
                  <p className="text-slate-900 mt-0.5">{selectedBooking.pickupPoint}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Drop Destination</span>
                  <p className="text-slate-900 mt-0.5">{selectedBooking.dropPoint}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between">
                  <span className="text-slate-500">Route Distance:</span>
                  <span className="font-black text-slate-900">
                    {selectedBooking.distanceKm ? `${selectedBooking.distanceKm} km` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Stored Fare Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Permanent Total Fare</span>
                  <span className="text-[11px] text-amber-400 font-bold">Stored snapshot (No recalculation)</span>
                </div>
                <span className="text-2xl font-black text-amber-400">
                  ₹{selectedBooking.finalFare || 550}
                </span>
              </div>

              {/* Modal Contextual Action Buttons */}
              <div className="flex gap-2">
                {selectedBooking.confirmStatus === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => promptStatusChange(selectedBooking, 'Confirmed')}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check size={16} />
                      Confirm Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => promptStatusChange(selectedBooking, 'Cancelled')}
                      className="py-3 px-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {selectedBooking.confirmStatus === 'Confirmed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => promptStatusChange(selectedBooking, 'Completed')}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={16} />
                      Mark Ride Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => promptStatusChange(selectedBooking, 'Cancelled')}
                      className="py-3 px-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Reusable Confirmation Popup */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={
            confirmModal.targetStatus === 'Confirmed'
              ? 'Confirm Booking?'
              : confirmModal.targetStatus === 'Completed'
              ? 'Complete Booking?'
              : 'Cancel Booking?'
          }
          description={
            confirmModal.targetStatus === 'Confirmed'
              ? 'Are you sure you want to confirm this booking and assign it for pickup?'
              : confirmModal.targetStatus === 'Completed'
              ? 'Are you sure you want to mark this trip as successfully completed?'
              : 'Are you sure you want to cancel this booking? This action will update the status.'
          }
          bookingDetails={
            confirmModal.booking
              ? {
                  bookingCode: confirmModal.booking.bookingCode,
                  customerName: confirmModal.booking.user?.username || confirmModal.booking.behalfOfName || 'Customer',
                  route: `${confirmModal.booking.pickupPoint} → ${confirmModal.booking.dropPoint}`,
                  finalFare: confirmModal.booking.finalFare
                }
              : undefined
          }
          confirmText={
            confirmModal.targetStatus === 'Confirmed'
              ? 'Confirm Booking'
              : confirmModal.targetStatus === 'Completed'
              ? 'Mark as Completed'
              : 'Cancel Booking'
          }
          cancelText={confirmModal.targetStatus === 'Cancelled' ? 'Keep Booking' : 'Cancel'}
          variant={
            confirmModal.targetStatus === 'Confirmed' || confirmModal.targetStatus === 'Completed'
              ? 'success'
              : 'danger'
          }
          isLoading={actionLoading}
          loadingText={
            confirmModal.targetStatus === 'Confirmed'
              ? 'Confirming...'
              : confirmModal.targetStatus === 'Completed'
              ? 'Completing...'
              : 'Cancelling...'
          }
          onConfirm={executeStatusChange}
          onClose={() => setConfirmModal({ isOpen: false, booking: null, targetStatus: 'Confirmed' })}
        />
      </div>
    </PageLayout>
  );
};

export default Dashboard;