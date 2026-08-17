import React, { useState, useEffect } from "react";
import PageLayout from "../../../components/PageLayout";
import InputBox, { getFormStore } from "../../../components/InputBox";
import CommonButton from "../../../components/CommonButton";
import SearchBar from "../../../components/SearchBar";
import { DataTable, Column } from "../../../components/DataTable";
import axiosInstance from "../../../utils/axiosInstance";
import jsPDF from "jspdf";
import "jspdf-autotable";
import XLSX from "xlsx-js-style";
import autoTable, { RowInput } from "jspdf-autotable";
import { showToast,AlertContainer } from "../../../components/AlertBox";
import { Link, useNavigationType } from "react-router-dom";
interface Company {
  companyId: string;
  companyName: string;
}

interface AllInvoiceData {
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  pickupPoint: string;
  pickupDate: string;
  invoiceAmount: string;
  status: string;
  companyName?: string;
  bookingId: string;
}

const AllInvoiceList: React.FC = () => {
  const [isSearched, setIsSearched] = useState(false);
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [tableData, setTableData] = useState<AllInvoiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
const navigationType = useNavigationType();

const filterRef = React.useRef<HTMLFormElement | null>(null);

const onSubmitFilter = (e: React.FormEvent) => {
  e.preventDefault();
  handleApplyFilter();
};

  // Convert UTC → IST
  // const formatToIST = (utcDate: string) => {
  //   if (!utcDate) return "-";
  //   const date = new Date(utcDate);
  //   return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  // };
   //  New (Browser Local Time, same as ConfirmPendingList)
const formatToCustom = (utcDate: string) => {
  if (!utcDate) return "-";
  const d = new Date(utcDate);

  if (isNaN(d.getTime())) return utcDate;

  let day = String(d.getDate()).padStart(2, "0");
  let month = String(d.getMonth() + 1).padStart(2, "0");
  let year = d.getFullYear();

  let hours = d.getHours();
  let minutes = String(d.getMinutes()).padStart(2, "0");
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

//  Clear data only when user opens page freshly
useEffect(() => {
  if (navigationType !== "POP") {
    sessionStorage.removeItem("AllInvoiceListData");
  }
}, [navigationType]);
// Restore previous search results when user comes back
useEffect(() => {
  const saved = sessionStorage.getItem("AllInvoiceListData");
  if (saved) {
    const { tableData, selectedCompany, formValues } = JSON.parse(saved);
    setTableData(tableData || []);
    setSelectedCompany(selectedCompany || "");
    setIsSearched(true);

    //  restore filters (if InputBox uses getFormStore)
    if (formValues) {
      Object.entries(formValues).forEach(([key, value]) => {
        const store = getFormStore();
        store[key] = value;
      });
    }
  }
}, []);

  // 🔹 Fetch companies from backend
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/company/getAllCompany?status=0");
        setCompanyList(res.data?.data || []);
        if (res.data?.data?.length > 0) {
         setCompanyList(res.data?.data || []); // ✅ store companyId
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  // 🔹 Table columns
  const columns: Column<AllInvoiceData>[] = [
       { header: "Invoice Number #", accessor: "invoiceNumber" },
 {
    header: "Order Number #",
    accessor: "orderNumber",
    render: (row) => (
      <Link
        to={`/orders/view/completed-list/${row.bookingId}`}
        className="text-blue-600 hover:text-blue-800 font-bold"
      >
        {row.orderNumber}
      </Link>
    ),
  }, 
    {
      header: "Invoice Date",
      accessor: "invoiceDate",
      render: (row) => formatToCustom(row.invoiceDate),
    },
    { header: "User Name", accessor: "userName" },
    { header: "Company Name", accessor: "companyName" },
    { header: "Pickup Point", accessor: "pickupPoint" },
    {
      header: "Pickup Date (IST)",
      accessor: "pickupDate",
      render: (row) => formatToCustom(row.pickupDate),
    },
    { header: "Invoice Amount (Rs.)", accessor: "invoiceAmount" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status?.toLowerCase() === "paid"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
  header: "Download",
  accessor: "invoiceNumber",
  render: (row) => (
    <button
      onClick={() => handleRowPDFDownload(row)}
      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded"
    >
      Download
    </button>
  ),
},
  ];

  const handleFilterKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter") {
    // textarea / multiline avoid
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "textarea") return;

    e.preventDefault();
    handleApplyFilter();
  }
};


  // 🔹 Apply Filter with proper API integration
  // 🔹 Apply Filter with proper API integration
