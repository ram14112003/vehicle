// // src/SuperAdmin/pages/Orders/ViewCompletedList.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import PageLayout from "../../../../components/PageLayout";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import axiosInstance from "../../../../utils/axiosInstance";
// import { AlertContainer, showToast } from "../../../../components/AlertBox";
// import config from "../../../../config/config";

// /** ===================== TYPES ===================== */

// interface OrderVehicleMaster {
//   vehicleMasterId?: string;
//   vehicleNumber?: string;
//   vehicleModelName?: string;
//   vehicleType?: string;
//   vendorId?: string;
//   vendorName?: string;
//   vehicleId?: string;
//   vehicle?: {
//     vehicleId?: string;
//     vehicleName?: string;
//     manufacturing?: string;
//     vehicleImg?: string[];
//     availableStatus?: string;
//     vehicleTypeId?: string;
//   };
//   vendor?: { vendorName?: string };
// }

// interface OrderVehicle {
//   vehicleId?: string;
//   localPerKm?: number;
//   localPerHour?: number;
//   vehicleName?: string;
//   vehicleImg?: string[];
//   vehicleMaster?: {
//     vehicleNumber?: string;
//     vehicleModelName?: string;
//     vehicleType?: string;
//     vendor?: { vendorName?: string };
//   };
// }

// interface OrderData {
//   bookingId: string;
//   bookingCode: string;
//   bookingDate: string;
//   pickupPoint: string;
//   pickupCity: string;
//   pickupArea: string;
//   remarks: string;

//   vehicleType?: { vehicleType: string };

//   user?: {
//     username: string;
//     email: string;
//     mobile: string;
//     userAddress: string;
//     company?: { companyName: string; companyAddress: string };
//   };

//   invoice: {
//     invoiceId: string;
//     invoiceNumber: string;
//     invoiceAmount: number;
//     invoiceStatus: string;
//     startDate: string;
//     endDate: string;
//     closePending: {
//       pickupDate: string;
//       garageKms: number;
//       garageOpenKm: number;
//       garageCloseKm: number;
//       garageOpenDateTime: string;
//       garageCloseDateTime: string;
//       additionalKms: number;
//       additionalHours: number;
//       discountAmount: string;
//       packageAmount: string;
//       totalTaxAmount: string;
//       totalDue: string;
//       totalAmount: string;
//       cgstAmount: string;
//       sgstAmount: string;
//       igstAmount: string;
//       extraDriverBeta: string;
//       selectedPackageData?: {
//         kms: number;
//         hours: number;
//         label: string;
//         amount: number;
//         packageType: string;
//       };
//       chargesTitle?: string;
//       chargesRemarks?: string;
//       extraCharges?: any;
//       additionalKmsAmount?: any;
//       additionalHoursAmount?: any;
//       advanceAmount?: any;
//       total?: any;
//     };
//     payment?: {
//       paymentId: string;
//       status: string;
//       paymentMode: string;
//       isOnline: boolean;
//       amount: string;
//       transactionId: string;
//       tax: string;
//       createdAt: string;
//     };
//   }[];

//   /** some APIs return vehicle here */
//   vehicle?: OrderVehicle;

//   /** your API sample returns vehicleMaster directly here */
//   vehicleMaster?: OrderVehicleMaster;

//   driver?: { driverName: string; address: string; phno: string };
// }

// /** ===== Monthly Details Types (based on your response) ===== */

// type MonthlyDetails = {
//   monthlyInvoice: {
//     monthlyInvoiceId: string;
//     invoiceDate: string;
//     invoiceMonth: string;
//     companyId: string;
//     companyName: string;
//     vehicleTypeId: string;
//     vehicleTypeName: string;
//     vehicleNumber: string;
//     packageDetails: {
//       km: number;
//       hours: number;
//       label: string;
//       title: string;
//       amount: number;
//       packageId: string;
//       extraKmRate: number;
//     };
//     extraKm: number;
//     extraDays: number;
//     extraChargeType: string;
//     extraChargesInputAmount: number;
//     discount: number;
//     advance: number;
//     packageAmount: number;
//     extraKmAmount: number;
//     extraDaysAmount: number;
//     netTotal: number;
//     taxes: { taxId: string; amount: number; taxName: string; taxPercent: number }[];
//     totalTaxAmount: number;
//     finalTotal: number;
//     closeStatus: number;
//     invoiceId: string | null;
//     balanceDue: number;
//     createdAt: string;
//   };
//   invoice: {
//     invoiceId: string;
//     invoiceNumber: string;
//     startDate: string;
//     endDate: string;
//     invoiceAmount: number;
//     invoiceStatus: string;
//     paymentId: string | null;
//     createdAt: string;
//   } | null;
//   company: {
//     companyId: string;
//     companyName: string;
//     companyAddress: string | null;
//     managerEmail?: string | null;
//     gstNo?: string | null;
//   };
//   vehicleType: {
//     vehicleTypeId: string;
//     vehicleType: string;
//     seatCapacity: number;
//     bookingType: string;
//   };
//   vehicles: Array<{
//     vehicleId: string;
//     vehicleName: string;
//     vehicleImg: string[];
//     vehicleMaster: {
//       vehicleMasterId: string;
//       vehicleNumber: string;
//       vehicleModelName: string;
//       vehicleType: string;
//       vendorName: string;
//     };
//   }>;
//   payment:
//     | {
//         paymentId: string;
//         paymentMode: string;
//         isOnline: boolean;
//         isActive: boolean;
//         transactionId: string;
//         status: string;
//         amount: string;
//         tax: string;
//         orderId: string | null;
//         gatewayOrderId: string | null;
//         paymentUrl: string | null;
//         clientAuthToken?: string | null;
//         expiresAt: string | null;
//         meta: any | null;
//         createdAt: string;
//       }
//     | null;
// };

// /** ===================== COMPONENT ===================== */

// const ViewCompletedList: React.FC = () => {
//   const navigate = useNavigate();
//   const { bookingId } = useParams<{ bookingId: string }>();
//   const location = useLocation();

