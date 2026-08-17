// src/SuperAdmin/pages/Orders/PaymentPendingList.tsx
import React, { useState, useEffect } from "react";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar";
import axiosInstance from "../../../utils/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faEye,
  faPlusCircle,
  faTimes,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface ApiItem {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  pickupPoint: string;
  userId: string;
  createdAt: string;
  invoiceNumber?: string;
  invoiceId?: string;
  invoiceAmount?: number;
  userName?: string;
  companyName?: string;
  orderDate?: string;
  pickupDate?: string;
}

interface MonthlyApiItem {
  monthlyInvoiceId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  monthlyBookingCode?: string;
  orderDate?: string;
  companyName?: string;
  pickupPoint?: string;
}

interface OnCallInvoice {
  onCallBillId: string;
  onCallInvoiceCode?: string;
  companyId?: string;
  companyName?: string;
  tripSheetNumbers?: string;
  bookedBy?: string;
  totalAmount?: number;
  totalDue?: number;
  cgst?: number;
  sgst?: number;
  createdAt?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const formatToCustom = (dateString: string) => {
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

const cur = (v?: number) =>
  v !== undefined
    ? `₹${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "-";

/* ─── localStorage key ──────────────────────────────────────────────────────── */
const HIDDEN_ADD_MORE_KEY = "oncall_hidden_add_more_ids";

const getHiddenIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(HIDDEN_ADD_MORE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const saveHiddenIds = (ids: Set<string>) => {
  try {
localStorage.setItem(HIDDEN_ADD_MORE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const PaymentPendingList: React.FC = () => {
  const location = useLocation();
  const { userId } = location.state || {};

  const [searchValue, setSearchValue] = useState("");
  const [orders, setOrders] = useState<ApiItem[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    bookingId: string;
    bookingCode: string;
  } | null>(null);
  const [viewType, setViewType] = useState<"regular" | "monthly" | "oncall">("regular");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  /* ── OnCall State ── */
  const [onCallInvoices, setOnCallInvoices] = useState<OnCallInvoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 10;
  const [onCallLoading, setOnCallLoading] = useState(false);
const [downloadingOnCallId, setDownloadingOnCallId] = useState<string | null>(null);
  /*
    hiddenAddMoreIds: persisted Set of onCallBillIds where "Add More" button
    should be HIDDEN. Loaded from localStorage on mount, saved on every change.

    Logic:
    - By default (id NOT in set) → Add More button is VISIBLE
    - When user clicks ✕ (close/hide) → id added to set → Add More HIDDEN
    - When user clicks + (open/show) while id is in set → id removed from set → Add More VISIBLE again
  */
  const [hiddenAddMoreIds, setHiddenAddMoreIds] = useState<Set<string>>(getHiddenIds);

  const navigate = useNavigate();


  /* ─── Add these to your existing state declarations ─────────────────────── */
const [showEditModal, setShowEditModal] = useState(false);
const [editingInvoice, setEditingInvoice] = useState<OnCallInvoice | null>(null);
const [editCreatedAt, setEditCreatedAt] = useState("");
const [editLoading, setEditLoading] = useState(false);

/* ─── Add this handler ───────────────────────────────────────────────────── */
const handleEditCreatedAt = (inv: OnCallInvoice) => {
  setEditingInvoice(inv);
  // Convert stored date to datetime-local input format (YYYY-MM-DDTHH:mm)
  const d = inv.createdAt ? new Date(inv.createdAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  setEditCreatedAt(formatted);
  setShowEditModal(true);
};

const handleConfirmEditCreatedAt = async () => {
  if (!editingInvoice || !editCreatedAt) return;
  setEditLoading(true);
  try {
    const res = await axiosInstance.put(
      `/oncallinvoice/update-oncall-invoice/${editingInvoice.onCallBillId}`,
(() => {
  const [y, m, d] = editCreatedAt.split("-").map(Number);
  // Local date as-is, no UTC conversion
  const localISO = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00+05:30`;
  return { createdAt: localISO };
})()    );
    if (res.data?.success) {
      showToast("Invoice date updated successfully", "success");
      // Update local state
      setOnCallInvoices((prev) =>
        prev.map((inv) =>
          inv.onCallBillId === editingInvoice.onCallBillId
            ? { ...inv, createdAt: new Date(editCreatedAt).toISOString() }
            : inv
        )
      );
      setShowEditModal(false);
      setEditingInvoice(null);
    } else {
      showToast(res.data?.message || "Failed to update date", "error");
    }
  } catch (err: any) {
    showToast(err?.response?.data?.message || "Failed to update invoice date", "error");
  } finally {
    setEditLoading(false);
  }
};
  /* Persist hiddenAddMoreIds to localStorage whenever it changes */
  useEffect(() => {
    saveHiddenIds(hiddenAddMoreIds);
  }, [hiddenAddMoreIds]);
