// import React, { useEffect, useRef, useState } from "react";
// import PageLayout from "../../../components/PageLayout";
// import CommonButton from "../../../components/CommonButton";
// import InputBox from "../../../components/InputBox";
// import axiosInstance from "../../../utils/axiosInstance";
// import * as XLSX from "xlsx-js-style";

// type Company = {
//   companyId: string;
//   companyName: string;
// };

// const OverallInvoiceReport: React.FC = () => {
//   const [companies, setCompanies] = useState<Company[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
//     from: "",
//     to: "",
//   });
//   const [selectedCompany, setSelectedCompany] = useState<string>("");
//   const [bookingType, setBookingType] = useState<string>("");
//   const [downloading, setDownloading] = useState(false);
//   const [downloadComplete, setDownloadComplete] = useState(false);
//   const filterFormRef = useRef<HTMLFormElement | null>(null);

//   /* -------------------- FETCH COMPANIES -------------------- */
//   const fetchCompanies = async () => {
//     try {
//       setLoading(true);
//       const { data } = await axiosInstance.get<{ data: Company[] }>(
//         `/company/getAllCompany?status=0`
//       );
//       setCompanies(data.data || []);
//     } catch (err) {
//       console.error("Error fetching companies", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCompanies();
//   }, []);

//   /* -------------------- DOWNLOAD EXCEL -------------------- */
//   const downloadExcel = async () => {
// if (
//   !dateRange.from ||
//   !dateRange.to ||
//   !selectedCompany ||
//   !bookingType
// ) {      alert("Please select date range and company");
//       return;
//     }

//     try {
//       setDownloading(true);
//       setDownloadComplete(false);

//     const { data } = await axiosInstance.get(
//   `/order/getallinvoicereport`,
//   {
//     params: {
//       from: dateRange.from,
//       to: dateRange.to,
//       companyId: selectedCompany,
//       bookingType,
//     },
//   }
// );

//       const rows: any[] = data.rows || [];

// const selectedCompanyName =
//   companies.find((c) => c.companyId === selectedCompany)?.companyName ||
//   "InvoiceReport";

// const firstTwoWords = selectedCompanyName
//   .trim()
//   .split(/\s+/)
//   .slice(0, 2)
//   .join("_");
// const bookingTypeLabel =
//   bookingType === "all"
//     ? "All"
//     : bookingType === "normal"
//     ? "Normal"
//     : bookingType === "monthly"
//     ? "Monthly"
//     : "OnCall";

// const reportTitle = `${firstTwoWords}_${bookingTypeLabel}`;
//       /* -------------------- HEADERS (EXACT ORDER) -------------------- */
//       let headers: string[] = [];

//       if (bookingType === "normal") {
//         headers = [
//         "S.no",
//         "Order Number",
//         "Trip Sheet Number",
//         "Invoice Number",
//         "Invoice Date",
//         "Pickup Date",
//         "Company",
//         "Vehicle No",
//         "Car Type",
//         "User Name",
//         "Self Name",
//         "Guest Name",
//         "PickUp Point",
//         "Trip Details",
//         "Starting (Km)",
//         "Closing (Km)",
//         "Total (Km)",
//         "Starting Time",
//         "Closing Time",
//         "Total Hrs",
//         "Extra KM",
//         "Extra Hrs",
//         "Package",
//         "Cab charge",
//         "Driver Bata",
//         "Gross Amount",
//         "CGST @ (2.5%)",
//         "SGST @ (2.5%)",
//         "Toll & Parking & Permit",
//         "Invoice Amount",
//         "Payment Status"
//       ]; }

//       if (bookingType === "oncall") {
//   headers = [
//     "S.no",
//     "Trip Sheet Number",
//     "Invoice Number",
//     "Invoice Date",
//     "Trip Date",
//     "Company",
//     "Vehicle No",
//     "Guest Name",
//     "Booked By",
//     "Trip Details",
//     "Package",
//     "Starting (Km)",
//     "Closing (Km)",
//     "Total (Km)",
//     "Usage Hrs",
//     "Extra KM",
//     "Extra Hrs",
//     "Cab Charge",
//     "Driver Bata",
//     "Gross Amount",
//     "CGST",
//     "SGST",
//     "Toll & Parking",
//     "Invoice Amount",
//   ];
// }

// if (bookingType === "monthly") {
//   headers = [
//     "S.no",
//     "Invoice Number",
//     "Invoice Date",
//     "Month",
//     "Company",
//     "Vehicle No",
//     "Vehicle Type",
//     "Route",
//     "Package",
//     "Extra KM",
//     "Extra Hrs",
//     "Cab Charge",
//     "Gross Amount",
//     "CGST",
//     "SGST",
//     "Toll & Parking",
//     "Invoice Amount",
//     "Payment Status",
//   ];
// }

//       /* -------------------- ROWS -------------------- */
//   let excelData: any[] = [];
//   if (bookingType === "normal") {
//   excelData = rows.map((row: any) => [
//         row.sno,
//         row.orderNumber,
//         row.tripSheetNumber,
//         row.invoiceNumber,
//         row.invoiceDate ? row.invoiceDate.slice(0, 10) : "",
//         row.pickupDate ? row.pickupDate.slice(0, 10) : "",
//         row.companyName,
//         row.vehicleNumber,
//         row.carType,
//         row.userName,
//         row.selfName,
//         row.behalfOfName,
//         row.pickupPoint,
//         row.tripDetails,
//         row.garageOpenKm,
//         row.garageCloseKm,
//         row.totalKm,
//         row.garageOpenDateTime,
//         row.garageCloseDateTime,
//         row.usageHours,
//         row.additionalKms,
//         row.additionalHours,
//         row.packageLabel,
//         row.cabCharge,
//         row.driverBata,
//         row.grossAmount,
//         row.cgstAmount,
//         row.sgstAmount,
//         row.tollParking,
//         row.invoiceAmount,
//         row.paymentStatus,
//       ]); }

//       if (bookingType === "oncall") {
//   excelData = rows.map((row: any) => [
//     row.sno,
//     row.tripSheetNumber,
//     row.invoiceNumber,
//     row.invoiceDate,
//     row.pickupDate,
//     row.companyName,
//     row.vehicleNumber,
//     row.behalfOfName,
//     row.userName,
//     row.tripDetails,
//     row.packageLabel,
//     row.garageOpenKm,
//     row.garageCloseKm,
//     row.totalKm,
//     row.usageHours,
//     row.additionalKms,
//     row.additionalHours,
//     row.cabCharge,
//     row.driverBata,
//     row.grossAmount,
//     row.cgstAmount,
//     row.sgstAmount,
//     row.tollParking,
//     row.invoiceAmount,
//   ]);
// }

