import React, { useState } from 'react';
import PageLayout from '../../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../../components/AlertBox';
import axiosInstance from '../../../../utils/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Users,
  Clock,
  IndianRupee,
  ArrowLeft,
  AlertCircle,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Hash
} from 'lucide-react';



const AddVehicleType: React.FC = () => {
  const navigate = useNavigate();

  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('4');
  const [priorMinutes, setPriorMinutes] = useState('30');
  const [baseFare, setBaseFare] = useState('250');
  const [perKmRate, setPerKmRate] = useState('14');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    vehicleType?: string;
    vehicleNumber?: string;
    seatCapacity?: string;
    priorMinutes?: string;
    baseFare?: string;
    perKmRate?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size exceeds 5MB limit', 'error');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const errs: typeof errors = {};

    if (!vehicleType.trim()) {
      errs.vehicleType = 'Vehicle category / name is required';
    }
    if (!vehicleNumber.trim()) {
      errs.vehicleNumber = 'Vehicle registration number is required (e.g. TN 76 AB 1234)';
    }
    const seats = parseInt(seatCapacity);
    if (isNaN(seats) || seats < 1 || seats > 50) {
      errs.seatCapacity = 'Enter a valid passenger capacity (1 - 50)';
    }
    const prior = parseInt(priorMinutes);
    if (isNaN(prior) || prior < 0) {
      errs.priorMinutes = 'Enter valid advance notice in minutes';
    }
    const base = parseFloat(baseFare);
    if (isNaN(base) || base < 10) {
      errs.baseFare = 'Base Fare must be at least ₹10';
    }
    const rate = parseFloat(perKmRate);
    if (isNaN(rate) || rate < 1) {
      errs.perKmRate = 'Rate per KM must be at least ₹1/km';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors before saving', 'error');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('vehicleType', vehicleType.trim());
      formData.append('vehicleNumber', vehicleNumber.trim().toUpperCase());
      formData.append('seatCapacity', seatCapacity);
      formData.append('priorMinutes', priorMinutes);
      formData.append('baseFare', baseFare);
      formData.append('perKmRate', perKmRate);

      if (selectedImage) {
        formData.append('vehicleImg', selectedImage);
      }


      const res = await axiosInstance.post('/vendor/createVehicleType', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201 || res.data?.vehiType) {
        showToast(`Vehicle Category "${vehicleType}" added successfully!`, 'success');
        setTimeout(() => {
          navigate('/vehicle/vehicletype/list');
        }, 600);
      } else {
        showToast(res.data?.message || 'Failed to add vehicle type', 'error');
      }
    } catch (err: any) {
      console.error('Error adding vehicle type:', err);
      const msg = err.response?.data?.message || 'Failed to create vehicle type. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              to="/vehicle/vehicletype/list"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Add Vehicle Category</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a new vehicle type with dynamic pricing and capacity rules.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Car className="text-amber-500" size={20} />
              <h2 className="text-base font-black text-slate-900">Vehicle Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Vehicle Name / Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="e.g. Sedan Prime, SUV / Innova, Luxury"
                  className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                    errors.vehicleType ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-amber-500'
                  }`}
                />
                {errors.vehicleType && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.vehicleType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Vehicle Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TN 76 AB 1234"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border text-xs font-mono font-black uppercase text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                      errors.vehicleNumber ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                </div>
                {errors.vehicleNumber && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.vehicleNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Seat Capacity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={seatCapacity}
                    onChange={(e) => setSeatCapacity(e.target.value)}
                    placeholder="4"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                      errors.seatCapacity ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                </div>
                {errors.seatCapacity && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.seatCapacity}
                  </p>
                )}
              </div>
            </div>
          </div>


          {/* Section 2: Dynamic Pricing Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IndianRupee className="text-emerald-600" size={20} />
              <div>
                <h2 className="text-base font-black text-slate-900">Dynamic Pricing & Booking Rules</h2>
                <span className="text-[11px] text-slate-400 font-semibold">
                  These pricing rates directly drive live customer fare calculations.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Base Fare */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Base Fare (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                    placeholder="250"
                    className={`w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 border text-xs font-black text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                      errors.baseFare ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                </div>
                {errors.baseFare && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.baseFare}
                  </p>
                )}
              </div>

              {/* Rate per KM */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Rate per KM (₹/km) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={perKmRate}
                    onChange={(e) => setPerKmRate(e.target.value)}
                    placeholder="14"
                    className={`w-full pl-8 pr-12 py-2.5 rounded-2xl bg-slate-50 border text-xs font-black text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                      errors.perKmRate ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    /km
                  </span>
                </div>
                {errors.perKmRate && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.perKmRate}
                  </p>
                )}
              </div>

              {/* Prior Notice Minutes */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Advance Notice (Minutes)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={priorMinutes}
                    onChange={(e) => setPriorMinutes(e.target.value)}
                    placeholder="30"
                    className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Vehicle Photo Upload */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="text-blue-500" size={20} />
              <h2 className="text-base font-black text-slate-900">Vehicle Photo</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <Car size={24} className="mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] font-bold block">No image</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Vehicle Photo (JPG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 block mt-1">Maximum file size: 5MB</span>
              </div>
            </div>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate('/vehicle/vehicletype/list')}
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving vehicle...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Vehicle Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default AddVehicleType;