import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import axiosInstance from '../../../utils/axiosInstance';
import {
  Car,
  Save,
  RefreshCw,
  Info,
  DollarSign,
  Tag,
  ShieldAlert,
  Users
} from 'lucide-react';
import config from '../../../config/config';

interface VehicleTypeItem {
  vehicleTypeId: string;
  vehicleType: string;
  seatCapacity: number;
  priorMinutes: number;
  baseFare: number;
  perKmRate: number;
  vehicleImg?: string[];
  vehicles?: any[];
}

export const PricingSettings: React.FC = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form states per vehicle type
  const [formData, setFormData] = useState<{ [id: string]: { baseFare: number; perKmRate: number } }>({});

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/vehicleType/getAllVehicleType');
      const types: VehicleTypeItem[] = res.data?.data || [];

      setVehicleTypes(types);

      const initialForm: { [id: string]: { baseFare: number; perKmRate: number } } = {};
      types.forEach((vt) => {
        initialForm[vt.vehicleTypeId] = {
          baseFare: vt.baseFare || 250,
          perKmRate: vt.perKmRate || 14
        };
      });
      setFormData(initialForm);
    } catch (err) {
      console.error('Error fetching vehicle pricing:', err);
      showToast('Failed to load fleet pricing from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleInputChange = (id: string, field: 'baseFare' | 'perKmRate', value: string) => {
    const num = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: num
      }
    }));
  };

  const handleSave = async (vt: VehicleTypeItem) => {
    const current = formData[vt.vehicleTypeId];
    if (!current) return;

    if (current.baseFare < 50) {
      showToast('Base fare must be at least ₹50', 'error');
      return;
    }
    if (current.perKmRate < 5) {
      showToast('Rate per KM must be at least ₹5/km', 'error');
      return;
    }

    setSavingId(vt.vehicleTypeId);
    try {
      const res = await axiosInstance.put(`/vehicleType/${vt.vehicleTypeId}/pricing`, {
        baseFare: current.baseFare,
        perKmRate: current.perKmRate
      });

      if (res.data?.success) {
        showToast(`Pricing updated for ${vt.vehicleType}!`, 'success');
        await fetchPricing();
      } else {
        showToast(res.data?.message || 'Failed to update pricing', 'error');
      }
    } catch (err: any) {
      console.error('Pricing update error:', err);
      showToast(err.response?.data?.message || 'Failed to save pricing', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const BASE_URL = config.baseurl.apibaseurl || 'http://localhost:5000';

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Fleet Pricing Settings</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase">
                New Bookings Rule
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure base fares and per-kilometer rates for upcoming customer rides.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPricing}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Snapshot Notice */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Permanent Fare Snapshot Guarantee</span>
            <p className="text-blue-700 mt-0.5">
              Modifying vehicle pricing here will only apply to <strong>new future bookings</strong>. Historical bookings already recorded in the database will permanently preserve their original booking amount.
            </p>
          </div>
        </div>

        {/* Vehicle Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-bold">
              <RefreshCw size={28} className="animate-spin text-amber-500 mx-auto mb-2" />
              Loading vehicle fleet pricing from database...
            </div>
          ) : vehicleTypes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              <Car size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-700">No vehicle types found in database</p>
            </div>
          ) : (
            vehicleTypes.map((vt) => {
              const current = formData[vt.vehicleTypeId] || { baseFare: vt.baseFare || 250, perKmRate: vt.perKmRate || 14 };
              const isSaving = savingId === vt.vehicleTypeId;

              let img = '/images/step2.jpeg';
              if (vt.vehicleImg && Array.isArray(vt.vehicleImg) && vt.vehicleImg.length > 0) {
                const raw = vt.vehicleImg[0];
                img = raw.startsWith('http') || raw.startsWith('/images') ? raw : `${BASE_URL}/uploads/vehicleImg/${raw}`;
              } else if (vt.vehicleType.toLowerCase().includes('suv')) {
                img = '/images/step3.jpeg';
              } else if (vt.vehicleType.toLowerCase().includes('hatch')) {
                img = '/images/step1.jpeg';
              }

              return (
                <div
                  key={vt.vehicleTypeId}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Card Top */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={img}
                        alt={vt.vehicleType}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 bg-slate-50 shadow-sm flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/step2.jpeg';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-slate-900 truncate">
                          {vt.vehicleType}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} /> {vt.seatCapacity} Seats
                          </span>
                          <span>•</span>
                          <span>Advance: {vt.priorMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Inputs */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                          Base Fare (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="50"
                            step="10"
                            value={current.baseFare}
                            onChange={(e) => handleInputChange(vt.vehicleTypeId, 'baseFare', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-amber-500 text-sm font-black text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                          Rate per KM (₹/km)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="5"
                            step="1"
                            value={current.perKmRate}
                            onChange={(e) => handleInputChange(vt.vehicleTypeId, 'perKmRate', e.target.value)}
                            className="w-full pl-8 pr-12 py-2 rounded-xl bg-white border border-slate-200 focus:border-amber-500 text-sm font-black text-slate-900 focus:outline-none"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            /km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(vt)}
                    className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Pricing</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PricingSettings;
