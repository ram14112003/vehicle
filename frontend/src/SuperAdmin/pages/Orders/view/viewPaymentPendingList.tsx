import React, { useEffect, useMemo, useState } from "react";
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
   faTrash,
} from "@fortawesome/free-solid-svg-icons";
import PageLayout from "../../../../components/PageLayout";
import { showToast, AlertContainer, ActionModal } from "../../../../components/AlertBox";
import config from "../../../../config/config";

// ----------------- Regular Interfaces -----------------
interface Booking {
  bookingId: string;
  bookingDate: string;
  bookingCode: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea: string;
  dropPoint: string;
  createdAt: string;
  userId: string;
  confirmStatus: string;

  invoice?: Invoice[];
  payment?: {
    paymentId?: string;
    status: string;
    amount?: string;
    invoices: Invoice[];
    transactionId?: string;
  };

  user?: User;
  driver?: Driver;
  vehicleType?: VehicleType;

  // ✅ NEW (because your getOrdersById returns vehicleMaster directly)
  vehicleMaster?: VehicleMaster;
}

interface VehicleMaster {
  vehicleMasterId: string;
  vehicleNumber: string;
  vehicleModelName: string;
  vehicleType: string;
  vendorName?: string;
  vendor?: { vendorName: string };
  vehicle?: Vehicle; // ✅ nested vehicle details
}

interface Vehicle {
  vehicleId: string;
  vehicleName: string;
  vehicleImg: string[];
  manufacturing?: string;
  availableStatus?: string;
}

interface Invoice {
  invoiceId: string;
  monthlyBookingCode: string;
  invoiceAmount: number;
  invoiceStatus: string;
  startDate: string;
  endDate: string;
  closePending: ClosePending;
}

type ExtraChargeItem = { title: string; amount: number; remarks?: string };


interface ClosePending {
  closependingId: string;
  pickupDate: string;
  garageKms: number;
  usageHours:string;
  garageOpenDateTime: string;
  garageCloseDateTime: string;
  additionalKms: number;
  additionalHours: number;
  discountAmount: string;
  packageAmount: string;
  totalAmount: string;
  extraDriverBeta: number;
  totalDue: string;
  garageOpenKm: number;
  garageCloseKm: number;
  selectedPackageData: any;
extraChargesBreakup?: ExtraChargeItem[];
  additionalKmsAmount?: any;
  additionalHoursAmount?: any;
  totalTaxAmount?: any;
  extraCharges?: any;
  advanceAmount?: any;
  total?: any;
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

interface Driver {
  driverId: string;
  driverName: string;
  driverEmail: string;
  phno: string;
  address: string;
}

interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
}

// ----------------- Monthly Details -----------------
type MonthlyDetails = {
  monthlyInvoice: {
    monthlyInvoiceId: string;
     monthlyBookingCode: string;
    invoiceDate: string;
    invoiceMonth: string;
    companyId: string;
    companyName: string;
    vehicleTypeId: string;
    vehicleTypeName: string;
    vehicleNumber: string;
    packageDetails: {
      km: number;
      hours: number;
      label: string;
      title: string;
      amount: number;
      packageId: string;
      extraKmRate: number;
    };
    extraKm: number;
    extraDays: number;
    extraChargeType: string;
    extraChargesInputAmount: number;
    extraChargesBreakup?: string;
    discount: number;
    advance: number;
    packageAmount: number;
    extraKmAmount: number;
    extraDaysAmount: number;
    extraHrsAmount:number;
    netTotal: number;
    taxes: { taxId: string; amount: number; taxName: string; taxPercent: number }[];
    totalTaxAmount: number;
    finalTotal: number;
    balanceDue: number;
    monthlyInvoiceItems?: any[];
    createdAt: string;
  };
  invoice: {
    invoiceId: string;
    monthlyBookingCode: string;
    startDate: string;
    endDate: string;
    invoiceAmount: number;
    invoiceStatus: string;
    paymentId: string | null;
    createdAt: string;
  } | null;
  company: {
    companyId: string;
    companyName: string;
    companyAddress: string | null;
    managerEmail?: string | null;
    gstNo?: string | null;
  };
  vehicles: Array<{
    vehicleId: string;
    vehicleName: string;
    vehicleImg: string[];
    vehicleMaster: {
      vehicleNumber: string;
      vehicleModelName: string;
      vehicleType: string;
      vendorName: string;
    };
  }>;
  payment: any | null;
};

