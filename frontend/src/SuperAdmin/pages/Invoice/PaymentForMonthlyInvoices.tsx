// src/SuperAdmin/pages/Invoice/PaymentForMonthlyInvoices.tsx
import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import { DataTable, Column } from "../../../components/DataTable";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";

type MonthlyDetails = {
  monthlyInvoice: {
    monthlyInvoiceId: string;
    invoiceDate: string; // "2025-07-02"
    companyName: string;
    finalTotal: number;
    balanceDue: number;
  };
  invoice: {
    invoiceId: string;
    invoiceNumber: string;
    invoiceAmount: number;
    invoiceStatus: string;
    createdAt: string;
  } | null;
  company: {
    companyId: string;
    companyName: string;
  };
};

interface MonthlyInvoiceRow {
  monthlyInvoiceId?: string;
  invoiceId?: string;

  invoiceNumber: string;
  invoiceDate: string;
  companyName: string;

  invoiceAmount: string;
  invoiceAmountRaw?: number;
}

interface PaymentInfo {
  remarks: string;
  paymentMode: string;
  transactionId: string;
}

const toINDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN");
};

const PaymentForMonthlyInvoices: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const { monthlyInvoiceId, invoiceId, transactionId: routedTxnId } = (location.state || {}) as {
    monthlyInvoiceId?: string; // IMPORTANT
    invoiceId?: string;
    transactionId?: string;
  };

  const [tableData, setTableData] = useState<MonthlyInvoiceRow[]>([]);
  const [filteredData, setFilteredData] = useState<MonthlyInvoiceRow[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    remarks: "",
    paymentMode: "",
    transactionId: routedTxnId ?? "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // ✅ keep page state when back button
  useEffect(() => {
    if (navigationType !== "POP") {
      sessionStorage.removeItem("PaymentForMonthlyInvoicesData");
    }
  }, [navigationType]);

  useEffect(() => {
    const saved = sessionStorage.getItem("PaymentForMonthlyInvoicesData");
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (parsed?.tableData) {
      setTableData(parsed.tableData);
      setFilteredData(parsed.tableData);
    }
    if (parsed?.totalAmount) setTotalAmount(parsed.totalAmount);
    if (parsed?.paymentInfo) setPaymentInfo(parsed.paymentInfo);
  }, []);

  const columns: Column<MonthlyInvoiceRow>[] = useMemo(
    () => [
      {
        header: "Invoice Number #",
        accessor: "invoiceNumber",
        render: (row) => (
          <button
            className="text-blue-600 hover:underline font-bold"
            onClick={() => {
              // back to monthly pending view page (optional)
              if (!row.monthlyInvoiceId) return;
              sessionStorage.setItem(
                "PaymentForMonthlyInvoicesData",
                JSON.stringify({ tableData, totalAmount, paymentInfo })
              );
              navigate(`/orders/view/payment-pending-order/${row.monthlyInvoiceId}?type=monthly`);
            }}
          >
            {row.invoiceNumber}
          </button>
        ),
      },
      { header: "Invoice Date", accessor: "invoiceDate" },
      { header: "Company Name", accessor: "companyName" },
      { header: "Invoice Amount (Rs.)", accessor: "invoiceAmount" },
    ],
    [navigate, tableData, totalAmount, paymentInfo]
  );

  const handleInputBoxChange = (name: string, value: string) => {
    setPaymentInfo((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ monthly invoice data load
  useEffect(() => {
    if (!monthlyInvoiceId) {
      showToast("MonthlyInvoiceId missing!", "error");
      return;
    }

    const fetchMonthly = async () => {
      try {
        const res = await axiosInstance.get<{ success: boolean; data: MonthlyDetails }>(
          `/closePendingOrder/monthlyInvoice/${monthlyInvoiceId}/details`
        );

        const data = res.data?.data;
        const inv = data?.invoice;
        const m = data?.monthlyInvoice;
        const c = data?.company;

        if (!m) {
          showToast("Monthly invoice data not found", "error");
          return;
        }
        if (!inv?.invoiceId) {
          showToast("Invoice not created for this monthly invoice", "error");
          return;
        }

        const amountRaw = Number(inv.invoiceAmount ?? m.finalTotal ?? 0);

        const rows: MonthlyInvoiceRow[] = [
          {
            monthlyInvoiceId: m.monthlyInvoiceId,
            invoiceId: inv.invoiceId,
            invoiceNumber: inv.invoiceNumber || "-",
            invoiceDate: toINDate(m.invoiceDate || inv.createdAt),
            companyName: c?.companyName || m.companyName || "-",
            invoiceAmount: amountRaw ? `₹${amountRaw.toLocaleString("en-IN")}` : "₹0",
            invoiceAmountRaw: amountRaw,
          },
        ];

        setTableData(rows);
        setFilteredData(rows);
        setTotalAmount(amountRaw);

        setPaymentInfo((prev) => ({
          ...prev,
          transactionId: prev.transactionId || routedTxnId || "",
        }));

        sessionStorage.setItem(
          "PaymentForMonthlyInvoicesData",
          JSON.stringify({
            tableData: rows,
            totalAmount: amountRaw,
            paymentInfo: {
              ...paymentInfo,
              transactionId: (paymentInfo.transactionId || routedTxnId || ""),
            },
          })
        );
      } catch (err) {
        console.error(err);
        showToast("Failed to load monthly invoice details", "error");
      }
    };

    fetchMonthly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyInvoiceId, invoiceId, routedTxnId]);

  // payment modes
  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const res = await axiosInstance.get("/paymentmode/getAllPaymentMode");
        const modes = res.data?.paymentModes || [];
        setPaymentModes(modes.map((m: any) => m.modelname));
      } catch (err) {
        console.error("Error fetching payment modes", err);
        setPaymentModes([]);
      }
    };
    fetchPaymentModes();
  }, []);

  const handleSavePayment = async () => {
    if (!paymentInfo.paymentMode || !paymentInfo.transactionId) {
      showToast("Please select Payment Mode and enter Transaction ID.", "warn");
      return;
    }

    const dataToProcess = filteredData.length > 0 ? filteredData : tableData;
    if (dataToProcess.length === 0) {
      showToast("No invoices available to process.", "error");
      return;
    }

    const invoiceIdsToProcess = dataToProcess
      .map((r) => r.invoiceId)
      .filter((id): id is string => Boolean(id));

    if (invoiceIdsToProcess.length === 0) {
      showToast("Invoice IDs missing. Cannot save payment.", "error");
      return;
    }

    const calculatedTotal = dataToProcess.reduce(
      (sum, row) => sum + (row.invoiceAmountRaw || 0),
      0
    );

    setIsLoading(true);
    try {
      const payload = {
        invoiceId: invoiceIdsToProcess,
        paymentMode: paymentInfo.paymentMode,
        transactionId: paymentInfo.transactionId,
        remarks: paymentInfo.remarks,
        amount: calculatedTotal,
      };

      const response = await axiosInstance.post(`/closePendingOrder/savePaymentForInvoice`, payload);

      if (response.data.success) {
        showToast(response.data.message || "Payment saved successfully!", "success");

        sessionStorage.removeItem("PaymentForMonthlyInvoicesData");

        setPaymentInfo({ remarks: "", paymentMode: "", transactionId: "" });
        setTableData([]);
        setFilteredData([]);
        setTotalAmount(0);

        setTimeout(() => {
          navigate("/orders/paymentpending");
        }, 1200);
      } else {
        showToast(`Failed: ${response.data.message}`, "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Error saving payment.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Payment For Monthly Invoice</h1>

        <CommonButton variant="darkblue" onClick={() => navigate(-1)}>
          Back
        </CommonButton>
      </div>

      <div className="mt-6 space-y-6">
        <DataTable
          columns={columns}
          data={tableData}
          rowsPerPage={5}
          emptyMessage="No monthly invoice found."
        />

        {/* Payment Info */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Info</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputBox
              name="totalAmount"
              label="Total Amount"
              value={`₹${totalAmount.toLocaleString("en-IN")}`}
              type="text"
              readOnly
            />

            <InputBox
              name="remarks"
              label="Remarks"
              placeholder="Enter remarks"
              value={paymentInfo.remarks}
              onChange={handleInputBoxChange}
            />

            <InputBox
              name="paymentMode"
              label="Payment Mode"
              options={paymentModes}
              value={paymentInfo.paymentMode}
              onChange={handleInputBoxChange}
            />

            <InputBox
              name="transactionId"
              label="Transaction ID"
              placeholder="Enter Transaction ID"
              value={paymentInfo.transactionId}
              onChange={handleInputBoxChange}
            />
          </div>

          <div className="mt-6 flex gap-4 items-center">
            <CommonButton
              variant="success"
              className="px-4 py-2"
              onClick={handleSavePayment}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </CommonButton>

            <div className="text-xs text-gray-500">
              Invoices to process: {filteredData.length > 0 ? filteredData.length : tableData.length}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PaymentForMonthlyInvoices;
