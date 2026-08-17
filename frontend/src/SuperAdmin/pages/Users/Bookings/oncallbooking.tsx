import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
type SelectOpt = { value: string; label: string; meta?: any };
type Company = { companyId: string; companyName: string };
type VehicleType = { vehicleTypeId: string; vehicleType: string; isDeleted?: boolean };
type Driver = { driverId: string; driverName: string };
type ExtraCharge = { title: string; amount: string };

type TripEntry = {
  id: string;
  tripSheetNumber: string;
  vehicleTypeId: string;
  vehicleNo: string;
  driverName: string;
  guestName: string;
  bookedBy: string;
  pickupDate: string;
  tripDetails: string;
  garageOpenKm: string;
  garageCloseKm: string;
  guestOpenKm: string;
  guestCloseKm: string;
  manualGarageKm?: string;
  hideGuest: boolean;
  startingTime: string;
  closingTime: string;
  packageType: string;
  travelPackage: string;
  selectedPackageMeta: any;
  packageDays: string;
  driverDays: string;
  extraCharges: ExtraCharge[];
  showExtraCharges: boolean;
  discount: string;
  advanceAmount: string;
  vehicleOptions: SelectOpt[];
  packageOptions: SelectOpt[];
  taxList: any[];
  selectedTaxes: string[];
  // for edit mode — store the original invoiceItemId
  invoiceItemId?: string;
  manualHours?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");
const num = (v: any) => { const x = Number(String(v ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(x) ? x : 0; };
const money = (v: any) =>
  Number(v || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
const roundKM = (v: any) => Math.round(num(v));
const uid = () => Math.random().toString(36).slice(2, 9);

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const makeEntry = (): TripEntry => ({
  id: uid(),
  tripSheetNumber: "",
  vehicleTypeId: "",
  vehicleNo: "",
  driverName: "",
  guestName: "",
  bookedBy: "",
  pickupDate: todayISO(),
  tripDetails: "",
  garageOpenKm: "",
  garageCloseKm: "",
  manualGarageKm: "",
  guestOpenKm: "",
  guestCloseKm: "",
  hideGuest: true,
  startingTime: "",
  closingTime: "",
  packageType: "",
  travelPackage: "",
  selectedPackageMeta: null,
  packageDays: "",
  driverDays: "",
  extraCharges: [{ title: "Others", amount: "" }],
  showExtraCharges: false,
  discount: "",
  advanceAmount: "",
  vehicleOptions: [],
  packageOptions: [],
  taxList: [],
  selectedTaxes: [],
  manualHours: "",
});


// ─── 30-min interval Time Picker ─────────────────────────────────────────────
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hh = String(h).padStart(2, "0");
  return { value: `${hh}:${m}`, label: `${hh}:${m}` };
});

const DateTimePicker = ({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) => {
  const datePart = value ? value.split("T")[0] : "";
  const timePart = value ? value.split("T")[1]?.slice(0, 5) : "";

  const snappedTime = (() => {
    if (!timePart) return "";
    const [h, m] = timePart.split(":").map(Number);
    const snapped = m < 30 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${snapped}`;
  })();

  const handleDate = (d: string) => {
    const t = snappedTime || "00:00";
    onChange(d ? `${d}T${t}` : "");
  };

  const handleTime = (t: string) => {
    // ✅ FIX: use today's date if datePart is empty — don't block time selection
    const d = datePart || todayISO();
    onChange(t ? `${d}T${t}` : "");
  };

  return (
    // ✅ FIX: stack vertically so each field gets full width
    <div className="flex flex-col gap-1.5">
      {/* Date — full width */}
      <input
        type="date"
        value={datePart}
        onChange={(e) => handleDate(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm text-slate-800",
          "outline-none focus:ring-2 focus:ring-blue-50 transition-all",
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
            : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
        )}
      />
      {/* Time — full width, 30-min slots */}
      <div className="relative">
        <select
          value={snappedTime}
          onChange={(e) => handleTime(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 appearance-none",
            "outline-none focus:ring-2 focus:ring-blue-50 transition-all",
            disabled
              ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
              : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
          )}
        >
          <option value="">--:--</option>
          {TIME_SLOTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

// ─── Pure calculation ─────────────────────────────────────────────────────────
// function calcSnapshot(entry: TripEntry) {
//   const isOut = entry.packageType === "outstation";
//   const meta = entry.selectedPackageMeta;

//   const garageKmUsed = Math.max(0, num(entry.garageCloseKm) - num(entry.garageOpenKm));
//   const guestKmUsed  = Math.max(0, num(entry.guestCloseKm)  - num(entry.guestOpenKm));
//   const hasGarage    = !!(entry.garageOpenKm && entry.garageCloseKm);
//   const hasGuest     = !entry.hideGuest && !!(entry.guestOpenKm && entry.guestCloseKm);
//   const calcKm       = hasGarage ? garageKmUsed : hasGuest ? guestKmUsed : 0;

//  let hoursUsed = 0;
// if (entry.manualHours !== undefined && entry.manualHours !== "") {
//   hoursUsed = Math.max(0, parseInt(entry.manualHours, 10) || 0);
// } else if (entry.startingTime && entry.closingTime) {
//   const s = new Date(entry.startingTime), c = new Date(entry.closingTime);
//   const mins = (c.getTime() - s.getTime()) / 60000;
//   if (mins > 0) { const h = Math.floor(mins / 60), m = mins % 60; hoursUsed = m >= 30 ? h + 1 : h; }
// }

//   const calcDays            = Math.max(1, parseInt(entry.packageDays, 10) || 1);
//   const effectiveDriverDays = Math.max(1, parseInt(entry.driverDays, 10) || calcDays);

//   const pkgAmount   = num(meta?.amount);
//   const pkgHours    = num(meta?.hours);
//   const pkgKm       = num(meta?.km);
//   const extraKmRate = num(meta?.extraKm);
//   const extraHrRate = num(meta?.extraHour);
//   const perKmRate   = num(meta?.perKm);
//   const battaPerDay = num(meta?.driverBattaPerDay);
//   const minKmPerDay = num(meta?.minimumKmPerDay);
//   const minKmTotal  = minKmPerDay * calcDays;
//   const billableKm  = Math.max(calcKm, minKmTotal);
//   const totalBatta  = battaPerDay * effectiveDriverDays;

//   const addKm  = isOut || !meta ? 0 : Math.max(0, calcKm - pkgKm);
//   let   addHrs = 0;
//   if (!isOut && meta) {
//     const xm = Math.max(0, hoursUsed * 60 - pkgHours * 60);
//     const h = Math.floor(xm / 60), m = xm % 60;
//     addHrs = m >= 30 ? h + 1 : h;
//   }

//   const pkgBase    = !meta ? 0 : isOut ? perKmRate * billableKm : pkgAmount;
//   const addKmAmt   = isOut ? 0 : addKm  * extraKmRate;
//   const addHrAmt   = isOut ? 0 : addHrs * extraHrRate;
//   const battaAmt   = isOut ? totalBatta : 0;
//   const extraTotal = entry.extraCharges.reduce((s, c) => s + num(c.amount), 0);
//   const baseAmount = pkgBase + addKmAmt + addHrAmt + battaAmt;
//   const taxAmount  = entry.taxList
//     .filter((t) => entry.selectedTaxes.includes(t.taxId))
//     .reduce((s, t) => s + (baseAmount * t.taxPercent) / 100, 0);
//   const finalTotal = baseAmount + taxAmount + extraTotal - num(entry.discount);
//   const totalDue   = Math.max(0, Math.round(finalTotal - num(entry.advanceAmount)));

//   return {
//     isOut, hasGarage, hasGuest, calcKm, hoursUsed,
//     garageKmUsed, guestKmUsed, calcDays, effectiveDriverDays,
//     pkgAmount, pkgHours, pkgKm, extraKmRate, extraHrRate,
//     perKmRate, battaPerDay, minKmPerDay, minKmTotal, billableKm, totalBatta,
//     addKm, addHrs, pkgBase, addKmAmt, addHrAmt, battaAmt,
//     extraTotal, baseAmount, taxAmount, finalTotal, totalDue,
//   };
// }

function calcSnapshot(entry: TripEntry) {
  const isOut = entry.packageType === "outstation";
  const meta = entry.selectedPackageMeta;

  // ✅ auto value from open/close (kept for display/reset purpose)
  const garageKmUsedAuto = Math.max(0, num(entry.garageCloseKm) - num(entry.garageOpenKm));
  const guestKmUsed      = Math.max(0, num(entry.guestCloseKm)  - num(entry.guestOpenKm));

  const hasManualGarageKm = entry.manualGarageKm !== undefined && entry.manualGarageKm !== "";

  // ✅ effective garage km = manual value if entered, else auto (open-close diff)
  const garageKmUsed = hasManualGarageKm ? Math.max(0, num(entry.manualGarageKm)) : garageKmUsedAuto;

  // ✅ hasGarage now becomes true even WITHOUT open/close, as long as manual KM entered
  const hasGarage = hasManualGarageKm || !!(entry.garageOpenKm && entry.garageCloseKm);
  const hasGuest  = !entry.hideGuest && !!(entry.guestOpenKm && entry.guestCloseKm);
  const calcKm    = hasGarage ? garageKmUsed : hasGuest ? guestKmUsed : 0;

  let hoursUsed = 0;
  if (entry.manualHours !== undefined && entry.manualHours !== "") {
    hoursUsed = Math.max(0, parseInt(entry.manualHours, 10) || 0);
  } else if (entry.startingTime && entry.closingTime) {
    const s = new Date(entry.startingTime), c = new Date(entry.closingTime);
    const mins = (c.getTime() - s.getTime()) / 60000;
    if (mins > 0) { const h = Math.floor(mins / 60), m = mins % 60; hoursUsed = m >= 30 ? h + 1 : h; }
  }

  const calcDays            = Math.max(1, parseInt(entry.packageDays, 10) || 1);
  const effectiveDriverDays = Math.max(1, parseInt(entry.driverDays, 10) || calcDays);

  const pkgAmount   = num(meta?.amount);
  const pkgHours    = num(meta?.hours);
  const pkgKm       = num(meta?.km);
  const extraKmRate = num(meta?.extraKm);
  const extraHrRate = num(meta?.extraHour);
  const perKmRate   = num(meta?.perKm);
  const battaPerDay = num(meta?.driverBattaPerDay);
  const minKmPerDay = num(meta?.minimumKmPerDay);
  const minKmTotal  = minKmPerDay * calcDays;
  const billableKm  = Math.max(calcKm, minKmTotal);
  const totalBatta  = battaPerDay * effectiveDriverDays;

  const addKm  = isOut || !meta ? 0 : Math.max(0, calcKm - pkgKm);
  let   addHrs = 0;
  if (!isOut && meta) {
    const xm = Math.max(0, hoursUsed * 60 - pkgHours * 60);
    const h = Math.floor(xm / 60), m = xm % 60;
    addHrs = m >= 30 ? h + 1 : h;
  }

  const pkgBase    = !meta ? 0 : isOut ? perKmRate * billableKm : pkgAmount;
  const addKmAmt   = isOut ? 0 : addKm  * extraKmRate;
  const addHrAmt   = isOut ? 0 : addHrs * extraHrRate;
  const battaAmt   = isOut ? totalBatta : 0;
  const extraTotal = entry.extraCharges.reduce((s, c) => s + num(c.amount), 0);
const taxableAmount = pkgBase + addKmAmt + addHrAmt +  battaAmt;          // GST இதுல mattum
const baseAmount     = pkgBase + addKmAmt + addHrAmt +  battaAmt; // Sub Total-க்கு full amount
const taxBreakup = entry.taxList
  .filter((t) => entry.selectedTaxes.includes(t.taxId))
  .map((t) => ({
    ...t,
    amount: parseFloat(((taxableAmount * t.taxPercent) / 100).toFixed(2)),
  }));

const taxAmount = parseFloat(
  taxBreakup.reduce((s, t) => s + t.amount, 0).toFixed(2)
);
const finalTotal = parseFloat(
  (baseAmount + taxAmount + extraTotal - num(entry.discount)).toFixed(2)
);

const totalDue = parseFloat(
  Math.max(0, finalTotal - num(entry.advanceAmount)).toFixed(2)
);
  // const finalTotal = baseAmount +   battaAmt + taxAmount + extraTotal - num(entry.discount);
  // const totalDue   = Math.max(0, Math.round(finalTotal - num(entry.advanceAmount)));

  return {
    isOut, hasGarage, hasGuest, calcKm, hoursUsed,
    garageKmUsed, garageKmUsedAuto, guestKmUsed, calcDays, effectiveDriverDays,
    pkgAmount, pkgHours, pkgKm, extraKmRate, extraHrRate,
    perKmRate, battaPerDay, minKmPerDay, minKmTotal, billableKm, totalBatta,
    addKm, addHrs, pkgBase, addKmAmt, addHrAmt, battaAmt,
    extraTotal, baseAmount,taxableAmount, taxAmount, finalTotal, totalDue,
  };
}

// ─── Tiny UI primitives ───────────────────────────────────────────────────────
const Lbl = ({ t, req }: { t: string; req?: boolean }) => (
  <div className="mb-1 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
    {t}{req && <span className="text-red-400 ml-0.5">*</span>}
  </div>
);

const Sel = ({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: SelectOpt[];
  placeholder?: string; disabled?: boolean;
}) => (
  <div className="relative">
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 appearance-none",
        "outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all",
        disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:border-slate-300"
      )}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
    </svg>
  </div>
);

// ─── Searchable Select (type to filter) ───────────────────────────────────────
// const SearchableSel = ({ value, onChange, options, placeholder, disabled }: {
//   value: string; onChange: (v: string) => void; options: SelectOpt[];
//   placeholder?: string; disabled?: boolean;
// }) => {
//   const [query, setQuery] = useState("");
//   const [open, setOpen] = useState(false);
//   const ref = React.useRef<HTMLDivElement>(null);

//   const selected = options.find((o) => o.value === value);
//   const filtered = query
//     ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
//     : options;

//   // Close on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) {
//         setOpen(false);
//         setQuery("");
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   return (
//     <div ref={ref} className="relative">
//       <input
//         value={open ? query : (selected?.label || "")}
//         disabled={disabled}
//         placeholder={placeholder}
//         onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
//         onFocus={() => { setOpen(true); setQuery(""); }}
//         className={cn(
//           "w-full rounded-lg border px-3 py-2 text-sm text-slate-800",
//           "outline-none focus:ring-2 focus:ring-blue-50 transition-all",
//           disabled
//             ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
//             : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
//         )}
//       />
//       {/* dropdown arrow */}
//       <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
//         <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
//       </svg>
//       {open && !disabled && (
//         <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
//           {filtered.length === 0 ? (
//             <div className="px-3 py-2 text-xs text-slate-400">No vehicles found</div>
//           ) : (
//             filtered.map((o) => (
//               <div
//                 key={o.value}
//                 onMouseDown={() => { onChange(o.value); setOpen(false); setQuery(""); }}
//                 className={cn(
//                   "px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors",
//                   o.value === value ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700"
//                 )}
//               >
//                 {o.label}
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// ─── Searchable Select (type to filter, full keyboard support) ───────────────
const SearchableSel = ({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: SelectOpt[];
  placeholder?: string; disabled?: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlightIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setHighlightIdx(filtered.length > 0 ? 0 : -1);
  }, [query, open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || highlightIdx < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx, open]);

  const commitSelection = (idx: number) => {
    const opt = filtered[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    setQuery("");
    setHighlightIdx(-1);
  };

  

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlightIdx((i) => (i + 1 >= filtered.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlightIdx((i) => (i - 1 < 0 ? filtered.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        if (highlightIdx >= 0) {
          commitSelection(highlightIdx);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setHighlightIdx(-1);
    } else if (e.key === "Tab") {
      // ✅ Tab la irukura item ah auto-select panni next field ku poga vidum
      if (open && highlightIdx >= 0 && filtered[highlightIdx]) {
        commitSelection(highlightIdx);
      } else {
        setOpen(false);
        setQuery("");
      }
      // Tab default behavior continue aagum (next field ku focus poidum)
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        value={open ? query : (selected?.label || "")}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm text-slate-800",
          "outline-none focus:ring-2 focus:ring-blue-50 transition-all",
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
            : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
        )}
      />
      {/* dropdown arrow */}
      <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
      </svg>
      {open && !disabled && (
        <div ref={listRef} className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No results found</div>
          ) : (
            filtered.map((o, idx) => (
              <div
                key={o.value}
                onMouseEnter={() => setHighlightIdx(idx)} // ✅ mouse hover um highlight sync aagum
                onMouseDown={() => commitSelection(idx)}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer transition-colors",
                  idx === highlightIdx
                    ? "bg-blue-100 text-blue-800 font-semibold" // ✅ keyboard highlight color
                    : o.value === value
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Inp = ({ value, onChange, type = "text", placeholder, disabled, readOnly, accent, step }: {
  value: string; onChange?: (v: string) => void; type?: string;
  placeholder?: string; disabled?: boolean; readOnly?: boolean; accent?: string; step?: string;
}) => (
  <input value={value} type={type} disabled={disabled} readOnly={readOnly} placeholder={placeholder}
    step={step}
    onChange={(e) => onChange?.(e.target.value)}
    onWheel={(e) => type === "number" && (e.target as HTMLInputElement).blur()}
    className={cn(
      "w-full rounded-lg border px-3 py-2 text-sm text-slate-800",
      "outline-none focus:ring-2 focus:ring-blue-50 transition-all",
      (disabled || readOnly)
        ? `opacity-70 cursor-not-allowed ${accent || "bg-slate-50 border-slate-200"}`
        : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
    )} />
);

const SRow = ({ label, value, bold, color, border }: { label: string; value: string; bold?: boolean; color?: string; border?: boolean }) => (
  <div className={cn("flex justify-between items-center py-1", border && "border-t border-slate-200 mt-1 pt-2")}>
    <span className={cn("text-xs", bold ? "font-semibold text-slate-700" : "text-slate-500")}>{label}</span>
    <span className={cn("text-xs font-semibold", color || "text-slate-800")}>{value}</span>
  </div>
);

const SectionHeading = ({ label, color }: { label: string; color: string }) => (
  <div className={cn("text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2", color)}>
    <span className="w-5 h-px bg-current opacity-40 inline-block"></span>{label}
  </div>
);

// ─── Entry Box ────────────────────────────────────────────────────────────────

// ── Refs for all keyboard-shortcut-focusable fields per trip sheet ──
// React 18: React.createRef<T>() returns RefObject<T | null>, so the type must match.
export interface EntryBoxRefs {
  tripSheetRef:   React.RefObject<HTMLInputElement | null>;
  guestNameRef:   React.RefObject<HTMLInputElement | null>;
  garageKmRef:    React.RefObject<HTMLInputElement | null>;
  hoursRef:       React.RefObject<HTMLInputElement | null>;
  extraChargeRef: React.RefObject<HTMLInputElement | null>;
  addButtonRef:   React.RefObject<HTMLButtonElement | null>;
  extraChargeTitleRef: React.RefObject<HTMLSelectElement | null>;
}

export const makeEntryRefs = (): EntryBoxRefs => ({
  tripSheetRef:   React.createRef<HTMLInputElement>(),
  guestNameRef:   React.createRef<HTMLInputElement>(),
  garageKmRef:    React.createRef<HTMLInputElement>(),
  hoursRef:       React.createRef<HTMLInputElement>(),
  extraChargeRef: React.createRef<HTMLInputElement>(),
  addButtonRef:   React.createRef<HTMLButtonElement>(),
  extraChargeTitleRef: React.createRef<HTMLSelectElement>(),
});

interface EntryBoxProps {
  entry: TripEntry;
  index: number;
  total: number;
  vehicleTypes: SelectOpt[];
  drivers: SelectOpt[];
  globalLoading: boolean;
  companyId: string;
  isEditMode: boolean; // ✅ FIX: pass as prop instead of using outer-scope variable
  refs: EntryBoxRefs;          // ← keyboard shortcut refs
  onFocusEntry: (index: number) => void; // ← tells parent "I am the active sheet"
  onChange: (id: string, patch: Partial<TripEntry>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onLoadVehicles: (id: string, vehicleTypeId: string) => void;
  onLoadPackages: (id: string, vehicleTypeId: string, packageType: string, companyId: string) => void;
}

const EntryBox = React.memo(function EntryBox({
  entry, index, total, vehicleTypes, drivers, globalLoading, companyId,
  isEditMode, // ✅ FIX: destructure from props
  refs, onFocusEntry,
  onChange, onRemove, onAdd, onLoadVehicles, onLoadPackages,
}: EntryBoxProps) {
  const set = useCallback((patch: Partial<TripEntry>) => onChange(entry.id, patch), [entry.id, onChange]);
  const c = calcSnapshot(entry);

  return (
    // onFocus bubbles up from any child input — this tells the parent "Trip Sheet N is active"
    <div
      className="relative rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden"
      onFocus={() => onFocusEntry(index)}
    >

      {/* ── Box Header ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
            {index + 1}
          </div>
          <span className="text-sm font-semibold text-white tracking-wide">Trip Sheet</span>
          {entry.tripSheetNumber && (
            <span className="text-xs bg-white/10 border border-white/20 px-2 py-0.5 rounded-full font-mono text-slate-300">
              #{entry.tripSheetNumber}
            </span>
          )}
          {entry.guestName && (
            <span className="text-xs text-slate-400">— {entry.guestName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {c.finalTotal > 0 && (
            <span className="text-sm font-bold text-emerald-400">₹{money(c.totalDue)}</span>
          )}
        {total > 1 && (
  <button
    onClick={() => {
      if (isEditMode) {
        if (!window.confirm(`Remove trip sheet #${entry.tripSheetNumber}? This cannot be undone.`)) return;
      }
      onRemove(entry.id);
    }}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-xs font-semibold transition-all"
    title="Delete this trip sheet"
  >
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
    Delete
  </button>
)}
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* ── SECTION 1: Trip & Vehicle ── */}
        <div>
          <SectionHeading label="Trip & Vehicle Info" color="text-blue-500" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* <div>
              <Lbl t="Trip Sheet No" req />
              <Inp
                value={entry.tripSheetNumber}
                readOnly={isEditMode}
                onChange={(v) => set({ tripSheetNumber: v })}
                placeholder="e.g. TS-001"
                accent={isEditMode ? "bg-slate-100 border-slate-300" : undefined}
              />
              {isEditMode && (
                <p className="text-[10px] text-slate-400 mt-0.5">Trip Sheet No cannot be changed</p>
              )}
            </div> */}

            <div>
  <Lbl t="Trip Sheet No" req />
  <input
    ref={refs.tripSheetRef}
    value={entry.tripSheetNumber}
    onChange={(e) => set({ tripSheetNumber: e.target.value })}
    placeholder="e.g. TS-001"
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all hover:border-slate-300 focus:border-blue-400"
  />
