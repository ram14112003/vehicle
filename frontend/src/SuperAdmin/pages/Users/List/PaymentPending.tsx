import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import TravelHeader from "../header";
import Footer from "../Footer";
import { DataTable, Column } from "../../../../components/DataTable";
import { showToast } from "../../../../components/AlertBox";
import { FileText } from "lucide-react";

type Order = {
  invoiceNumber: string;
  createdAt: string;
  invoiceAmount: number;
  booking?: {
    bookingId: string;
    pickupPoint: string;
  };
};

const PaymentPendingOrders: React.FC = () => {
  const userId = localStorage.getItem("userId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch Payment Pending Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get(`/order/user/${userId}/payment-pending`);
        if (res.data.success) setOrders(res.data.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  // ✅ Define table columns
  const columns: Column<Order>[] = [
    {
      header: "Invoice Number",
      accessor: "invoiceNumber",
      render: (row) => (
    <button
      onClick={() => handleView(row)}
      className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-colors duration-200"
    >
      {row.invoiceNumber}
    </button>
  ),
    },
    {
      header: "Invoice Date",
      accessor: "createdAt",
      render: (row) =>
        new Date(row.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
    },
    {
      header: "Invoice Amount",
      accessor: "invoiceAmount",
      render: (row) => `₹${row.invoiceAmount ? row.invoiceAmount.toFixed(2) : "0.00"}`,
    },
    {
      header: "Pickup Point",
      accessor: "pickupPoint" as any,
      render: (row) => row.booking?.pickupPoint || "N/A",
    },
  ];

  // ✅ Handle actions
  const handleView = (row: Order) => {
    if (row.booking?.bookingId) {
      navigate(`/users/view/payment-pending-orderlist/${row.booking.bookingId}`);
    } else {
      showToast("No booking details found.", "error");
    }
  };

  const handleInvoice = (row: Order) => {
    showToast(`Invoice ${row.invoiceNumber} action triggered.`, "info");
  };

  return (
    <>
      <TravelHeader />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-4">
          <span>Home</span> <span className="mx-2">▸</span> <span>List Order</span>
        </nav>

        {/* Main container */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#275981] px-6 py-3 flex items-center">
            <span className="text-white text-lg font-semibold">⚙ Order Details</span>
          </div>

          {/* DataTable */}
          <div className="p-4">
            <DataTable<Order>
              columns={columns}
              data={orders}
              loading={loading}
              rowsPerPage={10}
              emptyMessage="No payment pending orders found."
              onView={(row) => handleView(row)}
              // onInvoice={(row) => handleInvoice(row)}
              // invoiceLabel="Invoice"
              // invoiceIcon={<FileText size={16} />}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentPendingOrders;