// if (bookingType === "monthly") {
//   excelData = rows.map((row: any) => [
//     row.sno,
//     // row.orderNumber,
//     row.invoiceNumber,
//     row.invoiceDate,
//     row.pickupDate,
//     row.companyName,
//     row.vehicleNumber,
//     row.carType,
//     row.tripDetails,
//     row.packageLabel,
//     row.additionalKms,
//     row.additionalHours,
//     row.cabCharge,
//     row.grossAmount,
//     row.cgstAmount,
//     row.sgstAmount,
//     row.tollParking,
//     row.invoiceAmount,
//     row.paymentStatus,
//   ]);
// }

//       /* -------------------- TOTAL CALCULATION -------------------- */
// const totalGross = rows.reduce(
//   (sum: number, r: any) => sum + Number(r.grossAmount || 0),
//   0
// );

// const totalCGST = rows.reduce(
//   (sum: number, r: any) => sum + Number(r.cgstAmount || 0),
//   0
// );

// const totalSGST = rows.reduce(
//   (sum: number, r: any) => sum + Number(r.sgstAmount || 0),
//   0
// );

// const totalInvoice = rows.reduce(
//   (sum: number, r: any) => sum + Number(r.invoiceAmount || 0),
//   0
// );

// const totalToll = rows.reduce(
//   (sum: number, r: any) => sum + Number(r.tollParking || 0),
//   0
// );

// const totalRow = new Array(headers.length).fill("");

// if (bookingType === "normal") {
//   totalRow[22] = "TOTAL";
//   totalRow[25] = totalGross;
//   totalRow[26] = totalCGST;
//   totalRow[27] = totalSGST;
//   totalRow[28] = totalToll;
//   totalRow[29] = totalInvoice;
// }

// if (bookingType === "oncall") {
//   totalRow[17] = "TOTAL";
//   totalRow[19] = totalGross;
//   totalRow[20] = totalCGST;
//   totalRow[21] = totalSGST;
//   totalRow[22] = totalToll;
//   totalRow[23] = totalInvoice;
// }

// if (bookingType === "monthly") {
//   totalRow[11] = "TOTAL";
//   totalRow[12] = totalGross;
//   totalRow[13] = totalCGST;
//   totalRow[14] = totalSGST;
//   totalRow[15] = totalToll;
//   totalRow[16] = totalInvoice;
// }
// // const totalRow = [
// //   "", // S.no
// //   "", // Order Number
// //   "", // Trip Sheet
// //   "", // Invoice Number
// //   "", // Invoice Date
// //   "", // Pickup Date
// //   "", // Company
// //   "", // Vehicle No
// //   "", // Car Type
// //   "", // User Name
// //   "", // Guest Name
// //   "", // Pickup Point
// //   "", // Trip Details
// //   "", // Starting KM
// //   "", // Closing KM
// //   "", // Total KM
// //   "", // Start Time
// //   "", // End Time
// //   "", // Total Hrs
// //   "", // Extra KM
// //   "", // Extra Hrs

// //   "TOTAL",   // ✅ Package column (index 21)

// //   "",        // Cab charge
// //   "",        // Driver Bata

// //   totalGross,   // ✅ Gross Amount (index 24)
// //   totalCGST,    // ✅ CGST (index 25)
// //   totalSGST,    // ✅ SGST (index 26)

// //   "",           // Toll

// //   totalInvoice, // ✅ Invoice Amount (index 28)

// //   ""            // Payment Status
// // ];
//       /* -------------------- EXCEL SHEET -------------------- */
// const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData, totalRow]);
//       /* ✅ DARK BORDER STYLE */
//       const darkBorder = {
//         top: { style: "thin", color: { rgb: "000000" } },
//         bottom: { style: "thin", color: { rgb: "000000" } },
//         left: { style: "thin", color: { rgb: "000000" } },
//         right: { style: "thin", color: { rgb: "000000" } },
//       };

//       /* ✅ STYLE ALL CELLS WITH DARK BORDERS */
//       const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

//       for (let R = range.s.r; R <= range.e.r; ++R) {
//         for (let C = range.s.c; C <= range.e.c; ++C) {
//           const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
//           if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

//           // ✅ HEADER ROW (Row 0) - Bold + Gray Background
//           if (R === 0) {
//             ws[cellRef].s = {
//               font: { bold: true, sz: 11, color: { rgb: "000000" } },
//               alignment: { vertical: "center", horizontal: "center", wrapText: true },
//               fill: { patternType: "solid", fgColor: { rgb: "D3D3D3" } },
//               border: darkBorder,
//             };
//           } 
//           // ✅ DATA ROWS - Dark borders only
//         else {
//   ws[cellRef].s = {
//     border: darkBorder,
//     alignment: { vertical: "center", horizontal: "center" },
//   };

//   /* 🔥 TOTAL ROW STYLE */
//   if (R === excelData.length + 1) {
//     ws[cellRef].s = {
//       font: { bold: true },
//       fill: { patternType: "solid", fgColor: { rgb: "FFF59D" } }, // Yellow
//       border: darkBorder,
//       alignment: { horizontal: "center" }
//     };
//   }

//   // ✅ PAYMENT STATUS COLUMN
//   const paymentStatusColumn =
//   bookingType === "normal"
//     ? 30
//     : bookingType === "monthly"
//     ? 18
//     : -1;

// if (C === paymentStatusColumn && paymentStatusColumn !== -1)  {
//     const value = ws[cellRef].v?.toString().toLowerCase();

//     if (value === "pending") {
//       ws[cellRef].s.fill = { patternType: "solid", fgColor: { rgb: "f44336" } };
//       ws[cellRef].s.font = { color: { rgb: "FFFFFF" }, bold: true };
//     } else if (value === "completed") {
//       ws[cellRef].s.fill = { patternType: "solid", fgColor: { rgb: "71c24e" } };
//       ws[cellRef].s.font = { color: { rgb: "000000" }, bold: true };
//     }
//   }
// }
//         }
//       }

//       /* ✅ COLUMN WIDTHS */
//   if (bookingType === "normal") {
//   ws["!cols"] = [
//     { wch: 6 },
//     { wch: 16 },
//     { wch: 18 },
//     { wch: 18 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 22 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 25 },
//     { wch: 20 }, // Self Name
//     { wch: 20 },
//     { wch: 18 },
//     { wch: 30 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 18 },
//     { wch: 18 },
//     { wch: 12 },
//     { wch: 12 },
//     { wch: 12 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 16 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 22 },
//     { wch: 16 },
//     { wch: 16 },
//   ];
// }