//   const query = new URLSearchParams(location.search);
//   const viewType = (query.get("type") || "regular") as "regular" | "monthly";

//   const [orderData, setOrderData] = useState<OrderData | null>(null);
//   const [monthlyData, setMonthlyData] = useState<MonthlyDetails | null>(null);

//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const BASE_URL = config.baseurl.apibaseurl;

//   const formatDateTime = (isoString: string | null | undefined) => {
//     if (!isoString) return "-";
//     const date = new Date(isoString);
//     if (isNaN(date.getTime())) return String(isoString);
//     return date.toLocaleString();
//   };

//   const statusMap: { [key: string]: string } = {
//     "0": "Pending",
//     "4": "Pending",
//     "1": "Pending",
//     "2": "Pending",
//     "3": "Pending",
//     "5": "Pending",
//     "9": "PaymentPaid",
//   };

//   const getStatusText = (status: string | undefined): string => {
//     return status ? statusMap[status] || "Pending" : "Pending";
//   };

//   /** ===================== FETCH ===================== */
//   useEffect(() => {
//     const fetchDetails = async () => {
//       if (!bookingId) {
//         setError("No ID provided.");
//         setLoading(false);
//         showToast("Error: No ID found.", "error");
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       try {
//         if (viewType === "monthly") {
//           const resp = await axiosInstance.get<{
//             success: boolean;
//             message: string;
//             data: MonthlyDetails;
//           }>(`/closePendingOrder/monthlyInvoice/${bookingId}/details`);

//           if (resp.data.success) {
//             setMonthlyData(resp.data.data);
//             setOrderData(null);
//           } else {
//             setError(resp.data.message || "Failed to fetch monthly details");
//             showToast(resp.data.message || "Failed to fetch monthly details", "error");
//           }
//         } else {
//           const response = await axiosInstance.post<{
//             success: boolean;
//             message: string;
//             data: OrderData;
//           }>("/order/getOrdersById", { bookingId });

//           if (response.data.success) {
//             setOrderData(response.data.data);
//             setMonthlyData(null);
//           } else {
//             setError(response.data.message || "Failed to fetch data.");
//             showToast(response.data.message || "Failed to fetch data.", "error");
//           }
//         }
//       } catch (err: any) {
//         console.error("Error fetching details:", err);
//         setError(err.response?.data?.message || "Error fetching details.");
//         showToast(err.response?.data?.message || "Error fetching details.", "error");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDetails();
//   }, [bookingId, viewType]);

//   /** ===================== REGULAR COMPUTED ===================== */
//   const regularInvoice = orderData?.invoice?.[0]?.closePending;
//   const regularPayment = orderData?.invoice?.[0]?.payment;

//   const usageGarage =
//     (regularInvoice?.garageCloseKm || 0) - (regularInvoice?.garageOpenKm || 0);

//   const planAmount = parseFloat(regularInvoice?.packageAmount || "0");

//   // ✅ IMPORTANT FIX: handle both shapes
//   const vm = orderData?.vehicleMaster || orderData?.vehicle?.vehicleMaster;
//   const veh =
//     orderData?.vehicleMaster?.vehicle || // API: vehicleMaster.vehicle
//     orderData?.vehicle || // API: vehicle
//     null;

//   const ownerName =
//     orderData?.vehicleMaster?.vendor?.vendorName ||
//     orderData?.vehicleMaster?.vendorName ||
//     orderData?.vehicle?.vehicleMaster?.vendor?.vendorName ||
//     "-";

//   /** ===================== MONTHLY COMPUTED ===================== */
//   const m = monthlyData?.monthlyInvoice;
//   const mInvoice = monthlyData?.invoice;
//   const mCompany = monthlyData?.company;
//   const mVehicles = monthlyData?.vehicles || [];

//   const primaryVehicle = useMemo(() => {
//     if (!mVehicles.length) return null;

//     const byNumber = m?.vehicleNumber
//       ? mVehicles.find((v) => v?.vehicleMaster?.vehicleNumber === m.vehicleNumber)
//       : null;

//     return byNumber || mVehicles[0];
//   }, [mVehicles, m?.vehicleNumber]);

//   const monthlyOrderSummary = useMemo(() => {
//     if (!m) return [];
//     const rows: Array<{ label: string; value: number; sign?: string; underline?: boolean }> = [];

//     const add = (label: string, value: any, sign?: string, underline?: boolean) => {
//       const num = Number(value || 0);
//       if (!num) return;
//       rows.push({ label, value: num, sign, underline });
//     };

//     add("Package Amount", m.packageAmount, "+");
//     add("Extra KM Amount", m.extraKmAmount, "+");
//     add("Extra Days Amount", m.extraDaysAmount, "+");
//     add("Extra Charges", m.extraChargesInputAmount, "+");
//     add("Discount", m.discount, "-", false);
//     add("Advance", m.advance, "-", false);
//     add("Net Total", m.netTotal, "+", true);
//     add("Total Tax Amount", m.totalTaxAmount, "+");
//     add("Final Total", m.finalTotal, "+", true);
//     add("Balance Due", m.balanceDue, "+", true);

//     return rows;
//   }, [m]);

//   /** ===================== RENDER STATES ===================== */
//   if (loading) {
//     return (
//       <PageLayout>
//         <div className="p-6 text-center">
//           <p>Loading order details...</p>
//         </div>
//       </PageLayout>
//     );
//   }

//   if (error) {
//     return (
//       <PageLayout>
//         <div className="p-6 text-center text-red-500">
//           <p>{error}</p>
//           <button
//             onClick={() => navigate(-1)}
//             className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
//           >
//             Go Back
//           </button>
//         </div>
//       </PageLayout>
//     );
//   }

//   /** ===================== MONTHLY VIEW ===================== */
//   if (viewType === "monthly") {
//     return (
//       <PageLayout breadcrumbName={mInvoice?.invoiceNumber || m?.monthlyInvoiceId || "Monthly Invoice"}>
//         <AlertContainer />
//         <div className="p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-2xl font-bold text-gray-800">View Monthly Invoice</h1>
//             <button
//               onClick={() => navigate(-1)}
//               className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
//             >
//               Back
//             </button>
//           </div>

//           {/* Company */}
//           <div className="border p-4 rounded mb-6">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🏢 Company Details</h2>
//             <p><b>Company Name:</b> {mCompany?.companyName || m?.companyName || "-"}</p>
//             <p><b>Company Address:</b> {mCompany?.companyAddress || "-"}</p>
//             <p><b>Manager Email:</b> {mCompany?.managerEmail || "-"}</p>
//             <p><b>GST No:</b> {mCompany?.gstNo || "-"}</p>
//           </div>

//           {/* Package + Vehicle */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             <div className="border p-4 rounded">
//               <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚗 Package Details</h2>
//               <p><b>Package:</b> {m?.packageDetails?.label || "-"}</p>
//               <p><b>KMs:</b> {m?.packageDetails?.km ?? "-"}</p>
//               <p><b>Hours:</b> {m?.packageDetails?.hours ?? "-"}</p>
//               <p><b>Package Amount:</b> ₹{Number(m?.packageDetails?.amount || 0).toFixed(2)}</p>
//               <p><b>Vehicle Type:</b> {m?.vehicleTypeName || "-"}</p>
//               <p><b>Vehicle Number:</b> {m?.vehicleNumber || "-"}</p>
//               <p><b>Invoice Month:</b> {m?.invoiceMonth || "-"}</p>
//               <p><b>Invoice Date:</b> {formatDateTime(m?.invoiceDate)}</p>
//             </div>

//             <div className="border p-4 rounded">
//               <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚘 Vehicle Details</h2>
//               <p><b>Vehicle Model:</b> {primaryVehicle?.vehicleMaster?.vehicleModelName || "-"}</p>
//               <p><b>Vehicle Type:</b> {primaryVehicle?.vehicleMaster?.vehicleType || m?.vehicleTypeName || "-"}</p>
//               <p><b>Vehicle Number:</b> {primaryVehicle?.vehicleMaster?.vehicleNumber || m?.vehicleNumber || "-"}</p>
//               <p><b>Owner Name:</b> {primaryVehicle?.vehicleMaster?.vendorName || "-"}</p>

//               {primaryVehicle?.vehicleImg?.length ? (
//                 <img
//                   src={`${BASE_URL}/uploads/vehicleImg/${primaryVehicle.vehicleImg[0]}`}
//                   alt="Vehicle"
//                   className="mt-3 w-52 h-40 object-cover rounded-md shadow-sm"
//                 />
//               ) : (
//                 <div className="mt-3 rounded border w-52 h-40 bg-gray-200 flex items-center justify-center text-gray-500">
//                   No Image
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Invoice */}
//           <div className="border p-4 rounded mb-6">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🧾 Invoice Details</h2>
//             <p><b>Invoice Number:</b> {mInvoice?.invoiceNumber || "-"}</p>
//             <p><b>Start Date:</b> {formatDateTime(mInvoice?.startDate)}</p>
//             <p><b>End Date:</b> {formatDateTime(mInvoice?.endDate)}</p>
//             <p><b>Invoice Amount:</b> ₹{Number(mInvoice?.invoiceAmount || m?.finalTotal || 0).toFixed(2)}</p>
//             <p><b>Status:</b> {getStatusText(mInvoice?.invoiceStatus)}</p>
//           </div>

