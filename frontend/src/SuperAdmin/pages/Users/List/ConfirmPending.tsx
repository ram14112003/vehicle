import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import TravelHeader from "../header";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { DataTable, Column } from "../../../../components/DataTable";

const ConfirmPendingOrders: React.FC = () => {
  const userId = localStorage.getItem("userId");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get(`/order/user/${userId}/pending`);
        if (res.data.success) setOrders(res.data.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  // ✅ Handlers
  const handleView = (order: any) => {
    navigate(`/users/view/confirm-pending-orderlist/${order.bookingId}`, {
      state: { bookingId: order.bookingId },
    });
  };

  const handleCopy = (order: any) => {
    navigator.clipboard.writeText(order.bookingCode);
  };

  // ✅ Columns definition
  const columns: Column<any>[] = [
    {
      header: "Order Number",
      accessor: "bookingCode",
      render: (order) => (
        <div>
            <button
        onClick={() => handleView(order)}
        className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-colors duration-200"
      >
        {order.bookingCode}
      </button>
          {/* <div className="text-red-600 font-medium" >{order.bookingCode}</div> */}
          <div className="text-gray-500 text-xs">
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      header: "Pickup Date",
      accessor: "bookingDate",
      render: (order) =>
        order.bookingDate ? (
          new Date(order.bookingDate).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        ) : (
          <span className="text-gray-400">N/A</span>
        ),
    },
    {
      header: "Pickup Type",
      accessor: "pickupPoint",
      render: (order) => order.pickupPoint || <span className="text-gray-400">N/A</span>,
    },
    {
      header: "Total Amount (Rs.)",
      accessor: "totalAmount",
      render: (order) =>
        order.invoice?.[0]?.invoiceAmount
          ? order.invoice[0].invoiceAmount.toFixed(2)
          : order.totalAmount
          ? order.totalAmount.toFixed(2)
          : "__",
    },
    {
      header: "Pickup Point",
      accessor: "pickupArea",
    },
    {
      header: "Drop Point",
      accessor: "dropPoint",
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
          {/* Header */}
          <div className="bg-[#275981] px-6 py-3 flex items-center">
            <span className="text-white text-lg">⚙ Order Details</span>
          </div>

          {/* DataTable */}
          <div className="p-4">
            <DataTable
              columns={columns}
              data={orders}
              loading={loading}
              onView={handleView}
              // onCopy={handleCopy}
              rowsPerPage={5}
              emptyMessage="No records found."
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ConfirmPendingOrders;