</div>

            <div>
              <Lbl t="Pickup Date" req />
              <Inp value={entry.pickupDate} onChange={(v) => set({ pickupDate: v })} type="date" />
            </div>
            <div>
              <Lbl t="Vehicle Type" req />
              <Sel value={entry.vehicleTypeId}
                onChange={(v) => {
                  set({ vehicleTypeId: v, vehicleNo: "", travelPackage: "", selectedPackageMeta: null, packageOptions: [] });
                  onLoadVehicles(entry.id, v);
                  if (entry.packageType && companyId) onLoadPackages(entry.id, v, entry.packageType, companyId);
                }}
                options={vehicleTypes} placeholder="Select Type" disabled={globalLoading} />
            </div>
            <div>
              <Lbl t="Vehicle No" />
             <SearchableSel value={entry.vehicleNo} onChange={(v) => set({ vehicleNo: v })}
  options={entry.vehicleOptions}
  placeholder={entry.vehicleTypeId ? "Search vehicle..." : "Type First"}
  disabled={!entry.vehicleTypeId || globalLoading} />
            </div>
            <div>
  <Lbl t="Driver Name" />
  <SearchableSel value={entry.driverName} onChange={(v) => set({ driverName: v })}
    options={drivers} placeholder="Search driver..." disabled={globalLoading} />
