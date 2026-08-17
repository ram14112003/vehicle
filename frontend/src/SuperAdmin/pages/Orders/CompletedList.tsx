import React, { useEffect, useRef, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import InputBox from "../../../components/InputBox";
import SearchBar from "../../../components/SearchBar";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import { useNavigate, useLocation } from "react-router-dom";

interface CompletedOrder {
  orderNumber: string; // regular: orderNumber, monthly: monthlyInvoiceId
  invoiceNumber: string | null;
  orderDate: string;
  pickupDate: string;
  pickupPoint: string; // monthly => "Monthly Booking"
  userName: string; // monthly => companyName
  paymentMode: string;
  invoiceAmount: string | number;
  bookingId: string; // regular: bookingId, monthly: monthlyInvoiceId
  userId?: string;
  companyName?: string;
  _rowType?: "regular" | "monthly";
}

interface Company {
  companyId: string;
  companyName: string;
}

// ===== Monthly API types (based on your response) =====
type MonthlyRow = {
  monthlyInvoiceId: string;
  invoiceDate: string;
  invoiceMonth: string;
  companyId: string;
  companyName: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  vehicleNumber: string;
  finalTotal: number;
  balanceDue: number;
  createdAt: string;
  invoiceId: string | null;
  invoice: null | {
    invoiceId: string;
    invoiceNumber: string;
    invoiceAmount: number;
    paymentId: string | null;
    payment: null | {
      paymentId: string;
      paymentMode: string;
      status?: string;
      transactionId?: string | null;
      amount?: any;
      tax?: any;
      createdAt?: string;
      isOnline?: boolean;
    };
  };
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

export default function ListCompletedOrders() {
  const location = useLocation();
  const { userId } = location.state || {};

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const [viewType, setViewType] = useState<"regular" | "monthly">("regular");

  const [searchText, setSearchText] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const filterFormRef = useRef<HTMLDivElement | null>(null);

  // ===================== ACTIONS =====================
  const handleViewRegular = (row: CompletedOrder) => {
    navigate(`/orders/view/completed-list/${row.bookingId}`, {
      state: { userId: row.userId },
    });
  };

const handleViewMonthly = (row: CompletedOrder) => {
  navigate(`/orders/view/completed-list/${row.bookingId}?type=monthly`);
};
  const handleCopy = async (order: CompletedOrder) => {
    try {
      const response = await axiosInstance.get(`/order/details/${order.orderNumber}`);
      if (response.data) {
        const bookingData = response.data;
        const uId = bookingData?.booking?.user?.userId;
        const cId = bookingData?.booking?.user?.companyId;

        navigate(`/users/createinvoice/${uId}?companyId=${cId}`, {
          state: {
            copyFromBooking: true,
            bookingData,
            userId: uId,
            companyId: cId,
            orderNumber: order.orderNumber,
          },
        });
      } else {
        showToast("Failed to fetch booking details", "error");
      }
    } catch (error) {
      console.error("Error fetching booking details for copy:", error);
      showToast("Error fetching booking details", "error");
    }
  };

  // ===================== Columns =====================
  const regularColumns: Column<CompletedOrder>[] = [
    {
      header: "Order Number #",
      accessor: "orderNumber",
      render: (row) => (
        <span
          onClick={() => handleViewRegular(row)}
          className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
        >
          {row.orderNumber}
        </span>
      ),
    },
    { header: "Invoice Number #", accessor: "invoiceNumber" },
    { header: "Order Date", accessor: "orderDate" },
    { header: "Pickup Date", accessor: "pickupDate" },
    { header: "Pickup Point", accessor: "pickupPoint" },
    { header: "User Name", accessor: "userName" },
    { header: "Payment Mode", accessor: "paymentMode" },
    { header: "Total Amount (Rs.)", accessor: "invoiceAmount" },
  
  ];

  const monthlyColumns: Column<CompletedOrder>[] = [
  {
    header: "Invoice Number #",
    accessor: "invoiceNumber",
    render: (row) => (
      <span
        onClick={() => handleViewMonthly(row)}
        className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
      >
        {row.invoiceNumber}
      </span>
    ),
  },    { header: "Invoice Date", accessor: "orderDate" },
    { header: "Pickup Point", accessor: "pickupPoint" },
    { header: "Payment Mode", accessor: "paymentMode" },
    { header: "Total Amount (Rs.)", accessor: "invoiceAmount" },
   
  ];

  // ===================== Regular Fetch/Search =====================
  const fetchRegular = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<{ data: any[] }>(`/emp/getcompletedlist`);
      let bookings: any[] = data.data || [];

      bookings = bookings.map((order: any) => ({
        ...order,
        userId: order?.booking?.user?.userId || order.userId,
        userName: order?.booking?.user?.userName || order.userName,
        companyName: order?.booking?.user?.company?.companyName || order.companyName,
      }));

      if (userId) bookings = bookings.filter((b) => b.userId === userId);

      if (selectedCompany.trim()) {
        bookings = bookings.filter(
          (b) => b.companyName?.toLowerCase() === selectedCompany.toLowerCase()
        );
      }

      if (searchText.trim()) {
        const s = searchText.toLowerCase();
        bookings = bookings.filter(
          (b) =>
            b.orderNumber?.toLowerCase().includes(s) ||
            b.userName?.toLowerCase().includes(s) ||
            b.paymentMode?.toLowerCase().includes(s)
        );
      }

      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        bookings = bookings.filter((b) => {
          const d = new Date(b.orderDate);
          return d >= start && d <= end;
        });
      }

      const formatted: CompletedOrder[] = bookings.map((b: any) => ({
        ...b,
        orderDate: formatToCustom(b.orderDate),
        pickupDate: formatToCustom(b.pickupDate),
        _rowType: "regular",
      }));

      setCompletedOrders(formatted);
    } catch (e) {
      console.error(e);
      showToast("Failed to load regular completed list", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===================== Monthly Fetch =====================
  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data: MonthlyRow[] }>(
        `/closePendingOrder/monthlyInvoice/getAllmonthly`
      );

      let rows = data.data || [];

      if (selectedCompany.trim()) {
        rows = rows.filter(
          (r) => r.companyName?.toLowerCase() === selectedCompany.toLowerCase()
        );
      }

      if (searchText.trim()) {
        const s = searchText.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.vehicleNumber?.toLowerCase().includes(s) ||
            (r.invoice?.invoiceNumber || "").toLowerCase().includes(s) ||
            (r.invoice?.payment?.paymentMode || "").toLowerCase().includes(s)
        );
      }

      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        rows = rows.filter((r) => {
          const d = new Date(r.invoiceDate);
          return d >= start && d <= end;
        });
      }

      const mapped: CompletedOrder[] = rows.map((r) => ({
        orderNumber: r.monthlyInvoiceId,
        invoiceNumber: r.invoice?.invoiceNumber || "-",
        orderDate: formatToCustom(r.invoiceDate),
        pickupDate: "-",
        pickupPoint: "Monthly Booking",
        userName: r.companyName || "-",
        paymentMode: r.invoice?.payment?.paymentMode || "-",
        invoiceAmount: r.invoice?.invoiceAmount ?? r.finalTotal ?? r.balanceDue ?? 0,
        bookingId: r.monthlyInvoiceId,
        companyName: r.companyName,
        _rowType: "monthly",
      }));

      setCompletedOrders(mapped);
    } catch (e) {
      console.error(e);
      showToast("Failed to load monthly invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const active = document.activeElement as HTMLElement | null;

    // ✅ only when focus inside filter area
    if (filterFormRef.current && active && filterFormRef.current.contains(active)) {
      // ✅ allow textarea enter (if any)
      if (active.tagName === "TEXTAREA") return;

      e.preventDefault();
      if (loading) return;

      if (viewType === "monthly") fetchMonthly();
      else fetchRegular();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [loading, viewType, selectedCompany, searchText, dateRange.start, dateRange.end]); // ✅ safe deps

  // ===================== Companies master =====================
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axiosInstance.get<{ data: Company[] }>(
          `/company/getAllCompany?status=0`
        );
        setCompanies(data.data || []);
      } catch (e) {
        console.error("Error fetching companies:", e);
      }
    };
    fetchCompanies();
  }, []);

  // ===================== Load based on viewType =====================
  useEffect(() => {
    if (viewType === "monthly") fetchMonthly();
    else fetchRegular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType, userId]);

  // ===================== Date range auto search =====================
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      if (viewType === "monthly") fetchMonthly();
      else fetchRegular();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, viewType]);

  return (
    <PageLayout>
      <AlertContainer />
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">List Completed Order</h1>

        {/* Filters */}
       {/* ✅ FILTERS (Row1 = Company + Dates, Row2 = Keyword + Search) */}
<div className="mb-6">
  <div ref={filterFormRef} className="rounded-lg w-full bg-gray-50 p-6 space-y-5 shadow-sm">

    {/* ✅ Row 1 → Company + Start Date + End Date */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <InputBox
        name="company"
        label="Company"
        type="select"
        options={companies.map((c) => c.companyName)}
        value={selectedCompany}
        onChange={(name, value) => setSelectedCompany(value)}
      />

      <InputBox
        name="startDate"
        label="Start Date"
        type="date"
        value={dateRange.start}
        onChange={(name, value) =>
          setDateRange((prev) => ({ ...prev, start: value }))
        }
      />

      <InputBox
        name="endDate"
        label="End Date"
        type="date"
        value={dateRange.end}
        onChange={(name, value) =>
          setDateRange((prev) => ({ ...prev, end: value }))
        }
      />
    </div>

{/* ✅ Row 2 → Keyword Input + Search Button (FIXED ALIGNMENT) */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
  {/* Keyword input */}
  <div className="md:col-span-4">
    <InputBox
      name="keyword"
      label="Keywords"
      placeholder="Keywords (Order Number, User Name, Payment Mode...)"
      value={searchText}
      onChange={(name, value) => setSearchText(value)}
    />
  </div>

  {/* Search button */}
  <div className="md:col-span-3 flex flex-col">
    {/* ✅ dummy label space to match InputBox label height */}
    <div className="h-[22px] md:h-[28px]" />
    <button
      type="button"
      onClick={() => {
        if (viewType === "monthly") fetchMonthly();
        else fetchRegular();
      }}
      className="w-full h-[44px] rounded-lg font-semibold bg-[#275981] text-white hover:bg-[#1f4867]"
    >
      Search
    </button>
  </div>
</div>


    {/* ✅ Tabs (keep below filters if you want) */}
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


        {/* Table */}
      <div className="mb-8">
  {loading ? (
    <p>Loading...</p>
  ) : viewType === "regular" ? (
    <DataTable
      columns={regularColumns}
      data={completedOrders}
      onView={handleViewRegular}
      onCopy={handleCopy}
      rowsPerPage={5}
    />
  ) : (
    <DataTable
      columns={monthlyColumns}
      data={completedOrders}
      rowsPerPage={5}
      onView={handleViewMonthly}
    />
  )}
</div>

      </main>

    <footer className="mt-auto text-xs text-gray-500 pt-2 text-center">
  © {new Date().getFullYear()} GraceCabs.in. Powered by Celexsa
</footer>

    </PageLayout>
  );
}