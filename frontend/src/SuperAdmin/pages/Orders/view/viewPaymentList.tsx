// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import PageLayout from "../../../../components/PageLayout";
// import axiosInstance from "../../../../utils/axiosInstance";
// import { useNavigate } from "react-router-dom";

// interface PaymentDetails {
//   transactionId: string;
//   paymentMode: string;
//   createdAt: string;
//   amount: number;
//   remarks: string;
//   bankRefNo: string;
//   paymentRefNo: string;
// }

// interface Order {
//   bookingCode: string;
//   orderDate: string;
//   pickupPoint: string;
//   totalAmount: number;
//   invoiceNumber: string;
//   invoiceAmount: number;
//   discount: number;
//   status: string;
// }

// const formatToCustom = (dateString: string) => {
//   if (!dateString) return "-";
//   const d = new Date(dateString);
//   if (isNaN(d.getTime())) return dateString;

//   let day = String(d.getDate()).padStart(2, "0");
//   let month = String(d.getMonth() + 1).padStart(2, "0");
//   let year = d.getFullYear();

//   let hours = d.getHours();
//   let minutes = String(d.getMinutes()).padStart(2, "0");
//   let ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12;
//   hours = hours ? hours : 12;

//   return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
// };

// const ViewPaymentList: React.FC = () => {
//   const { paymentId } = useParams<{ paymentId: string }>();
//   const [payment, setPayment] = useState<PaymentDetails | null>(null);
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
// const navigate = useNavigate();

// const handleOrderClick = (order: any) => {
//   navigate(`/orders/view/completed-list/${order.bookingId}`);
// };


//   const fetchPaymentDetails = async () => {
//     if (!paymentId) {
//       console.error("Payment ID is undefined. Cannot fetch details.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await axiosInstance.post("/order/getOrderPaymentListById", {
//         paymentId,
//       });

//     const data = res.data?.data;

// if (data) {
//   // ❌ remove 'data.payment' because backend returns directly 'data'
//   // ✅ directly use data instead of data.payment
//   setPayment({
//     transactionId: data.transactionId || "—",
//     paymentMode: data.paymentMode || "Online",
//     createdAt: formatToCustom(data.createdAt),
//     amount: Number(data.amount || 0),
//     remarks: "Amount received successfully",
//     bankRefNo: data.bankRefNo || "—",
//     paymentRefNo: data.paymentRefNo || "—",
//   });

//   const invoiceList = data.invoices || [];
// const formattedOrders = invoiceList.map((inv: any) => ({
//   bookingCode: inv.booking?.bookingCode || "—",
//     bookingId: inv.booking?.bookingId,
//   orderDate: formatToCustom(data.createdAt),
//   pickupPoint: inv.booking?.pickupPoint || "—",
//   totalAmount: Number(inv.invoiceAmount || 0),
//   invoiceNumber: inv.invoiceNumber || "—",
//   invoiceAmount: inv.invoiceAmount || 0,
//   discount: 0,
//   status: inv.invoiceStatus === "9" ? "Paid" : "Pending",
// }));


//   setOrders(formattedOrders);
// }

//     } catch (err) {
//       console.error("Error fetching payment details:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPaymentDetails();
//   }, [paymentId]);

//   return (
//     <PageLayout breadcrumbName={orders[0]?.bookingCode || "Payment"}>
//       <main className="py-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-6">View Payment</h1>

//         {loading ? (
//           <p className="text-gray-500">Loading payment details...</p>
//         ) : payment ? (
//           <>
//             {/* Payment Details */}
//             <div className="border rounded-lg shadow-md bg-white mb-6 p-4">
//               <h2 className="text-lg font-semibold text-gray-700 mb-3">
//                 Payment Details
//               </h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                 <p><strong>Payment No:</strong> {payment.transactionId}</p>
//                 <p><strong>Payment Date:</strong> {payment.createdAt}</p>
//                 <p><strong>Amount Paid:</strong> ₹{payment.amount.toLocaleString("en-IN")}</p>
//                 <p><strong>Remarks:</strong> {payment.remarks}</p>
//                 <p><strong>Bank Ref. No:</strong> {payment.bankRefNo}</p>
//                 <p><strong>Payment Ref. No:</strong> {payment.paymentRefNo}</p>
//               </div>
//             </div>

