
import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { MonthlyInvoice } from '../models/monthlyInvoice';
import { MonthlyInvoiceItems } from '../models/monthlyInvoiceItems';
import { Company } from '../models/company';
import { VehicleType } from '../models/vehicleType';
import { USERS } from "../utils/costants";
import jwt from "jsonwebtoken";
import { Length } from 'sequelize-typescript';
import { Invoice, User } from '../models';
import { Op } from "sequelize";
import { normalizePackageDetails } from '../services/closependingorderServices';


const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const { ROLES } = USERS;
const logoPath = path.join(__dirname, "..", "images", "logo.png");
const logoBase64 = fs.readFileSync(logoPath, "base64");
const logoSrc = `data:image/jpeg;base64,${logoBase64}`;

// Interface for line items in invoice
interface InvoiceLineItem {
  label: string;
  value: string | number;
  isTotal?: boolean;
  isSubTotal?: boolean;
  isSubItem?: boolean;
  isBold?: boolean;
  isNegative?: boolean;
  isInfo?: boolean;
}

// Interface for tax item
interface TaxItem {
  taxId: string;
  amount: number;
  taxName: string;
  taxPercent: number;
}

// Interface for structured invoice data
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceMonth: string;
  gstNo: string;
  vehicleType: string;
  vehicleNumber: string;
  companyName: string;
  companyAddress: string;
  route: string;
  lineItems: InvoiceLineItem[];
  companyGstNo: string;
  taxDetails: TaxItem[];
  amountInWords: string;
}

// Helper function to safely convert to number
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
};
// Helper function to convert number to words
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

const formatInvoiceMonth = (invoiceMonth: string): string => {
  if (!invoiceMonth) return 'N/A';

  // Check if the format is YYYY-MM (e.g., "2025-12") or MM-YYYY (e.g., "12-2025")
  const parts = invoiceMonth.split('-');

  if (parts.length === 2) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    // Check if format is YYYY-MM (first part is year, second is month)
    if (first > 12 && second >= 1 && second <= 12) {
      return `${monthNames[second - 1]}-${first}`;
    }
    // Check if format is MM-YYYY (first part is month, second is year)
    else if (first >= 1 && first <= 12 && second > 12) {
      return `${monthNames[first - 1]}-${second}`;
    }
  }

  // If already in alphabetic format or invalid format, return as is
  return invoiceMonth;
};


