import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Trees } from "lucide-react";
import TravelHeader from "../header";
import axiosInstance from "../../../../utils/axiosInstance";
import { DataTable, Column } from "../../../../components/DataTable"; // 👈 adjust path as needed

// ---------- API types ----------
type ApiPayment = {
  paymentId: string;
  paymentMode: string | null;
  isOnline: boolean | null;
  isActive: boolean | null;
  transactionId: string | null;
  status: string | null; // "6" = cancelled
  amount: string | null;
  tax: string | null;
  createdAt: string;
};

type ApiClosePending = {
  pickupDate: string | null;
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
  bookingDate: string;
  createdAt: string;
  bookingCode: string; // order no
  pickupPoint: string; // pickup type
  invoice: ApiInvoice[];
  confirmStatus: string;
};

// ---------- UI type ----------
type CancelledOrder = {
  id: string;
  orderNo: string;
  pickupDate: string;
  pickupType: string;
  cancelledDate: string;
};

// ---------- helpers ----------
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

const pickCancelledDate = (b: ApiBooking) => {
  const inv = b.invoice?.[0];
  if (inv?.payment?.status === "6") return inv.payment.createdAt;
  return inv?.createdAt || b.createdAt;
};

const pickPickupDate = (b: ApiBooking) => {
  const inv = b.invoice?.[0];
  return inv?.closePending?.pickupDate || b.bookingDate || b.createdAt;
};

const mapToRows = (data: ApiBooking[]): CancelledOrder[] =>
  data.map((b, idx) => ({
    id: b.bookingId || String(idx),
    orderNo: b.bookingCode,
    pickupDate: fmtDateTime(pickPickupDate(b)),
    pickupType: b.pickupPoint || "-",
    cancelledDate: fmtDateTime(pickCancelledDate(b)),
  }));

// ---------- Component ----------
const MycancelorderDetails: React.FC = () => {
  const params = useParams<{ userId: string }>();
  const userId = params.userId || localStorage.getItem("userId") || "";

  const [rows, setRows] = useState<CancelledOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET /order/user/:userId/cancelled
  useEffect(() => {
    const fetchCancelled = async () => {
      if (!userId) {
        setError("User not found");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(`/order/user/${userId}/cancelled`);
        const apiData: ApiBooking[] = res?.data?.data ?? [];
        setRows(mapToRows(apiData));
      } catch (e: any) {
        setError(
          e?.response?.data?.message || "Failed to load cancelled orders"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCancelled();
  }, [userId]);

  // ---------- Columns ----------
  const columns: Column<CancelledOrder>[] = [
    {
      header: "Order No",
      accessor: "orderNo",
    },
    {
      header: "Pickup Date",
      accessor: "pickupDate",
    },
    {
      header: "Pickup Type",
      accessor: "pickupType",
    },
    {
      header: "Cancelled Date",
      accessor: "cancelledDate",
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
          <span className="font-medium">List Cancelled Order</span>
        </nav>

        {/* Panel */}
        <div className="border border-gray-300 rounded-md shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-t-md bg-[#275981] text-white">
            <Trees className="h-4 w-4" />
            <span className="font-semibold">Cancelled Order Details</span>
          </div>

          {/* DataTable */}
          <div className="p-4">
            <DataTable
              columns={columns}
              data={rows}
              loading={loading}
              rowsPerPage={5}
              emptyMessage={
                error
                  ? error
                  : rows.length === 0 && !loading
                  ? "Cancelled Order details not found."
                  : ""
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MycancelorderDetails;