//           {/* Summary */}
//           <div className="border p-4 rounded mb-6">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📊 Order Summary</h2>
//             <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
//               {monthlyOrderSummary.map((r, idx) => (
//                 <React.Fragment key={idx}>
//                   <div className={`font-medium ${r.underline ? "border-t pt-2 mt-2 font-bold text-gray-900" : ""}`}>
//                     {r.label}
//                   </div>
//                   <div className={`text-right ${r.underline ? "border-t pt-2 mt-2 font-bold text-gray-900" : ""}`}>
//                     {r.sign ? `${r.sign} ` : ""}₹ {Math.abs(Number(r.value)).toFixed(2)}
//                   </div>
//                 </React.Fragment>
//               ))}
//             </div>
//           </div>

//           {/* Payment */}
//           <div className="border p-4 rounded mb-6">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">💳 Payment List</h2>
//             <table className="w-full text-sm border">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="p-2 border">Payment Date</th>
//                   <th className="p-2 border">Amount Paid</th>
//                   <th className="p-2 border">Transaction ID</th>
//                   <th className="p-2 border">Payment Mode</th>
//                   <th className="p-2 border">Is Online</th>
//                   <th className="p-2 border">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {monthlyData?.payment ? (
//                   <tr>
//                     <td className="p-2 border">{formatDateTime(monthlyData.payment.createdAt)}</td>
//                     <td className="p-2 border">₹{Number(monthlyData.payment.amount || 0).toFixed(2)}</td>
//                     <td className="p-2 border">{monthlyData.payment.transactionId || "-"}</td>
//                     <td className="p-2 border">{monthlyData.payment.paymentMode || "-"}</td>
//                     <td className="p-2 border">{monthlyData.payment.isOnline ? "Yes" : "No"}</td>
//                     <td className="p-2 border font-semibold">
//                       {monthlyData.payment.status === "9" ? "Paid" : "Pending"}
//                     </td>
//                   </tr>
//                 ) : (
//                   <tr>
//                     <td className="p-2 border text-center text-gray-500" colSpan={6}>
//                       No payment details available
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </PageLayout>
//     );
//   }

//   /** ===================== REGULAR VIEW ===================== */
//   const invoice = regularInvoice;
//   const payment = regularPayment;

//   const totalTax =
//     (Number(invoice?.cgstAmount) || 0) +
//     (Number(invoice?.igstAmount) || 0) +
//     (Number(invoice?.sgstAmount) || 0);

//   return (
//     <PageLayout breadcrumbName={orderData?.bookingCode || "Order"}>
//       <AlertContainer />
//       <div className="p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">View Completed Order</h1>
//           <button
//             onClick={() => navigate(-1)}
//             className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
//           >
//             Back
//           </button>
//         </div>