// if (bookingType === "oncall") {
//   ws["!cols"] = [
//     { wch: 6 },
//     { wch: 18 },
//     { wch: 18 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 22 },
//     { wch: 14 },
//     { wch: 20 },
//     { wch: 20 },
//     { wch: 30 },
//     { wch: 16 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 12 },
//     { wch: 12 },
//     { wch: 12 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 16 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 20 },
//     { wch: 16 },
//   ];
// }

// if (bookingType === "monthly") {
//   ws["!cols"] = [
//     { wch: 6 },
//     { wch: 18 },
//     { wch: 18 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 22 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 30 },
//     { wch: 16 },
//     { wch: 12 },
//     { wch: 12 },
//     { wch: 14 },
//     { wch: 16 },
//     { wch: 14 },
//     { wch: 14 },
//     { wch: 20 },
//     { wch: 16 },
//     { wch: 16 },
//   ];
// }

//       /* ✅ ROW HEIGHT FOR HEADER */
//       ws["!rows"] = [{ hpt: 30 }];

//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb,ws,reportTitle.substring(0, 31));

//       XLSX.writeFile(
//         wb,
//         `${reportTitle}_InvoiceReport.xlsx`
//       );

//       setTimeout(() => {
//         setDownloadComplete(true);
//         setDownloading(false);
//       }, 1000);
//     } catch (err) {
//       console.error("Download error", err);
//       alert("Failed to download report");
//       setDownloading(false);
//     }
//   };

// const isFormFilled =
//   dateRange.from &&
//   dateRange.to &&
//   selectedCompany &&
//   bookingType;
//   useEffect(() => {
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key !== "Enter") return;

//       const active = document.activeElement as HTMLElement | null;

//       // ✅ only when focus is inside this form
//       if (filterFormRef.current && active && filterFormRef.current.contains(active)) {
//         e.preventDefault();

//         // ✅ prevent submit if not filled / already downloading
//         if (!isFormFilled || downloading) return;

//         downloadExcel();
//       }
//     };

//     document.addEventListener("keydown", onKeyDown);
//     return () => document.removeEventListener("keydown", onKeyDown);
//   }, [isFormFilled, downloading, selectedCompany, dateRange.from, dateRange.to]);

//   return (
//     <PageLayout>
//       <div className="py-6">
//         <h1 className="text-3xl font-bold mb-4">Overall Invoice Report</h1>

//         <form ref={filterFormRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//           <InputBox
//             label="From Date"
//             name="from"
//             type="date"
//             required
//             onChange={(_, value) =>
//               setDateRange((p) => ({ ...p, from: value }))
//             }
//           />
//           <InputBox
//             label="To Date"
//             name="to"
//             type="date"
//             required
//             onChange={(_, value) =>
//               setDateRange((p) => ({ ...p, to: value }))
//             }
//           />
//           <InputBox
//             label="Company"
//             name="company"
//             type="select"
//             required
//          options={[
//     { label: "All", value: "ALL" },
//     ...companies.map((c) => ({
//       label: c.companyName,
//       value: c.companyId,
//     })),
//   ]}
//             onChange={(_, value) => setSelectedCompany(value)}
//           />
//           <InputBox
//   label="Booking Type"
//   name="bookingType"
//   type="select"
//   required
// options={[
//   { label: "All", value: "all" },
//   { label: "Normal", value: "normal" },
//   { label: "Monthly", value: "monthly" },
//   { label: "On Call", value: "oncall" },
// ]}
//   onChange={(_, value) => setBookingType(value)}
// />
//         </form>

//         <div className="flex items-center space-x-4">
//           {!downloading && !downloadComplete && (
//             <CommonButton
//               variant="success"
//               onClick={downloadExcel}
//               disabled={!isFormFilled}
//             >
//               Download
//             </CommonButton>
//           )}

//           {downloading && (
//             <p className="text-blue-600">
//               Download is processing… Please wait
//             </p>
//           )}

//           {downloadComplete && (
//             <p
//               className="text-green-600 underline cursor-pointer"
//               onClick={() => setDownloadComplete(false)}
//             >
//               Download completed! Click to download another report.
//             </p>
//           )}
//         </div>
//       </div>
//     </PageLayout>
//   );
// };

// export default OverallInvoiceReport;


