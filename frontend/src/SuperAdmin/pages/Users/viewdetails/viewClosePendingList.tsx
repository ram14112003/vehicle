// src/SuperAdmin/pages/Orders/ViewClosePendingOrder.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import PageLayout from "../../../../components/PageLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoice,
  faUser,
  faCalendarAlt,
  faTruck,
  faCar,
  faIdCard,
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { showToast,AlertContainer } from "../../../../components/AlertBox";
import TravelHeader from "../header";

const UserViewClosePendingOrderList: React.FC = () => {
  const location = useLocation();
const { bookingId } = location.state || {}; 
  const [order, setOrder] = useState<any>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
  if (bookingId) {  // 👈 bookingId இல்லாட்டி fetch ஆகாது
    fetchOrder(bookingId).then((ord) => {
      if (ord?.vehicleTypeId) {
        fetchVehicles(ord.vehicleTypeId);
      }
    });
  }
  fetchDrivers();
}, [bookingId]);

  // ✅ Fetch order details
  const fetchOrder = async (id: string) => {
    try {
      const response = await axiosInstance.post("/order/getOrdersById", {
        bookingId: id,
      });
      setOrder(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching order by ID:", error);
    }
  };

  // ✅ Fetch all vehicles (filter by type)
  const fetchVehicles = async (vehicleTypeId: string) => {
    try {
      const res = await axiosInstance.get("/vehicle/getAllVehicles");
      if (Array.isArray(res.data.vehicles)) {
        const filtered = res.data.vehicles.filter(
          (veh: any) => veh.vehicleTypeId === vehicleTypeId
        );
        setVehicles(filtered);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    }
  };

  // ✅ Fetch all drivers
  const fetchDrivers = async () => {
    try {
      const res = await axiosInstance.get("/driver/getAllDrivers");
      if (Array.isArray(res.data.drivers)) {
        setDrivers(res.data.drivers);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setDrivers([]);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchOrder(bookingId).then((ord) => {
        if (ord?.vehicleTypeId) {
          fetchVehicles(ord.vehicleTypeId);
        }
      });
    }
    fetchDrivers();
  }, [bookingId]);

  if (!order) {
    return (
      <PageLayout>
        <p className="p-6 text-gray-600">Loading order details...</p>
      </PageLayout>
    );
  }

  const handleConfirm = async () => {
    if (!order?.bookingId || !selectedDriver || !selectedVehicle) {
      showToast("Please select both vehicle and driver before confirming","warn");
      return;
    }

    try {
      const res = await axiosInstance.patch(
        "/vendor/updateBookingVehicleDriver",
        {
          bookingId: order.bookingId,
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
        }
      );

      if (res.status === 200) {
        showToast("Vehicle & Driver updated successfully ","success");
        fetchOrder(order.bookingId); // refresh again
      }
    } catch (error) {
      console.error("Update booking error:", error);
      showToast("Failed to update booking ❌","error");
    }
  };

  const handleClose = () => {
    navigate(`/orders/close/close-pending-order/${order.bookingCode}`);
  };

  return (
    <>
    <TravelHeader/>
  <PageLayout breadcrumbName={order?.bookingCode || "Order"}>
      <AlertContainer />
      <div className="p-6 text-gray-800">
        {/* Warnings */}
        {order && (order.confirmStatus === "0" || order.payment?.status === "0") && (
          <div className="bg-red-100 text-red-700 border border-red-300 p-4 rounded mb-6">
            {order.confirmStatus === "0" && (
              <p className="font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" />
                Order not yet confirmed
              </p>
            )}
            {order.payment?.status === "0" && (
              <p className="font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" />
                Order not yet paid
              </p>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            View Close Pending Order
          </h2>
          <button
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
        </div>

        {/* Order + User */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileInvoice} className="text-blue-600" />
              Order Details
            </h3>
            <p><strong>Order Number:</strong> #{order.bookingCode}</p>
            <p><strong>Order Date:</strong> {new Date(order.bookingDate).toLocaleDateString()}</p>
            <p>
              <strong>Status:</strong>{" "}
              {order.confirmStatus === "0" ? (
                <span className="text-red-600 font-medium">Pending</span>
              ) : (
                <span className="text-green-600 font-medium">Not Paid</span>
              )}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-purple-600" />
              User Details
            </h3>
            <p><strong>Company Name:</strong> {order.user?.company?.companyName}</p>
            <p><strong>User Name:</strong> {order.user?.username}</p>
            <p><strong>Email:</strong> {order.user?.email}</p>
            <p><strong>Phone:</strong> {order.user?.mobile}</p>
            <p><strong>Manager:</strong> {order.user?.company?.managerEmail}</p>
          </div>
        </div>

        {/* Booking + Vehicle */}
    /* ✅ UPDATE ONLY: replace your "Booking + Vehicle" section with this */

/* Booking + Vehicle */
<div className="grid md:grid-cols-2 gap-6 mb-6">
  <div>
    <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
      <FontAwesomeIcon icon={faCalendarAlt} className="text-green-600" />
      Booking Details
    </h3>

    <p><strong>Travel Package:</strong> {order.pickupPoint || "-"}</p>
    <p><strong>Pickup City:</strong> {order.pickupCity || "-"}</p>
    <p><strong>Pickup Point:</strong> {order.pickupArea || "-"}</p>
    <p><strong>Drop Point:</strong> {order.dropPoint || "-"}</p>

    {/* ✅ FIX: vehicleType sometimes comes in different paths */}
    <p>
      <strong>Vehicle Type:</strong>{" "}
      {order?.vehicleType?.vehicleType ||
        order?.vehicleMaster?.vehicleType ||
        order?.vehicle?.vehicleMaster?.vehicleType ||
        "-"}
    </p>
  </div>

  <div>
    <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
      <FontAwesomeIcon icon={faCar} className="text-orange-600" />
      Vehicle Details
    </h3>

    {/* ✅ FIX: vehicle data may be under order.vehicleMaster OR order.vehicle.vehicleMaster */}
    <p>
      <strong>Model:</strong>{" "}
      {order?.vehicleMaster?.vehicleModelName ||
        order?.vehicle?.vehicleMaster?.vehicleModelName ||
        order?.vehicleMaster?.vehicle?.vehicleName ||
        order?.vehicle?.vehicleName ||
        "-"}
    </p>

    <p>
      <strong>Type:</strong>{" "}
      {order?.vehicleMaster?.vehicleType ||
        order?.vehicle?.vehicleMaster?.vehicleType ||
        order?.vehicleType?.vehicleType ||
        "-"}
    </p>

    <p>
      <strong>Number:</strong>{" "}
      {order?.vehicleMaster?.vehicleNumber ||
        order?.vehicle?.vehicleMaster?.vehicleNumber ||
        "-"}
    </p>

    <p>
      <strong>Owner:</strong>{" "}
      {order?.vehicleMaster?.vendor?.vendorName ||
        order?.vehicleMaster?.vendorName ||
        order?.vehicle?.vehicleMaster?.vendor?.vendorName ||
        "-"}
    </p>
  </div>
</div>

        {/* Driver */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
            <FontAwesomeIcon icon={faIdCard} className="text-teal-600" />
            Driver Details
          </h3>
          <p><strong>Name:</strong> {order.driver?.driverName}</p>
          <p><strong>Email:</strong> {order.driver?.driverEmail}</p>
          <p><strong>Phone:</strong> {order.driver?.phno}</p>
          <p><strong>Address:</strong> {order.driver?.address}</p>
        </div>

     
      </div>
    </PageLayout>
    </>
  );
};

export default UserViewClosePendingOrderList;