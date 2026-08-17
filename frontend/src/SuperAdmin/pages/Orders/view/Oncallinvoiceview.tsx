// src/SuperAdmin/pages/Oncallinvoice/OnCallInvoiceView.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faBuilding,
  faUser,
  faCar,
  faRoute,
  faReceipt,
  faClock,
  faRoad,
   faTrash,
} from "@fortawesome/free-solid-svg-icons";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface OnCallInvoiceItem {
  onCallInvoiceItemId?: string;
  onCallBillId: string;
  tripSheetNo?: string;
  tripSheetNumber?: string;
  date?: string;
  vehicleTypeId?: string;
  vehicleNo?: string;
  vehicleNumber?: string;
  driverName?: string;
  guestName?: string;
  bookedBy?: string;
  tripDetails?: string;
  garageOpenKm?: number;
  garageCloseKm?: number;
  garageKms?: number;
  guestOpenKm?: number;
  guestCloseKm?: number;
  guestKms?: number;
  hideGuestDetails?: boolean;
  startingTime?: string;
  closingTime?: string;
  usageHours?: number;
  packageType?: string;
  travelPackage?: string;
  packageDays?: number;
  driverDays?: number;
  selectedPackageMeta?: any;
  packageAmount?: number;
  additionalKms?: number;
  additionalKmsAmount?: number;
  additionalHours?: number;
  additionalHoursAmount?: number;
  driverBatta?: number;
  extraChargesBreakup?: any;
  extraCharges?: number;
  discountAmount?: number;
  advanceAmount?: number;
  amount?: number;
  total?: number;
  totalDue?: number;
  totalTaxAmount?: number;
  cgstApplicable?: boolean;
  sgstApplicable?: boolean;
  igstApplicable?: boolean;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxes?: any;
}

