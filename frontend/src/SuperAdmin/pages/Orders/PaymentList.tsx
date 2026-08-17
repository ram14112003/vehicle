import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import InputBox, { getFormStore } from "../../../components/InputBox";
import SearchBar from "../../../components/SearchBar";
import axiosInstance from "../../../utils/axiosInstance";

interface PaymentRow {
  id: string; // ✅ Regular: paymentId, Monthly: monthlyInvoiceId
  paymentNo: string; // ✅ Regular: transactionId, Monthly: invoiceNumber
  paymentMode: string;
  createdAt: string;
  amount: string;
  viewType: "regular" | "monthly";
}

type MonthlyRow = {
  monthlyInvoiceId: string;
  invoiceDate: string;
  companyName: string;
  vehicleNumber: string;
  finalTotal: number;
  createdAt: string;
  invoice: null | {
    invoiceNumber: string;
    invoiceAmount: number;
    invoiceStatus: string;
    paymentId: string | null;
    payment: null | {
      paymentId: string;
      paymentMode: string;
      transactionId: string | null;
      amount: any;
      createdAt: string;
      status?: string;
      isOnline?: boolean;
    };
  };
};

// ✅ NEW: Regular API response type (ClosePending -> Invoice -> Payment)
type ClosePendingRow = {
  closependingId: string;
  createdAt?: string;
  invoice?: any[];   // your model uses @HasMany(() => Invoice) invoice!: Invoice[];
  invoices?: any[];  // fallback if backend sends "invoices"
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

const ListPayment: React.FC = () => {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewType, setViewType] = useState<"regular" | "monthly">("regular");
  const navigate = useNavigate();
const filterFormRef = useRef<HTMLDivElement | null>(null);


  // ========= REGULAR FETCH (UPDATED BASED ON BACKEND: ClosePending -> Invoice -> Payment) =========
  const fetchRegularPayments = async (filters: any = {}) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/emp/paymentCompletedOrderCount", {
        params: filters,
      });

      const list: ClosePendingRow[] = res.data?.data || [];

      // ✅ Flatten: each ClosePending may have multiple invoices, each invoice has payment
   const flattened: PaymentRow[] = list.flatMap((cp: any) => {
  const invList = cp?.invoice || cp?.invoices || [];
  if (!Array.isArray(invList) || invList.length === 0) return [];

  return invList
    .map((inv: any): PaymentRow | null => {
      const pay = inv?.payment;
      if (!pay?.paymentId) return null;

      const amountVal = pay?.amount ?? inv?.invoiceAmount ?? 0;

      return {
        id: pay.paymentId,
        paymentNo: pay.transactionId || "—",
        paymentMode: pay.paymentMode || "-",
        createdAt: formatToCustom(pay.createdAt || inv?.createdAt || cp?.createdAt),
        amount: Number(amountVal || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
        viewType: "regular",
      };
    })
    .filter((x): x is PaymentRow => x !== null); // ✅ Type guard
});


      setRows(flattened);
    } catch (err) {
      console.error("❌ Error fetching regular payments:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // ========= MONTHLY FETCH =========
  const fetchMonthlyPayments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<{
        success: boolean;
        data: MonthlyRow[];
      }>("/closePendingOrder/monthlyInvoice/getAllmonthly");

      let list = res.data?.data || [];

      // OPTIONAL local filters (paymentNo / dateRange) from form store
      const form = getFormStore();
      const { paymentNo, dateRange } = form || {};

      if (paymentNo && String(paymentNo).trim()) {
        const s = String(paymentNo).trim().toLowerCase();
        list = list.filter((r) => {
          const invNo = (r.invoice?.invoiceNumber || "").toLowerCase();
          const mode = (r.invoice?.payment?.paymentMode || "").toLowerCase();
          const txn = (r.invoice?.payment?.transactionId || "").toLowerCase();
          const veh = (r.vehicleNumber || "").toLowerCase();
          return (
            invNo.includes(s) ||
            mode.includes(s) ||
            txn.includes(s) ||
            veh.includes(s)
          );
        });
      }

      if (dateRange) {
        const [fromRaw, toRaw] = dateRange.split(" - ");
        if (fromRaw && toRaw) {
          const [fD, fM, fY] = fromRaw.split("/");
          const [tD, tM, tY] = toRaw.split("/");
          const start = new Date(`${fY}-${fM}-${fD}`);
          const end = new Date(`${tY}-${tM}-${tD}`);
          end.setHours(23, 59, 59, 999);

          list = list.filter((r) => {
            const dt = new Date(r.createdAt || r.invoiceDate);
            return dt >= start && dt <= end;
          });
        }
      }

      const mapped: PaymentRow[] = list.map((r) => {
        const invoiceNo = r.invoice?.invoiceNumber || "—";
        const paymentMode = r.invoice?.payment?.paymentMode || "-";
        const amountValue =
          r.invoice?.invoiceAmount ?? r.finalTotal ?? r.invoice?.payment?.amount ?? 0;

        return {
          id: r.monthlyInvoiceId,
          paymentNo: invoiceNo,
          paymentMode,
          createdAt: formatToCustom(r.createdAt || r.invoiceDate),
          amount: Number(amountValue || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          }),
          viewType: "monthly",
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error("❌ Error fetching monthly payments:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // ========= INITIAL LOAD =========
  useEffect(() => {
    if (viewType === "regular") fetchRegularPayments();
    else fetchMonthlyPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType]);

  const handleView = (row: PaymentRow) => {
    if (row.viewType === "monthly") {
      navigate(`/orders/view/payment-list/${row.id}?type=monthly`);
    } else {
      // ✅ regular = paymentId
      navigate(`/orders/view/payment-list/${row.id}`);
    }
  };

  const columns: Column<PaymentRow>[] = [
    {
      header: "Payment No #",
      accessor: "paymentNo",
      render: (r) => (
        <span
          onClick={() => handleView(r)}
          className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          title="View"
        >
          {r.paymentNo}
        </span>
      ),
    },
    { header: "Payment Mode", accessor: "paymentMode" },
    { header: "Payment Date", accessor: "createdAt" },
    { header: "Amount Paid (Rs)", accessor: "amount" },
  ];

  const handleSearch = async () => {
    try {
      const form = getFormStore();
      const { paymentNo, dateRange } = form;

      if (viewType === "monthly") {
        fetchMonthlyPayments();
        return;
      }

      // regular filters -> backend params
      const filters: any = {};
      if (paymentNo) filters.paymentNo = paymentNo;

      if (dateRange) {
        const [fromRaw, toRaw] = dateRange.split(" - ");
        if (fromRaw && toRaw) {
          const [fD, fM, fY] = fromRaw.split("/");
          const [tD, tM, tY] = toRaw.split("/");
          filters.startDate = `${fY}-${fM}-${fD}`;
          filters.endDate = `${tY}-${tM}-${tD}`;
        }
      }

      fetchRegularPayments(filters);
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const active = document.activeElement as HTMLElement | null;

    // ✅ only when focus is inside filter box
    if (filterFormRef.current && active && filterFormRef.current.contains(active)) {
      // ✅ allow Enter inside textarea (if any)
      if (active.tagName === "TEXTAREA") return;

      e.preventDefault();
      if (loading) return;

      handleSearch(); // ✅ same as click search
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [loading, viewType, rows]); // keep simple deps (or just [loading, viewType])

  return (
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">List Payment</h1>

        {/* Filters */}
        <div className="mb-6">
          <div ref={filterFormRef} className="rounded-lg w-full max-w-7xl bg-gray-50 p-6 mb-6 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:gap-4">
  {/* Payment No */}
  <div className="w-full md:w-[350px]">
    <InputBox
      name="paymentNo"
      label="Payment Number"
      placeholder="Enter Payment Number / Invoice No / Mode"
    />
  </div>

  {/* Date Range */}
  <div className="w-full md:w-[280px]">
    <InputBox name="dateRange" label="Date Range" type="date-range" />
  </div>

  {/* Search Button */}
  <div className="w-full md:w-auto md:pb-4">
    <SearchBar onlyButton onSearch={handleSearch} />
  </div>
</div>

            <div className="flex gap-2 whitespace-nowrap">
              <button
                onClick={() => setViewType("regular")}
                className={`px-4 py-2 rounded font-semibold ${
                  viewType === "regular"
                    ? "bg-[#275981] text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Regular
              </button>

              <button
                onClick={() => setViewType("monthly")}
                className={`px-4 py-2 rounded font-semibold ${
                  viewType === "monthly"
                    ? "bg-[#275981] text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading payments...</p>
        ) : (
          <DataTable columns={columns} data={rows} onView={handleView} rowsPerPage={5} />
        )}
      </main>

   <footer className="mt-auto text-xs text-gray-500 pt-2 text-center">
  © {new Date().getFullYear()} GraceCabs.in. Powered by Celexsa
</footer>

    </PageLayout>
  );
};

export default ListPayment;