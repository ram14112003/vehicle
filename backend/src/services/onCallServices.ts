import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { Op } from "sequelize";
import { OnCallInvoice } from '../models/onCallInvoice';
import { Company } from '../models/company';
import { OnCallInvoiceItems } from '../models/onCallInvoiceItems';
import { Tax } from '../models/tax';
import { Invoice, sequelize } from '../models';
import config from "../config/config";
import { ORDER } from '../utils/costants';
import { InvoiceSequence } from '../models/invoice_sequence';
import { Sequelize } from 'sequelize';
// export const createOncallInvoice = async (
//   req: Request,
//   res: Response
// ) => {

//   try {

//     const {
//       companyName,
//       tripSheetNo,
//       pickupDate,
//       vehicleType,
//       vehicleNo,
//       driverName,
//       guestName,
//       bookedBy,
//       travelPackage,
//       tripDetails,
//       startingKM,
//       closingKM,
//       startingTime,
//       closingTime,
//       package: packageName,
//       cabCharge,
//       tollParkingPermit,
//       driverBatta,
//     } = req.body;

//     // SAVE
//     const invoice = await OnCallInvoice.create({
//       companyName,
//       tripSheetNo,
//       pickupDate,
//       vehicleType,
//       vehicleNo,
//       driverName,
//       guestName,
//       bookedBy,
//       travelPackage,
//       tripDetails,
//       startingKM,
//       closingKM,
//       startingTime,
//       closingTime,
//       package: packageName,
//       cabCharge,
//       tollParkingPermit,
//       driverBatta,
//     });


//     // PDF
//     const pdfData =
//       await generateOncallInvoicePDF(invoice);

//     return res.status(201).json({
//       success: true,
//       message: 'OnCall Invoice Created Successfully',
//       data: invoice,
//       pdf: pdfData.downloadUrl
//     });

//   } catch (error) {

//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: 'Internal Server Error'
//     });

//   }

// };


// export const createOncallInvoice = async (
//   req: Request,
//   res: Response
// ) => {

//   try {

//     const {
//       companyName,
//       bookedBy,
//       totalAmount,
//         cgst,
//   sgst,
//       invoiceItems
//     } = req.body;

//     // SAVE HEADER
//     const invoice =
//       await OnCallInvoice.create({

//         companyName,

//         bookedBy,

//         totalAmount,   cgst,
//   sgst,

//       });

//     // SAVE ITEMS
//     await Promise.all(

//       invoiceItems.map(
//         async (item: any) => {

//           await OnCallInvoiceItems.create({

//             onCallBillId:
//               invoice.onCallBillId,

//             date:
//               item.date,

//             tripSheetNo:
//               item.tripSheetNo,

//             guestName:
//               item.guestName,

//             amount:
//               item.amount,

//             toll:
//               item.toll,

//             driverBatta:
//               item.driverBatta

//           });

//         }
//       )

//     );

//     // GET ITEMS
//     const savedItems =
//       await OnCallInvoiceItems.findAll({

//         where: {
//           onCallBillId:
//             invoice.onCallBillId
//         }

//       });

//     // PDF
//     const pdfData =
//       await generateOncallInvoicePDF({

//         invoice,

//         invoiceItems: savedItems

//       });

//     return res.status(201).json({

//       success: true,

//       message:
//         'OnCall Invoice Created Successfully',

//       data: invoice,

//       pdf: pdfData.downloadUrl

//     });

//   } catch (error) {

//     console.error(error);

//     return res.status(500).json({

//       success: false,

//       message:
//         'Internal Server Error'

//     });

//   }

// };

// export const generateOncallInvoiceHTML = (data: any) => {
//   const invoice = data.invoice;
//   const invoiceItems = data.invoiceItems;

//   const totalAmount = Number(invoice.totalAmount || 0);
//   const tripSheetNumbers: string[] = JSON.parse(invoice.tripSheetNumbers || '[]');

//   const logoPath = path.join(__dirname, '../images/logo.png');
//   const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
//   const logoSrc = `data:image/png;base64,${logoBase64}`;

//   // ── Build per-tripsheet blocks ──
//   const tripBlocks = invoiceItems.map((item: any, index: number) => {
//     const taxes: { taxName: string; taxPercent: number; taxAmount: number }[] =
//       JSON.parse(item.taxes || '[]');
//     const meta = JSON.parse(item.selectedPackageMeta || '{}');
//     const extraBreakup: { title: string; amount: number }[] =
//       JSON.parse(item.extraChargesBreakup || '[]');

//     const taxRows = taxes.map(t => `
//       <tr>
//         <td class="lbl">${t.taxName} (${t.taxPercent}%)</td>
//         <td class="val">₹ ${Number(t.taxAmount).toFixed(2)}</td>
//       </tr>`).join('');

//     const extraRows = extraBreakup.map(e => `
//       <tr>
//         <td class="lbl">${e.title}</td>
//         <td class="val">₹ ${Number(e.amount).toFixed(2)}</td>
//       </tr>`).join('');

//     return `
//     <!-- ═══ TRIP SHEET ${index + 1} ═══ -->
//     <div class="trip-block">

//       <!-- Trip block header -->
//       <div class="trip-header">
//         <div class="trip-header-left">
//           <span class="trip-badge">${index + 1}</span>
//           <span class="trip-title">Trip Sheet</span>
//           <span class="trip-sheet-no"># ${item.tripSheetNo || '—'}</span>
//         </div>
//         <div class="trip-header-right">
//           <span class="trip-date">${item.date ? moment(item.date).format('DD MMM YYYY') : '—'}</span>
//         </div>
//       </div>

//       <div class="trip-body">

//         <!-- LEFT: Trip details grid -->
//         <div class="trip-details">

//           <div class="detail-section-title">Vehicle & Guest</div>
//           <table class="detail-table">
//             <tr><td class="dk">Guest Name</td>    <td class="dv">${item.guestName   || '—'}</td></tr>
//             <tr><td class="dk">Booked By</td>     <td class="dv">${item.bookedBy    || '—'}</td></tr>
//             <tr><td class="dk">Vehicle No</td>    <td class="dv">${item.vehicleNo   || '—'}</td></tr>
//             <tr><td class="dk">Driver</td>        <td class="dv">${item.driverName  || '—'}</td></tr>
//             <tr><td class="dk">Trip Details</td>  <td class="dv">${item.tripDetails || '—'}</td></tr>
//             <tr><td class="dk">Package Type</td>  <td class="dv">${item.packageType || '—'}</td></tr>
//             <tr><td class="dk">Package</td>       <td class="dv">${item.travelPackage || '—'}</td></tr>
//           </table>

//           <div class="detail-section-title" style="margin-top:10px;">KM & Time</div>
//           <table class="detail-table">
//             <tr>
//               <td class="dk">Garage KM</td>
//               <td class="dv">${item.garageOpenKm} → ${item.garageCloseKm}
//                 <span class="km-badge">${item.garageKms} km</span>
//               </td>
//             </tr>
//             ${!item.hideGuestDetails ? `
//             <tr>
//               <td class="dk">Guest KM</td>
//               <td class="dv">${item.guestOpenKm} → ${item.guestCloseKm}
//                 <span class="km-badge">${item.guestKms} km</span>
//               </td>
//             </tr>` : ''}
//             <tr>
//               <td class="dk">Starting Time</td>
//               <td class="dv">${item.startingTime ? moment(item.startingTime).format('DD-MM-YYYY hh:mm A') : '—'}</td>
//             </tr>
//             <tr>
//               <td class="dk">Closing Time</td>
//               <td class="dv">${item.closingTime  ? moment(item.closingTime).format('DD-MM-YYYY hh:mm A')  : '—'}</td>
//             </tr>
//             <tr><td class="dk">Hours Used</td><td class="dv">${item.usageHours} hrs</td></tr>
//             ${item.packageDays > 1 ? `
//             <tr><td class="dk">Package Days</td><td class="dv">${item.packageDays}</td></tr>
//             <tr><td class="dk">Driver Days</td> <td class="dv">${item.driverDays}</td></tr>` : ''}
//           </table>

//         </div>

//         <!-- RIGHT: Fare breakdown -->
//         <div class="trip-fare">

//           <div class="detail-section-title">Fare Breakdown</div>
//           <table class="fare-table">
//             <tr><td class="lbl">Package Amount</td>      <td class="val">₹ ${Number(item.packageAmount).toFixed(2)}</td></tr>
//             ${item.additionalKms > 0 ? `
//             <tr><td class="lbl">Extra KM (${item.additionalKms} km)</td>
//                 <td class="val">₹ ${Number(item.additionalKmsAmount).toFixed(2)}</td></tr>` : ''}
//             ${item.additionalHours > 0 ? `
//             <tr><td class="lbl">Extra Hours (${item.additionalHours} hrs)</td>
//                 <td class="val">₹ ${Number(item.additionalHoursAmount).toFixed(2)}</td></tr>` : ''}
//             ${item.driverBatta > 0 ? `
//             <tr><td class="lbl">Driver Batta</td>
//                 <td class="val">₹ ${Number(item.driverBatta).toFixed(2)}</td></tr>` : ''}
//             <tr class="subtotal-row">
//               <td class="lbl">Sub Total</td>
//               <td class="val">₹ ${Number(item.amount).toFixed(2)}</td>
//             </tr>
//             ${taxRows}
//             ${extraRows}
//             ${item.discountAmount > 0 ? `
//             <tr><td class="lbl discount">Discount</td>
//                 <td class="val discount">− ₹ ${Number(item.discountAmount).toFixed(2)}</td></tr>` : ''}
//             <tr class="total-row">
//               <td class="lbl">Total</td>
//               <td class="val">₹ ${Number(item.total).toFixed(2)}</td>
//             </tr>
//             ${item.advanceAmount > 0 ? `
//             <tr><td class="lbl">Advance Paid</td>
//                 <td class="val advance">− ₹ ${Number(item.advanceAmount).toFixed(2)}</td></tr>
//             <tr class="due-row">
//               <td class="lbl">Amount Due</td>
//               <td class="val">₹ ${Number(item.totalDue).toFixed(2)}</td>
//             </tr>` : ''}
//           </table>

//         </div>

//       </div>
//     </div>`;
//   }).join('');

