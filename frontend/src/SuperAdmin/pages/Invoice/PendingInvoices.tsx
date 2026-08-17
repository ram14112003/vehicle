import React, { useEffect, useRef, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox, { getFormStore } from "../../../components/InputBox";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import { useNavigate, useNavigationType } from "react-router-dom";

// ✅ PDF + Excel libraries
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx-js-style";

interface InvoiceData {
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  pickupDate: string;
  pickupType: string;
  invoiceAmount: number;
  bookingId: string;
}

interface Company {
  companyId: string;
  companyName: string;
}

const PendingInvoices: React.FC = () => {
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [tableData, setTableData] = useState<InvoiceData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const filterBoxRef = useRef<HTMLDivElement | null>(null);


  // ✅ Clear only when user enters page freshly (not from back)
  useEffect(() => {
    if (navigationType !== "POP") {
      sessionStorage.removeItem("PendingInvoicesData");
    }
  }, [navigationType]);

  // ✅ Restore data when coming back
  useEffect(() => {
    const saved = sessionStorage.getItem("PendingInvoicesData");
    if (saved) {
      const { tableData: savedTableData, selectedCompany: savedCompany, formValues } = JSON.parse(saved);

      if (savedTableData) {
        setTableData(savedTableData);
        setIsSearched(true);
      }

      if (savedCompany) {
        setSelectedCompany(savedCompany);
      }

      if (formValues) {
        const store = getFormStore();
        Object.entries(formValues).forEach(([key, value]) => {
          store[key] = value;
        });
      }
    }
  }, []);

  // ✅ New (Browser Local Time, same as ConfirmPendingList)
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

  const handleApplyFilter = async () => {
    try {
      const form = getFormStore();
      const { username, dateRange } = form;

      // ✅ Stop API call if no filters applied
      if (!username && !selectedCompany && !dateRange) {
        showToast("Please enter at least one filter to search", "warn");
        return;
      }

      const query = new URLSearchParams();

      if (username) query.append("username", username);
if (selectedCompany && selectedCompany !== "all") {
  query.append("company", selectedCompany);
}

      // ✅ handle dateRange
      if (dateRange) {
        const [fromRaw, toRaw] = dateRange.split(" - ");

        if (fromRaw && toRaw) {
          const [fD, fM, fY] = fromRaw.split("/");
          const [tD, tM, tY] = toRaw.split("/");

          const from = `${fY}-${fM}-${fD}`;
          const to = `${tY}-${tM}-${tD}`;

          query.append("fromDate", from);
          query.append("toDate", to);
        }
      }

      const response = await axiosInstance.get(
        `/invoiceRoutes/getFilteredPendingInvoices?${query.toString()}`
      );

    if (response.data.success) {
  const invoices = response.data.data;

  const fetchData = await Promise.all(
    invoices.map(async (invoice: InvoiceData) => {
      try {
        const orderRes = await axiosInstance.post("/order/getOrdersById", {
          bookingId: invoice.bookingId,
        });

        if (orderRes.data.success && orderRes.data.data) {
          return {
            ...invoice,
            pickupDate: orderRes.data.data.bookingDate || "-",
            pickupType: orderRes.data.data.pickupPoint || "-",
          };
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      }
      return { ...invoice, pickupDate: "-", pickupType: "-" };
    })
  );

  // ✅ OLD → NEW order (last booking last-ah varum)
  const sortedData = fetchData.sort(
    (a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
  );

  setTableData(sortedData);
  setIsSearched(true);

  sessionStorage.setItem(
    "PendingInvoicesData",
    JSON.stringify({
      tableData: sortedData,
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
      console.error("Error fetching pending invoices:", error);
      setTableData([]);
      setIsSearched(true);
    }
  };

  useEffect(() => {
  if (!showFilterBox) return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    // ✅ only when focus is inside filter box
    const active = document.activeElement as HTMLElement | null;
    if (filterBoxRef.current && active && filterBoxRef.current.contains(active)) {
      e.preventDefault();
      handleApplyFilter();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [showFilterBox, selectedCompany, companies]); 


  /** Fetch companies from backend */
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axiosInstance.get<{ data: Company[] }>(
          `/company/getAllCompany?status=0`
        );
        setCompanies(data.data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // ✅ PDF Download
  const handlePDFDownload = () => {
    if (!tableData || tableData.length === 0) {
      showToast("No data available to export", "warn");
      return;
    }

    const doc = new jsPDF("p", "pt");
    doc.setFontSize(14);
    doc.text("List Payment Pending Invoice", 220, 30);

    const headers = [
      [
        "S. No",
        "Order Number",
        "Invoice Number",
        "Invoice Date",
        "User Name",
        "Pickup Date",
        "Invoice Amount (Rs.)",
        "Payment Status",
      ],
    ];

    const rows = tableData.map((item, index) => [
      index + 1,
      item.orderNumber,
      item.invoiceNumber,
      formatToCustom(item.invoiceDate),
      item.userName,
      formatToCustom(item.pickupDate),
      item.invoiceAmount,
      "Pending",
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 50,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [0, 102, 204] },
      didParseCell: (data) => {
        const rowData = data.row.raw as any[];
        if (rowData && rowData[data.column.index] === "Pending") {
          data.cell.styles.textColor = [255, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`Pending_Invoices_${new Date().toISOString().split("T")[0]}.pdf`);
  };
const handleXLSDownload = () => {
  if (!tableData || tableData.length === 0) {
    showToast("No data available to export", "warn");
    return;
  }

  const worksheetData = tableData.map((item, index) => ({
    "S. No": index + 1,
    "Order Number": item.orderNumber,
    "Invoice Number": item.invoiceNumber,
    "Invoice Date": formatToCustom(item.invoiceDate),
    "User Name": item.userName,
    "Pickup Date (IST)": formatToCustom(item.pickupDate),
    "Pickup Type": item.pickupType || "-",
    "Invoice Amount (Rs.)": item.invoiceAmount,
    // ✅ match your screenshot value (or keep Pending if you want)
    "Payment Status": "Not Paid",
  }));

  const ws = XLSX.utils.json_to_sheet(worksheetData);

  const headers = Object.keys(worksheetData[0]);

  // ✅ Auto column width
  ws["!cols"] = headers.map((k) => ({
    wch:
      Math.max(
        k.length,
        ...worksheetData.map((row: Record<string, any>) =>
          row[k] ? row[k].toString().length : 0
        )
      ) + 2,
  }));

  const ref = ws["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);

    // ✅ Header style (row 0)
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellAddr]) continue;

      ws[cellAddr].s = {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
ws["!rows"] = [];
ws["!rows"][0] = { hpt: 28 };

    // ✅ Body alignment center (optional)
 // ✅ Body style with full borders (like Excel grid)
for (let r = 1; r <= range.e.r; r++) {
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r, c });
    if (!ws[cellAddr]) continue;

    ws[cellAddr].s = ws[cellAddr].s || {};
    ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };

    ws[cellAddr].s.border = {
      top:    { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left:   { style: "thin", color: { rgb: "000000" } },
      right:  { style: "thin", color: { rgb: "000000" } },
    };
  }
}


    // ✅ Payment Status red (Pending OR Not Paid)
    const payCol = headers.indexOf("Payment Status");
    if (payCol !== -1) {
      for (let r = 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c: payCol });
        const v = ws[addr]?.v;

        if (v === "Pending" || v === "Not Paid") {
          ws[addr].s = ws[addr].s || {};
          ws[addr].s.font = { ...(ws[addr].s.font || {}), bold: true, color: { rgb: "FF0000" } };
          ws[addr].s.alignment = { horizontal: "center", vertical: "center" };
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PendingInvoices");

  const fileName = `Pending_Invoices_${new Date().toISOString().split("T")[0]}.xlsx`;

  // ✅ IMPORTANT: enable style writing
  XLSX.writeFile(wb, fileName, { cellStyles: true });
};





  const columns: Column<InvoiceData>[] = [
    {
      header: "Order Number #",
      accessor: "orderNumber",
      render: (row) => (
        <button
          className="text-blue-600 hover:underline font-bold"
          onClick={() => navigate(`/orders/view/payment-pending-order/${row.bookingId}`)}
        >
          {row.orderNumber}
        </button>
      ),
    },
    { header: "Invoice Number #", accessor: "invoiceNumber" },
    {
      header: "Invoice Date",
      accessor: "invoiceDate",
      render: (row) => formatToCustom(row.invoiceDate),
    },
    { header: "User Name", accessor: "userName" },
    {
      header: "Pickup Date",
      accessor: "pickupDate",
      render: (row) => formatToCustom(row.pickupDate),
    },
    { header: "Pickup Type", accessor: "pickupType" },
    { header: "Invoice Amount (Rs.)", accessor: "invoiceAmount" },
  ];
 

  return (
    <PageLayout>
      <AlertContainer />
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Pending Invoices
        </h1>
      </div>

      {/* Filter Toggle Button */}
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
        <div ref={filterBoxRef} className="rounded-lg w-full  bg-gray-50 p-6 mb-6 shadow-sm">
<div className="flex flex-col md:flex-row md:items-end gap-4 w-full">   
           <div className="w-[350px]">
              <InputBox name="username" label="Username" placeholder="Enter Username" />
            </div>

            <div className="w-[220px]">
              <InputBox
                name="company"
                label="Company"
                type="select"
               options={[
    { label: "All", value: "all" },   // ✅ All option
    ...companies.map((c) => ({
      label: c.companyName,
      value: c.companyId,
    })),
  ]}
                value={selectedCompany}
                onChange={(name, value) => setSelectedCompany(value)}
              />
            </div>

            <div className="w-[280px]">
              <InputBox name="dateRange" label="Date Range" type="date-range" />
            </div>
    <div className="flex items-end mb-4" >
            <SearchBar onlyButton onSearch={handleApplyFilter}  />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mb-6">
        <CommonButton
          variant="danger"
          className="px-6 py-2"
          onClick={handlePDFDownload}
        >
          PDF Download
        </CommonButton>
        <CommonButton
          variant="success"
          className="px-6 py-2"
          onClick={handleXLSDownload}
        >
          XLS Download
        </CommonButton>
      </div>

      {/* Results Section */}
      <div className="mt-4">
        <DataTable
          columns={columns}
          data={isSearched ? tableData : []}
          rowsPerPage={5}
          emptyMessage="No pending invoices found. Please use the filter to search."
        />
      </div>
    </PageLayout>
  );
};

export default PendingInvoices;