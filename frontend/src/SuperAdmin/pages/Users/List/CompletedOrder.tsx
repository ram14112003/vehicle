import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import TravelHeader from "../header";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { DataTable, Column } from "../../../../components/DataTable";
import { showToast } from "../../../../components/AlertBox";
import { Copy, Eye } from "lucide-react";

type CompletedOrder = {
  bookingId: string;
  bookingCode: string;
  createdAt: string;
  bookingDate?: string;
  pickupPoint?: string;
  pickupArea?: string;
  dropPoint?: string;
  invoice?: { invoiceAmount: number }[];
};

const CompletedOrders: React.FC = () => {
  const userId = localStorage.getItem("userId");
  const companyId = localStorage.getItem("companyId");
  const navigate = useNavigate();

  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get(`/order/user/${userId}/payment-completed`);
        if (res.data.success) setOrders(res.data.data);
      } catch (err) {
        console.error("Error fetching completed orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  // ✅ Handle View
  const handleView = (row: CompletedOrder) => {
    navigate(`/users/view/completed-lists/${row.bookingId}`);
  };

  // ✅ Handle Copy
  const handleCopy = async (row: CompletedOrder) => {
    try {
      const response = await axiosInstance.get(`/order/details/${row.bookingCode}`);
      if (response.data) {
        const bookingData = response.data;
        const userId = bookingData?.booking?.user?.userId;
        const companyId = bookingData?.booking?.user?.companyId;
        const orderNumber = row.bookingCode;

        navigate(`/users/userinvoice/${userId}?companyId=${companyId}`, {
          state: {
            copyFromBooking: true,
            bookingData,
            userId,
            companyId,
            orderNumber,
          },
        });
      } else {
        showToast("Failed to fetch booking details", "error");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      showToast("Error fetching booking details", "error");
    }
  };

  // ✅ Table Columns
  const columns: Column<CompletedOrder>[] = [
    {
      header: "Order Number",
      accessor: "bookingCode",
      render: (row) => (
        <div>
  <button
        onClick={() => handleView(row)}
        className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-colors duration-200"
      >
        {row.bookingCode}
      </button>   
             <div className="text-gray-600 text-xs">
            {new Date(row.createdAt).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      header: "Pickup Date",
      accessor: "bookingDate",
      render: (row) =>
        row.bookingDate
          ? new Date(row.bookingDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "N/A",
    },
    {
      header: "Pickup Type",
      accessor: "pickupPoint",
      render: (row) => row.pickupPoint || "Local City Use",
    },
    {
      header: "Total Amount (Rs.)",
      accessor: "invoiceAmount" as any,
      render: (row) =>
        row.invoice?.[0]?.invoiceAmount
          ? row.invoice[0].invoiceAmount.toFixed(2)
          : "0.00",
    },
    {
      header: "Pickup Point",
      accessor: "pickupArea",
      render: (row) => row.pickupArea || "N/A",
    },
    {
      header: "Drop Point",
      accessor: "dropPoint",
      render: (row) => row.dropPoint || "N/A",
    },
  ];

  return (
    <>
      <TravelHeader />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-4">
          <span>Home</span> <span className="mx-2">▸</span> <span>List Order</span>
        </nav>

        {/* Table Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-[#275981] px-6 py-3 flex items-center">
            <span className="text-white text-lg font-semibold">⚙ Order Details</span>
          </div>

          {/* ✅ DataTable Component */}
          <div className="p-4">
            <DataTable<CompletedOrder>
              columns={columns}
              data={orders}
              loading={loading}
              rowsPerPage={10}
              emptyMessage="No completed orders found."
              onView={handleView}
              onCopy={handleCopy}
              viewIcon={<Eye size={16} />}
              copyIcon={<Copy size={16} />}
              viewLabel="View"
              copyLabel="Copy"
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CompletedOrders;
