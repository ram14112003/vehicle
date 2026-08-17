import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import { useLocation, useNavigate } from "react-router-dom";

type SelectOpt = { value: string; label: string; meta?: any };

type Company = {
  companyId: string;
  companyName: string;
  gstNo?: string;
  companyAddress?: string;
  allowTax?: string | boolean;
};

type VehicleType = {
  vehicleTypeId: string;
  vehicleType: string;
  isDeleted?: boolean;
};

type Tax = {
  taxId: string;
  taxName: string;
  taxPercent: number;
};

type ExtraCharge = { type: string; amount: string };

type RouteCard = {
  id: string; // client UUID or monthlyInvoiceItemId
  monthlyInvoiceItemId?: string;
  route: string;
  vehicleTypeId: string;
  vehicleNo: string;
  packageKey: string;
  baseAmount: string;
  extraKmInput: string;
  extraDaysInput: string;
  extraHrsInput: string;
  extraChargesList: ExtraCharge[];
  discount: string;
  advance: string;
  selectedTaxIds: string[];
};

const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");
const uid = () => Math.random().toString(36).slice(2, 9);

const toNumber = (v: any) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const r0 = (v: any) => Math.round(toNumber(v));

const inr0 = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Math.round(n)
  );

// ─── UI Primitives matching OnCall Invoice ────────────────────────────────────
const Lbl = ({ t, req }: { t: string; req?: boolean }) => (
  <div className="mb-1 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
    {t}{req && <span className="text-red-400 ml-0.5">*</span>}
  </div>
);

const Sel = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOpt[];
  placeholder?: string;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLSelectElement>;
}) => (
  <div className="relative">
    <select
      ref={inputRef}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-blue-50 transition-all",
        disabled ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
      )}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
    </svg>
  </div>
);

const Inp = ({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  readOnly,
  inputRef,
}: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) => (
  <input
    ref={inputRef}
    value={value}
    type={type}
    disabled={disabled}
    readOnly={readOnly}
    placeholder={placeholder}
    onChange={(e) => onChange?.(e.target.value)}
    onWheel={(e) => type === "number" && (e.target as HTMLInputElement).blur()}
    className={cn(
      "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all",
      disabled || readOnly
        ? "opacity-70 cursor-not-allowed bg-slate-50 border-slate-200"
        : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-400"
    )}
  />
);

const SRow = ({
  label,
  value,
  bold,
  color,
  border,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
  border?: boolean;
}) => (
  <div className={cn("flex justify-between items-center py-1", border && "border-t border-slate-200 mt-1 pt-2")}>
    <span className={cn("text-xs", bold ? "font-semibold text-slate-700" : "text-slate-500")}>{label}</span>
    <span className={cn("text-xs font-semibold", color || "text-slate-800")}>{value}</span>
  </div>
);

const SectionHeading = ({ label, color }: { label: string; color: string }) => (
  <div className={cn("text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2", color)}>
    <span className="w-5 h-px bg-current opacity-40 inline-block"></span>
    {label}
  </div>
);

function MetaBadge({ label, val, color }: { label: string; val: string; color: string }) {
  const map: Record<string, string> = {
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    slate: "bg-slate-100 border-slate-200 text-slate-500",
  };
  return (
    <div className={cn("flex items-center gap-1 border rounded-lg px-2 py-1 text-[11px]", map[color] || map.slate)}>
      <span className="opacity-60">{label}:</span>
      <span className="font-semibold">{val}</span>
    </div>
  );
}

const makeRouteCard = (): RouteCard => ({
  id: uid(),
  route: "",
  vehicleTypeId: "",
  vehicleNo: "",
  packageKey: "",
  baseAmount: "0",
  extraKmInput: "0",
  extraDaysInput: "0",
  extraHrsInput: "0",
  extraChargesList: [{ type: "toll", amount: "0" }],
  discount: "0",
  advance: "0",
  selectedTaxIds: [],
});

