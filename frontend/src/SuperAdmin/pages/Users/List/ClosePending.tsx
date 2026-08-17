import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import TravelHeader from "../header";
import Footer from "../Footer";
import { useNavigate } from "react-router-dom";
import { DataTable, Column } from "../../../../components/DataTable"; // ✅ Adjust path as needed

// Define the type for your order data
interface Order {
  bookingId: string;
  bookingCode: string;
  bookingDate?: string;
  pickupPoint?: string;
  pickupArea?: string;
  dropPoint?: string;
  createdAt: string;
}

const ClosePendingOrders: React.FC = () => {
  const userId = localStorage.getItem("userId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get(`/order/user/${userId}/closed`);
        if (res.data.success) setOrders(res.data.data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  // Action Handlers
  const handleView = (row: Order) => {
    navigate(`/users/view/close-pending-orderlist/${row.bookingId}`, {
      state: { bookingId: row.bookingId },
    });
  };

  const handleCopy = (row: Order) => {
    navigator.clipboard.writeText(row.bookingCode);
    console.log("Copied booking code:", row.bookingCode);
  };

  // Define columns for DataTable
  const columns: Column<Order>[] = [
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
          {/* <div className="text-red-600 font-medium">{row.bookingCode}</div> */}
          <div className="text-gray-500 text-xs">
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
      render: (row) => row.pickupPoint || "N/A",
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

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-[#275981] px-6 py-3 flex items-center">
            <span className="text-white text-lg">⚙ Order Details</span>
          </div>

          {/* ✅ Using Reusable DataTable */}
          <DataTable<Order>
            columns={columns}
            data={orders}
            loading={loading}
            onView={handleView}
            // onCopy={handleCopy}
            rowsPerPage={10}
            emptyMessage="No closed or pending orders found."
            viewLabel="View"
            copyLabel="Copy"
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ClosePendingOrders;
