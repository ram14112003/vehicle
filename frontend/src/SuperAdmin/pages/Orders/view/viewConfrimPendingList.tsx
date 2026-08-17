// src/SuperAdmin/pages/Orders/ViewConfirmPendingOrder.tsx
import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import {
  faFileInvoice,
  faUser,
  faCalendarAlt,
  faTruck,
  faCar,
  faIdCard,
  faArrowLeft,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageLayout from "../../../../components/PageLayout";
import { showToast, AlertContainer } from "../../../../components/AlertBox";

// Interfaces
interface Order {
  bookingId: string;
  bookingCode: string;
  createdAt: string;
  bookingDate: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea: string;
  dropPoint: string;
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

// ✅ items returned from /vehicle/vehicleType/:id/vehicle-models
interface VehicleModelItem {
  vehicleMasterId: string;
  vehicleTypeId: string;
  vehicleModelName: string;
  vehicleNumber: string;
  vehicleId: string;
  vehicleName?: string; // optional if backend returns
}

interface Driver {
  driverId: string;
  driverName: string;
}

const formatToCustom = (dateString: string) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const ViewConfirmPendingOrder: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [vehicleType, setVehicleType] = useState<string>("");

  const [vehicleItems, setVehicleItems] = useState<VehicleModelItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // ✅ "vehicleId::vehicleMasterId"
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string>("");
  const [selectedVehicleLabel, setSelectedVehicleLabel] = useState<string>("");

  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const vehicleDropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const fetchData = async () => {
      try {
        // 1) Order
        const orderRes = await axiosInstance.post("/order/getOrdersById", { bookingId });
        const orderData: Order = orderRes.data?.data;
        setOrder(orderData);

        // 2) VehicleType name + 3) Vehicles by VehicleTypeId
        if (orderData?.vehicleTypeId) {
          const vehicleTypeRes = await axiosInstance.get(`/vehicleType/${orderData.vehicleTypeId}`);
          const vehicleTypeData: VehicleType = vehicleTypeRes.data?.data;
          setVehicleType(vehicleTypeData?.vehicleType || "");

          const vmRes = await axiosInstance.get(
            `/vehicle/vehicleType/${orderData.vehicleTypeId}/vehicle-models`
          );
          setVehicleItems(vmRes.data?.items || []);
        }

        // 4) User + Company
        if (orderData?.userId) {
          const userRes = await axiosInstance.get(`/user/${orderData.userId}`);
          const userData: User = userRes.data?.data;
          setUser(userData);

          if (userData?.companyId) {
            const companyRes = await axiosInstance.get(`/company/getCompanyById/${userData.companyId}`);
            setCompany(companyRes.data?.data);
          }
        }

        // 5) Drivers
        const driverRes = await axiosInstance.get("/driver/getAllDrivers");
        setDrivers(driverRes.data?.drivers || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast("Failed to load booking details.", "error");
      }
    };

    fetchData();
  }, [bookingId]);

  // click outside close dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!vehicleDropdownRef.current) return;
      if (!vehicleDropdownRef.current.contains(e.target as Node)) {
        setShowVehicleDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);

    if (!order?.bookingId || !selectedDriver || !selectedVehicleKey) {
      showToast("Please select both vehicle and driver before confirming.", "warn");
      setIsConfirming(false);
      return;
    }

    // ✅ split vehicleId + vehicleMasterId from "vehicleId::vehicleMasterId"
    const [vehicleId, vehicleMasterId] = selectedVehicleKey.split("::");

    if (!vehicleId || !vehicleMasterId) {
      showToast("Invalid vehicle selection. Please select again.", "warn");
      setIsConfirming(false);
      return;
    }

    try {
      const res = await axiosInstance.patch("/vendor/confirmBookingforWeb", {
        bookingId: order.bookingId,
        driverId: selectedDriver,
        vehicleId,
        vehicleMasterId, // ✅ NEW
      });

      if (res.status === 200) {
        showToast("Booking confirmed & notification sent.", "success");
        navigate(`/orders/close/close-pending-order/${order.bookingCode}`);
      }
    } catch (error) {
      console.error("Confirm booking error:", error);
      showToast("Failed to confirm booking.", "error");
    } finally {
      setIsConfirming(false);
    }
  };

  // Filter vehicles by last 4 digits
  const filteredVehicles = vehicleItems.filter((v) => {
    const last4 = (v.vehicleNumber || "").slice(-4);
    const term = (vehicleSearchTerm || "").trim();
    if (!term) return true;
    return last4.includes(term);
  });

  return (
    <PageLayout breadcrumbName={order?.bookingCode || "Order"}>
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileInvoice} className="text-blue-600" />
          View Confirm Pending Order
        </h2>

        <AlertContainer />

        {order && (order.confirmStatus === "0" || order.payment?.status === "0") && (
          <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 p-4 rounded mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600" />
            <div>
              {order.confirmStatus === "0" && <p className="font-medium">Order not yet confirmed</p>}
              {order.payment?.status === "0" && <p className="font-medium">Order not yet paid</p>}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 border rounded shadow-sm bg-white">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
              Order Details
            </h3>
            <p>
              <strong>Order Number:</strong> #{order?.bookingCode || "-"}
            </p>
            <p>
              <strong>Order Date:</strong> {formatToCustom(order?.createdAt || "-")}
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

        <div className="p-4 border rounded shadow-sm bg-white mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-500" />
            Booking Details
          </h3>
          <p>
            <strong>Pickup Date & Time:</strong> {formatToCustom(order?.bookingDate || "-")}
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

        <div className="p-4 border rounded shadow-sm bg-white mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faTruck} className="text-indigo-500" />
            Assign Vehicle & Driver
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* ✅ Vehicle Searchable Dropdown */}
            <div className="relative" ref={vehicleDropdownRef}>
              <label className="block mb-1 font-medium flex items-center gap-1">
                <FontAwesomeIcon icon={faCar} className="text-gray-500" /> Vehicle Number
              </label>

            <div className="relative">
  <input
    type="text"
    placeholder="Search by last 4 digits (ex: 3952)"
    className="w-[410px] border border-gray-300 rounded p-2 pr-10"
    value={selectedVehicleKey ? selectedVehicleLabel : vehicleSearchTerm}
    onChange={(e) => {
      if (selectedVehicleKey) return;
      setVehicleSearchTerm(e.target.value);
      setShowVehicleDropdown(true);
    }}
    onFocus={() => {
      if (!selectedVehicleKey) setShowVehicleDropdown(true);
    }}
    readOnly={!!selectedVehicleKey}
  />

  {/* ✅ Clear icon inside input */}
  {selectedVehicleKey && (
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600"
      onClick={() => {
        setSelectedVehicleKey("");
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


              {/* ✅ Dropdown list */}
              {showVehicleDropdown && !selectedVehicleKey && (
                <div className="absolute z-10 bg-white border border-gray-300 w-[400px] max-h-60 overflow-auto mt-1 rounded shadow">
                  {filteredVehicles.length > 0 ? (
                    <ul>
                      {filteredVehicles.map((v) => (
                        <li
                          key={`${v.vehicleId}::${v.vehicleMasterId}`}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedVehicleKey(`${v.vehicleId}::${v.vehicleMasterId}`);
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
            </div>

            {/* Driver */}
            <div>
              <label className="block mb-1 font-medium flex items-center gap-1">
                <FontAwesomeIcon icon={faIdCard} className="text-gray-500" /> Driver
              </label>

              <select
                className="w-full border border-gray-300 rounded p-2"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">Select Driver</option>
                {drivers.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.driverName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              className={`px-6 py-2 rounded flex items-center gap-2 text-white ${
                !selectedVehicleKey || !selectedDriver || isConfirming
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={handleConfirm}
              disabled={!selectedVehicleKey || !selectedDriver || isConfirming}
            >
              <FontAwesomeIcon icon={faCheckCircle} />
              {isConfirming ? "Confirming..." : "Confirm Booking"}
            </button>

            <button
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 flex items-center gap-2"
              onClick={() => navigate(-1)}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ViewConfirmPendingOrder;