/* ── Download (OnCall) ── */
const handleOnCallDownload = async (inv: OnCallInvoice) => {
  if (!inv.onCallBillId) {
    showToast("Invoice ID missing", "error");
    return;
  }
  const newTab = window.open("", "_blank");
  try {
    setDownloadingOnCallId(inv.onCallBillId);
    const res = await axiosInstance.post("/oncallinvoice/generatePdf", {
      onCallBillId: inv.onCallBillId,
    });
    if (!res.data?.success) {
      showToast("Failed to generate PDF", "error");
      newTab?.close();
      return;
    }
    const url = res.data?.pdf || res.data?.downloadUrl || res.data?.data?.downloadUrl;
    if (url) {
      if (newTab) {
        newTab.location.href = url;
      } else {
        window.open(url, "_blank");
      }
    } else {
      newTab?.close();
      showToast("Download URL not found in response", "error");
    }
  } catch (err: any) {
    newTab?.close();
    showToast(err?.response?.data?.message || "Failed to download invoice", "error");
  } finally {
    setDownloadingOnCallId(null);
  }
};
  const fetchOrders = async (searchOverride?: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/emp/paymentPendingOrderCount");
      const data = res.data?.data || [];

      let formatted: ApiItem[] = data.map((item: any) => {
        const booking = item.booking || {};
        const closePending = item.closePending || {};
        return {
          bookingId: booking.bookingId,
          bookingCode: booking.bookingCode,
          invoiceId: item.invoiceId,
          invoiceNumber: item.invoiceNumber ? String(item.invoiceNumber) : "-",
          invoiceAmount: item.invoiceAmount ?? 0,
          pickupPoint: booking.pickupPoint || "-",
          pickupDate: formatToCustom(closePending.pickupDate || booking.bookingDate),
          orderDate: formatToCustom(item.createdAt),
          userName: booking.user?.username || "-",
          companyName: booking.user?.company?.companyName || "-",
          userId: booking.userId,
          createdAt: item.createdAt,
          bookingDate: booking.bookingDate,
        };
      });

      if (userId) formatted = formatted.filter((o) => o.userId === userId);

      const activeSearch = searchOverride !== undefined ? searchOverride : searchValue;
      if (activeSearch.trim()) {
        const s = activeSearch.toLowerCase();
        formatted = formatted.filter(
          (o) =>
            (o.bookingCode || "").toLowerCase().includes(s) ||
            (o.invoiceNumber || "").toLowerCase().includes(s) ||
            (o.userName || "").toLowerCase().includes(s) ||
            (o.companyName || "").toLowerCase().includes(s)
        );
      }

      setOrders(formatted);
    } catch {
      showToast("Failed to load payment pending orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyOrders = async (searchOverride?: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(  "/closePendingOrder/monthlyInvoice/getAll?page=1&limit=200"
);
      let data = res.data?.data || [];

//     let formatted: MonthlyApiItem[] = data.map((item: any) => ({
//   monthlyInvoiceId: item.monthlyInvoiceId,
//   invoiceId: item.invoice?.invoiceId ?? "",

//   invoiceNumber: item.invoiceNumber
//     ? String(item.invoiceNumber)
//     : "-",

//   orderDate: formatToCustom(item.invoiceDate),
//   companyName: item.companyName || "-",
//   pickupPoint: "Monthly Booking",
// }));
const formatted: MonthlyApiItem[] = data.map((item: any) => ({
  monthlyInvoiceId: item.monthlyInvoiceId,
  invoiceId: item.invoice?.invoiceId ?? "",

  invoiceNumber: item.invoiceNumber
    ? String(item.invoiceNumber)
    : "-",

  monthlyBookingCode: item.monthlyBookingCode,


  orderDate: formatToCustom(item.invoiceDate),
  companyName: item.companyName || "-",
  pickupPoint: "Monthly Booking",
}));
      const activeSearch = searchOverride !== undefined ? searchOverride : searchValue;
      if (activeSearch.trim()) {
        const s = activeSearch.toLowerCase();
        const filtered = formatted.filter(
          (m) =>
            (m.invoiceNumber || "").toLowerCase().includes(s) ||
            (m.companyName || "").toLowerCase().includes(s) ||
            (m.monthlyBookingCode || "").toLowerCase().includes(s)
        );
        setMonthlyOrders(filtered);
      } else {
        setMonthlyOrders(formatted);
      }
    } catch {
      showToast("Failed to load monthly invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOnCallInvoices = async (searchOverride?: string) => {
    setCurrentPage(1);
    setOnCallLoading(true);
    try {
      const res = await axiosInstance.get("/oncallinvoice/getAll");
      let data: OnCallInvoice[] = (res.data?.data || []).map((inv: any) => {
        const items: any[] = inv.invoiceItems || [];
        
        // invoiceItems இருந்தா totalDue sum பண்ணு
        const computedTotalDue = items.length > 0
          ? items.reduce((s: number, i: any) => s + Number(i.totalDue || 0), 0)
          : undefined;
        return {
          ...inv,
          totalDue: Number(inv.totalAmount || 0), // Use rounded invoice total
        };
      });

      const activeSearch = searchOverride !== undefined ? searchOverride : searchValue;
      if (activeSearch.trim()) {
        const s = activeSearch.toLowerCase();
        data = data.filter(
          (inv) =>
            (inv.companyName || "").toLowerCase().includes(s) ||
            (inv.onCallInvoiceCode || "").toLowerCase().includes(s) ||
            (inv.onCallBillId || "").toLowerCase().includes(s) ||
            (inv.bookedBy || "").toLowerCase().includes(s)
        );
      }

      setOnCallInvoices(data);
    } catch {
      showToast("Failed to load On Call invoices", "error");
    } finally {
      setOnCallLoading(false);
    }
  };

  useEffect(() => {
    if (viewType === "regular") fetchOrders();
    else if (viewType === "monthly") fetchMonthlyOrders();
    else fetchOnCallInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType]);

  const handleSearch = async (query: string) => {
    setSearchValue(query);
    if (viewType === "regular") fetchOrders(query);
    else if (viewType === "monthly") fetchMonthlyOrders(query);
    else fetchOnCallInvoices(query);
  };

  /* ── Regular Nav ── */
  const handleView = (order: ApiItem) => {
    navigate(`/orders/view/payment-pending-order/${order.bookingId}`, {
      state: {
        userId: order.userId,
        invoiceNumber: order.invoiceNumber,
        invoiceId: order.invoiceId,
        invoiceAmount: order.invoiceAmount,
      },
    });
  };

  /* ── Monthly Nav ── */
  const handleMonthlyView = (row: MonthlyApiItem) => {
    navigate(`/orders/view/payment-pending-order/${row.monthlyInvoiceId}?type=monthly`, {
      state: {
        monthlyInvoiceId: row.monthlyInvoiceId,
        invoiceId: row.invoiceId,
      monthlyBookingCode: row.monthlyBookingCode,
        companyName: row.companyName,
      },
    });
  };

  const handleMonthlyEdit = (row: MonthlyApiItem) => {
    navigate("/booking/monthlybooking", {
      state: { mode: "edit", monthlyInvoiceId: row.monthlyInvoiceId },
    });
  };

  /* ── OnCall: View → navigate to separate view page ── */
  const handleOnCallView = (inv: OnCallInvoice) => {
    navigate(`/orders/oncall-invoice/${inv.onCallBillId}`);
  };

  /* ── OnCall: Add More → direct navigate to Oncallinvoice form ── */
  const handleAddMore = (inv: OnCallInvoice) => {
    navigate("/booking/oncallinvoice", {
      state: {
        mode: "addMore",
        onCallBillId: inv.onCallBillId,
        companyId: inv.companyId,
        companyName: inv.companyName,
      },
    });
  };

  /*
    Toggle logic:
    - If id is currently hidden (in set) → remove from set → Add More becomes VISIBLE
    - If id is currently visible (not in set) → add to set → Add More becomes HIDDEN
  */
  const toggleAddMoreVisibility = (id: string) => {
    setHiddenAddMoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id); // show Add More again
      } else {
        next.add(id); // hide Add More
      }
      return next;
    });
  };

  /* ── Download (Regular) ── */
  const handleInvoiceDownload = async (row: ApiItem) => {
    if (!row.bookingId) {
      showToast("Invoice not generated", "error");
      return;
    }
    const newTab = window.open("", "_blank");
    try {
      setDownloadingId(row.bookingId);
      const res = await axiosInstance.post("/downloadPdf/generate-invoice-pdf", {
        bookingId: row.bookingId,
      });
      if (!res.data?.success) {
        showToast("Failed to generate invoice", "error");
        newTab?.close();
        return;
      }
      if (newTab) {
        newTab.location.href = res.data.data.downloadUrl;
      } else {
        window.open(res.data.data.downloadUrl, "_blank");
      }
    } catch (err: any) {
      newTab?.close();
      showToast(err?.response?.data?.message || "Failed to download invoice", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── Download (Monthly) ── */
  const handleMonthlyInvoiceDownload = async (row: MonthlyApiItem) => {
    if (!row.monthlyInvoiceId) {
      showToast("Monthly invoice id missing", "error");
      return;
    }
    const newTab = window.open("", "_blank");
    try {
      const res = await axiosInstance.post("/downloadPdf/month-generate-invoice-pdf", {
        monthlyInvoiceId: row.monthlyInvoiceId,
      });
      if (!res.data?.success) {
        showToast("Failed to generate monthly invoice", "error");
        newTab?.close();
        return;
      }
      if (newTab) {
        newTab.location.href = res.data.data.downloadUrl;
      } else {
        window.open(res.data.data.downloadUrl, "_blank");
      }
    } catch (err: any) {
      newTab?.close();
      showToast(err?.response?.data?.message || "Failed to download monthly invoice", "error");
    }
  };

  /* ── Cancel ── */
  const handleCancel = (order: ApiItem) => {
    setSelectedOrder({ bookingId: order.bookingId, bookingCode: order.bookingCode });
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    setCancelLoading(true);
    try {
      await axiosInstance.put("/order/cancelBooking", {
        bookingId: selectedOrder.bookingId,
        remarks: "Cancelled by employee",
      });
      setOrders((prev) => prev.filter((o) => o.bookingId !== selectedOrder.bookingId));
      showToast(`Order #${selectedOrder.bookingCode} cancelled successfully`, "success");
    } catch {
      showToast("Failed to cancel order. Please try again.", "error");
    } finally {
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelLoading(false);
    }
  };

  /* ─── Columns ─────────────────────────────────────────────────────────────── */
  const regularColumns: Column<ApiItem>[] = [
    { header: "Order Number", accessor: "bookingCode" },
    { header: "Invoice Number", accessor: "invoiceNumber" },
    { header: "Order Date", accessor: "orderDate" },
    { header: "Pickup Date", accessor: "pickupDate" },
    { header: "Travel Package", accessor: "pickupPoint" },
    { header: "User Name", accessor: "userName" },
    { header: "Company Name", accessor: "companyName" },
  ];

  const monthlyColumns: Column<MonthlyApiItem>[] = [
    { header: "Invoice Number", accessor: "invoiceNumber" },
    { header: "Invoice Date", accessor: "orderDate" },
    { header: "Travel Package", accessor: "pickupPoint" },
    { header: "Company Name", accessor: "companyName" },
    {
      header: "Actions",
      accessor: "monthlyInvoiceId",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Edit"
            onClick={() => handleMonthlyEdit(row)}
            className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-slate-50"
          >
            ✏️
          </button>
          <button
            type="button"
            title="Download Invoice"
            onClick={() => handleMonthlyInvoiceDownload(row)}
            className="h-9 px-3 rounded-lg border flex items-center gap-1 hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
            <span className="text-sm">Download</span>
          </button>
        </div>
      ),
    },
  ];
const indexOfLastRow = currentPage * rowsPerPage;
const indexOfFirstRow = indexOfLastRow - rowsPerPage;

const paginatedInvoices = onCallInvoices.slice(
  indexOfFirstRow,
  indexOfLastRow
);

const totalPages = Math.ceil(
  onCallInvoices.length / rowsPerPage
);
const renderOnCallTable = () => {
  if (onCallLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#275981] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading On Call Invoices...</p>
        </div>
      </div>
    );
  }

  if (onCallInvoices.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">No On Call invoices found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              {["#", "Company", "Total Amount", "OnCallInvoice Code", "Created", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.map((inv, idx) => {
              const isHidden = hiddenAddMoreIds.has(inv.onCallBillId);

              return (
                <tr key={inv.onCallBillId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-500">{indexOfFirstRow + idx + 1}</td>

                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {inv.companyName || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {inv.totalDue !== undefined && inv.totalDue !== inv.totalAmount && (
                        <span className="text-xs text-slate-400 line-through">
                          {cur(inv.totalAmount)}
                        </span>
                      )}
                      <span className="text-sm font-bold text-emerald-700">
                        {inv.totalDue !== undefined ? cur(inv.totalDue) : cur(inv.totalAmount)}
                      </span>
                      {inv.totalDue !== undefined && inv.totalDue !== inv.totalAmount && (
                        <span className="text-[10px] text-blue-500 font-medium">Due after advance</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {inv.onCallInvoiceCode ? (
                      <span className="text-xs font-mono bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-full">
                        {inv.onCallInvoiceCode}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>

                  {/* Created At — with inline edit button */}
               {/* Created At */}
{/* Created At */}
<td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
  <div className="flex items-center gap-2">
<span>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-GB") : "-"}</span>
    <button
      type="button"
      title="Edit Invoice Date"
      onClick={() => handleEditCreatedAt(inv)}
      className="h-6 w-6 rounded border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-all"
    >
      <FontAwesomeIcon icon={faPen} className="text-[10px]" />
    </button>
  </div>
</td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">

{/* Edit Invoice */}
<button
  type="button"
  title="Edit Invoice"
  onClick={() => navigate(`/booking/oncallinvoice/edit/${inv.onCallBillId}`)}
  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-violet-700 transition-all"
>
  <FontAwesomeIcon icon={faPen} className="text-xs" />
  Edit
</button>

                      {/* View */}
                      <button
                        type="button"
                        title="View Details"
                        onClick={() => handleOnCallView(inv)}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 transition-all"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                        View
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        title="Download Invoice PDF"
                        onClick={() => handleOnCallDownload(inv)}
                        disabled={downloadingOnCallId === inv.onCallBillId}
                        className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all ${
                          downloadingOnCallId === inv.onCallBillId
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-700"
                        }`}
                      >
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-xs" />
                        {downloadingOnCallId === inv.onCallBillId ? "..." : "Download"}
                      </button>

                      {/* Add More */}
                      {!isHidden && (
                        <button
                          type="button"
                          title="Add More Trip Sheets"
                          onClick={() => handleAddMore(inv)}
                          className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 transition-all"
                        >
                          <FontAwesomeIcon icon={faPlusCircle} className="text-xs" />
                          Add More
                        </button>
                      )}

                      {/* Toggle Add More visibility */}
                      <button
                        type="button"
                        title={isHidden ? "Show Add More" : "Hide Add More"}
                        onClick={() => toggleAddMoreVisibility(inv.onCallBillId)}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center text-xs transition-all ${
                          isHidden
                            ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "border-red-200 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={isHidden ? faPlusCircle : faTimes} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
  <div className="text-sm text-gray-500">
    Showing {indexOfFirstRow + 1} to{" "}
    {Math.min(indexOfLastRow, onCallInvoices.length)} of{" "}
    {onCallInvoices.length} entries
  </div>

  <div className="flex items-center gap-1">
    <button
      onClick={() => setCurrentPage((p) => p - 1)}
      disabled={currentPage === 1}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Previous
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 border rounded ${
          currentPage === i + 1
            ? "bg-[#275981] text-white"
            : "bg-white text-gray-700"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => setCurrentPage((p) => p + 1)}
      disabled={currentPage === totalPages}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
      </div>

      {/* ── Edit CreatedAt Modal ── */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Edit Invoice Date</h2>
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingInvoice(null); }}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>

            {/* Invoice info */}
            <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4 border border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Company</p>
              <p className="text-sm font-medium text-slate-800">{editingInvoice.companyName || "-"}</p>
              {editingInvoice.onCallInvoiceCode && (
                <>
                  <p className="text-xs text-slate-500 mt-2 mb-0.5">Invoice Code</p>
                  <span className="text-xs font-mono bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                    {editingInvoice.onCallInvoiceCode}
                  </span>
                </>
              )}
            </div>

            {/* Date input */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Invoice Date &amp; Time
              </label>
              <input
                type="date"
                value={editCreatedAt}
                onChange={(e) => setEditCreatedAt(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#275981] focus:border-transparent transition"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleConfirmEditCreatedAt}
                disabled={editLoading || !editCreatedAt}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all ${
                  editLoading || !editCreatedAt
                    ? "bg-[#275981]/50 cursor-not-allowed"
                    : "bg-[#275981] hover:bg-[#1e4a6e]"
                }`}
              >
                {editLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingInvoice(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <PageLayout>
      <AlertContainer />

      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          List Payment Pending Orders
        </h1>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={() => handleSearch(searchValue)}
              placeholder="Search by User, Company, Order No, Invoice No"
            />
          </div>

          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => setViewType("regular")}
              className={`px-4 py-2 rounded font-semibold ${
                viewType === "regular"
                  ? "bg-[#275981] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => setViewType("monthly")}
              className={`px-4 py-2 rounded font-semibold ${
                viewType === "monthly"
                  ? "bg-[#275981] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType("oncall")}
              className={`px-4 py-2 rounded font-semibold ${
                viewType === "oncall"
                  ? "bg-[#275981] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              On Call
            </button>
          </div>
        </div>

        {viewType === "regular" && (
          <DataTable<ApiItem>
            key={searchValue + orders.length}
            columns={regularColumns}
            data={orders}
            onView={handleView}
            onCancel={handleCancel}
            onInvoice={handleInvoiceDownload}
            invoiceLabel={(row: ApiItem) =>
              downloadingId === row.invoiceId ? "Downloading..." : "Download"
            }
            invoiceIcon={<FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-1" />}
            loading={loading}
            rowsPerPage={10}
          />
        )}

        {viewType === "monthly" && (
          <DataTable<MonthlyApiItem>
            key={searchValue + monthlyOrders.length}
            columns={monthlyColumns}
            data={monthlyOrders}
            onView={handleMonthlyView}
            loading={loading}
            rowsPerPage={10}
          />
        )}

        {viewType === "oncall" && renderOnCallTable()}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4">Cancel Confirmation</h2>
            <p className="mb-6">
              Do you want to cancel this order{" "}
              <span className="font-bold">#{selectedOrder?.bookingCode}</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className={`text-white px-6 py-2 rounded ${
                  cancelLoading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded"
                onClick={() => setShowCancelModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default PaymentPendingList;