// Generate HTML for MONTHLY INVOICE PDF
export const generateMonthlyInvoiceHTML = (data: any): string => {
  const { monthlyInvoice, items = [], company, invoiceCode, invoiceDate, invoiceMonth, amountInWords } = data;

  let logoSrc = "";
  try {
    const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    logoSrc = `data:image/png;base64,${logoBase64}`;
  } catch {
    logoSrc = "";
  }

  const companyAddress = company?.companyAddress || monthlyInvoice?.companyAddress || "-";
  const addressParts = String(companyAddress).split(",");
  const formattedAddress = addressParts.length > 2
    ? `${addressParts.slice(0, 3).join(",")}<br>${addressParts.slice(3).join(",")}`
    : companyAddress;

  // Build Invoice Details table rows
  const invoiceBlocks = items.map((item: any, index: number) => {

    const pkgDetails = normalizePackageDetails(item.packageDetails, item);

    const taxes =
      typeof item.taxes === "string"
        ? JSON.parse(item.taxes || "[]")
        : (item.taxes || []);

    const cgst =
      taxes.find((t: any) => t.taxName?.toUpperCase().includes("CGST"))?.amount || 0;

    const sgst =
      taxes.find((t: any) => t.taxName?.toUpperCase().includes("SGST"))?.amount || 0;


       const itemExtraCharges =
  typeof item.extraCharges === "string"
    ? JSON.parse(item.extraCharges || "[]")
    : (item.extraCharges || []);

const routeExtraChargeTotal = itemExtraCharges.reduce(
  (sum: number, charge: any) => sum + Number(charge.amount || 0),
  0
);

 const itemSubTotal =
  Number(item.packageAmount || pkgDetails.amount || 0) +
  Number(item.extraKmAmount || 0) +
  Number(item.extraHrsAmount || 0) +
  Number(item.extraDaysAmount || 0);



const extraChargesHtml = itemExtraCharges
  .filter((c: any) => Number(c.amount) > 0)
  .map(
    (c: any) => `
<tr style="height:26px;">
    <td style="padding-left:20px;">
        ${String(c.type)
          .charAt(0)
          .toUpperCase() + String(c.type).slice(1)}
    </td>
    <td align="right">
        ₹${Number(c.amount).toFixed(2)}
    </td>
</tr>
`
  )
  .join("");
    const dayRate = Math.round(Number(pkgDetails.extraDayRate || 0));
    return `
    <div style="margin-bottom:20px;
border-bottom:1px solid #ccc;padding-bottom:12px;">

        <table style="width:100%;margin-top:8px;border-collapse:collapse;">
            <tr style="height:28px;">
                <td>
<div class="invoice-title">
${index + 1}. Towards  the month of ${invoiceMonth}
Vehicle No-${item.vehicleNumber}
${item.vehicleTypeName}
${item.route}
Cab Charges.
(${pkgDetails.days} days /
${pkgDetails.km} kms -
₹${Number(item.packageAmount).toLocaleString("en-IN")})
Coverage.
</div></td>
                <td align="right">₹${Number(item.packageAmount || pkgDetails.amount || 0).toFixed(2)}</td>
            </tr>

${
  Number(item.extraKmAmount || 0) > 0
    ? `
<tr style="height:28px;">
    <td>Extra KM (${item.extraKm} KM × ₹${pkgDetails.extraKmRate})</td>
    <td align="right">₹${Number(item.extraKmAmount).toFixed(2)}</td>
</tr>
`
    : ""
}

${
  Number(item.extraHrsAmount || 0) > 0
    ? `
<tr style="height:28px;">
    <td>Extra Hours (${item.extraHrs} Hrs × ₹${pkgDetails.extraHourRate})</td>
    <td align="right">₹${Number(item.extraHrsAmount).toFixed(2)}</td>
</tr>
`
    : ""
}

${
  Number(item.extraDaysAmount || 0) > 0
    ? `
<tr style="height:28px;">
    <td>Extra Days (${item.extraDays} Days × ₹${dayRate})</td>
    <td align="right">₹${Math.round(Number(item.extraDaysAmount))}</td>
</tr>
`
    : ""
}



<tr style="
border-top:3px solid #444;
font-size:14px;
font-weight:bold;
color:#2ca24f;
height:42px;">
    <td>Sub Total</td>
    <td align="right">₹${itemSubTotal.toFixed(2)}</td>
</tr>

${
extraChargesHtml
? `
<tr>
    <td colspan="2"
        style="
        padding-top:10px;
        font-weight:bold;
        color:#1a4f7a;
        text-transform:uppercase;">
        Extra Charges
    </td>
</tr>

${extraChargesHtml}

<tr style="
border-top:2px dashed #999;
font-size:14px;
font-weight:bold;
height:38px;">
    <td>Total</td>
    <td align="right">
        ₹${(itemSubTotal + routeExtraChargeTotal).toFixed(2)}
    </td>
</tr>
`
: `
<tr style="
border-top:2px dashed #999;
font-size:14px;
font-weight:bold;
height:38px;">
    <td>Total</td>
    <td align="right">
        ₹${itemSubTotal.toFixed(2)}
    </td>
</tr>
`
}
        </table>

    </div>
    `;
  }).join("");

  // Consolidated Tax Calculations for Final Summary
  const allTaxesMap: Record<string, { taxName: string; percent: number; amount: number }> = {};
  items.forEach((item: any) => {
    const itemTaxes: any[] = typeof item.taxes === "string" ? JSON.parse(item.taxes || "[]") : (item.taxes || []);
    itemTaxes.forEach((t: any) => {
      const name = t.taxName || "Tax";
      const key = t.taxId || name;
      if (!allTaxesMap[key]) {
        allTaxesMap[key] = { taxName: name, percent: Number(t.taxPercent || 0), amount: 0 };
      }
      allTaxesMap[key].amount += Number(t.amount || 0);
    });
  });

  if (Object.keys(allTaxesMap).length === 0 && monthlyInvoice?.taxes) {
    const mTaxes: any[] = typeof monthlyInvoice.taxes === "string" ? JSON.parse(monthlyInvoice.taxes || "[]") : (monthlyInvoice.taxes || []);
    if (Array.isArray(mTaxes)) {
      mTaxes.forEach((t: any) => {
        const name = t.taxName || "Tax";
        const key = t.taxId || name;
        allTaxesMap[key] = { taxName: name, percent: Number(t.taxPercent || 0), amount: Number(t.amount || 0) };
      });
    }
  }

  const taxRows = Object.values(allTaxesMap).map((t) => `
    <tr style="height:28px;">
      <td style="color: #444;">${t.taxName} (${t.percent}%)</td>
      <td style="text-align: right; font-weight: bold;">+ ₹ ${t.amount.toFixed(2)}</td>
    </tr>
  `).join("");

  const subTotal = items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.netTotal || 0),
    0
  );
  const totalExtra = items.reduce((s: number, i: any) => s + Number(i.extraChargesInputAmount || 0), 0);
  const totalDiscount = items.reduce((s: number, i: any) => s + Number(i.discount || 0), 0);
  const totalAdvance = items.reduce((s: number, i: any) => s + Number(i.advance || 0), 0);
  const grandTotal = Number(monthlyInvoice?.finalTotal || (subTotal + totalExtra - totalDiscount));
  const balanceDue = Number(monthlyInvoice?.balanceDue || (grandTotal - totalAdvance));

  const groupedExtraCharges: Record<string, number> = {
    toll: 0,
    parking: 0,
    permit: 0,
    other: 0,
  };

  items.forEach((item: any) => {
    const itemExtra = item.extraCharges;
    if (itemExtra) {
      try {
        const chargeData = typeof itemExtra === "string" ? JSON.parse(itemExtra) : itemExtra;
        if (Array.isArray(chargeData)) {
          chargeData.forEach((charge: any) => {
            const type = String(charge.type || "").toLowerCase().trim();
            const amount = Number(charge.amount || 0);
            if (type === "toll") {
              groupedExtraCharges.toll += amount;
            } else if (type === "parking") {
              groupedExtraCharges.parking += amount;
            } else if (type === "permit") {
              groupedExtraCharges.permit += amount;
            } else {
              groupedExtraCharges.other += amount;
            }
          });
        }
      } catch (error) {
        console.error("Error parsing extraCharges for item:", error);
      }
    }
  });

  const calculatedTotalExtra = groupedExtraCharges.toll + groupedExtraCharges.parking + groupedExtraCharges.permit + groupedExtraCharges.other;

  let extraChargesHtml = "";
  if (calculatedTotalExtra > 0) {
    extraChargesHtml += `
    <tr style="border-top:1px solid #d0dce8; font-weight: bold; background-color: #f7f9fc;">
      <td colspan="2" style="color: #1a4f7a; font-size: 10px; padding: 4px 8px; text-transform: uppercase; letter-spacing: 0.5px;">Extra Charges</td>
    </tr>
    `;
    if (groupedExtraCharges.toll > 0) {
      extraChargesHtml += `
      <tr style="height:24px;">
        <td style="color: #555; padding-left: 16px; font-size: 10px;">Toll</td>
        <td style="text-align: right; font-size: 10px;">₹ ${groupedExtraCharges.toll.toFixed(2)}</td>
      </tr>
      `;
    }
    if (groupedExtraCharges.parking > 0) {
      extraChargesHtml += `
      <tr style="height:24px;">
        <td style="color: #555; padding-left: 16px; font-size: 10px;">Parking</td>
        <td style="text-align: right; font-size: 10px;">₹ ${groupedExtraCharges.parking.toFixed(2)}</td>
      </tr>
      `;
    }
    if (groupedExtraCharges.permit > 0) {
      extraChargesHtml += `
      <tr style="height:24px;">
        <td style="color: #555; padding-left: 16px; font-size: 10px;">Permit</td>
        <td style="text-align: right; font-size: 10px;">₹ ${groupedExtraCharges.permit.toFixed(2)}</td>
      </tr>
      `;
    }
    if (groupedExtraCharges.other > 0) {
      extraChargesHtml += `
      <tr style="height:24px;">
        <td style="color: #555; padding-left: 16px; font-size: 10px;">Others</td>
        <td style="text-align: right; font-size: 10px;">₹ ${groupedExtraCharges.other.toFixed(2)}</td>
      </tr>
      `;
    }
    extraChargesHtml += `
    <tr style="height:26px; border-top: 1px dashed #cbd5e1; font-weight: bold;">
      <td style="color: #444; padding-left: 8px; font-size: 10px;">Total Extra Charges</td>
      <td style="text-align: right; font-size: 10px;">+ ₹ ${calculatedTotalExtra.toFixed(2)}</td>
    </tr>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 14px 16px; line-height: 1.3; }
  .page-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a4f7a; padding-bottom: 6px; margin-bottom: 8px; }
  .logo { height: 44px; width: auto; }
  .header-right { text-align: right; font-size: 9.5px; line-height: 1.6; }
  .header-right .inv-no { font-size: 12px; font-weight: bold; color: #1a4f7a; }
  .page-title { text-align: center; font-size: 13px; font-weight: bold; color: #1a4f7a; letter-spacing: 2px; text-transform: uppercase; margin: 6px 0 8px; }
  .billing-container { display: flex; gap: 12px; margin-bottom: 12px; }
  .billing-box { flex: 1; background: #f7f9fc; border: 1px solid #d0dce8; border-radius: 4px; padding: 6px 10px; }
  .billing-label { font-size: 11px; font-weight: bold; color: #1a4f7a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; border-bottom: 1px solid #dde6f0; padding-bottom: 2px; }
  .billing-row { display: flex; gap: 8px; font-size: 10.5px; line-height: 1.5; }
  .bk { font-weight: bold; min-width: 65px; color: #444; }
  .bv { color: #111; white-space: normal; }

  .section-heading { font-size: 11px; font-weight: bold; color: #1a4f7a; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #1a4f7a; padding-bottom: 3px; }

  .details-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5px; }
  .details-table th { background: #1a4f7a; color: #ffffff; padding: 6px 8px; font-weight: bold; text-align: left; border: 1px solid #1a4f7a; }
  .details-table td { border: 1px solid #d0dce8; }

  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 8px; margin-bottom: 12px; page-break-inside: avoid; }
  .summary-table { width: 260px; border-collapse: collapse; font-size: 10px; border: 1px solid #d0dce8; }
  .summary-table td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
  .summary-table .row-grand td { font-weight: bold; background: #1a4f7a; color: #ffffff; font-size: 11px; }
  .summary-table .row-due td { font-weight: bold; background: #e8eff6; color: #1a4f7a; font-size: 11px; }

  .amount-words { font-size: 10px; font-weight: bold; color: #111; margin-bottom: 14px; padding: 6px 8px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; }

  .footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #b0c4d8; display: flex; justify-content: space-between; font-size: 8.5px; line-height: 1.6; color: #444; page-break-inside: avoid; }
  .footer b { color: #1a4f7a; }
  .footer-note { font-style: italic; color: #777; font-size: 8px; text-align: right; }

.invoice-heading{
    background:#4d7397;
    color:#fff;
    padding:10px 16px;
    display:flex;
    justify-content:space-between;
    font-size:15px;
    font-weight:700;
    margin-top:12px;
    margin-bottom:18px;
}

.invoice-block{
    padding:0 6px 18px;
    margin-bottom:18px;
    border-bottom:1px solid #d7d7d7;
}

.invoice-row{
    display:flex;
    justify-content:space-between;
    padding:8px 0;
    font-size:12px;
}

.invoice-row td{
    padding:6px 0;
}

.subtotal-row{
    border-top:2px solid #333;
    margin-top:12px;
    padding-top:12px;
    font-size:18px;
    font-weight:700;
    color:#2ca24f;
}

.invoice-title{
    font-size:12px;
    color:#000;
    font-weight:bold;
    margin-bottom:14px;
}
  </style>
</head>
<body>

<!-- HEADER -->
<div class="page-header">
  ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : `<div><b style="font-size:16px;color:#1a4f7a;">Grace Cabs</b></div>`}
  <div class="header-right">
    <div class="inv-no">Invoice No: ${invoiceCode}</div>
    <div>Invoice Date: ${invoiceDate}</div>
    <div>Invoice Month: ${invoiceMonth}</div>
  </div>
</div>

<!-- TITLE -->
<div class="page-title">Tax Invoice</div>

<!-- BILLING FROM & BILLING TO (2 COLUMNS SIDE BY SIDE) -->
<div class="billing-container">
  <!-- LEFT COLUMN: BILLING FROM -->
  <div class="billing-box">
    <div class="billing-label">Billing From</div>
    <div class="billing-row" style="font-weight: bold; color: #1a4f7a;">Grace Cabs Private Limited</div>
    <div class="billing-row">7/621 Nesamani Nagar</div>
    <div class="billing-row">Perumbakkam</div>
    <div class="billing-row">Chennai - 600100</div>
    <div class="billing-row" style="margin-top: 2px;"><span class="bk">GSTIN :</span><span class="bv">33AAMCG2518C1Z0</span></div>
  </div>

  <!-- RIGHT COLUMN: BILLING TO -->
  <div class="billing-box">
    <div class="billing-label">Billing To</div>
    <div class="billing-row"><span class="bk">Company</span><span class="bv">${monthlyInvoice?.companyName || company?.companyName || '-'}</span></div>
    <div class="billing-row"><span class="bk">Address</span><span class="bv">${formattedAddress}</span></div>
    <div class="billing-row"><span class="bk">GST No</span><span class="bv">${company?.gstNo || '-'}</span></div>
  </div>
</div>

<!-- INVOICE DETAILS TABLE -->
<div class="invoice-heading">
    <span>Invoice Details</span>
</div>
<div class="invoice-details">
   ${invoiceBlocks}
</div>
<!-- FINAL SUMMARY -->
<div class="summary-wrap">
  <table class="summary-table">
    <tr style="height:28px;">
      <td style="color: #444;">Sub Total</td>
      <td style="text-align: right; font-weight: bold;">₹ ${subTotal.toFixed(2)}</td>
    </tr>
    ${taxRows}
    ${extraChargesHtml}


    ${totalDiscount > 0 ? `
    <tr style="height:28px;">
      <td style="color: #c0392b;">Discount</td>
      <td style="text-align: right; font-weight: bold; color: #c0392b;">− ₹ ${totalDiscount.toFixed(2)}</td>
    </tr>` : ""}
    <tr class="row-grand">
      <td>Grand Total</td>
      <td style="text-align: right;">₹ ${Math.round(grandTotal).toLocaleString("en-IN")}</td>
    </tr>
    ${totalAdvance > 0 ? `
    <tr style="height:28px;">
      <td style="color: #718096;">Advance Paid</td>
      <td style="text-align: right; font-weight: bold; color: #718096;">− ₹ ${totalAdvance.toFixed(2)}</td>
    </tr>` : ""}
    <tr class="row-due">
      <td>Balance Due</td>
      <td style="text-align: right;">₹ ${Math.round(balanceDue).toLocaleString("en-IN")}</td>
    </tr>
  </table>
</div>

<!-- AMOUNT IN WORDS -->
<div class="amount-words">Amount in Words: ${amountInWords}</div>

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
    <div>* System generated invoice — no signature required</div>
    <div>* GST 5% - Without ITC | GST 12% - With ITC</div>
  </div>
</div>

</body>
</html>`;
};