// ----------------- Helpers -----------------
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

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return "-";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffInMs = Math.abs(end - start);
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} Hrs ${minutes} Mins`;
};

// ----------------- Component -----------------
const ViewPaymentPendingList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { bookingId } = useParams<{ bookingId: string }>();
  const query = new URLSearchParams(location.search);
  const viewType = (query.get("type") || "regular") as "regular" | "monthly";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDetails | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sendingRegularEmail, setSendingRegularEmail] = useState(false);
const [sendingMonthlyEmail, setSendingMonthlyEmail] = useState(false);
const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
const [isDeleteMonthlyModalOpen, setIsDeleteMonthlyModalOpen] = useState(false);
const [deletingMonthly, setDeletingMonthly] = useState(false);
  // ✅ monthly vehicle select
  const monthlyVehicle = useMemo(() => {
    const m = monthlyData?.monthlyInvoice;
    const vehicles = monthlyData?.vehicles || [];
    if (!m || !vehicles.length) return null;

    const match = m.vehicleNumber
      ? vehicles.find((v) => v.vehicleMaster?.vehicleNumber === m.vehicleNumber)
      : null;

    return match || vehicles[0];
  }, [monthlyData]);

  const BASE_URL = config.baseurl.apibaseurl;

  // ---------------- Fetch ----------------
  useEffect(() => {
    if (!bookingId) {
      setError("ID is missing.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (viewType === "monthly") {
          const res = await axiosInstance.get<{
            success: boolean;
            message: string;
            data: MonthlyDetails;
          }>(`/closePendingOrder/monthlyInvoice/${bookingId}/details`);

          if (res.data.success) {
            setMonthlyData(res.data.data);
            setBooking(null);
          } else {
            setError(res.data.message || "Failed to fetch monthly details");
          }
        } else {
          const res = await axiosInstance.post("/order/getOrdersById", { bookingId });
          const bookingData = res.data?.data;

          if (bookingData) {
            const mappedData: Booking = {
              ...bookingData,
              // ✅ ensure payment object for UI
              payment: {
                status: bookingData?.invoice?.[0]?.invoiceStatus || "0",
                invoices: bookingData?.invoice || [],
                transactionId: bookingData?.payment?.transactionId || "",
              },

              // ✅ KEY FIX: vehicleMaster comes directly from API
              vehicleMaster: bookingData?.vehicleMaster || null,
            };

            setBooking(mappedData);
            setMonthlyData(null);
          } else {
            setError("Booking data not found.");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, viewType]);

// ✅ NEW: resend closepending-style invoice email (same format as createClosePending)
const handleResendInvoiceEmail = async () => {
  if (!booking?.bookingId) {
    showToast("Booking ID not available!", "error");
    return;
  }

  if (sendingRegularEmail) return; // ✅ double click avoid

  try {
    setSendingRegularEmail(true);

    const resp = await axiosInstance.post(
      "/invoiceRoutes/invoice/resend-closepending-email",
      { bookingId: booking.bookingId }
    );

    if (resp.data?.success) {
      showToast("Invoice email resent successfully!", "success");
    } else {
      showToast(resp.data?.message || "Failed to resend invoice email.", "error");
    }
  } catch (err: any) {
    console.error("Resend email error:", err);
    showToast(err?.response?.data?.message || "Error resending invoice email", "error");
  } finally {
    setSendingRegularEmail(false);
  }
};



  const handlePayInvoiceClick = () => {
    if (booking && booking.payment?.invoices?.[0]) {
      const invoice = booking.payment.invoices[0];
      const paymentTxn = booking.payment?.transactionId || "";

      navigate(`/invoice/paymentfor`, {
        state: {
          invoiceId: invoice.invoiceId,
          bookingId: booking.bookingId,
          transactionId: paymentTxn,
        },
      });
    } else {
      showToast("Required data is not available to proceed with payment.", "warn");
    }
  };

  const handleCancelInvoice = async () => {
    if (!bookingId) {
      showToast("Booking ID is missing!", "error");
      return;
    }
    try {
      const response = await axiosInstance.put("/invoiceRoutes/invoice/cancelInvoice", { bookingId });
      if (response.status === 200) {
        showToast("Invoice cancelled successfully!", "success");
        setTimeout(() => navigate("/orders/closepending"), 1200);
      } else {
        showToast(response.data?.message || "Failed to cancel invoice", "error");
      }
    } catch (error: any) {
      console.error("Cancel invoice error:", error);
      showToast(error.response?.data?.message || "Error cancelling invoice", "error");
    }
  };

  // ---------------- Actions (MONTHLY) ----------------
const handleResendMonthlyInvoiceEmail = async (monthlyInvoiceId?: string) => {
  if (!monthlyInvoiceId) {
    showToast("Monthly Invoice ID not available!", "error");
    return;
  }

  if (sendingMonthlyEmail) return; // ✅ double click avoid

  try {
    setSendingMonthlyEmail(true);

    const response = await axiosInstance.post(
      "/closePendingOrder/monthlyInvoice/resend",
      { monthlyInvoiceId }
    );

    if (response.data.success) {
      showToast("Monthly invoice email resent successfully!", "success");
    } else {
      showToast(response.data.message || "Failed to resend monthly invoice email.", "error");
    }
  } catch (err) {
    console.error("Resend monthly invoice error:", err);
    showToast("Error resending monthly invoice email", "error");
  } finally {
    setSendingMonthlyEmail(false);
  }
};



  const handlePayMonthlyInvoice = () => {
    const inv = monthlyData?.invoice;
    const mid = monthlyData?.monthlyInvoice?.monthlyInvoiceId;

    if (!inv?.invoiceId || !mid) {
      showToast("InvoiceId / MonthlyInvoiceId not found", "error");
      return;
    }

    navigate(`/invoice/paymentformonthly`, {
      state: {
        invoiceId: inv.invoiceId,
        monthlyInvoiceId: mid,
        transactionId: "",
      },
    });
  };

  const handleCancelMonthlyInvoice = async () => {
    showToast("Monthly cancel API not connected (need endpoint).", "warn");
  };

  const handleDeleteMonthlyInvoice = async () => {
  const monthlyInvoiceId = monthlyData?.monthlyInvoice?.monthlyInvoiceId;
  if (!monthlyInvoiceId) {
    showToast("Monthly Invoice ID not available!", "error");
    return;
  }
  if (deletingMonthly) return;

  try {
    setDeletingMonthly(true);
    const res = await axiosInstance.delete(
      `/closePendingOrder/monthlyInvoice/${monthlyInvoiceId}`
    );
    if (res.data?.success) {
      showToast("Monthly invoice deleted successfully!", "success");
      setIsDeleteMonthlyModalOpen(false);
      setTimeout(() => navigate("/orders/paymentpending"), 1000);
    } else {
      showToast(res.data?.message || "Failed to delete monthly invoice", "error");
    }
  } catch (err: any) {
    console.error("Delete monthly invoice error:", err);
    showToast(err?.response?.data?.message || "Error deleting monthly invoice", "error");
  } finally {
    setDeletingMonthly(false);
  }
};

  // ---------------- States ----------------
  if (loading) return <div className="p-8 text-center text-xl font-medium">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500 text-xl font-medium">{error}</div>;

  // ===================== MONTHLY VIEW UI =====================
  if (viewType === "monthly") {
    const m = monthlyData?.monthlyInvoice;
    const inv = monthlyData?.invoice;
    const company = monthlyData?.company;

    const vehicle = monthlyVehicle;

    return (
      <PageLayout breadcrumbName={m?.monthlyBookingCode || m?.monthlyInvoiceId || "Monthly Pending"}>
        <AlertContainer />
        <ActionModal
  isOpen={isDeleteMonthlyModalOpen}
  type="confirm-delete"
  onClose={() => setIsDeleteMonthlyModalOpen(false)}
  onConfirm={handleDeleteMonthlyInvoice}
  itemName="this monthly invoice"
/>
        <div className="min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 pb-4">
              <h1 className="text-2xl font-bold text-gray-800">View Monthly Payment Pending</h1>
              <button
                onClick={() => navigate(-1)}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Back
              </button>
            </div>

            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faCreditCard} className="text-xl" />
              <p className="font-semibold text-lg">Monthly invoice not yet paid</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faReceipt} className="mr-2 text-purple-500" />
                    <h2>Invoice Details</h2>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Invoice Number:</span> {m?.monthlyBookingCode || "-"}</p>
                    <p><span className="font-medium">Invoice Date:</span> {formatToCustom(m?.invoiceDate || "")}</p>
                    <p><span className="font-medium">Invoice Month:</span> {m?.invoiceMonth || "-"}</p>
                    <p><span className="font-medium">Invoice Amount:</span> ₹ {Number(inv?.invoiceAmount || m?.finalTotal || 0).toFixed(2)}</p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2 px-2 py-1 rounded text-white text-xs font-semibold bg-red-500">
                        Not Paid
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
                    <h2>Company Details</h2>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Company Name:</span> {company?.companyName || m?.companyName || "-"}</p>
                    <p><span className="font-medium">Company Address:</span> {company?.companyAddress || "-"}</p>
                    <p><span className="font-medium">Manager Email:</span> {company?.managerEmail || "-"}</p>
                    <p><span className="font-medium">Monthly Invoice ID:</span> {m?.monthlyInvoiceId || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Route Items Details */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faCar} className="mr-2 text-blue-500" />
                  <h2>Route Items Details ({(m?.monthlyInvoiceItems || []).length || 1} Routes)</h2>
                </div>

                <div className="space-y-3">
                  {(m?.monthlyInvoiceItems && m.monthlyInvoiceItems.length > 0
                    ? m.monthlyInvoiceItems
                    : [m]
                  ).map((item: any, idx: number) => {
                    const pkg = typeof item.packageDetails === "string" ? JSON.parse(item.packageDetails || "{}") : (item.packageDetails || {});
                    return (
                      <div key={item.monthlyInvoiceItemId || idx} className="border border-gray-200 rounded-md p-3 bg-gray-50 text-sm space-y-2">
                        <div className="flex justify-between items-center font-bold text-gray-800 border-b border-gray-200 pb-1">
                          <span>Route #{idx + 1}: {item.route || "—"}</span>
                          <span className="text-blue-600 font-mono">Vehicle: {item.vehicleNumber || "—"} ({item.vehicleTypeName || "—"})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-gray-700">
                          <div><span className="font-medium text-gray-800">Package:</span> {pkg.label || pkg.title || "Monthly Package"} (₹{Number(item.packageAmount || 0).toFixed(2)})</div>
                          <div><span className="font-medium text-gray-800">Extra Usage:</span> {item.extraKm || 0} km | {item.extraDays || 0} days | {item.extraHrs || 0} hrs</div>
                          <div><span className="font-medium text-gray-800">Extra Charges:</span> ₹{Number(item.extraChargesInputAmount || 0).toFixed(2)}</div>
                          <div><span className="font-medium text-gray-800">Sub Total:</span> ₹{Number(item.netTotal || 0).toFixed(2)}</div>
                          <div><span className="font-medium text-gray-800">Tax Amount:</span> ₹{Number(item.totalTaxAmount || 0).toFixed(2)}</div>
                          <div><span className="font-medium text-gray-800">Item Total:</span> <b className="text-gray-900">₹{Number(item.finalTotal || 0).toFixed(2)}</b></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faReceipt} className="mr-2 text-red-500" />
                  <h2>Order Summary Details</h2>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
{m && (() => {

  const items =
    m.monthlyInvoiceItems && m.monthlyInvoiceItems.length > 0
      ? m.monthlyInvoiceItems
      : [m];

  const sum = (key: string) =>
    items.reduce(
      (total: number, item: any) =>
        total + Number(item[key] || 0),
      0
    );

  const packageAmount = sum("packageAmount");
  const extraKmAmount = sum("extraKmAmount");
  const extraDaysAmount = sum("extraDaysAmount");
  const extraHrsAmount = sum("extraHrsAmount");
  const netTotal = sum("netTotal");
  const totalTaxAmount = sum("totalTaxAmount");
  const finalTotal = sum("finalTotal");
  const discount = sum("discount");
  const advance = sum("advance");
  const balanceDue = sum("balanceDue");

  // merge all extra charges
  const extraChargeTotals: Record<string, number> = {};

  items.forEach((item: any) => {
    const arr = Array.isArray(item.extraCharges)
      ? item.extraCharges
      : [];

    arr.forEach((x: any) => {
      if (!extraChargeTotals[x.type]) {
        extraChargeTotals[x.type] = 0;
      }

      extraChargeTotals[x.type] += Number(x.amount || 0);
    });
  });

  const extraChargesTypeLabel = (t: string) =>
    t === "toll"
      ? "Tollgate Charges"
      : t === "parking"
      ? "Parking Charges"
      : t === "permit"
      ? "Permit Charges"
      : "Other Charges";
      
    
 const baseRows = [
  ["Package Amount", packageAmount, "+"],
  ["Extra KM Amount", extraKmAmount, "+"],
  ["Extra Days Amount", extraDaysAmount, "+"],
  ["Extra Hours Amount", extraHrsAmount, "+"],
];

  // ✅ extraCharges la irundhu (type/amount) dhan correct breakup varum
  const extraChargesArr: any[] = Array.isArray((m as any).extraCharges)
    ? (m as any).extraCharges
    : [];

 const extraChargeRows = Object.entries(extraChargeTotals).map(
  ([type, amount]) => [
    extraChargesTypeLabel(type),
    amount,
    "+"
  ] as [string, any, "+" | "-"]
);

const tailRows = [
  ["Discount", discount, "-"],
  ["Advance", advance, "-"],
  ["Net Total", netTotal, "+"],
  ["Total Tax Amount", totalTaxAmount, "+"],
  ["Final Total", finalTotal, "+"],
];

  const allRows = [...baseRows, ...extraChargeRows, ...tailRows].filter(
    ([, v]) => Number(v) !== 0
  );

  return (
    <>
      {allRows.map(([label, value, sign], idx) => (
        <React.Fragment key={`${label}-${idx}`}>
          <div className="font-medium">{label}</div>
          <div className="text-right">
            {sign} ₹ {Math.abs(Number(value)).toFixed(2)}
          </div>
        </React.Fragment>
      ))}

      <div className="col-span-2 border-t mt-2 pt-2 flex justify-between font-bold text-base text-gray-800">
        <span>Balance Due</span>
  <span>₹ {Math.round(balanceDue)}</span>
      </div>
    </>
  );
})()}
                </div>
              </div>

              {/* Actions */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faReceipt} className="mr-2 text-blue-500" />
                  <h2>Invoice Actions</h2>
                </div>

                <div className="flex gap-2 flex-wrap">
<button
  className={`text-white text-sm px-3 py-2 rounded transition-colors ${
    sendingMonthlyEmail ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
  }`}
  onClick={() => handleResendMonthlyInvoiceEmail(monthlyData?.monthlyInvoice?.monthlyInvoiceId)}
  disabled={sendingMonthlyEmail}
>
  {sendingMonthlyEmail ? "Sending..." : "Resend Invoice Email"}
</button>

<button
  className={`text-white text-sm px-3 py-2 rounded transition-colors flex items-center gap-1 ${
    deletingMonthly ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
  }`}
  onClick={() => setIsDeleteMonthlyModalOpen(true)}
  disabled={deletingMonthly}
>
  <FontAwesomeIcon icon={faTrash} />
  {deletingMonthly ? "Deleting..." : "Delete"}
</button>
                  <button
                    className="bg-green-500 text-white text-sm px-3 py-2 rounded hover:bg-green-600"
                    onClick={handlePayMonthlyInvoice}
                  >
                    Pay Invoice
                  </button>

                  {/* <button
                    className="bg-violet-500 text-white text-sm px-3 py-2 rounded hover:bg-violet-600"
                    onClick={handleCancelMonthlyInvoice}
                  >
                    Cancel
                  </button> */}
                </div>
              </div>
            </div>

          </div>
        </div>
      </PageLayout>
    );
  }

  // ===================== REGULAR VIEW =====================
  const firstInvoice = booking?.payment?.invoices?.[0] || booking?.invoice?.[0];
  const closePending = firstInvoice?.closePending;

  const usageGarageDuration =
    closePending?.garageOpenDateTime && closePending?.garageCloseDateTime
      ? calculateDuration(closePending.garageOpenDateTime, closePending.garageCloseDateTime)
      : "-";

  if (!booking) return null;

  // ✅ key vehicle objects
  const vm = booking.vehicleMaster;
  const veh = booking.vehicleMaster?.vehicle;

  return (
    <PageLayout breadcrumbName={booking?.bookingCode || "Order"}>
      <AlertContainer />
      <ActionModal
  isOpen={isCancelModalOpen}
  type="confirm-cancel"
  onClose={() => setIsCancelModalOpen(false)}
  onConfirm={handleCancelInvoice}
  itemName="this invoice"
/>

      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto ">
          <div className="flex justify-between items-center mb-6 pb-4">
            <h1 className="text-2xl font-bold text-gray-800">View Payment Pending Order</h1>
            <button
              onClick={() => navigate(-1)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              Back
            </button>
          </div>

          {booking.payment?.status === "0" && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faCreditCard} className="text-xl" />
              <p className="font-semibold text-lg">Order not yet paid</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Order Details & User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faReceipt} className="mr-2 text-purple-500" />
                  <h2>Order Details</h2>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium text-gray-800">Order Number:</span> {booking.bookingCode || "-"}</p>
                  <p><span className="font-medium text-gray-800">Order Date:</span> {formatToCustom(booking.createdAt || "-")}</p>
                  <p>
                    <span className="font-medium text-gray-800">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-white text-xs font-semibold ${
                      booking.payment?.status === "0" ? "bg-red-500" : "bg-green-500"
                    }`}>
                      {booking.payment?.status === "0" ? "Not Paid" : "Paid"}
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
                  <p><span className="font-medium text-gray-800">Company Name:</span> {booking.user?.company?.companyName || "-"}</p>
                  <p><span className="font-medium text-gray-800">User Name:</span> {booking.user?.username || "-"}</p>
                  <p><span className="font-medium text-gray-800">Email Address:</span> {booking.user?.email || "-"}</p>
                  <p><span className="font-medium text-gray-800">Phone Number:</span> {booking.user?.mobile || "-"}</p>
                  <p><span className="font-medium text-gray-800">Address:</span> {booking.user?.userAddress || "-"}</p>
                </div>
              </div>
            </div>

            {/* Booking & Package Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-500" />
                  <h2>Booking Details</h2>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium text-gray-800">Pickup Date and Time:</span> {formatToCustom(booking.bookingDate || "-")}</p>
                  <p><span className="font-medium text-gray-800">Pickup City:</span> {booking.pickupCity || "-"}</p>
                  <p><span className="font-medium text-gray-800">Pickup Point:</span> {booking.pickupArea || "-"}</p>
                  <p><span className="font-medium text-gray-800">Drop Point:</span> {booking.dropPoint || "-"}</p>
                  <p><span className="font-medium text-gray-800">Travel Package:</span> {booking.pickupPoint || "-"}</p>

                  {/* ✅ FIXED */}
                  <p>
                    <span className="font-medium text-gray-800">Vehicle:</span>{" "}
                    {(booking.vehicleType?.vehicleType || vm?.vehicleType || "-")}
                    {" - "}
                    {(vm?.vehicleNumber || "-")}
                  </p>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faCar} className="mr-2 text-orange-500" />
                  <h2>Package Details</h2>
                </div>

                <div className="flex items-center space-x-4">
                  {/* ✅ FIXED IMAGE SOURCE */}
                  <img
                    src={
                      veh?.vehicleImg?.[0]
                        ? `${BASE_URL}/uploads/vehicleImg/${veh.vehicleImg[0]}`
                        : "https://via.placeholder.com/150"
                    }
                    alt={veh?.vehicleName || "Vehicle"}
                    className="w-24 h-24 object-cover rounded-md shadow-sm"
                  />

                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium text-gray-800">Vehicle Name:</span> {veh?.vehicleName || "-"}</p>
                    <p><span className="font-medium text-gray-800">Kilo Meters:</span> {closePending?.garageKms || "-"} Km</p>
                    <p><span className="font-medium text-gray-800">Hours:</span> {usageGarageDuration}</p>
                    <p><span className="font-medium text-gray-800">Plan Amount:</span> ₹ {Number(closePending?.packageAmount || 0).toFixed(2)}</p>
                    <p><span className="font-medium text-gray-800">Package :</span> {(closePending?.selectedPackageData as any)?.label || "-"}</p>
                    <p><span className="font-medium text-gray-800">Package Type:</span> {(closePending?.selectedPackageData as any)?.packageType || "-"}</p>
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
    {closePending && (() => {
      const rows: { label: string; value: number; sign: "+" | "-" ; isBold?: boolean }[] = [];

      const add = (label: string, value: any, sign: "+" | "-" = "+", isBold = false) => {
        const n = Number(value || 0);
        if (!n) return;
        rows.push({ label, value: n, sign, isBold });
      };

      add("Package Amount", closePending.packageAmount, "+");
      add("Extra Driver Beta", closePending.extraDriverBeta, "+");
      add("Additional Kms Amount", closePending.additionalKmsAmount, "+");
      add("Additional Hours Amount", closePending.additionalHoursAmount, "+");
      add("Total Amount", closePending.totalAmount, "+", true);
      add("Total Tax Amount", closePending.totalTaxAmount, "+");

      // ✅ Extra charges breakup (NO TOTAL ROW)
      const breakup = closePending.extraChargesBreakup;
      if (Array.isArray(breakup) && breakup.length > 0) {
        breakup.forEach((x) => {
          add(x?.title || "Extra Charge", x?.amount, "+");
        });
      } else {
        // fallback: if breakup not there, show total
        add("Extra Charges", closePending.extraCharges, "+");
      }

      add("Discount Amount", closePending.discountAmount, "-");
      add("Total", closePending.total, "+", true);
      add("Advance Amount", closePending.advanceAmount, "-");

      return rows.map((r, idx) => (
        <React.Fragment key={idx}>
          <div className={`font-medium ${r.isBold ? "border-t pt-2 mt-2 font-bold text-gray-900" : ""}`}>
            {r.label}
          </div>
          <div className={`text-right ${r.isBold ? "border-t pt-2 mt-2 font-bold text-gray-900" : ""}`}>
            {r.sign} ₹ {Math.abs(Number(r.value)).toFixed(2)}
          </div>
        </React.Fragment>
      ));
    })()}

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
                      <th className="py-2 px-1 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b text-sm text-gray-800">
                      <td className="py-2 px-1">{firstInvoice?.monthlyBookingCode || "-"}</td>
                      <td className="py-2 px-1">{formatToCustom(booking.createdAt || "-")}</td>
                      <td className="py-2 px-1">{`₹ ${firstInvoice?.invoiceAmount?.toFixed(2) || "0.00"}`}</td>
                      <td className="py-2 px-1">{Number(closePending?.discountAmount || 0).toFixed(2)}</td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded w-24 text-center">
                            Not Paid
                          </span>

 <button
  className={`text-white text-xs px-2 py-1 rounded transition-colors w-24 ${
    sendingRegularEmail ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
  }`}
  onClick={handleResendInvoiceEmail}
  disabled={sendingRegularEmail}