const handleApplyFilter = async () => {
  try {
    setLoading(true);
    const form = getFormStore();
    const { username, dateRange } = form;
   

    const query = new URLSearchParams();

    // Username filter
    if (username) query.append("username", username);

    // Selected companyId
if (selectedCompany && selectedCompany !== "all") {
  query.append("company", selectedCompany);
}

    // ✅ Handle dateRange (string like "02/08/2025 - 31/08/2025")
    if (dateRange) {
      const [fromRaw, toRaw] = dateRange.split(" - ");

      if (fromRaw && toRaw) {
        const [fD, fM, fY] = fromRaw.split("/");
        const [tD, tM, tY] = toRaw.split("/");

        const from = `${fY}-${fM}-${fD}`; // yyyy-MM-dd
        const to = `${tY}-${tM}-${tD}`;

        query.append("fromDate", from);
        query.append("toDate", to);
      }
    }

    // 🚨 Stop here if no filters are applied
    if (![username, selectedCompany, dateRange].some(Boolean)) {
      showToast("Please apply at least one filter before searching.","warn");
      setLoading(false);
      return;
    }

    // ✅ Now make API call only if filter present
    const response = await axiosInstance.get(
      `/invoiceRoutes/getAllInvoices?${query.toString()}`
    );

  if (response.data.success) {
  const invoices = response.data.data;

  const enrichedData = await Promise.all(
    invoices.map(async (inv: any) => {
      try {
        const orderRes = await axiosInstance.post("/order/getOrdersById", {
          bookingId: inv.bookingId,
        });
        const pickupDate =
          orderRes.data?.success && orderRes.data?.data
            ? orderRes.data.data.bookingDate
            : "-";
        const pickupPoint =
          orderRes.data?.success && orderRes.data?.data
            ? orderRes.data.data.pickupPoint || inv.pickupPoint
            : inv.pickupPoint || "-";

        return {
          orderNumber: inv.orderNumber,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          userName: inv.userName,
          companyName: inv.companyName || "-",
          pickupPoint,
          pickupDate,
          invoiceAmount: `₹${inv.invoiceAmount}`,
          status: inv.status || "-",
          bookingId: inv.bookingId,
        };
      } catch {
        return {
          orderNumber: inv.orderNumber,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          userName: inv.userName,
          companyName: inv.companyName || "-",
          pickupPoint: inv.pickupPoint || "-",
          pickupDate: "-",
          invoiceAmount: `₹${inv.invoiceAmount}`,
          status: inv.status || "-",
          bookingId: inv.bookingId,
        };
      }
    })
  );

  setTableData(enrichedData);
  setIsSearched(true);

  // ✅ store filters + results in sessionStorage
  sessionStorage.setItem(
    "AllInvoiceListData",
    JSON.stringify({
      tableData: enrichedData,
      selectedCompany,
      formValues: getFormStore(),
    })
  );
}
 else {
      setTableData([]);
      setIsSearched(true);
    }
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    setTableData([]);
    setIsSearched(true);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (!showFilterBox) return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    // only when filter form area exists
    const root = filterRef.current;
    if (!root) return;

    const active = document.activeElement as HTMLElement | null;
    if (!active) return;

    // only if focus is inside filter form
    if (!root.contains(active)) return;

    // ✅ stop default behavior (like opening dropdown)
    e.preventDefault();
    e.stopPropagation();

    handleApplyFilter();
  };

  // capture=true is important to override custom components
  document.addEventListener("keydown", onKeyDown, true);

  return () => {
    document.removeEventListener("keydown", onKeyDown, true);
  };
}, [showFilterBox, selectedCompany]); 

  // 🔹 PDF Export
  const handlePDFDownload = () => {
    if (!tableData || tableData.length === 0) {
      showToast("No data available to export","error");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text("All Invoice List", pageWidth / 2, 15, { align: "center" });

    const headers = [
      [
        "S.No",
        "Order Number #",
        "Invoice Number #",
        "Invoice Date",
        "User Name",
        "Company Name",
        "Pickup Date",
        "Invoice Amount (Rs.)",
        "Status",
      ],
    ];

    const body: RowInput[] = tableData.map((item, idx) => {
      const cleanedAmount = item.invoiceAmount.replace(/[₹,]/g, "");
      return [
        idx + 1,
        item.orderNumber,
        item.invoiceNumber,
        formatToCustom(item.invoiceDate),
        item.userName,
        item.companyName || "-",
        formatToCustom(item.pickupDate),
        { content: cleanedAmount, styles: { halign: "right" as const } },
        {
          content: item.status,
          styles: {
            textColor:
              item.status?.toLowerCase() === "paid" ? [0, 128, 0] : [200, 0, 0],
            fontStyle: "bold" as const,
            halign: "center" as const,
          },
        },
      ];
    });

    autoTable(doc, {
      head: headers,
      body,
      startY: 25,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        halign: "center",
      },
    });

    doc.save(`AllInvoiceList_${new Date().toISOString().split("T")[0]}.pdf`);
  };
