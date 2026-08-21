import React, { useEffect, useState, useCallback } from "react";
import PageLayout from "../../../../components/PageLayout";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import ConfirmModal from "../../../../components/ConfirmModal";
import axiosInstance from "../../../../utils/axiosInstance";
import { Link } from "react-router-dom";

import config from "../../../../config/config";
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  IndianRupee,
  Users,
  Clock,
  X,
  Save
} from "lucide-react";


interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
  priorMinutes: number;
  seatCapacity: number;
  baseFare?: number;
  perKmRate?: number;
  vehicleImg?: string[];
  isDeleted?: boolean;
}

const ListVehicleType: React.FC = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [editName, setEditName] = useState("");
  const [editSeats, setEditSeats] = useState("");
  const [editPriorMinutes, setEditPriorMinutes] = useState("");
  const [editBaseFare, setEditBaseFare] = useState("");
  const [editPerKmRate, setEditPerKmRate] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vehicle: VehicleType | null;
  }>({
    isOpen: false,
    vehicle: null
  });
  const [deleting, setDeleting] = useState(false);

  const buildImageUrl = (filenameOrUrl?: string) => {
    if (!filenameOrUrl) return "/images/step2.jpeg";
    if (/^https?:\/\//i.test(filenameOrUrl) || filenameOrUrl.startsWith("/images")) return filenameOrUrl;
    const BASE_URL = config.baseurl.apibaseurl || "http://localhost:5000";
    return `${BASE_URL}/uploads/vehicleImg/${filenameOrUrl}`;
  };

  // Fetch all vehicle types from database
  const fetchVehicleTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<{ data: VehicleType[] }>("/vehicleType/getAllVehicleTypesforWeb");
      const list = res.data?.data || [];
      setVehicleTypes(list);
    } catch (err) {
      console.error("Error loading vehicle types:", err);
      showToast("Failed to load vehicle types from database.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  // Filter list by search query
  const filteredVehicles = vehicleTypes.filter((vt) =>
    (vt.vehicleType || "").toLowerCase().includes(searchText.toLowerCase().trim())
  );

  // Open Edit Modal
  const openEditModal = (vt: VehicleType) => {
    setEditingVehicle(vt);
    setEditName(vt.vehicleType || "");
    setEditSeats(String(vt.seatCapacity || 4));
    setEditPriorMinutes(String(vt.priorMinutes || 30));
    setEditBaseFare(String(vt.baseFare || 250));
    setEditPerKmRate(String(vt.perKmRate || 14));
    setEditImage(null);
    const existingImg = Array.isArray(vt.vehicleImg) && vt.vehicleImg.length > 0 ? vt.vehicleImg[0] : "";
    setEditPreviewUrl(existingImg ? buildImageUrl(existingImg) : null);
  };

  // Handle Image File Selection in Edit Modal
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImage(file);
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Save Edit Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    if (!editName.trim()) {
      showToast("Vehicle Type name is required", "error");
      return;
    }
    const bFare = parseFloat(editBaseFare);
    if (isNaN(bFare) || bFare < 10) {
      showToast("Base Fare must be at least ₹10", "error");
      return;
    }
    const kmRate = parseFloat(editPerKmRate);
    if (isNaN(kmRate) || kmRate < 1) {
      showToast("Rate per KM must be at least ₹1/km", "error");
      return;
    }

    try {
      setSavingEdit(true);

      const formData = new FormData();
      formData.append("vehicleType", editName.trim());
      formData.append("seatCapacity", editSeats);
      formData.append("priorMinutes", editPriorMinutes);
      formData.append("baseFare", editBaseFare);
      formData.append("perKmRate", editPerKmRate);

      if (editImage) {
        formData.append("vehicleImg", editImage);
      }

      await axiosInstance.put(
        `/vehicleType/${editingVehicle.vehicleTypeId}/update`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      showToast(`Updated "${editName}" pricing & details successfully!`, "success");
      setEditingVehicle(null);
      await fetchVehicleTypes();
    } catch (err: any) {
      console.error("Update error:", err);
      showToast(err?.response?.data?.message || "Failed to update vehicle type", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Execute Deletion
  const handleConfirmDelete = async () => {
    if (!deleteModal.vehicle) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(`/vehicleType/${deleteModal.vehicle.vehicleTypeId}/delete`);
      showToast(`"${deleteModal.vehicle.vehicleType}" deleted successfully!`, "success");
      setDeleteModal({ isOpen: false, vehicle: null });
      await fetchVehicleTypes();
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Deletion failed. Please try again.", "error");
    } finally {
      setDeleting(false);
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
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Vehicle Types & Pricing</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                {vehicleTypes.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure dynamic base fares and per-KM rates that directly power customer bookings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2"
            >
              <IndianRupee size={14} />
              <span>Bulk Pricing</span>
            </Link>

            <Link
              to="/vehicle/vehicletype/add"
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Add Vehicle Category</span>
            </Link>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search vehicle type (e.g. omni, suv)..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={fetchVehicleTypes}
            disabled={loading}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Main Vehicle Types Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vehicle Category</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Dynamic Base Fare</th>
                  <th className="py-3.5 px-4">Rate per KM</th>
                  <th className="py-3.5 px-4">Advance Notice</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                      <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                      Loading vehicle fleet from database...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Car size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No vehicle types found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try searching for a different name or add a new category.</p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vt) => {
                    const rawImg = Array.isArray(vt.vehicleImg) && vt.vehicleImg.length > 0 ? vt.vehicleImg[0] : "";
                    const imgUrl = buildImageUrl(rawImg);

                    return (
                      <tr key={vt.vehicleTypeId} className="hover:bg-slate-50/80 transition-colors">
                        {/* Vehicle Category & Image */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {rawImg ? (
                                <img
                                  src={imgUrl}
                                  alt={vt.vehicleType}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Car size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block capitalize">
                                {vt.vehicleType}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {vt.vehicleTypeId.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Capacity */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <Users size={12} className="text-slate-500" />
                            {vt.seatCapacity || 4} Seats
                          </span>
                        </td>

                        {/* Base Fare */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-emerald-700 text-sm">
                            ₹{vt.baseFare || 250}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block">Starting Fare</span>
                        </td>

                        {/* Rate per KM */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 text-sm">
                            ₹{vt.perKmRate || 14}/km
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block">Distance Rate</span>
                        </td>

                        {/* Advance Notice */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-semibold">
                            <Clock size={12} className="text-slate-400" />
                            {vt.priorMinutes || 30} mins
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(vt)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1"
                              title="Edit Vehicle Type & Pricing"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, vehicle: vt })}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors"
                              title="Delete Vehicle Category"
                            >
                              <Trash2 size={13} />
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

        {/* Quick Edit Modal */}
        {editingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Edit Vehicle Category</h3>
                    <p className="text-[11px] text-slate-400">Updates live pricing and passenger capacity.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Category Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seat Capacity *</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editSeats}
                      onChange={(e) => setEditSeats(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Advance Notice (Mins)</label>
                    <input
                      type="number"
                      min="0"
                      value={editPriorMinutes}
                      onChange={(e) => setEditPriorMinutes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Pricing Row */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                    <IndianRupee size={14} />
                    <span>Dynamic Pricing Configuration</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Base Fare (₹) *</label>
                      <input
                        type="number"
                        min="10"
                        value={editBaseFare}
                        onChange={(e) => setEditBaseFare(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-500 text-xs font-black text-emerald-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rate per KM (₹/km) *</label>
                      <input
                        type="number"
                        min="1"
                        value={editPerKmRate}
                        onChange={(e) => setEditPerKmRate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-500 text-xs font-black text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Photo Upload */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Update Photo</label>
                  <div className="flex items-center gap-3">
                    {editPreviewUrl && (
                      <div className="w-14 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        <img src={editPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Deletion */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Vehicle Category?"
          description={`Are you sure you want to delete "${deleteModal.vehicle?.vehicleType}"? Existing historical bookings will not be affected.`}
          confirmText="Delete Category"
          cancelText="Keep Category"
          variant="danger"
          isLoading={deleting}
          loadingText="Deleting..."
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ isOpen: false, vehicle: null })}
        />
      </div>
    </PageLayout>
  );
};

export default ListVehicleType;
