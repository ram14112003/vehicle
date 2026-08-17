import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreditCard } from "lucide-react";
import TravelHeader from "../header";
import axiosInstance from "../../../../utils/axiosInstance";
import { DataTable, Column } from "../../../../components/DataTable"; // ✅ adjust the import path if needed

/* ---------- API Types ---------- */
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
  bookingCode: string;
  invoice: ApiInvoice[];
};

/* ---------- UI Row Type ---------- */
type PaymentRow = {
  bookingId: string;
  paymentNo: string;
  mode: string;
  paymentDate: string;
  amountPaid: number;
};

/* ---------- Helpers ---------- */
const isPaid = (status?: string | null) => status === "4" || status === "9";

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

const normMode = (m?: string | null, online?: boolean | null) => {
  if (m && m.trim()) return m.toUpperCase();
  if (online === true) return "ONLINE";
  if (online === false) return "OFFLINE";
  return "N/A";
};

/* Map API -> UI (flatten invoices with paid payments) */
const mapToPaymentRows = (bookings: ApiBooking[]): PaymentRow[] => {
  const rows: PaymentRow[] = [];
  for (const b of bookings) {
    for (const inv of b.invoice || []) {
      const p = inv.payment;
      if (!p || !isPaid(p.status)) continue; // only completed payments

      const paymentNo =
        (p.transactionId && p.transactionId.trim()) ||
        p.paymentId ||
        inv.invoiceNumber;

      const amountPaid =
        toNum(p.amount) ||
        toNum(inv.closePending?.totalAmount) ||
        inv.invoiceAmount;

      rows.push({
        bookingId: b.bookingId,
        paymentNo,
        mode: normMode(p.paymentMode, p.isOnline),
        paymentDate: fmtDateTime(p.createdAt || inv.createdAt),
        amountPaid,
      });
    }
  }

  // Latest first
  rows.sort((a, b) => {
    const da = new Date(a.paymentDate).getTime();
    const db = new Date(b.paymentDate).getTime();
    return isNaN(db) || isNaN(da) ? 0 : db - da;
  });
  return rows;
};

/* ---------- Component ---------- */
const MypaymentHistory: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ userId: string }>();

  const userId =
    params.userId || localStorage.getItem("userId") || "";

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Fetch API */
  useEffect(() => {
    const fetchPayments = async () => {
      if (!userId) {
        setError("User not found");
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const res = await axiosInstance.get(`/order/user/${userId}/payment-completed`);
        const bookings: ApiBooking[] = res?.data?.data ?? [];
        setRows(mapToPaymentRows(bookings));
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [userId]);

  /* Handle view navigation */
  const handleView = (row: PaymentRow) => {
    navigate(`/users/view/completed-lists/${row.bookingId}`);
  };

  /* ---------- DataTable Columns ---------- */
  const columns: Column<PaymentRow>[] = [
    {
      header: "Payment No. #",
      accessor: "paymentNo",
    },
    {
      header: "Payment Mode",
      accessor: "mode",
    },
    {
      header: "Payment Date",
      accessor: "paymentDate",
    },
    {
      header: "Amount Paid (Rs.)",
      accessor: "amountPaid",
      render: (row) => row.amountPaid.toFixed(2),
    },
  ];

  return (
    <>
      <TravelHeader />

      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-700 mb-4">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <span className="font-medium">List Payment</span>
        </nav>

        {/* Panel */}
        <div className="border border-gray-300 rounded-md shadow-sm">
          {/* Panel Title */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-t-md bg-[#275981] text-white">
            <CreditCard className="h-4 w-4" />
            <span className="font-semibold">Payment Details</span>
          </div>

          {/* ✅ DataTable Integration */}
          <div className="p-4">
            <DataTable
              columns={columns}
              data={rows}
              loading={loading}
              onView={handleView}
              rowsPerPage={5}
              emptyMessage={error || "Payment details not found."}
              viewIcon={null}
              viewLabel="View"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MypaymentHistory;
