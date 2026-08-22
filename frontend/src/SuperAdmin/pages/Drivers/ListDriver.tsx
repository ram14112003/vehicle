import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import ConfirmModal from '../../../components/ConfirmModal';
import axiosInstance from '../../../utils/axiosInstance';
import {
  UserCheck,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Car,
  IdCard,
  Edit2,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Navigation,
  Ban,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface VehicleOption {
  vehicleId: string;
  vehicleName: string;
  vehicleNo?: string;
  vehicleTypeId?: string;
}

interface DriverRecord {
  driverId: string;
  driverName: string;
  driverEmail?: string;
  phno: string;
  licenseNo: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ON_TRIP' | 'OFFLINE';
  vehicleId?: string;
  vehicleTypeId?: string;
  vehicle?: {
    vehicleId: string;
    vehicleName: string;
    vehicleNo?: string;
  };
  vehicleType?: {
    vehicleType: string;
  };
  currentBooking?: {
    bookingId: string;
    bookingCode: string;
    pickupPoint: string;
    dropPoint: string;
    confirmStatus: string;
    bookingStatus: string;
  } | null;
  createdAt: string;
}

const ListDriver: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'assigned' | 'on_trip' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Driver Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addingDriver, setAddingDriver] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    driverName: '',
    phno: '',
    driverEmail: '',
    licenseNo: '',
    vehicleId: '',
    status: 'AVAILABLE'
  });

  // Edit Driver Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<boolean>(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(null);
  const [editForm, setEditForm] = useState({
    driverName: '',
    phno: '',
    driverEmail: '',
    licenseNo: '',
    vehicleId: '',
    status: 'AVAILABLE'
  });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    driver: DriverRecord | null;
  }>({
    isOpen: false,
    driver: null
  });
  const [deletingDriver, setDeletingDriver] = useState<boolean>(false);

  // Fetch Vehicles for dropdowns
  const fetchVehicles = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/vehicle/getAllVehicles');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setVehicles(res.data.data);
      } else if (Array.isArray(res.data?.vehicles)) {
        setVehicles(res.data.vehicles);
      } else if (Array.isArray(res.data)) {
        setVehicles(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch vehicles list:', err);
    }
  }, []);

  // Fetch Drivers with filters
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/driver/getAllDrivers', {
        params: {
          status: activeTab !== 'all' ? activeTab : undefined,
          search: searchQuery.trim() || undefined
        }
      });

      if (res.data?.success && Array.isArray(res.data.drivers)) {
        setDrivers(res.data.drivers);
      } else if (Array.isArray(res.data?.drivers)) {
        setDrivers(res.data.drivers);
      } else {
        setDrivers([]);
      }
    } catch (err: any) {
      console.error('Error loading drivers:', err);
      showToast('Failed to fetch drivers from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, [fetchDrivers, fetchVehicles]);

  // Handle Add Driver Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.driverName.trim()) {
      showToast('Driver Name is required.', 'warn');
      return;
    }
    if (!addForm.phno.trim()) {
      showToast('Phone number is required.', 'warn');
      return;
    }
    if (!addForm.licenseNo.trim()) {
      showToast('License Number is required.', 'warn');
      return;
    }

    setAddingDriver(true);
    try {
      const res = await axiosInstance.post('/driver/create', addForm);
      if (res.data?.success) {
        showToast('Driver added successfully!', 'success');
        setIsAddModalOpen(false);
        setAddForm({
          driverName: '',
          phno: '',
          driverEmail: '',
          licenseNo: '',
          vehicleId: '',
          status: 'AVAILABLE'
        });
        await fetchDrivers();
      } else {
        showToast(res.data?.message || 'Failed to create driver.', 'error');
      }
    } catch (err: any) {
      console.error('Add driver error:', err);
      showToast(err.response?.data?.message || 'Failed to add driver.', 'error');
    } finally {
      setAddingDriver(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (driver: DriverRecord) => {
    setSelectedDriver(driver);
    setEditForm({
      driverName: driver.driverName || '',
      phno: driver.phno || '',
      driverEmail: driver.driverEmail || '',
      licenseNo: driver.licenseNo || '',
      vehicleId: driver.vehicleId || '',
      status: driver.status || 'AVAILABLE'
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Driver Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    if (!editForm.driverName.trim()) {
      showToast('Driver Name is required.', 'warn');
      return;
    }
    if (!editForm.phno.trim()) {
      showToast('Phone number is required.', 'warn');
      return;
    }
    if (!editForm.licenseNo.trim()) {
      showToast('License Number is required.', 'warn');
      return;
    }

    // Protection check
    const hasActiveTrip = Boolean(selectedDriver.currentBooking);
    if (hasActiveTrip && editForm.status === 'AVAILABLE' && selectedDriver.status !== 'AVAILABLE') {
      showToast('Cannot set status to AVAILABLE while assigned to an active trip.', 'error');
      return;
    }

    setEditingDriver(true);
    try {
      const res = await axiosInstance.put(`/driver/update/${selectedDriver.driverId}`, editForm);
      if (res.data?.success) {
        showToast('Driver updated successfully!', 'success');
        setIsEditModalOpen(false);
        setSelectedDriver(null);
        await fetchDrivers();
      } else {
        showToast(res.data?.message || 'Failed to update driver.', 'error');
      }
    } catch (err: any) {
      console.error('Update driver error:', err);
      showToast(err.response?.data?.message || 'Failed to update driver.', 'error');
    } finally {
      setEditingDriver(false);
    }
  };

  // Handle Safe Delete / Deactivate Driver
  const handleDeleteDriver = async () => {
    if (!deleteModal.driver) return;
    setDeletingDriver(true);
    try {
      const res = await axiosInstance.delete(`/driver/delete/${deleteModal.driver.driverId}`);
      if (res.data?.success) {
        showToast(`Driver ${deleteModal.driver.driverName} deactivated successfully.`, 'success');
        setDeleteModal({ isOpen: false, driver: null });
        await fetchDrivers();
      } else {
        showToast(res.data?.message || 'Cannot deactivate driver.', 'error');
      }
    } catch (err: any) {
      console.error('Delete driver error:', err);
      showToast(err.response?.data?.message || 'Failed to deactivate driver.', 'error');
    } finally {
      setDeletingDriver(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> AVAILABLE
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
            <Car size={12} /> ASSIGNED
          </span>
        );
      case 'ON_TRIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse">
            <Navigation size={12} className="animate-spin" /> ON TRIP
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
            <Ban size={12} /> OFFLINE
          </span>
        );
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Drivers</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                {drivers.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Manage drivers and their availability.</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchDrivers}
              disabled={loading}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all disabled:opacity-50"
              title="Refresh List"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-amber-600' : ''} />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
            >
              <Plus size={16} className="stroke-[3]" /> Add Driver
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto w-full md:w-auto">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'available', label: 'Available' },
                { key: 'assigned', label: 'Assigned' },
                { key: 'on_trip', label: 'On Trip' },
                { key: 'offline', label: 'Offline' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
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
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, license..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Driver</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4">License</th>
                  <th className="py-4 px-4">Vehicle</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Current Booking</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500 font-bold">
                      <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                      Loading drivers from database...
                    </td>
                  </tr>
                ) : drivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <UserCheck size={28} />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">No drivers found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchQuery ? 'No drivers match your search query.' : 'Click "+ Add Driver" to register a driver.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  drivers.map((d) => (
                    <tr key={d.driverId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Driver Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                            {d.driverName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block text-xs">{d.driverName}</span>
                            {d.driverEmail && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                                {d.driverEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <a
                          href={`tel:${d.phno}`}
                          className="inline-flex items-center gap-1 hover:text-amber-600 transition-colors"
                        >
                          <Phone size={11} className="text-slate-400" />
                          {d.phno}
                        </a>
                      </td>

                      {/* License */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {d.licenseNo}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        {d.vehicle?.vehicleName || d.vehicleType?.vehicleType ? (
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {d.vehicle?.vehicleName || d.vehicleType?.vehicleType}
                            </span>
                            {d.vehicle?.vehicleNo && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {d.vehicle.vehicleNo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">{getStatusBadge(d.status)}</td>

                      {/* Current Booking */}
                      <td className="py-3.5 px-4">
                        {d.currentBooking ? (
                          <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100 max-w-[200px]">
                            <span className="font-mono font-black text-blue-900 block text-[11px]">
                              #{d.currentBooking.bookingCode}
                            </span>
                            <span className="text-[10px] text-blue-700 truncate block">
                              {d.currentBooking.pickupPoint} → {d.currentBooking.dropPoint}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No active booking</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(d)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                            title="Edit Driver"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, driver: d })}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                            title="Deactivate Driver"
                          >
                            <Trash2 size={13} />
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

        {/* ================= MODAL: ADD DRIVER ================= */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">New Chauffeur Registration</span>
                  <h3 className="text-lg font-black text-slate-900">Add Driver</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Driver Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={addForm.driverName}
                    onChange={(e) => setAddForm({ ...addForm, driverName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={addForm.phno}
                      onChange={(e) => setAddForm({ ...addForm, phno: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. arun@easyride.in"
                      value={addForm.driverEmail}
                      onChange={(e) => setAddForm({ ...addForm, driverEmail: e.target.value })}

                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    License Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN-07-202100099"
                    value={addForm.licenseNo}
                    onChange={(e) => setAddForm({ ...addForm, licenseNo: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Vehicle</label>
                    <select
                      value={addForm.vehicleId}
                      onChange={(e) => setAddForm({ ...addForm, vehicleId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value="">-- Optional / None --</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                          {v.vehicleName} {v.vehicleNo ? `(${v.vehicleNo})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="OFFLINE">OFFLINE</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingDriver}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {addingDriver ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Driver'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: EDIT DRIVER ================= */}
        {isEditModalOpen && selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Modify Chauffeur Record</span>
                  <h3 className="text-lg font-black text-slate-900">Edit Driver</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Active Trip Notice */}
              {selectedDriver.currentBooking && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block">Active Ride In Progress</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Assigned to #{selectedDriver.currentBooking.bookingCode}. Status cannot be manually set to
                      AVAILABLE until the ride completes.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Driver Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.driverName}
                    onChange={(e) => setEditForm({ ...editForm, driverName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phno}
                      onChange={(e) => setEditForm({ ...editForm, phno: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editForm.driverEmail}
                      onChange={(e) => setEditForm({ ...editForm, driverEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    License Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.licenseNo}
                    onChange={(e) => setEditForm({ ...editForm, licenseNo: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Vehicle</label>
                    <select
                      value={editForm.vehicleId}
                      onChange={(e) => setEditForm({ ...editForm, vehicleId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value="">-- Unassigned --</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                          {v.vehicleName} {v.vehicleNo ? `(${v.vehicleNo})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Driver Status</label>
                    <select
                      value={editForm.status}
                      disabled={Boolean(selectedDriver.currentBooking)}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-slate-900 font-semibold focus:outline-none disabled:opacity-50"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="ON_TRIP">ON_TRIP</option>
                      <option value="OFFLINE">OFFLINE</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingDriver}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {editingDriver ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Updating...
                      </>
                    ) : (
                      'Update Driver'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: SAFE DEACTIVATE CONFIRMATION ================= */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Deactivate Driver?"
          description={`Are you sure you want to deactivate driver "${deleteModal.driver?.driverName}"? Historical trips and records will remain preserved.`}
          confirmText="Yes, Deactivate"
          cancelText="Cancel"
          variant="danger"
          isLoading={deletingDriver}
          loadingText="Deactivating..."
          onConfirm={handleDeleteDriver}
          onClose={() => setDeleteModal({ isOpen: false, driver: null })}
        />
      </div>
    </PageLayout>
  );
};

export default ListDriver;