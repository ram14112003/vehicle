// src/SuperAdmin/pages/Users/viewdetails/viewPaymentPendingList.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faReceipt,
  faUser,
  faCalendarAlt,
  faCar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import PageLayout from "../../../../components/PageLayout";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import config from "../../../../config/config";
import TravelHeader from "../header";

// --- Interfaces ---
interface Booking {
  bookingId: string;
  bookingDate: string;
  bookingCode: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea: string;
  dropPoint: string;
  travellersCount: number;
  createdAt: string;
  userId: string;
  vehicleTypeId: string;
  confirmStatus: string;
  invoice?: Invoice[];
  payment?: {
    paymentId: string;
    status: string;
    amount: string;
    invoices: Invoice[];
    transactionId?: string;
  };
  user?: User;
  vehicle?: Vehicle;
  driver?: Driver;
  vehicleType?: VehicleType;
}

interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceStatus: string;
  startDate: string;
  endDate: string;
  closePending: ClosePending;
  transactionId?: string;
}

interface ClosePending {
  closependingId: string;
  pickupDate: string;
  garageKms: number;
  garageOpenDateTime: string;
  garageCloseDateTime: string;
  guestKms: number;
  guestOpenDateTime: string | null;
  guestCloseDateTime: string | null;
  additionalKms: number;
  additionalHours: number;
  discountAmount: string;
  packageAmount: string;
  totalAmount: string;
  extraDriverBeta: number;
  totalDue: string;
  garageOpenKm: number;
  garageCloseKm: number;
  selectedPackageData: object;
  // optional (your API might include these)
  additionalKmsAmount?: string | number;
  additionalHoursAmount?: string | number;
  advanceAmount?: string | number;
  totalTaxAmount?: string | number;
  extraCharges?: string | number;
  total?: string | number;
}

interface User {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  companyId: string;
  company?: Company;
  userAddress: string;
}

interface Company {
  companyId: string;
  companyName: string;
  companyAddress: string | null;
  managerEmail: string;
}

interface Vehicle {
  vehicleId: string;
  vehicleName: string;
  vehicleTypeId: string;
  localPerHour: number;
  localPerKm: number;
  OutstationPerKm: number;
  OSDriverBata: number;
  vehicleImg: string[];
  availableStatus: string;
  isDeleted: boolean;
  createdAt: string;
  vehicleMaster: {
    vehicleNumber: string;
    vehicleModelName: string;
    vehicleType: string;
    vendorId: string;
    vendor: {
      vendorId: string;
      vendorName: string;
    };
  };
}

interface Driver {
  driverId: string;
  driverName: string;
  driverEmail: string;
  phno: string;
  city: string;
  state: string;
  country: string;
  address: string;
  pincode: string;
  licenseNo: string | null;
  ratings: string | null;
}

interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
  AdvanceBookingHours: string;
  isDeleted: boolean;
  createdAt: string;
}

