// src/SuperAdmin/pages/Orders/ViewClosePendingOrder.tsx
import React, { useEffect, useRef, useState } from "react";
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


// ✅ New API response item (same as confirm pending)
interface VehicleModelItem {
  vehicleMasterId: string;
  vehicleTypeId: string;
  vehicleModelName: string;
  vehicleNumber: string;
  vehicleId: string;
}


const ViewClosePendingOrder: React.FC = () => {
  const location = useLocation();
  const { bookingId } = location.state || {};
  const [order, setOrder] = useState<any>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
const [selectedVehicle, setSelectedVehicle] = useState<string>(""); 
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
const [isConfirming, setIsConfirming] = useState(false);
const [vehicleItems, setVehicleItems] = useState<VehicleModelItem[]>([]);
const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);


const dropdownRef = useRef<HTMLDivElement | null>(null);

const [selectedVehicleLabel, setSelectedVehicleLabel] = useState(""); // show text in input

  const navigate = useNavigate();

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
const filteredVehicles = vehicleItems.filter((v) =>
  (v.vehicleNumber || "").slice(-4).includes(vehicleSearchTerm)
);

useEffect(() => {
  const onDocClick = (e: MouseEvent) => {
    if (!dropdownRef.current) return;
    if (!dropdownRef.current.contains(e.target as Node)) {
      setShowVehicleDropdown(false);
    }
  };
  document.addEventListener("mousedown", onDocClick);
  return () => document.removeEventListener("mousedown", onDocClick);
}, []);

  // ✅ Fetch all vehicles (filter by type)
  // const fetchVehicles = async (vehicleTypeId: string) => {
  //   try {
  //     const res = await axiosInstance.get("/vehicle/getAllVehicles");
  //     if (Array.isArray(res.data.vehicles)) {
  //       const filtered = res.data.vehicles.filter(
  //         (veh: any) => veh.vehicleTypeId === vehicleTypeId
  //       );
  //       setVehicles(filtered);
  //     } else {
  //       setVehicles([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching vehicles:", error);
  //     setVehicles([]);
  //   }
  // };

  // ✅ Fetch vehicles by vehicleTypeId (NEW API)