//   // ── Grand summary tax consolidation ──
//   const allTaxes: Record<string, { percent: number; amount: number }> = {};
//   invoiceItems.forEach((item: any) => {
//     const taxes: { taxName: string; taxPercent: number; taxAmount: number }[] =
//       JSON.parse(item.taxes || '[]');
//     taxes.forEach(t => {
//       if (!allTaxes[t.taxName]) allTaxes[t.taxName] = { percent: t.taxPercent, amount: 0 };
//       allTaxes[t.taxName].amount += t.taxAmount;
//     });
//   });

//   const grandTaxRows = Object.entries(allTaxes).map(([name, t]) => `
//     <tr>
//       <td class="lbl">${name} (${t.percent}%)</td>
//       <td class="val">₹ ${t.amount.toFixed(2)}</td>
//     </tr>`).join('');

//   const amountInWords = numberToWords(totalAmount);

//   return `
// <!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8">
// <style>

//   * { box-sizing: border-box; margin: 0; padding: 0; }

//   body {
//     font-family: Arial, sans-serif;
//     font-size: 12px;
//     color: #111;
//     background: #fff;
//     padding: 24px;
//   }

//   /* ── HEADER ── */
//   .page-header {
//     display: flex;
//     justify-content: space-between;
//     align-items: flex-start;
//     margin-bottom: 24px;
//     padding-bottom: 16px;
//     border-bottom: 2px solid #2f5d85;
//   }
//   .logo { width: 160px; }
//   .invoice-meta { text-align: right; line-height: 2; }
//   .invoice-meta b { color: #2f5d85; }

//   /* ── PAGE TITLE ── */
//   .page-title {
//     text-align: center;
//     font-size: 20px;
//     font-weight: bold;
//     color: #2f5d85;
//     letter-spacing: 2px;
//     margin-bottom: 20px;
//     text-transform: uppercase;
//   }

//   /* ── COMMON INFO BAND ── */
//   .common-band {
//     display: flex;
//     gap: 20px;
//     margin-bottom: 24px;
//     background: #f4f7fb;
//     border: 1px solid #ccd9e8;
//     border-radius: 6px;
//     padding: 14px 18px;
//   }
//   .common-col { flex: 1; }
//   .common-col-title {
//     font-size: 10px;
//     font-weight: bold;
//     letter-spacing: 1.5px;
//     text-transform: uppercase;
//     color: #2f5d85;
//     margin-bottom: 8px;
//     padding-bottom: 4px;
//     border-bottom: 1px solid #ccd9e8;
//   }
//   .common-row {
//     display: flex;
//     justify-content: space-between;
//     margin-bottom: 5px;
//     font-size: 12px;
//   }
//   .common-row .ck { font-weight: bold; color: #444; }
//   .common-row .cv { color: #111; text-align: right; }

//   /* Trip sheet numbers pills */
//   .sheet-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
//   .sheet-pill {
//     background: #2f5d85;
//     color: #fff;
//     border-radius: 12px;
//     padding: 2px 10px;
//     font-size: 10px;
//     font-weight: bold;
//     font-family: monospace;
//   }

//   /* ── SECTION LABEL ── */
//   .section-label {
//     background: #2f5d85;
//     color: #fff;
//     font-weight: bold;
//     font-size: 11px;
//     letter-spacing: 1px;
//     text-transform: uppercase;
//     padding: 6px 14px;
//     margin: 20px 0 14px;
//     border-radius: 4px;
//   }

//   /* ── TRIP BLOCK ── */
//   .trip-block {
//     border: 1px solid #ccd9e8;
//     border-radius: 6px;
//     margin-bottom: 20px;
//     overflow: hidden;
//     page-break-inside: avoid;
//   }
//   .trip-header {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     background: #2f5d85;
//     color: #fff;
//     padding: 8px 14px;
//   }
//   .trip-header-left { display: flex; align-items: center; gap: 10px; }
//   .trip-badge {
//     width: 22px; height: 22px;
//     border-radius: 50%;
//     background: rgba(255,255,255,0.2);
//     border: 1px solid rgba(255,255,255,0.4);
//     display: inline-flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 11px;
//     font-weight: bold;
//   }
//   .trip-title { font-weight: bold; font-size: 12px; }
//   .trip-sheet-no {
//     font-family: monospace;
//     font-size: 11px;
//     background: rgba(255,255,255,0.15);
//     border: 1px solid rgba(255,255,255,0.25);
//     border-radius: 10px;
//     padding: 1px 8px;
//   }
//   .trip-date { font-size: 11px; opacity: 0.85; }

//   .trip-body {
//     display: flex;
//     gap: 0;
//   }

//   /* LEFT */
//   .trip-details {
//     flex: 1.3;
//     padding: 12px 14px;
//     border-right: 1px solid #ccd9e8;
//   }

//   /* RIGHT */
//   .trip-fare {
//     flex: 1;
//     padding: 12px 14px;
//     background: #fafcff;
//   }

//   .detail-section-title {
//     font-size: 10px;
//     font-weight: bold;
//     letter-spacing: 1px;
//     text-transform: uppercase;
//     color: #2f5d85;
//     margin-bottom: 6px;
//     padding-bottom: 3px;
//     border-bottom: 1px solid #dde6f0;
//   }

//   .detail-table { width: 100%; border-collapse: collapse; }
//   .detail-table td { padding: 3px 4px; vertical-align: top; }
//   .detail-table .dk { font-weight: bold; color: #555; width: 40%; white-space: nowrap; }
//   .detail-table .dv { color: #111; }
//   .km-badge {
//     background: #e8f0f8;
//     color: #2f5d85;
//     border-radius: 8px;
//     padding: 1px 7px;
//     font-size: 10px;
//     font-weight: bold;
//     margin-left: 5px;
//   }

//   /* Fare table */
//   .fare-table { width: 100%; border-collapse: collapse; }
//   .fare-table td { padding: 4px 2px; }
//   .fare-table .lbl { color: #555; }
//   .fare-table .val { text-align: right; font-weight: bold; color: #111; }
//   .fare-table .discount { color: #c0392b; }
//   .fare-table .advance  { color: #888; }

//   .subtotal-row td {
//     border-top: 1px solid #dde6f0;
//     font-weight: bold;
//     color: #2f5d85;
//     padding-top: 6px;
//   }
//   .total-row td {
//     border-top: 2px solid #2f5d85;
//     font-size: 13px;
//     font-weight: bold;
//     color: #2f5d85;
//     padding-top: 6px;
//   }
//   .due-row td {
//     font-size: 13px;
//     font-weight: bold;
//     color: #27ae60;
//   }

//   /* ── GRAND SUMMARY ── */
//   .grand-summary {
//     margin-top: 24px;
//     border: 2px solid #2f5d85;
//     border-radius: 6px;
//     overflow: hidden;
//     page-break-inside: avoid;
//   }
//   .grand-summary-header {
//     background: #2f5d85;
//     color: #fff;
//     font-weight: bold;
//     font-size: 12px;
//     letter-spacing: 1px;
//     text-transform: uppercase;
//     padding: 8px 16px;
//   }
//   .grand-summary-body { padding: 14px 16px; }

//   /* Per-sheet summary table */
//   .sheet-summary-table {
//     width: 100%;
//     border-collapse: collapse;
//     margin-bottom: 14px;
//   }
//   .sheet-summary-table th {
//     background: #f4f7fb;
//     border: 1px solid #ccd9e8;
//     padding: 6px 8px;
//     font-size: 11px;
//     text-align: left;
//     color: #2f5d85;
//   }
//   .sheet-summary-table td {
//     border: 1px solid #ccd9e8;
//     padding: 6px 8px;
//     font-size: 11px;
//   }
//   .sheet-summary-table td.num { text-align: right; font-weight: bold; }
//   .sheet-summary-table tr:nth-child(even) td { background: #f9fbfd; }

//   /* Totals box */
//   .totals-box {
//     width: 320px;
//     margin-left: auto;
//     border-collapse: collapse;
//   }
//   .totals-box td { padding: 5px 6px; font-size: 13px; }
//   .totals-box .lbl { font-weight: bold; color: #444; }
//   .totals-box .val { text-align: right; font-weight: bold; color: #111; }
//   .totals-box .grand-row td {
//     border-top: 2px solid #2f5d85;
//     font-size: 15px;
//     color: #2f5d85;
//     padding-top: 8px;
//   }

//   /* ── AMOUNT IN WORDS ── */
//   .amount-words {
//     margin-top: 16px;
//     background: #f4f7fb;
//     border-left: 3px solid #2f5d85;
//     padding: 8px 12px;
//     font-weight: bold;
//     font-size: 12px;
//     color: #2f5d85;
//     border-radius: 0 4px 4px 0;
//   }

//   /* ── FOOTER ── */
//   .footer {
//     margin-top: 30px;
//     border-top: 1px solid #ccc;
//     padding-top: 10px;
//     font-size: 10px;
//     line-height: 2;
//     color: #555;
//     display: flex;
//     justify-content: space-between;
//     flex-wrap: wrap;
//     gap: 10px;
//   }
//   .footer-note { font-style: italic; color: #888; }

// </style>
// </head>
// <body>

// <div class="invoice-container">

//   <!-- ═══ PAGE HEADER ═══ -->
//   <div class="page-header">
//     <img src="${logoSrc}" class="logo" />
//     <div class="invoice-meta">
//       <div><b>Invoice No:</b> ONCALL-${invoice.onCallBillId.slice(0, 8).toUpperCase()}</div>
//       <div><b>Invoice Date:</b> ${moment().format('DD-MMM-YYYY hh:mm A')}</div>
//       <div><b>Due Date:</b> ${moment().add(10, 'days').format('DD-MMM-YYYY')}</div>
//     </div>
//   </div>

//   <div class="page-title">On Call Invoice</div>

//   <!-- ═══ COMMON DETAILS BAND ═══ -->
//   <div class="common-band">

//     <div class="common-col">
//       <div class="common-col-title">Billing To</div>
//       <div class="common-row"><span class="ck">Company</span><span class="cv">${invoice.companyName || '—'}</span></div>
//       <div class="common-row"><span class="ck">GST No</span><span class="cv">33AAMCG2518C1Z0</span></div>
//     </div>

