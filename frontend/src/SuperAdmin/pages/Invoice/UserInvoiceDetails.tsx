
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import logo from "../../../assets/logo.png";


interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  bookingId:string;
  invoiceAmount: number;
  pickupDate: string | null;
  pickupType: string | null;
  username: string | null;
  amount?: number; // if your API gives invoice amount
  email: string | null;
  phno: string | null;
  transactionId?: string | null;
}

const UserInvoiceDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState("");
  const [loading, setLoading] = useState(true);


  // useEffect(() => {
  //   const fetchInvoices = async () => {
  //     try {
  //       const response = await axiosInstance.get(
  //         `/invoiceRoutes/invoices/${userId}`
  //       ); // ✅ axiosInstance use pannuren
  //       if (response.data.success) {
  //         setInvoices(response.data.data);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching invoices:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (userId) fetchInvoices();
  // }, [userId]);
useEffect(() => {
  const fetchInvoices = async () => {
    try {
      const response = await axiosInstance.get(
        `/invoiceRoutes/invoices/${userId}`
      );

      if (response.data.success) {
        const invoiceData = response.data.data;
        setInvoices(invoiceData);

        // ✅ IMPORTANT: default ellame select aagum
        setSelectedIds(invoiceData.map((inv: Invoice) => inv.invoiceId));
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  if (userId) fetchInvoices();
}, [userId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((inv) => inv.invoiceId));
    }
  };

const totalAmount = invoices
  .filter((inv) => selectedIds.includes(inv.invoiceId))
  .reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0); 
  if (loading) {
    return <div className="p-6">Loading invoices...</div>;
  }


const handlePayNow = async () => {
  try {
    if (!userId) {
      alert("Missing userId");
      return;
    }
    if (selectedIds.length === 0) {
      alert("Please select at least one invoice");
      return;
    }

    // 1) Collect selection + amount
    const selectedInvoices = invoices.filter(inv =>
      selectedIds.includes(inv.invoiceId)
    );
    const bookingIds = selectedInvoices.map(inv => inv.bookingId);

    const amount = Number(totalAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }

    const customerEmail = selectedInvoices[0]?.email || undefined;
    const customerPhone = selectedInvoices[0]?.phno || undefined;

    // 2) Lock/initialise on your backend (prevents double-charging)
    const initResp = await axiosInstance.post(
      "/closePendingOrder/paymentInitialise",
      { userId, bookingId: bookingIds, amount }
    );
    if (!initResp.data?.success) {
      alert(`⚠️ ${initResp.data?.message || "Payment initialization failed"}`);
      return;
    }

    // If your init already returns a URL, use it
    const initUrl =
      initResp.data?.paymentUrl ||
      initResp.data?.data?.paymentUrl ||
      initResp.data?.redirectUrl ||
      initResp.data?.raw?.payment_links?.web;
    if (initUrl) {
      window.location.href = initUrl;
      return;
    }

    // 3) Create HDFC session via your payments route
    // NOTE: axiosInstance baseURL should already include /api
    // so this path is correct: /paymentRoutes/payments/create-session
    const sessionResp = await axiosInstance.post(
      "/paymentRoutes/payments/create-session",
      {  userId,                             // ✅ add userId
    invoiceIds: selectedInvoices.map(inv => inv.invoiceId),  // ✅ add invoices
    amount,
    customerEmail,
    customerPhone, }
    );

    // 4) Extract payment URL safely (handle all known shapes)
    const paymentUrl =
      sessionResp.data?.paymentUrl ||                                 // our controller sets this (preferred)
      sessionResp.data?.raw?.payment_links?.web ||                     // HDFC UAT shape
      sessionResp.data?.data?.payment_links?.web ||                    // if wrapped differently
      sessionResp.data?.redirectUrl ||
      sessionResp.data?.payment_page_url;

    if (!paymentUrl) {
      console.error("Create-session response:", sessionResp.data);
      alert("Payment session could not be created (no paymentUrl).");
      return;
    }

    // 5) Redirect user to HDFC payment page
    sessionStorage.setItem("last_order_id", sessionResp.data?.orderId);
    window.location.href = paymentUrl;
  } catch (err: any) {
    const data = err?.response?.data;
    const status = err?.response?.status;
    console.error("create-session/init error:", { status, data, err });
    alert(
      `❌ Payment start failed${status ? ` (HTTP ${status})` : ""}.\n` +
      `${data?.message || data?.error?.error_info?.developer_message || err?.message || "Unknown error"}`
    );
  }
};





return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* ✅ Top bar with Welcome message */}
      <div className="flex justify-between items-center mb-4">
          <img
      src={logo}
      alt="Grace Cabs"
      className="h-10 object-contain"
    />
        <h2 className="text-xl font-bold">Invoices</h2>
        <div className="text-right text-gray-700 font-medium">
          Welcome,{" "}
          <span className="text-green-600">
            {invoices[0]?.username || "User"}
          </span>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">
              <input
                type="checkbox"
                checked={selectedIds.length === invoices.length && invoices.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4"
              />
            </th>
            <th className="p-2">Invoice Number</th>
            <th className="p-2">Invoice Date</th>
            <th className="p-2">Description</th>
            <th className="p-2 text-right">Invoice Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.invoiceId} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(inv.invoiceId)}
                  onChange={() => toggleSelect(inv.invoiceId)}
                  className="h-4 w-4 text-sm"
                />
              </td>
              <td className="p-2 text-sm">#{inv.invoiceNumber}</td>
              <td className="p-2 text-sm">
                {new Date(inv.invoiceDate).toLocaleString()}
              </td>
              <td className="p-2 text-sm">
                <div>Pickup Type : {inv.pickupType || "N/A"}</div>
                {inv.pickupDate && (
                  <div className="text-gray-600 text-sm">
                    Pickup Date : {new Date(inv.pickupDate).toLocaleString()}
                  </div>
                )}
              </td>
              <td className="p-2 text-right font-medium">
                {(inv.invoiceAmount || 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <label className="font-medium">Payment Mode:</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="border rounded-lg p-2"
          >
            <option value="">-- Select Payment Mode --</option>
            <option value="ccavenue">CC Avenue</option>
          </select>
        </div>

        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="font-semibold text-green-700">
            Total Payable:{" "}
            <span className="text-xl">₹{totalAmount.toLocaleString()}</span>
          </div>
         <button
  disabled={selectedIds.length === 0 || !paymentMode}
  onClick={handlePayNow}   // ✅ added
  className={`px-6 py-2 rounded-lg font-semibold text-white ${
    selectedIds.length === 0 || !paymentMode
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  Pay Now
</button>

        </div>
      </div>
    </div>
  );
};

export default UserInvoiceDetails;