import React, { useEffect, useRef, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import CommonButton from "../../../components/CommonButton";
import InputBox from "../../../components/InputBox";
import axiosInstance from "../../../utils/axiosInstance";
import * as XLSX from "xlsx-js-style";

type Company = {
  companyId: string;
  companyName: string;
};

type ReportType = "normal" | "monthly" | "oncall";

/* =========================================================
  PER-TYPE CONFIG (headers, row mapping, col widths, totals)
========================================================= */
const getReportConfig = (type: ReportType) => {
  if (type === "normal") {
    return {
      sheetName: "Normal",
      headers: [
        "S.no", "Order Number", "Trip Sheet Number", "Invoice Number",
        "Invoice Date", "Pickup Date", "Company", "Vehicle No", "Car Type",
        "User Name", "Self Name", "Guest Name", "PickUp Point", "Trip Details",
        "Starting (Km)", "Closing (Km)", "Total (Km)", "Starting Time",
        "Closing Time", "Total Hrs", "Extra KM", "Extra Hrs", "Package",
        "Cab charge", "Driver Bata", "Gross Amount", "CGST @ (2.5%)",
        "SGST @ (2.5%)", "Toll & Parking & Permit", "Invoice Amount",
        "Payment Status",
      ],
      rowMapper: (row: any) => [
        row.sno, row.orderNumber, row.tripSheetNumber, row.invoiceNumber,
        row.invoiceDate ? row.invoiceDate.slice(0, 10) : "",
        row.pickupDate ? row.pickupDate.slice(0, 10) : "",
        row.companyName, row.vehicleNumber, row.carType, row.userName,
        row.selfName, row.behalfOfName, row.pickupPoint, row.tripDetails,
        row.garageOpenKm, row.garageCloseKm, row.totalKm,
        row.garageOpenDateTime, row.garageCloseDateTime, row.usageHours,
        row.additionalKms, row.additionalHours, row.packageLabel,
        row.cabCharge, row.driverBata, row.grossAmount, row.cgstAmount,
        row.sgstAmount, row.tollParking, row.invoiceAmount, row.paymentStatus,
      ],
      colWidths: [
        6, 16, 18, 18, 14, 14, 22, 14, 14, 25, 20, 20, 18, 30, 14, 14, 14,
        18, 18, 12, 12, 12, 14, 14, 14, 16, 14, 14, 22, 16, 16,
      ],
      paymentStatusColumn: 30,
    };
  }

  if (type === "oncall") {
    return {
      sheetName: "OnCall",
      headers: [
        "S.no", "Trip Sheet Number", "Invoice Number", "Invoice Date",
        "Trip Date", "Company", "Vehicle No", "Vehicle Type", "Guest Name", "Booked By",
        "Trip Details", "Package", "Starting (Km)", "Closing (Km)",
        "Total (Km)", "Starting Time",
        "Closing Time", "Usage Hrs", "Extra KM", "Extra Hrs", "Cab Charge",
        "Driver Bata", "Gross Amount", "CGST", "SGST",
        "Toll & Parking", "Discount", "Advance", "Invoice Amount",
      ],
      rowMapper: (row: any) => [
        row.sno, row.tripSheetNumber, row.invoiceNumber, row.invoiceDate,
        row.pickupDate, row.companyName, row.vehicleNumber, row.carType, row.behalfOfName,
        row.userName, row.tripDetails, row.packageLabel, row.garageOpenKm,
        row.garageCloseKm, row.totalKm, row.garageOpenDateTime,
        row.garageCloseDateTime, row.usageHours, row.additionalKms,
        row.additionalHours, row.cabCharge, row.driverBata,
        row.grossAmount, row.cgstAmount, row.sgstAmount, row.tollParking, row.discountAmount, row.advanceAmount,
        row.invoiceAmount,
      ],
      colWidths: [
        6, 18, 18, 14, 14, 22, 14, 16, 20, 20, 30, 16,
        14, 14, 14,
        14, 14,
        12,
        12,
        12,
        14,
        14,
        14,
        14,
        16,
        14,
        14,
        20,
        16,
      ],
      totalRowIndexes: {
        label: 20,
        gross: 22,
        cgst: 23,
        sgst: 24,
        toll: 25,
        invoice: 28,
      }, paymentStatusColumn: -1,
    };
  }

  // monthly
  return {
    sheetName: "Monthly",
    headers: [
      "S.no", "Invoice Number", "Invoice Date", "Month", "Company",
      "Vehicle No", "Vehicle Type", "Package", "Description", "Amount",
    ],
    rowMapper: (row: any) => [
      row.sno, row.invoiceNumber, row.invoiceDate, row.invoiceMonth || row.pickupDate,
      row.companyName, row.vehicleNumber, row.carType, row.packageLabel,
      row.description || formatMonthlyDescription(row), Number(row.packageAmount || 0),
    ],
    colWidths: [6, 18, 14, 12, 22, 16, 16, 20, 45, 14],
    totalRowIndexes: { label: 8, gross: 9, cgst: -1, sgst: -1, toll: -1, invoice: 9 },
    paymentStatusColumn: -1,
  };
};

const formatMonthlyDescription = (r: any) => {
  const month = r.invoiceMonth || r.pickupDate || "";
  const vehicleNo = r.vehicleNumber || "—";
  const vehicleType = r.carType || r.vehicleTypeName || "—";
  const route = r.route || r.tripDetails || "—";
  const days = r.pkgDays || 0;
  const km = r.pkgKm || 0;
  const amount = Number(r.packageAmount || 0).toLocaleString("en-IN");

  return (
    `Towards for the month of ${month}\n\n` +
    `Vehicle No : ${vehicleNo}\n\n` +
    `Vehicle Type : ${vehicleType}\n\n` +
    `Route : ${route}\n\n` +
    `Monthly Cab Charges\n\n` +
    `Coverage :\n` +
    `${days} Days / ${km} KM - ₹${amount}`
  );
};

const buildMonthlyGroupedInvoiceRows = (rows: any[]) => {
  const groups = new Map<string, any[]>();
  rows.forEach((r) => {
    const key = r.monthlyInvoiceId || r.invoiceNumber || "UNKNOWN";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  const groupedRows: any[] = [];
  let sno = 1;

  groups.forEach((items) => {
    const first = items[0];

    const packageAmount = items.reduce((s, r) => s + Number(r.packageAmount || 0), 0);
    const extraKm = items.reduce((s, r) => s + Number(r.extraKm || 0), 0);
    const extraKmAmount = items.reduce((s, r) => s + Number(r.extraKmAmount || 0), 0);
    const extraHrs = items.reduce((s, r) => s + Number(r.extraHrs || 0), 0);
    const extraHrsAmount = items.reduce((s, r) => s + Number(r.extraHrsAmount || 0), 0);
    const extraDays = items.reduce((s, r) => s + Number(r.extraDays || 0), 0);
    const driverBata = items.reduce((s, r) => s + Number(r.driverBata || 0), 0);
    const subTotal = packageAmount + extraKmAmount + extraHrsAmount + driverBata;

    const taxMap: Record<string, number> = {};
    items.forEach((r) => {
      (r.taxBreakup || []).forEach((t: any) => {
        const name = (t.taxName || "Tax").toString().trim();
        taxMap[name] = (taxMap[name] || 0) + Number(t.amount || 0);
      });
    });

    const taxBreakup = Object.entries(taxMap).map(([taxName, amount]) => ({ taxName, amount }));
    const totalTaxAmount = Object.values(taxMap).reduce((s, v) => s + v, 0);

    const extraChargesInputAmount =
      items.reduce(
        (s, r) => s + Number(r.extraChargesInputAmount || 0),
        0
      );

    const discountAmount =
      items.reduce(
        (s, r) => s + Number(r.discountAmount || 0),
        0
      );

    const advanceAmount =
      items.reduce(
        (s, r) => s + Number(r.advanceAmount || 0),
        0
      );

    const finalTotal =
      items.reduce(
        (s, r) => s + Number(r.finalTotal || 0),
        0
      );

    const balanceDue =
      items.reduce(
        (s, r) => s + Number(r.balanceDue || 0),
        0
      );
    const vehicleNumbers = Array.from(new Set(items.map((i) => i.vehicleNumber).filter(Boolean))).join(", ");
    const vehicleTypes = Array.from(new Set(items.map((i) => i.carType).filter(Boolean))).join(", ");
    const routes = items.map((i) => i.route).filter(Boolean).join(" | ");

    groupedRows.push({
      sno: sno++,
      monthlyInvoiceId: first.monthlyInvoiceId,
      invoiceNumber: first.invoiceNumber,
      invoiceDate: first.invoiceDate,
      invoiceMonth: first.invoiceMonth,
      companyName: first.companyName,
      vehicleNumber: vehicleNumbers,
      carType: vehicleTypes,
      route: routes,
      packageLabel: items.length > 1 ? `Multiple (${items.length} Routes)` : first.packageLabel,
      packageAmount,
      extraKm,
      extraKmAmount,
      extraHrs,
      extraHrsAmount,
      extraDays,
      driverBata,
      subTotal,
      taxBreakup,
      totalTaxAmount,
      extraChargesInputAmount,
      discountAmount,
      advanceAmount,
      finalTotal,
      balanceDue,
      paymentStatus: first.paymentStatus,
    });
  });

  return groupedRows;
};

const buildMonthlyDetailedWorksheet = (rawRows: any[]) => {
  const rows = buildMonthlyGroupedInvoiceRows(rawRows);
  const taxNamesSet = new Set<string>();
  rows.forEach((r) => {
    (r.taxBreakup || []).forEach((t: any) => {
      if (t.taxName) taxNamesSet.add(t.taxName.toString().trim());
    });
  });
  // const dynamicTaxNames = Array.from(taxNamesSet);

  const dynamicTaxNames = Array.from(taxNamesSet).filter(
    (name) => !name.toUpperCase().includes("OUTPUT")
  );
  const beforeCols = [
    "S.no",
    "Invoice Number",
    "Invoice Date",
    "Invoice Month",
    "Company",
    "Vehicle Number",
    "Vehicle Type",
    "Route",
    "Package",
    "Package Amount",
    "Extra KM Amount",
    "Extra Hours Amount",
    "Extra Days Amount",
    "Sub Total",
  ];

  const afterCols = [
    "Total GST",
    "Toll/Parking",
    "Discount",
    "Grand Total",
    "Advance Paid",
    "Balance Due",
    "Extra KM",
    "Extra Hours",
    "Extra Days",
  ];

  const headers = [...beforeCols, ...dynamicTaxNames, ...afterCols];

  const excelData = rows.map((r, i) => [
    i + 1,
    r.invoiceNumber,
    r.invoiceDate,
    r.invoiceMonth || r.pickupDate,
    r.companyName,
    r.vehicleNumber,
    r.carType,
    r.route,
    r.packageLabel,
    Number(r.packageAmount || 0),
    Number(r.extraKmAmount || 0),
    Number(r.extraHrsAmount || 0),
    Number(r.driverBata || 0),
    Number(r.subTotal || 0),
    ...dynamicTaxNames.map((name) => {
      const match = (r.taxBreakup || []).find((t: any) => (t.taxName || "").toString().trim() === name);
      return match ? Number(match.amount || 0) : 0;
    }),
    Number(r.totalTaxAmount || 0),
    Number(r.extraChargesInputAmount || r.tollParking || 0),
    Number(r.discountAmount || 0),
    Number(r.finalTotal || r.invoiceAmount || 0),
    Number(r.advanceAmount || 0),
    Number(r.balanceDue || 0),
    Number(r.extraKm || 0),
    Number(r.extraHrs || 0),
    Number(r.extraDays || 0),
  ]);

  const totalRow = new Array(headers.length).fill("");
  totalRow[8] = "TOTAL";
  for (let c = 9; c < headers.length; c++) {
    totalRow[c] = excelData.reduce((sum, row) => sum + Number(row[c] || 0), 0);
  }

  const aoaRows = [headers, ...excelData, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(aoaRows);

  const darkBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const totalRowIndex = excelData.length + 1;

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

      if (R === 0) {
        ws[cellRef].s = {
          font: { bold: true, sz: 11, color: { rgb: "000000" } },
          alignment: { vertical: "center", horizontal: "center", wrapText: true },
          fill: { patternType: "solid", fgColor: { rgb: "D3D3D3" } },
          border: darkBorder,
        };
        continue;
      }

      if (R === totalRowIndex) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "FFF59D" } },
          border: darkBorder,
          alignment: { horizontal: C >= 9 ? "right" : "center" },
        };
        continue;
      }

      ws[cellRef].s = {
        border: darkBorder,
        alignment: {
          vertical: "center",
          horizontal: C >= 9 ? "right" : "center",
        },
      };
    }
  }

  ws["!cols"] = headers.map((header, i) => {
    if (i === 0) return { wch: 6 };
    return { wch: Math.max(header.length + 3, i >= 9 ? 16 : 18) };
  });
  ws["!rows"] = [{ hpt: 30 }];

  return ws;
};

