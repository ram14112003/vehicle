import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import TravelHeader from "../header";
import axiosInstance from "../../../../utils/axiosInstance";
import { DataTable, Column } from "../../../../components/DataTable";

/* ---------- API types ---------- */
type ApiPayment = {
  paymentId: string;
  paymentMode: string | null;
  isOnline: boolean | null;
  isActive: boolean | null;
  transactionId: string | null;
  status: string | null;
  amount: string | null;
  tax: string | null;
  createdAt: string;
};

type ApiClosePending = {
  pickupDate: string | null;
  totalAmount?: string | null;
};

type ApiInvoice = {
  invoiceId: string;
  invoiceNumber: string;
  startDate: string;
  endDate: string;
  invoiceAmount: number;
  createdAt: string;
  payment?: ApiPayment | null;
  closePending?: ApiClosePending | null;
};

type ApiBooking = {
  bookingId: string;
  createdAt: string;
  bookingDate: string;
  bookingCode: string; // order #
  pickupPoint: string; // pickup type
  invoice: ApiInvoice[];
  confirmStatus: string;
};

/* ---------- UI row ---------- */
type Row = {
  bookingId: string;
  orderNo: string;
  invoiceNo: string;
  invoiceId?: string;
  invoiceDate: string;
  pickupDate: string;
  pickupType: string;
  amount: number;
};

/* ---------- helpers ---------- */
const toNum = (v?: string | number | null) => {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const mapToRows = (bookings: ApiBooking[]): Row[] => {
  const out: Row[] = [];
  for (const b of bookings) {
    if (b.invoice && b.invoice.length) {
      for (const inv of b.invoice) {
      const amount = Number(inv.invoiceAmount ?? 0);

        out.push({
          bookingId: b.bookingId,
          orderNo: b.bookingCode,
          invoiceNo: inv.invoiceNumber || "—",
          invoiceId: inv.invoiceId,
          invoiceDate: fmtDateTime(inv.createdAt || inv.startDate),
          pickupDate: fmtDateTime(
            inv.closePending?.pickupDate || b.bookingDate || b.createdAt
          ),
          pickupType: b.pickupPoint || "-",
          amount: Number(inv.invoiceAmount ?? 0),
        });
      }
    } else {
      out.push({
        bookingId: b.bookingId,
        orderNo: b.bookingCode,
        invoiceNo: "—",
        invoiceId: undefined,
        invoiceDate: fmtDateTime(b.createdAt),
        pickupDate: fmtDateTime(b.bookingDate || b.createdAt),
        pickupType: b.pickupPoint || "-",
        amount: 0,
      });
    }
  }
  out.sort(
    (a, b) =>
      new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
  );
  return out;
};

const formatAmount = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getFilenameFromDisposition = (cd?: string | null) => {
  if (!cd) return null;
  const m = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  return m ? decodeURIComponent(m[1].replace(/\"/g, "")) : null;
};

/* ---------- Component ---------- */
const MyPendingInvoices: React.FC = () => {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || localStorage.getItem("userId") || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const fetchPending = async () => {
      if (!userId) {
        setError("User not found");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(`/order/user/${userId}/pending-invoices`);
        const data: ApiBooking[] = res?.data?.data ?? [];
        setRows(mapToRows(data));
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load pending invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [userId]);

  /* ---------- Filtering ---------- */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.orderNo.toLowerCase().includes(term) ||
        r.invoiceNo.toLowerCase().includes(term)
    );
  }, [rows, q]);

  /* ---------- Download ---------- */
  // const handleDownload = async (row: Row) => {
  //   if (!row.invoiceId) {
  //     alert("Invoice not generated");
  //     return;
  //   }
  //   try {
  //     setDownloadingId(row.invoiceId);
  //     const url = `/order/user/invoices/${row.bookingId}/${row.invoiceId}/pdf`;
  //     const res = await axiosInstance.get(url, { responseType: "blob" });
  //     const cd =
  //       (res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"])) || null;
  //     const filename =
  //       getFilenameFromDisposition(cd) || `Invoice-${row.invoiceNo || row.orderNo}.pdf`;

  //     const blob = new Blob([res.data], { type: "application/pdf" });
  //     const href = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = href;
  //     a.download = filename;
  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //     URL.revokeObjectURL(href);
  //   } catch (e: any) {
  //     alert(e?.message || "Failed to download invoice.");
  //   } finally {
  //     setDownloadingId(null);
  //   }
  // };

const handleDownload = async (row: Row) => {
  const newTab = window.open("", "_blank");
  try {
    setDownloadingId(row.bookingId);

    const res = await axiosInstance.post(
      "/downloadPdf/generate-invoice-pdf",
      { bookingId: row.bookingId }
    );

    const downloadUrl = res?.data?.data?.downloadUrl;

    if (!downloadUrl) {
      throw new Error("Download URL not received");
    }

    if (newTab) {
      newTab.location.href = downloadUrl;
    } else {
      window.open(downloadUrl, "_blank");
    }

  } catch (e: any) {
    newTab?.close();
    alert(e?.response?.data?.message || "Failed to download invoice");
  } finally {
    setDownloadingId(null);
  }
};


  /* ---------- Columns ---------- */
  const columns: Column<Row>[] = [
    { header: "Order Number #", accessor: "orderNo" },
    { header: "Invoice Number #", accessor: "invoiceNo" },
    { header: "Invoice Date", accessor: "invoiceDate" },
    { header: "Pickup Date", accessor: "pickupDate" },
    { header: "Pickup Type", accessor: "pickupType" },
    {
      header: "Invoice Amount (Rs.)",
      accessor: "amount",
      render: (r) => (
        <span className="font-medium text-right block">
          {formatAmount(r.amount)}
        </span>
      ),
    },
  ];

  const handleSearch = () => setQ(qInput.trim());
  const handleClear = () => {
    setQInput("");
    setQ("");
  };

  return (
    <>
      <TravelHeader />

      <div className="min-h-screen bg-white px-10 py-8 text-gray-800">
        {/* Breadcrumb */}
        <div className="text-[15px] text-gray-600 mb-6">
          <Link to="/" className="font-semibold text-gray-800 hover:underline">
            Home
          </Link>
          <span className="mx-2 text-gray-500">›</span>
          <span className="font-semibold text-gray-800">Pending Invoices</span>
        </div>

        <div className="border border-gray-300 rounded-sm shadow-sm">
          {/* Header */}
          <div className="bg-[#275981] text-white px-4 py-3 text-lg font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
            <span>Invoice Details</span>
          </div>

          {/* Search Bar */}
          <div className="bg-gray-100 flex items-center p-3 border-b border-gray-300 gap-2">
            <input
              type="text"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Keywords (Order Number, Invoice Number)"
              className="w-72 md:w-96 h-9 border border-gray-300 rounded-sm px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={handleSearch}
              className="h-9 px-4 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-sm"
            >
              Search
            </button>
            {q && (
              <button
                onClick={handleClear}
                className="h-9 px-3 text-sm border border-gray-300 rounded-sm hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>

          {/* ✅ DataTable Integration */}
          <div className="p-4">
            <DataTable<Row>
              columns={columns}
              data={filtered}
              loading={loading}
              onInvoice={handleDownload}
              invoiceLabel="Download"
              invoiceIcon={
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-1" />
              }
              rowsPerPage={5}
              emptyMessage={error || "Pending invoices not found."}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MyPendingInvoices;
