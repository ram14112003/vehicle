

import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { Booking } from '../models/booking';
import { Vehicle } from '../models/vehicle';
import { VehicleType } from '../models/vehicleType';
import { ClosePending, Invoice, Tax, User } from '../models';
//import { ClosePending, Invoice, User } from '../models';
import { Payment } from "../models/payment";
import { Drivers, VehicleMaster, PackageData } from '../models';
import { Company } from "../models/company";
import { ORDER, USERS } from "../utils/costants";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const BASE_URL = process.env.API_BASE_URL || "https://gracecabs.com";
const { ROLES } = USERS;
const logoPath = path.join(__dirname, "..", "images", "logo.png");
const logoBase64 = fs.readFileSync(logoPath, "base64");
//const logoSrc = `data:image/jpeg;base64,${logoBase64}`;
    const logoSrc = "https://gracecabs.com/images/logo.png";

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

// Interface for structured invoice data
interface InvoiceData {
  invoiceNumber: string;
  managerName?: string;
 managerEmail?: string;
 costCenter?: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  gstNo: string;
  city: string;
  state: string;
  country: string;
  orderNumber: string;
  pickupPoint: string;
  vehicleType: string;
  vehicleNumber:string;
  pickupDate: string;
  bookedby:string;
  companyName:string;
  companyaddress:string;
  amountInWords: string; 
  email: string;
  mobile: string;
  tripDetails: string;
  tripsheetno:string;
  lineItems: InvoiceLineItem[];
  garageOpen: {
    kms: number;
    dateTime: string;
  };
  garageClose: {
    kms: number;
    dateTime: string;
  };
  usageKms: number;
  usageHours: number;
  autoApprovalNote?: string; 
    approvalStatus?: string;
    hasSelfName?: boolean;
    notes?: string;


}