interface OnCallInvoice {
  onCallBillId: string;
  onCallInvoiceCode?: string;
  companyId?: string;
  companyName?: string;
  tripSheetNumbers?: string;
  bookedBy?: string;
  totalAmount?: number;
  cgst?: number;
  sgst?: number;
  createdAt?: string;
  invoiceItems?: OnCallInvoiceItem[];
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const fmt = (v?: any) => (v !== undefined && v !== null && v !== "" ? String(v) : "-");
const cur = (v?: number) =>
  v !== undefined && v !== null
    ? `₹${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "-";

/* ─── Info Row ──────────────────────────────────────────────────────────────── */
const InfoRow: React.FC<{
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
  red?: boolean;
}> = ({ label, value, bold, green, red }) => (
  <div className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-400 flex-shrink-0 min-w-[110px]">{label}</span>
    <span
      className={`text-xs text-right break-words ${bold ? "font-bold" : "font-medium"} ${
        green ? "text-emerald-600" : red ? "text-red-500" : "text-slate-700"
      }`}
    >
      {value}
    </span>
  </div>
);

/* ─── Section Card ──────────────────────────────────────────────────────────── */
const SectionCard: React.FC<{
  title: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
}> = ({ title, icon, iconColor, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
      <FontAwesomeIcon icon={icon} className={`text-xs ${iconColor}`} />
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        {title}
      </span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const OnCallInvoiceView: React.FC = () => {
  const { onCallBillId } = useParams<{ onCallBillId: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<OnCallInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleting, setDeleting] = useState(false);



  useEffect(() => {
    if (!onCallBillId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/oncallinvoice/getById/${onCallBillId}`);
        setInvoice(res.data?.data || null);
      } catch (e: any) {
        showToast(e?.response?.data?.message || "Failed to load invoice", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [onCallBillId]);


  const handleDeleteInvoice = async () => {
  if (!onCallBillId) {
    showToast("Invoice ID not available!", "error");
    return;
  }
  if (deleting) return;

  try {
    setDeleting(true);
    const res = await axiosInstance.delete(`/oncallinvoice/onCallInvoice/${onCallBillId}`);
    if (res.data?.success) {
      showToast("On Call invoice deleted successfully!", "success");
      setShowDeleteModal(false);
      setTimeout(() => navigate("/orders/paymentpending"), 1000);
    } else {
      showToast(res.data?.message || "Failed to delete invoice", "error");
    }
  } catch (err: any) {
    console.error("Delete OnCall invoice error:", err);
    showToast(err?.response?.data?.message || "Error deleting invoice", "error");
  } finally {
    setDeleting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Invoice not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const items: OnCallInvoiceItem[] = invoice.invoiceItems || [];
  let tripSheetNumbers: string[] = [];
  try {
    tripSheetNumbers = invoice.tripSheetNumbers ? JSON.parse(invoice.tripSheetNumbers) : [];
  } catch {
    tripSheetNumbers = [];
  }

  const grandTotal = items.reduce((s, item) => s + (item.total || 0), 0);
  const grandAdvance = items.reduce((s, item) => s + (item.advanceAmount || 0), 0);
  const grandDue = Math.max(0, grandTotal - grandAdvance);


  
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <AlertContainer />
      <div className="mx-auto w-full max-w-6xl space-y-5">

        {/* ── Header ── */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
  <button
    onClick={() => navigate(-1)}
    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
  >
    <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
  </button>

</div>
                {/* <button
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                </button> */}
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    On Call Invoice
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Bill ID: {invoice.onCallBillId}
                  </p>
                  {invoice.onCallInvoiceCode && (
  <p className="text-xs text-emerald-400 mt-0.5 font-mono font-semibold">
    Invoice Code: {invoice.onCallInvoiceCode}
  </p>
)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                 Total Due
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                     ₹{grandDue.toLocaleString()}

                </div>


                
              </div>
            <button
    onClick={() => setShowDeleteModal(true)}
    title="Delete Invoice"
    className="w-9 h-9 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 flex items-center justify-center transition-all"
  >
    <FontAwesomeIcon icon={faTrash} className="text-sm" />
  </button>
    
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-slate-100">
            <div className="p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Company</p>
              <p className="text-sm font-semibold text-slate-800">{fmt(invoice.companyName)}</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Booked By</p>
              <p className="text-sm font-semibold text-slate-800">{fmt(invoice.bookedBy)}</p>
            </div>
           {invoice.onCallInvoiceCode && (
  <div className="p-4">
    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">OnCallInvoice Code</p>
    <p className="text-sm font-semibold text-slate-800 font-mono">{invoice.onCallInvoiceCode}</p>
  </div>
)}
<div className="p-4">
  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Trip Sheets</p>
  <p className="text-sm font-semibold text-slate-800">{items.length}</p>
</div>
            <div className="p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Created</p>
              <p className="text-sm font-semibold text-slate-800">{formatDate(invoice.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* ── Trip Sheet Numbers ── */}
        {tripSheetNumbers.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Trip Sheet Numbers ({tripSheetNumbers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {tripSheetNumbers.map((ts, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-mono"
                >
                  #{ts}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Trip Sheet Items ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            Trip Sheet Details
          </p>

          {items.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-400">No trip sheet items found</p>
            </div>
          )}

          {items.map((item, idx) => {
            const sheetId = item.onCallInvoiceItemId || String(idx);
            const isExpanded = expandedSheet === sheetId;
            const sheetNo = item.tripSheetNo || item.tripSheetNumber || `Sheet ${idx + 1}`;

            let taxes: any[] = [];

try {
  let parsed = item.taxes;

  while (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }

  taxes = Array.isArray(parsed) ? parsed : [];
} catch (err) {
  console.log("Invalid taxes:", item.taxes);
  taxes = [];
}
      let extras: any[] = [];

try {
  let parsed = item.extraChargesBreakup;

  while (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }

  extras = Array.isArray(parsed) ? parsed : [];
} catch (err) {
  console.log("Invalid extraChargesBreakup:", item.extraChargesBreakup);
  extras = [];
}
            return (
              <div
                key={sheetId}
                className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                {/* Sheet Header — always visible */}
                <button
                  onClick={() => setExpandedSheet(isExpanded ? null : sheetId)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-800">
                          #{sheetNo}
                        </span>
                        {item.packageType && (
                          <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                            {item.packageType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.guestName && (
                          <span className="text-xs text-slate-500">
                            <FontAwesomeIcon icon={faUser} className="mr-1 text-[10px]" />
                            {item.guestName}
                          </span>
                        )}
                        {(item.vehicleNo || item.vehicleNumber) && (
                          <span className="text-xs text-slate-500">
                            <FontAwesomeIcon icon={faCar} className="mr-1 text-[10px]" />
                            {item.vehicleNo || item.vehicleNumber}
                          </span>
                        )}
                        {item.driverName && (
                          <span className="text-xs text-slate-500">
                            {item.driverName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-700">
                      {(item.totalDue ?? 0) > 0 && (
                        <div className="">
                          Due: {cur(item.totalDue)}
                        </div>
                      )}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                      {/* Trip Info */}
                      <SectionCard title="Trip Info" icon={faRoute} iconColor="text-blue-500">
                        <InfoRow label="Driver" value={fmt(item.driverName)} />
                        <InfoRow label="Vehicle No" value={fmt(item.vehicleNo || item.vehicleNumber)} />
                        <InfoRow label="Booked By" value={fmt(item.bookedBy)} />
                        <InfoRow label="Package Type" value={fmt(item.packageType)} />
                        <InfoRow label="Travel Package" value={fmt(item.travelPackage)} />
                        <InfoRow label="Pickup Date" value={item.date ? formatDate(item.date) : "-"} />
                        <InfoRow label="Trip Details" value={fmt(item.tripDetails)} />
                      </SectionCard>

                      {/* KM & Time */}
                      <SectionCard title="KM & Time" icon={faRoad} iconColor="text-violet-500">
                        <InfoRow label="Starting Time" value={item.startingTime ? formatDate(item.startingTime) : "-"} />
                        <InfoRow label="Closing Time" value={item.closingTime ? formatDate(item.closingTime) : "-"} />
                        <InfoRow label="Usage Hours" value={fmt(item.usageHours)} />
                        <InfoRow label="Garage Open KM" value={fmt(item.garageOpenKm)} />
                        <InfoRow label="Garage Close KM" value={fmt(item.garageCloseKm)} />
                        <InfoRow label="Garage KMs" value={fmt(item.garageKms)} />
                        {!item.hideGuestDetails && (
                          <>
                            <InfoRow label="Guest Open KM" value={fmt(item.guestOpenKm)} />
                            <InfoRow label="Guest Close KM" value={fmt(item.guestCloseKm)} />
                            <InfoRow label="Guest KMs" value={fmt(item.guestKms)} />
                          </>
                        )}
                        <InfoRow label="Package Days" value={fmt(item.packageDays)} />
                        <InfoRow label="Driver Days" value={fmt(item.driverDays)} />
                      </SectionCard>

                      {/* Fare Breakdown */}
                      <SectionCard title="Fare Breakdown" icon={faReceipt} iconColor="text-emerald-500">
                        <InfoRow label="Package Amount" value={cur(item.packageAmount)} />
                        <InfoRow
                          label="Extra KMs"
                          value={
                            (item.additionalKms || 0) > 0
                              ? `${item.additionalKms} km → ${cur(item.additionalKmsAmount)}`
                              : "₹0.00"
                          }
                        />
                        <InfoRow
                          label="Extra Hours"
                          value={
                            (item.additionalHours || 0) > 0
                              ? `${item.additionalHours} hrs → ${cur(item.additionalHoursAmount)}`
                              : "₹0.00"
                          }
                        />
                        <InfoRow label="Driver Batta" value={cur(item.driverBatta)} />
                        {extras.filter((e) => e.amount > 0).map((e, i) => (
                          <InfoRow key={i} label={e.title} value={cur(e.amount)} />
                        ))}
                        {taxes.map((t: any, i: number) => (
                          <InfoRow
                            key={i}
                            label={`${t.taxName} (${t.taxPercent}%)`}
                            value={cur(t.taxAmount)}
                          />
                        ))}
                        {(item.discountAmount || 0) > 0 && (
                          <InfoRow label="Discount" value={`-${cur(item.discountAmount)}`} red />
                        )}
                        {(item.advanceAmount || 0) > 0 && (
                          <InfoRow label="Advance" value={`-${cur(item.advanceAmount)}`} />
                        )}
                        <div className="mt-3 pt-3 border-t-2 border-slate-200 space-y-1">
                          <InfoRow label="Total" value={cur(item.total)} bold />
                          {(item.totalDue ?? 0) > 0 && (
                            <InfoRow label="Total Due" value={cur(item.totalDue)} bold green />
                          )}
                        </div>
                      </SectionCard>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Grand Summary ── */}
        {items.length > 0 && (
          <div className="rounded-2xl border-2 border-slate-800 bg-slate-900 text-white p-5">
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">
              Grand Summary — {items.length} Trip Sheet{items.length > 1 ? "s" : ""}
            </div>
            <div className="space-y-1.5">
              {items.map((item, i) => {
                const sheetNo = item.tripSheetNo || item.tripSheetNumber || `Sheet ${i + 1}`;
                return (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">
                      <span className="font-mono text-slate-300">#{sheetNo}</span>
                      {item.guestName && (
                        <span className="ml-2 text-slate-500 text-xs">— {item.guestName}</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {cur(item.total)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-slate-700 pt-3 mt-2 flex justify-between items-center">
                <span className="font-bold text-white">Grand Total</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {cur(grandTotal)}
                </span>
              </div>
              {grandAdvance > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total Advance</span>
                    <span className="text-slate-300">
                      − {cur(grandAdvance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Grand Due</span>
                    <span className="text-xl font-bold text-blue-400">
                      {cur(grandDue)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Back Button ── */}
        <div className="flex justify-start pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back to List
          </button>
        </div>
      </div>

      {showDeleteModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Delete Invoice</h2>
      <p className="text-sm text-slate-500 mb-5">
        Are you sure you want to delete this On Call invoice
        {invoice.onCallInvoiceCode ? ` (${invoice.onCallInvoiceCode})` : ""}? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleDeleteInvoice}
          disabled={deleting}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all ${
            deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {deleting ? "Deleting..." : "Yes, Delete"}
        </button>
        <button
          onClick={() => setShowDeleteModal(false)}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default OnCallInvoiceView;