//             {/* Invoice List */}
//             <div className="border rounded-lg shadow-md bg-white p-4">
//               <h2 className="text-lg font-semibold text-gray-700 mb-3">
//                 Invoice Details
//               </h2>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full text-sm border">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="p-2 border">Order Number</th>
//                       <th className="p-2 border">Order Date</th>
//                       <th className="p-2 border">Pickup Point</th>
//                       <th className="p-2 border">Total Amount (Rs.)</th>
//                       <th className="p-2 border">Invoice Number</th>
//                       <th className="p-2 border">Invoice Amount (Rs.)</th>
//                       <th className="p-2 border">Discount (Rs.)</th>
//                       <th className="p-2 border">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {orders.length > 0 ? (
//                       orders.map((o, idx) => (
//                         <tr key={idx} className="text-center">
// <td
//   className="p-2 border text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
//   onClick={() => handleOrderClick(o)}
// >
//   {o.bookingCode}
// </td>

//                           <td className="p-2 border">{o.orderDate}</td>
//                           <td className="p-2 border">{o.pickupPoint}</td>
//                           <td className="p-2 border">₹{o.totalAmount.toLocaleString("en-IN")}</td>
//                           <td className="p-2 border">{o.invoiceNumber}</td>
//                           <td className="p-2 border">₹{o.invoiceAmount.toLocaleString("en-IN")}</td>
//                           <td className="p-2 border">₹{o.discount.toLocaleString("en-IN")}</td>
//                           <td className="p-2 border text-green-600 font-medium">{o.status}</td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan={8} className="p-4 text-center text-gray-500">
//                           No invoices linked with this payment.
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </>
//         ) : (
//           <p className="text-gray-500">
//             Payment details not found for this Payment ID.
//           </p>
//         )}
//       </main>

//       <footer className="mt-10 text-xs text-gray-500 pt-2 text-center">
//         2025 © GraceCabs.in. Powered by Celexsa
//       </footer>
//     </PageLayout>
//   );
// };

// export default ViewPaymentList;


import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";

interface PaymentDetailsUI {
  paymentNo: string; // ✅ show invoiceNumber (monthly) OR transactionId (regular)
  paymentMode: string;
  createdAt: string;
  amount: number;
  remarks: string;
  bankRefNo: string;
  paymentRefNo: string;
  status?: string;
}

interface OrderRowUI {
  bookingCode: string;
  bookingId?: string;
  monthlyInvoiceId?: string;
  orderDate: string;
  pickupPoint: string;
  totalAmount: number;
  invoiceNumber: string;
  invoiceAmount: number;
  discount: number;
  status: string;
  viewType: "regular" | "monthly";
}

