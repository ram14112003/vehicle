import React, { useState, useEffect, useMemo, useRef } from "react";
import PageLayout from "../../../../components/PageLayout";
import InputBox from "../../../../components/InputBox";
import { DataTable, Column } from "../../../../components/DataTable";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast } from "../../../../components/AlertBox";

type StatusUI = "Paid" | "Pending" | "No Invoice";

interface MonthlyInvoiceRow {
  monthlyInvoiceId?: string;
  invoiceId?: string;

  invoiceNumber: string;
  invoiceDate: string;
  companyName: string;
  invoiceAmount: number;
  status: StatusUI;
}

export default function MonthlyReport() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | "Paid" | "Pending">("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [companyOptions, setCompanyOptions] = useState<string[]>([]);
  const [tableData, setTableData] = useState<MonthlyInvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
const filterFormRef = useRef<HTMLDivElement | null>(null);
const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  // ✅ Fetch companies dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/company/getAllCompany?status=0");
        const companies = (res.data?.data || []).map((c: any) => c.companyName);
        setCompanyOptions(companies);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // ✅ helper: UI -> API
  const statusToApi = (ui: string) => {
    if (ui === "Paid") return "paid";
    if (ui === "Pending") return "pending";
    return "all";
  };

  /**
   * ✅ Fetch API
   * @param initialLoad - true means "load all without requiring filters"
   */
  const fetchFiltered = async (initialLoad: boolean = false) => {
    const hasAnyFilter =
      !!selectedCompany || !!selectedStatus || !!dateRange.start || !!dateRange.end;

    // ✅ Search click: must have at least one filter
    if (!initialLoad && !hasAnyFilter) {
      showToast("Please select at least one filter before searching.", "warn");
      return;
    }

    // ✅ optional: start/end both required
    if (!initialLoad && ((dateRange.start && !dateRange.end) || (!dateRange.start && dateRange.end))) {
      showToast("Please select both Start Date and End Date.", "warn");
      return;
    }

    setLoading(true);

    try {
      const params: any = { page: 1, limit: 200 };

      // ✅ initial load -> send nothing (get all)
      if (!initialLoad) {
        if (selectedCompany) params.companyName = selectedCompany;
        if (selectedStatus) params.status = statusToApi(selectedStatus);
        if (dateRange.start) params.fromDate = dateRange.start;
        if (dateRange.end) params.toDate = dateRange.end;
      }

      const res = await axiosInstance.get("/closePendingOrder/monthlyInvoice/filter", { params });
      const rows = res.data?.data || [];

      const mapped: MonthlyInvoiceRow[] = rows.map((r: any) => {
        const mi = r;
        const inv = r.invoice || r.Invoice || null;

        const invStatus = String(inv?.invoiceStatus ?? "");
        const statusLabelFromApi = String(r.statusLabel || "");

        const status: StatusUI =
          statusLabelFromApi === "No Invoice"
            ? "No Invoice"
            : invStatus === "9" || statusLabelFromApi.toLowerCase() === "paid"
              ? "Paid"
              : "Pending";

        return {
          monthlyInvoiceId: mi.monthlyInvoiceId,
          invoiceId: inv?.invoiceId,

          invoiceNumber: inv?.invoiceNumber || "-",
          invoiceDate: mi.invoiceDate ? new Date(mi.invoiceDate).toLocaleDateString("en-IN") : "-",
          companyName: mi.companyName || "-",
          invoiceAmount: Number(inv?.invoiceAmount || mi.finalTotal || 0),
          status,
        };
      });

      setTableData(mapped);
    } catch (error) {
      console.error("Error fetching monthly invoice report:", error);
      setTableData([]);
      showToast("Failed to fetch monthly invoices.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Default load ALL invoices
  useEffect(() => {
    fetchFiltered(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const active = document.activeElement as HTMLElement | null;

    // ✅ run only when focus is inside filter area
    if (filterFormRef.current && active && filterFormRef.current.contains(active)) {
      // ✅ allow Enter in textarea (if any future)
      if (active.tagName === "TEXTAREA") return;

      e.preventDefault();

      // ✅ avoid double submit
      if (loading) return;

      // Trigger same as Search click
      fetchFiltered(false);
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
  // include deps to avoid stale values
}, [loading, selectedCompany, selectedStatus, dateRange.start, dateRange.end]);


  // ✅ Columns
  const columns: Column<MonthlyInvoiceRow>[] = useMemo(
    () => [
      { header: "Invoice Number", accessor: "invoiceNumber" },
      { header: "Invoice Date", accessor: "invoiceDate" },
      { header: "Company Name", accessor: "companyName" },
      {
        header: "Invoice Amount (₹)",
        accessor: "invoiceAmount",
        render: (row) => `₹${Number(row.invoiceAmount || 0).toLocaleString("en-IN")}`,
      },
      {
        header: "Status",
        accessor: "status",
        render: (row) => (
          <span
            className={`px-2 py-1 rounded text-sm font-semibold ${
              row.status === "Paid"
                ? "bg-green-100 text-green-700"
                : row.status === "Pending"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.status}
          </span>
        ),
      },
    ],
    []
  );

  // ✅ Totals under table
  const totals = useMemo(() => {
    const totalAmount = tableData.reduce((sum, r) => sum + Number(r.invoiceAmount || 0), 0);
    const totalPaid = tableData
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + Number(r.invoiceAmount || 0), 0);
    const totalPending = tableData
      .filter((r) => r.status === "Pending")
      .reduce((sum, r) => sum + Number(r.invoiceAmount || 0), 0);

    return { totalAmount, totalPaid, totalPending };
  }, [tableData]);

  return (
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Monthly Invoice Report
        </h1>

        {/* ✅ FILTER BAR */}
        <div className="mb-6">
          <div ref={filterFormRef} className="bg-white border rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Company */}
              <div className="md:col-span-3">
                <InputBox
                  name="company"
                  label="Company"
                  type="select"
                  options={companyOptions}
                  value={selectedCompany}
                  onChange={(name, value) => setSelectedCompany(value)}
                />
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <InputBox
                  name="status"
                  label="Status"
                  type="select"
                  options={["Paid", "Pending"]}
                  value={selectedStatus}
                  onChange={(name, value) => setSelectedStatus(value as any)}
                />
              </div>

              {/* Start Date */}
              <div className="md:col-span-2">
                <InputBox
                  name="startDate"
                  label="Start Date"
                  type="date"
                  value={dateRange.start}
                  onChange={(name, value) =>
                    setDateRange((prev) => ({ ...prev, start: value }))
                  }
                />
              </div>

              {/* End Date */}
              <div className="md:col-span-2">
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

              {/* Search button */}
              <div className="md:col-span-3 flex md:justify-end">
          <button
                  type="button"
                  onClick={() => fetchFiltered(false)}
                  disabled={loading}
                  className={`w-full md:w-[160px] h-[44px] rounded-lg font-semibold flex items-center justify-center gap-2 transition
                    ${
                      loading
                        ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                        : "bg-[#1F4F75] text-white hover:bg-[#173d5a]"
                    }`}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                      Loading
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <DataTable
          columns={columns}
          data={tableData}
          rowsPerPage={10}
          emptyMessage={loading ? "Loading..." : "No invoices found."}
        />

        {/* ✅ Totals Under Table */}
      {/* ✅ Totals Under Table (RIGHT SIDE) */}
<div className="mt-4 flex justify-end">
  <div className="bg-white border rounded-xl p-5 w-full max-w-md">
    <div className="space-y-4 text-[15px]">
      {/* Total Amount */}
      <div className="flex items-center justify-between gap-6">
        <span className="text-gray-700 font-medium">Total Amount:</span>
        <span className="text-gray-900 font-bold text-xl min-w-[160px] text-right">
          ₹ {totals.totalAmount.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Total Paid */}
      <div className="flex items-center justify-between gap-6">
        <span className="text-gray-700 font-medium">Total Paid Amount:</span>
        <span className="text-gray-900 font-bold text-xl min-w-[160px] text-right">
          ₹ {totals.totalPaid.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Total Pending */}
      <div className="flex items-center justify-between gap-6">
        <span className="text-gray-700 font-medium">Total Pending Amount:</span>
        <span className="text-gray-900 font-bold text-xl min-w-[160px] text-right">
          ₹ {totals.totalPending.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  </div>
</div>

      </main>

   <footer className="mt-auto text-xs text-gray-500 pt-2 text-center">
  © {new Date().getFullYear()} GraceCabs.in. Powered by Celexsa
</footer>

    </PageLayout>
  );
}