// ─── Searchable Select (type to filter, full keyboard support) ───────────────
const SearchableSel = ({ value, onChange, options, placeholder, disabled, inputRef, onCommit }: {
  value: string; onChange: (v: string) => void; options: SelectOpt[];
  placeholder?: string; disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  onCommit?: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  const commitSelection = (idx: number, isTab = false) => {
    const opt = filtered[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    setQuery("");
    setHighlightIdx(-1);
    if (!isTab && onCommit) {
      requestAnimationFrame(() => {
        onCommit();
      });
    }
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
      e.preventDefault();
      setOpen(false);
      setQuery("");
      setHighlightIdx(-1);
    } else if (e.key === "Tab") {
      if (open && highlightIdx >= 0 && filtered[highlightIdx]) {
        commitSelection(highlightIdx, true);
      } else {
        setOpen(false);
        setQuery("");
      }
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
                onMouseEnter={() => setHighlightIdx(idx)}
                onMouseDown={() => commitSelection(idx)}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer transition-colors",
                  idx === highlightIdx
                    ? "bg-blue-100 text-blue-800 font-semibold"
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

// ─── Route Card Refs ──────────────────────────────────────────────────────────
export interface RouteCardRefs {
  routeRef: React.RefObject<HTMLInputElement | null>;
  vehicleTypeRef: React.RefObject<HTMLSelectElement | null>;
  vehicleNoRef: React.RefObject<HTMLInputElement | null>;
  extraKmRef: React.RefObject<HTMLInputElement | null>;
  extraDaysRef: React.RefObject<HTMLInputElement | null>;
  extraHoursRef: React.RefObject<HTMLInputElement | null>;
  packageRef: React.RefObject<HTMLSelectElement | null>;
  baseAmountRef: React.RefObject<HTMLInputElement | null>;
  extraChargesRefs: { current: Array<{ type: HTMLSelectElement | null, amount: HTMLInputElement | null }> };
  discountRef: React.RefObject<HTMLInputElement | null>;
  advanceRef: React.RefObject<HTMLInputElement | null>;
  addButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const makeRouteCardRefs = (): RouteCardRefs => ({
  routeRef: React.createRef<HTMLInputElement>(),
  vehicleTypeRef: React.createRef<HTMLSelectElement>(),
  vehicleNoRef: React.createRef<HTMLInputElement>(),
  extraKmRef: React.createRef<HTMLInputElement>(),
  extraDaysRef: React.createRef<HTMLInputElement>(),
  extraHoursRef: React.createRef<HTMLInputElement>(),
  packageRef: React.createRef<HTMLSelectElement>(),
  baseAmountRef: React.createRef<HTMLInputElement>(),
  extraChargesRefs: { current: [] },
  discountRef: React.createRef<HTMLInputElement>(),
  advanceRef: React.createRef<HTMLInputElement>(),
  addButtonRef: React.createRef<HTMLButtonElement>(),
});

// ─── Sub-component for individual Route Card (Identical to OnCall Trip Sheet Box) ───
function RouteCardItem({
  companyId,
  vehicleTypes,
  card,
  taxes,
  allowTax,
  cardIndex,
  totalCards,
  canRemove,
  onUpdateCard,
  onRemoveCard,
  onAddRouteCard,
  onSnapshotCalculated,
  refs,
  onFocusCard,
  focusNext,
}: {
  companyId: string;
  vehicleTypes: SelectOpt[];
  card: RouteCard;
  taxes: Tax[];
  allowTax: boolean;
  cardIndex: number;
  totalCards: number;
  canRemove: boolean;
  onUpdateCard: (index: number, updated: Partial<RouteCard>) => void;
  onRemoveCard: (index: number) => void;
  onAddRouteCard: () => void;
  onSnapshotCalculated: (index: number, snapshot: any) => void;
  refs: RouteCardRefs;
  onFocusCard: (index: number) => void;
  focusNext: (el: HTMLElement | null) => void;
}) {
  const [packageOptions, setPackageOptions] = useState<SelectOpt[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<SelectOpt[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Load vehicle options when vehicleTypeId changes
  useEffect(() => {
    if (!card.vehicleTypeId) {
      setVehicleOptions([]);
      return;
    }

    (async () => {
      try {
        setLoadingVehicles(true);
        const res = await axiosInstance.get(`/vehicle/vehicleType/${card.vehicleTypeId}/vehicle-models`);
        const opts = (res.data?.items || []).map((v: any) => ({
          value: v.vehicleNumber,
          label: v.vehicleNumber,
          meta: v,
        }));
        setVehicleOptions(opts);
      } catch (e) {
        setVehicleOptions([]);
      } finally {
        setLoadingVehicles(false);
      }
    })();
  }, [card.vehicleTypeId]);

  // 1. Vehicle Type Change -> Call GET /vehicle/getPackagesByVehicleType
  useEffect(() => {
    if (!companyId || !card.vehicleTypeId) {
      setPackageOptions([]);
      return;
    }

    (async () => {
      try {
        setLoadingPackages(true);
        const res = await axiosInstance.get("/vehicle/getPackagesByVehicleType", {
          params: { companyId, vehicleTypeId: card.vehicleTypeId, pickupPoint: "monthly" },
        });

        const rows = res.data?.packages || [];
        const opts: SelectOpt[] = [];

        rows.forEach((r: any) => {
          const mb = r?.monthlyBookings;
          const pkgs = mb?.packages || [];
          const extraKmRate = Number(mb?.extraKm ?? 0);
          const extraHourRate = Number(mb?.extraHour ?? 0);

          pkgs.forEach((p: any) => {
            const days = Number(p?.hours ?? 0);
            const km = Number(p?.km ?? 0);
            const amount = Number(p?.amount ?? 0);
            const key = `${r.packageDataId}:${p.packageId}`;
            const label = `${days} days / ${km} kms - ${inr0(amount)}`;

            opts.push({
              value: key,
              label,
              meta: {
                ...p,
                packageId: p.packageId,
                __days: days,
                __km: km,
                __amount: amount,
                __extraKmRate: extraKmRate,
                __extraHourRate: extraHourRate,
                __packageDataId: r.packageDataId,
                packageDataId: r.packageDataId,
                raw: p,
              },
            });
          });
        });

        setPackageOptions(opts);

        if (opts.length > 0) {
          if (!card.packageKey) {
            onUpdateCard(cardIndex, {
              packageKey: opts[0].value,
              baseAmount: String(opts[0].meta.__amount ?? 0),
            });
          } else {
            const found = opts.find((x) => x.value === card.packageKey);
            if (found && card.baseAmount === "0") {
              onUpdateCard(cardIndex, { baseAmount: String(found.meta.__amount ?? 0) });
            }
          }
        }
      } catch (e: any) {
        setPackageOptions([]);
      } finally {
        setLoadingPackages(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, card.vehicleTypeId]);

  const handlePackageChange = (newKey: string) => {
    const found = packageOptions.find((p) => p.value === newKey);
    const amount = found?.meta?.__amount ?? 0;
    onUpdateCard(cardIndex, {
      packageKey: newKey,
      baseAmount: String(amount),
    });
  };

  const selectedPackage = useMemo(
    () => packageOptions.find((p) => p.value === card.packageKey)?.meta || null,
    [packageOptions, card.packageKey]
  );

  // EXACT OnCall Invoice Calculation Engine (`calcSnapshot` flow)
  const snapshot = useMemo(() => {
    const pkgAmount = r0(card.baseAmount);
    const pkgDays = Number(selectedPackage?.__days ?? 0);
    const pkgKm = Number(selectedPackage?.__km ?? 0);

    const extraKmRate = r0(selectedPackage?.__extraKmRate ?? selectedPackage?.extraKm ?? 0);
    const extraHourRate = r0(selectedPackage?.__extraHourRate ?? selectedPackage?.extraHour ?? 0);

    const perDayRate = pkgDays > 0 ? pkgAmount / pkgDays : 0;

    const extraKmCount = toNumber(card.extraKmInput);
    const extraDaysCount = toNumber(card.extraDaysInput);
    const extraHrsCount = toNumber(card.extraHrsInput);

    const addKmAmt = r0(extraKmCount * extraKmRate);
    const addDaysAmt = r0(extraDaysCount * perDayRate);
    const addHrAmt = r0(extraHrsCount * extraHourRate);

    const disc = r0(card.discount);
    const adv = r0(card.advance);

    const extraTotal = r0(
      card.extraChargesList.reduce((sum, row) => sum + toNumber(row.amount), 0)
    );

    const pkgBase = pkgAmount;
    const battaAmt = addDaysAmt;
    const taxableAmount = pkgBase + addKmAmt + addHrAmt + battaAmt;
    const baseAmount = pkgBase + addKmAmt + addHrAmt + battaAmt; // Sub Total

    let selectedTaxesList: Tax[] = [];
    if (allowTax) {
      const map = new Map(taxes.map((t) => [t.taxId, t]));
      selectedTaxesList = card.selectedTaxIds.map((id) => map.get(id)).filter(Boolean) as Tax[];
    }

    const taxBreakup = selectedTaxesList.map((t) => {
      const pct = Number(t.taxPercent || 0);
      const amt = Math.round((taxableAmount * pct) / 100);
      return { ...t, amount: amt };
    });

    const taxAmount = taxBreakup.reduce((s, t) => s + t.amount, 0);

    const finalTotal = baseAmount + taxAmount + extraTotal - disc;
    const totalDue = Math.max(0, finalTotal - adv);

    return {
      pkgAmount,
      pkgDays,
      pkgKm,
      extraKmRate,
      extraHourRate,
      perDayRate,
      extraKmCount,
      extraDaysCount,
      extraHrsCount,
      addKmAmt,
      addDaysAmt,
      addHrAmt,
      disc,
      adv,
      extraTotal,
      baseAmount,
      subTotal: baseAmount,
      taxableAmount,
      taxBreakup,
      taxRows: taxBreakup,
      taxAmount,
      taxTotal: taxAmount,
      finalTotal,
      itemTotal: finalTotal,
      totalDue,
      balanceDue: totalDue,
      selectedPackage,
    };
  }, [card, selectedPackage, taxes, allowTax]);

  useEffect(() => {
    onSnapshotCalculated(cardIndex, snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  // Extra Charges Helpers
  const addExtraCharge = () => {
    onUpdateCard(cardIndex, {
      extraChargesList: [...card.extraChargesList, { type: "toll", amount: "0" }],
    });
  };

  const updateExtraCharge = (cIdx: number, field: "type" | "amount", value: string) => {
    const list = card.extraChargesList.map((row, i) => (i === cIdx ? { ...row, [field]: value } : row));
    onUpdateCard(cardIndex, { extraChargesList: list });
  };

  const removeExtraCharge = (cIdx: number) => {
    const list = card.extraChargesList.filter((_, i) => i !== cIdx);
    onUpdateCard(cardIndex, { extraChargesList: list });
  };

  const toggleTax = (taxId: string) => {
    if (!allowTax) return;
    const taxIds = card.selectedTaxIds.includes(taxId)
      ? card.selectedTaxIds.filter((x) => x !== taxId)
      : [...card.selectedTaxIds, taxId];
    onUpdateCard(cardIndex, { selectedTaxIds: taxIds });
  };

  // Keep extraChargesRefs length in sync with extraChargesList
  if (refs.extraChargesRefs.current.length !== card.extraChargesList.length) {
    if (refs.extraChargesRefs.current.length > card.extraChargesList.length) {
      refs.extraChargesRefs.current.splice(card.extraChargesList.length);
    } else {
      while (refs.extraChargesRefs.current.length < card.extraChargesList.length) {
        refs.extraChargesRefs.current.push({ type: null, amount: null });
      }
    }
  }

  return (
    <div
      onFocus={() => onFocusCard(cardIndex)}
      onClick={() => onFocusCard(cardIndex)}
      className="relative rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* ── Box Header (Dark header matching OnCall Trip Sheet) ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
            {cardIndex + 1}
          </div>
          <span className="text-sm font-semibold text-white tracking-wide">
            {card.route || `Route Invoice #${cardIndex + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {snapshot.finalTotal > 0 && (
            <span className="text-sm font-bold text-emerald-400">₹{r0(snapshot.totalDue)}</span>
          )}
          {canRemove && (
            <button
              onClick={() => onRemoveCard(cardIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-xs font-semibold transition-all"
              title="Delete this route card"
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
        {/* ── SECTION 1: Route & Vehicle Information ── */}
        <div>
          <SectionHeading label="Route & Vehicle Information" color="text-blue-500" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Lbl t="Route Name" req />
              <Inp
                value={card.route}
                onChange={(v) => onUpdateCard(cardIndex, { route: v })}
                placeholder="e.g. Chennai - Sriperumbudur"
                inputRef={refs.routeRef}
              />
            </div>
            <div>
              <Lbl t="Vehicle Type" req />
              <Sel
                value={card.vehicleTypeId}
                onChange={(v) => onUpdateCard(cardIndex, { vehicleTypeId: v, vehicleNo: "" })}
                options={vehicleTypes}
                placeholder="Select Type"
                inputRef={refs.vehicleTypeRef}
              />
            </div>
            <div>
              <Lbl t="Vehicle No" />
              <SearchableSel
                value={card.vehicleNo}
                onChange={(v) => onUpdateCard(cardIndex, { vehicleNo: v })}
                options={vehicleOptions}
                placeholder={card.vehicleTypeId ? "Search vehicle..." : "Type First"}
                disabled={!card.vehicleTypeId}
                inputRef={refs.vehicleNoRef}
                onCommit={() => focusNext(refs.vehicleNoRef.current)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200" />

        {/* ── SECTION 2: KM & Time ── */}
        <div>
          <SectionHeading label="KM & Time" color="text-violet-500" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Lbl t="Extra KM" />
              <Inp
                type="number"
                value={card.extraKmInput}
                onChange={(v) => onUpdateCard(cardIndex, { extraKmInput: v })}
                placeholder="0"
                inputRef={refs.extraKmRef}
              />
            </div>
            <div>
              <Lbl t="Extra Days" />
              <Inp
                type="number"
                value={card.extraDaysInput}
                onChange={(v) => onUpdateCard(cardIndex, { extraDaysInput: v })}
                placeholder="0"
                inputRef={refs.extraDaysRef}
              />
            </div>
            <div>
              <Lbl t="Extra Hours" />
              <Inp
                type="number"
                value={card.extraHrsInput}
                onChange={(v) => onUpdateCard(cardIndex, { extraHrsInput: v })}
                placeholder="0"
                inputRef={refs.extraHoursRef}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200" />

        {/* ── SECTION 3: Package ── */}
        <div>
          <SectionHeading label="Package" color="text-orange-500" />
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Lbl t="Travel Package" req />
              <Sel
                value={card.packageKey}
                onChange={handlePackageChange}
                options={packageOptions}
                placeholder={loadingPackages ? "Loading packages..." : "Select Package"}
                disabled={loadingPackages || !card.vehicleTypeId}
                inputRef={refs.packageRef}
              />
            </div>
          </div>

          {selectedPackage && (
            <div className="mt-3 flex flex-wrap gap-2">
              <MetaBadge label="Days" val={`${snapshot.pkgDays} days`} color="orange" />
              <MetaBadge label="KM" val={`${snapshot.pkgKm} km`} color="orange" />
              <MetaBadge label="Pkg Amt" val={`₹${snapshot.pkgAmount}`} color="green" />
              <MetaBadge label="Extra/KM" val={`₹${snapshot.extraKmRate}`} color="slate" />
              <MetaBadge label="Extra/Hr" val={`₹${snapshot.extraHourRate}`} color="slate" />
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-slate-200" />

        {/* ── SECTION 4: 2-Column Responsive Layout (Charges & Deductions on LEFT / Fare Breakdown on RIGHT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT COLUMN — Charges & Deductions */}
          <div className="space-y-4">
            <SectionHeading label="Charges & Deductions" color="text-slate-500" />

            <div>
              <Lbl t="Package Base Amount (₹)" />
              <Inp
                type="number"
                value={card.baseAmount}
                onChange={(v) => onUpdateCard(cardIndex, { baseAmount: v })}
                placeholder="0"
                inputRef={refs.baseAmountRef}
              />
            </div>

            {allowTax && taxes.length > 0 && (
              <div>
                <Lbl t="Tax" />
                <div className="flex flex-wrap gap-3">
                  {taxes.map((t) => (
                    <label key={t.taxId} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={card.selectedTaxIds.includes(t.taxId)}
                        onChange={() => toggleTax(t.taxId)}
                        className="rounded accent-blue-600"
                      />
                      {t.taxName} ({t.taxPercent}%)
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Lbl t="Extra Charges (Toll / Parking / Others)" />
                <button
                  type="button"
                  onClick={addExtraCharge}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Add Extra Charge
                </button>
              </div>
              <div className="space-y-2">
                {card.extraChargesList.map((ec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      ref={(el) => {
                        if (!refs.extraChargesRefs.current[idx]) {
                          refs.extraChargesRefs.current[idx] = { type: null, amount: null };
                        }
                        refs.extraChargesRefs.current[idx].type = el;
                      }}
                      value={ec.type}
                      onChange={(e) => updateExtraCharge(idx, "type", e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                    >
                      <option value="toll">Toll</option>
                      <option value="parking">Parking</option>
                      <option value="permit">Permit</option>
                      <option value="other">Others</option>
                    </select>
                    <div className="w-28">
                      <input
                        ref={(el) => {
                          if (!refs.extraChargesRefs.current[idx]) {
                            refs.extraChargesRefs.current[idx] = { type: null, amount: null };
                          }
                          refs.extraChargesRefs.current[idx].amount = el;
                        }}
                        type="number"
                        value={ec.amount}
                        onChange={(e) => updateExtraCharge(idx, "amount", e.target.value)}
                        placeholder="₹0"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-50 transition-all hover:border-slate-300 focus:border-blue-400"
                      />
                    </div>
                    {card.extraChargesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExtraCharge(idx)}
                        className="w-7 h-7 rounded-md bg-red-100 hover:bg-red-200 text-red-500 text-sm font-bold flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl t="Discount (₹)" />
                <Inp
                  type="number"
                  value={card.discount}
                  onChange={(v) => onUpdateCard(cardIndex, { discount: v })}
                  placeholder="0"
                  inputRef={refs.discountRef}
                />
              </div>
              <div>
                <Lbl t="Advance (₹)" />
                <Inp
                  type="number"
                  value={card.advance}
                  onChange={(v) => onUpdateCard(cardIndex, { advance: v })}
                  placeholder="0"
                  inputRef={refs.advanceRef}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Fare Breakdown Panel (Exact OnCall Panel UI) */}
          <div>
            <SectionHeading label="Fare Breakdown" color="text-emerald-500" />
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-0.5">
              <SRow label="Package Amount" value={`₹${r0(snapshot.pkgAmount)}`} />
              <SRow
                label={`Extra KM (${snapshot.extraKmCount}Km×₹${snapshot.extraKmRate})`}
                value={`₹${r0(snapshot.addKmAmt)}`}
              />
              <SRow
                label={`Extra Hours (${snapshot.extraHrsCount}Hrs×₹${snapshot.extraHourRate})`}
                value={`₹${r0(snapshot.addHrAmt)}`}
              />
              <SRow
                label={`Extra Days (${snapshot.extraDaysCount}d×₹${r0(snapshot.perDayRate)})`}
                value={`₹${r0(snapshot.addDaysAmt)}`}
              />

              <SRow label="Sub Total" value={`₹${r0(snapshot.baseAmount)}`} bold border />

              {snapshot.taxBreakup.map((t: any) => (
                <SRow
                  key={t.taxId || t.taxName}
                  label={`${t.taxName} (${t.taxPercent}%)`}
                  value={`+₹${t.amount}`}
                  color="text-orange-600"
                />
              ))}
              {/* {snapshot.taxBreakup.length > 0 && (
                <SRow label="Total GST" value={`+₹${r0(snapshot.taxAmount)}`} color="text-orange-600" bold />
              )} */}

              {snapshot.extraTotal > 0 && (
                <SRow label="Extra Charges" value={`+₹${r0(snapshot.extraTotal)}`} color="text-slate-800" />
              )}

              {snapshot.disc > 0 && (
                <SRow label="Discount" value={`-₹${r0(snapshot.disc)}`} color="text-red-500" />
              )}

              <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Box Total</span>
                <span className="text-lg font-bold text-blue-700">₹{r0(snapshot.finalTotal)}</span>
              </div>

              {snapshot.adv > 0 && (
                <>
                  <SRow label="Advance" value={`-₹${r0(snapshot.adv)}`} color="text-slate-400" />
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1">
                    <span className="text-xs font-bold text-slate-700">Total Due</span>
                    <span className="text-sm font-bold text-emerald-600">₹{r0(snapshot.totalDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Add Route Invoice Button (Last Box Only) ── */}
      {cardIndex === totalCards - 1 && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">Add another route card to this invoice</span>
          <button
            type="button"
            ref={refs.addButtonRef}
            onClick={onAddRouteCard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">+</span>
            Add Route Invoice
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Monthlybooking Component ─────────────────────────────────────────────
export default function Monthlybooking() {
  const location = useLocation();
  const editState = (location.state || {}) as any;
  const isEditMode = editState?.mode === "edit" && !!editState?.monthlyInvoiceId;
  const editId = editState?.monthlyInvoiceId as string | undefined;

  const navigate = useNavigate();
  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(todayISO);
  const [month, setMonth] = useState(todayISO.slice(0, 7));
  const [companyId, setCompanyId] = useState("");
  const [monthlyBookingCode, setMonthlyBookingCode] = useState("");

  const [companies, setCompanies] = useState<SelectOpt[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<SelectOpt[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [allowTax, setAllowTax] = useState(false);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);

  // Multi-route cards array
  const [routeCards, setRouteCards] = useState<RouteCard[]>([makeRouteCard()]);
  const [snapshotsMap, setSnapshotsMap] = useState<Record<number, any>>({});

  const companyRef = useRef<HTMLSelectElement | null>(null);
  const invoiceDateRef = useRef<HTMLInputElement | null>(null);
  const monthRef = useRef<HTMLInputElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);

  // ── Keyboard shortcut refs ──────────────────────────────────────────────────
  const cardRefsArray = useRef<RouteCardRefs[]>([makeRouteCardRefs()]);
  const activeEntryIndex = useRef<number>(0);

  if (cardRefsArray.current.length < routeCards.length) {
    while (cardRefsArray.current.length < routeCards.length) {
      cardRefsArray.current.push(makeRouteCardRefs());
    }
  } else if (cardRefsArray.current.length > routeCards.length) {
    cardRefsArray.current.splice(routeCards.length);
  }
  if (activeEntryIndex.current >= routeCards.length) {
    activeEntryIndex.current = Math.max(0, routeCards.length - 1);
  }

  const getActiveFocusableRefs = (): HTMLElement[] => {
    const list: HTMLElement[] = [];

    if (companyRef.current) list.push(companyRef.current);
    if (invoiceDateRef.current) list.push(invoiceDateRef.current);
    if (monthRef.current) list.push(monthRef.current);

    routeCards.forEach((card, idx) => {
      const refs = cardRefsArray.current[idx];
      if (!refs) return;

      if (refs.routeRef.current) list.push(refs.routeRef.current);
      if (refs.vehicleTypeRef.current) list.push(refs.vehicleTypeRef.current);
      if (refs.vehicleNoRef.current) list.push(refs.vehicleNoRef.current);
      if (refs.extraKmRef.current) list.push(refs.extraKmRef.current);
      if (refs.extraDaysRef.current) list.push(refs.extraDaysRef.current);
      if (refs.extraHoursRef.current) list.push(refs.extraHoursRef.current);
      if (refs.packageRef.current) list.push(refs.packageRef.current);
      if (refs.baseAmountRef.current) list.push(refs.baseAmountRef.current);

      if (refs.extraChargesRefs && refs.extraChargesRefs.current) {
        refs.extraChargesRefs.current.forEach((ecRef) => {
          if (ecRef.type) list.push(ecRef.type);
          if (ecRef.amount) list.push(ecRef.amount);
        });
      }

      if (refs.discountRef.current) list.push(refs.discountRef.current);
      if (refs.advanceRef.current) list.push(refs.advanceRef.current);

      if (idx === routeCards.length - 1 && refs.addButtonRef.current) {
        list.push(refs.addButtonRef.current);
      }
    });

    if (saveButtonRef.current) list.push(saveButtonRef.current);

    return list;
  };

  const focusNext = useCallback((activeEl: HTMLElement | null) => {
    if (!activeEl) return;

    if (activeEl === companyRef.current && !companyId) {
      showToast("Please select a company", "warn");
      return;
    }
    if (activeEl === invoiceDateRef.current && !invoiceDate) {
      showToast("Please fill invoice date", "warn");
      return;
    }
    if (activeEl === monthRef.current && !month) {
      showToast("Please fill invoice month", "warn");
      return;
    }

    for (let idx = 0; idx < routeCards.length; idx++) {
      const refs = cardRefsArray.current[idx];
      const card = routeCards[idx];
      if (!refs) continue;

      if (activeEl === refs.routeRef.current && !card.route.trim()) {
        showToast(`Please enter Route for Route Card #${idx + 1}`, "warn");
        return;
      }
      if (activeEl === refs.vehicleTypeRef.current && !card.vehicleTypeId) {
        showToast(`Please select Vehicle Type for Route Card #${idx + 1}`, "warn");
        return;
      }

      if (activeEl === refs.packageRef.current && !card.packageKey) {
        showToast(`Please select Package for Route Card #${idx + 1}`, "warn");
        return;
      }
    }

    const list = getActiveFocusableRefs();
    const currentIdx = list.indexOf(activeEl);
    if (currentIdx !== -1 && currentIdx + 1 < list.length) {
      list[currentIdx + 1].focus();
    }
  }, [companyId, invoiceDate, month, routeCards]);

  const onFocusCard = useCallback((index: number) => {
    activeEntryIndex.current = index;
  }, []);

  const addRouteCardAndFocus = () => {
    addRouteCard();
    requestAnimationFrame(() => {
      const newIdx = cardRefsArray.current.length - 1;
      if (newIdx >= 0 && cardRefsArray.current[newIdx]) {
        cardRefsArray.current[newIdx].routeRef.current?.focus();
        activeEntryIndex.current = newIdx;
      }
    });
  };

  // ── Keyboard shortcut listener ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (key === "n") {
        e.preventDefault();
        addRouteCardAndFocus();
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        const activeIdx = activeEntryIndex.current;
        if (activeIdx >= 0 && activeIdx < routeCards.length) {
          removeRouteCard(activeIdx);
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [companyId, invoiceDate, month, routeCards, handleSubmit]);

  // ── Enter key navigation listener ──
  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return;

      if (activeEl.tagName === "TEXTAREA") return;
      if (e.defaultPrevented) return;

      if (activeEl.tagName === "BUTTON") {
        if (activeEl.textContent?.includes("Add Route Invoice")) {
          e.preventDefault();
          addRouteCardAndFocus();
        }
        return;
      }

      e.preventDefault();
      focusNext(activeEl);
    };

    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, [companyId, invoiceDate, month, routeCards, focusNext]);

  // Change Invoice Number Modal
  const [showChangeInvoiceModal, setShowChangeInvoiceModal] = useState(false);
  const [changeInvoiceLoading, setChangeInvoiceLoading] = useState(false);
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>("");

  // Delete Route Card Confirmation Modal
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    show: boolean;
    index: number;
    isLast: boolean;
  }>({
    show: false,
    index: -1,
    isLast: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. GET /company/getAllCompany & GET /vehicleType/getAllVehicleType
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [compRes, vtRes] = await Promise.all([
          axiosInstance.get("/company/getAllCompany", { params: { status: 0 } }),
          axiosInstance.get("/vehicleType/getAllVehicleType", { params: { status: 0 } }),
        ]);

        const cList = (compRes.data?.data || []).map((c: any) => ({
          value: c.companyId,
          label: c.companyName,
          meta: c,
        }));

        const vtList = (vtRes.data?.data || [])
          .filter((vt: any) => !vt.isDeleted)
          .map((vt: any) => ({
            value: vt.vehicleTypeId,
            label: vt.vehicleType,
            meta: vt,
          }));

        setCompanies(cList);
        setVehicleTypes(vtList);
      } catch (e: any) {
        showToast(e?.response?.data?.message || "Failed to load master data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Company Change -> GET /company/company/${companyId}/taxes
  useEffect(() => {
    if (!companyId) {
      setSelectedCompany(null);
      setAllowTax(false);
      setTaxes([]);
      return;
    }

    (async () => {
      try {
        const taxRes = await axiosInstance.get(`/company/company/${companyId}/taxes`);
        const comp = taxRes.data?.company || null;
        setSelectedCompany(comp);

        const isTaxAllowed = !!taxRes.data?.allowTax;
        setAllowTax(isTaxAllowed);

        const taxList = (taxRes.data?.taxes || []).map((t: any) => ({
          taxId: t.taxId,
          taxName: t.taxName,
          taxPercent: Number(t.taxPercent ?? 0),
        }));
        setTaxes(taxList);

        if (!isEditMode && isTaxAllowed && taxList.length > 0) {
          const cgstSgstIds = taxList
            .filter((t: any) => {
              const name = (t.taxName || "").trim().toLowerCase();
              return name === "cgst" || name === "sgst";
            })
            .map((t: any) => t.taxId);

          setRouteCards((prev) =>
            prev.map((c) => ({
              ...c,
              selectedTaxIds: cgstSgstIds.length ? cgstSgstIds : taxList.map((t: any) => t.taxId),
            }))
          );
        }
      } catch (e: any) {
        setSelectedCompany(null);
        setTaxes([]);
        setAllowTax(false);
        showToast(e?.response?.data?.message || "Failed to load company taxes", "error");
      }
    })();
  }, [companyId, isEditMode]);

  // 3. Load Existing Monthly Invoice on Edit Mode
  useEffect(() => {
    if (!isEditMode || !editId) return;

    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/closePendingOrder/monthlyInvoice/${editId}/details`);
        const monthly = res.data?.data?.monthlyInvoice;
        const inv = res.data?.data?.invoice;

        if (!monthly) {
          showToast("Monthly invoice not found", "error");
          return;
        }

        setInvoiceDate((monthly.invoiceDate || "").slice(0, 10));
        setMonth(monthly.invoiceMonth || "");
        setCompanyId(monthly.companyId || "");
        setMonthlyBookingCode(monthly.monthlyBookingCode || "");
        setCurrentInvoiceNumber( monthly.monthlyBookingCode || "");

        const items = monthly.monthlyInvoiceItems || [];
        if (Array.isArray(items) && items.length > 0) {
          const loadedCards: RouteCard[] = items.map((item: any) => {
            const pkg = item.packageDetails || null;
            const pkgDataId = item.packageDataId || "";
            let wantedKey = "";
            if (pkg && pkgDataId) {
              wantedKey = `${pkgDataId}:${pkg.packageId}`;
            }

            const itemTaxIds = Array.isArray(item.taxes) ? item.taxes.map((t: any) => t.taxId).filter(Boolean) : [];

            return {
              id: item.monthlyInvoiceItemId || uid(),
              monthlyInvoiceItemId: item.monthlyInvoiceItemId,
              route: item.route || "",
              vehicleTypeId: item.vehicleTypeId || "",
              vehicleNo: item.vehicleNumber || "",
              packageKey: wantedKey,
              baseAmount: String(item.packageAmount ?? 0),
              extraKmInput: String(item.extraKm ?? 0),
              extraDaysInput: String(item.extraDays ?? 0),
              extraHrsInput: String(item.extraHrs ?? 0),
              extraChargesList: Array.isArray(item.extraCharges) && item.extraCharges.length > 0
                ? item.extraCharges.map((x: any) => ({ type: x.type || "toll", amount: String(x.amount ?? 0) }))
                : [{ type: "toll", amount: "0" }],
              discount: String(item.discount ?? 0),
              advance: String(item.advance ?? 0),
              selectedTaxIds: itemTaxIds,
            };
          });

          setRouteCards(loadedCards);
        } else {
          // Fallback legacy 1:1 invoice record
          const pkg = monthly.packageDetails || null;
          const pkgDataId = monthly.packageDataId || "";
          let wantedKey = "";
          if (pkg && pkgDataId) {
            wantedKey = `${pkgDataId}:${pkg.packageId}`;
          }

          const taxIds = Array.isArray(monthly.taxes) ? monthly.taxes.map((t: any) => t.taxId) : [];

          setRouteCards([
            {
              id: monthly.monthlyInvoiceId || uid(),
              monthlyInvoiceItemId: monthly.monthlyInvoiceId,
              route: monthly.route || "",
              vehicleTypeId: monthly.vehicleTypeId || "",
              vehicleNo: monthly.vehicleNumber || "",
              packageKey: wantedKey,
              baseAmount: String(monthly.packageAmount ?? 0),
              extraKmInput: String(monthly.extraKm ?? 0),
              extraDaysInput: String(monthly.extraDays ?? 0),
              extraHrsInput: String(monthly.extraHrs ?? 0),
              extraChargesList: Array.isArray(monthly.extraCharges) && monthly.extraCharges.length > 0
                ? monthly.extraCharges.map((x: any) => ({ type: x.type || "toll", amount: String(x.amount ?? 0) }))
                : [{ type: "toll", amount: "0" }],
              discount: String(monthly.discount ?? 0),
              advance: String(monthly.advance ?? 0),
              selectedTaxIds: taxIds,
            },
          ]);
        }
      } catch (e: any) {
        showToast(e?.response?.data?.message || "Failed to load monthly invoice", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEditMode, editId]);

  // Route Cards Management
  const addRouteCard = () => {
    const newCard = makeRouteCard();
    if (allowTax && taxes.length > 0) {
      const cgstSgstIds = taxes
        .filter((t) => {
          const name = (t.taxName || "").trim().toLowerCase();
          return name === "cgst" || name === "sgst";
        })
        .map((t) => t.taxId);
      newCard.selectedTaxIds = cgstSgstIds.length ? cgstSgstIds : taxes.map((t) => t.taxId);
    }
    setRouteCards((prev) => [...prev, newCard]);
  };

  const removeRouteCard = (index: number) => {
    const isLast = routeCards.length === 1;
    setDeleteModalConfig({
      show: true,
      index,
      isLast,
    });
  };

  const confirmDeleteRouteCard = async () => {
    const { index, isLast } = deleteModalConfig;
    if (index < 0 || index >= routeCards.length) return;

    const cardToDelete = routeCards[index];

    // If item exists in DB (has monthlyInvoiceItemId) -> call backend API
    if (cardToDelete?.monthlyInvoiceItemId) {
      try {
        setDeleteLoading(true);
        const res = await axiosInstance.delete(
          `/closePendingOrder/monthlyInvoice/item/${cardToDelete.monthlyInvoiceItemId}`
        );

        if (res.data?.entireInvoiceDeleted || isLast) {
          showToast("Entire Monthly Invoice deleted as all Route Cards were removed.", "success");
          navigate("/orders/paymentpending");
          return;
        } else {
          showToast(res.data?.message || "Route Card deleted successfully", "success");
        }
      } catch (e: any) {
        showToast(e?.response?.data?.message || "Failed to delete Route Card", "error");
        setDeleteLoading(false);
        setDeleteModalConfig({ show: false, index: -1, isLast: false });
        return;
      } finally {
        setDeleteLoading(false);
      }
    } else {
      // If client-side card not saved to DB yet and it's the last card
      if (isLast) {
        showToast("Monthly invoice must have at least one Route Card.", "warn");
        setDeleteModalConfig({ show: false, index: -1, isLast: false });
        return;
      }
    }

    // Remove from frontend state and recalculate totals
    setRouteCards((prev) => prev.filter((_, i) => i !== index));
    setSnapshotsMap((prev) => {
      const nextMap: Record<number, any> = {};
      let newIdx = 0;
      Object.keys(prev).forEach((k) => {
        const idxKey = Number(k);
        if (idxKey !== index) {
          nextMap[newIdx] = prev[idxKey];
          newIdx++;
        }
      });
      return nextMap;
    });

    setDeleteModalConfig({ show: false, index: -1, isLast: false });
  };

  const updateCard = (index: number, updated: Partial<RouteCard>) => {
    setRouteCards((prev) => prev.map((c, i) => (i === index ? { ...c, ...updated } : c)));
  };

  const handleSnapshotCalculated = (index: number, snapshot: any) => {
    setSnapshotsMap((prev) => ({ ...prev, [index]: snapshot }));
  };

  // Header Overall Grand Summary Aggregation (Matching OnCall Grand Summary)
  const overallSummary = useMemo(() => {
    let grandSubTotal = 0;
    let grandTaxTotal = 0;
    let grandExtraCharges = 0;
    let grandDiscount = 0;
    let grandAdvance = 0;
    let grandTotal = 0;
    let grandBalanceDue = 0;
    const taxMap: Record<string, { taxName: string; taxPercent: number; amount: number }> = {};

    Object.values(snapshotsMap).forEach((snap: any) => {
      if (!snap) return;
      grandSubTotal += snap.baseAmount || 0;
      grandTaxTotal += snap.taxAmount || 0;
      grandExtraCharges += snap.extraTotal || 0;
      grandDiscount += snap.disc || 0;
      grandAdvance += snap.adv || 0;
      grandTotal += snap.finalTotal || 0;
      grandBalanceDue += snap.totalDue || 0;

      (snap.taxBreakup || []).forEach((t: any) => {
        const key = t.taxId || t.taxName;
        if (!taxMap[key]) {
          taxMap[key] = { taxName: t.taxName, taxPercent: t.taxPercent, amount: 0 };
        }
        taxMap[key].amount += t.amount;
      });
    });

    return {
      grandSubTotal,
      grandTaxTotal,
      grandExtraCharges,
      grandDiscount,
      grandAdvance,
      grandTotal,
      grandBalanceDue,
      taxBreakup: Object.values(taxMap),
    };
  }, [snapshotsMap]);

  // Change Invoice Number API call
  const handleChangeInvoiceNumber = async () => {
    if (!editId) return;
    try {
      setChangeInvoiceLoading(true);
      const res = await axiosInstance.post("/closePendingOrder/monthlyInvoice/change-invoice-number", {
        monthlyInvoiceId: editId,
      });
setCurrentInvoiceNumber(res.data?.newMonthlyBookingCode || res.data?.newInvoiceNumber || "");      showToast("Invoice Number Updated Successfully", "success");
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to change invoice number", "error");
    } finally {
      setChangeInvoiceLoading(false);
      setShowChangeInvoiceModal(false);
    }
  };

  // Submit Handler (Create & Edit)
  async function handleSubmit() {
    if (!companyId) {
      showToast("Please select a company", "warn");
      return;
    }
    if (!invoiceDate || !month) {
      showToast("Please fill invoice date and month", "warn");
      return;
    }

    for (let i = 0; i < routeCards.length; i++) {
      const card = routeCards[i];
      if (!card.route.trim()) {
        showToast(`Please enter Route for Route Card #${i + 1}`, "warn");
        return;
      }
      if (!card.vehicleTypeId) {
        showToast(`Please select Vehicle Type for Route Card #${i + 1}`, "warn");
        return;
      }

    }

    const routesPayload = routeCards.map((card, idx) => {
      const snap = snapshotsMap[idx] || {};
      const vtLabel = vehicleTypes.find((v) => v.value === card.vehicleTypeId)?.label || "";

      return {
        monthlyInvoiceItemId: card.monthlyInvoiceItemId || card.id,
        route: card.route,
        vehicleTypeId: card.vehicleTypeId,
        vehicleTypeName: vtLabel,
        vehicleNumber: card.vehicleNo,
        packageDataId: snap.selectedPackage?.packageDataId || snap.selectedPackage?.__packageDataId || null,
        // packageDetails: snap.selectedPackage?.raw || snap.selectedPackage || null,
        
        packageDetails: {
    packageId: snap.selectedPackage.packageId,

    title: snap.selectedPackage.title,

    days: snap.pkgDays,

    km: snap.pkgKm,

    amount: snap.pkgAmount,

    extraKmRate: snap.extraKmRate,

    extraHourRate: snap.extraHourRate,

    extraDayRate: snap.perDayRate
},
        packageAmount: snap.pkgAmount || 0,
        extraKm: snap.extraKmCount || 0,
        extraKmAmount: snap.addKmAmt || 0,
        extraDays: snap.extraDaysCount || 0,
        extraDaysAmount: snap.addDaysAmt || 0,
        extraHrs: snap.extraHrsCount || 0,
        extraHourRate: snap.extraHourRate || 0,
        extraHrsAmount: snap.addHrAmt || 0,
        extraCharges: card.extraChargesList,
        extraChargesInputAmount: snap.extraTotal || 0,
        discount: snap.disc || 0,
        advance: snap.adv || 0,
        netTotal: snap.baseAmount || 0,
        taxes: snap.taxBreakup || [],
        totalTaxAmount: snap.taxAmount || 0,
        finalTotal: snap.finalTotal || 0,
        balanceDue: snap.totalDue || 0,
      };
    });

    const payload = {
      monthlyInvoiceId: editId,
      companyId,
      invoiceDate,
      invoiceMonth: month,
      routes: routesPayload,
    };

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await axiosInstance.put("/closePendingOrder/monthlyInvoice/edit-monthly-invoice", payload);
        showToast("Monthly Invoice updated successfully", "success");
      } else {
        await axiosInstance.post("/closePendingOrder/monthlyInvoice/create", payload);
        showToast("Monthly Invoice created successfully", "success");
      }

      navigate("/orders/paymentpending");
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to save Monthly Invoice", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <AlertContainer />

      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* ── HEADER (Matching OnCall Header Layout) ── */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isEditMode ? "Edit Monthly Invoice" : "Monthly Invoice"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditMode
                  ? `Editing Bill #${editId} — Multi-route invoice`
                  : "Select company → fill route cards → save"}
              </p>
              {isEditMode && currentInvoiceNumber && (
                <p className="text-xs text-slate-500 mt-1">
                  Invoice No: <span className="font-semibold text-slate-700">{currentInvoiceNumber}</span>
                </p>
              )}
            </div>

            {/* Company Selector */}
            <div className="flex-1 md:max-w-xs">
              <Lbl t="Company Name" req />
              {isEditMode ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
                  {companies.find((c) => c.value === companyId)?.label || companyId}
                </div>
              ) : (
                <Sel
                  value={companyId}
                  onChange={(v) => {
                    setCompanyId(v);
                    setRouteCards([makeRouteCard()]);
                  }}
                  options={companies}
                  placeholder="Select Company"
                  disabled={loading}
                  inputRef={companyRef}
                />
              )}
            </div>

            {/* Top Action Bar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {overallSummary.grandTotal > 0 && (
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Grand Total
                  </div>
                  <div className="text-lg font-bold text-emerald-600">₹{r0(overallSummary.grandBalanceDue)}</div>
                </div>
              )}
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowChangeInvoiceModal(true)}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm"
                >
                  Change Invoice Number
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl transition-all"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Additional Header Controls: Date & Month */}
          {(companyId || isEditMode) && (
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Lbl t="Invoice Date" req />
                <Inp type="date" value={invoiceDate} onChange={setInvoiceDate} inputRef={invoiceDateRef} />
              </div>
              <div>
                <Lbl t="Invoice Month" req />
                <Inp type="month" value={month} onChange={setMonth} inputRef={monthRef} />
              </div>
            </div>
          )}
        </div>

        {/* Change Invoice Number Modal */}
        {showChangeInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-800">Change Invoice Number</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to generate a new Invoice Number for this Monthly Invoice?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowChangeInvoiceModal(false)}
                  disabled={changeInvoiceLoading}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeInvoiceNumber}
                  disabled={changeInvoiceLoading}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  {changeInvoiceLoading ? "Generating..." : "Generate New Number"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Route Card Confirmation Popup Modal */}
        {deleteModalConfig.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {deleteModalConfig.isLast ? "Delete Entire Monthly Invoice" : "Delete Route Card"}
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                {deleteModalConfig.isLast
                  ? "This is the last Route Card. Deleting it will delete the entire Monthly Invoice. Continue?"
                  : "Are you sure you want to delete this Route Card?"}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalConfig({ show: false, index: -1, isLast: false })}
                  disabled={deleteLoading}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRouteCard}
                  disabled={deleteLoading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ROUTE CARDS BOXES (Matching OnCall Trip Sheet Boxes) ── */}
        {(companyId || isEditMode) && (
          <>
            {routeCards.map((card, idx) => (
              <RouteCardItem
                key={card.id}
                companyId={companyId}
                vehicleTypes={vehicleTypes}
                card={card}
                taxes={taxes}
                allowTax={allowTax}
                cardIndex={idx}
                totalCards={routeCards.length}
                canRemove={isEditMode || routeCards.length > 1}
                onUpdateCard={updateCard}
                onRemoveCard={removeRouteCard}
                onAddRouteCard={addRouteCardAndFocus}
                onSnapshotCalculated={handleSnapshotCalculated}
                refs={cardRefsArray.current[idx]}
                onFocusCard={onFocusCard}
                focusNext={focusNext}
              />
            ))}

            {/* ── OVERALL GRAND SUMMARY (Matching OnCall Grand Summary Box) ── */}
            <div className="rounded-2xl border-2 border-slate-800 bg-slate-900 text-white p-5">
              <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">
                Grand Total — {routeCards.length} Route Invoice Cards
              </div>
              <div className="space-y-1.5">
                {routeCards.map((c, i) => {
                  const snap = snapshotsMap[i] || {};
                  return (
                    <div key={c.id} className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">
                        {c.route ? (
                          <span className="font-semibold text-slate-200">{c.route}</span>
                        ) : (
                          `Route #${i + 1}`
                        )}
                        {c.vehicleNo && <span className="ml-2 text-slate-500 text-xs">— {c.vehicleNo}</span>}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">
                        ₹{r0(snap.finalTotal || 0)}
                      </span>
                    </div>
                  );
                })}

                <div className="border-t border-slate-700 pt-3 mt-2 flex justify-between items-center">
                  <span className="font-bold text-white">Grand Total</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    ₹{r0(overallSummary.grandTotal)}
                  </span>
                </div>

                {overallSummary.grandAdvance > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Advance</span>
                      <span className="text-slate-300">− ₹{r0(overallSummary.grandAdvance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Grand Due</span>
                      <span className="text-xl font-bold text-blue-400">
                        ₹{r0(overallSummary.grandBalanceDue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── SAVE BUTTON (Matching OnCall Save Button) ── */}
            <div className="flex justify-end pb-6">
              <button
                ref={saveButtonRef}
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className={cn(
                  "px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm",
                  !isSubmitting && !loading
                    ? "bg-slate-900 hover:bg-slate-800 active:scale-95 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                  ? "Update Monthly Invoice"
                  : `Save Monthly Invoice (${routeCards.length} Route Card${routeCards.length > 1 ? "s" : ""})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}