//         {/* Order + User */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <div className="border p-4 rounded">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📝 Order Details</h2>
//             <p><b>Order Number:</b> {orderData?.bookingCode || "-"}</p>
//             <p><b>Order Date:</b> {orderData?.bookingDate ? new Date(orderData.bookingDate).toLocaleString() : "-"}</p>
//             <p><b>Payment Mode:</b> {payment?.paymentMode || "-"}</p>
//             <p><b>Status:</b> {getStatusText(payment?.status)}</p>
//           </div>

//           <div className="border p-4 rounded">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">👤 User Details</h2>
//             <p><b>Company Name:</b> {orderData?.user?.company?.companyName || "-"}</p>
//             <p><b>User Name:</b> {orderData?.user?.username || "-"}</p>
//             <p><b>Email Address:</b> {orderData?.user?.email || "-"}</p>
//             <p><b>Phone Number:</b> {orderData?.user?.mobile || "-"}</p>
//             <p><b>Address:</b> {orderData?.user?.userAddress || "-"}</p>
//           </div>
//         </div>

//         {/* Booking + Package */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <div className="border p-4 rounded">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📅 Booking Details</h2>
//             <p><b>Pickup Date and Time:</b> {formatDateTime(invoice?.pickupDate || null)}</p>
//             <p><b>Pickup City:</b> {orderData?.pickupCity || "-"}</p>
//             <p><b>Pickup Area:</b> {orderData?.pickupArea || "-"}</p>
//             <p><b>Pickup Point:</b> {orderData?.pickupPoint || "-"}</p>
//             <p><b>Vehicle Type:</b> {orderData?.vehicleType?.vehicleType || vm?.vehicleType || "-"}</p>
//           </div>

//           <div className="border p-4 rounded">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚗 Package Details</h2>
//             <p><b>Package Name:</b> {invoice?.selectedPackageData?.label || "-"}</p>
//             <p><b>Kilo Meter:</b> {invoice?.selectedPackageData?.kms || "-"}</p>
//             <p><b>Hour(s):</b> {invoice?.selectedPackageData?.hours || "-"}</p>
//             <p><b>Plan Amount:</b> ₹{planAmount.toFixed(2)}</p>

//             {veh?.vehicleImg?.length ? (
//               <img
//                 src={`${BASE_URL}/uploads/vehicleImg/${veh.vehicleImg[0]}`}
//                 alt={veh?.vehicleName || "Vehicle"}
//                 className="mt-3 w-52 h-40 object-cover rounded-md shadow-sm"
//               />
//             ) : (
//               <div className="mt-3 rounded border w-52 h-40 bg-gray-200 flex items-center justify-center text-gray-500">
//                 No Image
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Summary */}
//         <div className="border p-4 rounded mb-6">
//           <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📊 Order Summary Details</h2>

//           <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
//             {invoice &&
//               Object.entries(invoice)
//                 .filter(([key, value]) => {
//                   const numericFields = [
//                     "packageAmount",
//                     "discountAmount",
//                     "additionalKmsAmount",
//                     "additionalHoursAmount",
//                     "totalTaxAmount",
//                     "extraCharges",
//                     "extraDriverBeta",
//                     "totalDue",
//                     "totalAmount",
//                     "total",
//                     "advanceAmount",
//                   ];
//                   if (!numericFields.includes(key)) return false;
//                   if (!value || Number(value) === 0) return false;
//                   return true;
//                 })
//                 .sort(([keyA], [keyB]) => {
//                   const order = [
//                     "packageAmount",
//                     "extraDriverBeta",
//                     "additionalKmsAmount",
//                     "additionalHoursAmount",
//                     "totalAmount",
//                     "totalTaxAmount",
//                     "extraCharges",
//                     "discountAmount",
//                     "total",
//                     "advanceAmount",
//                     "totalDue",
//                   ];
//                   return order.indexOf(keyA) - order.indexOf(keyB);
//                 })
//                 .map(([key, value]) => {
//                   const numValue = Number(value);
//                   let sign = "+";
//                   if (key === "advanceAmount" || key === "discountAmount") sign = "-";

//                   const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

//                   const isUnderline = key === "totalAmount" || key === "total" || key === "totalDue";
//                   const underlineClass = isUnderline ? "border-t pt-2 mt-2 font-bold text-gray-900" : "";

//                   return (
//                     <React.Fragment key={key}>
//                       <div className={`font-medium ${underlineClass}`}>{formattedKey}</div>
//                       <div className={`text-right ${underlineClass}`}>
//                         {sign} ₹ {Math.abs(numValue).toFixed(2)}
//                       </div>
//                     </React.Fragment>
//                   );
//                 })}
//           </div>

//           {totalTax > 0 && (
//             <div className="mt-3 text-sm text-gray-700">
//               <b>Total Tax:</b> ₹{totalTax.toFixed(2)}
//             </div>
//           )}
//         </div>

//         {/* ✅ Vehicle + Driver (FIXED) */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <div className="border p-4 rounded">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚘 Vehicle Details</h2>
//             <p><b>Vehicle Type:</b> {vm?.vehicleType || orderData?.vehicleType?.vehicleType || "-"}</p>
//             <p><b>Vehicle Model:</b> {vm?.vehicleModelName || veh?.vehicleName || "-"}</p>
//             <p><b>Vehicle Number:</b> {vm?.vehicleNumber || "-"}</p>
//             <p><b>Owner Name:</b> {ownerName}</p>
//           </div>

//           <div className="border p-4 rounded">
//             <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">👨‍✈️ Driver Details</h2>
//             <p><b>Driver Name:</b> {orderData?.driver?.driverName || "-"}</p>
//             <p><b>Address:</b> {orderData?.driver?.address || "-"}</p>
//             <p><b>Phone Number:</b> {orderData?.driver?.phno || "-"}</p>
//           </div>
//         </div>