</div>
            <div>
              <Lbl t="Guest Name" />
              <input
                ref={refs.guestNameRef}
                value={entry.guestName}
                onChange={(e) => set({ guestName: e.target.value })}
                placeholder="Guest name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all hover:border-slate-300 focus:border-blue-400"
              />
            </div>
            <div>
              <Lbl t="Booked By" />
              <Inp value={entry.bookedBy} onChange={(v) => set({ bookedBy: v })} placeholder="Booked by" />
            </div>
            <div className="col-span-2">
              <Lbl t="Trip Details" />
              <Inp value={entry.tripDetails} onChange={(v) => set({ tripDetails: v })} placeholder="Route / trip details" />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200" />

        {/* ── SECTION 2: KM & Time ── */}
        <div>
          <SectionHeading label="KM & Time" color="text-violet-500" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Lbl t="Garage Open KM" />
              <Inp value={entry.garageOpenKm} onChange={(v) => set({ garageOpenKm: v })} type="number" placeholder="0" />
            </div>
            <div>
              <Lbl t="Garage Close KM" />
              <Inp value={entry.garageCloseKm} onChange={(v) => set({ garageCloseKm: v })} type="number" placeholder="0" />
            </div>
          <div>
  <Lbl t="Garage KM Used" />
  <div className="relative">
    <input
      ref={refs.garageKmRef}
      value={entry.manualGarageKm !== undefined && entry.manualGarageKm !== ""
        ? entry.manualGarageKm
        : (entry.garageOpenKm && entry.garageCloseKm ? String(c.garageKmUsedAuto) : "")}
      onChange={(e) => set({ manualGarageKm: e.target.value })}
      type="number"
      placeholder="0"
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      className="w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all bg-violet-50 border-violet-200 hover:border-violet-300 focus:border-blue-400"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">km</span>
  </div>
  {entry.manualGarageKm !== undefined && entry.manualGarageKm !== "" && (entry.garageOpenKm && entry.garageCloseKm) && (
    <p className="text-[10px] text-violet-500 mt-0.5">
      Auto: {c.garageKmUsedAuto} km — overridden
      <button className="ml-1 underline" onClick={() => set({ manualGarageKm: "" })}>reset</button>
    </p>
  )}
</div>
  
<div>
  <Lbl t="Starting Time" />
  <DateTimePicker value={entry.startingTime} onChange={(v) => set({ startingTime: v })} disabled={globalLoading} />
</div>
<div>
  <Lbl t="Closing Time" />
  <DateTimePicker value={entry.closingTime} onChange={(v) => set({ closingTime: v })} disabled={globalLoading} />
</div>
           <div>
  <Lbl t="Hours Used" />
  <div className="relative">
    <input
      ref={refs.hoursRef}
      value={entry.manualHours !== undefined && entry.manualHours !== ""
        ? entry.manualHours
        : (entry.startingTime && entry.closingTime ? String(c.hoursUsed) : "")}
      onChange={(e) => set({ manualHours: e.target.value })}
      type="number"
      placeholder="0"
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      className="w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all bg-violet-50 border-violet-200 hover:border-violet-300 focus:border-blue-400"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">hrs</span>
  </div>
  {entry.manualHours !== undefined && entry.manualHours !== "" && (entry.startingTime && entry.closingTime) && (
    <p className="text-[10px] text-violet-500 mt-0.5">
      Auto: {c.hoursUsed}h — overridden
      <button className="ml-1 underline" onClick={() => set({ manualHours: "" })}>reset</button>
    </p>
  )}