// Helper function to safely convert to number
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
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
// Generate HTML with dynamic line item
export const generateInvoiceHTML = (data: InvoiceData): string => {
  //  const logoSrc = "https://gracecabs.com/images/logo.png";

  const lineItemsHTML = data.lineItems.map(item => {
    let rowClass = '';
    let tdClass = '';

    if (item.isTotal) {
      rowClass = 'total-row';
    } else if (item.isSubTotal) {
      rowClass = 'subtotal-row';
    }

    if (item.isSubItem) {
      tdClass = 'additional-item';
    } else if (item.isBold) {
      tdClass = 'additional-charges';
    }

    const displayValue = typeof item.value === 'number'
      ? item.value.toFixed(2)
      : item.value;

   return `
  <tr${rowClass ? ` class="${rowClass}"` : ''}>
    <td${tdClass ? ` class="${tdClass}"` : ''}>${item.label}</td>
    <td${rowClass === 'subtotal-row' ? ` class="subtotal-amount"` : ''}>${displayValue}</td>
  </tr>
`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grace Cabs Private Limited</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #fff;
            padding: 12px;
            font-size: 13px;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            border: 1px solid #ddd;
            padding: 18px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }        

        .company-name .travels {
            color: #4CAF50;
        }

        .invoice-info {
            text-align: right;
            font-size: 11px;
            line-height: 1.5;
        }

        .invoice-info strong {
            color: #333;
        }

        .section-header {
            background-color:  rgba(82, 121, 152, 1);
            padding: 5px 12px;
            font-weight: bold;
            color: #333;
            margin: 12px 0 6px 0;
            font-size: 11px;
        }

        .billing-booking-row {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin: 20px 0;
}

.billing-section {
    flex: 1;
    min-width: 45%;
}

.booking-section {
    flex: 1;
    min-width: 45%;
}

.section-header {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 10px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
}

.field-group {
    margin-bottom: 8px;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
}

.field-label {
    font-weight: 500;
    min-width: 140px;
}

.field-value {
    text-align: right;
}

    

        .trip-info {
            font-size: 11px;
            margin: 8px 0;
        }

        .invoice-section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: rgba(82, 121, 152, 1);
            font-weight: bold;
            color: #333;
            margin: 12px 0 0 0;
            font-size: 11px;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 12px 0;
        }

        .invoice-table td {
            padding: 5px 12px;
            border: none;
            font-size: 11px;
            vertical-align: top;
        }

        .invoice-table td:first-child {
            text-align: left;
            color: #333;
        }

        .invoice-table td:last-child {
            text-align: right;
            font-weight: 400;
        }

        .additional-charges {
            font-weight: bold;
            color: #333;
            padding-top: 8px !important;
        }

        .additional-item {
            padding-left: 20px;
            color: #666;
            font-size: 11px;
        }

      

      
.subtotal-row td,
.subtotal-amount {
    font-weight: 700 !important;
}

.invoice-table td {
    padding: 5px 12px;
    border: none;
    font-size: 11px;
    vertical-align: top;
}

.invoice-table td:first-child {
    text-align: left;
    color: #333;
}

.invoice-table td:last-child {
    text-align: right;
    font-weight: 400;
}

.additional-charges {
    font-weight: bold;
    color: #333;
    padding-top: 8px !important;
}

.additional-item {
    padding-left: 20px;
    color: #666;
    font-size: 11px;
}

.subtotal-row td {
    padding-top: 8px !important;
    font-weight: 700;
    border-top: 1px solid #ddd;
}

.subtotal-row td:first-child,
.subtotal-row td:last-child {
    font-weight: 700 !important;
    color: #333;
}

.total-row {
    border-top: 1px solid #333;
}

.total-row td {
    font-weight: bold;
    font-size: 18px;
    color: #4CAF50;
    padding-top: 8px !important;
}

        .usage-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #333;
            margin: 11px 0;
        }

        .usage-table th,
        .usage-table td {
            border: 1px solid #333;
            padding: 5px 8px;
            text-align: center;
            font-size: 11px;
        }

        .usage-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .footer-info {
            margin-top: 12px;
            font-size: 8px;
            line-height: 1.3;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        .footer-row {
            display: flex;
            margin-bottom: 1px;
        }

        .footer-label {
            font-weight: bold;
            min-width: 80px;
        }
           

        @media print {
            body {
                padding: 0;
            }
            .invoice-container {
                border: none;
                padding: 12px;
            }
        }

        @page {
            size: A4;
            margin: 11mm;
        }


.logo-section {
    display: flex;
    align-items: center; 
    gap: 10px;           
}

.logo-img {
    height: 60px;       
    width: auto;
}

.email-color{
    color: rgb(39, 89, 129);
    font-weight:bold;
    }
    .phone-color{
    color: #4CAF50;
      font-weight:bold;
    }
     
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
       <div class="header">
    <div class="logo-section">
    <img src="${logoSrc}" alt="Grace Cabs" class="logo-img" />
    </div>
            <div class="invoice-info">
                <div><strong>Invoice Number:</strong> ${data.invoiceNumber}</div>
                <div><strong>Invoice Date:</strong> ${data.invoiceDate}</div>
                <div><strong>Due Date:</strong> ${data.dueDate}</div>

            </div>
        </div>
        <div style="text-align: center; margin: 15px 0;">
            <h2 style="color:rgb(39, 89, 129); font-weight: bold; margin: 0; font-size: 20px;">Invoice</h2>
        </div>
<div class="billing-booking-row">
    <div class="billing-section">
        <div class="section-header">Billing To</div>
        <div class="field-group">${data.companyName}</div>
        <div class="field-group">${data.companyaddress}</div>
        <div class="field-group">GST NO: ${data.gstNo}</div>
    </div>
    
    <div class="booking-section">
        <div class="section-header">Booking Details</div>
        <div class="field-group">
            <span class="field-label">Booked By</span>
            <span class="field-value">${data.customerName}</span>
        </div>
    
        
       ${data.bookedby && data.bookedby !== "null" ? `
<div class="field-group">
    <span class="field-label">Guest Name</span>
    <span class="field-value">${data.bookedby}</span>
</div>
` : ""}
        <div class="field-group">
            <span class="field-label">Order Number</span>
            <span class="field-value">${data.orderNumber}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Pickup Type</span>
            <span class="field-value">${data.pickupPoint}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Vehicle</span>
            <span class="field-value">${data.vehicleType}</span>
            <span class="field-value">${data.vehicleNumber}</span>

        </div>
        <div class="field-group">
            <span class="field-label">Pickup Date</span>
            <span class="field-value">${data.pickupDate}</span>
        </div>
        ${!data.hasSelfName ? `
        <div class="field-group">
            <span class="field-label">Booking Email Id</span>
            <span class="field-value email-color">${data.email}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Booking Mobile No</span>
            <span class="field-value phone-color">${data.mobile}</span>
        </div>
        ` : ''}

        ${data.notes && data.notes !== "null" ? `
        <div class="field-group">
            <span class="field-label">Reason</span>
            <span class="field-value">${data.notes}</span>
        </div>
        ` : ""}

${data.managerEmail ? `
<div class="field-group">
    <span class="field-label">Manager Email</span>
    <span class="field-value email-color">${data.managerEmail}</span>
</div>

<div class="field-group">
    <span class="field-label">Cost Center</span>
    <span class="field-value">${data.costCenter || "-"}</span>
</div>
 
<div class="field-group">
    <span class="field-label">Status</span>
    <span class="field-value" style="color:#d97706;font-weight:bold;">
        ${data.approvalStatus}
    </span>
</div>
` : ""}


    </div>
</div>

        <!-- Trip Details -->
        <div class="section-header">Trip Details</div>
        <div class="trip-info">${data.tripDetails}</div>

         <!-- TripSheet Details -->
        <div class="section-header">Trip Sheet Number</div>
        <div class="trip-info">${data.tripsheetno}</div>
      
         <!-- Usage Table -->
        <table class="usage-table">
            <thead>
                <tr>
                    <th></th>
                    <th>GARAGE OPEN</th>
                    <th>GARAGE CLOSE</th>
                    <th>USAGE</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>KM's</strong></td>
                    <td>${data.garageOpen.kms}</td>
                    <td>${data.garageClose.kms}</td>
                    <td>${data.usageKms}</td>
                </tr>
                <tr>
                    <td><strong>DATE & TIME</strong></td>
                    <td>${data.garageOpen.dateTime}</td>
                    <td>${data.garageClose.dateTime}</td>
                    <td>${data.usageHours} hr(s)</td>
                </tr>
            </tbody>
        </table>

        <!-- Invoice Details -->
        <div class="invoice-section-header">
            <span>Invoice Details</span>
            <span>Amount (Rs)</span>
        </div>
      
        <table class="invoice-table">
            ${lineItemsHTML}
        </table>

       
        <div class="amount-in-words">
            <p>${data.amountInWords}</p> 
        </div>



        <!-- Footer Information -->
        <div class="footer-info">
            <div class="footer-row">
                <span class="footer-label">Regd.Office:</span>
                <span>Grace Cabs  Pvt. Ltd., 7/621 NESAMANI NAGAR, PERUMBAKKAM, CHENNAI - 600100</span>
            </div>
            <div class="footer-row">
                <span class="footer-label">Website:</span>
                <span>gracecabs.com</span>
            </div>
            <div class="footer-row">
                <span class="footer-label">GSTIN:</span>
                <span>33AAMCG2518C1Z0</span>
            </div>
            <div class="footer-row">
                <span class="footer-label">PAN No.:</span>
                <span>AAMCG2518C</span>
            </div>
            <div class="footer-row">
                <span class="footer-label">SAC:</span>
                <span>996609</span>
            </div>
            <div class="footer-row">
                <p> * It is a system generated invoice which does not need a signature</p>
                </div>
                 <div class="footer-row">
               
                <p> * GST 5 % - Without ITC </p>
               
                </div>
                <div class="footer-row">
               
             
                <p>* GST 12% - With ITC</p>
                </div>
        </div>
    </div>
</body>
</html>
  `;
};

// Updated buildLineItems to accept vehicle data
const buildLineItems = (closePending: any, packageDetails: any, vehicle: any): InvoiceLineItem[] => {
  const items: InvoiceLineItem[] = [];

  // Package Amount (always show)
  var packageAmount = safeNumber(closePending?.packageAmount);
  if(closePending?.selectedPackageData?.packageType === "Local City Use"){
    
  const packages = (closePending?.selectedPackageData?.label);
  items.push({
    label: 'Package Amount' + `(${packages})`,
    value: packageAmount 
  });
  }
  else{

 const packagesAmountOut = safeNumber(closePending?.selectedPackageData?.amount);
 const packages = (closePending?.selectedPackageData?.label)
const outKm = safeNumber(closePending?.garageKms)
  items.push({
    label: 'Package Amount' + `(${ packages}--->[${packagesAmountOut} * ${outKm}km])`,
    value: packageAmount 
  });
  }
 
 

  //  Driver Batta (if exists in packageDetails or closePending)
  const driverBatta = safeNumber(closePending?.selectedPackageData?.driverBattaPerDay)
  const driverBattaValue = safeNumber(closePending?.extraDriverBeta);
  const driDay = (closePending?.driverBetaDays)
  if (driverBattaValue  > 0) {
    items.push({
      label:'DriverBatta' + `(${driverBatta}*${driDay}days)`,
      value:driverBattaValue 
    });
  }



  //  Additional KMs Charges (if exists)
  //  FIXED: Get localPerKm from vehicle parameter
  const additionalKms = safeNumber(closePending?.additionalKms);
  const additionalKmsAmount = safeNumber(closePending?.additionalKmsAmount);
  const additionperkmsAmount = safeNumber(closePending?.selectedPackageData?.extraKmRate);
  
  if (additionalKmsAmount > 0) {
    const kmsLabel = additionalKms > 0
      ? `Additional KMs Charges (${additionalKms} km `
      : 'Additional KMs Charges';
    items.push({
      label: `${kmsLabel}  *  ${additionperkmsAmount})`,
      value: additionalKmsAmount
    });
  }

  //  Additional Hours Charges (if exists)
  // FIXED: Get localPerHour from vehicle parameter
  const additionalHours = safeNumber(closePending?.additionalHours);
  const additionalHoursAmount = safeNumber(closePending?.additionalHoursAmount);
  const addtionalPerHourAmount = safeNumber(closePending?.selectedPackageData?.extraHourRate);

  if (additionalHoursAmount > 0) {
    const hoursLabel = additionalHours > 0
      ? `Additional Hours Charges (${additionalHours} hrs`
      : 'Additional Hours Charges';
    items.push({
      label: `${hoursLabel} * ${addtionalPerHourAmount})`,
      value: additionalHoursAmount
    });
  }

  // Guest KMs Details (if exists and not hidden)
  const hideGuestDetails = closePending?.hideGuestDetails === true;
  const guestKms = safeNumber(closePending?.guestKms);
  if (guestKms > 0 && !hideGuestDetails) {
    const guestOpenKm = safeNumber(closePending?.guestOpenKm);
    const guestCloseKm = safeNumber(closePending?.guestCloseKm);
    const guestDetails = guestOpenKm && guestCloseKm
      ? ` (${guestOpenKm} - ${guestCloseKm} km)`
      : '';
    items.push({
      label: `Guest KMs${guestDetails}`,
      value: guestKms,
      isInfo: true
    });
  }

  //  Sub Total (before tax)
  const subtotal = packageAmount + driverBattaValue  +
    additionalKmsAmount + additionalHoursAmount;

  items.push({
    label: 'Sub Total',
    value: subtotal,
    isSubTotal: true
  });

// ✅ Extra Charges (Breakup rows - no total)
const breakupRaw = closePending?.extraChargesBreakup;

// sometimes backend may send as string -> parse
let breakup: any[] = [];
try {
  const parsed = typeof breakupRaw === "string" ? JSON.parse(breakupRaw) : breakupRaw;
  breakup = Array.isArray(parsed) ? parsed : [];
} catch {
  breakup = [];
}

const chargesRemarks = closePending?.chargesRemarks
  ? ` (${closePending.chargesRemarks})`
  : "";

// ✅ If breakup exists -> show each item separately (NO total row)
if (breakup.length > 0) {
  breakup.forEach((x: any) => {
    const title = String(x?.title || "Extra Charge").trim();
    const amt = safeNumber(x?.amount);

    if (amt > 0) {
      items.push({
        label: `${title}${chargesRemarks}`,
        value: amt,
        // optional: make it bold like section (if you want)
        // isBold: true,
      });
    }
  });
} else {
  // ✅ fallback -> show total only when breakup not available
  const extraChargesTotal = safeNumber(closePending?.extraCharges);
  if (extraChargesTotal > 0) {
    items.push({
      label: `Extra Charges${chargesRemarks}`,
      value: extraChargesTotal,
    });
  }
}

  //  Discount Amount (if exists - show as negative)
  const discountAmount = safeNumber(closePending?.discountAmount);
  if (discountAmount > 0) {
    items.push({
      label: 'Discount Amount',
      value: -discountAmount,
      isNegative: true
    });
  }

  //  GST/Tax Details (if any tax is applicable)
  const cgstAmount = safeNumber(closePending?.cgstAmount);
  const sgstAmount = safeNumber(closePending?.sgstAmount);
  const igstAmount = safeNumber(closePending?.igstAmount);
  const totalTaxAmount = safeNumber(closePending?.totalTaxAmount);

  if (cgstAmount > 0) {
    const cgstApplicable = closePending?.cgstApplicable === true  ;
    //  const cgstApplicable = closePending?.cgstApplicable ;
   
    items.push({
      label: cgstApplicable ? 'CGST ' : 'CGST',
    //  label: cgstApplicable || "CGST / SGST / IGST",
      value: cgstAmount,
      isSubItem: true
    });
  }

  if (sgstAmount > 0) {
   //  const sgstApplicable = closePending?.sgstApplicable;
    const sgstApplicable = closePending?.sgstApplicable === true;
    items.push({
       // label: sgstApplicable || "CGST / SGST / IGST",
      label: sgstApplicable ? "SGST":"SGST",
      value: sgstAmount,
      isSubItem: true
    });
  }

  if (igstAmount > 0) {
    // const igstApplicable = closePending?.igstApplicable ;
    const igstApplicable = closePending?.igstApplicable === true;
    items.push({
      label: igstApplicable ? 'IGST':'IGST' ,
     // label: igstApplicable || "CGST / SGST / IGST",
      value: igstAmount,
      isSubItem: true
    });
  }

if (totalTaxAmount > 0 && (cgstAmount === 0 && sgstAmount === 0 && igstAmount === 0) || totalTaxAmount > 0 && (cgstAmount === 1 && sgstAmount === 1 && igstAmount === 1)) {
  items.push({
    label: 'Tax',
    value: totalTaxAmount,
    isSubItem: true
  });
}
  // 11. Total Amount (after tax)
  // const total = safeNumber(closePending?.total || closePending?.totalAmount);
  // items.push({
  //   label: 'Total Amount',
  //   value: total,
  //   isSubTotal: true
  // });

  //   // Show total tax amount if multiple taxes applied
  // if (totalTaxAmount > 0 && (cgstAmount + sgstAmount + igstAmount > 0)) {
  //   items.push({
  //     label: 'Total Tax Amount',
  //     value: totalTaxAmount,
  //     isSubItem: true
  //   });
  // }

  // 12. Advance Amount (if exists - show as deduction)
  const advanceAmount = safeNumber(closePending?.advanceAmount);
  if (advanceAmount > 0) {
    items.push({
      label: 'Advance Paid',
      value: -advanceAmount,
      isNegative: true
    });
  }

  //  Total Due (final amount to be paid)
  const totalDue = safeNumber(closePending?.totalDue);
  items.push({
    label: 'Total Due',
    value: totalDue,
    isTotal: true
  });

  return items;
};

// Format date helper
const formatDate = (d: Date) => {
  const istDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(istDate.getDate()).padStart(2, "0");
  const mmm = months[istDate.getMonth()];
  const yyyy = istDate.getFullYear();

  let hh = istDate.getHours();
  const mi = String(istDate.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  hh = hh ? hh : 12; // 0 → 12

  return `${dd}-${mmm}-${yyyy} ${String(hh).padStart(2, "0")}:${mi} ${ampm}`;
};


export const mapBookingToInvoiceData = (booking: any): InvoiceData => {
  // const invoice = booking.payment?.invoices?.[0];
  // const closePending = invoice?.closePending;
 const invoice =
  booking?.invoice?.[0] ??
  booking?.payment?.invoices?.[0] ??
  null;


const closePending = invoice?.closePending;

  const user = booking.user;
  //const company = user?.company;
  const company = booking?.selfName &&
  booking.selfName !== "-" &&
  booking.selfName.toString().trim() !== ""
    ? booking?.company   // ✅ from booking.companyId
    : user?.company;     // ✅ fallback
  const vehicle = booking.vehicle;
  //const vehicleMaster = booking?.vehicleMaster;
  const vehicleMaster = booking?.vehicleMaster;
console.log("iiiiii ",invoice, " cccc ",closePending);
console.log("🔍 VEHICLE DEBUG CHECK", {
  // Direct Booking → VehicleMaster
  booking_vehicleMaster: booking.vehicleMaster,
  booking_vehicleMaster_vehicleNumber: booking.vehicleMaster?.vehicleNumber,
  booking_vehicleMaster_vehicleModel: booking.vehicleMaster?.vehicleModelName,

  // Nested Booking → Vehicle → VehicleMaster
  booking_vehicle_vehicleMaster: booking.vehicle?.vehicleMaster,
  booking_vehicle_vehicleMaster_vehicleNumber:
    booking.vehicle?.vehicleMaster?.vehicleNumber,
  booking_vehicle_vehicleMaster_vehicleModel:
    booking.vehicle?.vehicleMaster?.vehicleModelName,

  // ID only (for reference)
  booking_vehicleMasterId: booking.vehicleMasterId,
});

   console.log("PDF VEHICLE FINAL CHECK:", {
    vehicleMasterId: booking.vehicleMasterId,
    vehicleNumber: vehicleMaster?.vehicleNumber,
    vehicleModel: vehicleMaster?.vehicleModelName,
  });

  let packageDetails: any = null;
console.log( booking?.vehicle?.vehicleMaster, " vehic as ", booking?.vehicleMaster)
  try {
    // if (closePending?.packageData?.packages) {
    //   const packages = typeof closePending.packageData.packages === 'string'
    //     ? JSON.parse(closePending.packageData.packages)
    //     : closePending.packageData.packages;
    //   packageDetails = Array.isArray(packages) ? packages[0] : packages;
    // }
        const pkgRaw =
      closePending?.selectedPackageData ??
      closePending?.packageData?.packages;

    if (pkgRaw) {
      const parsed =
        typeof pkgRaw === "string" ? JSON.parse(pkgRaw) : pkgRaw;
      packageDetails = Array.isArray(parsed) ? parsed[0] : parsed;
    }
  } catch (error) {
    console.error('Error parsing package data:', error);
  }
console.log("booking.vehicleMasterId =", booking.vehicleMasterId);
console.log("booking.vehicleMaster =", booking.vehicleMaster);

  // Pass vehicle to buildLineItems
  const lineItems = buildLineItems(closePending, packageDetails, vehicle);
    const totalDue = safeNumber(closePending?.totalDue);
  const amountInWords = numberToWords(totalDue);  // ADD THIS LINE
// ⭐ ADD THIS BLOCK HERE
// ⭐ ADD THIS BLOCK HERE
// const isDanfoss =
//   booking.user?.company?.companyName?.toLowerCase() === "danfoss";
// const isManagerApproval =  Boolean(company?.managerApproval);
// const comp = user.isManagerApproval;
// console.log("user comp: ", comp);
// const showManager =
//   isManagerApproval &&
//   booking.manager &&
//   booking.manager.username;

// const managerName = booking.manager?.username;
// const managerEmail = booking.manager?.email;
 const isDanfoss =  Boolean(company?.managerApproval);
 const isManagerApproval = Boolean(company?.managerApproval);

//   company?.companyName?.toLowerCase().includes("danfoss");

const managerEmail = booking?.managerEmail;
const costCenter = booking?.costCenter;
const isAutoApproved = Number(booking?.autoApproveStatus) === ORDER.STATUS.CONFIRMED;
const isManagerApproved =
  managerEmail &&
  !isAutoApproved;

const showManager = isManagerApproval && managerEmail;
const hasSelfName =
  booking?.selfName &&
  booking.selfName !== "-" &&
  booking.selfName.toString().trim() !== "";


return {
    invoiceNumber: invoice?.invoiceNumber || `#${booking.bookingId}`,
       ...(showManager && {
   
    managerEmail,
    costCenter,
      approvalStatus: isAutoApproved ? "Auto Approved" : "Approved"
  }),

    ...(isAutoApproved && {
    approvalNote: "Booking Auto Approved",
  }),

   invoiceDate: invoice?.startDate ? formatDate(invoice.startDate) : 'N/A',
    dueDate: invoice?.endDate ? formatDate(invoice.endDate) : 'N/A',

   customerName:booking?.selfName &&
  booking.selfName !== "-" &&
  booking.selfName.toString().trim() !== ""
    ? booking.selfName
    : booking.user?.username,
    customerAddress: `${company?.companyName || ''}\n${company?.companyAddress || user?.userAddress || ''}`,
    gstNo: company?.gstNo || 'N/A',
    city: `${user?.city || ''} - ${user?.pinCode || ''}`,
    state: user?.state || '',
    country: user?.country || '',
    orderNumber: booking?.bookingCode || `#${booking.bookingId}`,
    pickupPoint: booking?.pickupPoint,
    vehicleType: vehicleMaster?.vehicleModelName ||'N/A',
    vehicleNumber:vehicleMaster?.vehicleNumber ||'N/A',
    pickupDate: formatDate(booking?.bookingDate),
    bookedby:booking?.behalfOfName,
    companyName:company?.companyName,
    companyaddress:company?.companyAddress,
    amountInWords: amountInWords,
    notes: booking?.notes || "",
    hasSelfName: !!hasSelfName, 
   ...(hasSelfName
  ? {} // ❌ Don't include email & mobile
  : {
      email: user?.email || 'N/A',
      mobile: user?.mobile || 'N/A',
    }),
    tripDetails: `${booking?.pickupPoint || ''}  Trip: ${booking?.pickupCity || ''} - ${booking?.pickupArea || ''}  to  ${booking?.dropPoint || ''}`,
    tripsheetno:`Trip Sheet Number : ${closePending?.tripSheetNumber}`,
    lineItems,
    garageOpen: {
      kms: closePending?.garageOpenKm || 0,
      dateTime: closePending?.garageOpenDateTime ? formatDate(closePending.garageOpenDateTime) : 'N/A',
    },
    garageClose: {
      kms: closePending?.garageCloseKm || 0,
      dateTime: closePending?.garageCloseDateTime ? formatDate(closePending.garageCloseDateTime) : 'N/A',
    },
    usageKms: closePending?.garageKms,
    usageHours: closePending?.usageHours || '0'
  };
};