//         {/* Invoice List */}
//         <div className="border p-4 rounded mb-6">
//           <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🧾 Invoice List</h2>
//           <table className="w-full text-sm border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border">#Invoice Number</th>
//                 <th className="p-2 border">Invoice Date</th>
//                 <th className="p-2 border">Invoice Amount</th>
//                 <th className="p-2 border">Discount</th>
//                 <th className="p-2 border">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {orderData?.invoice?.map((inv, index) => (
//                 <tr key={index}>
//                   <td className="p-2 border">{inv.invoiceNumber}</td>
//                   <td className="p-2 border">{formatDateTime(inv.startDate || null)}</td>
//                   <td className="p-2 border">₹{inv.invoiceAmount.toFixed(2)}</td>
//                   <td className="p-2 border">₹{inv.closePending?.discountAmount || "0.00"}</td>
//                   <td className="p-2 border font-semibold text-green-600">
//                     {getStatusText(inv.invoiceStatus)}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Payment List */}
//         <div className="border p-4 rounded mb-6">
//           <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">💳 Payment List</h2>
//           <table className="w-full text-sm border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border">Payment Date</th>
//                 <th className="p-2 border">Amount Paid</th>
//                 <th className="p-2 border">Remarks</th>
//                 <th className="p-2 border">Transaction Fee</th>
//                 <th className="p-2 border">Transaction ID</th>
//                 <th className="p-2 border">Payment Mode</th>
//                 <th className="p-2 border">Is Manual Payment</th>
//               </tr>
//             </thead>
//             <tbody>
//               {orderData?.invoice?.map((inv, index) => (
//                 <tr key={index}>
//                   <td className="p-2 border">{formatDateTime(inv.payment?.createdAt || null)}</td>
//                   <td className="p-2 border">₹{inv.payment?.amount || "0.00"}</td>
//                   <td className="p-2 border">{inv.closePending?.chargesRemarks || "-"}</td>
//                   <td className="p-2 border">-</td>
//                   <td className="p-2 border">{inv.payment?.transactionId || "-"}</td>
//                   <td className="p-2 border">{inv.payment?.paymentMode || "-"}</td>
//                   <td className="p-2 border">
//                     {inv.payment?.isOnline === true ? "Yes" : inv.payment?.isOnline === false ? "No" : "-"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Garage Details */}
//         <div className="border p-4 rounded mb-6">
//           <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🏭 Garage Details</h2>
//           <table className="w-full text-sm border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border"></th>
//                 <th className="p-2 border">Garage Open</th>
//                 <th className="p-2 border">Garage Close</th>
//                 <th className="p-2 border">Usage Garage</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr>
//                 <td className="p-2 border">Km(s)</td>
//                 <td className="p-2 border">{invoice?.garageOpenKm || "-"}</td>
//                 <td className="p-2 border">{invoice?.garageCloseKm || "-"}</td>
//                 <td className="p-2 border">{usageGarage || "-"}</td>
//               </tr>
//               <tr>
//                 <td className="p-2 border font-bold">Date & Time</td>
//                 <td className="p-2 border">{formatDateTime(invoice?.garageOpenDateTime || null)}</td>
//                 <td className="p-2 border">{formatDateTime(invoice?.garageCloseDateTime || null)}</td>
//                 <td className="p-2 border">
//                   {invoice?.garageOpenDateTime && invoice?.garageCloseDateTime
//                     ? `${(
//                         (new Date(invoice.garageCloseDateTime).getTime() -
//                           new Date(invoice.garageOpenDateTime).getTime()) /
//                         (1000 * 60 * 60)
//                       ).toFixed(2)} hours`
//                     : "-"}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </PageLayout>
//   );
// };

// export default ViewCompletedList;
// src/SuperAdmin/pages/Orders/ViewCompletedList.tsx
import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import { AlertContainer, showToast } from "../../../../components/AlertBox";
import config from "../../../../config/config";

/** ===================== TYPES ===================== */

interface OrderVehicleMaster {
  vehicleMasterId?: string;
  vehicleNumber?: string;
  vehicleModelName?: string;
  vehicleType?: string;
  vendorId?: string;
  vendorName?: string;
  vehicleId?: string;
  vehicle?: {
    vehicleId?: string;
    vehicleName?: string;
    manufacturing?: string;
    vehicleImg?: string[];
    availableStatus?: string;
    vehicleTypeId?: string;
  };
  vendor?: { vendorName?: string };
}

interface OrderVehicle {
  vehicleId?: string;
  localPerKm?: number;
  localPerHour?: number;
  vehicleName?: string;
  vehicleImg?: string[];
  vehicleMaster?: {
    vehicleNumber?: string;
    vehicleModelName?: string;
    vehicleType?: string;
    vendor?: { vendorName?: string };
  };
}

interface OrderData {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  pickupPoint: string;
  pickupCity: string;
  pickupArea: string;
  remarks: string;

  vehicleType?: { vehicleType: string };

  user?: {
    username: string;
    email: string;
    mobile: string;
    userAddress: string;
    company?: { companyName: string; companyAddress: string };
  };

  invoice: {
    invoiceId: string;
    invoiceNumber: string;
    invoiceAmount: number;
    invoiceStatus: string;
    startDate: string;
    endDate: string;

    closePending: {
      pickupDate: string;
      garageKms: number;
      usageHours:string;
      garageOpenKm: number;
      garageCloseKm: number;
      garageOpenDateTime: string;
      garageCloseDateTime: string;
      additionalKms: number;
      additionalHours: number;
      discountAmount: string;
      packageAmount: string;
      totalTaxAmount: string;
      totalDue: string;
      totalAmount: string;
      cgstAmount: string;
      sgstAmount: string;
      igstAmount: string;
      extraDriverBeta: string;
      selectedPackageData?: {
        kms: number;
        hours: number;
        label: string;
        amount: number;
        packageType: string;
      };
      chargesTitle?: string;
      chargesRemarks?: string;
      extraCharges?: any;
      additionalKmsAmount?: any;
      additionalHoursAmount?: any;
      advanceAmount?: any;
      total?: any;
    };
    payment?: {
      paymentId: string;
      status: string;
      paymentMode: string;
      isOnline: boolean;
      amount: string;
      transactionId: string;
      tax: string;
      createdAt: string;
    };
  }[];