const handleRowPDFDownload = async (row: AllInvoiceData) => {
  const newTab = window.open("", "_blank");
  try {
    const res = await axiosInstance.post(
      "/downloadPdf/generate-invoice-pdf",
      {
        bookingId: row.bookingId,
      }
    );

    if (res.data?.success) {
      const downloadUrl = res.data.data.downloadUrl;
      if (newTab) {
        newTab.location.href = downloadUrl;
      } else {
        window.open(downloadUrl, "_blank");
      }
      showToast("Invoice PDF generated successfully", "success");
    } else {
      showToast("Failed to generate invoice PDF", "error");
      newTab?.close();
    }
  } catch (error) {
    console.error("PDF Download Error:", error);
    newTab?.close();
    showToast("Error generating invoice PDF", "error");
  }
};
  // 🔹 Excel Export
const handleExcelDownload = () => {
  if (!tableData || tableData.length === 0) {
    showToast("No data available to export", "error");
    return;
  }

  const worksheetData = tableData.map((item, idx) => ({
    "S.No": idx + 1,
    "Order Number": item.orderNumber,
    "Invoice Number": item.invoiceNumber,
    "Invoice Date": formatToCustom(item.invoiceDate),
    "User Name": item.userName,
    "Company Name": item.companyName || "-",
    "Pickup Date": formatToCustom(item.pickupDate),
    "Invoice Amount (Rs.)": parseFloat(item.invoiceAmount.replace(/[₹,]/g, "")),
    "Status": item.status, // Paid / Pending / Not Paid
  }));

  const ws = XLSX.utils.json_to_sheet(worksheetData);
  const headers = Object.keys(worksheetData[0]);

  // ✅ Auto width
  ws["!cols"] = headers.map((k) => ({
    wch:
      Math.max(
        k.length,
        ...worksheetData.map((row: any) => (row[k] ? row[k].toString().length : 0))
      ) + 2,
  }));

  const ref = ws["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);

    // ✅ Header row bold + gray
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[addr]) continue;

      ws[addr].s = {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } },
      };
    }

    // ✅ Center align for all cells
    for (let r = 1; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.alignment = { horizontal: "center", vertical: "center" };
      }
    }

    // ✅ Force Invoice Number as string (avoid scientific notation)
    const invoiceNoCol = headers.indexOf("Invoice Number");
    if (invoiceNoCol !== -1) {
      for (let r = 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c: invoiceNoCol });
        if (ws[addr]) ws[addr].t = "s";
      }
    }

    // ✅ Currency format right align
    const amountCol = headers.indexOf("Invoice Amount (Rs.)");
    if (amountCol !== -1) {
      for (let r = 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c: amountCol });
        if (!ws[addr]) continue;
        ws[addr].z = '₹#,##0.00';
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.alignment = { horizontal: "right", vertical: "center" };
      }
    }

    // ✅ Status color: Paid = green, Pending/Not Paid = red
    const statusCol = headers.indexOf("Status");
    if (statusCol !== -1) {
      for (let r = 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c: statusCol });
        const v = String(ws[addr]?.v ?? "").toLowerCase();

        if (!ws[addr]) continue;
        ws[addr].s = ws[addr].s || {};

        if (v === "paid") {
          ws[addr].s.font = { bold: true, color: { rgb: "008000" } }; // ✅ green
        } else if (v === "pending" || v === "not paid" || v === "unpaid") {
          ws[addr].s.font = { bold: true, color: { rgb: "FF0000" } }; // ✅ red
        } else {
          ws[addr].s.font = { bold: true };
        }

        ws[addr].s.alignment = { horizontal: "center", vertical: "center" };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "AllInvoices");

  XLSX.writeFile(
    wb,
    `AllInvoiceList_${new Date().toISOString().split("T")[0]}.xlsx`,
    { cellStyles: true }
  );
};


  return (

    <PageLayout>
      <AlertContainer />
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">All Invoice List</h1>
      </div>

      {/* Filter Toggle */}
      <div className="mb-4">
        <CommonButton
          onClick={() => setShowFilterBox(!showFilterBox)}
          variant="darkblue"
          className="text-sm"
        >
          Filter {showFilterBox ? "▲" : "▼"}
        </CommonButton>
      </div>

      {/* Filter Box */}
   {showFilterBox && (
  <form
    ref={filterRef}

    onSubmit={onSubmitFilter}

    className="rounded-lg w-full max-w-7xl bg-gray-50 p-6 mb-6 space-y-4 shadow-sm"
  >
    <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
      
      <div className="w-[350px]">
        <InputBox
          name="username"
          label="Username"
          placeholder="Enter Username"
        />
      </div>

      <div className="w-[220px]">
       <InputBox
  name="company"
  label="Company"
  type="select"
  options={[
    { label: "All", value: "all" },   // ✅ All option
    ...companyList.map((c) => ({
      label: c.companyName,
      value: c.companyId,
    })),
  ]}
  value={selectedCompany}
  onChange={(name, value) => setSelectedCompany(value)}
/>

      </div>

      <div className="w-[280px]">
        <InputBox
          name="dateRange"
          label="Date Range"
          type="date-range"
        />
      </div>

      {/* ✅ submit button (Enter press works + click works) */}
      <button
        type="submit"
        className="bg-[#275981]   text-white px-6 py-[6px] rounded "
        style={{marginBottom:"20px"}}
      >
        Search
      </button>

      {/* If you want to keep your SearchBar UI, use this instead:
          <SearchBar onlyButton onSearch={handleApplyFilter} />
          BUT ensure SearchBar internally uses <button type="submit"> or call submit
      */}
    </div>
  </form>
)}


      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mb-4">
        <CommonButton
          onClick={handlePDFDownload}
          variant="danger"
          className="px-4 py-[6px]"
        >
          PDF Download
        </CommonButton>
        <CommonButton
          onClick={handleExcelDownload}
          variant="success"
          className="px-4 py-[6px]"
        >
          XLS Download
        </CommonButton>
      </div>

      {/* Results Section */}
      <div className="mt-6">
        {loading ? (
          <p className="text-gray-500">Loading invoices...</p>
        ) : (
          <DataTable
            columns={columns}
            data={isSearched ? tableData : []}
            rowsPerPage={5}
            emptyMessage="No invoices found. Please use the filter to search."
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AllInvoiceList;