// Main API endpoint to generate PDF
export const generateInvoicePDF = async (req: any, res: Response) => {
  try {
    const { bookingId } = req.body;
    const role = req.role;

    if (role === ROLES.DRIVER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const bookings = await Booking.findOne({ where: { bookingId: bookingId } });
    // if (bookings?.confirmStatus !== ORDER.STATUS.CLOSED.toString()) {
    //   return res.status(403).json({ message: 'Please close the order.' });
    // }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required in request body.",
      });
    }

const booking = await Booking.findByPk(bookingId, {
  include: [
    {
      model: Invoice,
      as: "invoice",              // ✅ REQUIRED
      required: false,
      include: [
        {
          model: ClosePending,
          as: "closePending",
          required: false,
        }
      ]
    },
    {
      model: Company,
      as: "company", // ⚠️ MUST match your association
      required: false,
      attributes: [
        "companyId",
        "companyName",
        "companyAddress",
        "gstNo"
      ]
    },
    {
      model: User,
      as: "user",
      include: [{ model: Company, as: "company",attributes: [
      "companyId",
      "companyName",
      "companyAddress",
      "gstNo",
      "managerApproval"
    ] }]
    },
       {
      model: User,
      as: "manager",
      required: false,
attributes: ["userId", "username", "email"]    },
    { model: VehicleMaster, as: "vehicleMaster" },
    { model: VehicleType, as: "vehicleType" },
    { model: Vehicle, as: "vehicle" },
    { model: Drivers, as: "driver" }
  ], raw: false,    
  nest: true      
});


    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

        let correctVehicleMaster = null;

    if (booking.vehicleMasterId) {
      correctVehicleMaster = await VehicleMaster.findByPk(
        booking.vehicleMasterId,
        {
          attributes: [
            "vehicleMasterId",
            "vehicleNumber",
            "vehicleModelName",
            "vehicleType",
          ],
        }
      );
    }
    //  Log vehicle data
        (booking as any).vehicleMaster = correctVehicleMaster;

    console.log("✅ PDF VEHICLE ATTACHED", {
      vehicleMasterId: booking.vehicleMasterId,
      vehicleNumber: correctVehicleMaster?.vehicleNumber,
      vehicleModel: correctVehicleMaster?.vehicleModelName,
    });
    console.log('Vehicle Data:', JSON.stringify(booking.vehicle, null, 2));

    const invoiceData = mapBookingToInvoiceData(booking);
    const htmlContent = generateInvoiceHTML(invoiceData);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // const page = await browser.newPage();
    // await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const page = await browser.newPage();

