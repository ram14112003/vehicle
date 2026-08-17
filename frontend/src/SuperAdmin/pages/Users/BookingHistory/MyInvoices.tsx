import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Settings, Calendar } from "lucide-react";
import TravelHeader from "../header";
import axiosInstance from "../../../../utils/axiosInstance";
import { DataTable, Column } from "../../../../components/DataTable"; // ✅ adjust import path

// ---------- Row Type ----------
type InvoiceRow = {
  bookingId: string;
  orderNo: string; // bookingCode
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  pickupDate: string;
  pickupType: string;
  amount: number;
  downloadUrl?: string;
};

// ---------- API Types ----------
type ApiResponse = {
  success: boolean;
  data: any[];
};

// ---------- Helpers ----------
const toDate = (s: string) => new Date(s);
const formatDate = (iso: string) =>
  toDate(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const formatDateTime = (iso: string) =>
  toDate(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// ---------- Component ----------
const MyInvoices: React.FC = () => {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || localStorage.getItem("userId") || "";
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({ from, to });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiRows, setApiRows] = useState<InvoiceRow[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleSearch = () => setApplied({ from, to });

  // ---------- Fetch Data ----------
  const fetchInvoices = useCallback(async () => {
    if (!userId) {
      setError("User not found");
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get(`order/user/${userId}/payment-completed`);
      const payload: ApiResponse = res.data;

      if (!payload?.success) {
        setApiRows([]);
        setError("Failed to load invoices.");
        return;
      }

      const rows: InvoiceRow[] = [];
      for (const b of payload.data || []) {
        if (!b.invoice || b.invoice.length === 0) continue;

        for (const inv of b.invoice) {
          const pickupISO =
            inv.closePending?.pickupDate ??
            b.bookingDate ??
            inv.startDate ??
            inv.createdAt;

          const pickupType =
            b.pickupPoint ||
            inv.closePending?.selectedPackageData?.packageType ||
            b.preferredType ||
            "";

          rows.push({
            bookingId: b.bookingId,
            orderNo: b.bookingCode,
            invoiceId: inv.invoiceId,
            invoiceNo: inv.invoiceNumber,
            invoiceDate: inv.createdAt,
            pickupDate: pickupISO,
            pickupType,
            amount: Number(inv.invoiceAmount ?? 0),
          });
        }
      }

      setApiRows(rows);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setApiRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ---------- Filter Logic ----------
  const filteredRows = useMemo(() => {
    if (!applied.from || !applied.to) return apiRows;
    const f = new Date(applied.from);
    const t = new Date(applied.to);
    t.setHours(23, 59, 59, 999);
    return apiRows.filter((r) => {
      const d = new Date(r.invoiceDate);
      return d >= f && d <= t;
    });
  }, [apiRows, applied]);

  // ---------- Handlers ----------
  const handleDownload = async (r: InvoiceRow) => {
    try {
      setDownloadingId(r.invoiceId);
      const url = `/order/user/invoices/${r.bookingId}/${r.invoiceId}/pdf`;
      const res = await axiosInstance.get(url, { responseType: "blob" });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Invoice-${r.invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      alert(e?.message || "Failed to download invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewOrder = (r: InvoiceRow) => {
    navigate(`/orders/${r.orderNo}`);
  };

  // ---------- DataTable Columns ----------
  const columns: Column<InvoiceRow>[] = [
    {
      header: "Order Details",
      accessor: "orderNo",
      render: (r) => (
        <button
          // onClick={() => handleViewOrder(r)}
          className="text-red-600 font-semibold"
        >
          {r.orderNo}
        </button>
      ),
    },
    { header: "Invoice Number #", accessor: "invoiceNo" },
    {
      header: "Invoice Date",
      accessor: "invoiceDate",
      render: (r) => formatDate(r.invoiceDate),
    },
    {
      header: "Pickup Date",
      accessor: "pickupDate",
      render: (r) => formatDateTime(r.pickupDate),
    },
    { header: "Pickup Type", accessor: "pickupType" },
    {
      header: "Invoice Amount (Rs.)",
      accessor: "amount",
      render: (r) => r.amount.toFixed(2),
    },
  ];

  return (
    <>
      <TravelHeader />
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-700 mb-4">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="font-medium">My Invoices</span>
        </nav>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-gray-700">From</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 focus:outline-none"
            />
          </div>
          <span className="text-gray-700">To</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </button>
          {error && <span className="text-red-600 text-sm ml-2">{error}</span>}
        </div>

        {/* Table Container */}
        <div className="border border-gray-300 rounded-md shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#275981] text-white">
            <Settings className="h-4 w-4" />
            <span className="font-semibold">Invoice Details - Paid</span>
          </div>

          {/* ✅ Use DataTable Here */}
          <div className="p-4">
          <DataTable
  columns={columns}
  data={filteredRows}
  loading={loading}
  rowsPerPage={5}
  emptyMessage="Invoice details not found."
  onInvoice={(r) => handleDownload(r)}
  invoiceLabel={(r) =>
    downloadingId === r.invoiceId ? "Generating..." : "Download"
  }
/>

          </div>
        </div>
      </div>
    </>
  );
};

export default MyInvoices;