// --- Helper Functions ---
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

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return "-";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffInMs = Math.abs(end - start);
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} Hrs ${minutes} Mins`;
};

// --- Main Component ---
const UserViewPaymentPending: React.FC = () => {
  const location = useLocation();
  const { invoiceNumber } = (location.state || {}) as { invoiceNumber?: string };
  // kept (not used now) but you had it in state:
  // const { invoiceId, invoiceAmount, userId } = location.state || {};
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axiosInstance.post("/order/getOrdersById", {
          bookingId,
        });
        const bookingData: Booking = res.data?.data;
        if (bookingData) {
          setBooking(bookingData);
        } else {
          setError("Booking data not found.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const handlePayNow = async () => {
    try {
      if (!booking) {
        showToast("Booking not loaded yet.", "error");
        return;
      }

      // NOTE: you had this navigation first
      navigate(`/invoice/user-invoice-details/${booking.userId}`);

      const inv = booking.payment?.invoices?.[0];
      if (!inv) {
        showToast("No invoice found to pay.", "warn");
        return;
      }

      const uid = booking.user?.userId || booking.userId;
      if (!uid) {
        showToast("Missing userId.", "error");
        return;
      }

      const cp = inv.closePending;
      const invoiceAmt = Number(inv.invoiceAmount ?? 0);
      const totalDue = Number(cp?.totalDue ?? 0);
      const totalAmount = Number(cp?.totalAmount ?? 0);

      const amount =
        (Number.isFinite(invoiceAmt) && invoiceAmt > 0 && invoiceAmt) ||
        (Number.isFinite(totalDue) && totalDue > 0 && totalDue) ||
        (Number.isFinite(totalAmount) && totalAmount > 0 && totalAmount) ||
        0;

      if (!amount || !Number.isFinite(amount) || amount <= 0) {
        showToast("Invalid amount to pay.", "error");
        return;
      }

      const customerEmail = booking.user?.email;
      const customerPhone = booking.user?.mobile;

      setPaying(true);

      const initResp = await axiosInstance.post("/closePendingOrder/paymentInitialise", {
        userId: uid,
        bookingId: [booking.bookingId],
        amount,
      });

      if (!initResp.data?.success) {
        showToast(initResp.data?.message || "Payment initialization failed.", "error");
        setPaying(false);
        return;
      }

      const initUrl =
        initResp.data?.paymentUrl ||
        initResp.data?.data?.paymentUrl ||
        initResp.data?.redirectUrl ||
        initResp.data?.raw?.payment_links?.web;

      if (initUrl) {
        window.location.href = initUrl;
        return;
      }

      const sessionResp = await axiosInstance.post("/paymentRoutes/payments/create-session", {
        userId: uid,
        invoiceIds: [inv.invoiceId],
        amount,
        customerEmail,
        customerPhone,
      });

      const paymentUrl =
        sessionResp.data?.paymentUrl ||
        sessionResp.data?.raw?.payment_links?.web ||
        sessionResp.data?.data?.payment_links?.web ||
        sessionResp.data?.redirectUrl ||
        sessionResp.data?.payment_page_url;

      if (!paymentUrl) {
        console.error("Create-session response:", sessionResp.data);
        showToast("Payment session could not be created (no paymentUrl).", "error");
        setPaying(false);
        return;
      }

      sessionStorage.setItem("last_order_id", sessionResp.data?.orderId || "");
      window.location.href = paymentUrl;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("handlePayNow error:", { status, data, err });
      showToast(
        `Payment start failed${status ? ` (HTTP ${status})` : ""}: ${
          data?.message ||
          data?.error?.error_info?.developer_message ||
          err?.message ||
          "Unknown error"
        }`,
        "error"
      );
    } finally {
      setPaying(false);
    }
  };

  const handleResendInvoiceEmail = async (invNo?: string) => {
    if (!invNo) {
      showToast("Invoice number not available!", "error");
      return;
    }

    try {
      const response = await axiosInstance.post("/invoiceRoutes/sendInvoiceReminder", {
        invoiceNumbers: [invNo],
      });

      if (response.data.success) {
        showToast("Invoice email resent successfully!", "success");
      } else {
        showToast("Failed to resend invoice email.", "error");
      }
    } catch (err) {
      console.error("Resend email error:", err);
      showToast("Error resending invoice email", "error");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-medium">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 text-xl font-medium">{error}</div>;
  }

  const firstInvoice = booking?.invoice?.[0];
  const closePending = firstInvoice?.closePending;
  const BASE_URL = config.baseurl.apibaseurl;

  // ✅ FIX: normalize vehicle data (API different shapes) — OUTSIDE any map()
  const vehicleMaster =
    (booking as any)?.vehicle?.vehicleMaster ||
    (booking as any)?.vehicleMaster ||
    (booking as any)?.vehicle?.vehicle?.vehicleMaster ||
    null;

  const vehicleObj =
    (booking as any)?.vehicle ||
    (booking as any)?.vehicleMaster?.vehicle ||
    null;

  const ownerName =
    vehicleMaster?.vendor?.vendorName ||
    vehicleMaster?.vendorName ||
    vehicleObj?.vehicleMaster?.vendor?.vendorName ||
    "-";

  const vehicleModelName =
    vehicleMaster?.vehicleModelName ||
    vehicleObj?.vehicleMaster?.vehicleModelName ||
    vehicleObj?.vehicleName ||
    "-";

  const vehicleTypeName =
    vehicleMaster?.vehicleType ||
    booking?.vehicleType?.vehicleType ||
    vehicleObj?.vehicleMaster?.vehicleType ||
    "-";

  const vehicleNumber =
    vehicleMaster?.vehicleNumber ||
    vehicleObj?.vehicleMaster?.vehicleNumber ||
    "-";

  return (
    <>
      <TravelHeader />
      <PageLayout breadcrumbName={booking?.bookingCode || "Order"}>
        <AlertContainer />
        <div className="min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4">
              <h1 className="text-2xl font-bold text-gray-800">View Payment Pending Order</h1>
              <button
                onClick={() => navigate(-1)}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Back
              </button>
            </div>

            {/* Warning Section */}
            {booking && booking.payment?.status === "0" && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faCreditCard} className="text-xl" />
                <p className="font-semibold text-lg">Order not yet paid</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Order + User */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faReceipt} className="mr-2 text-purple-500" />
                    <h2>Order Details</h2>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium text-gray-800">Order Number:</span>{" "}
                      {booking?.bookingCode || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Order Date:</span>{" "}
                      {formatToCustom(booking?.createdAt || "-")}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-white text-xs font-semibold ${
                          booking?.payment?.status === "0" ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {booking?.payment?.status === "0" ? "Paid" : "Not Paid"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
                    <h2>User Details</h2>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium text-gray-800">Company Name:</span>{" "}
                      {booking?.user?.company?.companyName || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">User Name:</span>{" "}
                      {booking?.user?.username || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Email Address:</span>{" "}
                      {booking?.user?.email || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Phone Number:</span>{" "}
                      {booking?.user?.mobile || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Address:</span>{" "}
                      {booking?.user?.userAddress || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking + Package */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-500" />
                    <h2>Booking Details</h2>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium text-gray-800">Pickup Date and Time:</span>{" "}
                      {formatToCustom(booking?.bookingDate || "-")}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Pickup City:</span>{" "}
                      {booking?.pickupCity || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Pickup Point:</span>{" "}
                      {booking?.pickupArea || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Drop Point:</span>{" "}
                      {booking?.dropPoint || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Travel Package:</span>{" "}
                      {booking?.pickupPoint || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Vehicle Type:</span>{" "}
                      {booking?.vehicleType?.vehicleType || "-"}
                    </p>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faCar} className="mr-2 text-orange-500" />
                    <h2>Package Details</h2>
                  </div>
                  <div className="flex items-center space-x-4">
            <img
  src={
    vehicleObj?.vehicleImg?.[0]
      ? `${BASE_URL}/uploads/vehicleImg/${vehicleObj.vehicleImg[0]}`
      : "https://via.placeholder.com/150"
  }
  alt={vehicleObj?.vehicleName || "Vehicle"}
  className="w-24 h-24 object-cover rounded-md shadow-sm"
/>
                    <div className="text-sm text-gray-700 space-y-1">
                     
<p>
  <span className="font-medium text-gray-800">Vehicle Name:</span>{" "}
  {vehicleObj?.vehicleName || "-"}
</p>
                      <p>
                        <span className="font-medium text-gray-800">Kilo Meters:</span>{" "}
                        {closePending?.garageKms || "-"} Km
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Hours:</span>{" "}
                        {closePending?.additionalHours || "-"} Hrs
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Plan Amount:</span> ₹{" "}
                        {Number(closePending?.packageAmount || 0).toFixed(2)}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">Package:</span>{" "}
                        {closePending?.selectedPackageData &&
                        typeof closePending.selectedPackageData === "object"
                          ? (closePending.selectedPackageData as any).label || "-"
                          : "-"}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">Package Type:</span>{" "}
                        {closePending?.selectedPackageData &&
                        typeof closePending.selectedPackageData === "object"
                          ? (closePending.selectedPackageData as any).packageType || "-"
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Details */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faReceipt} className="mr-2 text-red-500" />
                  <h2>Order Summary Details</h2>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
                  {closePending &&
                    Object.entries(closePending)
                      .filter(([key, value]) => {
                        const numericFields = [
                          "packageAmount",
                          "extraDriverBeta",
                          "additionalKmsAmount",
                          "additionalHoursAmount",
                          "advanceAmount",
                          "totalTaxAmount",
                          "extraCharges",
                          "discountAmount",
                          "totalAmount",
                          "total",
                        ];
                        if (!numericFields.includes(key)) return false;
                        if (!value || Number(value) === 0) return false;
                        return true;
                      })
                      .sort(([keyA], [keyB]) => {
                        const order = [
                          "packageAmount",
                          "extraDriverBeta",
                          "additionalKmsAmount",
                          "additionalHoursAmount",
                          "totalAmount",
                          "totalTaxAmount",
                          "extraCharges",
                          "discountAmount",
                          "total",
                          "advanceAmount",
                        ];
                        return order.indexOf(keyA) - order.indexOf(keyB);
                      })
                      .map(([key, value]) => {
                        const numValue = Number(value);
                        let sign = "+";
                        if (key === "advanceAmount" || key === "discountAmount") sign = "-";

                        const formattedKey = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase());

                        const underlineClass =
                          key === "totalAmount" || key === "total"
                            ? "border-t pt-2 mt-2 font-bold text-gray-900"
                            : "";

                        return (
                          <React.Fragment key={key}>
                            <div className={`font-medium ${underlineClass}`}>{formattedKey}</div>
                            <div className={`text-right ${underlineClass}`}>
                              {sign} ₹ {Math.abs(numValue).toFixed(2)}
                            </div>
                          </React.Fragment>
                        );
                      })}

                  {closePending?.totalDue && Number(closePending.totalDue) > 0 && (
                    <div className="col-span-2 border-t mt-2 pt-2 flex justify-between font-bold text-base text-gray-800">
                      <span>Total Due</span>
                      <span>₹ {Number(closePending.totalDue).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice List */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faReceipt} className="mr-2 text-blue-500 " />
                  <h2>Invoice List</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left table-auto">
                    <thead>
                      <tr className="border-b-2 text-gray-600">
                        <th className="py-2 px-1">#Invoice Number</th>
                        <th className="py-2 px-1">Invoice Date</th>
                        <th className="py-2 px-1">Invoice Amount (Rs)</th>
                        <th className="py-2 px-1">Discount (Rs)</th>
                        <th className="py-2 px-1 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b text-sm text-gray-800">
                        <td className="py-2 px-1">{firstInvoice?.invoiceNumber || "-"}</td>
                        <td className="py-2 px-1">{formatToCustom(booking?.createdAt || "-")}</td>
                        <td className="py-2 px-1">
                          ₹ {Number(firstInvoice?.invoiceAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-1">
                          ₹ {Number(closePending?.discountAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-1 align-middle">
                          <div className="flex justify-center items-center">
                            <button
                              className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600 transition-colors w-24 disabled:opacity-60 disabled:cursor-not-allowed"
                              onClick={handlePayNow}
                              disabled={paying}
                            >
                              {paying ? "Processing..." : "Pay Now"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* optional resend */}
                  {/* <div className="mt-3">
                    <button
                      className="text-sm underline text-blue-600"
                      onClick={() => handleResendInvoiceEmail(firstInvoice?.invoiceNumber)}
                    >
                      Resend Invoice Email
                    </button>
                  </div> */}
                </div>
              </div>

              {/* Vehicle + Driver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faCar} className="mr-2 text-orange-500 " />
                    <h2>Vehicle Details</h2>
                  </div>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium text-gray-800">Vehicle Model:</span>{" "}
                      {vehicleModelName}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Vehicle Type:</span>{" "}
                      {vehicleTypeName}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Vehicle Number:</span>{" "}
                      {vehicleNumber}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Owner:</span> {ownerName}
                    </p>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
                    <h2>Driver Details</h2>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium text-gray-800">Name:</span>{" "}
                      {booking?.driver?.driverName || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Email:</span>{" "}
                      {booking?.driver?.driverEmail || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Phone:</span>{" "}
                      {booking?.driver?.phno || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Address:</span>{" "}
                      {booking?.driver?.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Garage Details */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faClock} className="mr-2 text-red-500" />
                  <h2>Garage Details</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm text-gray-700">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2 text-left"></th>
                        <th className="border px-4 py-2 text-left">Garage Open</th>
                        <th className="border px-4 py-2 text-left">Garage Close</th>
                        <th className="border px-4 py-2 text-left">Usage Garage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-4 py-2">Km(s)</td>
                        <td className="border px-4 py-2">{closePending?.garageOpenKm || "-"}</td>
                        <td className="border px-4 py-2">{closePending?.garageCloseKm || "-"}</td>
                        <td className="border px-4 py-2">{closePending?.garageKms || "-"}</td>
                      </tr>

                      <tr>
                        <td className="border px-4 py-2 font-semibold">Date & Time</td>
                        <td className="border px-4 py-2">
                          {closePending?.garageOpenDateTime
                            ? formatToCustom(closePending.garageOpenDateTime)
                            : "-"}
                        </td>
                        <td className="border px-4 py-2">
                          {closePending?.garageCloseDateTime
                            ? formatToCustom(closePending.garageCloseDateTime)
                            : "-"}
                        </td>
                        <td className="border px-4 py-2">
                          {closePending?.garageOpenDateTime && closePending?.garageCloseDateTime
                            ? calculateDuration(
                                closePending.garageOpenDateTime,
                                closePending.garageCloseDateTime
                              )
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Optional resend invoice email button */}
              {/* <div className="text-center">
                <button
                  className="text-blue-600 underline text-sm"
                  onClick={() => handleResendInvoiceEmail(firstInvoice?.invoiceNumber)}
                >
                  Resend Invoice Email
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default UserViewPaymentPending;