/* =========================================================
  ONCALL SUMMARY (1 row per invoice) — used only in "All" combined sheet
========================================================= */
const oncallSummaryHeaders = [
  "S.no", "Invoice Number", "Invoice Date", "Company",
  "Cab Charge", "Driver Bata", "Gross Amount",
  "CGST", "SGST", "Total GST", "Toll & Parking", "Discount", "Advance", "Invoice Amount",
];

const oncallSummaryRowMapper = (row: any) => [
  row.sno, row.invoiceNumber, row.invoiceDate, row.companyName,
  row.cabCharge, row.driverBata, row.grossAmount,
  row.cgstAmount, row.sgstAmount, row.totalGst, row.tollParking,
  row.discountAmount, row.advanceAmount, row.invoiceAmount,
];

const oncallSummaryTotalRowIndexes = {
  label: 1, gross: 6, cgst: 7, sgst: 8, totalGst: 9, toll: 10, discount: 11, advance: 12, invoice: 13,
};
const buildOncallSummaryRows = (rows: any[]) => {
  const groups = new Map<string, any[]>();
  rows.forEach((r) => {
    const key = r.invoiceNumber || "UNKNOWN";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  const summaryRows: any[] = [];
  let sno = 1;
  groups.forEach((groupRows, invoiceNumber) => {
    const first = groupRows[0];
    const cabCharge = groupRows.reduce((s, r) => s + Number(r.cabCharge || 0), 0);
    const driverBata = groupRows.reduce((s, r) => s + Number(r.driverBata || 0), 0);
   const grossAmount = groupRows.reduce(
  (s, r) => s + Number(r.grossAmount || 0),
  0
);

// =====================================================
// ONCALL INVOICE-LEVEL GST CALCULATION
// IMPORTANT:
// Do NOT round individual Trip Sheet GST values.
// First combine the complete invoice gross amount,
// then calculate GST and round the final invoice GST.
// =====================================================

const cgstAmount = Math.round(grossAmount * 0.025);

const sgstAmount = Math.round(grossAmount * 0.025);

const totalGst = cgstAmount + sgstAmount;

const tollParking = groupRows.reduce(
  (s, r) => s + Number(r.tollParking || 0),
  0
);

const discountAmount = groupRows.reduce(
  (s, r) => s + Number(r.discountAmount || 0),
  0
);

const advanceAmount = groupRows.reduce(
  (s, r) => s + Number(r.advanceAmount || 0),
  0
);

// Final invoice amount
// Advance must be deducted.
const invoiceAmount = Math.round(
  grossAmount +
  totalGst +
  tollParking -
  discountAmount -
  advanceAmount
);
    summaryRows.push({
      sno: sno++,
      invoiceNumber,
      invoiceDate: first.invoiceDate,
      companyName: first.companyName,
      cabCharge,
      driverBata,
      grossAmount,
      cgstAmount,
      sgstAmount,
      totalGst,
      tollParking,
      discountAmount,
      advanceAmount,
      invoiceAmount,
    });
  });

  return summaryRows;
};

/* =========================================================
  BUILD ONE STYLED WORKSHEET FOR A GIVEN TYPE + ROWS
========================================================= */
const buildWorksheet = (type: ReportType, rows: any[]) => {
  if (type === "monthly") {
    return buildMonthlyDetailedWorksheet(rows);
  }

  const config = getReportConfig(type);
  const { headers, rowMapper, colWidths, totalRowIndexes, paymentStatusColumn } = config;

  const excelData: any[][] = rows.map(rowMapper);
  const skipTotalRow = type === "oncall";

  let aoaRows: any[][] = [headers, ...excelData];

  if (!skipTotalRow && totalRowIndexes) {
    const totalGross = rows.reduce((s: number, r: any) => s + Number(r.grossAmount || 0), 0);
    const totalCGST = rows.reduce((s: number, r: any) => s + Number(r.cgstAmount || 0), 0);
    const totalSGST = rows.reduce((s: number, r: any) => s + Number(r.sgstAmount || 0), 0);
    const totalToll = rows.reduce((s: number, r: any) => s + Number(r.tollParking || 0), 0);
    const totalInvoice = rows.reduce((s: number, r: any) => s + Number(r.invoiceAmount || 0), 0);

    const totalRow = new Array(headers.length).fill("");
    totalRow[totalRowIndexes.label] = "TOTAL";
    totalRow[totalRowIndexes.gross] = totalGross;
    totalRow[totalRowIndexes.cgst] = totalCGST;
    totalRow[totalRowIndexes.sgst] = totalSGST;
    totalRow[totalRowIndexes.toll] = totalToll;
    totalRow[totalRowIndexes.invoice] = totalInvoice;
    aoaRows.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoaRows);

  const darkBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

      if (R === 0) {
        ws[cellRef].s = {
          font: { bold: true, sz: 11, color: { rgb: "000000" } },
          alignment: { vertical: "center", horizontal: "center", wrapText: true },
          fill: { patternType: "solid", fgColor: { rgb: "D3D3D3" } },
          border: darkBorder,
        };
        continue;
      }

      ws[cellRef].s = { border: darkBorder, alignment: { vertical: "center", horizontal: "center" } };

      if (!skipTotalRow && R === excelData.length + 1) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "FFF59D" } },
          border: darkBorder,
          alignment: { horizontal: "center" },
        };
      }

      if (C === paymentStatusColumn && paymentStatusColumn !== -1) {
        const value = ws[cellRef].v?.toString().toLowerCase();
        if (value === "pending") {
          ws[cellRef].s.fill = { patternType: "solid", fgColor: { rgb: "f44336" } };
          ws[cellRef].s.font = { color: { rgb: "FFFFFF" }, bold: true };
        } else if (value === "completed") {
          ws[cellRef].s.fill = { patternType: "solid", fgColor: { rgb: "71c24e" } };
          ws[cellRef].s.font = { color: { rgb: "000000" }, bold: true };
        }
      }
    }
  }

  ws["!cols"] = colWidths.map((w) => ({ wch: w }));
  ws["!rows"] = [{ hpt: 30 }];
  return ws;
};