//     <div class="common-col">
//       <div class="common-col-title">Invoice Summary</div>
//       <div class="common-row"><span class="ck">Total Trip Sheets</span><span class="cv">${invoiceItems.length}</span></div>
//       <div class="common-row"><span class="ck">Grand Total</span><span class="cv" style="color:#2f5d85;font-size:14px;">₹ ${totalAmount.toFixed(2)}</span></div>
//     </div>

//     <div class="common-col">
//       <div class="common-col-title">Trip Sheet Numbers</div>
//       <div class="sheet-pills">
//         ${tripSheetNumbers.map((n: string) => `<span class="sheet-pill">${n}</span>`).join('')}
//       </div>
//     </div>

//   </div>

//   <!-- ═══ TRIP SHEET BLOCKS ═══ -->
//   <div class="section-label">Trip Sheet Details</div>

//   ${tripBlocks}

//   <!-- ═══ GRAND SUMMARY ═══ -->
//   <div class="grand-summary">

//     <div class="grand-summary-header">Grand Summary</div>

//     <div class="grand-summary-body">

//       <!-- Per-sheet summary table -->
//       <table class="sheet-summary-table">
//         <tr>
//           <th>Sl</th>
//           <th>Trip Sheet No</th>
//           <th>Date</th>
//           <th>Guest Name</th>
//           <th>Package Amt</th>
//           <th>Driver Batta</th>
//           <th>Extra Charges</th>
//           <th>Tax</th>
//           <th>Discount</th>
//           <th>Total</th>
//         </tr>
//         ${invoiceItems.map((item: any, i: number) => `
//         <tr>
//           <td>${i + 1}</td>
//           <td><b>${item.tripSheetNo || '—'}</b></td>
//           <td>${item.date ? moment(item.date).format('DD-MM-YYYY') : '—'}</td>
//           <td>${item.guestName || '—'}</td>
//           <td class="num">₹ ${Number(item.packageAmount).toFixed(2)}</td>
//           <td class="num">₹ ${Number(item.driverBatta).toFixed(2)}</td>
//           <td class="num">₹ ${Number(item.extraCharges).toFixed(2)}</td>
//           <td class="num">₹ ${Number(item.totalTaxAmount).toFixed(2)}</td>
//           <td class="num">${item.discountAmount > 0 ? `− ₹ ${Number(item.discountAmount).toFixed(2)}` : '—'}</td>
//           <td class="num" style="color:#2f5d85;">₹ ${Number(item.total).toFixed(2)}</td>
//         </tr>`).join('')}
//       </table>

//       <!-- Totals box -->
//       <table class="totals-box">
//         <tr><td class="lbl">Sub Total</td>
//             <td class="val">₹ ${invoiceItems.reduce((s: number, i: any) => s + Number(i.amount), 0).toFixed(2)}</td></tr>
//         ${grandTaxRows}
//         <tr><td class="lbl">Total Extra Charges</td>
//             <td class="val">₹ ${invoiceItems.reduce((s: number, i: any) => s + Number(i.extraCharges), 0).toFixed(2)}</td></tr>
//         <tr><td class="lbl">Total Discount</td>
//             <td class="val" style="color:#c0392b;">− ₹ ${invoiceItems.reduce((s: number, i: any) => s + Number(i.discountAmount), 0).toFixed(2)}</td></tr>
//         <tr class="grand-row">
//           <td class="lbl">Grand Total</td>
//           <td class="val">₹ ${totalAmount.toFixed(2)}</td>
//         </tr>
//       </table>

//       <div class="amount-words">
//         In Words: ${amountInWords}
//       </div>

//     </div>
//   </div>

//   <!-- ═══ FOOTER ═══ -->
//   <div class="footer">
//     <div>
//       <div><b>Grace Cabs Pvt. Ltd.</b></div>
//       <div>7/621 Nesamani Nagar, Perumbakkam, Chennai - 600100</div>
//       <div>Website: gracecabs.com</div>
//     </div>
//     <div>
//       <div><b>GSTIN:</b> 33AAMCG2518C1Z0</div>
//       <div><b>PAN No:</b> AAMCG2518C</div>
//       <div><b>SAC:</b> 996609</div>
//     </div>
//     <div class="footer-note">
//       <div>* System generated invoice — no signature required</div>
//       <div>* GST 5% - Without ITC &nbsp;|&nbsp; GST 12% - With ITC</div>
//     </div>
//   </div>

// </div>
// </body>
// </html>`;
// };
const safeParse = (val: any): any[] => {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return [];
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'null' || trimmed === '[]') return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.every(k => !isNaN(Number(k)))) {
      return Object.values(val);
    }
  }
  return [];
};
export const createOncallInvoice = async (req: Request, res: Response) => {
  try {
    const { companyId, tripSheets } = req.body;

    // ── Validate ──
    if (!companyId || !Array.isArray(tripSheets) || tripSheets.length === 0) {
      return res.status(400).json({ success: false, message: 'companyId and tripSheets are required' });
    }

    const company = await Company.findByPk(companyId);

    const companyName =
      company?.companyName || '';

    const companyAddress =
      company?.companyAddress || '';

    // ── Calculate subtotal (sum of all trip subtotals before tax) ──
    const invoiceSubTotal = tripSheets.reduce(
      (sum: number, t: any) => sum + Number(t.amount || t.totalAmount || 0),
      0
    );

    // ── Determine tax rates from the first trip sheet's taxes ──
    let taxRates: Array<{ taxName: string; taxPercent: number }> = [];
    if (tripSheets.length > 0 && tripSheets[0].taxes) {
      try {
        const parsed = typeof tripSheets[0].taxes === "string" ? JSON.parse(tripSheets[0].taxes) : tripSheets[0].taxes;
        if (Array.isArray(parsed)) {
          taxRates = parsed.map((t: any) => ({
            taxName: t.taxName || "Tax",
            taxPercent: Number(t.taxPercent || 0),
          }));
        }
      } catch (e) {
        console.error("Error parsing first trip sheet taxes:", e);
      }
    }

    if (taxRates.length === 0) {
      taxRates = [
        { taxName: "CGST", taxPercent: 2.5 },
        { taxName: "SGST", taxPercent: 2.5 }
      ];
    }

    // ── Generate invoiceTaxBreakup from invoiceSubTotal ──
    const taxBreakup = taxRates.map((r) => {
      const taxAmount = (invoiceSubTotal * r.taxPercent) / 100;
      return {
        taxName: r.taxName,
        taxPercent: r.taxPercent,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
      };
    });
    const totalTaxAmount = taxBreakup.reduce((sum, t) => sum + t.taxAmount, 0);

    // ── Calculate grand total separately (sum of subtotal + taxes + tolls - discounts) ──
    const totalExtraCharges = tripSheets.reduce((sum: number, t: any) => sum + Number(t.extraCharges || 0), 0);
    const totalDiscount = tripSheets.reduce((sum: number, t: any) => sum + Number(t.discountAmount || 0), 0);
    const grandTotalVal = parseFloat((invoiceSubTotal + totalTaxAmount + totalExtraCharges - totalDiscount).toFixed(2));

    const totalAdvance = tripSheets.reduce((sum: number, t: any) => sum + Number(t.advanceAmount || 0), 0);
    const grandDue = grandTotalVal - totalAdvance;
    const roundedGrandDue = Math.round(grandDue);

    const tripSheetNumbers = tripSheets.map((t: any) => t.tripSheetNo || t.tripSheetNumber);
    const bookedBy = tripSheets[0]?.bookedBy || '';

    // ── 1. Save header in onCallInvoice ──
    const invoice = await OnCallInvoice.create({
      companyId,
      companyName,
      tripSheetNumbers: JSON.stringify(tripSheetNumbers),
      bookedBy,
      totalAmount: roundedGrandDue,
      totalTaxAmount: JSON.stringify(taxBreakup),
      invoiceSubTotal: parseFloat(invoiceSubTotal.toFixed(2)),
      invoiceTaxBreakup: JSON.stringify(taxBreakup),
    });

    const commonInvoice = await Invoice.create({
      companyId,
      invoiceAmount: roundedGrandDue,
      invoiceStatus: ORDER.STATUS.PENDING,
      startDate: new Date(),
      endDate: new Date(),
    });

    await invoice.update({
      onCallInvoiceCode: commonInvoice.invoiceNumber,
    });

    const fullInvoice = await OnCallInvoice.findOne({
      where: {
        onCallBillId: invoice.onCallBillId
      },

      include: [
        {
          model: Company,
          as: "company",
          required: false,
          attributes: [
            "companyId",
            "companyName",
            "companyAddress",
            "gstNo"
          ]
        }
      ],

      raw: false,
      nest: true
    });

    console.log(
      "FULL INVOICE => ",
      JSON.stringify(fullInvoice, null, 2)
    );

    const cgstTax = await Tax.findOne({
      where: {
        taxName: 'CGST',
        isActive: true
      }
    });

    const sgstTax = await Tax.findOne({
      where: {
        taxName: 'SGST',
        isActive: true
      }
    });

    const igstTax = await Tax.findOne({
      where: {
        taxName: 'IGST',
        isActive: true
      }
    });
    console.log("CGST TAX => ", cgstTax?.taxPercent);
    console.log("SGST TAX => ", sgstTax?.taxPercent);
    // ── 2. Save each trip sheet as a row in onCallInvoiceItems ──
    await Promise.all(
      tripSheets.map(async (item: any) => {
        await OnCallInvoiceItems.create({
          onCallBillId: invoice.onCallBillId,
          tripSheetNo: item.tripSheetNo || item.tripSheetNumber,
          date: item.date || item.pickupDate,
          vehicleTypeId: item.vehicleTypeId,
          vehicleNo: item.vehicleNo,
          driverName: item.driverName,
          guestName: item.guestName,
          bookedBy: item.bookedBy,
          tripDetails: item.tripDetails,
          garageOpenKm: item.garageOpenKm || 0,
          garageCloseKm: item.garageCloseKm || 0,
          garageKms: item.garageKms || 0,
          guestOpenKm: item.guestOpenKm || 0,
          guestCloseKm: item.guestCloseKm || 0,
          guestKms: item.guestKms || 0,
          hideGuestDetails: item.hideGuestDetails ?? true,
          startingTime: item.startingTime,
          closingTime: item.closingTime,
          usageHours: item.usageHours || 0,
          packageType: item.packageType,
          travelPackage: item.travelPackage,
          packageDays: item.packageDays || 1,
          driverDays: item.driverDays || 1,
          selectedPackageMeta: item.selectedPackageMeta || '{}',
          packageAmount: item.packageAmount || 0,
          additionalKms: item.additionalKms || 0,
          additionalKmsAmount: item.additionalKmsAmount || 0,
          additionalHours: item.additionalHours || 0,
          additionalHoursAmount: item.additionalHoursAmount || 0,
          driverBatta: item.driverBatta || 0,
          extraChargesBreakup: item.extraChargesBreakup || '[]',
          extraCharges: item.extraCharges || 0,
          discountAmount: item.discountAmount || 0,
          advanceAmount: item.advanceAmount || 0,

          // ✅ KEY FIX: Use taxes directly from frontend — no cgstApplicable checks
          taxes: item.taxes || '[]',
          totalTaxAmount: item.totalTaxAmount || 0,

          amount: item.amount || item.totalAmount || 0,
          total: item.total || 0,
          totalDue: item.totalDue || 0,
        });
      })
    );

    // ── 3. Fetch saved items for PDF ──
    const savedItems = await OnCallInvoiceItems.findAll({
      where: { onCallBillId: invoice.onCallBillId },
    });

    // ── 4. Generate PDF ──
    const pdfData = await generateOncallInvoicePDF({
      invoice: fullInvoice,
      invoiceItems: savedItems,
    });

    return res.status(201).json({
      success: true,
      message: 'OnCall Invoice Created Successfully',
      data: invoice,
      invoiceItems: savedItems,
      pdf: pdfData.downloadUrl,
      onCallBillId: invoice.onCallBillId,
    });

  } catch (error) {
    console.error('createOncallInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



export const deleteOnCallInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const { onCallBillId } = req.params;

    if (!onCallBillId) {
      return res.status(400).json({
        success: false,
        message: "onCallBillId is required",
      });
    }

    const invoice = await OnCallInvoice.findByPk(onCallBillId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "OnCall Invoice not found",
      });
    }

    await invoice.update({
      isDeleted: true,
    });

    // Optional (Hard delete items)
    await OnCallInvoiceItems.destroy({
      where: {
        onCallBillId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "OnCall Invoice deleted successfully.",
    });
  } catch (error: any) {
    console.error("Delete OnCall Invoice Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const generateOncallInvoicePDF = async (
  invoice: any
) => {


  const htmlContent =
    generateOncallInvoiceHTML(invoice);

  // FOLDER
  const uploadsDir = path.join(
    process.cwd(),
    'uploads',
    'oncallinvoice'
  );

  if (!fs.existsSync(uploadsDir)) {

    fs.mkdirSync(uploadsDir, {
      recursive: true
    });

  }

  // FILE
  const pdfFileName =
    `oncall_invoice_${invoice.invoice.onCallBillId}_${Date.now()}.pdf`;

  const pdfPath = path.join(
    uploadsDir,
    pdfFileName
  );

  // PUPPETEER
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  await page.setContent(
    htmlContent,
    {
      waitUntil: 'domcontentloaded'
    }
  );

  await new Promise(resolve =>
    setTimeout(resolve, 1000)
  );

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    }
  });

  await browser.close();
  const BASE_URL = config.baseurl.apibaseurl;
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
  const invoiceInstance = invoice.invoice;
  const invoiceCode = invoiceInstance?.onCallInvoiceCode;
  const downloadName = invoiceCode ? `${invoiceCode}.pdf` : `oncall_invoice_${invoiceInstance?.onCallBillId || Date.now()}.pdf`;

  const token = jwt.sign(
    { fileName: pdfFileName, downloadName },
    JWT_SECRET,
    { expiresIn: "5m" }
  );

  return {
    pdfPath,
    pdfFileName,
    downloadUrl:
      `${BASE_URL}/api/downloadPdf/download/oncall-invoice/${pdfFileName}?token=${token}`
  };
};

