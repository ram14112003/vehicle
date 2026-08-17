import React, { useState, useEffect, useCallback } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import { DataTable, Column } from "../../../components/DataTable";
import axiosInstance from "../../../utils/axiosInstance";
import InputBox, { getFormStore } from "../../../components/InputBox";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import { useNavigate, useNavigationType } from "react-router-dom";

import jsPDF from "jspdf";
import "jspdf-autotable";
import XLSX from "xlsx-js-style";
import autoTable, { Color, RowInput } from "jspdf-autotable";

interface InvoiceData {
  bookingId?: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  pickupPoint: string;
  pickupDate: string;
  invoiceAmount: string;
}

const PaidInvoiceList: React.FC = () => {
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [tableData, setTableData] = useState<InvoiceData[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const navigate = useNavigate();
  const navigationType = useNavigationType();

  // ✅ Clear only when user enters page freshly (not from back)
  useEffect(() => {
    if (navigationType !== "POP") {
      sessionStorage.removeItem("PaidInvoiceListData");
    }
  }, [navigationType]);

  // ✅ Restore data when coming back
  useEffect(() => {
    const saved = sessionStorage.getItem("PaidInvoiceListData");
    if (saved) {
      const { tableData, formValues } = JSON.parse(saved);
      setTableData(tableData || []);
      setIsSearched(true);

      if (formValues) {
        const store = getFormStore();
        Object.entries(formValues).forEach(([key, value]) => {
          store[key] = value;
        });
      }
    }
  }, []);
useEffect(() => {
  if (!showFilterBox) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyFilter();
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [showFilterBox]);

  // 🔹 API call to get companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/company/getAllcompany");
        if (res.data?.data) {
          const mapped = res.data.data.map((c: any) => ({
            id: c.companyId,
            name: c.companyName,
          }));
          setCompanies(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  const columns: Column<InvoiceData>[] = [
    {
      header: "Order Number #",
      accessor: "orderNumber",
      render: (row) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/orders/view/completed-list/${row.bookingId}`)}
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

  const fetchCompletedInvoices = async (filters = {}) => {
    try {
      const response = await axiosInstance.get("/invoiceRoutes/getCompletedInvoices", {
        params: filters,
      });

      if (response.data.success) {
        const invoices: any[] = response.data.data;

        const fetchData = await Promise.all(
          invoices.map(async (inv) => {
            try {
              const orderRes = await axiosInstance.post("/order/getOrdersById", {
                bookingId: inv.bookingId,
              });

              const pickupDate =
                orderRes.data?.success && orderRes.data?.data
                  ? new Date(orderRes.data.data.bookingDate).toLocaleDateString("en-GB")
                  : "-";

              const pickupType =
                orderRes.data?.success && orderRes.data?.data
                  ? orderRes.data.data.pickupPoint || "-"
                  : "-";

              return {
                bookingId: inv.bookingId,
                orderNumber: inv.orderNumber,
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: new Date(inv.invoiceDate).toLocaleDateString("en-GB"),
                userName: inv.userName,
                pickupPoint: pickupType,
                pickupDate,
                invoiceAmount: `₹${inv.invoiceAmount}`,
              };
            } catch (err) {
              console.error("Error fetching order details:", err);
              return {
                bookingId: inv.bookingId,
                orderNumber: inv.orderNumber,
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: new Date(inv.invoiceDate).toLocaleDateString("en-GB"),
                userName: inv.userName,
                pickupPoint: "-",
                pickupDate: "-",
                invoiceAmount: `₹${inv.invoiceAmount}`,
              };
            }
          })
        );

        setTableData(fetchData);

        // ✅ Store data for restoring when coming back from view page
        sessionStorage.setItem(
          "PaidInvoiceListData",
          JSON.stringify({
            tableData: fetchData,
            formValues: getFormStore(),
          })
        );
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch completed invoices:", err);
      setTableData([]);
    }
  };

  // ✅ Search function (usable for button click + Enter submit)
  const handleApplyFilter = useCallback(() => {
    const form = getFormStore();
    const { email, company, dateRange } = form;

    if (![email, company, dateRange].some(Boolean)) {
      showToast("Please apply at least one filter before searching.", "warn");
      return;
    }

    const filters: any = {};
    if (email) filters.username = email;
if (company && company !== "all") {
  filters.company = company;
}

    if (dateRange) {
      const [fromRaw, toRaw] = String(dateRange).split(" - ");
      if (fromRaw && toRaw) {
        const [fD, fM, fY] = fromRaw.split("/");
        const [tD, tM, tY] = toRaw.split("/");
        filters.fromDate = `${fY}-${fM}-${fD}`;
        filters.toDate = `${tY}-${tM}-${tD}`;
      }
    }

    fetchCompletedInvoices(filters);
    setIsSearched(true);
  }, []);

  // ✅ FORM submit handler (Enter press will trigger this)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilter();
  };

  // ⬇️ PDF Export
  const handlePDFDownload = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text("List Payment Paid Invoice", pageWidth / 2, 15, { align: "center" });

    const headers = [
      ["S.No", "Order Number #", "Invoice Number #", "Invoice Date", "User Name", "Pickup Date", "Invoice Amount (Rs.)", "Payment Status"],
    ];

    const body: RowInput[] = tableData.map((item, index) => {
      const cleanedAmount = item.invoiceAmount.replace(/[₹,]/g, "");
      return [
        index + 1,
        item.orderNumber,
        item.invoiceNumber,
        item.invoiceDate,
        item.userName,
        item.pickupDate,
        { content: cleanedAmount, styles: { halign: "right" as const } },
        {
          content: "Paid",
          styles: {
            textColor: [0, 128, 0] as Color,
            fontStyle: "bold" as const,
            halign: "center" as const,
          },
        },
      ];
    });

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 25,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center" },
    });

    doc.save("PaidInvoiceList.pdf");
  };

  // ⬇️ Excel Export
  const handleExcelDownload = () => {
    if (!tableData || tableData.length === 0) {
      showToast("No data available to export", "warn");
      return;
    }

    const invoiceData = tableData.map((item, index) => ({
      "S.No": index + 1,
      "Order Number": item.orderNumber,
      "Invoice Number": item.invoiceNumber,
      "Invoice Date": item.invoiceDate,
      "User Name": item.userName,
      "Pickup Date": item.pickupDate,
      "Invoice Amount (Rs.)": parseFloat(item.invoiceAmount.replace(/[₹,]/g, "")),
      "Payment Status": "Paid",
    }));

    const ws = XLSX.utils.json_to_sheet(invoiceData);

    const headers = Object.keys(invoiceData[0]);
    ws["!cols"] = headers.map((k) => ({
      wch: Math.max(k.length, ...invoiceData.map((row: any) => (row[k] ? row[k].toString().length : 0))) + 2,
    }));

    const ref = ws["!ref"];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);

      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) continue;
        ws[addr].s = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } },
        };
      }

      const amountCol = headers.indexOf("Invoice Amount (Rs.)");
      if (amountCol !== -1) {
        for (let r = 1; r <= range.e.r; r++) {
          const addr = XLSX.utils.encode_cell({ r, c: amountCol });
          if (!ws[addr]) continue;
          ws[addr].z = "₹#,##0.00";
          ws[addr].s = ws[addr].s || {};
          ws[addr].s.alignment = { horizontal: "right", vertical: "center" };
        }
      }

      const payCol = headers.indexOf("Payment Status");
      if (payCol !== -1) {
        for (let r = 1; r <= range.e.r; r++) {
          const addr = XLSX.utils.encode_cell({ r, c: payCol });
          const v = ws[addr]?.v;
          if (v === "Paid") {
            ws[addr].s = ws[addr].s || {};
            ws[addr].s.font = {
              ...(ws[addr].s.font || {}),
              bold: true,
              color: { rgb: "008000" },
            };
            ws[addr].s.alignment = { horizontal: "center", vertical: "center" };
          }
        }
      }

      for (let r = 1; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) continue;
          ws[addr].s = ws[addr].s || {};
          ws[addr].s.alignment =
            ws[addr].s.alignment || { horizontal: "center", vertical: "center" };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PaidInvoices");
    XLSX.writeFile(wb, "PaidInvoiceList.xlsx", { cellStyles: true });
  };

  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Paid Invoice List</h1>
      </div>

      <div className="mb-4">
        <CommonButton onClick={() => setShowFilterBox(!showFilterBox)} variant="darkblue" className="text-sm">
          Filter {showFilterBox ? "▲" : "▼"}
        </CommonButton>
      </div>

      {showFilterBox && (
        // ✅ Form wrapper => Enter press triggers submit
        <form onSubmit={handleSubmit} className="p-6 rounded-lg w-full max-w-4xl bg-gray-50 mb-6 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
            <div className="w-70">
            <InputBox
  name="company"
  label="Company"
  type="select"
  options={[
    { label: "All", value: "all" },   // ✅ All option
    ...companies.map((c) => ({ label: c.name, value: c.id })),
  ]}
/>

            </div>

            <div className="min-w-[290px]">
              <InputBox name="dateRange" label="Date Range" type="date-range" required />
            </div>

            <div>
              {/* ✅ Submit button so Enter works */}
            <CommonButton
  onClick={handleApplyFilter}
  variant="success"
  className="px-5 py-2 mb-5 text-sm bg-[#275981] font-semibold"
>
  Search
</CommonButton>

            </div>
          </div>
        </form>
      )}

      <div className="mt-6">
        {isSearched && (
          <div className="flex justify-end gap-4 mb-4">
            <CommonButton onClick={handlePDFDownload} variant="danger" className="px-4 py-2 text-sm font-semibold">
              PDF Download
            </CommonButton>
            <CommonButton onClick={handleExcelDownload} variant="success" className="px-4 py-2 text-sm font-semibold">
              XLS Download
            </CommonButton>
          </div>
        )}

        <DataTable columns={columns} data={tableData} rowsPerPage={5} emptyMessage="No paid invoices found." />
      </div>
    </PageLayout>
  );
};

export default PaidInvoiceList;