/* =========================================================
  BUILD SINGLE COMBINED SHEET (Normal + Monthly + OnCall stacked)
========================================================= */
const buildCombinedInvoiceSheet = (
  normalRows: any[],
  monthlyRows: any[],
  oncallRows: any[]
) => {
  const isOncallSummarySection = (type: ReportType) => type === "oncall";

  const resolveSectionConfig = (type: ReportType) => {
    if (isOncallSummarySection(type)) {
      return {
        headers: oncallSummaryHeaders,
        rowMapper: oncallSummaryRowMapper,
        paymentStatusColumn: -1,
        totalRowIndexes: oncallSummaryTotalRowIndexes,
        dynamicTax: null,
      };
    }
    const config = getReportConfig(type);
    return {
      headers: config.headers,
      rowMapper: config.rowMapper,
      paymentStatusColumn: config.paymentStatusColumn,
      totalRowIndexes: config.totalRowIndexes,
      dynamicTax: null,
    };
  };

  const sections: { title: string; type: ReportType; rows: any[] }[] = [
    { title: "NORMAL BOOKING INVOICES", type: "normal", rows: normalRows },
    { title: "MONTHLY BOOKING INVOICES", type: "monthly", rows: monthlyRows },
    { title: "ON CALL BOOKING INVOICES", type: "oncall", rows: oncallRows },
  ];

  const resolvedSections = sections.map((s) => ({
    ...s,
    cfg: s.type === "monthly" ? null : resolveSectionConfig(s.type),
  }));

  let maxCols = 31; // Default width to accommodate normal headers

  const aoa: any[][] = [];
  const merges: any[] = [];
  const sectionTitleRows: number[] = [];
  const headerRows: number[] = [];
  const totalRows: number[] = [];
  const subtotalRows: number[] = [];
  const paymentStatusCells: { row: number; col: number }[] = [];

  resolvedSections.forEach((section) => {
    if (section.type === "monthly") {
      // ✅ Monthly section in Combined Sheet: 1 Row per Monthly Invoice (grouped & summed)
      const groupedMonthlyRows = buildMonthlyGroupedInvoiceRows(section.rows);

      // Collect all dynamic tax names across grouped rows
      const taxNamesSet = new Set<string>();
      groupedMonthlyRows.forEach((r) => {
        (r.taxBreakup || []).forEach((t: any) => {
          if (t.taxName) taxNamesSet.add(t.taxName.toString().trim());
        });
      });
      // const dynamicTaxNames = Array.from(taxNamesSet);

      const dynamicTaxNames = Array.from(taxNamesSet).filter(
        (name) => !name.toUpperCase().includes("OUTPUT")
      );
      const beforeCols = [
        "S.no",
        "Invoice Number",
        "Invoice Date",
        "Invoice Month",
        "Company",
        "Package Amount",
        "Extra KM Amount",
        "Extra Hours Amount",
        "Extra Days Amount",
        "Sub Total",
      ];

      const afterCols = [
        "Total GST",
        "Toll/ Parking",
        "Discount",
        "Grand Total",
        "Advance Paid",
        "Balance Due",
        "Extra KM",
        "Extra Hours",
        "Extra Days",
      ];

      const monthlyHeaders = [...beforeCols, ...dynamicTaxNames, ...afterCols];

      // ---- Section title row ----
      const titleRowIndex = aoa.length;
      const titleRow = new Array(maxCols).fill("");
      titleRow[0] = section.title;
      aoa.push(titleRow);
      sectionTitleRows.push(titleRowIndex);
      merges.push({ s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: monthlyHeaders.length - 1 } });

      // ---- Header row ----
      const headerRowIndex = aoa.length;
      const headerRow = new Array(maxCols).fill("");
      monthlyHeaders.forEach((h, i) => (headerRow[i] = h));
      aoa.push(headerRow);
      headerRows.push(headerRowIndex);

      // ---- Data rows ----
      const excelData = groupedMonthlyRows.map((r, i) => [
        i + 1,
        r.invoiceNumber,
        r.invoiceDate,
        r.invoiceMonth,
        r.companyName,

        Number(r.packageAmount || 0),
        Number(r.extraKmAmount || 0),
        Number(r.extraHrsAmount || 0),
        Number(r.driverBata || 0),
        Number(r.subTotal || 0),
        ...dynamicTaxNames.map((name) => {
          const match = (r.taxBreakup || []).find((t: any) => (t.taxName || "").toString().trim() === name);
          return match ? Number(match.amount || 0) : 0;
        }),
        Number(r.totalTaxAmount || 0),
        Number(r.extraChargesInputAmount || r.tollParking || 0),
        Number(r.discountAmount || 0),
        Number(r.finalTotal || r.invoiceAmount || 0),
        Number(r.advanceAmount || 0),
        Number(r.balanceDue || 0),
        Number(r.extraKm || 0),
        Number(r.extraHrs || 0),
        Number(r.extraDays || 0),
      ]);

      excelData.forEach((row) => {
        const fullRow = new Array(maxCols).fill("");
        row.forEach((v, idx) => (fullRow[idx] = v));
        aoa.push(fullRow);
      });

      // ---- Total row ----
      const totalRow = new Array(maxCols).fill("");
      totalRow[4] = "TOTAL";

      for (let c = 5; c < monthlyHeaders.length; c++) {
        totalRow[c] = groupedMonthlyRows.reduce((s, _, rIdx) => s + Number(excelData[rIdx][c] || 0), 0);
      }

      const totalRowIndex = aoa.length;
      aoa.push(totalRow);
      totalRows.push(totalRowIndex);

      // Blank spacer row
      aoa.push(new Array(maxCols).fill(""));
      return;
    }

    const { headers, rowMapper, totalRowIndexes, paymentStatusColumn } = section.cfg!;
    const isOncallSummary = isOncallSummarySection(section.type);

    // ---- Section title row ----
    const titleRowIndex = aoa.length;
    const titleRow = new Array(maxCols).fill("");
    titleRow[0] = section.title;
    aoa.push(titleRow);
    sectionTitleRows.push(titleRowIndex);
    merges.push({ s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: headers.length - 1 } });

    // ---- Header row ----
    const headerRowIndex = aoa.length;
    const headerRow = new Array(maxCols).fill("");
    headers.forEach((h, i) => (headerRow[i] = h));
    aoa.push(headerRow);
    headerRows.push(headerRowIndex);

    // ---- Data rows ----
    const sourceRows = isOncallSummary ? buildOncallSummaryRows(section.rows) : section.rows;
    const excelData: any[][] = sourceRows.map(rowMapper);

    excelData.forEach((row) => {
      const fullRow = new Array(maxCols).fill("");
      row.forEach((v: any, i: number) => (fullRow[i] = v));
      aoa.push(fullRow);
    });

    if (totalRowIndexes) {
      const rowsToSum = isOncallSummary ? sourceRows : section.rows;

      const totalGross = rowsToSum.reduce((s: number, r: any) => s + Number(r.grossAmount || 0), 0);
      const totalToll = rowsToSum.reduce((s: number, r: any) => s + Number(r.tollParking || 0), 0);
      const totalInvoice = rowsToSum.reduce((s: number, r: any) => s + Number(r.invoiceAmount || 0), 0);

      const totalRow = new Array(maxCols).fill("");
      totalRow[totalRowIndexes.label] = "TOTAL";
      totalRow[totalRowIndexes.gross] = totalGross;
      totalRow[totalRowIndexes.toll] = totalToll;
      totalRow[totalRowIndexes.invoice] = totalInvoice;

      if ("cgst" in totalRowIndexes && "sgst" in totalRowIndexes) {
        const totalCGST = rowsToSum.reduce((s: number, r: any) => s + Number(r.cgstAmount || 0), 0);
        const totalSGST = rowsToSum.reduce((s: number, r: any) => s + Number(r.sgstAmount || 0), 0);
        totalRow[(totalRowIndexes as any).cgst] = totalCGST;
        totalRow[(totalRowIndexes as any).sgst] = totalSGST;
      }

      if ("totalGst" in totalRowIndexes) {
        const totalTaxSum = rowsToSum.reduce((s: number, r: any) => s + Number(r.totalGst || 0), 0);
        totalRow[(totalRowIndexes as any).totalGst] = totalTaxSum;
      }

      if (isOncallSummary) {
        const totalDiscount = rowsToSum.reduce((s: number, r: any) => s + Number(r.discountAmount || 0), 0);
        const totalAdvance = rowsToSum.reduce((s: number, r: any) => s + Number(r.advanceAmount || 0), 0);
        totalRow[(totalRowIndexes as any).discount] = totalDiscount;
        totalRow[(totalRowIndexes as any).advance] = totalAdvance;
      }

      const totalRowIndex = aoa.length;
      aoa.push(totalRow);
      totalRows.push(totalRowIndex);
    }

    if (paymentStatusColumn !== -1) {
      excelData.forEach((_, i) => {
        paymentStatusCells.push({ row: headerRowIndex + 1 + i, col: paymentStatusColumn });
      });
    }

    // ---- Blank spacer row between sections ----
    aoa.push(new Array(maxCols).fill(""));
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;

  const darkBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  for (let R = range.s.r; R <= range.e.r; ++R) {
    const isBlankSpacer = aoa[R]?.every((v) => v === "");

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

      if (sectionTitleRows.includes(R)) {
        ws[cellRef].s = {
          font: { bold: true, sz: 13, color: { rgb: "FFFFFF" } },
          alignment: { vertical: "center", horizontal: "center" },
          fill: { patternType: "solid", fgColor: { rgb: "2F5496" } },
        };
        continue;
      }

      if (headerRows.includes(R)) {
        ws[cellRef].s = {
          font: { bold: true, sz: 11, color: { rgb: "000000" } },
          alignment: { vertical: "center", horizontal: "center", wrapText: true },
          fill: { patternType: "solid", fgColor: { rgb: "D3D3D3" } },
          border: darkBorder,
        };
        continue;
      }

      if (subtotalRows.includes(R)) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F5F5F5" } },
          border: darkBorder,
          alignment: { vertical: "center", horizontal: C === 8 ? "left" : "right" },
        };
        continue;
      }

      if (totalRows.includes(R)) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "FFF59D" } },
          border: darkBorder,
          alignment: { horizontal: "center" },
        };
        continue;
      }

      if (isBlankSpacer) continue;

      ws[cellRef].s = {
        border: darkBorder,
        alignment: { vertical: "center", horizontal: "center", wrapText: C === 8 },
      };

      const psCell = paymentStatusCells.find((p) => p.row === R && p.col === C);
      if (psCell) {
        const value = ws[cellRef].v?.toString().toLowerCase();
        if (value === "pending") {
          ws[cellRef].s.fill = { patternType: "solid", fgColor: { rgb: "f44336" } };
          ws[cellRef].s.font = { color: { rgb: "FFFFFF" }, bold: true };
        } else if (value === "completed") {
          ws[cellRef].s.fill = { patternType: "solid", fgColor: { rgb: "71c24e" } };
          ws[cellRef].s.font = { color: { rgb: "000000" }, bold: true };
        }
      }
    }
  }

  ws["!cols"] = new Array(maxCols).fill({ wch: 16 });
  ws["!rows"] = aoa.map((_, i) => (sectionTitleRows.includes(i) ? { hpt: 26 } : { hpt: 22 }));

  return ws;
};