// Build line items for MONTHLY INVOICE
const buildMonthlyLineItems = (monthlyInvoice: MonthlyInvoice): InvoiceLineItem[] => {
  const items: InvoiceLineItem[] = [];
  const packageAmount = safeNumber(monthlyInvoice.packageAmount);
  if (packageAmount > 0) {
    let month = formatInvoiceMonth(monthlyInvoice.invoiceMonth);
    let Vtype = monthlyInvoice.vehicleTypeName;
    let vNum = monthlyInvoice.vehicleNumber
    let Route = monthlyInvoice.route;
    var packageLabel = `Towards for the month of ${month} \n VehicleNo-${vNum} \n ${Vtype}\n${Route} Cab Charges.`
    if (monthlyInvoice.packageDetails) {
      try {
        const details = typeof monthlyInvoice.packageDetails === 'string'
          ? JSON.parse(monthlyInvoice.packageDetails)
          : monthlyInvoice.packageDetails;

        if (details.label || details.packageName) {
          packageLabel += ` (${details.label || details.packageName})`;
        }
      } catch (e) {
        console.error('Error parsing package details:', e);
      }
    }

    items.push({
      label: `${packageLabel} Coverage.`,
      value: `${packageAmount} `
    });
  }

  // Extra KM Amount
  const extraKm = safeNumber(monthlyInvoice.extraKm);
  const extraKmAmount = safeNumber(monthlyInvoice.extraKmAmount);
  if (extraKmAmount > 0) {
    items.push({
      label: `Extra Kms (${extraKm} km x  ₹${Math.round(extraKmAmount / extraKm)})`,
      value: extraKmAmount
    });
  }

  // Extra Days Amount
  const extraDays = safeNumber(monthlyInvoice.extraDays);
  const extraDaysAmount = safeNumber(monthlyInvoice.extraDaysAmount);
  if (extraDaysAmount > 0) {
    items.push({
      label: `Extra Days (${extraDays} days) × ₹${Math.round(extraDaysAmount / extraDays)})`,
      value: extraDaysAmount
    });
  }
  //Extra Hours amount
  const extraHours = safeNumber(monthlyInvoice.extraHrs);
  const extraHoursAmount = safeNumber(monthlyInvoice.extraHrsAmount);
  if (extraHoursAmount > 0) {
    items.push({
      label: `Extra Hours (${extraHours} Hrs × ₹${safeNumber(monthlyInvoice.extraHourRate)})`,
      value: extraHoursAmount
    });
  }




  // Tax breakdown - Still show in invoice table for detail
  const taxes = monthlyInvoice.taxes;
  if (taxes) {
    try {
      const taxData = typeof taxes === 'string' ? JSON.parse(taxes) : taxes;

      // Handle both array and object format
      if (Array.isArray(taxData)) {
        // Array format: [{ taxId, amount, taxName, taxPercent }, ...]
        taxData.forEach((tax: any) => {
          const amount = safeNumber(tax.amount);
          if (amount > 0) {
            items.push({
              label: `${tax.taxName} @ (${tax.taxPercent}%)`,
              value: amount,
              isSubItem: true
            });
          }
        });
      } else {
        // Object format: { cgst, sgst, igst, cgstPercent, sgstPercent, igstPercent }
        const cgst = safeNumber(taxData.cgst);
        const sgst = safeNumber(taxData.sgst);
        const igst = safeNumber(taxData.igst);

        if (cgst > 0) {
          const cgstPercent = taxData.cgstPercent || 2.5;
          items.push({
            label: `CGST @ (${cgstPercent}%)`,
            value: cgst,
            isSubItem: true
          });
        }

        if (sgst > 0) {
          const sgstPercent = taxData.sgstPercent || 2.5;
          items.push({
            label: `SGST @ (${sgstPercent}%)`,
            value: sgst,
            isSubItem: true
          });
        }

        if (igst > 0) {
          const igstPercent = taxData.igstPercent || 5;
          items.push({
            label: `IGST @ (${igstPercent}%)`,
            value: igst,
            isSubItem: true
          });
        }
      }
    } catch (error) {
      console.error('Error parsing taxes:', error);

      const totalTaxAmount = safeNumber(monthlyInvoice.totalTaxAmount);
      if (totalTaxAmount > 0) {
        items.push({
          label: 'Tax',
          value: totalTaxAmount,
          isSubItem: true
        });
      }
    }
  }
  const capitalize = (text: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  // Extra Charges
  // const extraChargeType = monthlyInvoice.extraChargeType || 'Extra Charges';
  // const extraChargesInputAmount = safeNumber(monthlyInvoice.extraChargesInputAmount);
  // if (extraChargesInputAmount > 0) {
  //   items.push({
  //     label: `extra-Charges `,
  //     value: extraChargesInputAmount
  //   });
  // }
  // Extra Charges (toll / permit / parking)
  const extraCharges = monthlyInvoice.extraCharges;

  if (extraCharges) {
    try {
      const chargeData =
        typeof extraCharges === "string" ? JSON.parse(extraCharges) : extraCharges;

      if (Array.isArray(chargeData)) {
        chargeData.forEach((charge: any) => {
          const amount = safeNumber(charge.amount);

          if (amount > 0) {
            items.push({
              label: `${capitalize(charge.type)} Charges`,
              value: amount,
              isSubItem: true
            });
          }
        });
      }
    } catch (error) {
      console.error("Error parsing extraCharges:", error);
    }
  }
  // Discount
  const discount = safeNumber(monthlyInvoice.discount);
  if (discount > 0) {
    items.push({
      label: 'Discount',
      value: -discount,
      isNegative: true
    });
  }

  // Grand Total
  const finalTotal = safeNumber(monthlyInvoice.finalTotal);
  items.push({
    label: 'Grand Total',
    value: finalTotal,
    isSubTotal: true
  });



  // Advance
  const advance = safeNumber(monthlyInvoice.advance);
  if (advance > 0) {
    items.push({
      label: 'Advance Paid',
      value: -advance,
      isNegative: true
    });
  }

  // Balance Due
  const balanceDue = safeNumber(monthlyInvoice.balanceDue);
  items.push({
    label: 'Total',
    value: balanceDue,
    isTotal: true
  });

  return items;
};

// Format date helper
const formatDate = (dateString: string | Date): string => {
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;

  const istDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(istDate.getDate()).padStart(2, "0");
  const mmm = months[istDate.getMonth()];
  const yyyy = istDate.getFullYear();

  return `${dd}-${mmm}-${yyyy}`;
};

// Parse tax details from database
const parseTaxDetails = (taxes: any): TaxItem[] => {
  const taxItems: TaxItem[] = [];

  if (!taxes) {
    return taxItems;
  }

  try {
    const taxData = typeof taxes === 'string' ? JSON.parse(taxes) : taxes;

    // Handle array format: [{ taxId, amount, taxName, taxPercent }, ...]
    if (Array.isArray(taxData)) {
      taxData.forEach((tax: any) => {
        const amount = safeNumber(tax.amount);
        if (amount > 0) {
          taxItems.push({
            taxId: tax.taxId || '',
            amount: amount,
            taxName: tax.taxName || 'Tax',
            taxPercent: tax.taxPercent || 0
          });
        }
      });
    } else {
      // Handle object format: { cgst, sgst, igst, cgstPercent, sgstPercent, igstPercent }
      const cgst = safeNumber(taxData.cgst);
      const sgst = safeNumber(taxData.sgst);
      const igst = safeNumber(taxData.igst);

      if (cgst > 0) {
        taxItems.push({
          taxId: taxData.cgstTaxId || '0f575325-7ed9-43de-8a25-a4b5b42e1e02',
          amount: cgst,
          taxName: 'CGST',
          taxPercent: taxData.cgstPercent || 2.5
        });
      }

      if (sgst > 0) {
        taxItems.push({
          taxId: taxData.sgstTaxId || '024ea3ce-0fe9-4d67-8d2c-f3399255ae6e',
          amount: sgst,
          taxName: 'SGST',
          taxPercent: taxData.sgstPercent || 2.5
        });
      }

      if (igst > 0) {
        taxItems.push({
          taxId: taxData.igstTaxId || '',
          amount: igst,
          taxName: 'IGST',
          taxPercent: taxData.igstPercent || 5
        });
      }
    }
  } catch (error) {
    console.error('Error parsing taxes for display:', error);
  }

  return taxItems;
};


// Map monthly invoice data to invoice format
export const mapMonthlyInvoiceData = (monthlyInvoice: any): InvoiceData => {
  const lineItems = buildMonthlyLineItems(monthlyInvoice);

  // Get company address from the included company relation
  const companyAddress = monthlyInvoice?.companyAddress || 'N/A';
  const companyGstNo = monthlyInvoice?.company?.gstNo || 'N/A';

  // Parse tax details
  const taxDetails = parseTaxDetails(monthlyInvoice.taxes);

  console.log("Company Address:", companyAddress);
  console.log("Tax Details:", taxDetails);
  // Calculate total due for amount in words
  const totalDue = safeNumber(monthlyInvoice?.balanceDue);
  const amountInWords = numberToWords(totalDue);  // ADD THIS LINE



  return {
    invoiceNumber: monthlyInvoice.invoice?.invoiceNumber || 'N/A',
    invoiceDate: monthlyInvoice.invoiceDate
      ? formatDate(monthlyInvoice.invoiceDate)
      : formatDate(new Date()),
    invoiceMonth: formatInvoiceMonth(monthlyInvoice?.invoiceMonth) || 'N/A',
    gstNo: monthlyInvoice.company?.gstNo || '33AAMCG2518C1Z0',
    vehicleType: monthlyInvoice.vehicleTypeName || 'N/A',
    vehicleNumber: monthlyInvoice.vehicleNumber || 'N/A',
    companyName: monthlyInvoice.companyName || 'N/A',
    companyAddress: companyAddress,
    route: monthlyInvoice.route || 'N/A',
    lineItems,
    companyGstNo: companyGstNo,
    taxDetails: taxDetails,
    amountInWords: amountInWords
  };
};

// Main API endpoint to generate MONTHLY Invoice PDF
export const monthGenerateInvoicePDF = async (req: any, res: Response) => {
  try {
    const { monthlyInvoiceId } = req.body;
    const role = req.role;

    if (role === ROLES.DRIVER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!monthlyInvoiceId) {
      return res.status(400).json({
        success: false,
        message: "monthlyInvoiceId is required in request body.",
      });
    }

    // Fetch monthly invoice data with items
    const monthlyInvoice = await MonthlyInvoice.findByPk(monthlyInvoiceId, {
      include: [
        {
          model: Company,
          as: "company",
          required: false,
          attributes: [
            "companyName",
            "companyAddress",
            "companyPhno",
            "gstNo",
            "managerEmail",
          ],
        },
        {
          model: Invoice,
          attributes: ["invoiceId", "invoiceNumber"],
          required: false,
        },
        {
          model: MonthlyInvoiceItems,
          required: false,
        },
      ],
    });

    if (!monthlyInvoice) {
      return res.status(404).json({
        success: false,
        message: "Monthly Invoice not found.",
      });
    }

    let managerEmails: string[] = [];
    const rawManagerEmail = monthlyInvoice.company?.managerEmail;
    if (rawManagerEmail) {
      try {
        const parsed = JSON.parse(rawManagerEmail);
        managerEmails = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        managerEmails = [rawManagerEmail];
      }
    }

    let managerAddress = "N/A";
    if (managerEmails.length) {
      const managerUser = await User.unscoped().findOne({
        where: {
          email: { [Op.in]: managerEmails.map(e => e.trim()) },
        },
        attributes: ["userAddress"],
      });
      managerAddress = managerUser?.userAddress || "N/A";
    }

    await monthlyInvoice.update({
      companyAddress: monthlyInvoice.company?.companyAddress || managerAddress || "N/A",
    });

    const jsonMonthly = monthlyInvoice.toJSON();
    let items = jsonMonthly.monthlyInvoiceItems || [];

    // Fallback for legacy single-route records
    if (!items || items.length === 0) {
      items = [
        {
          monthlyInvoiceItemId: jsonMonthly.monthlyInvoiceId,
          monthlyInvoiceId: jsonMonthly.monthlyInvoiceId,
          route: jsonMonthly.route || "",
          vehicleTypeId: jsonMonthly.vehicleTypeId,
          vehicleTypeName: jsonMonthly.vehicleTypeName,
          vehicleNumber: jsonMonthly.vehicleNumber,
          packageDataId: jsonMonthly.packageDataId,
          packageDetails: jsonMonthly.packageDetails,
          packageAmount: jsonMonthly.packageAmount,
          extraKm: jsonMonthly.extraKm,
          extraKmAmount: jsonMonthly.extraKmAmount,
          extraDays: jsonMonthly.extraDays,
          extraDaysAmount: jsonMonthly.extraDaysAmount,
          extraHrs: jsonMonthly.extraHrs,
          extraHourRate: jsonMonthly.extraHourRate,
          extraHrsAmount: jsonMonthly.extraHrsAmount,
          extraChargeType: jsonMonthly.extraChargeType,
          extraChargesInputAmount: jsonMonthly.extraChargesInputAmount,
          extraCharges: jsonMonthly.extraCharges,
          discount: jsonMonthly.discount,
          advance: jsonMonthly.advance,
          netTotal: jsonMonthly.netTotal,
          taxes: jsonMonthly.taxes,
          totalTaxAmount: jsonMonthly.totalTaxAmount,
          finalTotal: jsonMonthly.finalTotal,
          balanceDue: jsonMonthly.balanceDue,
        },
      ];
    }

    const invoiceCode = jsonMonthly.monthlyBookingCode || jsonMonthly.invoice?.invoiceNumber || "N/A";
    const invoiceDate = jsonMonthly.invoiceDate ? formatDate(jsonMonthly.invoiceDate) : formatDate(new Date());
    const invoiceMonth = formatInvoiceMonth(jsonMonthly.invoiceMonth) || "N/A";
    const amountInWordsVal = numberToWords(safeNumber(jsonMonthly.balanceDue || jsonMonthly.finalTotal));

    const htmlContent = generateMonthlyInvoiceHTML({
      monthlyInvoice: jsonMonthly,
      items,
      company: jsonMonthly.company,
      invoiceCode,
      invoiceDate,
      invoiceMonth,
      amountInWords: amountInWordsVal,
    });

    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices', 'monthly');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 0
    });

    const pdfFileName = `monthly_invoice_${monthlyInvoiceId}_${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        bottom: '8mm',
        left: '8mm',
        right: '8mm'
      },
      preferCSSPageSize: true
    });

    await browser.close();

    const invoiceNo =
      (monthlyInvoice as any)?.monthlyBookingCode;

    const downloadName = invoiceNo
      ? `${invoiceNo}.pdf`
      : `MonthlyInvoice-${monthlyInvoiceId}.pdf`;


    const token = jwt.sign(
      { fileName: pdfFileName, downloadName },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : req.protocol;
    const downloadUrl = `${protocol}://${req.get("host")}/app/appInvoiceRoutes/download/month-invoice/${pdfFileName}?token=${token}`;

    return res.status(200).json({
      success: true,
      message: "Monthly Invoice PDF generated successfully.",
      data: {
        downloadUrl,
        fileName: pdfFileName,
        monthlyInvoiceId,
      }
    });

  } catch (error) {
    console.error("[GENERATE_MONTHLY_INVOICE_PDF_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the monthly invoice PDF.",
      error: (error as Error).message,
    });
  }
};

// Download monthly invoice PDF
export const monthDownloadInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required.",
      });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', 'invoices', 'monthly', fileName);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "Monthly Invoice PDF not found.",
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    const fileStream = fs.createReadStream(pdfPath);

    fileStream.on('error', (error) => {
      console.error("[FILE_STREAM_ERROR]", error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Error reading the file.",
        });
      }
    });

    fileStream.pipe(res);

    fileStream.on('end', () => {
      console.log(`Monthly PDF ${fileName} downloaded successfully`);
    });

  } catch (error) {
    console.error("[DOWNLOAD_MONTHLY_INVOICE_PDF_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while downloading the monthly invoice PDF.",
      error: (error as Error).message,
    });
  }
};