export const generateOncallInvoiceHTML = (data: any) => {
  const invoice = data.invoice;
  const invoiceItems = data.invoiceItems;

  const logoPath = path.join(__dirname, '../images/logo.png');
  const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
  const logoSrc = `data:image/png;base64,${logoBase64}`;

  let subTotal: number;
  let parsedTotalTax: Array<{ taxName: string; taxPercent?: number; taxAmount: number }>;

  if (invoice.invoiceSubTotal !== null && invoice.invoiceSubTotal !== undefined) {
    subTotal = Number(invoice.invoiceSubTotal);
    parsedTotalTax = safeParse(invoice.invoiceTaxBreakup || '[]');
  } else {
    // Legacy Fallback
    subTotal = invoiceItems.reduce(
      (s: number, i: any) => s + Number(i.amount || 0), 0
    );
    const taxMap: Record<string, { taxPercent: number; taxAmount: number }> = {};
    invoiceItems.forEach((item: any) => {
      const itemTaxes = safeParse(item.taxes);
      itemTaxes.forEach((t: any) => {
        const key = t.taxName || "Unknown";
        if (!taxMap[key]) {
          taxMap[key] = { taxPercent: t.taxPercent || 0, taxAmount: 0 };
        }
        taxMap[key].taxAmount += Number(t.taxAmount) || 0;
      });
    });

    parsedTotalTax = Object.entries(taxMap).map(([taxName, t]) => ({
      taxName,
      taxPercent: t.taxPercent,
      taxAmount: t.taxAmount
    }));
  }

  const totalTaxAmount = parsedTotalTax.reduce(
    (sum: number, tax: any) => sum + Number(tax.taxAmount || 0),
    0
  );

  const roundedTotalGST = Math.round(totalTaxAmount);


  const totalDiscount = invoiceItems.reduce(
    (s: number, i: any) => s + Number(i.discountAmount || 0),
    0
  );

  const totalAdvance = invoiceItems.reduce(
    (s: number, i: any) => s + Number(i.advanceAmount || 0),
    0
  );

  const totalDriverBatta = invoiceItems.reduce(
    (s: number, i: any) => s + Number(i.driverBatta || 0), 0
  );

  const totalTollParking = invoiceItems.reduce((sum: number, item: any) => {
    const extraBreakup = safeParse(item.extraChargesBreakup);
    const fromBreakup = extraBreakup.reduce(
      (s: number, e: any) => s + Number(e.amount || 0), 0
    );
    return sum + (fromBreakup > 0 ? fromBreakup : Number(item.extraCharges || 0));
  }, 0);

  const roundedGST = parsedTotalTax.reduce(
    (sum: number, t: any) => sum + Math.round(Number(t.taxAmount || 0)),
    0
  );

  const displaySubTotal =
    subTotal - totalDriverBatta;

  const grossTotal =
    displaySubTotal + totalDriverBatta;

  const grandTotal =
    grossTotal +
    roundedGST +
    totalTollParking -
    totalDiscount -
    totalAdvance;

  const amountInWords = numberToWords(grandTotal);
  const companyAddress =
    invoice?.company?.companyAddress ||
    invoice?.companyAddress ||
    "-";

  const addressParts = companyAddress.split(",");

  const formattedAddress = `
${addressParts.slice(0, 3).join(",")}
<br>
${addressParts.slice(3, 4).join(",")}
<br>
${addressParts.slice(4).join(",")}
`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
 
  body {
    font-family: Arial, sans-serif;
    font-size: 10px;
    color: #111;
    padding: 14px 16px;
    line-height: 1.3;
  }
 
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1a4f7a;
    padding-bottom: 6px;
    margin-bottom: 6px;
  }
 
  .logo { height: 44px; width: auto; }
 
  .header-right { text-align: right; font-size: 9px; line-height: 1.6; }
  .header-right .inv-no { font-size: 11px; font-weight: bold; color: #1a4f7a; }
 
  .page-title {
    text-align: center;
    font-size: 13px;
    font-weight: bold;
    color: #1a4f7a;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 5px 0 7px;
  }
 
  .billing-block {
    display: flex;
    margin-bottom: 8px;
    background: #f7f9fc;
    border: 1px solid #d0dce8;
    border-radius: 2px;
    padding: 5px 8px;
  }
 
  .billing-label {
    font-size: 11px;
    font-weight: bold;
    color: #1a4f7a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
 
  .billing-row {
    display: flex;
    gap: 6px;
    font-size: 11px;
    line-height: 1.5;
  }
 
  .bk { font-weight: bold; min-width: 58px; color: #444; }
  .bv { color: #111;  white-space: normal; }
 
  .section-bar {
    background: #1a4f7a;
    color: #fff;
    font-size: 9.5px;
    font-weight: bold;
    padding: 4px 8px;
    letter-spacing: 0.5px;
  }
 
  .inv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
 
  .inv-table thead tr { background: #e8eff6; }
 
  .inv-table th {
    border: 1px solid #b0c4d8;
    padding: 4px 5px;
    text-align: left;
    font-weight: bold;
    color: #1a4f7a;
    white-space: nowrap;
    font-size: 8.5px;
  }
 
  .inv-table td {
    border: 1px solid #c8d8e8;
    padding: 3px 5px;
    vertical-align: middle;
  }
 
  .inv-table tbody tr:nth-child(even) { background: #f4f8fc; }
  .inv-table tbody tr:nth-child(odd)  { background: #ffffff; }
 
  .col-sl    { width: 24px;  text-align: center; }
  .col-date  { width: 64px;  text-align: center; }
  .col-ts    { width: 64px;  text-align: center; }
  .col-guest { width: auto;  text-align: left;   }
  .col-amt   { width: 72px;  text-align: right;  }
  .col-batta { width: 62px;  text-align: right;  }
  .col-cgst  { width: 56px;  text-align: right;  }
  .col-sgst  { width: 56px;  text-align: right;  }
  .col-toll  { width: 80px;  text-align: right;  }
  .col-net   { width: 72px;  text-align: right;  }
 
  .totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
 
  .totals-table {
    border-collapse: collapse;
    font-size: 9.5px;
    width: 240px;
  }

  .totals-table .row-discount td { color: #e53e3e; }

.totals-table .row-advance td  { color: #718096; }

.totals-table .row-due td {
  font-weight: bold;
  background: #e8eff6;
  color: #1a4f7a;
  font-size: 10px;
  border-top: 1px solid #b0c4d8;
}
 
  .totals-table td {
    padding: 3px 8px;
    border-bottom: 1px solid #dde6ef;
  }
 
  .totals-table td:last-child {
    text-align: right;
    font-weight: bold;
    min-width: 72px;
  }
 
  .totals-table .row-gross td {
    font-weight: bold;
    background: #e8eff6;
    color: #1a4f7a;
    font-size: 10px;
    border-top: 1px solid #b0c4d8;
  }

 
  .totals-table .row-grand td {
    font-weight: bold;
    background: #1a4f7a;
    color: #fff;
    font-size: 11px;
    border-top: 2px solid #0d3357;
  }
 
  .totals-table .row-tax td { color: #555; }
 
  .footer {
    margin-top: 10px;
    padding-top: 7px;
    border-top: 1px solid #b0c4d8;
    display: flex;
    justify-content: space-between;
    font-size: 8.5px;
    line-height: 1.7;
    color: #444;
  }
 
  .footer b { color: #1a4f7a; }
 
  .footer-note {
    font-style: italic;
    color: #777;
    font-size: 8px;
    text-align: right;
  }

  .amount-words {
  margin-top: 3px;
  font-size: 10px;
  font-weight: bold;
  color: #000;
  text-align: left;
}
</style>
</head>
<body>
 
<!-- HEADER -->
<div class="page-header">
  <img src="${logoSrc}" class="logo" />
  <div class="header-right">
    <div class="inv-no">Invoice No: ${invoice.onCallInvoiceCode}</div>
    <div>Invoice Date: ${moment(invoice.createdAt).format('DD-MMM-YYYY')}</div>
   <div>Due Date: ${moment(invoice.createdAt).add(10, 'days').format('DD-MMM-YYYY')}</div>
  </div>
</div>
 
<!-- TITLE -->
<div class="page-title">Invoice</div>
 
<!-- BILLING -->
<div class="billing-block">
  <div style="flex:1;">
    <div class="billing-label">Billing To</div>
    <div class="billing-row">
      <span class="bk">Company</span>
      <span class="bv">${invoice?.company?.companyName || invoice.companyName || '-'}</span>
    </div>
    <div class="billing-row">
      <span class="bk">Address</span>
      <span class="bv">${formattedAddress}</span>
    </div>
    <div class="billing-row">
      <span class="bk">
        GST No
      </span>

      <span class="bv">
        ${invoice?.company?.gstNo || '-'}
      </span>
    </div>
  </div>
</div>
 
<!-- TABLE -->
<div class="section-bar">Invoice Output</div>
<table class="inv-table">
  <thead>
    <tr>
      <th class="col-sl">Sl.No</th>
      <th class="col-date">Date</th>
      <th class="col-ts">Trip Sheet No</th>
      <th class="col-guest">Guest Name</th>
      <th class="col-amt">Gross Amount</th>
      <th class="col-batta">Driver Batta</th>
      <th class="col-cgst">CGST (2.5%)</th>
      <th class="col-sgst">SGST (2.5%)</th>
      <th class="col-toll">Toll/Parking/Permit</th>
      <th class="col-net">Net Amount</th>
    </tr>
  </thead>
  <tbody>
    ${invoiceItems.map((item: any, i: number) => {
    const extraBreakup = safeParse(item.extraChargesBreakup);
    const fromBreakup = extraBreakup.reduce(
      (s: number, e: any) => s + Number(e.amount || 0), 0
    );
    const tollParking = fromBreakup > 0 ? fromBreakup : Number(item.extraCharges || 0);
    const itemTaxes = safeParse(item.taxes);
    const cgstEntry = itemTaxes.find((t: any) => t.taxName === 'CGST');
    const sgstEntry = itemTaxes.find((t: any) => t.taxName === 'SGST');
    const cgstAmount = Number(cgstEntry?.taxAmount || 0);
    const sgstAmount = Number(sgstEntry?.taxAmount || 0);

    const grossAmount =
      Number(item.amount || 0) -
      Number(item.driverBatta || 0);

    const netAmount =
      Number(grossAmount || 0) +
      Number(item.driverBatta || 0) +
      Number(cgstAmount || 0) +
      Number(sgstAmount || 0) +
      Number(tollParking || 0);
    return `
      <tr>
        <td class="col-sl">${i + 1}</td>
        <td class="col-date">${item.date ? moment(item.date).format('DD-MM-YYYY') : '-'}</td>
        <td class="col-ts">${item.tripSheetNo || '-'}</td>
        <td class="col-guest">${item.guestName || '-'}</td>
        <td class="col-amt">${Number(grossAmount || 0).toFixed(2)}</td>
        <td class="col-batta">${Number(item.driverBatta || 0) > 0 ? Number(item.driverBatta).toFixed(2) : ''}</td>
        <td class="col-cgst">${cgstAmount > 0 ? cgstAmount.toFixed(2) : ''}</td>
        <td class="col-sgst">${sgstAmount > 0 ? sgstAmount.toFixed(2) : ''}</td>
        <td class="col-toll">${tollParking > 0 ? tollParking.toFixed(2) : ''}</td>
        <td class="col-net">${Number(netAmount || 0).toFixed(2)}</td>
      </tr>`;
  }).join('')}
  </tbody>
</table>
<!-- TOTALS -->
<div class="totals-wrap">
  <table class="totals-table">

    <!-- SUB TOTAL -->
    <tr>
      <td>Sub Total</td>
      <td>${displaySubTotal.toFixed(2)}</td>
    </tr>

    <!-- DRIVER BATTA -->
    ${totalDriverBatta > 0 ? `
    <tr>
      <td>Driver Batta</td>
      <td>+ ${totalDriverBatta.toFixed(2)}</td>
    </tr>
    ` : ''}

    <!-- GROSS TOTAL -->
    <tr class="row-gross">
      <td>Gross Total</td>
      <td>${grossTotal.toFixed(2)}</td>
    </tr>

    <!-- GST -->
    ${parsedTotalTax
      .filter((t: any) => Number(t.taxAmount || 0) > 0)
      .map((t: any) => `
        <tr class="row-tax">
          <td>${t.taxName}${t.taxPercent ? ` (${t.taxPercent}%)` : ''}</td>
          <td>+ ${Math.round(Number(t.taxAmount || 0))}</td>
        </tr>
      `).join('')}

    <!-- TOLL / PARKING -->
    ${totalTollParking > 0 ? `
    <tr>
      <td>Toll / Parking</td>
      <td>+ ${totalTollParking.toFixed(2)}</td>
    </tr>
    ` : ''}

    <!-- DISCOUNT -->
    ${totalDiscount > 0 ? `
    <tr class="row-discount">
      <td>Discount</td>
      <td>- ${totalDiscount.toFixed(2)}</td>
    </tr>
    ` : ''}

    <!-- ADVANCE -->
    ${totalAdvance > 0 ? `
    <tr class="row-advance">
      <td>Advance Paid</td>
      <td>- ${totalAdvance.toFixed(2)}</td>
    </tr>
    ` : ''}

    <!-- GRAND TOTAL -->
    <tr class="row-grand">
      <td>Grand Total</td>
      <td>${Math.round(Number(grandTotal.toFixed(2)))}</td>
    </tr>

  </table>
</div>

<div class="amount-words">
  ${amountInWords}
</div>
 
<!-- FOOTER -->
<div class="footer">
  <div>
    <div><b>Grace Cabs Pvt. Ltd.</b></div>
    <div>7/621 Nesamani Nagar, Perumbakkam, Chennai - 600100</div>
    <div>Website: gracecabs.com</div>
  </div>
  <div>
    <div><b>GSTIN:</b> 33AAMCG2518C1Z0</div>
    <div><b>PAN No:</b> AAMCG2518C</div>
    <div><b>SAC:</b> 996609</div>
  </div>
  <div class="footer-note">
    <div>* System generated invoice</div>
    <div>* GST 5% - Without ITC</div>
  </div>
</div>
 
</body>
</html>`;
};
export const downloadOncallInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { onCallBillId } = req.body;

    if (!onCallBillId) {
      return res.status(400).json({ success: false, message: "onCallBillId is required" });
    }

    // ── Fetch invoice ──
    const invoice = await OnCallInvoice.findOne({
      where: { onCallBillId },

      include: [
        {
          model: Company,
          as: "company",
          required: false,
          attributes: [
            "companyId",
            "companyName",
            "companyAddress",
            "gstNo"
          ]
        }
      ]
    });
    console.log("invvvvvvv ", invoice?.company?.companyAddress)
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // ── Fetch all items ──
    const invoiceItems = await OnCallInvoiceItems.findAll({ where: { onCallBillId }, order: [['date', 'ASC']] });

    // ── Generate PDF ──
    const pdfData = await generateOncallInvoicePDF({
      invoice,
      invoiceItems,
    });

    return res.status(200).json({
      success: true,
      message: "PDF generated successfully",
      pdf: pdfData.downloadUrl,       // ✅ frontend இதை use பண்ணும்
      onCallBillId,
    });

  } catch (error: any) {
    console.error("downloadOncallInvoicePDF error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const convertIndianSystem = (n: number): string => {
    if (n === 0) return 'Zero';

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    let result = '';

    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = convertIndianSystem(integerPart) + ' Rupees';

  if (decimalPart > 0) {
    result += ' and ' + convertLessThanThousand(decimalPart) + ' Paise';
  }

  return result + ' Only';
};

// export const getAllOnCallInvoices = async (
//   req: Request,
//   res: Response
// ) => {
//   try {

//     const data = await OnCallInvoice.findAll({
//       include: [
//         {
//           model: OnCallInvoiceItems,
//           as: 'invoiceItems',
//         },
//       ],
//       order: [['createdAt', 'DESC']],
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'All invoices fetched successfully',
//       data,
//     });

//   } catch (error: any) {

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };

export const getAllOnCallInvoices = async (req: Request, res: Response) => {
  try {
    const data = await OnCallInvoice.findAll({
      include: [{ model: OnCallInvoiceItems, as: 'invoiceItems' }],
      order: [['createdAt', 'DESC']],
    });

    // ── Format createdAt as IST string before sending ──
    const formatted = data.map((inv: any) => {
      const plain = inv.toJSON();
      if (plain.createdAt) {
        const d = new Date(plain.createdAt);
        // Add IST offset (+5:30) manually
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(d.getTime() + istOffset);
        // Format: "2026-05-25T00:30:00" — no Z, so browser won't shift it
        plain.createdAt = istDate.toISOString().replace('Z', '');
      }
      return plain;
    });

    return res.status(200).json({
      success: true,
      message: 'All invoices fetched successfully',
      data: formatted,
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOnCallInvoiceById = async (
  req: Request,
  res: Response
) => {

  try {

    const { onCallBillId } = req.params;

    const invoice = await OnCallInvoice.findOne({
      where: {
        onCallBillId,
      },
      include: [
        {
          model: OnCallInvoiceItems,
          as: 'invoiceItems',
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice fetched successfully',
      data: invoice,
    });

  } catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
export const editOnCallInvoice = async (req: Request, res: Response) => {
  try {
    const { onCallBillId } = req.params;
    const { tripSheetNumbers, items, totalAmount } = req.body;

    // ── 1. Find existing invoice ──
    const invoice = await OnCallInvoice.findOne({ where: { onCallBillId } });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // ── 2. Merge + deduplicate trip sheet numbers ──
    let existingTripSheets: string[] = [];
    try {
      existingTripSheets = invoice.tripSheetNumbers ? JSON.parse(invoice.tripSheetNumbers) : [];
    } catch { existingTripSheets = []; }

    const uniqueTripSheets = [...new Set([...existingTripSheets, ...tripSheetNumbers])];

    // ── 3. Recalculate total ──
    // const newAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    // const finalAmount = (Number(invoice.totalAmount) || 0) + newAmount;



    // ── 4. Update invoice header ──
    // await invoice.update({
    //   tripSheetNumbers: JSON.stringify(uniqueTripSheets),
    //   totalAmount: finalAmount,
    // });

    // ── 5. Insert new invoice items ──
    // ── 4. Insert new invoice items FIRST ──
    for (const item of items) {
      await OnCallInvoiceItems.create({
        onCallBillId,
        tripSheetNo: item.tripSheetNo || item.tripSheetNumber,
        date: item.date || item.pickupDate,
        vehicleTypeId: item.vehicleTypeId,
        vehicleNo: item.vehicleNo || item.vehicleNumber,
        driverName: item.driverName,
        guestName: item.guestName,
        bookedBy: item.bookedBy,
        tripDetails: item.tripDetails,
        garageOpenKm: item.garageOpenKm || 0,
        garageCloseKm: item.garageCloseKm || 0,
        garageKms: item.garageKms || 0,   // frontend sends this key already
        guestOpenKm: item.guestOpenKm || 0,
        guestCloseKm: item.guestCloseKm || 0,
        guestKms: item.guestKms || 0,
        hideGuestDetails: item.hideGuestDetails ?? true,
        startingTime: item.startingTime,
        closingTime: item.closingTime,
        usageHours: item.usageHours || 0,
        packageType: item.packageType,
        travelPackage: item.travelPackage,
        packageDays: item.packageDays || 1,
        driverDays: item.driverDays || 1,
        selectedPackageMeta: item.selectedPackageMeta || '{}',   // already stringified by frontend
        packageAmount: item.packageAmount || 0,
        additionalKms: item.additionalKms || 0,
        additionalKmsAmount: item.additionalKmsAmount || 0,
        additionalHours: item.additionalHours || 0,
        additionalHoursAmount: item.additionalHoursAmount || 0,
        driverBatta: item.driverBatta || 0,
        extraChargesBreakup: item.extraChargesBreakup || '[]',   // already stringified
        extraCharges: item.extraCharges || 0,
        discountAmount: item.discountAmount || 0,
        advanceAmount: item.advanceAmount || 0,

        // ✅ FIX: use dynamic taxes array directly from frontend — no cgstApplicable garbage
        taxes: item.taxes || '[]',
        totalTaxAmount: item.totalTaxAmount || 0,

        // ✅ FIX: frontend key is "amount", not "totalAmount"
        amount: item.amount || 0,
        total: item.total || 0,
        totalDue: item.totalDue || 0,
      });
    }

    // ── 5. ✅ NEW — fetch ALL items (old + new) and recalculate totals/taxes fresh ──
    const allSavedItems = await OnCallInvoiceItems.findAll({ where: { onCallBillId } });

    const invoiceSubTotal = allSavedItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    let taxRates: Array<{ taxName: string; taxPercent: number }> = [];
    if (allSavedItems.length > 0 && allSavedItems[0].taxes) {
      try {
        const parsed = typeof allSavedItems[0].taxes === "string" ? JSON.parse(allSavedItems[0].taxes) : allSavedItems[0].taxes;
        if (Array.isArray(parsed)) {
          taxRates = parsed.map((t: any) => ({
            taxName: t.taxName || "Tax",
            taxPercent: Number(t.taxPercent || 0),
          }));
        }
      } catch (e) {
        console.error("Error parsing taxes in editOnCallInvoice:", e);
      }
    }

    if (taxRates.length === 0) {
      taxRates = [
        { taxName: "CGST", taxPercent: 2.5 },
        { taxName: "SGST", taxPercent: 2.5 }
      ];
    }

    const taxBreakup = taxRates.map((r) => {
      const taxAmount = (invoiceSubTotal * r.taxPercent) / 100;
      return {
        taxName: r.taxName,
        taxPercent: r.taxPercent,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
      };
    });
    const totalTaxAmount = taxBreakup.reduce((sum, t) => sum + t.taxAmount, 0);

    const totalExtraCharges = allSavedItems.reduce((sum, item) => sum + Number(item.extraCharges || 0), 0);
    const totalDiscount = allSavedItems.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
    const grandTotalVal = parseFloat((invoiceSubTotal + totalTaxAmount + totalExtraCharges - totalDiscount).toFixed(2));

    const totalAdvance = allSavedItems.reduce((sum, item) => sum + Number(item.advanceAmount || 0), 0);
    const grandDue = grandTotalVal - totalAdvance;
    const roundedGrandDue = Math.round(grandDue);

    // ── 6. Update invoice header — trip sheets + total + fresh tax ──
    await invoice.update({
      tripSheetNumbers: JSON.stringify(uniqueTripSheets),
      totalAmount: roundedGrandDue,
      totalTaxAmount: JSON.stringify(taxBreakup),
      invoiceSubTotal: parseFloat(invoiceSubTotal.toFixed(2)),
      invoiceTaxBreakup: JSON.stringify(taxBreakup),
    });

    if (invoice.onCallInvoiceCode) {
      await Invoice.update(
        { invoiceAmount: roundedGrandDue },
        { where: { invoiceNumber: invoice.onCallInvoiceCode } }
      );
    }
    // ── 6. ✅ PDF generate — updated invoice + ALL items fetch ──
    try {
      const updatedInvoice = await OnCallInvoice.findOne({ where: { onCallBillId } });

      const allItems = await OnCallInvoiceItems.findAll({ where: { onCallBillId } });

      const { downloadUrl } = await generateOncallInvoicePDF({
        invoice: updatedInvoice,
        invoiceItems: allSavedItems,
      });

      return res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
        pdf: downloadUrl,        // ✅ frontend இதை பிடிச்சு download பண்ணும்
        onCallBillId,
      });

    } catch (pdfError: any) {
      // PDF fail ஆனாலும் success return பண்ணு (data save ஆச்சு)
      console.error("PDF generation failed:", pdfError);
      return res.status(200).json({
        success: true,
        message: "Invoice updated successfully (PDF generation failed)",
        pdf: null,
        onCallBillId,
      });
    }

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const removeOnCallInvoiceItem = async (req: Request, res: Response) => {
  try {
    const { onCallInvoiceItemId } = req.params;

    // ── 1. Find the item ──
    const item = await OnCallInvoiceItems.findOne({
      where: { onCallInvoiceItemId },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Invoice item not found' });
    }

    const { onCallBillId, tripSheetNo } = item;

    // ── 2. Hard delete the item ──
    await item.destroy();

    // ── 3. Fetch remaining items ──
    const remainingItems = await OnCallInvoiceItems.findAll({
      where: { onCallBillId },
    });

    // ── 4. Recalculate totals from remaining items ──
    const invoiceSubTotal = remainingItems.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0
    );

    let taxRates: Array<{ taxName: string; taxPercent: number }> = [];
    if (remainingItems.length > 0 && remainingItems[0].taxes) {
      try {
        const parsed = typeof remainingItems[0].taxes === "string" ? JSON.parse(remainingItems[0].taxes) : remainingItems[0].taxes;
        if (Array.isArray(parsed)) {
          taxRates = parsed.map((t: any) => ({
            taxName: t.taxName || "Tax",
            taxPercent: Number(t.taxPercent || 0),
          }));
        }
      } catch (e) {
        console.error("Error parsing taxes in removeOnCallInvoiceItem:", e);
      }
    }

    if (taxRates.length === 0) {
      taxRates = [
        { taxName: "CGST", taxPercent: 2.5 },
        { taxName: "SGST", taxPercent: 2.5 }
      ];
    }

    const taxBreakup = taxRates.map((r) => {
      const taxAmount = (invoiceSubTotal * r.taxPercent) / 100;
      return {
        taxName: r.taxName,
        taxPercent: r.taxPercent,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
      };
    });
    const totalTaxAmount = taxBreakup.reduce((sum, t) => sum + t.taxAmount, 0);

    const totalExtraCharges = remainingItems.reduce((sum, item) => sum + Number(item.extraCharges || 0), 0);
    const totalDiscount = remainingItems.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
    const grandTotalVal = parseFloat((invoiceSubTotal + totalTaxAmount + totalExtraCharges - totalDiscount).toFixed(2));

    // ── 5. Update tripSheetNumbers in header ──
    const invoice = await OnCallInvoice.findOne({
      where: { onCallBillId },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let tripSheets: string[] = [];
    try {
      tripSheets = invoice.tripSheetNumbers
        ? JSON.parse(invoice.tripSheetNumbers)
        : [];
    } catch {
      tripSheets = [];
    }

    // Remove deleted tripSheetNo from array
    const updatedTripSheets = tripSheets.filter(
      (t) => t !== tripSheetNo
    );

    const totalAdvance = remainingItems.reduce((sum, item) => sum + Number(item.advanceAmount || 0), 0);
    const grandDue = grandTotalVal - totalAdvance;
    const roundedGrandDue = Math.round(grandDue);

    // ── 6. Update invoice header ──
    await invoice.update({
      tripSheetNumbers: JSON.stringify(updatedTripSheets),
      totalAmount: roundedGrandDue,
      totalTaxAmount: JSON.stringify(taxBreakup),
      invoiceSubTotal: parseFloat(invoiceSubTotal.toFixed(2)),
      invoiceTaxBreakup: JSON.stringify(taxBreakup),
    });

    if (invoice.onCallInvoiceCode) {
      await Invoice.update(
        { invoiceAmount: roundedGrandDue },
        { where: { invoiceNumber: invoice.onCallInvoiceCode } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Trip sheet removed successfully',
      data: {
        onCallBillId,
        removedTripSheetNo: tripSheetNo,
        remainingItemsCount: remainingItems.length,
        newTotalAmount: roundedGrandDue,
      },
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// export const editOnCallInvoice = async (req: Request, res: Response) => {
//   try {
//     const { onCallBillId } = req.params;

//     const { tripSheetNumbers, items, totalAmount } = req.body;

//     // ── 1. Find existing invoice ──
//     const invoice = await OnCallInvoice.findOne({ where: { onCallBillId } });

//     if (!invoice) {
//       return res.status(404).json({ success: false, message: "Invoice not found" });
//     }

//     // ── 2. Merge + deduplicate trip sheet numbers ──
//     let existingTripSheets: string[] = [];
//     try {
//       existingTripSheets = invoice.tripSheetNumbers
//         ? JSON.parse(invoice.tripSheetNumbers)
//         : [];
//     } catch {
//       existingTripSheets = [];
//     }

//     const updatedTripSheets = [...existingTripSheets, ...tripSheetNumbers];
//     const uniqueTripSheets = [...new Set(updatedTripSheets)];

//     // ── 3. Recalculate totals: existing stored total + new items total ──
//     const newItemsTotal = items.reduce((s: number, t: any) => s + (t.total || 0), 0);
//     const newItemsCgst  = items.reduce((s: number, t: any) => s + (t.cgstAmount || 0), 0);
//     const newItemsSgst  = items.reduce((s: number, t: any) => s + (t.sgstAmount || 0), 0);

//     const updatedTotal = (Number(invoice.totalAmount) || 0) + newItemsTotal;
//     // const updatedCgst  = (Number(invoice.cgst)        || 0) + newItemsCgst;
//     // const updatedSgst  = (Number(invoice.sgst)        || 0) + newItemsSgst;

//     // ── 4. Update invoice header ──
//    // Calculate new added amount
// const newAmount = items.reduce(
//   (sum: number, item: any) => sum + Number(item.amount),
//   0
// );

// // Existing amount
// const existingAmount = Number(invoice.totalAmount || 0);

// // Final total
// const finalAmount = existingAmount + newAmount;

// // Update invoice
// await invoice.update({  
//   tripSheetNumbers: JSON.stringify(uniqueTripSheets),
//   totalAmount: finalAmount,
// });

//     // ── 5. Insert new invoice items with ALL fields (same as create) ──
//     for (const item of items) {
//       await OnCallInvoiceItems.create({
//         onCallBillId,

//         // identifiers
//         tripSheetNo:         item.tripSheetNumber,
//         date:                item.pickupDate,

//         // vehicle & people
//         vehicleTypeId:       item.vehicleTypeId,
//         vehicleNo:           item.vehicleNo || item.vehicleNumber,
//         driverName:          item.driverName,
//         guestName:           item.guestName,
//         bookedBy:            item.bookedBy,
//         tripDetails:         item.tripDetails,

//         // km
//         garageOpenKm:        item.garageOpenKm  || 0,
//         garageCloseKm:       item.garageCloseKm || 0,
//         garageKms:           item.garageKms     || 0,
//         guestOpenKm:         item.guestOpenKm   || 0,
//         guestCloseKm:        item.guestCloseKm  || 0,
//         guestKms:            item.guestKms      || 0,
//         hideGuestDetails:    item.hideGuestDetails ?? true,

//         // time
//         startingTime:        item.startingTime,
//         closingTime:         item.closingTime,
//         usageHours:          item.usageHours    || 0,

//         // package
//         packageType:         item.packageType,
//         travelPackage:       item.travelPackage,
//         packageDays:         item.packageDays   || 1,
//         driverDays:          item.driverDays    || 1,
//         selectedPackageMeta: JSON.stringify(item.selectedPackageMeta || {}),

//         // fare
//         packageAmount:         item.packageAmount       || 0,
//         additionalKms:         item.additionalKms        || 0,
//         additionalKmsAmount:   item.additionalKmsAmount  || 0,
//         additionalHours:       item.additionalHours      || 0,
//         additionalHoursAmount: item.additionalHoursAmount || 0,
//         driverBatta:           item.driverBatta          || 0,

//         // extra charges
//         extraChargesBreakup: JSON.stringify(item.extraChargesBreakup || []),
//         extraCharges:        item.extraCharges    || 0,

//         // deductions
//         discountAmount:      item.discountAmount  || 0,
//         advanceAmount:       item.advanceAmount   || 0,

//         // tax
//         taxes: JSON.stringify(
//           [
//             item.cgstApplicable && {
//               taxName: "CGST",
//               taxPercent: item.cgstPercent || 0,
//               taxAmount: item.cgstAmount   || 0,
//             },
//             item.sgstApplicable && {
//               taxName: "SGST",
//               taxPercent: item.sgstPercent || 0,
//               taxAmount: item.sgstAmount   || 0,
//             },
//             item.igstApplicable && {
//               taxName: "IGST",
//               taxPercent: item.igstPercent || 0,
//               taxAmount: item.igstAmount   || 0,
//             },
//           ].filter(Boolean)
//         ),
//         totalTaxAmount: item.totalTaxAmount  || 0,

//         cgstApplicable: item.cgstApplicable  || false,
//         sgstApplicable: item.sgstApplicable  || false,
//         igstApplicable: item.igstApplicable  || false,
//         cgstAmount:     item.cgstAmount      || 0,
//         sgstAmount:     item.sgstAmount      || 0,
//         igstAmount:     item.igstAmount      || 0,

//         // totals
//         amount:    item.totalAmount || 0,   // base / sub-total
//         total:     item.total       || 0,   // final total
//         totalDue:  item.totalDue    || 0,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Invoice updated successfully",
//     });
//   } catch (error: any) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
export const updateOnCallInvoice = async (
  req: Request,
  res: Response
) => {

  const transaction = await sequelize.transaction();

  try {

    const { onCallBillId } = req.params;

    const {
      createdAt,
      companyId,
      companyName,
      tripSheetNumbers,
      totalAmount,
      invoiceItems,
    } = req.body;

    // ─────────────────────────────────────────
    // FIND INVOICE
    // ─────────────────────────────────────────

    const invoice = await OnCallInvoice.findOne({
      where: {
        onCallBillId,
        isDeleted: false,
      },
      transaction,
    });

    if (!invoice) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ─────────────────────────────────────────
    // UPDATE INVOICE TABLE
    // ─────────────────────────────────────────

    await invoice.update(
      {
        companyId,
        companyName,
        createdAt,
      },
      { transaction }
    );


    // ─── UPDATE createdAt SEPARATELY using raw query ───
    if (createdAt) {
      // Parse the date string and extract date parts directly
      const dateStr = createdAt.includes("T")
        ? createdAt.split("T")[0]
        : createdAt.split(" ")[0];

      const mysqlDate = `${dateStr} 00:00:00`;

      await sequelize.query(
        `UPDATE oncallinvoice SET \`createdAt\` = :createdAt WHERE \`onCallBillId\` = :onCallBillId`,
        {
          replacements: {
            createdAt: mysqlDate,
            onCallBillId,
          },
          transaction,
        }
      );
    }
    // ─────────────────────────────────────────
    // UPDATE ITEMS
    // ─────────────────────────────────────────

    if (invoiceItems && Array.isArray(invoiceItems)) {

      for (const item of invoiceItems) {

        // EXISTING ITEM UPDATE
        if (item.onCallInvoiceItemId) {

          const existingItem = await OnCallInvoiceItems.findOne({
            where: {
              onCallInvoiceItemId: item.onCallInvoiceItemId,
              onCallBillId,
            },
            transaction,
          });

          if (existingItem) {

            await existingItem.update(
              {
                tripSheetNo: item.tripSheetNo,
                date: item.date,
                vehicleTypeId: item.vehicleTypeId,
                vehicleNo: item.vehicleNo,
                driverName: item.driverName,
                guestName: item.guestName,
                bookedBy: item.bookedBy,
                tripDetails: item.tripDetails,

                garageOpenKm: item.garageOpenKm,
                garageCloseKm: item.garageCloseKm,
                garageKms: item.garageKms,

                guestOpenKm: item.guestOpenKm,
                guestCloseKm: item.guestCloseKm,
                guestKms: item.guestKms,

                hideGuestDetails: item.hideGuestDetails,

                startingTime: item.startingTime,
                closingTime: item.closingTime,
                usageHours: item.usageHours,

                packageType: item.packageType,
                travelPackage: item.travelPackage,
                packageDays: item.packageDays,
                driverDays: item.driverDays,

                selectedPackageMeta:
                  typeof item.selectedPackageMeta === "string"
                    ? item.selectedPackageMeta
                    : JSON.stringify(item.selectedPackageMeta),

                extraChargesBreakup:
                  typeof item.extraChargesBreakup === "string"
                    ? item.extraChargesBreakup
                    : JSON.stringify(item.extraChargesBreakup),

                taxes:
                  typeof item.taxes === "string"
                    ? item.taxes
                    : JSON.stringify(item.taxes),
                packageAmount: item.packageAmount,

                additionalKms: item.additionalKms,
                additionalKmsAmount: item.additionalKmsAmount,

                additionalHours: item.additionalHours,
                additionalHoursAmount: item.additionalHoursAmount,

                driverBatta: item.driverBatta,

                extraCharges: item.extraCharges,

                discountAmount: item.discountAmount,
                advanceAmount: item.advanceAmount,

                totalTaxAmount: parseFloat(Number(item.totalTaxAmount || 0).toFixed(2)),

                amount: item.amount,
                total: item.total,
                totalDue: item.totalDue,
              },
              { transaction }
            );

          }

        } else {

          // ─────────────────────────────────────
          // NEW ITEM CREATE
          // ─────────────────────────────────────

          await OnCallInvoiceItems.create(
            {
              ...item,
              onCallBillId,
            },
            { transaction }
          );
        }
      }
    }

    // ✅ NEW: rebuild tripSheetNumbers from actual saved items (reflects renamed sheets)
    // ✅ NEW: rebuild tripSheetNumbers from actual saved items (reflects renamed sheets)
    const allItems = await OnCallInvoiceItems.findAll({
      where: { onCallBillId },
      transaction,
    });
    const freshTripSheetNumbers = allItems.map((i: any) => i.tripSheetNo);

    const invoiceSubTotal = allItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    let taxRates: Array<{ taxName: string; taxPercent: number }> = [];
    if (allItems.length > 0 && allItems[0].taxes) {
      try {
        const parsed = typeof allItems[0].taxes === "string" ? JSON.parse(allItems[0].taxes) : allItems[0].taxes;
        if (Array.isArray(parsed)) {
          taxRates = parsed.map((t: any) => ({
            taxName: t.taxName || "Tax",
            taxPercent: Number(t.taxPercent || 0),
          }));
        }
      } catch (e) {
        console.error("Error parsing taxes in updateOnCallInvoice:", e);
      }
    }

    if (taxRates.length === 0) {
      taxRates = [
        { taxName: "CGST", taxPercent: 2.5 },
        { taxName: "SGST", taxPercent: 2.5 }
      ];
    }

    const taxBreakup = taxRates.map((r) => {
      const taxAmount = (invoiceSubTotal * r.taxPercent) / 100;
      return {
        taxName: r.taxName,
        taxPercent: r.taxPercent,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
      };
    });
    const totalTaxAmount = taxBreakup.reduce((sum, t) => sum + t.taxAmount, 0);

    const totalExtraCharges = allItems.reduce((sum, item) => sum + Number(item.extraCharges || 0), 0);
    const totalDiscount = allItems.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
    const grandTotalVal = parseFloat((invoiceSubTotal + totalTaxAmount + totalExtraCharges - totalDiscount).toFixed(2));

    const totalAdvance = allItems.reduce((sum, item) => sum + Number(item.advanceAmount || 0), 0);
    const grandDue = grandTotalVal - totalAdvance;
    const roundedGrandDue = Math.round(grandDue);

    await invoice.update(
      {
        tripSheetNumbers: JSON.stringify(freshTripSheetNumbers),
        totalTaxAmount: JSON.stringify(taxBreakup),
        totalAmount: roundedGrandDue,
        invoiceSubTotal: parseFloat(invoiceSubTotal.toFixed(2)),
        invoiceTaxBreakup: JSON.stringify(taxBreakup),
      },
      { transaction }
    );

    if (invoice.onCallInvoiceCode) {
      await Invoice.update(
        { invoiceAmount: roundedGrandDue },
        { where: { invoiceNumber: invoice.onCallInvoiceCode }, transaction }
      );
    }

    await transaction.commit();


    return res.status(200).json({
      success: true,
      message: "OnCall Invoice Updated Successfully",
    });

  } catch (error: any) {

    await transaction.rollback();

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
// export const updateOnCallInvoice = async (
//   req: Request,
//   res: Response
// ) => {

// const sequelize = OnCallInvoice.sequelize!;

// const transaction = await sequelize.transaction();
//   try {

//     const { onCallBillId } = req.params;

//     const {
//       createdAt,
//       companyId,
//       companyName,
//       tripSheetNumbers,
//       totalAmount,
//       invoiceItems,
//     } = req.body;

//     // ─────────────────────────────────────────
//     // FIND INVOICE
//     // ─────────────────────────────────────────

//     const invoice = await OnCallInvoice.findOne({
//       where: {
//         onCallBillId,
//         isDeleted: false,
//       },
//       transaction,
//     });

//     if (!invoice) {
//       await transaction.rollback();

//       return res.status(404).json({
//         success: false,
//         message: "Invoice not found",
//       });
//     }

//     // ─────────────────────────────────────────
//     // UPDATE INVOICE TABLE
//     // ─────────────────────────────────────────

//   // ─── UPDATE INVOICE TABLE ───
// await invoice.update(
//   {
//     companyId,
//     companyName,
//     tripSheetNumbers,
//     totalAmount,
//   },
//   { transaction }
// );

// // ─── UPDATE createdAt SEPARATELY using raw query ───
// // ─── UPDATE createdAt SEPARATELY using raw query ───
// if (createdAt) {
//   await sequelize.query(
//     `UPDATE onCallInvoice SET createdAt = :createdAt WHERE onCallBillId = :onCallBillId`,
//     {
//       replacements: {
//         createdAt: new Date(createdAt),
//         onCallBillId,
//       },
//       transaction,
//     }
//   );
// }

//     // ─────────────────────────────────────────
//     // UPDATE ITEMS
//     // ─────────────────────────────────────────

//     if (invoiceItems && Array.isArray(invoiceItems)) {

//       for (const item of invoiceItems) {

//         // EXISTING ITEM UPDATE
//         if (item.onCallInvoiceItemId) {

//           const existingItem = await OnCallInvoiceItems.findOne({
//             where: {
//               onCallInvoiceItemId: item.onCallInvoiceItemId,
//               onCallBillId,
//             },
//             transaction,
//           });

//           if (existingItem) {

//             await existingItem.update(
//               {
//                 tripSheetNo: item.tripSheetNo,
//                 date: item.date,
//                 vehicleTypeId: item.vehicleTypeId,
//                 vehicleNo: item.vehicleNo,
//                 driverName: item.driverName,
//                 guestName: item.guestName,
//                 bookedBy: item.bookedBy,
//                 tripDetails: item.tripDetails,

//                 garageOpenKm: item.garageOpenKm,
//                 garageCloseKm: item.garageCloseKm,
//                 garageKms: item.garageKms,

//                 guestOpenKm: item.guestOpenKm,
//                 guestCloseKm: item.guestCloseKm,
//                 guestKms: item.guestKms,

//                 hideGuestDetails: item.hideGuestDetails,

//                 startingTime: item.startingTime,
//                 closingTime: item.closingTime,
//                 usageHours: item.usageHours,

//                 packageType: item.packageType,
//                 travelPackage: item.travelPackage,
//                 packageDays: item.packageDays,
//                 driverDays: item.driverDays,

//                 selectedPackageMeta: item.selectedPackageMeta,

//                 packageAmount: item.packageAmount,

//                 additionalKms: item.additionalKms,
//                 additionalKmsAmount: item.additionalKmsAmount,

//                 additionalHours: item.additionalHours,
//                 additionalHoursAmount: item.additionalHoursAmount,

//                 driverBatta: item.driverBatta,

//                 extraChargesBreakup: item.extraChargesBreakup,
//                 extraCharges: item.extraCharges,

//                 discountAmount: item.discountAmount,
//                 advanceAmount: item.advanceAmount,

//                 taxes: item.taxes,
//                 totalTaxAmount: item.totalTaxAmount,

//                 amount: item.amount,
//                 total: item.total,
//                 totalDue: item.totalDue,
//               },
//               { transaction }
//             );

//           }

//         } else {

//           // ─────────────────────────────────────
//           // NEW ITEM CREATE
//           // ─────────────────────────────────────

//           await OnCallInvoiceItems.create(
//             {
//               ...item,
//               onCallBillId,
//             },
//             { transaction }
//           );
//         }
//       }
//     }

//     await transaction.commit();

//     return res.status(200).json({
//       success: true,
//       message: "OnCall Invoice Updated Successfully",
//     });

//   } catch (error: any) {

//     await transaction.rollback();

//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// ─────────────────────────────────────────────────────────────────────────────
// Change Invoice Number — OnCall Invoice
// Uses InvoiceSequence (not MAX of invoice table).
// ─────────────────────────────────────────────────────────────────────────────
export const changeOnCallInvoiceNumber = async (req: Request, res: Response) => {
  const seqInstance = OnCallInvoice.sequelize as Sequelize;

  try {
    const { onCallBillId } = req.body;

    if (!onCallBillId) {
      return res.status(400).json({
        success: false,
        message: "onCallBillId is required",
      });
    }

    // 1. Fetch OnCall invoice
    const onCallInvoice = await OnCallInvoice.findByPk(onCallBillId);
    if (!onCallInvoice) {
      return res.status(404).json({
        success: false,
        message: "OnCall invoice not found",
      });
    }

    const companyId = onCallInvoice.companyId;

    // 2. Fetch company to get companyCode
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyCode = (company as any).companyCode;
    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: "Company code not configured",
      });
    }

    let newInvoiceNumber = "";

    // 4. Inside transaction: generate next invoice number, save, update records
    await seqInstance.transaction(async (t) => {
      // Find linked invoice to exclude
      const linkedInv = await Invoice.findOne({
        where: { invoiceNumber: onCallInvoice.onCallInvoiceCode },
        transaction: t,
      });

      newInvoiceNumber = await Invoice.generateNextInvoiceNumber(
        companyId,
        companyCode,
        linkedInv ? linkedInv.invoiceId : null, // Exclude this oncall invoice's linked invoiceId
        t
      );

      // 5. Update OnCallInvoice.onCallInvoiceCode
      await onCallInvoice.update(
        { onCallInvoiceCode: newInvoiceNumber },
        { transaction: t }
      );

      // 6. Update linked Invoice.invoiceNumber
      if (linkedInv) {
        await linkedInv.update(
          { invoiceNumber: newInvoiceNumber },
          { transaction: t }
        );
      }
    });

    return res.status(200).json({
      success: true,
      message: "Invoice Number Updated Successfully",
      newInvoiceNumber,
    });
  } catch (error: any) {
    console.error("changeOnCallInvoiceNumber error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};