import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import ConfirmModal from '../../../components/ConfirmModal';
import axiosInstance from '../../../utils/axiosInstance';
import {
  Navigation,
  RefreshCw,
  Search,
  Play,
  Check,
  Car,
  Phone,
  UserCheck,
  Eye,
  Calendar,
  Clock
} from 'lucide-react';

interface AssignedTrip {
  bookingId: string;
  bookingCode: string;
  pickupPoint: string;
  dropPoint: string;
  bookingDate: string;
  bookingTime: string;
  distanceKm: number;
  finalFare: number;
  confirmStatus: string;
  bookingStatus: string;
  paymentStatus: string;
  preferredType?: string;
  driver?: {
    driverId: string;
    driverName: string;
    phno: string;
    licenseNo?: string;
  };
  vehicle?: {
    vehicleName: string;
    vehicleNo?: string;
  };
  user?: {
    username: string;
    mobile: string;
  };
  behalfOfName?: string;
  behalfOfPhone?: string;
}

const ListAssignedTask: React.FC = () => {
  const [trips, setTrips] = useState<AssignedTrip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Complete Ride Confirmation
  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    trip: AssignedTrip | null;
  }>({
    isOpen: false,
    trip: null
  });
  const [completingTrip, setCompletingTrip] = useState<boolean>(false);

  const fetchAssignedTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/order/admin/all-bookings', {
        params: {
          limit: 100
        }
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        // Filter only assigned or active trips
        const filtered = res.data.data.filter((b: any) => {
          const s = (b.confirmStatus || '').toLowerCase();
          return (
            s.includes('assigned') ||
            s.includes('driver assigned') ||
            s.includes('trip started') ||
            s.includes('started') ||
            Boolean(b.driverId && !s.includes('completed') && !s.includes('cancel'))
          );
        });
        setTrips(filtered);
      } else {
        setTrips([]);
      }
    } catch (err: any) {
      console.error('Error fetching assigned trips:', err);
      showToast('Failed to load active driver assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedTrips();
  }, [fetchAssignedTrips]);

  // Start Trip Action
  const handleStartTrip = async (trip: AssignedTrip) => {
    try {
      const res = await axiosInstance.post('/order/start-trip', {
        bookingId: trip.bookingId
      });

      if (res.data?.success) {
        showToast(`Trip #${trip.bookingCode} started successfully!`, 'success');
        await fetchAssignedTrips();
      } else {
        showToast(res.data?.message || 'Failed to start trip.', 'error');
      }
    } catch (err: any) {
      console.error('Start trip error:', err);
      showToast(err.response?.data?.message || 'Failed to start trip.', 'error');
    }
  };

  // Complete Trip Action
  const handleCompleteTrip = async () => {
    if (!completeModal.trip) return;
    setCompletingTrip(true);
    try {
      const res = await axiosInstance.post('/order/complete-trip', {
        bookingId: completeModal.trip.bookingId
      });

      if (res.data?.success) {
        showToast(
          `Ride #${completeModal.trip.bookingCode} completed! Driver is now AVAILABLE.`,
          'success'
        );
        setCompleteModal({ isOpen: false, trip: null });
        await fetchAssignedTrips();
      } else {
        showToast(res.data?.message || 'Failed to complete trip.', 'error');
      }
    } catch (err: any) {
      console.error('Complete trip error:', err);
      showToast(err.response?.data?.message || 'Failed to complete trip.', 'error');
    } finally {
      setCompletingTrip(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.bookingCode.toLowerCase().includes(q) ||
      t.pickupPoint.toLowerCase().includes(q) ||
      t.dropPoint.toLowerCase().includes(q) ||
      (t.driver?.driverName && t.driver.driverName.toLowerCase().includes(q))
    );
  });

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Active Dispatched Trips</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black">
                {filteredTrips.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live tracking of chauffeur assignments, in-transit rides, and destination completions.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAssignedTrips}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all disabled:opacity-50 self-start sm:self-auto"
            title="Refresh Trips"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-amber-600' : ''} />
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, driver, route..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Trip Ref</th>
                  <th className="py-4 px-4">Chauffeur</th>
                  <th className="py-4 px-4">Passenger</th>
                  <th className="py-4 px-4">Route & Schedule</th>
                  <th className="py-4 px-4">Vehicle</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Dispatch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500 font-bold">
                      <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                      Loading active dispatches...
                    </td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <Car size={28} />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">No active dispatches</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        All assigned rides have completed or no drivers are currently dispatched.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((t) => {
                    const s = (t.confirmStatus || '').toLowerCase();
                    const isStarted = s.includes('trip started') || s.includes('started');

                    return (
                      <tr key={t.bookingId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                          {t.bookingCode}
                        </td>

                        {/* Driver */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                              {t.driver?.driverName?.charAt(0) || 'D'}
                            </div>
                            <div>
                              <span className="font-black text-slate-900 block">
                                {t.driver?.driverName || 'Assigned Driver'}
                              </span>
                              {t.driver?.phno ? (
                                <a
                                  href={`tel:${t.driver.phno}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Call Driver"
                                >
                                  <Phone size={10} /> {t.driver.phno}
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">-</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Passenger */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">
                            {t.user?.username || t.behalfOfName || 'Customer'}
                          </span>
                          {(t.user?.mobile || t.behalfOfPhone) ? (
                            <a
                              href={`tel:${t.user?.mobile || t.behalfOfPhone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200/60 shadow-2xs transition-all active:scale-95"
                              title="Call Customer"
                            >
                              <Phone size={11} /> Call Customer
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>


                        {/* Route */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="truncate text-slate-800">
                            <span className="text-emerald-700 font-bold">{t.pickupPoint}</span>
                            <span className="text-slate-400"> → </span>
                            <span className="text-rose-700 font-bold">{t.dropPoint}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {t.bookingDate} at {t.bookingTime} · {t.distanceKm} km
                          </span>
                        </td>

                        {/* Vehicle */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">
                            {t.vehicle?.vehicleName || t.preferredType || 'Cab'}
                          </span>
                          {t.vehicle?.vehicleNo && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.vehicle.vehicleNo}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isStarted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <Navigation size={11} className="animate-spin" /> In Transit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                              <Car size={11} /> Driver Assigned
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isStarted ? (
                              <button
                                type="button"
                                onClick={() => handleStartTrip(t)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs flex items-center gap-1 transition-all"
                              >
                                <Play size={12} /> Start Trip
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCompleteModal({ isOpen: true, trip: t })}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs flex items-center gap-1 transition-all"
                              >
                                <Check size={12} /> Complete Ride
                              </button>
                            )}
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

        {/* Complete Ride Modal */}
        <ConfirmModal
          isOpen={completeModal.isOpen}
          title="Complete Ride?"
          description={`Are you sure you want to mark ride #${completeModal.trip?.bookingCode} as completed? Driver will be freed as AVAILABLE.`}
          confirmText="Yes, Complete Ride"
          cancelText="Cancel"
          variant="success"
          isLoading={completingTrip}
          loadingText="Completing..."
          onConfirm={handleCompleteTrip}
          onClose={() => setCompleteModal({ isOpen: false, trip: null })}
        />
      </div>
    </PageLayout>
  );
};

export default ListAssignedTask;