>
  {sendingRegularEmail ? "Sending..." : "Resend Email"}
</button>



                          <button
                            className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600 transition-colors w-24"
                            onClick={handlePayInvoiceClick}
                          >
                            Pay
                          </button>

                      <button
  className="bg-violet-500 text-white text-xs px-2 py-1 rounded hover:bg-violet-600 transition-colors w-24"
  onClick={() => setIsCancelModalOpen(true)}
>
  Cancel
</button>

                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle & Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faCar} className="mr-2 text-orange-500 " />
                  <h2>Vehicle Details</h2>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium text-gray-800">Vehicle Model:</span> {vm?.vehicleModelName || "-"}</p>
                  <p><span className="font-medium text-gray-800">Vehicle Type:</span> {vm?.vehicleType || booking.vehicleType?.vehicleType || "-"}</p>
                  <p><span className="font-medium text-gray-800">Vehicle Number:</span> {vm?.vehicleNumber || "-"}</p>
                  <p><span className="font-medium text-gray-800">Owner:</span> {vm?.vendor?.vendorName || vm?.vendorName || "-"}</p>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-xl font-semibold text-gray-800 mb-2">
                  <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
                  <h2>Driver Details</h2>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium text-gray-800">Name:</span> {booking.driver?.driverName || "-"}</p>
                  <p><span className="font-medium text-gray-800">Email:</span> {booking.driver?.driverEmail || "-"}</p>
                  <p><span className="font-medium text-gray-800">Phone:</span> {booking.driver?.phno || "-"}</p>
                  <p><span className="font-medium text-gray-800">Address:</span> {booking.driver?.address || "-"}</p>
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
                        {closePending?.garageOpenDateTime ? formatToCustom(closePending.garageOpenDateTime) : "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {closePending?.garageCloseDateTime ? formatToCustom(closePending.garageCloseDateTime) : "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {closePending?.usageHours || "-"}hrs                   
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ViewPaymentPendingList;