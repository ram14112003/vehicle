import React, { useState, useEffect, useMemo, useRef } from "react";
import PageLayout from "../../../components/PageLayout";
import InputBox, { getFormStore } from "../../../components/InputBox";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar";
import CommonButton from "../../../components/CommonButton";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import axiosInstance from "../../../utils/axiosInstance";
import { useNavigate, useNavigationType } from "react-router-dom";

// ✅ Company type
type Company = {
  companyId: string;
  companyName: string;
};

interface InvoiceData {
  refNo: string;
  heldDate: string;
  companyName: string;
  userName: string;
  email: string;
  phone: string;
  userId: string;
  bookingId: string;
}

const InvoicePayHolder: React.FC = () => {
  const [showTable, setShowTable] = useState(false);
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // ✅ NEW: selection set (bookingId as unique key)
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const navigationType = useNavigationType();
const filterBoxRef = useRef<HTMLDivElement | null>(null);

  // ✅ Clear only when user enters page freshly (not from back)
  useEffect(() => {
    if (navigationType !== "POP") {
      sessionStorage.removeItem("InvoicePayHolderData");
    }
  }, [navigationType]);

  // ✅ Restore data when coming back
  useEffect(() => {
    const saved = sessionStorage.getItem("InvoicePayHolderData");
    if (saved) {
      const { invoices: savedInvoices, showTable: savedShowTable, formValues, selectedBookingIds } =
        JSON.parse(saved);

      if (savedInvoices) {
        setInvoices(savedInvoices);
      }

      if (savedShowTable !== undefined) {
        setShowTable(savedShowTable);
      }

      if (formValues) {
        const store = getFormStore();
        Object.entries(formValues).forEach(([key, value]) => {
          // @ts-ignore
          store[key] = value;
        });
      }

      // ✅ restore selection
      if (Array.isArray(selectedBookingIds) && selectedBookingIds.length > 0) {
        setSelectedSet(new Set(selectedBookingIds));
      } else if (savedInvoices?.length) {
        setSelectedSet(new Set(savedInvoices.map((x: InvoiceData) => x.bookingId)));
      }
    }
  }, []);

  // 🔽 Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axiosInstance.get<{ data: Company[] }>(
          "/company/getAllCompany?status=0"
        );
        setCompanies(data.data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // ✅ Whenever invoices loaded -> default select all
  useEffect(() => {
    if (invoices.length > 0) {
      setSelectedSet(new Set(invoices.map((x) => x.bookingId)));
    } else {
      setSelectedSet(new Set());
    }
  }, [invoices]);

  const isAllSelected = useMemo(() => {
    if (invoices.length === 0) return false;
    return invoices.every((x) => selectedSet.has(x.bookingId));
  }, [invoices, selectedSet]);

  const selectedRows = useMemo(() => {
    return invoices.filter((x) => selectedSet.has(x.bookingId));
  }, [invoices, selectedSet]);

  // ✅ Fetch invoices from backend
  const fetchInvoices = async () => {
    const form = getFormStore();
    const dateRange = form.invoiceDateRange;

    let startDate, endDate;
    if (dateRange) {
      const dates = dateRange.split(" - ");

      const [sd, sm, sy] = dates[0].split("/");
      const [ed, em, ey] = dates[1].split("/");

      startDate = `${sy}-${sm}-${sd}`;
      endDate = `${ey}-${em}-${ed}`;
    }

    if (!startDate && !endDate && !form.email && !form.company) {
      showToast("Please apply at least one filter before searching", "warn");
      return;
    }

    setLoading(true);
    setShowTable(true);

    try {
      const response = await axiosInstance.get("/invoiceRoutes/getInvoicesPayHolder", {
        params: {
          startDate,
          endDate,
          email: form.email,
          companyId: form.company,
        },
      });

      const rawInvoices = response.data.data || [];

      const pendingInvoices: InvoiceData[] = rawInvoices.map((inv: any) => ({
        refNo: inv.invoiceNumber,
        heldDate: new Date(inv.invoiceDate).toLocaleDateString("en-GB"),
        companyName: inv.companyName || "",
        userName: inv.userName || "",
        email: inv.userEmail || "",
        phone: inv.userMobile || "",
        userId: inv.userId,
        bookingId: inv.bookingId,
      }));

      setInvoices(pendingInvoices);
      showToast(`Found ${pendingInvoices.length} pending invoices.`, "success");

      // ✅ Store data for restoring when coming back from view page
      sessionStorage.setItem(
        "InvoicePayHolderData",
        JSON.stringify({
          invoices: pendingInvoices,
          showTable: true,
          formValues: getFormStore(),
          selectedBookingIds: pendingInvoices.map((x) => x.bookingId), // default all
        })
      );
    } catch (error) {
      console.error("Error fetching pending invoices:", error);
      showToast("Failed to fetch invoices. Please try again later.", "error");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchInvoices();

  useEffect(() => {
  if (!showFilterBox) return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const active = document.activeElement as HTMLElement | null;

    // ✅ Enter only works when focus is inside filter box
    if (filterBoxRef.current && active && filterBoxRef.current.contains(active)) {
      e.preventDefault();
      handleSearch();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [showFilterBox]);

  const handleClear = async () => {
    if (invoices.length === 0) return;

    if (selectedRows.length === 0) {
      showToast("Please select at least one record to clear.", "warn");
      return;
    }

    try {
      // ✅ group only selected rows by userId
      const grouped: Record<string, string[]> = {};
      selectedRows.forEach((inv) => {
        if (!grouped[inv.userId]) grouped[inv.userId] = [];
        grouped[inv.userId].push(inv.bookingId);
      });

      const payload = {
        records: Object.entries(grouped).map(([userId, bookingIds]) => ({
          userId,
          bookingId: bookingIds,
        })),
      };

      const response = await axiosInstance.post(
        "/closePendingOrder/clearPaymentInitialise",
        payload
      );

      if (response.data.success) {
        showToast("✅ Payment cleared successfully!", "success");

        // ✅ remove only cleared rows from UI
        const clearedIds = new Set(selectedRows.map((x) => x.bookingId));
        const remaining = invoices.filter((x) => !clearedIds.has(x.bookingId));

        setInvoices(remaining);
        setSelectedSet(new Set(remaining.map((x) => x.bookingId)));

        // ✅ update sessionStorage
        sessionStorage.setItem(
          "InvoicePayHolderData",
          JSON.stringify({
            invoices: remaining,
            showTable: remaining.length > 0,
            formValues: getFormStore(),
            selectedBookingIds: remaining.map((x) => x.bookingId),
          })
        );

        if (remaining.length === 0) {
          setShowTable(false);
          sessionStorage.removeItem("InvoicePayHolderData");
        }
      } else {
        showToast(response.data.message || "Failed to clear payment", "error");
      }
    } catch (error) {
      console.error("Error clearing payment:", error);
      showToast("❌ Failed to clear payment. Please try again.", "error");
    }
  };

  // ✅ Define DataTable columns with navigation + checkbox
  const columns: Column<InvoiceData>[] = [
    // ✅ Checkbox column
    {
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              setSelectedSet(new Set(invoices.map((x) => x.bookingId)));
            } else {
              setSelectedSet(new Set());
            }

            sessionStorage.setItem(
              "InvoicePayHolderData",
              JSON.stringify({
                invoices,
                showTable,
                formValues: getFormStore(),
                selectedBookingIds: checked ? invoices.map((x) => x.bookingId) : [],
              })
            );
          }}
        />
      ) as any,
      accessor: "refNo",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.bookingId)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedSet((prev) => {
              const next = new Set(prev);
              if (checked) next.add(row.bookingId);
              else next.delete(row.bookingId);

              // ✅ persist selection
              sessionStorage.setItem(
                "InvoicePayHolderData",
                JSON.stringify({
                  invoices,
                  showTable,
                  formValues: getFormStore(),
                  selectedBookingIds: Array.from(next),
                })
              );

              return next;
            });
          }}
        />
      ),
    },

    {
      header: "Ref No #",
      accessor: "refNo",
      render: (row) => (
        <button
          className="text-blue-600 hover:underline font-bold"
          onClick={() => {
            // ✅ store before navigate
            sessionStorage.setItem(
              "InvoicePayHolderData",
              JSON.stringify({
                invoices,
                showTable,
                formValues: getFormStore(),
                selectedBookingIds: Array.from(selectedSet),
              })
            );

            navigate(`/orders/view/payment-pending-order/${row.bookingId}`);
          }}
        >
          {row.refNo}
        </button>
      ),
    },
    { header: "Held Date", accessor: "heldDate" },
    { header: "Company Name", accessor: "companyName" },
    { header: "User Name", accessor: "userName" },
    { header: "Email Address", accessor: "email" },
    { header: "Phone Number", accessor: "phone" },
  ];

  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Invoice Pay Holder
        </h1>
      </div>

      {/* 🔘 Filter Toggle Button */}
      <div className="mb-4">
        <CommonButton
          onClick={() => setShowFilterBox(!showFilterBox)}
          variant="darkblue"
          className="text-sm"
        >
          Filter {showFilterBox ? "▲" : "▼"}
        </CommonButton>
      </div>

      {/* 🔍 Filter Section */}
      {showFilterBox && (
        <div  ref={filterBoxRef} className="p-6 rounded-lg w-full max-w-4xl bg-gray-50 mb-6 space-y-4 shadow-sm">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="min-w-[290px]">
              <InputBox name="invoiceDateRange" label="Date Range" type="date-range" />
            </div>

            <div className="flex-1 min-w-[200px]">
              <InputBox name="email" label="Email" type="email" placeholder="Enter Email" />
            </div>

            {/* ✅ Company dropdown from API */}
            <div className="min-w-[200px]">
              <InputBox
                name="company"
                label="Company"
                type="select"
                options={companies.map((c) => ({
                  label: c.companyName,
                  value: c.companyId,
                }))}
              />
            </div>

            <div className="pt-[30px]">
              <SearchBar onSearch={handleSearch} onlyButton />
            </div>
          </div>
        </div>
      )}

      {/* 📊 Results Table */}
      {showTable && (
        <div className="mt-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-3">
                Selected: <b>{selectedRows.length}</b> / {invoices.length}
              </div>

              <DataTable
                columns={columns}
                data={invoices}
                rowsPerPage={5}
                emptyMessage="No pending invoice records found for the selected filters."
              />
            </>
          )}

          {/* ✅ Centered Clear Button */}
          <div className="flex justify-center mt-6">
            <CommonButton variant="clear" onClick={handleClear}>
              Clear Selected
            </CommonButton>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default InvoicePayHolder;