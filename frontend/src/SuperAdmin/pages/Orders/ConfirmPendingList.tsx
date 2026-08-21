import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import ConfirmModal from '../../../components/ConfirmModal';
import axiosInstance from '../../../utils/axiosInstance';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  Search,
  RefreshCw,
  Calendar,
  X,
  ShieldCheck,
  Check,
  Eye
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface BookingItem {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  bookingTime: string;
  pickupPoint: string;
  dropPoint?: string;
  distanceKm?: number;
  finalFare?: number;
  baseFare?: number;
  perKmRate?: number;
  preferredType?: string;
  vehicleType?: any;
  userId: string;
  user?: any;
  createdAt: string;
  userName?: string;
  mobile?: string;
  confirmStatus: string;
  bookingStatus: string;
  remarks?: string;
}

const formatToCustom = (dateString?: string, timeString?: string) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const timeFormatted = timeString ? ` at ${timeString.substring(0, 5)}` : '';
  return `${day} ${month} ${year}${timeFormatted}`;
};

const ConfirmPendingList: React.FC = () => {
  const location = useLocation();
  const { userId } = location.state || {};

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  // Reusable Confirmation Popup State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    booking: BookingItem | null;
    targetStatus: 'Confirmed' | 'Completed' | 'Cancelled';
  }>({
    isOpen: false,
    booking: null,
    targetStatus: 'Confirmed'
  });

  // Fetch real database orders with filter
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/order/admin/all-bookings', {
        params: {
          status: activeTab,
          search: searchText.trim() || undefined,
          limit: 100
        }
      });

      let bookings: any[] = response.data?.data || [];
      if (userId) {
        bookings = bookings.filter((b) => b.userId === userId);
      }

      const mapped: BookingItem[] = bookings.map((b: any) => {
        let status = 'Pending';
        const s = String(b.confirmStatus).toLowerCase();
        if (s === 'confirmed' || s === '1') status = 'Confirmed';
        else if (s === 'completed' || s === '5') status = 'Completed';
        else if (s === 'cancelled' || s === '6') status = 'Cancelled';

        return {
          ...b,
          confirmStatus: status,
          bookingStatus: b.bookingStatus || status,
          userName: b.user?.username || b.behalfOfName || 'Customer',
          mobile: b.user?.mobile || b.behalfOfPhone || '-',
          preferredType: b.preferredType || b.vehicleType?.vehicleType || 'Cab',
          finalFare: b.finalFare || 550,
          distanceKm: b.distanceKm || 0
        };
      });

      setOrders(mapped);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchText, userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Trigger popup
  const promptStatusChange = (booking: BookingItem, targetStatus: 'Confirmed' | 'Completed' | 'Cancelled') => {
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
        await fetchOrders();
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
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 size={12} /> Confirmed
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    }
    if (s === 'cancelled') {
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
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Bookings Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time view of customer rides, distances, stored fare snapshots, and status updates.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto w-full md:w-auto">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by ID, customer, route..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Main Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Route & Schedule</th>
                  <th className="py-3.5 px-4">Distance</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Fare</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                      <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                      Loading bookings from database...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <Car size={24} />
                      </div>
                      <p className="font-bold text-slate-700">No bookings found</p>
                      <p className="text-xs text-slate-400 mt-0.5">No records match the selected filter.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((bk) => (
                    <tr key={bk.bookingId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {bk.bookingCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{bk.userName}</span>
                        <span className="text-[11px] text-slate-400">{bk.mobile}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="truncate text-slate-800">
                          <span className="text-emerald-700 font-bold">{bk.pickupPoint}</span>
                          <span className="text-slate-400"> → </span>
                          <span className="text-rose-700 font-bold">{bk.dropPoint}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          {formatToCustom(bk.bookingDate, bk.bookingTime)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {bk.distanceKm ? `${bk.distanceKm} km` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {bk.preferredType}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                        ₹{bk.finalFare || 550}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(bk.confirmStatus)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {bk.confirmStatus === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => promptStatusChange(bk, 'Confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                              title="Confirm Booking"
                            >
                              Confirm
                            </button>
                          )}

                          {bk.confirmStatus === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => promptStatusChange(bk, 'Completed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                              title="Mark Ride Completed"
                            >
                              Complete
                            </button>
                          )}

                          {(bk.confirmStatus === 'Pending' || bk.confirmStatus === 'Confirmed') && (
                            <button
                              type="button"
                              onClick={() => promptStatusChange(bk, 'Cancelled')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors"
                              title="Cancel Booking"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedBooking(bk)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unified Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
              {/* Header */}
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

              {/* Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Current Trip Status</span>
                {getStatusBadge(selectedBooking.confirmStatus)}
              </div>

              {/* Customer & Vehicle info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <p className="font-bold text-slate-900">{selectedBooking.userName}</p>
                  <p className="text-slate-500 font-semibold">{selectedBooking.mobile}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle</span>
                  <p className="font-bold text-slate-900">{selectedBooking.preferredType}</p>
                  <p className="text-slate-500 font-semibold">
                    {formatToCustom(selectedBooking.bookingDate, selectedBooking.bookingTime)}
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
                    {selectedBooking.distanceKm ? `${selectedBooking.distanceKm} km` : 'Standard'}
                  </span>
                </div>
              </div>

              {/* Permanent Stored Fare */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Permanent Total Fare</span>
                  <span className="text-[11px] text-amber-400 font-bold">Stored snapshot (No recalculation)</span>
                </div>
                <span className="text-2xl font-black text-amber-400">
                  ₹{selectedBooking.finalFare || 550}
                </span>
              </div>

              {/* Modal Actions */}
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

        {/* Reusable Confirmation Popup */}
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
                  customerName: confirmModal.booking.userName || 'Customer',
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

export default ConfirmPendingList;
