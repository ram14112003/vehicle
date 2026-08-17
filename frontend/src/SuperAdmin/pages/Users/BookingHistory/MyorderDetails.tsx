import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Settings } from "lucide-react";
import axiosInstance from "../../../../utils/axiosInstance";
import TravelHeader from "../header";
import Footer from "../Footer";
import { DataTable, Column } from "../../../../components/DataTable"; // ✅ adjust import path

// ---------------- Types ----------------
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
  payment?: ApiPayment | null;
  closePending?: ApiClosePending | null;
  createdAt: string;
};

type ApiBooking = {
  bookingId: string;
  bookingDate: string;
  createdAt: string;
  bookingCode: string;
  pickupPoint: string;
  invoice: ApiInvoice[];
  confirmStatus: string;
  bookingStatus: string;
};

// ---------------- UI Type ----------------
type OrderRow = {
  bookingCode: string;
  bookingId: string;
  orderNo: string;
  createdAt: string;
  pickupDate: string;
  pickupType: string;
  totalAmount: number;
  statuses: string[];
};

// ---------------- Helpers ----------------
const fmtDateTime = (iso: string | null | undefined) => {
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

const toNumber = (v: string | number | null | undefined) => {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const statusFromConfirm = (code?: string | null) => {
  switch (code) {
    case "1":
      return "Confirmed";
    case "6":
      return "Cancelled";
    case "0":
      return "Pending";
    case "5":
      return "Closed";
    default:
      return "Status";
  }
};

const statusFromPayment = (code?: string | null) => {
  switch (code) {
    case "9":
      return "Paid";
    case "0":
      return "Not Paid";
    default:
      return "N/A";
  }
};

const badgeClasses = (label: string) => {
  const key = label.toLowerCase();
  if (key.includes("paid") && !key.includes("not"))
    return "bg-green-200 text-green-800";
  if (key.includes("not paid") || key.includes("pending"))
    return "bg-yellow-300 text-yellow-900";
  if (key.includes("confirm") || key.includes("close") || key.includes("open"))
    return "bg-blue-200 text-blue-800";
  if (key.includes("cancel")) return "bg-red-200 text-red-800";
  return "bg-gray-200 text-gray-800";
};

const mapToRows = (bookings: ApiBooking[]): OrderRow[] => {
  return bookings.map((b) => {
    const firstInv = b.invoice?.[0];
    const pickupDate =
      firstInv?.closePending?.pickupDate ?? b.bookingDate ?? b.createdAt;
  const amount = toNumber(firstInv?.invoiceAmount);


    const statuses: string[] = [];
    const pay = statusFromPayment(firstInv?.payment?.status);

    if (b.confirmStatus === "5") {
      statuses.push("Confirmed", "Closed");
    } else if (b.confirmStatus === "1") {
      statuses.push("Confirmed");
    } else {
      const conf = statusFromConfirm(b.confirmStatus);
      if (conf && conf !== "Status") statuses.push(conf);
    }
    if (pay && pay !== "N/A") statuses.push(pay);

    return {
      bookingCode: b.bookingCode,
      bookingId: b.bookingId,
      orderNo: b.bookingCode,
      createdAt: fmtDateTime(b.createdAt),
      pickupDate: fmtDateTime(pickupDate),
      pickupType: b.pickupPoint || "-",
      totalAmount: amount,
      statuses,
    };
  });
};

// ---------------- Component ----------------
const MyorderDetails: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ userId: string }>();

  const userId = params.userId || localStorage.getItem("userId") || "";

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) {
        setError("User not found");
        return;
      }
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/order/user/${userId}/all`);
        const apiData: ApiBooking[] = res?.data?.data ?? [];
        const mapped = mapToRows(apiData);
        setRows(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  const handleCopy = async (bookingId: string) => {
    try {
      const response = await axiosInstance.get(`/order/details/${bookingId}`);
      if (response.data) {
        const bookingData = response.data;
        const userId = bookingData?.booking?.user?.userId;
        const companyId = bookingData?.booking?.user?.companyId;
        const orderNumber = bookingId;
        navigate(`/users/userinvoice/${userId}?companyId=${companyId}`, {
          state: { copyFromBooking: true, bookingData, userId, companyId, orderNumber },
        });
      }
    } catch (error) {
      console.error("Error fetching booking details for copy:", error);
    }
  };

  const columns: Column<OrderRow>[] = useMemo(
    () => [
      {
        header: "Order Details",
        accessor: "orderNo",
        render: (row) => (
          <div>
            <div className="text-red-600 font-semibold">{row.orderNo}</div>
            <div className="text-gray-600 text-xs">{row.createdAt}</div>
          </div>
        ),
      },
      { header: "Pickup Date", accessor: "pickupDate" },
      { header: "Pickup Type", accessor: "pickupType" },
      {
        header: "Total Amount (Rs.)",
        accessor: "totalAmount",
        render: (r) => r.totalAmount.toFixed(2),
      },
      {
        header: "Status",
        accessor: "statuses",
        render: (r) => (
          <div className="flex flex-col gap-1">
            {r.statuses.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className={`inline-block text-xs font-semibold px-2 py-1 rounded ${badgeClasses(
                  s
                )}`}
              >
                {s}
              </span>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <TravelHeader />
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <nav className="text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <span className="font-medium text-gray-800">List Order</span>
        </nav>

        <div className="border border-gray-300 rounded-md shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#275981] text-white rounded-t-md">
            <Settings className="h-4 w-4" />
            <span className="font-semibold">Order Details</span>
          </div>

          <div className="p-4 bg-white">
            <DataTable<OrderRow>
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage={error || "No orders found."}
              rowsPerPage={5}
              onCopy={(row) => handleCopy(row.bookingCode)}
              copyLabel="Copy"
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyorderDetails;