await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

await new Promise(resolve => setTimeout(resolve, 1000));
    const pdfFileName = `invoice_${bookingId}_${Date.now()}.pdf`;
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

    const invoiceDataVal = (booking as any)?.invoice;
    const invoiceNo = Array.isArray(invoiceDataVal) ? invoiceDataVal[0]?.invoiceNumber : invoiceDataVal?.invoiceNumber;
    const downloadName = invoiceNo ? `${invoiceNo}.pdf` : `Invoice-${bookingId}.pdf`;

    const token = jwt.sign(
      { fileName: pdfFileName, downloadName },
      JWT_SECRET,
      { expiresIn: "5m" }
    );
      //  const protocol = req.protocol === 'http' && req.get('x-forwarded-proto') === 'https' 
      // ? 'https' 
      // : req.protocol;

    const downloadUrl = `${BASE_URL}/app/appInvoiceRoutes/download/invoice/${pdfFileName}?token=${token}`;

    return res.status(200).json({
      success: true,
      message: "Invoice PDF generated successfully.",
      data: {
        downloadUrl,
        fileName: pdfFileName,
        bookingId,
        invoiceData
      }
    });

  } catch (error) {
    console.error("[GENERATE_INVOICE_PDF_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the invoice PDF.",
      error: (error as Error).message,
    });
  }
};

export const downloadInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required.",
      });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', 'invoices', fileName);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "Invoice PDF not found.",
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
      console.log(`PDF ${fileName} downloaded successfully`);
    });

  } catch (error) {
    console.error("[DOWNLOAD_INVOICE_PDF_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while downloading the invoice PDF.",
      error: (error as Error).message,
    });
  }
};