</div>
          </div>

          {/* Guest KM */}
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 w-fit select-none">
              <input type="checkbox" checked={entry.hideGuest} onChange={(e) => set({ hideGuest: e.target.checked })} className="rounded accent-slate-600" />
              Hide Guest KM Details
            </label>
            {!entry.hideGuest && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <Lbl t="Guest Open KM" />
                  <Inp value={entry.guestOpenKm} onChange={(v) => set({ guestOpenKm: v })} type="number" placeholder="0" />
                </div>
                <div>
                  <Lbl t="Guest Close KM" />
                  <Inp value={entry.guestCloseKm} onChange={(v) => set({ guestCloseKm: v })} type="number" placeholder="0" />
                </div>
                <div>
                  <Lbl t="Guest KM Used" />
                  <Inp value={entry.guestOpenKm && entry.guestCloseKm ? `${c.guestKmUsed} km` : ""} readOnly placeholder="—" accent="bg-violet-50 border-violet-200" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200" />

        {/* ── SECTION 3: Package ── */}
        <div>
          <SectionHeading label="Package" color="text-orange-500" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <Lbl t="Package Type" req />
              <Sel value={entry.packageType}
                onChange={(v) => {
                  set({ packageType: v, travelPackage: "", selectedPackageMeta: null, packageOptions: [], packageDays: "", driverDays: "" });
                  if (entry.vehicleTypeId && companyId) onLoadPackages(entry.id, entry.vehicleTypeId, v, companyId);
                }}
                options={[{ value: "localcity", label: "Local City" }, { value: "outstation", label: "Outstation" }]}
                placeholder="Select Type" disabled={globalLoading} />
            </div>
            <div className="col-span-2">
              <Lbl t="Travel Package" req />
              <Sel value={entry.travelPackage}
                onChange={(v) => {
                  const sel = entry.packageOptions.find((x) => x.value === v);
                  set({ travelPackage: v, selectedPackageMeta: sel?.meta || null });
                }}
                options={entry.packageOptions}
                placeholder={!entry.vehicleTypeId ? "Select Vehicle Type First" : !entry.packageType ? "Select Package Type First" : "Select Package"}
                disabled={!entry.vehicleTypeId || !entry.packageType || globalLoading} />
            </div>

            {c.isOut && entry.selectedPackageMeta && (
              <>
                <div>
                  <Lbl t="Package Days" req />
                  <Inp value={entry.packageDays} onChange={(v) => set({ packageDays: v })} type="number" placeholder="1" />
                  {c.minKmPerDay > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Min KM = {c.minKmPerDay}×{c.calcDays} = <b>{c.minKmTotal}</b> | Billable: <b className="text-blue-600">{c.billableKm}</b></p>
                  )}
                </div>
                <div>
                  <Lbl t="Driver Days" />
                  <Inp value={entry.driverDays} onChange={(v) => set({ driverDays: v })} type="number" placeholder={String(c.calcDays)} />
                  <p className="text-[10px] text-slate-400 mt-0.5">Batta ₹{c.battaPerDay}×{c.effectiveDriverDays} = <b>₹{c.totalBatta}</b></p>
                </div>
              </>
            )}
          </div>

          {entry.selectedPackageMeta && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!c.isOut && (
                <>
                  <MetaBadge label="Hours" val={`${c.pkgHours}h`} color="orange" />
                  <MetaBadge label="KM" val={`${c.pkgKm} km`} color="orange" />
                  <MetaBadge label="Pkg Amt" val={`₹${c.pkgAmount}`} color="green" />
                  <MetaBadge label="Extra/KM" val={`₹${c.extraKmRate}`} color="slate" />
                  <MetaBadge label="Extra/Hr" val={`₹${c.extraHrRate}`} color="slate" />
                </>
              )}
              {c.isOut && (
                <>
                  <MetaBadge label="Per KM" val={`₹${c.perKmRate}`} color="green" />
                  <MetaBadge label="Batta/Day" val={`₹${c.battaPerDay}`} color="orange" />
                  <MetaBadge label="Min KM/Day" val={`${c.minKmPerDay}`} color="slate" />
                </>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-slate-200" />

        {/* ── SECTION 4: Charges + Calculation ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT — inputs */}
          <div className="space-y-4">
            <SectionHeading label="Charges & Deductions" color="text-slate-500" />

            <div>
              <Lbl t="Package Amount (Auto-calculated)" />
              <div className={cn(
                "rounded-lg border-2 border-dashed px-4 py-2.5 flex items-center justify-between",
                c.pkgBase > 0 ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
              )}>
                <span className="text-xs text-slate-400">
                  {!entry.selectedPackageMeta ? "Select a package" :
                    c.isOut ? `₹${c.perKmRate} × ${c.billableKm} km` : "Fixed package rate"}
                </span>
                <span className={cn("text-xl font-bold", c.pkgBase > 0 ? "text-emerald-700" : "text-slate-400")}>
                  ₹{money(c.pkgBase)}
                </span>
              </div>
            </div>

            {entry.taxList.length > 0 && (
              <div>
                <Lbl t="Tax" />
                <div className="flex flex-wrap gap-3">
                  {entry.taxList.map((t: any) => (
                    <label key={t.taxId} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input type="checkbox" checked={entry.selectedTaxes.includes(t.taxId)}
                        onChange={() => set({
                          selectedTaxes: entry.selectedTaxes.includes(t.taxId)
                            ? entry.selectedTaxes.filter((x) => x !== t.taxId)
                            : [...entry.selectedTaxes, t.taxId]
                        })}
                        className="rounded accent-blue-600" />
                      {t.taxName} ({t.taxPercent}%)
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 mb-2 select-none">
                <input type="checkbox" checked={entry.showExtraCharges}
                  onChange={(e) => set({ showExtraCharges: e.target.checked })} className="rounded accent-slate-600" />
                Add Extra Charges (Toll / Parking / Others)
              </label>
              {entry.showExtraCharges && (
                <div className="space-y-2">
                  {entry.extraCharges.map((ec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select value={ec.title}
                        ref={idx === 0 ? refs.extraChargeTitleRef : undefined}
                        onChange={(e) => { const u = [...entry.extraCharges]; u[idx].title = e.target.value; set({ extraCharges: u }); }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400">
                        <option>Others</option><option>Parking</option>
                        <option>Tollgate</option><option>Permit</option><option>State Tax</option>
                      </select>
                      <div className="w-28">
                        {/* ← only the FIRST row gets the ref for Alt+E */}
                        <input
                          ref={idx === 0 ? refs.extraChargeRef : undefined}
                          value={ec.amount}
                          onChange={(e) => { const u = [...entry.extraCharges]; u[idx].amount = e.target.value; set({ extraCharges: u }); }}
                          type="number"
                          placeholder="₹0"
                          onWheel={(ev) => (ev.target as HTMLInputElement).blur()}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all hover:border-slate-300 focus:border-blue-400"
                        />
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {idx === entry.extraCharges.length - 1 && (
                          <button
                            type="button"
                            onClick={() => set({ extraCharges: [...entry.extraCharges, { title: "Others", amount: "" }] })}
                            className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center transition-colors">+</button>
                        )}
                        {entry.extraCharges.length > 1 && (
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => set({ extraCharges: entry.extraCharges.filter((_, i) => i !== idx) })}
                            className="w-7 h-7 rounded-md bg-red-100 hover:bg-red-200 text-red-500 text-sm font-bold flex items-center justify-center transition-colors">−</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl t="Discount (₹)" />
                <Inp value={entry.discount} onChange={(v) => set({ discount: v })} type="number" placeholder="0" />
              </div>
              <div>
                <Lbl t="Advance (₹)" />
                <Inp value={entry.advanceAmount} onChange={(v) => set({ advanceAmount: v })} type="number" placeholder="0" />
              </div>
            </div>
          </div>

          {/* RIGHT — fare breakdown */}
          <div>
            <SectionHeading label="Fare Breakdown" color="text-emerald-500" />
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-0.5">
              {entry.selectedPackageMeta ? (
                <>
                  {(c.hasGarage || c.hasGuest) && (
                    <div className="mb-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-[11px] text-yellow-800">Source: <b>{c.hasGarage ? "Garage" : "Guest"}</b></span>
                      <span className="text-[11px] text-yellow-800">KM: <b>{c.calcKm}</b></span>
                      <span className="text-[11px] text-yellow-800">Hours: <b>{c.hoursUsed}</b></span>
                      {c.isOut && <span className="text-[11px] text-blue-700">Billable KM: <b>{c.billableKm}</b></span>}
                      {!c.isOut && <span className="text-[11px] text-yellow-800">+KM: <b>{c.addKm}</b> | +Hrs: <b>{c.addHrs}</b></span>}
                    </div>
                  )}

                  <SRow label={c.isOut ? `Package (₹${c.perKmRate}×${c.billableKm}km)` : "Package Amount"} value={`₹${money(c.pkgBase)}`} />
                  {!c.isOut && (
                    <>
                      <SRow label={`Extra KM (${c.addKm}×₹${c.extraKmRate})`} value={`₹${money(c.addKmAmt)}`} />
                      <SRow label={`Extra Hours (${c.addHrs}×₹${c.extraHrRate})`} value={`₹${money(c.addHrAmt)}`} />
                    </>
                  )}
               
                  {c.isOut && c.effectiveDriverDays > 0 && (
                    <SRow label={`Driver Batta (${c.effectiveDriverDays}d×₹${c.battaPerDay})`} value={`₹${money(c.battaAmt)}`} />
                  )}

                  <SRow label="Sub Total" value={`₹${money(c.baseAmount)}`} bold border />

                  {entry.taxList
                    .filter((t) => entry.selectedTaxes.includes(t.taxId))
                    .map((t: any) => (
                      <SRow
                        key={t.taxId}
                        label={`${t.taxName} (${t.taxPercent}%)`}
                        value={`+₹${money((c.taxableAmount * t.taxPercent) / 100)}`}
                        color="text-orange-600"
                      />
                  ))}

                  {entry.showExtraCharges && entry.extraCharges.filter((ec) => num(ec.amount) > 0).map((ec, i) => (
                    <SRow key={i} label={ec.title} value={`₹${money(ec.amount)}`} />
                  ))}

                  {num(entry.discount) > 0 && (
                    <SRow label="Discount" value={`-₹${money(entry.discount)}`} color="text-red-500" />
                  )}

                  <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Box Total</span>
                    <span className="text-lg font-bold text-blue-700">₹{money(c.finalTotal)}</span>
                  </div>

                  {num(entry.advanceAmount) > 0 && (
                    <>
                      <SRow label="Advance" value={`-₹${money(entry.advanceAmount)}`} color="text-slate-400" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Total Due</span>
                        <span className="text-sm font-bold text-emerald-600">₹{money(c.totalDue)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">Select a package to see fare breakdown</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Trip Sheet button (last box only, not in edit mode) ── */}
      {/* ✅ FIX: hide "Add Trip Sheet" in edit mode — only 1 invoice at a time */}
      {index === total - 1 && !isEditMode && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">Add another trip sheet to this invoice</span>
          <button
            ref={refs.addButtonRef}
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-semibold transition-all shadow-sm">
            <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">+</span>
            Add Trip Sheet
          </button>
        </div>
      )}
    </div>
  );
});

// ─── Meta Badge ───────────────────────────────────────────────────────────────
function MetaBadge({ label, val, color }: { label: string; val: string; color: string }) {
  const map: Record<string, string> = {
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    green:  "bg-emerald-50 border-emerald-200 text-emerald-700",
    slate:  "bg-slate-100 border-slate-200 text-slate-500",
  };
  return (
    <div className={cn("flex items-center gap-1 border rounded-lg px-2 py-1 text-[11px]", map[color] || map.slate)}>
      <span className="opacity-60">{label}:</span>
      <span className="font-semibold">{val}</span>
    </div>
  );
}

// ─── Grand Summary ────────────────────────────────────────────────────────────
function GrandSummary({ entries }: { entries: TripEntry[] }) {
  const rows = entries.map((e) => ({ entry: e, c: calcSnapshot(e) }));
  const grandTotal = rows.reduce(
    (s, x) => s + x.c.finalTotal,
    0
  );
  const grandAdvance = entries.reduce((s, e) => s + num(e.advanceAmount), 0);
  const grandDue     = Math.max(0, grandTotal - grandAdvance);

  return (
    <div className="rounded-2xl border-2 border-slate-800 bg-slate-900 text-white p-5">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">
        Grand Total — {entries.length} Trip Sheets
      </div>
      <div className="space-y-1.5">
        {rows.map(({ entry, c }, i) => (
          <div key={entry.id} className="flex justify-between items-center">
            <span className="text-sm text-slate-400">
              {entry.tripSheetNumber ? <span className="font-mono text-slate-300">#{entry.tripSheetNumber}</span> : `Sheet ${i + 1}`}
              {entry.guestName && <span className="ml-2 text-slate-500 text-xs">— {entry.guestName}</span>}
            </span>
            <span className="text-sm font-semibold text-slate-100">  ₹{money(c.finalTotal)}
            </span>
          </div>
        ))}
        <div className="border-t border-slate-700 pt-3 mt-2 flex justify-between items-center">
          <span className="font-bold text-white">Grand Total</span>
          <span className="text-2xl font-bold text-emerald-400">  ₹{Math.round(grandTotal)}
          </span>
        </div>
        {grandAdvance > 0 && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total Advance</span>
              <span className="text-slate-300">− ₹{money(grandAdvance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Grand Due</span>
              <span className="text-xl font-bold text-blue-400">₹{Math.round(grandDue)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Oncallinvoice() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { onCallBillId } = useParams();

  // ✅ FIX: isInvoiceEditMode defined here at top scope, used correctly
  const isInvoiceEditMode = !!onCallBillId;

  /* ── Detect addMore mode from router state ── */
  const routeState = location.state as {
    mode?: string;
    onCallBillId?: string;
    companyId?: string;
    companyName?: string;
  } | null;

  const isAddMoreMode     = routeState?.mode === "addMore";
  const editBillId        = routeState?.onCallBillId || "";
  const presetCompanyId   = routeState?.companyId || "";
  const presetCompanyName = routeState?.companyName || "";

  const [globalLoading, setGlobalLoading] = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [addMoreLoading, setAddMoreLoading] = useState(false);

  // Change Invoice Number modal state
  const [showChangeInvoiceModal, setShowChangeInvoiceModal] = useState(false);
  const [changeInvoiceLoading, setChangeInvoiceLoading] = useState(false);
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>("");

  const [companies,    setCompanies]    = useState<SelectOpt[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<SelectOpt[]>([]);
  const [drivers,      setDrivers]      = useState<SelectOpt[]>([]);
  const [companyId,    setCompanyId]    = useState(presetCompanyId);
  const [entries,      setEntries]      = useState<TripEntry[]>([makeEntry()]);

  /* existing trip sheet numbers for addMore mode (display only) */
  const [existingSheets, setExistingSheets] = useState<string[]>([]);

  // ── Keyboard shortcut refs ──────────────────────────────────────────────────
  // One EntryBoxRefs object per trip sheet — kept in sync with `entries` length.
  const entryRefsArray = useRef<EntryBoxRefs[]>([makeEntryRefs()]);

  // Tracks which trip sheet index was last focused. Stored as ref (not state)
  // so updating it never causes a re-render.
  const activeEntryIndex = useRef<number>(0);

  // Save button ref for Alt+S
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Keep entryRefsArray length equal to entries.length whenever entries change.
  // When an entry is added → push a new ref set.
  // When an entry is removed → trim to match.
  // useEffect(() => {
  //   const current = entryRefsArray.current;
  //   if (current.length < entries.length) {
  //     // Entries were added
  //     while (current.length < entries.length) {
  //       current.push(makeEntryRefs());
  //     }
  //   } else if (current.length > entries.length) {
  //     // Entries were removed
  //     current.splice(entries.length);
  //   }
  //   // Clamp activeEntryIndex if it's now out of range
  //   if (activeEntryIndex.current >= entries.length) {
  //     activeEntryIndex.current = Math.max(0, entries.length - 1);
  //   }
  // }, [entries.length]);

if (entryRefsArray.current.length < entries.length) {
  while (entryRefsArray.current.length < entries.length) {
    entryRefsArray.current.push(makeEntryRefs());
  }
} else if (entryRefsArray.current.length > entries.length) {
  entryRefsArray.current.splice(entries.length);
}
if (activeEntryIndex.current >= entries.length) {
  activeEntryIndex.current = Math.max(0, entries.length - 1);
}
  // ── Initial load ──
  useEffect(() => {
    (async () => {
      try {
        setGlobalLoading(true);
        const [cRes, vRes, dRes] = await Promise.all([
          axiosInstance.get("/company/getAllCompany", { params: { status: 0 } }),
          axiosInstance.get("/vehicleType/getAllVehicleType", { params: { status: 0 } }),
          axiosInstance.get("/driver/getAllDrivers"),
        ]);
        setCompanies((cRes.data?.data || []).map((c: Company) => ({ value: c.companyId, label: c.companyName })));
        setVehicleTypes((vRes.data?.data || []).filter((x: VehicleType) => !x.isDeleted).map((v: VehicleType) => ({ value: v.vehicleTypeId, label: v.vehicleType })));
        setDrivers((dRes.data?.drivers || []).map((d: Driver) => ({ value: d.driverName, label: d.driverName })));
      } catch (e: any) {
        showToast(e?.response?.data?.message || "Failed to load data", "error");
      } finally { setGlobalLoading(false); }
    })();
  }, []);

  /* ── If addMore mode, fetch existing invoice to show context ── */
  useEffect(() => {
    if (!isAddMoreMode || !editBillId) return;
    (async () => {
      try {
        setAddMoreLoading(true);
        const res = await axiosInstance.get(`/oncallinvoice/getById/${editBillId}`);
        const data = res.data?.data;
        if (data) {
          let sheets: string[] = [];
          try { sheets = data.tripSheetNumbers ? JSON.parse(data.tripSheetNumbers) : []; } catch { sheets = []; }
          setExistingSheets(sheets);
        }
      } catch {
        showToast("Failed to load existing invoice details", "error");
      } finally {
        setAddMoreLoading(false);
      }
    })();
  }, [isAddMoreMode, editBillId]);

  // Fetch current invoice number when in edit mode
  useEffect(() => {
    if (!isInvoiceEditMode || !onCallBillId) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/oncallinvoice/getById/${onCallBillId}`);
        const data = res.data?.data;
        if (data?.onCallInvoiceCode) {
          setCurrentInvoiceNumber(data.onCallInvoiceCode);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvoiceEditMode, onCallBillId]);

  const handleChangeOnCallInvoiceNumber = async () => {
    if (!onCallBillId) return;
    try {
      setChangeInvoiceLoading(true);
      const res = await axiosInstance.post("/oncallinvoice/change-invoice-number", {
        onCallBillId,
      });
      setCurrentInvoiceNumber(res.data?.newInvoiceNumber || "");
      showToast("Invoice Number Updated Successfully", "success");
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to change invoice number", "error");
    } finally {
      setChangeInvoiceLoading(false);
      setShowChangeInvoiceModal(false);
    }
  };

  // ── ✅ FIX: Edit mode — load invoice and populate entries ──
// ── Edit mode — load invoice and populate entries ──
  useEffect(() => {
    if (!isInvoiceEditMode) return;

    const loadInvoice = async () => {
      try {
        setGlobalLoading(true);
        const res = await axiosInstance.get(`/oncallinvoice/getById/${onCallBillId}`);
        const invoice = res.data?.data;
        if (!invoice) return;

        setCompanyId(invoice.companyId);

        const items: any[] = invoice.invoiceItems || [];
        if (items.length === 0) return;

        // Format datetime-local value (YYYY-MM-DDTHH:mm)
        const fmtDatetimeLocal = (val: string | null | undefined) => {
          if (!val) return "";
          try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return "";
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } catch { return ""; }
        };

        // Format date only (YYYY-MM-DD)
        const fmtDate = (val: string | null | undefined) => {
          if (!val) return todayISO();
          try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return todayISO();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          } catch { return todayISO(); }
        };

        // Parse JSON string safely
        const parseJSON = (val: any) => {
          if (!val) return null;
          if (typeof val === "object") return val; // already parsed
          try { return JSON.parse(val); } catch { return null; }
        };

        const builtEntries: TripEntry[] = items.map((item: any) => {
  const parsedMeta = parseJSON(item.selectedPackageMeta);

  let extraCharges: ExtraCharge[] = [{ title: "Others", amount: "" }];
  const parsedBreakup = parseJSON(item.extraChargesBreakup);
  if (Array.isArray(parsedBreakup) && parsedBreakup.length > 0) {
    extraCharges = parsedBreakup.map((ec: any) => ({
      title: ec.title || "Others",
      amount: String(ec.amount || ""),
    }));
  }

  const parsedTaxes: any[] = parseJSON(item.taxes) || [];
  const applicableTaxNames: string[] = parsedTaxes.map((t: any) =>
    (t.taxName || "").toLowerCase()
  );

  // ✅ NEW: detect if garage km was manually entered (no proper open/close pair)
  const openKmNum   = Number(item.garageOpenKm || 0);
  const closeKmNum  = Number(item.garageCloseKm || 0);
  const savedGarageKm = Number(item.garageKms || 0);
  const usedOpenClose = openKmNum > 0 && closeKmNum > 0 && closeKmNum >= openKmNum;

  const startTimeVal = item.startingTime || "";
const closeTimeVal = item.closingTime || "";
const usedStartClose = !!(startTimeVal && closeTimeVal);
const savedHours = Number(item.usageHours || 0);
  return {
    id: uid(),
    invoiceItemId: item.onCallInvoiceItemId || "",
    tripSheetNumber: item.tripSheetNo || "",
    vehicleTypeId:   item.vehicleTypeId || "",
    vehicleNo:       item.vehicleNo || "",
    driverName:      item.driverName || "",
    guestName:       item.guestName || "",
    bookedBy:        item.bookedBy || "",
    pickupDate:      fmtDate(item.date),
    tripDetails:     item.tripDetails || "",
    garageOpenKm:    item.garageOpenKm != null ? String(item.garageOpenKm) : "",
    garageCloseKm:   item.garageCloseKm != null ? String(item.garageCloseKm) : "",
    // ✅ NEW: if open/close wasn't the source, load saved garageKms as manual override
    manualGarageKm:  !usedOpenClose && savedGarageKm > 0 ? String(savedGarageKm) : "",
    manualHours: !usedStartClose && savedHours > 0 ? String(savedHours) : "",

    guestOpenKm:     item.guestOpenKm != null ? String(item.guestOpenKm) : "",
    guestCloseKm:    item.guestCloseKm != null ? String(item.guestCloseKm) : "",
    hideGuest:       item.hideGuestDetails ?? true,
    startingTime:    item.startingTime ? fmtDatetimeLocal(item.startingTime) : "",
    closingTime:     item.closingTime  ? fmtDatetimeLocal(item.closingTime)  : "",
    packageType:     item.packageType  || "",
    travelPackage:   item.travelPackage || "",
    selectedPackageMeta: parsedMeta,
    packageDays:     item.packageDays  != null ? String(item.packageDays)  : "",
    driverDays:      item.driverDays   != null ? String(item.driverDays)   : "",
    extraCharges,
    showExtraCharges: extraCharges.some((ec) => Number(ec.amount) > 0),
    discount:        item.discountAmount != null ? String(item.discountAmount) : "",
    advanceAmount:   item.advanceAmount  != null ? String(item.advanceAmount)  : "",
    vehicleOptions:  [],
    packageOptions:  [],
    taxList:         [],
    selectedTaxes:   [],
    _applicableTaxNames: applicableTaxNames,
  } as TripEntry & { _applicableTaxNames?: string[] };
});

        // const builtEntries: TripEntry[] = items.map((item: any) => {
        //   // ✅ CORRECT: Backend field is tripSheetNo (not tripSheetNumber)
        //   // ✅ CORRECT: Backend field is date (not pickupDate)
        //   // ✅ CORRECT: selectedPackageMeta is TEXT → parse JSON string
        //   // ✅ CORRECT: taxes is JSON array → [{taxName, taxPercent, taxAmount}]
        //   //             no cgstApplicable/sgstApplicable fields in DB

        //   // Parse selectedPackageMeta from JSON string
        //   const parsedMeta = parseJSON(item.selectedPackageMeta);

        //   // Rebuild extraCharges from extraChargesBreakup JSON string
        //   let extraCharges: ExtraCharge[] = [{ title: "Others", amount: "" }];
        //   const parsedBreakup = parseJSON(item.extraChargesBreakup);
        //   if (Array.isArray(parsedBreakup) && parsedBreakup.length > 0) {
        //     extraCharges = parsedBreakup.map((ec: any) => ({
        //       title: ec.title || "Others",
        //       amount: String(ec.amount || ""),
        //     }));
        //   }

        //   // Parse taxes JSON to get applied tax names
        //   // taxes field: [{taxName: "CGST", taxPercent: 2.5, taxAmount: 511.25}, ...]
        //   const parsedTaxes: any[] = parseJSON(item.taxes) || [];
        //   // Store tax names (lowercase) to match with taxList after packages load
        //   const applicableTaxNames: string[] = parsedTaxes.map((t: any) =>
        //     (t.taxName || "").toLowerCase()
        //   );

        //   return {
        //     id: uid(),
        //     invoiceItemId: item.onCallInvoiceItemId || "",
        //     // ✅ Backend: tripSheetNo
        //     tripSheetNumber: item.tripSheetNo || "",
        //     vehicleTypeId:   item.vehicleTypeId || "",
        //     vehicleNo:       item.vehicleNo || "",
        //     driverName:      item.driverName || "",
        //     guestName:       item.guestName || "",
        //     bookedBy:        item.bookedBy || "",
        //     // ✅ Backend: date (not pickupDate)
        //     pickupDate:      fmtDate(item.date),
        //     tripDetails:     item.tripDetails || "",
        //     garageOpenKm:    item.garageOpenKm != null ? String(item.garageOpenKm) : "",
        //     garageCloseKm:   item.garageCloseKm != null ? String(item.garageCloseKm) : "",
        //     guestOpenKm:     item.guestOpenKm != null ? String(item.guestOpenKm) : "",
        //     guestCloseKm:    item.guestCloseKm != null ? String(item.guestCloseKm) : "",
        //     hideGuest:       item.hideGuestDetails ?? true,
        //     // ✅ startingTime / closingTime are STRING in DB (not DATE)
        //     startingTime:    item.startingTime ? fmtDatetimeLocal(item.startingTime) : "",
        //     closingTime:     item.closingTime  ? fmtDatetimeLocal(item.closingTime)  : "",
        //     packageType:     item.packageType  || "",
        //     travelPackage:   item.travelPackage || "",
        //     // ✅ Parse JSON string → object
        //     selectedPackageMeta: parsedMeta,
        //     packageDays:     item.packageDays  != null ? String(item.packageDays)  : "",
        //     driverDays:      item.driverDays   != null ? String(item.driverDays)   : "",
        //     extraCharges,
        //     showExtraCharges: extraCharges.some((ec) => Number(ec.amount) > 0),
        //     discount:        item.discountAmount != null ? String(item.discountAmount) : "",
        //     advanceAmount:   item.advanceAmount  != null ? String(item.advanceAmount)  : "",
        //     vehicleOptions:  [],
        //     packageOptions:  [],
        //     taxList:         [],
        //     selectedTaxes:   [],
        //     // Temp field to match taxes after package API loads taxList
        //     _applicableTaxNames: applicableTaxNames,
        //   } as TripEntry & { _applicableTaxNames?: string[] };
        // });

        setEntries(builtEntries);

        // Load vehicles + packages for each entry
        for (const entry of builtEntries) {
          if (!entry.vehicleTypeId) continue;

          // Load vehicle options
          try {
            const vRes = await axiosInstance.get(`/vehicle/vehicleType/${entry.vehicleTypeId}/vehicle-models`);
            const vehicleOptions = (vRes.data?.items || []).map((v: any) => ({
              value: v.vehicleNumber,
              label: v.vehicleNumber,
              meta: v,
            }));
            setEntries((prev) =>
              prev.map((e) => e.id === entry.id ? { ...e, vehicleOptions } : e)
            );
          } catch { /* ignore */ }

          // Load package options + taxList
          if (!entry.packageType || !invoice.companyId) continue;
          try {
            const pRes = await axiosInstance.get("/vehicle/getPackagesByVehicleType", {
              params: {
                companyId: invoice.companyId,
                vehicleTypeId: entry.vehicleTypeId,
                pickupPoint: entry.packageType,
              },
            });

            const first = pRes.data?.packages?.[0];
            const taxList: any[] = pRes.data?.tax || [];
            let packageOptions: SelectOpt[] = [];

            if (entry.packageType === "localcity") {
              const pkgs = first?.localCity?.packages || [];
              packageOptions = pkgs
                .filter((p: any) => Number(p.amount) > 0)
                .map((p: any) => ({
                  value: p.packageId,
                  label: `${p.hours}H / ${p.km}KM — ₹${money(p.amount)}`,
                  meta: {
                    ...p,
                    extraKm:   first?.localCity?.extraKm,
                    extraHour: first?.localCity?.extraHour,
                  },
                }));
            } else if (entry.packageType === "outstation") {
              const out = first?.outstation;
              if (out && Number(out.perKm) > 0) {
                packageOptions = [{
                  value: "outstation",
                  label: `₹${money(out.perKm)}/KM | Batta ₹${money(out.driverBattaPerDay)}/Day`,
                  meta: out,
                }];
              }
            }

            // ✅ Match selectedTaxes from taxList using stored tax names
            const applicableNames: string[] = (entry as any)._applicableTaxNames || [];
            const selectedTaxes = taxList
              .filter((t: any) => applicableNames.includes((t.taxName || "").toLowerCase()))
              .map((t: any) => t.taxId);

            // ✅ If selectedPackageMeta is null (wasn't stored properly),
            //    find it from packageOptions using travelPackage value
            let selectedPackageMeta = entry.selectedPackageMeta;
            if (!selectedPackageMeta && entry.travelPackage) {
              const found = packageOptions.find((o) => o.value === entry.travelPackage);
              if (found) selectedPackageMeta = found.meta;
            }

            setEntries((prev) =>
              prev.map((e) =>
                e.id === entry.id
                  ? { ...e, packageOptions, taxList, selectedTaxes, selectedPackageMeta }
                  : e
              )
            );
          } catch { /* ignore */ }
        }

      } catch (err) {
        showToast("Failed to load invoice", "error");
      } finally {
        setGlobalLoading(false);
      }
    };

    loadInvoice();
  }, [onCallBillId]);

  const patchEntry = useCallback((id: string, patch: Partial<TripEntry>) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const loadVehicles = useCallback(async (id: string, vehicleTypeId: string) => {
    if (!vehicleTypeId) return;
    try {
      const res = await axiosInstance.get(`/vehicle/vehicleType/${vehicleTypeId}/vehicle-models`);
      patchEntry(id, { vehicleOptions: (res.data?.items || []).map((v: any) => ({ value: v.vehicleNumber, label: v.vehicleNumber, meta: v })) });
    } catch { patchEntry(id, { vehicleOptions: [] }); }
  }, [patchEntry]);

const loadPackages = useCallback(async (id: string, vehicleTypeId: string, packageType: string, cId: string) => {
  if (!vehicleTypeId || !packageType || !cId) return;
  try {
    const res = await axiosInstance.get("/vehicle/getPackagesByVehicleType", {
      params: { companyId: cId, vehicleTypeId, pickupPoint: packageType },
    });
    const first = res.data?.packages?.[0];
    let opts: SelectOpt[] = [];

    if (packageType === "localcity") {
      const pkgs = first?.localCity?.packages || [];
      opts = pkgs.filter((p: any) => Number(p.amount) > 0).map((p: any) => ({
        value: p.packageId,
        label: `${p.hours}H / ${p.km}KM — ₹${money(p.amount)}`,
        meta: { ...p, extraKm: first?.localCity?.extraKm, extraHour: first?.localCity?.extraHour },
      }));
    } else if (packageType === "outstation") {
      const out = first?.outstation;
      if (out && Number(out.perKm) > 0) {
        opts = [{ value: "outstation", label: `₹${money(out.perKm)}/KM | Batta ₹${money(out.driverBattaPerDay)}/Day`, meta: out }];
      }
    }

    const taxList: any[] = res.data?.tax || [];

    // ✅ Auto-select CGST and SGST taxes by default
  const autoSelectedTaxes = taxList
  .filter((t: any) => {
    const name = (t.taxName || "").trim().toLowerCase();
    return name === "cgst" || name === "sgst"; // ← exact match only
  })
  .map((t: any) => t.taxId);

    patchEntry(id, { packageOptions: opts, taxList, selectedTaxes: autoSelectedTaxes });
  } catch { patchEntry(id, { packageOptions: [] }); }
}, [patchEntry]);

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, makeEntry()]);
    requestAnimationFrame(() => {
      const newIdx = entryRefsArray.current.length - 1;
      if (newIdx >= 0) {
        entryRefsArray.current[newIdx]?.tripSheetRef?.current?.focus();
        activeEntryIndex.current = newIdx;
      }
    });
  }, []);
const removeEntry = useCallback(async (id: string) => {
  const entry = entries.find((e) => e.id === id);

  // Edit mode + invoiceItemId இருந்தா → backend delete
  if (isInvoiceEditMode && entry?.invoiceItemId) {
    // Minimum 1 item வேணும்
    if (entries.length <= 1) {
      showToast("At least one trip sheet is required", "error");
      return;
    }
    try {
      const res = await axiosInstance.delete(
        `/oncallinvoice/remove-item/${entry.invoiceItemId}`
      );
      if (!res.data?.success) {
        showToast(res.data?.message || "Failed to remove trip sheet", "error");
        return;
      }
      showToast("Trip sheet removed successfully", "success");
      // Local state update
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to remove trip sheet",
        "error"
      );
    }
    return;
  }

  // Normal / addMore mode → just local remove
  setEntries((prev) => prev.filter((e) => e.id !== id));
}, [entries, isInvoiceEditMode]);
  /* ── Build tripSheet item for payload ── */
 /* ── Build tripSheet item for payload ── */
const buildTripSheetPayload = (e: TripEntry) => {
  const c = calcSnapshot(e);

// ── Frontend buildTripSheetPayload — taxes store with 2 decimal ──

const taxesArray =
e.taxList
.filter(t => e.selectedTaxes.includes(t.taxId))
.map(t => ({

    taxId: t.taxId,
    taxName: t.taxName,
    taxPercent: t.taxPercent,

    // use SAME VALUE shown in UI
    taxAmount: parseFloat(
        ((c.taxableAmount * t.taxPercent) / 100).toFixed(2)
    )

}));

  return {
    ...(e.invoiceItemId ? { onCallInvoiceItemId: e.invoiceItemId } : {}),

    tripSheetNo:     e.tripSheetNumber,
    tripSheetNumber: e.tripSheetNumber,

    vehicleTypeId: e.vehicleTypeId,
    vehicleNo:     e.vehicleNo,
    vehicleNumber: e.vehicleNo,

    driverName:  e.driverName,
    guestName:   e.guestName,
    bookedBy:    e.bookedBy,

    date:       e.pickupDate,
    pickupDate: e.pickupDate,

    tripDetails:   e.tripDetails,
    packageType:   e.packageType,
    travelPackage: e.travelPackage,

    selectedPackageMeta: JSON.stringify(e.selectedPackageMeta || {}),

    garageOpenKm:  roundKM(e.garageOpenKm),
    garageCloseKm: roundKM(e.garageCloseKm),
    garageKms:     c.garageKmUsed,

    guestOpenKm:  e.hideGuest ? 0 : roundKM(e.guestOpenKm),
    guestCloseKm: e.hideGuest ? 0 : roundKM(e.guestCloseKm),
    guestKms:     e.hideGuest ? 0 : c.guestKmUsed,

    hideGuestDetails: e.hideGuest,

    startingTime: e.startingTime,
    closingTime:  e.closingTime,
    usageHours:   c.hoursUsed,

    packageDays:  c.calcDays,
    driverDays:   c.effectiveDriverDays,
    packageAmount: parseFloat(num(c.pkgBase).toFixed(2)),

    additionalKms:         roundKM(c.addKm),
    additionalKmsAmount:   parseFloat(num(c.addKmAmt).toFixed(2)),
    additionalHours:       roundKM(c.addHrs),
    additionalHoursAmount: parseFloat(num(c.addHrAmt).toFixed(2)),
    driverBatta:           parseFloat(num(c.battaAmt).toFixed(2)),

    extraChargesBreakup: JSON.stringify(
      e.extraCharges
        .filter((ec) => num(ec.amount) > 0)
        .map((ec) => ({ title: ec.title, amount: parseFloat(num(ec.amount).toFixed(2)) }))
    ),
    extraCharges:   parseFloat(num(c.extraTotal).toFixed(2)),
    discountAmount: parseFloat(num(e.discount).toFixed(2)),
    advanceAmount:  parseFloat(num(e.advanceAmount).toFixed(2)),

    // ✅ Dynamic taxes array — no static CGST/SGST/IGST hardcoding
    taxes:          JSON.stringify(taxesArray),
    totalTaxAmount: parseFloat(c.taxAmount.toFixed(2)),

amount: parseFloat(c.baseAmount.toFixed(2)),

total: parseFloat(c.finalTotal.toFixed(2)),

totalDue: parseFloat(c.totalDue.toFixed(2)),

totalAmount: parseFloat(c.baseAmount.toFixed(2)),
  };
};

  /* ── CREATE (normal mode) ── */
  const handleCreate = async () => {
    if (!companyId) return showToast("Select a company first", "error");
    const bad = entries.find((e) => !e.tripSheetNumber || !e.vehicleTypeId || !e.travelPackage);
    if (bad) return showToast("Fill Trip Sheet No, Vehicle Type & Package in all boxes", "error");

    try {
      setIsSubmitting(true);
      const selectedCompany = companies.find((c) => c.value === companyId);
      const companyName = selectedCompany?.label || "";

      const payload = {
        companyId,
        companyName,
        tripSheets: entries.map(buildTripSheetPayload),
      };

      const response = await axiosInstance.post("/oncallinvoice/createOncallInvoice", payload);

      if (response.data?.pdf) {
        const link = document.createElement("a");
        link.href = response.data.pdf;
        link.download = `oncall_invoice_${response.data.onCallBillId || Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast("On Call Invoice Saved & PDF Downloaded!", "success");
      setEntries([makeEntry()]);
      setCompanyId("");
      navigate("/orders/paymentpending");
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || "Failed to save invoice", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── EDIT INVOICE ── */
  const handleEditInvoice = async () => {
    const bad = entries.find((e) => !e.vehicleTypeId || !e.travelPackage);
    if (bad) return showToast("Fill Vehicle Type & Package in all boxes", "error");

    try {
      setIsSubmitting(true);
      const selectedCompany = companies.find((c) => c.value === companyId);
      const companyName = selectedCompany?.label || "";

      const payload = {
        companyId,
        companyName,
        invoiceItems: entries.map(buildTripSheetPayload),
      };

      await axiosInstance.put(
        `/oncallinvoice/update-oncall-invoice/${onCallBillId}`,
        payload
      );

      showToast("Invoice Updated Successfully", "success");
      navigate("/orders/paymentpending");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Update Failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── ADD MORE ── */
  const handleAddMoreSubmit = async () => {
    if (!editBillId) return showToast("Invoice ID missing", "error");
    const bad = entries.find((e) => !e.tripSheetNumber || !e.vehicleTypeId || !e.travelPackage);
    if (bad) return showToast("Fill Trip Sheet No, Vehicle Type & Package in all boxes", "error");

    try {
      setIsSubmitting(true);
      const newTripSheetNumbers = entries.map((e) => e.tripSheetNumber);
      const newTotal = entries.reduce((s, e) => s + calcSnapshot(e).finalTotal, 0);

      const payload = {
        tripSheetNumbers: newTripSheetNumbers,
        items: entries.map(buildTripSheetPayload),
        totalAmount: parseFloat(newTotal.toFixed(2)),
      };

      const response = await axiosInstance.put(`/oncallinvoice/edit/${editBillId}`, payload);

      if (response.data?.pdf) {
        const link = document.createElement("a");
        link.href = response.data.pdf;
        link.download = `oncall_invoice_${response.data.onCallBillId || editBillId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast("Trip sheets added successfully!", "success");
      navigate("/orders/paymentpending", { state: { tab: "oncall" } });
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || "Failed to update invoice", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

const handleSubmit = useCallback(async () => {
  if (isInvoiceEditMode) {
    await handleEditInvoice();
    return;
  }

  if (isAddMoreMode) {
    await handleAddMoreSubmit();
    return;
  }

  await handleCreate();
}, [
  companyId,
  entries,
  isInvoiceEditMode,
  isAddMoreMode,
]);

  // ── ONE global keyboard shortcut listener ───────────────────────────────────
  // This is the ONLY keydown listener in the entire page.
  // All Alt+Key shortcuts are handled here in the parent.
  // No keyboard listeners exist inside EntryBox or any child component.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only handle Alt+Key combinations
      if (!e.altKey) return;

      const key = e.key.toLowerCase();

      // Alt+S → Save Invoice (works regardless of active sheet)
    if (key === "s") {
  e.preventDefault();
  saveButtonRef.current?.click();
  return;
}

      // Alt+X → Add Trip Sheet (click the Add button of the last/active sheet)
      if (key === "x") {
        e.preventDefault();
        const lastIdx = entryRefsArray.current.length - 1;
        const addBtn = entryRefsArray.current[lastIdx]?.addButtonRef?.current;
        if (addBtn) {
          addBtn.click();
          // After React re-renders the new entry, focus its tripSheetRef.
          // requestAnimationFrame waits exactly one paint cycle for React to flush
          // the state update — this is NOT a setTimeout hack.
          requestAnimationFrame(() => {
            const newIdx = entryRefsArray.current.length - 1;
            if (newIdx >= 0) {
              entryRefsArray.current[newIdx]?.tripSheetRef?.current?.focus();
              activeEntryIndex.current = newIdx;
            }
          });
        }
        return;
      }

      // All other shortcuts operate on the currently active trip sheet
      const idx = activeEntryIndex.current;
      const refs = entryRefsArray.current[idx];
      if (!refs) return;

      if (key === "t") {
        e.preventDefault();
        refs.tripSheetRef.current?.focus();
        return;
      }

      if (key === "g") {
        e.preventDefault();
        refs.guestNameRef.current?.focus();
        return;
      }

      if (key === "m") {
        e.preventDefault();
        refs.garageKmRef.current?.focus();
        return;
      }

      if (key === "h") {
        e.preventDefault();
        refs.hoursRef.current?.focus();
        return;
      }

      if (key === "e") {
        e.preventDefault();
        // First: ensure Extra Charges section is visible for the active entry
        setEntries((prev) =>
          prev.map((entry, i) =>
            i === idx ? { ...entry, showExtraCharges: true } : entry
          )
        );
        // Then focus the first extra charge title select dropdown.
        requestAnimationFrame(() => {
          refs.extraChargeTitleRef?.current?.focus();
        });
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, entries, handleSubmit]);

  // ── Stateless Enter-to-Next-Focus navigation listener ──────────────────────
  useEffect(() => {
    const getFocusableElements = (): HTMLElement[] => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      return elements.filter((el) => {
        if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden') {
          return false;
        }
        if (el.getAttribute('tabindex') === '-1') {
          return false;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return false;
        }
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
        return true;
      });
    };

    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return;

      // Skip textareas if they are multiline (except we don't have textareas on this page)
      if (activeEl.tagName === "TEXTAREA") return;

      // If searchable select dropdown is open, let its local handler capture enter to select
      if (e.defaultPrevented) return;

      // If the focused element is a button (e.g. Save, Add, etc.):
      if (activeEl.tagName === "BUTTON") {
        if (activeEl.textContent?.trim() === "+") {
          e.preventDefault();
          activeEl.click();
          // Focus the next element (which will be the newly created Extra Charges row select)
          requestAnimationFrame(() => {
            const focusables = getFocusableElements();
            const currentIdx = focusables.indexOf(activeEl);
            if (currentIdx !== -1 && focusables[currentIdx + 1]) {
              focusables[currentIdx + 1].focus();
            }
          });
        }
        // Let other buttons handle Enter natively
        return;
      }

      // For all inputs/selects, navigate to next focusable element
      e.preventDefault();
      const focusables = getFocusableElements();
      const currentIdx = focusables.indexOf(activeEl);
      if (currentIdx !== -1 && currentIdx + 1 < focusables.length) {
        focusables[currentIdx + 1].focus();
      }
    };

    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, []);

const grandTotal = entries.reduce(
  (sum: number, e: TripEntry) =>
    sum + calcSnapshot(e).finalTotal,
  0
);

const grandAdvance = entries.reduce(
  (sum: number, e: TripEntry) => sum + num(e.advanceAmount),
  0
);

const grandDue = Math.max(
  0,
  grandTotal - grandAdvance
); 

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <AlertContainer />
      <div className="mx-auto w-full max-w-6xl space-y-5">

        {/* ── HEADER ── */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isInvoiceEditMode ? "Edit On Call Invoice" : "On Call Invoice"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isInvoiceEditMode
                  ? `Editing Bill #${onCallBillId} — Trip Sheet No cannot be changed`
                  : isAddMoreMode
                    ? `Adding to Bill #${editBillId} · Company: ${presetCompanyName}`
                    : "Select company → fill trip sheets → save"}
              </p>
              {isInvoiceEditMode && currentInvoiceNumber && (
                <p className="text-xs text-slate-500 mt-1">
                  Invoice No: <span className="font-semibold text-slate-700">{currentInvoiceNumber}</span>
                </p>
              )}
            </div>

            {/* Company selector */}
            <div className="flex-1 md:max-w-xs">
              <Lbl t="Company Name" req />
              {/* ✅ FIX: disabled in both addMore and edit modes */}
              {isInvoiceEditMode || isAddMoreMode ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
                  {companies.find((c) => c.value === companyId)?.label || presetCompanyName || companyId}
                </div>
              ) : (
                <Sel value={companyId}
                  onChange={(v) => { setCompanyId(v); setEntries([makeEntry()]); }}
                  options={companies} placeholder="Select Company"
                  disabled={globalLoading} />
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {grandTotal > 0 && (
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                    {isAddMoreMode ? "New Sheets Total" : grandAdvance > 0 ? "Grand Due" : "Grand Total"}
                  </div>
                  <div className="text-lg font-bold text-emerald-600">
                    ₹{grandAdvance > 0 ? money(grandDue) : Math.round(grandTotal)}
                  </div>
                </div>
              )}
              {!isAddMoreMode && !isInvoiceEditMode && (
                <button onClick={() => { setEntries([makeEntry()]); setCompanyId(""); }}
                  className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl transition-all">
                  Reset All
                </button>
              )}
              {(isAddMoreMode || isInvoiceEditMode) && (
                <button onClick={() => navigate(-1)}
                  className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl transition-all">
                  ← Back
                </button>
              )}
              {isInvoiceEditMode && (
                <button
                  type="button"
                  onClick={() => setShowChangeInvoiceModal(true)}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm"
                >
                  Change Invoice Number
                </button>
              )}
            </div>
          </div>

          {/* Existing trip sheets banner in addMore mode */}
          {isAddMoreMode && !addMoreLoading && existingSheets.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                Existing Trip Sheets ({existingSheets.length}) — new sheets will be appended:
              </p>
              <div className="flex flex-wrap gap-2">
                {existingSheets.map((s, i) => (
                  <span key={i} className="text-[11px] bg-white border border-blue-300 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                    #{s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {addMoreLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Loading existing invoice data...
            </div>
          )}

          {globalLoading && isInvoiceEditMode && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Loading invoice data...
            </div>
          )}

          {!isAddMoreMode && !isInvoiceEditMode && !companyId && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Select a company above to start filling trip sheet details
            </div>
          )}
        </div>

        {/* ── TRIP SHEET BOXES ── */}
        {(companyId || isAddMoreMode || isInvoiceEditMode) && (
          <>
            {entries.map((entry, index) => (
              <EntryBox
                key={entry.id}
                entry={entry}
                index={index}
                total={entries.length}
                vehicleTypes={vehicleTypes}
                drivers={drivers}
                globalLoading={globalLoading}
                companyId={companyId || presetCompanyId}
                isEditMode={isInvoiceEditMode} // ✅ FIX: pass as prop
refs={entryRefsArray.current[index]}
                onFocusEntry={(i) => { activeEntryIndex.current = i; }}
                onChange={patchEntry}
                onRemove={removeEntry}
                onAdd={addEntry}
                onLoadVehicles={loadVehicles}
                onLoadPackages={loadPackages}
              />
            ))}

            {entries.length > 1 && <GrandSummary entries={entries} />}

            {/* Save Button */}
            <div className="flex justify-end pb-6">
              <button
                ref={saveButtonRef}
                onClick={handleSubmit}
                disabled={isSubmitting || globalLoading}
                className={cn(
                  "px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm",
                  !isSubmitting && !globalLoading
                    ? "bg-slate-900 hover:bg-slate-800 active:scale-95 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}>
                {isSubmitting
                  ? isInvoiceEditMode
                    ? "Updating..."
                    : isAddMoreMode
                      ? "Adding..."
                      : "Saving..."
                  : isInvoiceEditMode
                    ? "Update Invoice"
                    : isAddMoreMode
                      ? `Add ${entries.length} Trip Sheet${entries.length > 1 ? "s" : ""} to Invoice`
                      : `Save Invoice${entries.length > 1 ? ` (${entries.length} trip sheets)` : ""}`
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Change Invoice Number Confirmation Modal */}
      {showChangeInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">Change Invoice Number</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Do you want to generate a new Invoice Number?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowChangeInvoiceModal(false)}
                disabled={changeInvoiceLoading}
                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-60"
              >
                NO
              </button>
              <button
                type="button"
                onClick={handleChangeOnCallInvoiceNumber}
                disabled={changeInvoiceLoading}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60 active:scale-95"
              >
                {changeInvoiceLoading ? "Generating..." : "YES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}