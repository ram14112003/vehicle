import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import PageLayout from "../../../../components/PageLayout";

// Date Formatter
const formatToCustom = (dateString: string) => {
  if (!dateString) return "-";
  const d = new Date(dateString);

  if (isNaN(d.getTime())) {
    return dateString;
  }

  let day = String(d.getDate()).padStart(2, "0");
  let monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let month = monthNames[d.getMonth()];
  let year = d.getFullYear();

  let hours = d.getHours();
  let minutes = String(d.getMinutes()).padStart(2, "0");
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

// Interfaces
interface OrderDetails {
  bookingCode: string;
  bookingDate: string;
  status: string;
  pickupCity: string;
  pickupPoint: string;
  flightNumber: string;
  createdAt: string;
  userId: string;
  vehicleType: {
    vehicleType: string;
  };
}

interface UserDetails {
  username: string;
  email: string;
  phoneNo: string;
  address: string;
  gstNo: string;
  companyId: string;
}

interface CompanyDetails {
  companyName: string;
}

const ViewCancelOrder: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!bookingId) {
          setError("Booking ID is missing.");
          setLoading(false);
          return;
        }

        const orderRes = await axiosInstance.post("/order/getOrdersById", { bookingId });
        const orderData = orderRes.data.data;
        setOrder(orderData);

        if (orderData && orderData.userId) {
          const userRes = await axiosInstance.get(`/user/${orderData.userId}`);
          const userData = userRes.data.data;
          setUser(userData);

          if (userData && userData.companyId) {
            const companyRes = await axiosInstance.get(`/company/getCompanyById/${userData.companyId}`);
            setCompany(companyRes.data.data);
          }
        }
      } catch (err) {
        console.error("Error fetching details:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [bookingId]);

  if (loading) return <PageLayout>Loading...</PageLayout>;
  if (error) return <PageLayout>Error: {error}</PageLayout>;
  if (!order) return <PageLayout>No order found.</PageLayout>;

  return (
  <PageLayout breadcrumbName={order?.bookingCode || "Order"}>
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">View Cancel Order</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
          >
            Back
          </button>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side */}
          <div>
            <h3 className="font-semibold text-orange-600 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><b>Order Number</b>: #{order.bookingCode}</p>
              <p><b>Order Date</b>: {formatToCustom(order.bookingDate)}</p>
              <p><b>Status</b>: <span className="text-red-600 font-semibold">Not Paid</span></p>
            </div>

            <h3 className="font-semibold text-orange-600 mt-6 mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><b>Pickup Date and Time</b>: {formatToCustom(order.bookingDate)}</p>
              <p><b>Pickup City</b>: {order.pickupCity}</p>
              <p><b>Pickup Point</b>: {order.pickupPoint}</p>
              {/* <p><b>Flight Number</b>: {order.flightNumber}</p> */}
              <p><b>Vehicle Type</b>: {order.vehicleType?.vehicleType}</p>
            </div>
          </div>

          {/* Right Side */}
          <div>
            <h3 className="font-semibold text-orange-600 mb-3">User Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><b>Company Name</b>: {company?.companyName || "-"}</p>
              <p><b>User Name</b>: {user?.username || "-"}</p>
              <p><b>Email Address</b>: {user?.email || "-"}</p>
              <p><b>Phone Number</b>: {user?.phoneNo || "-"}</p>
              <p><b>Address</b>: {user?.address || "-"}</p>
              <p><b>GST NO</b>: {user?.gstNo || "-"}</p>
            </div>

            <h3 className="font-semibold text-orange-600 mt-6 mb-3">Booking Cancel Details</h3>
            <div className="text-sm text-gray-700">
              <p><b>Cancel Date and Time</b>: <span className="text-red-600">{formatToCustom(order.createdAt)}</span></p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ViewCancelOrder;
