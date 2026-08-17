// src/SuperAdmin/pages/Users/viewdetails/ViewCompletedList.tsx
import React, { useEffect, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import { AlertContainer, showToast } from "../../../../components/AlertBox";
import config from "../../../../config/config";
import TravelHeader from "../header";

interface OrderData {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea: string;
  remarks: string;
  vehicleType: {
    vehicleType: string;
  };
  user: {
    username: string;
    email: string;
    mobile: string;
    userAddress: string;
    company: {
      companyName: string;
      companyAddress?: string | null;
    };
  };
  payment?: {
    paymentMode?: string | null;
    status?: string;
    amount?: string;
    paymentId?: string;
    transactionId?: string;
    createdAt?: string;
    isOnline?: boolean;
  };
  invoice: Array<{
    invoiceId: string;
    invoiceNumber: string;
    invoiceAmount: number;
    invoiceStatus: string;
    startDate: string;
    endDate?: string;
    closePending?: {
      closependingId?: string;
      pickupDate?: string | null;
      garageKms?: number;
      garageOpenDateTime?: string | null;
      garageCloseDateTime?: string | null;
      guestKms?: number;
      guestOpenDateTime?: string | null;
      guestCloseDateTime?: string | null;
      hideGuestDetails?: boolean;
      packageDataId?: string;
      additionalKms?: number;
      additionalHours?: number;
      discountAmount?: string;
      packageAmount?: string;
      additionalKmsAmount?: string | number;
      additionalHoursAmount?: string | number;
      extraCharges?: string;
      extraDriverBeta?: string;
      cgstApplicable?: boolean;
      igstApplicable?: boolean;
      sgstApplicable?: boolean;
      cgstAmount?: string | number;
      igstAmount?: string | number;
      sgstAmount?: string | number;
      totalTaxAmount?: string | number;
      totalAmount?: string | number;
      totalDue?: string | number;
      total?: string | number;
      advanceAmount?: string | number;
      garageOpenKm?: number;
      garageCloseKm?: number;
      guestOpenKm?: number;
      guestCloseKm?: number;
      selectedPackageData?: {
        kms?: number;
        hours?: number;
        label?: string;
        amount?: number;
        driverBeta?: number;
        packageType?: string;
        packageDataId?: string;
      };
      chargesTitle?: string;
      chargesRemarks?: string;
      // sometimes backend nests booking here
      booking?: any;
      vehicle?: any;
    } | null;
    payment?: {
      paymentId?: string;
      status?: string;
      paymentMode?: string;
      isOnline?: boolean;
      amount?: string | number;
      transactionId?: string;
      tax?: string | number;
      createdAt?: string;
    } | null;
    vehicle?: any | null;
  }>;
  vehicle?: any;
  vehicleMaster?: any;
  bookingVehicle?: any;
  driver?: {
    driverName?: string;
    address?: string;
    phno?: string;
  };
}

const UserViewCompletedList: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = config.baseurl.apibaseurl;

  // ---------- helpers ----------
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const statusMap: { [key: string]: string } = {
    "0": "Paid",
    "4": "Paid",
    "1": "Pending",
    "2": "Pending",
    "3": "Pending",
    "5": "Pending",
    "9": "PaymentPaid",
  };

  const getStatusText = (status: string | undefined): string => {
    return status ? statusMap[status] || "Paid" : "Paid";
  };

  // pick first non-empty
  const pick = (...vals: any[]) =>
    vals.find((v) => v !== undefined && v !== null && v !== "");

  // ✅ Universal normalize (handles different API shapes)
  const normalizeVehicle = (od: any) => {
    const inv0 = od?.invoice?.[0];
    const cp = inv0?.closePending;

    // possible vehicle nodes
    const v1 = od?.vehicle;
    const v2 = od?.vehicleMaster?.vehicle; // when vehicleMaster returned directly
    const v3 = od?.bookingVehicle;
    const v4 = inv0?.vehicle;
    const v5 = cp?.vehicle;
    const v6 = cp?.booking?.vehicle;
    const v7 = cp?.booking?.vehicleMaster?.vehicle;

    const vehicleObj = pick(v1, v2, v3, v4, v5, v6, v7);

    // possible vehicleMaster nodes
    const vm1 = vehicleObj?.vehicleMaster;
    const vm2 = od?.vehicleMaster;
    const vm3 = cp?.booking?.vehicleMaster;
    const vm4 = vehicleObj?.vehicle?.vehicleMaster;

    const vehicleMaster = pick(vm1, vm2, vm3, vm4);

    const vehicleTypeName = pick(
      vehicleMaster?.vehicleType,
      od?.vehicleType?.vehicleType,
      od?.vehicleType?.name,
      vehicleObj?.vehicleType?.vehicleType,
      vehicleObj?.vehicleType
    );

    const vehicleModelName = pick(
      vehicleMaster?.vehicleModelName,
      vehicleObj?.vehicleName,
      vehicleObj?.vehicleModelName
    );

    const vehicleNumber = pick(vehicleMaster?.vehicleNumber, vehicleObj?.vehicleNumber);

    const ownerName = pick(
      vehicleMaster?.vendor?.vendorName,
      vehicleMaster?.vendorName,
      vehicleObj?.vehicleMaster?.vendor?.vendorName
    );

    const imgFile = pick(
      vehicleObj?.vehicleImg?.[0],
      vehicleObj?.vehicleImages?.[0],
      vehicleMaster?.vehicleImg?.[0]
    );

    const imgUrl = imgFile
      ? String(imgFile).startsWith("http")
        ? imgFile
        : `${BASE_URL}/uploads/vehicleImg/${imgFile}`
      : "https://via.placeholder.com/150";

    return { vehicleObj, vehicleMaster, vehicleTypeName, vehicleModelName, vehicleNumber, ownerName, imgUrl };
  };

  // ---------- fetch ----------
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!bookingId) {
        setError("No booking ID provided.");
        setLoading(false);
        showToast("Error: No booking ID found.", "error");
        return;
      }

      try {
        const response = await axiosInstance.post<{
          success: boolean;
          message: string;
          data: OrderData;
        }>("/order/getOrdersById", { bookingId });

        if (response.data.success) {
          setOrderData(response.data.data);

          // optional debug
          console.log("FULL ORDER =>", response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch data.");
          showToast(response.data.message || "Failed to fetch data.", "error");
        }
      } catch (err: any) {
        console.error("Error fetching order details:", err);
        setError(err.response?.data?.message || "Error fetching order details. Please try again.");
        showToast(err.response?.data?.message || "Error fetching order details.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <PageLayout>
        <div className="p-6 text-center">
          <p>Loading order details...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="p-6 text-center text-red-500">
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </PageLayout>
    );
  }

  // ---------- normalize invoice ----------
  const invoiceList = orderData?.invoice || [];
  const firstInvoice = invoiceList.length > 0 ? invoiceList[0] : null;
  const invoice = firstInvoice?.closePending ?? null;

  const planAmount = parseFloat(String(invoice?.packageAmount || "0"));
  const usageGarage = (invoice?.garageCloseKm ?? 0) - (invoice?.garageOpenKm ?? 0);

  // ✅ Normalize vehicle + type + image
  const nv = normalizeVehicle(orderData);
  const vehicleTypeName = nv.vehicleTypeName || "-";
  const vehicleModelName = nv.vehicleModelName || "-";
  const vehicleNumber = nv.vehicleNumber || "-";
  const ownerName = nv.ownerName || "-";
  const vehicleImgUrl = nv.imgUrl;
  const vehicleName = nv.vehicleModelName || "-";

  return (
    <>
      <TravelHeader />
      <PageLayout breadcrumbName={orderData?.bookingCode || "Order"}>
        <AlertContainer />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">View Completed Order</h1>
            <button
              onClick={() => navigate(-1)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              Back
            </button>
          </div>

          {/* Order + User */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📝 Order Details</h2>
              <p>
                <b>Order Number:</b> {orderData?.bookingCode || "-"}
              </p>
              <p>
                <b>Order Date:</b>{" "}
                {orderData?.bookingDate ? new Date(orderData.bookingDate).toLocaleString() : "-"}
              </p>

              {/* ✅ payment is in invoice[0].payment */}
              <p>
                <b>Payment Mode:</b> {orderData?.invoice?.[0]?.payment?.paymentMode || "-"}
              </p>

              <p>
                <b>Status:</b> {getStatusText(orderData?.invoice?.[0]?.payment?.status)}
              </p>
            </div>

            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">👤 User Details</h2>
              <p>
                <b>Company Name:</b> {orderData?.user?.company?.companyName || "-"}
              </p>
              <p>
                <b>User Name:</b> {orderData?.user?.username || "-"}
              </p>
              <p>
                <b>Email Address:</b> {orderData?.user?.email || "-"}
              </p>
              <p>
                <b>Phone Number:</b> {orderData?.user?.mobile || "-"}
              </p>
              <p>
                <b>Address:</b> {orderData?.user?.userAddress || "-"}
              </p>
            </div>
          </div>

          {/* Booking + Package */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📅 Booking Details</h2>
              <p>
                <b>Pickup Date and Time:</b> {formatDateTime(invoice?.pickupDate || null)}
              </p>
              <p>
                <b>Pickup City:</b> {orderData?.pickupCity || "-"}
              </p>
              <p>
                <b>Pickup Area:</b> {orderData?.pickupArea || "-"}
              </p>
              <p>
                <b>Pickup Point:</b> {orderData?.pickupPoint || "-"}
              </p>
              <p>
                <b>Vehicle Type:</b> {vehicleTypeName}
              </p>
            </div>

            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚗 Package Details</h2>
              <p>
                <b>Package Name:</b> {invoice?.selectedPackageData?.label || "-"}
              </p>
              <p>
                <b>Kilo Meter:</b> {invoice?.selectedPackageData?.kms ?? "-"}
              </p>
              <p>
                <b>Hour(s):</b> {invoice?.selectedPackageData?.hours ?? "-"}
              </p>
              <p>
                <b>Plan Amount:</b> ₹{planAmount.toFixed(2)}
              </p>

              {/* ✅ image + vehicle name from normalized */}
              <img
                src={vehicleImgUrl}
                alt={vehicleName}
                className="w-50 h-40 object-cover rounded-md shadow-sm mt-3"
              />
              <p className="mt-2">
                <b>Vehicle Name:</b> {vehicleName}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📊 Order Summary Details</h2>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
              {invoice &&
                Object.entries(invoice)
                  .filter(([key, value]) => {
                    const numericFields = [
                      "packageAmount",
                      "discountAmount",
                      "additionalKmsAmount",
                      "additionalHoursAmount",
                      "totalTaxAmount",
                      "extraCharges",
                      "extraDriverBeta",
                      "totalDue",
                      "totalAmount",
                      "total",
                      "advanceAmount",
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
                      "totalDue",
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

                    const isUnderline = key === "totalAmount" || key === "total" || key === "totalDue";
                    const underlineClass = isUnderline ? "border-t pt-2 mt-2 font-bold text-gray-900" : "";

                    return (
                      <React.Fragment key={key}>
                        <div className={`font-medium ${underlineClass}`}>{formattedKey}</div>
                        <div className={`text-right ${underlineClass}`}>
                          {sign} ₹ {Math.abs(numValue).toFixed(2)}
                        </div>
                      </React.Fragment>
                    );
                  })}
            </div>
          </div>

          {/* Vehicle + Driver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚘 Vehicle Details</h2>
              <p>
                <b>Vehicle Type:</b> {vehicleTypeName}
              </p>
              <p>
                <b>Vehicle Model:</b> {vehicleModelName}
              </p>
              <p>
                <b>Vehicle Number:</b> {vehicleNumber}
              </p>
              <p>
                <b>Owner Name:</b> {ownerName}
              </p>
            </div>

            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">👨‍✈️ Driver Details</h2>
              <p>
                <b>Driver Name:</b> {orderData?.driver?.driverName || "-"}
              </p>
              <p>
                <b>Address:</b> {orderData?.driver?.address || "-"}
              </p>
              <p>
                <b>Phone Number:</b> {orderData?.driver?.phno || "-"}
              </p>
            </div>
          </div>

          {/* Invoice List */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🧾 Invoice List</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">#Invoice Number</th>
                  <th className="p-2 border">Invoice Date</th>
                  <th className="p-2 border">Invoice Amount</th>
                  <th className="p-2 border">Discount</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoiceList.map((inv, index) => (
                  <tr key={inv.invoiceId || index}>
                    <td className="p-2 border">{inv.invoiceNumber || "-"}</td>
                    <td className="p-2 border">{formatDateTime(inv.startDate || null)}</td>
                    <td className="p-2 border">₹{Number(inv.invoiceAmount ?? 0).toFixed(2)}</td>
                    <td className="p-2 border">₹{Number(inv.closePending?.discountAmount ?? 0).toFixed(2)}</td>
                    <td className="p-2 border font-semibold">{getStatusText(inv.invoiceStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment List */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">💳 Payment List</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Payment Mode</th>
                  <th className="p-2 border">Payment Date</th>
                  <th className="p-2 border">Amount Paid</th>
                  <th className="p-2 border">Transaction ID</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoiceList.map((inv, index) => {
                  const pay = inv.payment;
                  return (
                    <tr key={pay?.paymentId || index}>
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border">{pay?.paymentMode || "-"}</td>
                      <td className="p-2 border">{formatDateTime(pay?.createdAt || null)}</td>
                      <td className="p-2 border">₹{Number(inv.invoiceAmount ?? 0).toFixed(2)}</td>
                      <td className="p-2 border">{pay?.transactionId || "-"}</td>
                      <td className="p-2 border font-semibold">{getStatusText(pay?.status)}</td>
                    </tr>
                  );
                })}
                {invoiceList.every((inv) => !inv.payment) && (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Garage Details */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🏭 Garage Details</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border"></th>
                  <th className="p-2 border">Garage Open</th>
                  <th className="p-2 border">Garage Close</th>
                  <th className="p-2 border">Usage Garage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">Km(s)</td>
                  <td className="p-2 border">{invoice?.garageOpenKm ?? "-"}</td>
                  <td className="p-2 border">{invoice?.garageCloseKm ?? "-"}</td>
                  <td className="p-2 border">{usageGarage || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">Date & Time</td>
                  <td className="p-2 border">{formatDateTime(invoice?.garageOpenDateTime || null)}</td>
                  <td className="p-2 border">{formatDateTime(invoice?.garageCloseDateTime || null)}</td>
                  <td className="p-2 border">
                    {invoice?.garageOpenDateTime && invoice?.garageCloseDateTime
                      ? `${(
                          (new Date(invoice.garageCloseDateTime).getTime() -
                            new Date(invoice.garageOpenDateTime).getTime()) /
                          (1000 * 60 * 60)
                        ).toFixed(2)} hours`
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default UserViewCompletedList;