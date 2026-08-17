
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";

interface PaymentDetails {
  transactionId: string;
  paymentMode: string;
  createdAt: string;
  amount: number;
  remarks: string;
  bankRefNo: string;
  paymentRefNo: string;
}

interface Order {
  orderNumber: string;
  orderDate: string;
  pickupPoint: string;
  totalAmount: number;
  invoiceNumber: string;
  invoiceAmount: number;
  discount: number;
  status: string;
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
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const UserViewPaymentList: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPaymentDetails = async () => {
    if (!bookingId) {
      console.error("Booking ID is undefined. Cannot fetch details.");
      return;
    }

    try {
      setLoading(true);

      const res = await axiosInstance.post("/order/getOrderPaymentListById", {
        bookingId,
      });

      const booking = res.data?.data;
      if (booking) {
        // 🔹 Payment details
        setPayment({
          transactionId: booking.payment?.transactionId || "—",
          paymentMode: "Online", // fixed as API doesn't provide
          createdAt: new Date(booking.createdAt).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          amount: Number(booking.payment?.amount || 0),
          remarks: "Amount received from payment gateway",
          bankRefNo: booking.payment?.bankRefNo || "—",
          paymentRefNo: booking.payment?.paymentRefNo || "—",
        });

        // 🔹 Orders (1 booking → 1 row)
        const invoiceData = booking.payment?.invoices?.[0];
        const closePendingData = invoiceData?.closePending;

        setOrders([
          {
            orderNumber: booking.bookingCode,
            orderDate: formatToCustom(booking.bookingDate),
            pickupPoint: booking.pickupPoint || "Out Station",
            totalAmount: Number(booking.payment?.amount || 0),
            invoiceNumber: invoiceData?.invoiceNumber || "—",
            invoiceAmount: invoiceData?.invoiceAmount || 0,
            discount: Number(closePendingData?.discountAmount || 0),
            status: booking.confirmStatus === 9 ? "Pending" : "Paid",
          },
        ]);
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [bookingId]);

  return (
    <>
  <PageLayout breadcrumbName={orders[0]?.orderNumber || "Order"}>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">View Payment</h1>

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
                <p><strong>Payment No:</strong> {payment.transactionId}</p>
                <p><strong>Payment Date:</strong> {payment.createdAt}</p>
                <p><strong>Amount Paid:</strong> ₹{payment.amount.toLocaleString("en-IN")}</p>
                <p><strong>Remarks:</strong> {payment.remarks}</p>
                <p><strong>Bank Ref. No:</strong> {payment.bankRefNo}</p>
                <p><strong>Payment Ref. No:</strong> {payment.paymentRefNo}</p>
              </div>
            </div>

            {/* Order List */}
            <div className="border rounded-lg shadow-md bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Order List
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
                    {orders.map((o, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="p-2 border">{o.orderNumber}</td>
                        <td className="p-2 border">{o.orderDate}</td>
                        <td className="p-2 border">{o.pickupPoint}</td>
                        <td className="p-2 border">₹{o.totalAmount.toLocaleString("en-IN")}</td>
                        <td className="p-2 border">{o.invoiceNumber}</td>
                        <td className="p-2 border">₹{o.invoiceAmount.toLocaleString("en-IN")}</td>
                        <td className="p-2 border">₹{o.discount.toLocaleString("en-IN")}</td>
                        <td className="p-2 border text-green-600 font-medium">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Payment details not found for this booking ID.</p>
        )}
      </main>

 <footer className="mt-auto text-xs text-gray-500 pt-2 text-center">
  © {new Date().getFullYear()} GraceCabs.in. Powered by Celexsa
</footer>

    </PageLayout>
    </>
  );
};

export default UserViewPaymentList;