  /** some APIs return vehicle here */
  vehicle?: OrderVehicle;

  /** your API sample returns vehicleMaster directly here */
  vehicleMaster?: OrderVehicleMaster;

  driver?: { driverName: string; address: string; phno: string };
}

/** ===== Monthly Details Types (based on your response) ===== */

type MonthlyDetails = {
  monthlyInvoice: {
    monthlyInvoiceId: string;
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
    discount: number;
    advance: number;
    packageAmount: number;
    extraKmAmount: number;
    extraDaysAmount: number;
    netTotal: number;
    taxes: { taxId: string; amount: number; taxName: string; taxPercent: number }[];
    totalTaxAmount: number;
    finalTotal: number;
    closeStatus: number;
    invoiceId: string | null;
    balanceDue: number;
    createdAt: string;
  };
  invoice: {
    invoiceId: string;
    invoiceNumber: string;
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
  vehicleType: {
    vehicleTypeId: string;
    vehicleType: string;
    seatCapacity: number;
    bookingType: string;
  };
  vehicles: Array<{
    vehicleId: string;
    vehicleName: string;
    vehicleImg: string[];
    vehicleMaster: {
      vehicleMasterId: string;
      vehicleNumber: string;
      vehicleModelName: string;
      vehicleType: string;
      vendorName: string;
    };
  }>;
  payment:
    | {
        paymentId: string;
        paymentMode: string;
        isOnline: boolean;
        isActive: boolean;
        transactionId: string;
        status: string;
        amount: string;
        tax: string;
        orderId: string | null;
        gatewayOrderId: string | null;
        paymentUrl: string | null;
        clientAuthToken?: string | null;
        expiresAt: string | null;
        meta: any | null;
        createdAt: string;
      }
    | null;
};

/** ===================== COMPONENT ===================== */

const ViewCompletedList: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const viewType = (query.get("type") || "regular") as "regular" | "monthly";

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDetails | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = config.baseurl.apibaseurl;

  const formatDateTime = (isoString: string | null | undefined) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return String(isoString);
    return date.toLocaleString();
  };

  const statusMap: { [key: string]: string } = {
    "0": "Pending",
    "4": "Pending",
    "1": "Pending",
    "2": "Pending",
    "3": "Pending",
    "5": "Pending",
    "9": "PaymentPaid",
  };

  const getStatusText = (status: string | undefined): string => {
    return status ? statusMap[status] || "Pending" : "Pending";
  };

  /** ===================== FETCH ===================== */
  useEffect(() => {
    const fetchDetails = async () => {
      if (!bookingId) {
        setError("No ID provided.");
        setLoading(false);
        showToast("Error: No ID found.", "error");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (viewType === "monthly") {
          const resp = await axiosInstance.get<{
            success: boolean;
            message: string;
            data: MonthlyDetails;
          }>(`/closePendingOrder/monthlyInvoice/${bookingId}/details`);

          if (resp.data.success) {
            setMonthlyData(resp.data.data);
            setOrderData(null);
          } else {
            setError(resp.data.message || "Failed to fetch monthly details");
            showToast(resp.data.message || "Failed to fetch monthly details", "error");
          }
        } else {
          const response = await axiosInstance.post<{
            success: boolean;
            message: string;
            data: OrderData;
          }>("/order/getOrdersById", { bookingId });

          if (response.data.success) {
            setOrderData(response.data.data);
            setMonthlyData(null);
          } else {
            setError(response.data.message || "Failed to fetch data.");
            showToast(response.data.message || "Failed to fetch data.", "error");
          }
        }
      } catch (err: any) {
        console.error("Error fetching details:", err);
        setError(err.response?.data?.message || "Error fetching details.");
        showToast(err.response?.data?.message || "Error fetching details.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bookingId, viewType]);

  /** ===================== REGULAR COMPUTED ===================== */
  const regularInvoice = orderData?.invoice?.[0]?.closePending;
  const regularPayment = orderData?.invoice?.[0]?.payment;

  const usageGarage =
    (regularInvoice?.garageCloseKm || 0) - (regularInvoice?.garageOpenKm || 0);

  const planAmount = parseFloat(regularInvoice?.packageAmount || "0");

  // ✅ IMPORTANT FIX: handle both shapes
  const vm = orderData?.vehicleMaster || orderData?.vehicle?.vehicleMaster;
  const veh =
    orderData?.vehicleMaster?.vehicle || // API: vehicleMaster.vehicle
    orderData?.vehicle || // API: vehicle
    null;

  const ownerName =
    orderData?.vehicleMaster?.vendor?.vendorName ||
    orderData?.vehicleMaster?.vendorName ||
    orderData?.vehicle?.vehicleMaster?.vendor?.vendorName ||
    "-";

  /** ===================== MONTHLY COMPUTED ===================== */
  const m = monthlyData?.monthlyInvoice;
  const mInvoice = monthlyData?.invoice;
  const mCompany = monthlyData?.company;
  const mVehicles = monthlyData?.vehicles || [];

  const primaryVehicle = useMemo(() => {
    if (!mVehicles.length) return null;

    const byNumber = m?.vehicleNumber
      ? mVehicles.find((v) => v?.vehicleMaster?.vehicleNumber === m.vehicleNumber)
      : null;

    return byNumber || mVehicles[0];
  }, [mVehicles, m?.vehicleNumber]);

  const monthlyOrderSummary = useMemo(() => {
    if (!m) return [];
    const rows: Array<{ label: string; value: number; sign?: string; underline?: boolean }> = [];

    const add = (label: string, value: any, sign?: string, underline?: boolean) => {
      const num = Number(value || 0);
      if (!num) return;
      rows.push({ label, value: num, sign, underline });
    };

    add("Package Amount", m.packageAmount, "+");
    add("Extra KM Amount", m.extraKmAmount, "+");
    add("Extra Days Amount", m.extraDaysAmount, "+");
    add("Extra Charges", m.extraChargesInputAmount, "+");
    add("Discount", m.discount, "-", false);
    add("Advance", m.advance, "-", false);
    add("Net Total", m.netTotal, "+", true);
    add("Total Tax Amount", m.totalTaxAmount, "+");
    add("Final Total", m.finalTotal, "+", true);
    add("Balance Due", m.balanceDue, "+", true);

    return rows;
  }, [m]);

  /** ===================== RENDER STATES ===================== */
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

  /** ===================== MONTHLY VIEW ===================== */
  if (viewType === "monthly") {
    return (
      <PageLayout breadcrumbName={mInvoice?.invoiceNumber || m?.monthlyInvoiceId || "Monthly Invoice"}>
        <AlertContainer />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">View Monthly Invoice</h1>
            <button
              onClick={() => navigate(-1)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              Back
            </button>
          </div>

          {/* Company */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🏢 Company Details</h2>
            <p><b>Company Name:</b> {mCompany?.companyName || m?.companyName || "-"}</p>
            <p><b>Company Address:</b> {mCompany?.companyAddress || "-"}</p>
            <p><b>Manager Email:</b> {mCompany?.managerEmail || "-"}</p>
            <p><b>GST No:</b> {mCompany?.gstNo || "-"}</p>
          </div>

          {/* Package + Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚗 Package Details</h2>
              <p><b>Package:</b> {m?.packageDetails?.label || "-"}</p>
              <p><b>KMs:</b> {m?.packageDetails?.km ?? "-"}</p>
              <p><b>Hours:</b> {m?.packageDetails?.hours ?? "-"}</p>
              <p><b>Package Amount:</b> ₹{Number(m?.packageDetails?.amount || 0).toFixed(2)}</p>
              <p><b>Vehicle Type:</b> {m?.vehicleTypeName || "-"}</p>
              <p><b>Vehicle Number:</b> {m?.vehicleNumber || "-"}</p>
              <p><b>Invoice Month:</b> {m?.invoiceMonth || "-"}</p>
              <p><b>Invoice Date:</b> {formatDateTime(m?.invoiceDate)}</p>
            </div>

            <div className="border p-4 rounded">
              <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚘 Vehicle Details</h2>
              <p><b>Vehicle Model:</b> {primaryVehicle?.vehicleMaster?.vehicleModelName || "-"}</p>
              <p><b>Vehicle Type:</b> {primaryVehicle?.vehicleMaster?.vehicleType || m?.vehicleTypeName || "-"}</p>
              <p><b>Vehicle Number:</b> {primaryVehicle?.vehicleMaster?.vehicleNumber || m?.vehicleNumber || "-"}</p>
              <p><b>Owner Name:</b> {primaryVehicle?.vehicleMaster?.vendorName || "-"}</p>

              {primaryVehicle?.vehicleImg?.length ? (
                <img
                  src={`${BASE_URL}/uploads/vehicleImg/${primaryVehicle.vehicleImg[0]}`}
                  alt="Vehicle"
                  className="mt-3 w-52 h-40 object-cover rounded-md shadow-sm"
                />
              ) : (
                <div className="mt-3 rounded border w-52 h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Invoice */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🧾 Invoice Details</h2>
            <p><b>Invoice Number:</b> {mInvoice?.invoiceNumber || "-"}</p>
            <p><b>Start Date:</b> {formatDateTime(mInvoice?.startDate)}</p>
            <p><b>End Date:</b> {formatDateTime(mInvoice?.endDate)}</p>
            <p><b>Invoice Amount:</b> ₹{Number(mInvoice?.invoiceAmount || m?.finalTotal || 0).toFixed(2)}</p>
            <p><b>Status:</b> {getStatusText(mInvoice?.invoiceStatus)}</p>
          </div>

          {/* Summary */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📊 Order Summary</h2>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
              {monthlyOrderSummary.map((r, idx) => (
                <React.Fragment key={idx}>
                  <div className={`font-medium ${r.underline ? "border-t pt-2 mt-2 font-bold text-gray-900" : ""}`}>
                    {r.label}
                  </div>
                  <div className={`text-right ${r.underline ? "border-t pt-2 mt-2 font-bold text-gray-900" : ""}`}>
                    {r.sign ? `${r.sign} ` : ""}₹ {Math.abs(Number(r.value)).toFixed(2)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="border p-4 rounded mb-6">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">💳 Payment List</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Payment Date</th>
                  <th className="p-2 border">Amount Paid</th>
                  <th className="p-2 border">Transaction ID</th>
                  <th className="p-2 border">Payment Mode</th>
                  <th className="p-2 border">Is Online</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData?.payment ? (
                  <tr>
                    <td className="p-2 border">{formatDateTime(monthlyData.payment.createdAt)}</td>
                    <td className="p-2 border">₹{Number(monthlyData.payment.amount || 0).toFixed(2)}</td>
                    <td className="p-2 border">{monthlyData.payment.transactionId || "-"}</td>
                    <td className="p-2 border">{monthlyData.payment.paymentMode || "-"}</td>
                    <td className="p-2 border">{monthlyData.payment.isOnline ? "Yes" : "No"}</td>
                    <td className="p-2 border font-semibold">
                      {monthlyData.payment.status === "9" ? "Paid" : "Pending"}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="p-2 border text-center text-gray-500" colSpan={6}>
                      No payment details available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageLayout>
    );
  }

  /** ===================== REGULAR VIEW ===================== */
  const invoice = regularInvoice;
  const payment = regularPayment;

  const totalTax =
    (Number(invoice?.cgstAmount) || 0) +
    (Number(invoice?.igstAmount) || 0) +
    (Number(invoice?.sgstAmount) || 0);

  return (
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
            <p><b>Order Number:</b> {orderData?.bookingCode || "-"}</p>
            <p><b>Order Date:</b> {orderData?.bookingDate ? new Date(orderData.bookingDate).toLocaleString() : "-"}</p>
            <p><b>Payment Mode:</b> {payment?.paymentMode || "-"}</p>
            <p><b>Status:</b> {getStatusText(payment?.status)}</p>
          </div>

          <div className="border p-4 rounded">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">👤 User Details</h2>
            <p><b>Company Name:</b> {orderData?.user?.company?.companyName || "-"}</p>
            <p><b>User Name:</b> {orderData?.user?.username || "-"}</p>
            <p><b>Email Address:</b> {orderData?.user?.email || "-"}</p>
            <p><b>Phone Number:</b> {orderData?.user?.mobile || "-"}</p>
            <p><b>Address:</b> {orderData?.user?.userAddress || "-"}</p>
          </div>
        </div>

        {/* Booking + Package */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border p-4 rounded">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">📅 Booking Details</h2>
            <p><b>Pickup Date and Time:</b> {formatDateTime(invoice?.pickupDate || null)}</p>
            <p><b>Pickup City:</b> {orderData?.pickupCity || "-"}</p>
            <p><b>Pickup Area:</b> {orderData?.pickupArea || "-"}</p>
            <p><b>Pickup Point:</b> {orderData?.pickupPoint || "-"}</p>
            <p><b>Vehicle Type:</b> {orderData?.vehicleType?.vehicleType || vm?.vehicleType || "-"}</p>
          </div>

          <div className="border p-4 rounded">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚗 Package Details</h2>
            <p><b>Package Name:</b> {invoice?.selectedPackageData?.label || "-"}</p>
            <p><b>Kilo Meter:</b> {invoice?.selectedPackageData?.kms || "-"}</p>
            <p><b>Hour(s):</b> {invoice?.selectedPackageData?.hours || "-"}</p>
            <p><b>Plan Amount:</b> ₹{planAmount.toFixed(2)}</p>

            {veh?.vehicleImg?.length ? (
              <img
                src={`${BASE_URL}/uploads/vehicleImg/${veh.vehicleImg[0]}`}
                alt={veh?.vehicleName || "Vehicle"}
                className="mt-3 w-52 h-40 object-cover rounded-md shadow-sm"
              />
            ) : (
              <div className="mt-3 rounded border w-52 h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
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

                  const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

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

          {totalTax > 0 && (
            <div className="mt-3 text-sm text-gray-700">
              <b>Total Tax:</b> ₹{totalTax.toFixed(2)}
            </div>
          )}
        </div>

        {/* ✅ Vehicle + Driver (FIXED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border p-4 rounded">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">🚘 Vehicle Details</h2>
            <p><b>Vehicle Type:</b> {vm?.vehicleType || orderData?.vehicleType?.vehicleType || "-"}</p>
            <p><b>Vehicle Model:</b> {vm?.vehicleModelName || veh?.vehicleName || "-"}</p>
            <p><b>Vehicle Number:</b> {vm?.vehicleNumber || "-"}</p>
            <p><b>Owner Name:</b> {ownerName}</p>
          </div>

          <div className="border p-4 rounded">
            <h2 className="font-semibold text-orange-600 border-b pb-2 mb-3">👨‍✈️ Driver Details</h2>
            <p><b>Driver Name:</b> {orderData?.driver?.driverName || "-"}</p>
            <p><b>Address:</b> {orderData?.driver?.address || "-"}</p>
            <p><b>Phone Number:</b> {orderData?.driver?.phno || "-"}</p>
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
              {orderData?.invoice?.map((inv, index) => (
                <tr key={index}>
                  <td className="p-2 border">{inv.invoiceNumber}</td>
                  <td className="p-2 border">{formatDateTime(inv.startDate || null)}</td>
                  <td className="p-2 border">₹{inv.invoiceAmount.toFixed(2)}</td>
                  <td className="p-2 border">₹{inv.closePending?.discountAmount || "0.00"}</td>
                  <td className="p-2 border font-semibold text-green-600">
                    {getStatusText(inv.invoiceStatus)}
                  </td>
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
                <th className="p-2 border">Payment Date</th>
                <th className="p-2 border">Amount Paid</th>
                <th className="p-2 border">Remarks</th>
                <th className="p-2 border">Transaction Fee</th>
                <th className="p-2 border">Transaction ID</th>
                <th className="p-2 border">Payment Mode</th>
                <th className="p-2 border">Is Manual Payment</th>
              </tr>
            </thead>
            <tbody>
              {orderData?.invoice?.map((inv, index) => (
                <tr key={index}>
                  <td className="p-2 border">{formatDateTime(inv.payment?.createdAt || null)}</td>
                  <td className="p-2 border">₹{inv.payment?.amount || "0.00"}</td>
                  <td className="p-2 border">{inv.closePending?.chargesRemarks || "-"}</td>
                  <td className="p-2 border">-</td>
                  <td className="p-2 border">{inv.payment?.transactionId || "-"}</td>
                  <td className="p-2 border">{inv.payment?.paymentMode || "-"}</td>
                  <td className="p-2 border">
                    {inv.payment?.isOnline === true ? "Yes" : inv.payment?.isOnline === false ? "No" : "-"}
                  </td>
                </tr>
              ))}
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
                <td className="p-2 border">{invoice?.garageOpenKm || "-"}</td>
                <td className="p-2 border">{invoice?.garageCloseKm || "-"}</td>
                <td className="p-2 border">{usageGarage || "-"}</td>
              </tr>
              <tr>
                <td className="p-2 border font-bold">Date & Time</td>
                <td className="p-2 border">{formatDateTime(invoice?.garageOpenDateTime || null)}</td>
                <td className="p-2 border">{formatDateTime(invoice?.garageCloseDateTime || null)}</td>
                <td className="p-2 border">
 {invoice?.usageHours ?? "-"} hrs                  {/* {invoice?.garageOpenDateTime && invoice?.garageCloseDateTime
                    ? `${(
                        (new Date(invoice.garageCloseDateTime).getTime() -
                          new Date(invoice.garageOpenDateTime).getTime()) /
                        (1000 * 60 * 60)
                      ).toFixed(2)} hours`
                    : "-"} */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
};

export default ViewCompletedList;