const fetchVehicleModels = async (vehicleTypeId: string) => {
  try {
    const vmRes = await axiosInstance.get(`/vehicle/vehicleType/${vehicleTypeId}/vehicle-models`);
    setVehicleItems(vmRes.data?.items || []);
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    setVehicleItems([]);
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
        fetchVehicleModels(ord.vehicleTypeId);
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
  if (isConfirming) return;
  setIsConfirming(true);

  if (!order?.bookingId || !selectedDriver || !selectedVehicle) {
    showToast("Please select both vehicle and driver before confirming", "warn");
    setIsConfirming(false);
    return;
  }

  const [vehicleId, vehicleMasterId] = selectedVehicle.split("::");

  if (!vehicleId || !vehicleMasterId) {
    showToast("Invalid vehicle selection, please select again", "warn");
    setIsConfirming(false);
    return;
  }

  try {
    const res = await axiosInstance.patch("/vendor/updateBookingVehicleDriver", {
      bookingId: order.bookingId,
      driverId: selectedDriver,
      vehicleId,
      vehicleMasterId, // ✅ NEW
    });

    if (res.status === 200) {
      showToast("Vehicle & Driver updated successfully", "success");
      await fetchOrder(order.bookingId); // refresh
      setShowConfirmation(false);

      // reset selection
      setSelectedVehicle("");
      setSelectedVehicleLabel("");
      setVehicleSearchTerm("");
    }
  } catch (error) {
    console.error("Update booking error:", error);
    showToast("Failed to update booking ❌", "error");
  } finally {
    setIsConfirming(false);
  }
};


  const handleClose = () => {
    navigate(`/orders/close/close-pending-order/${order.bookingCode}`);
  };

  return (
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

    {/* ✅ FIXED: Vehicle Type path */}
    <p>
      <strong>Vehicle Type:</strong>{" "}
      {order?.vehicleType?.vehicleType || order?.vehicleMaster?.vehicleType || "-"}
    </p>
  </div>

  <div>
    <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
      <FontAwesomeIcon icon={faCar} className="text-orange-600" />
      Vehicle Details
    </h3>

    {/* ✅ FIXED: vehicleMaster direct */}
    <p>
      <strong>Model:</strong>{" "}
      {order?.vehicleMaster?.vehicleModelName ||
        order?.vehicleMaster?.vehicle?.vehicleName ||
        "-"}
    </p>

    <p>
      <strong>Type:</strong>{" "}
      {order?.vehicleMaster?.vehicleType || order?.vehicleType?.vehicleType || "-"}
    </p>

    <p>
      <strong>Number:</strong>{" "}
      {order?.vehicleMaster?.vehicleNumber || "-"}
    </p>

    <p>
      <strong>Owner:</strong>{" "}
      {order?.vehicleMaster?.vendor?.vendorName ||
        order?.vehicleMaster?.vendorName ||
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

        {/* Change Vehicle & Driver */}
        <div className="flex justify-center mt-4">
          <p
            className="text-blue-600 underline cursor-pointer mb-4"
            onClick={() => setShowConfirmation((prev) => !prev)}
          >
            Click here to change Vehicle & Driver Details
          </p>
        </div>

        {showConfirmation && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
              Order Confirmation
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Vehicle Dropdown */}
             {/* Vehicle Dropdown */}
{/* ✅ Vehicle Searchable Dropdown like ConfirmPending */}
<div className="relative" ref={dropdownRef}>
  <label className="block mb-1 font-medium">Vehicle Number</label>

  <div className="relative">
    <input
      type="text"
      placeholder="Search by last 4 digits (ex: 1234)"
      className="w-full border border-gray-300 rounded p-2 pr-10"
      value={selectedVehicle ? selectedVehicleLabel : vehicleSearchTerm}
      onChange={(e) => {
        const val = e.target.value;
        if (selectedVehicle) return; // locked
        setVehicleSearchTerm(val);
        setShowVehicleDropdown(true);
      }}
      onFocus={() => {
        if (!selectedVehicle) setShowVehicleDropdown(true);
      }}
      readOnly={!!selectedVehicle}
    />

    {/* ✅ Clear selected vehicle */}
    {selectedVehicle && (
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        onClick={() => {
          setSelectedVehicle("");
          setSelectedVehicleLabel("");
          setVehicleSearchTerm("");
          setShowVehicleDropdown(true);
        }}
        title="Clear selection"
      >
        ✕
      </button>
    )}
  </div>

  {/* ✅ Dropdown */}
  {showVehicleDropdown && !selectedVehicle && (
    <div className="absolute z-10 bg-white border border-gray-300 w-full max-h-60 overflow-auto mt-1 rounded shadow">
      {filteredVehicles.length > 0 ? (
        <ul>
          {filteredVehicles.map((v) => (
            <li
              key={`${v.vehicleId}::${v.vehicleMasterId}`}
              className="p-2 hover:bg-gray-100 cursor-pointer"
           onClick={() => {
  setSelectedVehicle(`${v.vehicleId}::${v.vehicleMasterId}`); // ✅ store both
  setSelectedVehicleLabel(`${v.vehicleModelName} - ${v.vehicleNumber}`);
  setVehicleSearchTerm("");
  setShowVehicleDropdown(false);
}}

            >
              <div className="font-medium">{v.vehicleNumber}</div>
              <div className="text-xs text-gray-500">{v.vehicleModelName}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-3 text-sm text-gray-500">
          No vehicles found for: <b>{vehicleSearchTerm}</b>
        </div>
      )}
    </div>
  )}

  {/* ✅ Hint */}

</div>



              {/* Driver Dropdown */}
              <div>
                <label className="block mb-1 font-medium">Driver</label>
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="">Please select a driver</option>
                  {drivers.map((drv: any) => (
                    <option key={drv.driverId} value={drv.driverId}>
                      {drv.driverName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          <div className="flex justify-center mt-4">
  <button
    className={`px-6 py-2 rounded text-white flex items-center gap-2 ${
      isConfirming || !selectedDriver || !selectedVehicle
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700"
    }`}
    onClick={handleConfirm}
    disabled={isConfirming || !selectedDriver || !selectedVehicle}
  >
    <FontAwesomeIcon icon={faCheckCircle} />
    {isConfirming ? "Updating..." : "Confirm"}
  </button>
</div>

          </div>
        )}

        <div className="flex justify-end">
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default ViewClosePendingOrder;