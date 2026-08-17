// src/SuperAdmin/pages/Orders/ViewConfirmPendingOrder.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import {
  faFileInvoice,
  faUser,
  faCalendarAlt,
  faTruck,
  faMapMarkerAlt,
  faCar,
  faIdCard,
  faArrowLeft,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageLayout from "../../../../components/PageLayout";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import TravelHeader from "../header";

// Interfaces
interface Order {
  bookingId: string;
  bookingCode: string;
  createdAt: string;
  bookingDate: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea:string;
  dropPoint:string;
  userId: string;
  vehicleTypeId: string;
  confirmStatus: string;
  payment?: {
    paymentId: string;
    status: string;
  };

}

interface User {
  username: string;
  companyId: string;
  email: string;
  mobile: string;
  userAddress: string;
}

interface Company {
  companyName: string;
  email: string;
  phone: string;
  companyAddress: string;
}

interface VehicleType {
  vehicleType: string;
}

interface VehicleMaster {
  vehicleNumber: string;
}

interface Vehicle {
  vehicleId: string;
  vehicleName: string;
  vehicleTypeId: string;
  vehicleMaster?: VehicleMaster; 
}



interface Driver {
  driverId: string;
  driverName: string;
}

const formatToCustom = (dateString: string) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  let day = String(d.getDate()).padStart(2, "0");
  let month = String(d.getMonth() + 1).padStart(2, "0");
  let year = d.getFullYear();
  let hours = d.getHours();
  let minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const UserViewConfirmPendingOrder: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [vehicleType, setVehicleType] = useState<string>("");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [VehicleMaster, setVehicleMaster] = useState<VehicleMaster[]>([]);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  useEffect(() => {
    if (!bookingId) return;
    const fetchData = async () => {
      try {
        const orderRes = await axiosInstance.post("/order/getOrdersById", {
          bookingId,
        });
        const orderData: Order = orderRes.data?.data;
        setOrder(orderData);

        if (orderData?.vehicleTypeId) {
          const vehicleTypeRes = await axiosInstance.get(
            `/vehicleType/${orderData.vehicleTypeId}`
          );
          const vehicleTypeData: VehicleType = vehicleTypeRes.data?.data;
          setVehicleType(vehicleTypeData.vehicleType);
        }

        if (orderData?.userId) {
          const userRes = await axiosInstance.get(`/user/${orderData.userId}`);
          const userData: User = userRes.data?.data;
          setUser(userData);

          if (userData?.companyId) {
            const companyRes = await axiosInstance.get(
              `/company/getCompanyById/${userData.companyId}`
            );
            setCompany(companyRes.data?.data);
          }
        }

       
     

      } catch (error) {
        console.error("Error fetching data:", error);
        showToast("   Failed to load booking details.", "error");
      }
    };
    fetchData();
  }, [bookingId]);

  const handleConfirm = async () => {
    if (!order?.bookingId || !selectedDriver || !selectedVehicle) {
      showToast("   Please select both vehicle and driver before confirming.", "warn");
      return;
    }
    try {
      const res = await axiosInstance.patch("/vendor/confirmBookingforWeb", {
        bookingId: order.bookingId,
        driverId: selectedDriver,
        vehicleId: selectedVehicle,
      });

      if (res.status === 200) {
        showToast("Booking confirmed & email sent to customer.", "success");
        navigate("/orders/closepending");
      }
    } catch (error) {
      console.error("Confirm booking error:", error);
      showToast("Failed to confirm booking.", "error");
    }
  };

  return (
    <>
    <TravelHeader/>
  <PageLayout breadcrumbName={order?.bookingCode || "Order"}>
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileInvoice} className="text-blue-600" />
          View Confirm Pending Order
        </h2>

        {/* Toast container for alerts */}
        <AlertContainer />

        {/* Warning Section */}
        {order &&
          (order.confirmStatus === "0" || order.payment?.status === "0") && (
            <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 p-4 rounded mb-6 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-yellow-600"
              />
              <div>
                {order.confirmStatus === "0" && (
                  <p className="font-medium">Order not yet confirmed</p>
                )}
                {order.payment?.status === "0" && (
                  <p className="font-medium">Order not yet paid</p>
                )}
              </div>
            </div>
          )}

        {/* Grid Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Order Details */}
          <div className="p-4 border rounded shadow-sm bg-white">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
              Order Details
            </h3>
            <p>
              <strong>Order Number:</strong> #{order?.bookingCode || "-"}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {formatToCustom(order?.createdAt || "-")}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {order?.confirmStatus === "0" ? (
                <span className="text-red-600 font-medium">Not Paid</span>
              ) : (
                <span className="text-green-600 font-medium">Paid</span>
              )}
            </p>
          </div>

          {/* User Details */}
          <div className="p-4 border rounded shadow-sm bg-white">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-green-500" />
              User Details
            </h3>
            <p>
              <strong>Company:</strong> {company?.companyName || "-"}
            </p>
            <p>
              <strong>User Name:</strong> {user?.username || "-"}
            </p>
            <p>
              <strong>Email:</strong> {user?.email || "-"}
            </p>
            <p>
              <strong>Phone:</strong> {user?.mobile || "-"}
            </p>
            <p>
              <strong>Address:</strong> {user?.userAddress || "-"}
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="p-4 border rounded shadow-sm bg-white mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-500" />
            Booking Details
          </h3>
          <p>
            <strong>Pickup Date & Time:</strong>{" "}
            {formatToCustom(order?.bookingDate || "-")}
          </p>
          <p>
            <strong>Travel Package:</strong> {order?.pickupPoint || "-"}
          </p>
            <p>
            <strong>Pickup Point:</strong> {order?.pickupArea || "-"}
          </p>
            <p>
            <strong>Drop Point:</strong> {order?.dropPoint || "-"}
          </p>
          <p>
            <strong>Pickup City:</strong> {order?.pickupCity || "-"}
          </p>
          <p>
            <strong>Vehicle Type:</strong> {vehicleType || "-"}
          </p>
        </div>

      </div>
    </PageLayout>
    </>
  );
};

export default UserViewConfirmPendingOrder;
