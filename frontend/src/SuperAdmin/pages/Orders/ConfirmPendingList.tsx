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
  Eye,
  UserCheck,
  Play,
  Check,
  CreditCard,
  Banknote,
  Phone,
  Navigation,
  Loader2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface DriverItem {
  driverId: string;
  driverName: string;
  phno: string;
  status: string;
  vehicle?: {
    vehicleName: string;
    vehicleNo?: string;
  };
}

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
  driverId?: string;
  driver?: any;
  paymentStatus?: string;
  paymentMethod?: string;
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

  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'confirmed' | 'assigned' | 'started' | 'completed' | 'cancelled'
  >('all');
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  // Driver Assignment State
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    booking: BookingItem | null;
  }>({
    isOpen: false,
    booking: null
  });
  const [availableDrivers, setAvailableDrivers] = useState<DriverItem[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [loadingDrivers, setLoadingDrivers] = useState<boolean>(false);
  const [assigningDriver, setAssigningDriver] = useState<boolean>(false);

  // Complete Ride Confirmation Popup State
  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    booking: BookingItem | null;
  }>({
    isOpen: false,
    booking: null
  });
  const [completingRide, setCompletingRide] = useState<boolean>(false);

  // Mark Cash Paid Confirmation State
  const [cashPaidModal, setCashPaidModal] = useState<{
    isOpen: boolean;
    booking: BookingItem | null;
  }>({
    isOpen: false,
    booking: null
  });
  const [markingCashPaid, setMarkingCashPaid] = useState<boolean>(false);

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
        return {
          ...b,
          confirmStatus: b.confirmStatus || 'Confirmed',
          bookingStatus: b.bookingStatus || b.confirmStatus || 'CONFIRMED',
          paymentStatus: b.paymentStatus || 'PENDING',
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

  // Open Driver Assign Modal
  const openAssignModal = async (booking: BookingItem) => {
    setAssignModal({ isOpen: true, booking });
    setSelectedDriverId('');
    setLoadingDrivers(true);
    try {
      const res = await axiosInstance.get('/order/available-drivers');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAvailableDrivers(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDriverId(res.data.data[0].driverId);
        }
      } else {
        setAvailableDrivers([]);
      }
    } catch (err) {
      console.error('Error loading drivers:', err);
      showToast('Failed to fetch available drivers.', 'error');
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Execute Driver Assignment
  const handleAssignDriver = async () => {
    if (!assignModal.booking || !selectedDriverId) {
      showToast('Please select an available driver.', 'warn');
      return;
    }

    setAssigningDriver(true);
    try {
      const res = await axiosInstance.post('/order/assign-driver', {
        bookingId: assignModal.booking.bookingId,
        driverId: selectedDriverId
      });

      if (res.data?.success) {
        showToast(`Driver assigned successfully to Booking #${assignModal.booking.bookingCode}!`, 'success');
        setAssignModal({ isOpen: false, booking: null });
        if (selectedBooking?.bookingId === assignModal.booking.bookingId) {
          setSelectedBooking(res.data.data);
        }
        await fetchOrders();
      } else {
        showToast(res.data?.message || 'Driver is no longer available.', 'error');
      }
    } catch (err: any) {
      console.error('Assign driver error:', err);
      showToast(err.response?.data?.message || 'Failed to assign driver.', 'error');
    } finally {
      setAssigningDriver(false);
    }
  };

  // Start Trip Action
  const handleStartTrip = async (booking: BookingItem) => {
    try {
      const res = await axiosInstance.post('/order/start-trip', {
        bookingId: booking.bookingId
      });

      if (res.data?.success) {
        showToast(`Trip #${booking.bookingCode} started! Driver is now ON_TRIP.`, 'success');
        if (selectedBooking?.bookingId === booking.bookingId) {
          setSelectedBooking(res.data.data);
        }
        await fetchOrders();
      } else {
        showToast(res.data?.message || 'Failed to start trip.', 'error');
      }
    } catch (err: any) {
      console.error('Start trip error:', err);
      showToast(err.response?.data?.message || 'Failed to start trip.', 'error');
    }
  };

  // Complete Ride Action
  const handleCompleteRide = async () => {
    if (!completeModal.booking) return;
    setCompletingRide(true);
    try {
      const res = await axiosInstance.post('/order/complete-trip', {
        bookingId: completeModal.booking.bookingId
      });

      if (res.data?.success) {
        showToast(
          `Ride #${completeModal.booking.bookingCode} completed! Final fare generated. Driver is now AVAILABLE.`,
          'success'
        );
        setCompleteModal({ isOpen: false, booking: null });
        if (selectedBooking?.bookingId === completeModal.booking.bookingId) {
          setSelectedBooking(res.data.data);
        }
        await fetchOrders();
      } else {
        showToast(res.data?.message || 'Failed to complete trip.', 'error');
      }
    } catch (err: any) {
      console.error('Complete trip error:', err);
      showToast(err.response?.data?.message || 'Failed to complete trip.', 'error');
    } finally {
      setCompletingRide(false);
    }
  };

  // Mark Cash as Paid Action
  const handleMarkCashPaid = async () => {
    if (!cashPaidModal.booking) return;
    setMarkingCashPaid(true);
    try {
      const res = await axiosInstance.post('/order/mark-cash-paid', {
        bookingId: cashPaidModal.booking.bookingId
      });

      if (res.data?.success) {
        showToast(`Payment for #${cashPaidModal.booking.bookingCode} marked as PAID!`, 'success');
        setCashPaidModal({ isOpen: false, booking: null });
        if (selectedBooking?.bookingId === cashPaidModal.booking.bookingId) {
          setSelectedBooking(res.data.data);
        }
        await fetchOrders();
      } else {
        showToast(res.data?.message || 'Failed to update payment status.', 'error');
      }
    } catch (err: any) {
      console.error('Mark cash paid error:', err);
      showToast(err.response?.data?.message || 'Failed to update payment.', 'error');
    } finally {
      setMarkingCashPaid(false);
    }
  };

  const getStatusBadge = (b: BookingItem) => {
    const cs = (b.confirmStatus || '').toLowerCase();
    const ps = (b.paymentStatus || '').toUpperCase();

    if (cs.includes('cancel') || cs.includes('decline')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle size={12} /> Cancelled
        </span>
      );
    }

    if (cs.includes('completed')) {
      if (ps === 'PAID') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Completed (Paid)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock size={12} /> Completed (Payment Pending)
        </span>
      );
    }

    if (cs.includes('trip started') || cs.includes('started')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Navigation size={12} className="animate-spin" /> Trip In Progress
        </span>
      );
    }

    if (cs.includes('driver assigned') || cs.includes('assigned') || Boolean(b.driverId || b.driver?.driverName)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Car size={12} /> Driver Assigned
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} /> Confirmed (Unassigned)
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
              End-to-end lifecycle: Driver Allocation, Trip Dispatch, Completion, and Payment Reconciliation.
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
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'assigned', label: 'Assigned' },
                { key: 'started', label: 'In Trip' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
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
                  <th className="py-3.5 px-4">Chauffeur</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Fare</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
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
                  orders.map((bk) => {
                    const cs = (bk.confirmStatus || '').toLowerCase();
                    const isCompleted = cs.includes('completed');
                    const isStarted = cs.includes('trip started') || cs.includes('started');
                    const isAssigned =
                      cs.includes('driver assigned') || cs.includes('assigned') || Boolean(bk.driverId || bk.driver?.driverName);
                    const isCancelled = cs.includes('cancel') || cs.includes('decline');
                    const isPendingPayment = isCompleted && bk.paymentStatus !== 'PAID';

                    return (
                      <tr key={bk.bookingId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {bk.bookingCode}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{bk.userName}</span>
                          <span className="text-[11px] text-slate-400">{bk.mobile}</span>
                        </td>

                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="truncate text-slate-800">
                            <span className="text-emerald-700 font-bold">{bk.pickupPoint}</span>
                            <span className="text-slate-400"> → </span>
                            <span className="text-rose-700 font-bold">{bk.dropPoint}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            {formatToCustom(bk.bookingDate, bk.bookingTime)} · {bk.distanceKm} km
                          </span>
                        </td>

                        {/* Driver */}
                        <td className="py-3.5 px-4">
                          {bk.driver?.driverName ? (
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {bk.driver.driverName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {bk.driver.phno}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {bk.preferredType}
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                          ₹{bk.finalFare || 550}
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(bk)}</td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Assign Driver if confirmed & unassigned */}
                            {!isAssigned && !isStarted && !isCompleted && !isCancelled && (
                              <button
                                type="button"
                                onClick={() => openAssignModal(bk)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all"
                                title="Assign Available Chauffeur"
                              >
                                <UserCheck size={12} /> Assign Driver
                              </button>
                            )}

                            {/* 2. Start Trip if assigned */}
                            {isAssigned && !isStarted && !isCompleted && !isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleStartTrip(bk)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all"
                                title="Start Ride"
                              >
                                <Play size={12} /> Start Trip
                              </button>
                            )}

                            {/* 3. Complete Trip if in trip or assigned */}
                            {isStarted && !isCompleted && !isCancelled && (
                              <button
                                type="button"
                                onClick={() => setCompleteModal({ isOpen: true, booking: bk })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all"
                                title="Complete Ride"
                              >
                                <Check size={12} /> Complete Ride
                              </button>
                            )}

                            {/* 4. Mark Cash Paid if completed & payment pending */}
                            {isPendingPayment && (
                              <button
                                type="button"
                                onClick={() => setCashPaidModal({ isOpen: true, booking: bk })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all"
                                title="Mark Cash Payment Received"
                              >
                                <Banknote size={12} /> Mark Cash Paid
                              </button>
                            )}

                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(bk)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MODAL: ASSIGN DRIVER ================= */}
        {assignModal.isOpen && assignModal.booking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Chauffeur Allocation</span>
                  <h3 className="text-lg font-black text-slate-900">
                    Assign Driver to #{assignModal.booking.bookingCode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignModal({ isOpen: false, booking: null })}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Ride Snapshot */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Route:</span>
                  <span className="text-slate-900 font-bold truncate max-w-[200px]">
                    {assignModal.booking.pickupPoint} → {assignModal.booking.dropPoint}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Schedule:</span>
                  <span className="text-slate-900">
                    {assignModal.booking.bookingDate} at {assignModal.booking.bookingTime}
                  </span>
                </div>
              </div>

              {/* Drivers Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 block">
                  Select Available Chauffeur
                </label>

                {loadingDrivers ? (
                  <div className="py-6 text-center text-xs font-bold text-slate-500">
                    <Loader2 size={20} className="animate-spin text-amber-500 mx-auto mb-1" />
                    Finding available chauffeurs...
                  </div>
                ) : availableDrivers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs font-bold text-rose-700">
                    No chauffeurs currently AVAILABLE. All active drivers are on trips.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableDrivers.map((d) => (
                      <label
                        key={d.driverId}
                        onClick={() => setSelectedDriverId(d.driverId)}
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedDriverId === d.driverId
                            ? 'border-amber-500 bg-amber-50/40 text-slate-950 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                            {d.driverName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-xs block text-slate-900">
                              {d.driverName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {d.phno} {d.vehicle?.vehicleNo ? `· ${d.vehicle.vehicleNo}` : ''}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          Available
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal({ isOpen: false, booking: null })}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assigningDriver || availableDrivers.length === 0 || !selectedDriverId}
                  onClick={handleAssignDriver}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {assigningDriver ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: COMPLETE RIDE POPUP ================= */}
        <ConfirmModal
          isOpen={completeModal.isOpen}
          title="Complete Ride?"
          description={`Are you sure you want to mark ride #${completeModal.booking?.bookingCode} as completed? This will finalize the trip fare (₹${completeModal.booking?.finalFare}) and release the chauffeur as AVAILABLE for new bookings.`}
          confirmText="Yes, Complete Ride"
          cancelText="Cancel"
          variant="success"
          isLoading={completingRide}
          loadingText="Completing..."
          onConfirm={handleCompleteRide}
          onClose={() => setCompleteModal({ isOpen: false, booking: null })}
        />

        {/* ================= MODAL: MARK CASH AS PAID POPUP ================= */}
        <ConfirmModal
          isOpen={cashPaidModal.isOpen}
          title="Record Cash Payment?"
          description={`Confirm that cash fare of ₹${cashPaidModal.booking?.finalFare} has been received for booking #${cashPaidModal.booking?.bookingCode}.`}
          confirmText="Yes, Mark as PAID"
          cancelText="Cancel"
          variant="primary"
          isLoading={markingCashPaid}
          loadingText="Updating..."
          onConfirm={handleMarkCashPaid}
          onClose={() => setCashPaidModal({ isOpen: false, booking: null })}
        />

        {/* ================= MODAL: UNIFIED BOOKING DETAILS ================= */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
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
                <span className="text-xs font-bold text-slate-600">Current Lifecycle Status</span>
                {getStatusBadge(selectedBooking)}
              </div>

              {/* Customer & Vehicle */}
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs font-semibold">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Pickup Location
                  </span>
                  <p className="text-slate-900 mt-0.5">{selectedBooking.pickupPoint}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">
                    Drop Destination
                  </span>
                  <p className="text-slate-900 mt-0.5">{selectedBooking.dropPoint}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between">
                  <span className="text-slate-500">Route Distance:</span>
                  <span className="font-black text-slate-900">
                    {selectedBooking.distanceKm ? `${selectedBooking.distanceKm} km` : 'Standard'}
                  </span>
                </div>
              </div>

              {/* Chauffeur Information (if assigned) */}
              {selectedBooking.driver?.driverName && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/70 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-blue-800 block">
                      Allocated Chauffeur
                    </span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {selectedBooking.driver.driverName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {selectedBooking.driver.phno}
                    </span>
                  </div>
                  {selectedBooking.driver.phno && (
                    <a
                      href={`tel:${selectedBooking.driver.phno}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1"
                    >
                      <Phone size={12} /> Call
                    </a>
                  )}
                </div>
              )}

              {/* Stored Fare Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Authoritative Fare</span>
                  <span className="text-[11px] text-amber-400 font-bold">
                    Payment: {selectedBooking.paymentStatus || 'PENDING'}
                  </span>
                </div>
                <span className="text-2xl font-black text-amber-400">
                  ₹{selectedBooking.finalFare || 550}
                </span>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ConfirmPendingList;
