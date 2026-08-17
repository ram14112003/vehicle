import React, { useEffect, useState, useMemo, useRef } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import SearchBar from "../../../components/SearchBar";
import { DataTable, Column } from "../../../components/DataTable";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";

interface InvoiceRow {
  bookingId?: string;
  invoiceId?: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  pickupPoint: string;
  invoiceAmount: string;
  invoiceAmountRaw?: number;
}

interface PaymentInfo {
  remarks: string;
  paymentMode: string;
  transactionId: string;
}

interface Company {
  companyId: string;
  companyName: string;
}

interface User {
  userId: string;
  username: string;
  email: string;
  companyId: string;
  gstNo?: string;
  phone?: string;
  address?: string;
}

interface ApiItem {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  pickupPoint: string;
  userId: string;
  createdAt: string;

  payment?: {
    paymentId?: string;
    invoices?: Array<{
      invoiceId?: string;
      invoiceNumber?: number;
      invoiceAmount?: number;
    }>;
  };

  userName?: string;
  companyName?: string;
  companyId?: string;
  emailAddress?: string;

  orderNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceId?: string;
  invoiceAmount?: number;
  orderDate?: string;
  pickupDate?: string;
  transactionId?: string;
}

const PaymentForInvoices: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const { invoiceId, bookingId, transactionId: routedTxnId } = (location.state || {}) as {
    invoiceId?: string;
    bookingId?: string;
    transactionId?: string;
  };

  const [showFilterBox, setShowFilterBox] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [tableData, setTableData] = useState<InvoiceRow[]>([]);
  const [filteredData, setFilteredData] = useState<InvoiceRow[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    remarks: "",
    paymentMode: "",
    transactionId: routedTxnId ?? "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [allOrders, setAllOrders] = useState<ApiItem[]>([]);
  const [pageKey, setPageKey] = useState(0);

  // ✅ NEW: Selection set (invoiceId)
  const [selectedInvoiceSet, setSelectedInvoiceSet] = useState<Set<string>>(new Set());

  // ✅ NEW: filter container ref for Enter key
  const filterBoxRef = useRef<HTMLDivElement | null>(null);

  // ✅ select-all status
  const isAllSelected = useMemo(() => {
    if (tableData.length === 0) return false;
    return tableData.every((r) => r.invoiceId && selectedInvoiceSet.has(r.invoiceId));
  }, [tableData, selectedInvoiceSet]);

  // ✅ selected rows
  const selectedRows = useMemo(() => {
    return tableData.filter((r) => r.invoiceId && selectedInvoiceSet.has(r.invoiceId));
  }, [tableData, selectedInvoiceSet]);

  // ✅ default select all whenever tableData changes
  useEffect(() => {
    if (tableData.length > 0) {
      const all = new Set(
        tableData.map((r) => r.invoiceId).filter((id): id is string => Boolean(id))
      );
      setSelectedInvoiceSet(all);
    } else {
      setSelectedInvoiceSet(new Set());
    }
  }, [tableData]);

  // ✅ total based on selected rows
  useEffect(() => {
    const total = selectedRows.reduce((sum, r) => sum + (r.invoiceAmountRaw || 0), 0);
    setTotalAmount(total);
  }, [selectedRows]);

  useEffect(() => {
    if (navigationType !== "POP") {
      sessionStorage.removeItem("PaymentForInvoicesData");
    }
  }, [navigationType]);

  useEffect(() => {
    const saved = sessionStorage.getItem("PaymentForInvoicesData");
    if (saved) {
      const {
        tableData: savedTableData,
        selectedCompany: savedCompany,
        selectedUser: savedUser,
        totalAmount: savedTotal,
        showPaymentInfo: savedShowPayment,
        paymentInfo: savedPaymentInfo,
      } = JSON.parse(saved);

      if (savedTableData) {
        setTableData(savedTableData);
        setFilteredData(savedTableData);
      }

      if (savedCompany) setSelectedCompany(savedCompany);
      if (savedUser) setSelectedUser(savedUser);
      if (savedTotal) setTotalAmount(savedTotal);
      if (savedShowPayment !== undefined) setShowPaymentInfo(savedShowPayment);
      if (savedPaymentInfo) setPaymentInfo(savedPaymentInfo);
    }
  }, []);

  const columns: Column<InvoiceRow>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              setSelectedInvoiceSet(
                new Set(
                  tableData.map((r) => r.invoiceId).filter((id): id is string => Boolean(id))
                )
              );
            } else {
              setSelectedInvoiceSet(new Set());
            }
          }}
        />
      ) as any,
      accessor: "invoiceNumber",
      render: (row) => (
        <input
          type="checkbox"
          checked={!!row.invoiceId && selectedInvoiceSet.has(row.invoiceId)}
          onChange={(e) => {
            const checked = e.target.checked;
            if (!row.invoiceId) return;

            setSelectedInvoiceSet((prev) => {
              const next = new Set(prev);
              if (checked) next.add(row.invoiceId!);
              else next.delete(row.invoiceId!);
              return next;
            });
          }}
        />
      ),
    },

    {
      header: "Order Number #",
      accessor: "orderNumber",
      render: (row) => (
        <button
          className="text-blue-600 hover:underline font-bold"
          onClick={() => {
            sessionStorage.setItem(
              "PaymentForInvoicesData",
              JSON.stringify({
                tableData,
                selectedCompany,
                selectedUser,
                totalAmount,
                showPaymentInfo,
                paymentInfo,
              })
            );
            navigate(`/orders/view/payment-pending-order/${row.bookingId}`);
          }}
        >
          {row.orderNumber}
        </button>
      ),
    },
    { header: "Invoice Number #", accessor: "invoiceNumber" },
    { header: "Invoice Date", accessor: "invoiceDate" },
    { header: "User Name", accessor: "userName" },
    { header: "Pickup Point", accessor: "pickupPoint" },
    { header: "Invoice Amount (Rs.)", accessor: "invoiceAmount" },
  ];

  const handleInputBoxChange = (name: string, value: string) => {
    setPaymentInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavePayment = async () => {
    if (!paymentInfo.paymentMode || !paymentInfo.transactionId) {
      showToast("Please select a Payment Mode and enter a Transaction ID.", "warn");
      return;
    }

    const dataToProcess = selectedRows;

    if (dataToProcess.length === 0) {
      showToast("Please select at least one invoice.", "warn");
      return;
    }

    const invoiceIdsToProcess = dataToProcess
      .map((row) => row.invoiceId)
      .filter((id): id is string => Boolean(id));

    if (invoiceIdsToProcess.length === 0) {
      showToast("Invoice IDs are missing. Cannot save payment.", "error");
      console.error("❌ No valid invoice IDs found in selected rows:", dataToProcess);
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

      const apiUrl = `/closePendingOrder/savePaymentForInvoice`;
      const response = await axiosInstance.post(apiUrl, payload);

      if (response.data.success) {
        showToast(
          response.data.message ||
            `Payment saved successfully for ${invoiceIdsToProcess.length} invoice(s)!`,
          "success"
        );

        sessionStorage.removeItem("PaymentForInvoicesData");

        setPaymentInfo({ remarks: "", paymentMode: "", transactionId: "" });
        setTableData([]);
        setFilteredData([]);
        setTotalAmount(0);
        setShowPaymentInfo(false);
        setSelectedInvoiceSet(new Set());

        setTimeout(() => {
          navigate("/orders/paymentpending");
        }, 1200);
      } else {
        showToast(`Failed: ${response.data.message}`, "error");
      }
    } catch (err: any) {
      console.error("Error saving payment:", err);
      showToast(
        err.response?.data?.message || "An unexpected error occurred while saving payment.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataFilter = (filtered: InvoiceRow[]) => {
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (!invoiceId && !bookingId) return;

    const fetchInvoiceData = async () => {
      try {
        const invoiceRes = await axiosInstance.get(
          `/closePendingOrder/getPaymentForPendingInvoice/${invoiceId}`
        );
        const bookingRes = await axiosInstance.post("/order/getOrdersById", { bookingId });

        const invoiceDetails = invoiceRes.data?.data;
        const bookingDetails = bookingRes.data?.data;

        const amountRaw = invoiceDetails?.invoiceAmount || 0;

        const formatted: InvoiceRow[] = [
          {
            bookingId,
            invoiceId,
            orderNumber: bookingDetails?.bookingCode || "-",
            invoiceNumber: invoiceDetails?.invoiceNumber || "-",
            invoiceDate: invoiceDetails?.invoiceDate
              ? new Date(invoiceDetails.invoiceDate).toLocaleDateString("en-IN")
              : "-",
            userName: bookingDetails?.user?.username || "-",
            pickupPoint: bookingDetails?.pickupPoint || "-",
            invoiceAmount: amountRaw
              ? `₹${Number(amountRaw).toLocaleString("en-IN")}`
              : "₹0",
            invoiceAmountRaw: amountRaw,
          },
        ];

        setTableData(formatted);
        setFilteredData(formatted);

        setPaymentInfo((prev) => ({
          ...prev,
          transactionId: prev.transactionId || invoiceDetails?.transactionId || "",
        }));

        setShowPaymentInfo(true);
      } catch (err) {
        console.error(err);
        showToast("Failed to load invoice details", "error");
      }
    };

    fetchInvoiceData();
  }, [invoiceId, bookingId]);

  useEffect(() => {
    if (routedTxnId) {
      setPaymentInfo((p) => ({ ...p, transactionId: p.transactionId || routedTxnId }));
    }
  }, [routedTxnId]);

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

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/company/getAllCompany?status=0");
        setCustomerOptions(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const fetchUsersByCompany = async () => {
        try {
          const res = await axiosInstance.get(`/user/getAllUserByCompany/${selectedCompany}`);
          setUserOptions(res.data?.data || []);

          const saved = sessionStorage.getItem("PaymentForInvoicesData");
          if (!saved) {
            setSelectedUser("");
            setTableData([]);
            setFilteredData([]);
            setTotalAmount(0);
            setShowPaymentInfo(false);
          }
        } catch (err) {
          console.error("Error fetching users:", err);
        }
      };
      fetchUsersByCompany();
    } else {
      const saved = sessionStorage.getItem("PaymentForInvoicesData");
      if (!saved) {
        setUserOptions([]);
        setSelectedUser("");
        setTableData([]);
        setFilteredData([]);
        setTotalAmount(0);
        setShowPaymentInfo(false);
      }
    }
  }, [selectedCompany]);

  useEffect(() => {
    const saved = sessionStorage.getItem("PaymentForInvoicesData");
    if (!saved) {
      setTableData([]);
      setFilteredData([]);
      setTotalAmount(0);
      setShowPaymentInfo(false);
    }
  }, [selectedUser]);

  const fetchOrders = async () => {
    try {
      let url = "/invoiceRoutes/getPendingInvoices";
      const params: string[] = [];
      if (selectedCompany) params.push(`companyId=${selectedCompany}`);
      if (selectedUser) params.push(`userId=${selectedUser}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await axiosInstance.get(url);
      const invoices: ApiItem[] = res.data?.data || [];

      const mapped: InvoiceRow[] = invoices.map((inv) => {
        const amountRaw = inv.invoiceAmount || 0;

        let extractedInvoiceId = inv.invoiceId;

        if (!extractedInvoiceId && inv.payment?.invoices && inv.payment.invoices.length > 0) {
          extractedInvoiceId = inv.payment.invoices[0].invoiceId;
        }

        return {
          bookingId: inv.bookingId,
          invoiceId: extractedInvoiceId,
          orderNumber: inv.orderNumber || inv.bookingCode || "N/A",
          invoiceNumber:
            inv.invoiceNumber?.toString() ||
            inv.payment?.invoices?.[0]?.invoiceNumber?.toString() ||
            "N/A",
          invoiceDate: inv.invoiceDate
            ? new Date(inv.invoiceDate).toLocaleDateString("en-IN")
            : "N/A",
          userName: inv.userName || "-",
          pickupPoint: `${inv.pickupPoint || ""}`,
          invoiceAmount: amountRaw
            ? `₹${Number(amountRaw).toLocaleString("en-IN")}`
            : "₹0",
          invoiceAmountRaw: amountRaw,
        };
      });

      setAllOrders(invoices);
      setTableData(mapped);
      setFilteredData(mapped);

      if (invoices[0]?.transactionId) {
        setPaymentInfo((prev) => ({
          ...prev,
          transactionId: prev.transactionId || invoices[0].transactionId!,
        }));
      }

      setShowPaymentInfo(invoices.length > 0);

      sessionStorage.setItem(
        "PaymentForInvoicesData",
        JSON.stringify({
          tableData: mapped,
          selectedCompany,
          selectedUser,
          totalAmount,
          showPaymentInfo: invoices.length > 0,
          paymentInfo: {
            ...paymentInfo,
            transactionId: paymentInfo.transactionId || invoices[0]?.transactionId || "",
          },
        })
      );
    } catch (err) {
      console.error("Error fetching pending invoices:", err);
      setTableData([]);
      setFilteredData([]);
      setShowPaymentInfo(false);
      setTotalAmount(0);
    }
  };

  const handleSearchClick = () => {
    if (!selectedCompany || !selectedUser) {
      showToast("Please select both Company and User before searching.", "warn");
      return;
    }
    fetchOrders();
  };

  // ✅ ENTER key support (inside filter box only)
  useEffect(() => {
    if (!showFilterBox) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      const active = document.activeElement as HTMLElement | null;
      if (filterBoxRef.current && active && filterBoxRef.current.contains(active)) {
        e.preventDefault();
        handleSearchClick();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showFilterBox, selectedCompany, selectedUser]);

  return (
    <PageLayout key={pageKey}>
      <AlertContainer />
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Payment For Pending Invoice
        </h1>
      </div>

      <div className="mb-4">
        <CommonButton
          onClick={() => setShowFilterBox(!showFilterBox)}
          variant="darkblue"
          className="text-sm"
        >
          Filter {showFilterBox ? "▲" : "▼"}
        </CommonButton>
      </div>

      {showFilterBox && (
        <div
          ref={filterBoxRef}
          className="rounded-lg w-full max-w-4xl bg-gray-50 p-6 mb-6 shadow-sm"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <label className="text-sm font-medium text-gray-700">
                Customer<span className="text-red-500">*</span>
              </label>
              <select
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">Select company...</option>
                {customerOptions.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[280px] flex-1">
              <label className="text-sm font-medium text-gray-700">
                User<span className="text-red-500">*</span>
              </label>
              <select
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select user...</option>
                {userOptions.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-[10px]">
              <SearchBar onlyButton onSearch={handleSearchClick} />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <DataTable
          columns={columns}
          data={tableData}
          rowsPerPage={5}
          emptyMessage="No pending invoices found. Use the filter to search."
        />

        {showPaymentInfo && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Info</h3>

            <div className="text-sm text-gray-600 mb-3">
              Selected invoices: <b>{selectedRows.length}</b> / {tableData.length}
            </div>

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

            <div className="mt-6 flex gap-4">
              <CommonButton
                variant="success"
                className="px-4 py-2"
                onClick={handleSavePayment}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </CommonButton>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PaymentForInvoices;