type MonthlyDetails = {
  monthlyInvoice: {
    monthlyInvoiceId: string;
    invoiceDate: string;
    companyName: string;
    vehicleNumber: string;
    finalTotal: number;
    createdAt: string;
    balanceDue: number;
  };
  invoice: null | {
    invoiceId: string;
    invoiceNumber: string;
    startDate: string;
    endDate: string;
    invoiceAmount: number;
    invoiceStatus: string;
    paymentId: string | null;
    createdAt: string;
  };
  payment: any | null; // your API shows null now
};

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
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const ViewPaymentList: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const viewType = (query.get("type") || "regular") as "regular" | "monthly";

  const [payment, setPayment] = useState<PaymentDetailsUI | null>(null);
  const [orders, setOrders] = useState<OrderRowUI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const statusMap: { [key: string]: string } = {
    "0": "Paid",
    "4": "Paid",
    "1": "Pending",
    "2": "Pending",
    "3": "Pending",
    "5": "Pending",
    "9": "Paid",
  };
  const getStatusText = (s: any) => statusMap[String(s)] || "Pending";

  const handleOrderClick = (order: OrderRowUI) => {
    if (order.viewType === "monthly") {
      navigate(`/orders/view/completed-list/${order.monthlyInvoiceId}?type=monthly`);
    } else {
      navigate(`/orders/view/completed-list/${order.bookingId}`);
    }
  };

  const fetchRegular = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/order/getOrderPaymentListById", {
        paymentId,
      });

      const data = res.data?.data;
      if (!data) return;

      setPayment({
        paymentNo: data.transactionId || "—",
        paymentMode: data.paymentMode || "Online",
        createdAt: formatToCustom(data.createdAt),
        amount: Number(data.amount || 0),
        remarks: "Amount received successfully",
        bankRefNo: data.bankRefNo || "—",
        paymentRefNo: data.paymentRefNo || "—",
        status: getStatusText(data.status),
      });

      const invoiceList = data.invoices || [];
      const formattedOrders: OrderRowUI[] = invoiceList.map((inv: any) => ({
        bookingCode: inv.booking?.bookingCode || "—",
        bookingId: inv.booking?.bookingId,
        orderDate: formatToCustom(data.createdAt),
        pickupPoint: inv.booking?.pickupPoint || "—",
        totalAmount: Number(inv.invoiceAmount || 0),
        invoiceNumber: inv.invoiceNumber || "—",
        invoiceAmount: Number(inv.invoiceAmount || 0),
        discount: 0,
        status: getStatusText(inv.invoiceStatus),
        viewType: "regular",
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error("Error fetching payment details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      // ✅ Here paymentId param = monthlyInvoiceId
      const res = await axiosInstance.get<{
        success: boolean;
        data: MonthlyDetails;
      }>(`/closePendingOrder/monthlyInvoice/${paymentId}/details`);

      const data = res.data?.data;
      if (!data) return;

      const invNo = data.invoice?.invoiceNumber || "—";

      // ✅ payment details from monthly api currently null -> show minimal
      setPayment({
        paymentNo: invNo, // ✅ Payment No = Invoice Number (as requested)
        paymentMode: data.payment?.paymentMode || "-",
        createdAt: formatToCustom(data.invoice?.createdAt || data.monthlyInvoice.createdAt),
        amount: Number(data.invoice?.invoiceAmount || data.monthlyInvoice.finalTotal || 0),
        remarks: "-",
        bankRefNo: "-",
        paymentRefNo: "-",
        status: getStatusText(data.invoice?.invoiceStatus),
      });

      setOrders([
        {
          bookingCode: data.monthlyInvoice.companyName || "Monthly Booking",
          monthlyInvoiceId: data.monthlyInvoice.monthlyInvoiceId,
          orderDate: formatToCustom(data.monthlyInvoice.invoiceDate),
          pickupPoint: "Monthly Booking",
          totalAmount: Number(data.invoice?.invoiceAmount || data.monthlyInvoice.finalTotal || 0),
          invoiceNumber: data.invoice?.invoiceNumber || "—",
          invoiceAmount: Number(data.invoice?.invoiceAmount || 0),
          discount: 0,
          status: getStatusText(data.invoice?.invoiceStatus),
          viewType: "monthly",
        },
      ]);
    } catch (err) {
      console.error("Error fetching monthly payment details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentId) return;
    if (viewType === "monthly") fetchMonthly();
    else fetchRegular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, viewType]);

  const breadcrumb = useMemo(() => {
    if (payment?.paymentNo && payment.paymentNo !== "—") return payment.paymentNo;
    return orders[0]?.bookingCode || "Payment";
  }, [payment?.paymentNo, orders]);

  return (
    <PageLayout breadcrumbName={breadcrumb}>
      <main className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">View Payment</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Back
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading payment details...</p>
        ) : payment ? (
          <>
            {/* Payment Details */}
            <div className="border rounded-lg shadow-md bg-white mb-6 p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Payment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p>
                  <strong>Payment No:</strong> {payment.paymentNo}
                </p>
                <p>
                  <strong>Payment Date:</strong> {payment.createdAt}
                </p>
                <p>
                  <strong>Payment Mode:</strong> {payment.paymentMode}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600 font-semibold">
                    {payment.status || "—"}
                  </span>
                </p>
                <p>
                  <strong>Amount Paid:</strong> ₹{payment.amount.toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Remarks:</strong> {payment.remarks}
                </p>
                <p>
                  <strong>Bank Ref. No:</strong> {payment.bankRefNo}
                </p>
                <p>
                  <strong>Payment Ref. No:</strong> {payment.paymentRefNo}
                </p>
              </div>

          
            </div>

            {/* Invoice List */}
            <div className="border rounded-lg shadow-md bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Invoice Details
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2 border">Order Number</th>
                      <th className="p-2 border">Order Date</th>
                      <th className="p-2 border">Pickup Point</th>
                      <th className="p-2 border">Total Amount (Rs.)</th>
                      <th className="p-2 border">Invoice Number</th>
                      <th className="p-2 border">Invoice Amount (Rs.)</th>
                      <th className="p-2 border">Discount (Rs.)</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.length > 0 ? (
                      orders.map((o, idx) => (
                        <tr key={idx} className="text-center">
                          <td
                            className="p-2 border text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                            onClick={() => handleOrderClick(o)}
                            title="Open order"
                          >
                            {o.bookingCode}
                          </td>

                          <td className="p-2 border">{o.orderDate}</td>
                          <td className="p-2 border">{o.pickupPoint}</td>
                          <td className="p-2 border">
                            ₹{o.totalAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 border">{o.invoiceNumber}</td>
                          <td className="p-2 border">
                            ₹{Number(o.invoiceAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 border">
                            ₹{Number(o.discount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 border text-green-600 font-medium">
                            {o.status}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-gray-500">
                          No invoices linked with this payment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Payment details not found for this ID.</p>
        )}
      </main>

    <footer className="mt-auto text-xs text-gray-500 pt-2 text-center">
  © {new Date().getFullYear()} GraceCabs.in. Powered by Celexsa
</footer>

    </PageLayout>
  );
};

export default ViewPaymentList;