const OverallInvoiceReport: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [bookingType, setBookingType] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const filterFormRef = useRef<HTMLFormElement | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get<{ data: Company[] }>(
        `/company/getAllCompany?status=0`
      );
      setCompanies(data.data || []);
    } catch (err) {
      console.error("Error fetching companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  /* -------------------- DOWNLOAD EXCEL -------------------- */
  const downloadExcel = async () => {
    if (!dateRange.from || !dateRange.to || !selectedCompany || !bookingType) {
      alert("Please select date range and company");
      return;
    }

    try {
      setDownloading(true);
      setDownloadComplete(false);

      const { data } = await axiosInstance.get(`/order/getallinvoicereport`, {
        params: {
          from: dateRange.from,
          to: dateRange.to,
          companyId: selectedCompany,
          bookingType,
        },
      });

      const selectedCompanyName =
        companies.find((c) => c.companyId === selectedCompany)?.companyName ||
        "InvoiceReport";

      const firstTwoWords = selectedCompanyName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join("_");

      const bookingTypeLabel =
        bookingType === "all"
          ? "All"
          : bookingType === "normal"
            ? "Normal"
            : bookingType === "monthly"
              ? "Monthly"
              : "OnCall";

      const reportTitle = `${firstTwoWords}_${bookingTypeLabel}`;


      if (bookingType === "all") {
        // ✅ ONE single sheet, all 3 types stacked with heading rows
        const ws = buildCombinedInvoiceSheet(
          data.normalRows || [],
          data.monthlyRows || [],
          data.oncallRows || []
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "All_Invoices");
        XLSX.writeFile(wb, `${reportTitle}_InvoiceReport.xlsx`);
      } else {
        const ws = buildWorksheet(bookingType as ReportType, data.rows || []);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, reportTitle.substring(0, 31));
        XLSX.writeFile(wb, `${reportTitle}_InvoiceReport.xlsx`);
      }


      setTimeout(() => {
        setDownloadComplete(true);
        setDownloading(false);
      }, 1000);
    } catch (err) {
      console.error("Download error", err);
      alert("Failed to download report");
      setDownloading(false);
    }
  };

  const isFormFilled =
    dateRange.from && dateRange.to && selectedCompany && bookingType;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const active = document.activeElement as HTMLElement | null;
      if (filterFormRef.current && active && filterFormRef.current.contains(active)) {
        e.preventDefault();
        if (!isFormFilled || downloading) return;
        downloadExcel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFormFilled, downloading, selectedCompany, dateRange.from, dateRange.to]);

  return (
    <PageLayout>
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-4">Overall Invoice Report</h1>

        <form ref={filterFormRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <InputBox
            label="From Date"
            name="from"
            type="date"
            required
            onChange={(_, value) => setDateRange((p) => ({ ...p, from: value }))}
          />
          <InputBox
            label="To Date"
            name="to"
            type="date"
            required
            onChange={(_, value) => setDateRange((p) => ({ ...p, to: value }))}
          />
          <InputBox
            label="Company"
            name="company"
            type="select"
            required
            options={[
              { label: "All", value: "ALL" },
              ...companies.map((c) => ({
                label: c.companyName,
                value: c.companyId,
              })),
            ]}
            onChange={(_, value) => setSelectedCompany(value)}
          />
          <InputBox
            label="Booking Type"
            name="bookingType"
            type="select"
            required
            options={[
              { label: "All", value: "all" },
              { label: "Normal", value: "normal" },
              { label: "Monthly", value: "monthly" },
              { label: "On Call", value: "oncall" },
            ]}
            onChange={(_, value) => setBookingType(value)}
          />
        </form>

        <div className="flex items-center space-x-4">
          {!downloading && !downloadComplete && (
            <CommonButton variant="success" onClick={downloadExcel} disabled={!isFormFilled}>
              Download
            </CommonButton>
          )}

          {downloading && (
            <p className="text-blue-600">Download is processing… Please wait</p>
          )}

          {downloadComplete && (
            <p
              className="text-green-600 underline cursor-pointer"
              onClick={() => setDownloadComplete(false)}
            >
              Download completed! Click to download another report.
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default OverallInvoiceReport;