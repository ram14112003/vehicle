import { Request, Response } from 'express';
import { ClosePending } from '../models/closepending';
import { PackageData } from '../models/packageData';
import { Payment } from '../models/payment';
import { Invoice } from '../models/invoice';
import { PaymentMode } from '../models/paymentmode';
import { Booking } from '../models/booking';
import { USERS } from "../utils/costants";
import { ORDER } from "../utils/costants";
import { Company, Drivers, User, Vehicle, VehicleMaster, VehicleType } from '../models';
import { Op } from 'sequelize';
const { ROLES } = USERS;
import { sendEmailFromTemplate } from "../services/emailConfServices";
import { fetchAllEmailConfs } from "../services/emailConfServices";
import { mapBookingToInvoiceData, generateInvoiceHTML } from "../appServices/appInvoiceServices";
import config from "../config/config";
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { UniqueConstraintError } from "sequelize";
import { Tax } from "../models/tax";
import { MonthlyInvoice } from "../models/monthlyInvoice";
import { MonthlyInvoiceItems } from "../models/monthlyInvoiceItems";
import { Sequelize } from "sequelize";
import axios from "axios";
import { InvoiceSequence } from "../models/invoice_sequence";
//const logoPath = path.join(__dirname, "..", "images", "logo.png");
// const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
// const logoBase64 = fs.readFileSync(logoPath, "base64");
// const logoSrc = `data:images/png;base64,${logoBase64}`;
// === EMAIL HELPERS (put below imports) ===
const nINR = (v: any) =>
  Number(v ?? 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const nINR0 = (v: any) =>
  Number(v ?? 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const nPlain = (v: any) => {
  const num = Number(v ?? 0);
  const isInt = Number.isFinite(num) && Math.floor(num) === num;
  return num.toLocaleString("en-IN", { maximumFractionDigits: isInt ? 0 : 2 });
};

const fmtDate = (d?: any) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "-";

export function normalizePackageDetails(rawPkgDetails: any, requestItem: any = {}): any {
  let pkg = rawPkgDetails;
  if (typeof pkg === "string") {
    try {
      pkg = JSON.parse(pkg);
    } catch (e) {
      pkg = {};
    }
  }
  if (!pkg || typeof pkg !== "object") {
    pkg = {};
  }

  const packageId =
    pkg.packageId ||
    pkg.packageDataId ||
    pkg.id ||
    pkg.__packageDataId ||
    requestItem?.packageDataId ||
    requestItem?.packageId ||
    "";

  const title =
    pkg.title ||
    pkg.label ||
    pkg.packageName ||
    pkg.name ||
    requestItem?.packageName ||
    requestItem?.packageLabel ||
    "Monthly Package";

  // Requirement 4: If packageDetails.days is missing but hours exists, convert: days = hours
  const days = toNum(
    pkg.days ??
    pkg.hours ??
    pkg.__days ??
    pkg.packageDays ??
    pkg.packageHours ??
    requestItem?.pkgDays ??
    0
  );

  const km = toNum(
    pkg.km ??
    pkg.kms ??
    pkg.__km ??
    pkg.packageKm ??
    requestItem?.pkgKm ??
    0
  );

  const amount = toNum(
    pkg.amount ??
    pkg.__amount ??
    requestItem?.packageAmount ??
    0
  );

  // Requirement 5: If packageDetails.extraKmRate is missing, store extraKmRate coming from request
  const extraKmRate = toNum(
    pkg.extraKmRate ??
    pkg.extraKmRatePerKm ??
    requestItem?.extraKmRate ??
    requestItem?.extraKmRatePerKm ??
    0
  );

  // Requirement 6: If packageDetails.extraHourRate is missing, store extraHourRate from request
  const extraHourRate = toNum(
    pkg.extraHourRate ??
    pkg.extraHrsRate ??
    requestItem?.extraHourRate ??
    requestItem?.extraHrsRate ??
    0
  );

  // Requirement 7: If packageDetails.extraDayRate is missing, calculate packageAmount / days and save it
  let extraDayRate = toNum(
    pkg.extraDayRate ??
    pkg.extraDaysRate ??
    pkg.perDayRate ??
    requestItem?.extraDayRate ??
    requestItem?.perDayRate ??
    0
  );

  if (extraDayRate <= 0 && amount > 0 && days > 0) {
    extraDayRate = Number((amount / days).toFixed(2));
  }

  return {
    packageId: String(packageId),
    title: String(title),
    days: days,
    km: km,
    amount: amount,
    extraKmRate: extraKmRate,
    extraHourRate: extraHourRate,
    extraDayRate: extraDayRate,
  };
}

export function buildRemainderEmailInvoiceBlockFromRaw(completeBooking: any, cp: any, inv: any) {
  const b = completeBooking ?? {};

  const invoiceNumber = inv?.invoiceNumber ?? "-";
  const invoiceDate = fmtDate(inv?.createdAt);

  // description fields
  const pickupPoint = b?.pickupPoint || b?.pickupArea || b?.pickupCity || "-";
  const pickupDate = fmtDate(cp?.pickupDate || b?.pickupDate);

  // amount
  const amount = inv?.invoiceAmount ?? cp?.totalAmount ?? 0;

  return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;font-size:13px;">
        ${invoiceNumber}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;font-size:13px;white-space:nowrap;">
        ${invoiceDate}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;font-size:13px;">
        Pickup Point : ${pickupPoint}<br/>
        Pickup Date : ${pickupDate}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;white-space:nowrap;">
        ${nINR(amount)}
      </td>
    </tr>
  `;
}

export function buildEmailInvoiceBlockFromRaw(completeBooking: any, cp: any, inv: any) {
  console.log("📧 EMAIL VEHICLE DEBUG", {
    hasRootVehicleMaster: !!completeBooking?.vehicleMaster,
    rootVehicleNumber: completeBooking?.vehicleMaster?.vehicleNumber,
    nestedVehicleNumber: completeBooking?.vehicle?.vehicleMaster?.vehicleNumber,
  });

  const b = completeBooking ?? {};
  const u = b.user ?? {};
  const c = u.company ?? {};

  const bookedByUser =
    b?.selfName &&
      b.selfName !== "-" &&
      b.selfName.toString().trim() !== ""
      ? b.selfName
      : u?.username;
  //  const vt = b.vehicleType ?? {};
  // const vehDisplay = b.vehicle?.vehicleMaster ? b.vehicle.vehicleMaster : b.vehicle ?? {};
  const vehRates = b.vehicle ?? {};
  const pkg = cp?.packageData ?? {};

  const total = Number(cp?.total ?? 0);
  const advance = Number(cp?.advanceAmount ?? 0);
  const taxTotal = Number(inv?.totalTaxAmount ?? cp?.totalTaxAmount ?? 0);
  const totalAmount = Number(cp?.totalAmount ?? 0);
  const due = total - advance;

  const orderNumber = b.bookingCode ?? b.bookingId ?? "-";
  const invoiceNumber = inv?.invoiceNumber ?? "-";
  const invoiceDate = fmtDate(inv?.startDate ?? inv?.createdAt);
  const dueDate = fmtDate(inv?.endDate);

  const pickupType = b?.pickupType ?? cp?.selectedPackageData?.pickupType ?? cp?.selectedPackageData?.packageType ?? "-";
  // const vehicleType = vehDisplay?.vehicleType ?? vt?.vehicleType ?? "-";
  //const vehicleNumber = vehDisplay?.vehicleNumber ?? "-";
  const pickupDate = fmtDate(cp?.pickupDate);
  const bookedByRaw = b?.behalfOfName;
  const bookedBy = bookedByRaw &&
    bookedByRaw !== "-" &&
    bookedByRaw.toString().trim() !== ""
    ? bookedByRaw
    : null;

  // ✅ Manager Email (hide if null/empty)
  const managerEmailRaw = b?.manager?.email;
  const managerEmail =
    managerEmailRaw &&
      managerEmailRaw !== "-" &&
      managerEmailRaw.toString().trim() !== ""
      ? managerEmailRaw
      : null;

  // ✅ Cost Center (hide if null/empty)
  const costCenterRaw = b?.costCenter;
  const costCenter =
    costCenterRaw &&
      costCenterRaw !== "-" &&
      costCenterRaw.toString().trim() !== ""
      ? costCenterRaw
      : null;

  const vehicleMaster =
    b?.vehicleMaster ||
    b?.vehicle?.vehicleMaster ||
    null;

  const vehicleName =
    vehicleMaster?.vehicleModelName ||
    vehicleMaster?.vehicleType ||
    "-";

  const vehicleNumber =
    vehicleMaster?.vehicleNumber || "";


  // Trip details
  const tripDetails = b?.tripDetails || `${pickupType} Trip: ${b?.pickupArea || ''} to ${b?.dropPoint || ''}`;
  const tripSheetNumber = cp?.tripSheetNumber ?? "-";
  const garageOpenKm = Number(cp?.garageOpenKm ?? 0);
  const garageCloseKm = Number(cp?.garageCloseKm ?? 0);
  const usageKms = garageCloseKm - garageOpenKm;
  const garageOpenDateTime = fmtDate(cp?.garageOpenDateTime);
  const garageCloseDateTime = fmtDate(cp?.garageCloseDateTime);
  const usageHours = cp?.usageHours ?? "0d 0h 0m";

  // Company details
  const companyName = c?.companyName ?? "-";
  const companyAddress = c?.companyAddress ?? "-";
  const gstNo = c?.gstNo ?? "N/A";

  // -------- Package label (matching PDF format) --------
  const safeJson = (v: any) => {
    if (v == null) return null;
    if (typeof v === "string") {
      const s = v.trim();
      try {
        if (s.startsWith("{") || s.startsWith("[")) return JSON.parse(s);
      } catch { }
      return v;
    }
    return v;
  };

  const findHrsKm = (val: any): { hrs: any; km: any } | null => {
    const v = safeJson(val);
    if (!v) return null;

    if (typeof v === "string") {
      const m = v.match(/(\d+(?:\.\d+)?)\s*hrs?\s*\/\s*(\d+(?:\.\d+)?)\s*km/i);
      if (m) return { hrs: m[1], km: m[2] };
      return null;
    }

    if (Array.isArray(v)) {
      for (const it of v) {
        const r = findHrsKm(it);
        if (r) return r;
      }
      return null;
    }

    if (typeof v === "object") {
      const hrs = v.localPerHour ?? v.localPerHrs ?? v.hours ?? v.hrs ?? v.hr ?? v.packageHours;
      const km = v.localPerKm ?? v.localPerKms ?? v.kms ?? v.km ?? v.packageKm;
      if (hrs != null && km != null) return { hrs, km };

      if (v.packages) {
        const r = findHrsKm(v.packages);
        if (r) return r;
      }
    }
    return null;
  };

  const pkgSpec = findHrsKm(cp?.selectedPackageData) || findHrsKm(pkg?.packages) || findHrsKm(pkg?.packageType) || null;
  const pkgName = pkgSpec ? `${nPlain(pkgSpec.hrs)}hrs/${nPlain(pkgSpec.km)}km` : "";
  const packageMeta = pkgName ? `${pkgName} - ₹${nPlain(cp?.packageAmount)}` : "";
  const packageLabel = `Package Amount(${packageMeta || 'N/A'})`;

  // Driver Batta
  const driverBatta = Number(cp?.selectedPackageData?.driverBattaPerDay ?? 0);
  const driverBattaValue = Number(cp?.extraDriverBeta ?? 0);
  const driDay = cp?.driverBetaDays ?? 1;

  // Additional charges
  const addKmQty = Number(cp?.additionalKms ?? 0);
  const addHrQty = Number(cp?.additionalHours ?? 0);
  const perKmRate = Number(cp?.selectedPackageData?.extraKmRate ?? 0);
  const perHourRate = Number(cp?.selectedPackageData?.extraHourRate ?? 0);
  const additionalKmsAmount = Number(cp?.additionalKmsAmount ?? 0);
  const additionalHoursAmount = Number(cp?.additionalHoursAmount ?? 0);

  // Extra charges
  const extraCharges = Number(cp?.extraCharges ?? 0);
  const chargesTitle = cp?.chargesTitle ?? 'Extra Charges';
  const chargesRemarks = cp?.chargesRemarks ?? '';

  // Discount
  const discountAmount = Number(cp?.discountAmount ?? 0);
  const extraChargesBreakup = Array.isArray(cp?.extraChargesBreakup)
    ? cp.extraChargesBreakup
    : [];

  // Tax details
  const cgstAmount = Number(cp?.cgstAmount ?? 0);
  const sgstAmount = Number(cp?.sgstAmount ?? 0);
  const igstAmount = Number(cp?.igstAmount ?? 0);
  const cgstApplicable = cp?.cgstApplicable === true;
  const sgstApplicable = cp?.sgstApplicable === true;
  const igstApplicable = cp?.igstApplicable === true;

  // Subtotal calculation
  const subtotal = Number(cp?.packageAmount ?? 0) + driverBattaValue + additionalKmsAmount + additionalHoursAmount;

  return `
    <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px; background: #ffffff;">
      


  <!-- Header Section - Using Table for Email Compatibility -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <img src="https://gracecabs.com/images/logo.png"
             alt="Grace Cabs"
             style="max-height: 70px; display: block;" />
      </td>
      <td style="width: 50%; vertical-align: top; text-align: right; font-size: 12px;">
        <div style="margin-bottom: 5px;"><strong>Invoice Number:</strong> ${invoiceNumber}</div>
        <div style="margin-bottom: 5px;"><strong>Invoice Date:</strong> ${invoiceDate}</div>
        <div><strong>Due Date:</strong> ${dueDate}</div>
      </td>
    </tr>
  </table>

      <!-- Invoice Title -->
      <div style="text-align: center; margin: 20px 0;">
        <h2 style="color: #275981; font-weight: bold; margin: 0; font-size: 22px;">Invoice</h2>
      </div>

      <!-- Billing To and Booking Details (Two Column) -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:25px;">
        <tr>
          <!-- Billing To -->
          <td style="width:48%; vertical-align:top; padding-right:2%;">
            <div style="background: rgba(82, 121, 152, 1); color:#fff; padding:8px 12px; font-weight:bold; font-size:13px;">
              Billing To
            </div>
            <div style="padding:12px; border:1px solid #ddd; border-top:none; font-size:12px; line-height:1.6;">
              <div style="font-weight: bold; margin-bottom: 5px;">${companyName}</div>
              <div style="margin-bottom: 5px;">${companyAddress}</div>
              <div style="margin-top:8px;"><strong>GST NO:</strong> ${gstNo}</div>
            </div>
          </td>

          <!-- Booking Details -->
          <td style="width:48%; vertical-align:top; padding-left:2%;">
            <div style="background: rgba(82, 121, 152, 1); color:#fff; padding:8px 12px; font-weight:bold; font-size:13px;">
              Booking Details
            </div>
            <div style="padding:12px; border:1px solid #ddd; border-top:none; font-size:12px;">
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="padding:4px 0; width: 45%;">Booked By</td>
                  <td style="padding:4px 0; text-align: right;">${bookedByUser || "-"}</td>
                </tr>
               ${bookedBy ? `
                <tr>
                  <td style="padding:4px 0;">Guest Name</td>
                  <td style="padding:4px 0; text-align: right;">${bookedBy}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:4px 0;">Order Number</td>
                  <td style="padding:4px 0; text-align: right;">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">Pickup Type</td>
                  <td style="padding:4px 0; text-align: right;">${pickupType}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">Vehicle</td>
                  <td style="padding:4px 0; text-align: right;">   ${vehicleName}${vehicleNumber ? ` &nbsp; ${vehicleNumber}` : ""}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">Pickup Date</td>
                  <td style="padding:4px 0; text-align: right;">${pickupDate}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">Booking Email Id</td>
                  <td style="padding:4px 0; text-align: right; color: rgb(39, 89, 129); font-weight: bold; font-size: 11px;">${u?.email || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">Booking Mobile No</td>
                  <td style="padding:4px 0; text-align: right; color: #4CAF50; font-weight: bold;">${u?.mobile || "-"}</td>
                </tr>
                ${managerEmail ? `
                  <tr>
                    <td style="padding:4px 0;">Manager Email</td>
                    <td style="padding:4px 0; text-align:right;">${managerEmail}</td>
                  </tr>
                  ` : ''}

                  ${costCenter ? `
                  <tr>
                    <td style="padding:4px 0;">Cost Center</td>
                    <td style="padding:4px 0; text-align:right;">${costCenter}</td>
                  </tr>
                  ` : ''}
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- Trip Details -->
      <div style="margin-bottom: 20px;">
        <div style="background: rgba(82, 121, 152, 1); color: white; padding: 8px 12px; font-weight: bold; font-size: 13px;">
          Trip Details
        </div>
        <div style="padding: 12px; border: 1px solid #ddd; border-top: none; font-size: 12px;">
          ${tripDetails}
        </div>
      </div>

      <!-- Trip Sheet Number -->
      <div style="margin-bottom: 20px;">
        <div style="background: rgba(82, 121, 152, 1); color: white; padding: 8px 12px; font-weight: bold; font-size: 13px;">
          Trip Sheet Number
        </div>
        <div style="padding: 12px; border: 1px solid #ddd; border-top: none; font-size: 12px;">
          Trip Sheet Number : ${tripSheetNumber}
        </div>
      </div>

      <!-- Usage Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #333;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;"></th>
            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px; font-weight: bold;">GARAGE OPEN</th>
            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px; font-weight: bold;">GARAGE CLOSE</th>
            <th style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px; font-weight: bold;">USAGE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #333; padding: 8px; font-weight: bold; font-size: 11px;">KM's</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;">${garageOpenKm}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;">${garageCloseKm}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;">${usageKms}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 8px; font-weight: bold; font-size: 11px;">DATE & TIME</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;">${garageOpenDateTime}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;">${garageCloseDateTime}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center; font-size: 11px;">${usageHours} hr(s)</td>
          </tr>
        </tbody>
      </table>

      <!-- Invoice Details Header -->
      <div style="display: flex; justify-content: space-between; background: rgba(82, 121, 152, 1); color: white; padding: 8px 12px; font-weight: bold; font-size: 13px; margin-bottom: 0;">
        <span>Invoice Details</span>
        <span>Amount (Rs)</span>
      </div>

      <!-- Invoice Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          <!-- Package Amount -->
          <tr>
            <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">${packageLabel}</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px;">${nINR(cp?.packageAmount)}</td>
          </tr>

          <!-- Driver Batta (if exists) -->
          ${driverBattaValue > 0 ? `
          <tr>
            <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">DriverBatta (${driverBatta} * ${driDay})</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px;">${nINR(driverBattaValue)}</td>
          </tr>
          ` : ''}

          <!-- Additional KMs (if exists) -->
          ${additionalKmsAmount > 0 ? `
          <tr>
            <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Additional KMs Charges (${addKmQty} km * ${perKmRate})</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px;">${nINR(additionalKmsAmount)}</td>
          </tr>
          ` : ''}

          <!-- Additional Hours (if exists) -->
          ${additionalHoursAmount > 0 ? `
          <tr>
            <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Additional Hours Charges (${addHrQty} hrs * ${perHourRate})</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px;">${nINR(additionalHoursAmount)}</td>
          </tr>
          ` : ''}

          <!-- Sub Total -->
          <tr style="background: #f5f5f5; border-top: 1px solid #ddd;">
            <td style="padding: 8px 12px; font-weight: 600; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Sub Total</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-right: 1px solid #ddd; font-size: 12px;">${nINR(subtotal)}</td>
          </tr>

          <!-- Extra Charges (if exists) -->
          // ${extraCharges > 0 ? `
          // <tr>
          //   <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Extra Charges ${chargesTitle}${chargesRemarks ? ` - ${chargesRemarks}` : ''}</td>
          //   <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px;">${nINR(extraCharges)}</td>
          // </tr>
          // ` : ''}

          ${extraChargesBreakup.length > 0
      ? extraChargesBreakup
        .map((c: any) => `
        <tr>
          <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">
            ${c.title}${c.remarks ? ` - ${c.remarks}` : ''}
          </td>
          <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px;">
            ${nINR(c.amount)}
          </td>
        </tr>
      `)
        .join("")
      : ""}

          <!-- Discount (if exists) -->
          ${discountAmount > 0 ? `
          <tr>
            <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Discount Amount</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px; color: red;">-${nINR(discountAmount)}</td>
          </tr>
          ` : ''}

          <!-- CGST (if exists) -->
          ${cgstAmount > 0 ? `
          <tr>
            <td style="padding: 8px 12px; padding-left: 24px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 11px; color: #666;">CGST</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">${nINR(cgstAmount)}</td>
          </tr>
          ` : ''}

          <!-- SGST (if exists) -->
          ${sgstAmount > 0 ? `
          <tr>
            <td style="padding: 8px 12px; padding-left: 24px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 11px; color: #666;">SGST</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">${nINR(sgstAmount)}</td>
          </tr>
          ` : ''}

          <!-- IGST (if exists) -->
          ${igstAmount > 0 ? `
          <tr>
            <td style="padding: 8px 12px; padding-left: 24px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 11px; color: #666;">IGST</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">${nINR(igstAmount)}</td>
          </tr>
          ` : ''}

          <!-- Total Tax (if no individual tax breakdown) -->
          ${taxTotal > 0 && (cgstAmount === 0 && sgstAmount === 0 && igstAmount === 0) ? `
          <tr>
            <td style="padding: 8px 12px; padding-left: 24px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 11px; color: #666;">Tax</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">${nINR(taxTotal)}</td>
          </tr>
          ` : ''}

          <!-- Total Amount -->
          <tr style="background: #f5f5f5; border-top: 1px solid #ddd;">
            <td style="padding: 8px 12px; font-weight: 600; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Total Amount</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-right: 1px solid #ddd; font-size: 12px;">${nINR(total)}</td>
          </tr>

          <!-- Advance Paid (if exists) -->
          ${advance > 0 ? `
          <tr>
            <td style="padding: 8px 12px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px;">Advance Paid</td>
            <td style="padding: 8px 12px; text-align: right; border-right: 1px solid #ddd; font-size: 12px; color: red;">-${nINR(advance)}</td>
          </tr>
          ` : ''}

          <!-- Total Due -->
          <tr style="border-top: 2px solid #333; border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 12px; font-weight: bold; font-size: 16px; color: #333; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">Total Due</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: bold; font-size: 16px; color: #4CAF50; border-right: 1px solid #ddd;">${nINR(due)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Footer Information -->
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; line-height: 1.4; color: #666;">
        <div style="margin-bottom: 2px;"><strong>Regd.Office:</strong> Grace Cabs Pvt. Ltd., 7/621 NESAMANI NAGAR, PERUMBAKKAM, CHENNAI - 600100</div>
        <div style="margin-bottom: 2px;"><strong>Website:</strong> gracecabs.com</div>
        <div style="margin-bottom: 2px;"><strong>GSTIN:</strong> 33AAMCG2518C1Z0</div>
        <div style="margin-bottom: 2px;"><strong>PAN No.:</strong> AAMCG2518C</div>
        <div style="margin-bottom: 2px;"><strong>SAC:</strong> 996609</div>
        <div style="margin-top: 10px; font-style: italic;">It is a system generated invoice which does not need a signature</div>
      </div>
    </div>
  `;
}


export const createClosePending = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const {
      tripSheetNumber,
      pickupDate,
      garageKms,
      usageHours,
      garageOpenKm,
      garageCloseKm,
      garageOpenDateTime,
      garageCloseDateTime,
      guestKms,
      driverBetaDays,
      guestOpenKm,
      guestCloseKm,
      chargesTitle,
      chargesRemarks,
      guestOpenDateTime,
      guestCloseDateTime,
      hideGuestDetails,
      packageDataId,
      extraDriverBeta,
      additionalKms,
      additionalHours,
      discountAmount,
      advanceAmount,
      cgstApplicable,
      igstApplicable,
      sgstApplicable,
      packageAmount,
      selectedPackageData,
      additionalKmsAmount,
      additionalHoursAmount,
      totalAmount,
      extraCharges,
      total,
      totalDue,
      cgstAmount,
      igstAmount,
      sgstAmount,
      totalTaxAmount,
      bookingId,
      companyId,
      extraChargesBreakup,
    } = req.body;


    if (!pickupDate) {
      return res.status(400).json({ success: false, message: 'pickupDate is required' });
    }
    if (!packageDataId) {
      return res.status(400).json({ success: false, message: 'packageDataId is required' });
    }

    const packageData = await PackageData.findByPk(packageDataId);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'PackageData not found with provided packageDataId'
      });
    }

    const booking = await Booking.findOne({
      where: { bookingId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["companyId"]
        }
      ]
    });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid bookingId, Booking not found'
      });
    }



    const newClosePending = await ClosePending.create({
      tripSheetNumber: tripSheetNumber ? String(tripSheetNumber).trim() : null,

      pickupDate,
      garageKms: garageKms || 0,
      usageHours: usageHours,
      garageOpenKm: garageOpenKm || 0,
      garageCloseKm: garageCloseKm || 0,
      garageOpenDateTime,
      garageCloseDateTime,
      driverBetaDays: driverBetaDays || 0,
      guestKms: guestKms || 0,
      guestOpenKm: guestOpenKm || 0,
      guestCloseKm: guestCloseKm || 0,
      guestOpenDateTime,
      guestCloseDateTime,
      selectedPackageData,
      hideGuestDetails: hideGuestDetails || false,
      packageDataId,
      extraDriverBeta: extraDriverBeta || 0.00,
      chargesRemarks,
      chargesTitle,
      additionalKms: additionalKms || 0,
      additionalHours: additionalHours || 0,
      discountAmount: discountAmount || 0,
      advanceAmount: advanceAmount || 0,
      cgstApplicable: cgstApplicable || false,
      igstApplicable: igstApplicable || false,
      sgstApplicable: sgstApplicable || false,
      packageAmount: packageAmount || 0.00,
      additionalKmsAmount: additionalKmsAmount || 0.00,
      additionalHoursAmount: additionalHoursAmount || 0.00,
      totalAmount: totalAmount || 0.00,
      extraCharges: extraCharges || 0.00,
      total: total || 0.00,
      extraChargesBreakup: extraChargesBreakup || [],
      totalDue: totalDue || 0.00,
      cgstAmount: cgstAmount || 0.00,
      igstAmount: igstAmount || 0.00,
      sgstAmount: sgstAmount || 0.00,
      totalTaxAmount: totalTaxAmount || 0.00,
      companyId: companyId
    });


    // const payment = await Payment.create({
    //     transactionId: booking.bookingCode,      
    //     status: ORDER.STATUS.PENDING,            
    //     amount: newClosePending.totalAmount,
    //     tax: newClosePending.totalTaxAmount || 0
    // })

    const createdClosePending = await ClosePending.findByPk(newClosePending.closependingId, {
      include: [{ model: PackageData, as: 'packageData' }]
    });

    if (!createdClosePending) {
      return res.status(404).json({
        success: false,
        message: 'Created ClosePending record not found'
      });
    }

    const updateConfirm = await Booking.update(
      {
        // paymentId: payment.paymentId,
        confirmStatus: ORDER.STATUS.CLOSED,
        bookingStatus: ORDER.STATUS.COMPLETED
      },
      {
        where: { bookingId: bookingId },
      }
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 10);

    const finalCompanyId = booking?.companyId || booking?.user?.companyId;

    if (!finalCompanyId) {
      throw new Error("companyId not found in booking or user");
    }


    const invoice = await Invoice.create({
      bookingId,
      //     paymentId: payment.paymentId,
      userId: booking.userId,
      vehicleTypeId: booking.vehicleTypeId,
      //   companyId: booking?.user?.companyId,
      companyId: finalCompanyId,
      invoiceStatus: ORDER.STATUS.PENDING,
      startDate,
      endDate,
      invoiceAmount: newClosePending.totalDue,
      closePendingId: newClosePending.closependingId
    });

    const invoiceWithDetails = await Invoice.findOne({
      where: { invoiceId: invoice.invoiceId },
      include: [
        { model: User, as: "user", required: false },
        { model: VehicleType, required: false },
        { model: Company, required: false },
      ],
    });

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    // Generate PDF Invoice using the detailed generateInvoiceHTML
    let pdfPath: string | null = null;
    let pdfFileName: string | null = null;
    let emailInvoiceBlock = "";

    try {
      // Get complete booking data for PDF generation with all necessary includes
      const completeBooking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: VehicleType,
            as: "vehicleType",
            required: false,
          },
          {
            model: Vehicle,
            as: "vehicle",
            required: false,
            attributes: ["localPerKm", "localPerHour"]
          },
          {
            model: Payment,
            as: "payment",
            required: false,
            attributes: ["paymentId", "status", "paymentMode", "amount"],
            include: [
              {
                model: Invoice,
                as: "invoices",
                required: false,
                attributes: [
                  "invoiceId",
                  "invoiceNumber",
                  "invoiceAmount",
                  "invoiceStatus",
                  "startDate",
                  "endDate"
                ],
                include: [
                  {
                    model: ClosePending,
                    as: "closePending",
                    required: false,
                    attributes: [
                      "closependingId",
                      "pickupDate",
                      "garageKms",
                      "garageOpenDateTime",
                      "garageCloseDateTime",
                      "guestKms",
                      "guestOpenDateTime",
                      "guestCloseDateTime",
                      "additionalKms",
                      "additionalHours",
                      "discountAmount",
                      "advanceAmount",
                      "packageAmount",
                      "totalAmount",
                      "total",
                      "totalDue",
                      "extraCharges",
                      "chargesTitle",
                      "cgstApplicable",
                      "igstApplicable",
                      "sgstApplicable",
                      "additionalKmsAmount",
                      "additionalHoursAmount",
                      "extraChargesBreakup",
                    ],
                    include: [
                      {
                        model: PackageData,
                        as: "packageData",
                        required: false,
                        attributes: ["packageDataId", "packageType", "companyId", "packages", "isDeleted", "createdAt"]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            model: User,
            as: "user",
            required: false,
            attributes: ["userId", "username", "email", "mobile", "city",
              "state", "country", "pinCode", "companyId", "userAddress"],
            include: [
              {
                model: Company,
                as: "company",
                required: false,
                attributes: [
                  "companyId",
                  "companyName",
                  "companyAddress",
                  "managerEmail",
                  "gstNo",
                  "managerApproval"
                ],
              },
            ],

          },
          {
            model: User,
            as: "manager",
            required: false,
            // attributes: ["firstName", "lastName", "email"]
            attributes: ["userId", "username", "email"]
          },
          {
            model: Vehicle,
            as: "vehicle",
            required: false,
            attributes: ["localPerKm"],
            include: [
              {
                model: VehicleMaster,
                as: "vehicleMaster",
                required: false,
                attributes: ["vehicleNumber", "vehicleModelName", "vehicleType"],
              },
            ],
          },
          {
            model: Drivers,
            as: "driver",
            required: false,
            attributes: [
              "driverId",
              "driverName",
              "driverEmail",
              "phno",
              "city",
              "state",
              "country",
              "address",
              "pincode",
              "licenseNo",
              "ratings"
            ],
          },
        ],
      });
      let bookingCompany = null;

      if (completeBooking?.companyId) {
        bookingCompany = await Company.findByPk(completeBooking.companyId, {
          attributes: ["companyId", "companyName", "companyAddress", "gstNo"]
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

      console.log("✅ CLOSEPENDING VEHICLE", {
        vehicleMasterId: booking.vehicleMasterId,
        vehicleNumber: correctVehicleMaster?.vehicleNumber,
        vehicleModel: correctVehicleMaster?.vehicleModelName,
      });

      if (completeBooking) {
        // Create a temporary booking object with the new closePending data
        // since the associations might not be properly linked yet
        const bookingWithClosePending = {
          ...completeBooking.get({ plain: true }), // ✅ BETTER THAN toJSON()
          company: bookingCompany,
          selfName: completeBooking.getDataValue("selfName"),
          vehicleMaster: correctVehicleMaster?.toJSON?.() ?? correctVehicleMaster,

          payment: {
            ...completeBooking.payment?.toJSON(),
            invoices: [
              {
                ...invoice.toJSON(),
                closePending: {
                  ...newClosePending.toJSON(),
                  packageData: createdClosePending.packageData?.toJSON()
                }
              }
            ]
          }
        };
        //             emailInvoiceBlock = buildEmailInvoiceBlockFromRaw(
        //  // completeBooking?.toJSON?.() ?? completeBooking,
        //    bookingWithClosePending, 
        //   { ...newClosePending.toJSON?.(), packageData: createdClosePending.packageData?.toJSON?.() },
        //   invoice?.toJSON?.() ?? invoice
        // );
        //                 emailInvoiceBlock = emailInvoiceBlock.replace(
        //   "{{LOGO_SRC}}",
        //   "cid:grace_logo"
        // );

        // Map booking data to invoice format using the same function as generateInvoicePDF
        const invoiceData = mapBookingToInvoiceData(bookingWithClosePending);

        // Generate HTML content using the detailed template
        const htmlContent = generateInvoiceHTML(invoiceData);

        // Use same HTML for email body
        emailInvoiceBlock = htmlContent;

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

        // wait for logo/image load
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Generate PDF
        pdfFileName = `invoice_${bookingId}_${Date.now()}.pdf`;
        pdfPath = path.join(uploadsDir, pdfFileName);

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
        console.log(`✅ PDF generated successfully: ${pdfFileName}`);
      }
    } catch (pdfError) {
      console.error('❌ Error generating PDF:', pdfError);
      // Continue without PDF if generation fails
      pdfPath = null;
      pdfFileName = null;
    }

    // 🔹 Get email template code dynamically
    const emailConfigs = await fetchAllEmailConfs();
    const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "USER_INVOICE_EMAIL");

    if (invoiceWithDetails?.user?.email && orderConfirmConf) {
      const BASE_URL = config.baseurl.apibaseurl;
      const payLink = `${BASE_URL}/invoice/user-invoice-details/${booking.userId}`;

      try {
        let needEmail = false;

        if (booking.user?.companyId) {
          const company = await Company.findByPk(
            booking.user.companyId,
            { attributes: ["needEmail"] }
          );
          needEmail = company?.needEmail === true;
        }
        if (needEmail) {
          const logoPath = path.join(process.cwd(), "uploads", "logo.png");

          await sendEmailFromTemplate(orderConfirmConf.emailCode, {
            UserName: invoiceWithDetails.user.username ?? "",
            UserEmail: invoiceWithDetails.user.email ?? "",
            OrderNumber: booking.bookingCode ?? "",
            // InvoiceTemple: `
            //     Amount: ${invoiceWithDetails.invoiceAmount}<br/>
            // `,
            InvoiceTemple: emailInvoiceBlock,
            PayLink: `<a href="${payLink}">Click here to Pay</a>`
            //  }, pdfPath && pdfFileName ? [{ path: pdfPath, filename: pdfFileName }] : []);
          }, [
            ...(pdfPath && pdfFileName
              ? [{ path: pdfPath, filename: pdfFileName }]
              : []),
            // {
            //   filename: "logo.png",
            //   path: logoPath,
            //   cid: "grace_logo", // MUST match img src
            // },
          ]);
          console.log(`✅ Email sent successfully to ${invoiceWithDetails.user.email}`);
        }
        else {
          const logoPath = path.join(process.cwd(), "uploads", "logo.png");

          await sendEmailFromTemplate(orderConfirmConf.emailCode, {
            UserName: invoiceWithDetails.user.username ?? "",
            UserEmail: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
            OrderNumber: booking.bookingCode ?? "",
            // InvoiceTemple: `
            //     Amount: ${invoiceWithDetails.invoiceAmount}<br/>
            // `,
            InvoiceTemple: emailInvoiceBlock,
            PayLink: `<a href="${payLink}">Click here to Pay</a>`
            //     }, pdfPath && pdfFileName ? [{ path: pdfPath, filename: pdfFileName }] : []);
          }, [
            ...(pdfPath && pdfFileName
              ? [{ path: pdfPath, filename: pdfFileName }]
              : []),
            // {
            //   filename: "logo.png",
            //   path: logoPath,
            //   cid: "grace_logo", // MUST match img src
            // },
          ]);
          console.log(`✅ Email sent successfully}`);
        }
        // Send email with PDF attachment if available

      } catch (emailError) {
        console.error('❌ Error sending email:', emailError);
        // Continue even if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'ClosePending & Payment created successfully',
      data: {
        closePending: createdClosePending,
        invoice,
        invoiceWithDetails,
        pdfGenerated: !!pdfPath,
        pdfFileName: pdfFileName
      }
    });

  } catch (error) {
    console.error('Error creating ClosePending:', error);

    if (error instanceof Error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid packageDataId provided - foreign key constraint failed'
        });
      }
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.message
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
const n = (v: any) => {
  const num = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : 0;
};

const getMonthRange = (invoiceMonth: string) => {
  // invoiceMonth: "YYYY-MM"
  const [y, m] = invoiceMonth.split("-").map((x) => parseInt(x, 10));
  const start = new Date(y, (m || 1) - 1, 1, 0, 0, 0);
  const end = new Date(y, (m || 1), 0, 23, 59, 59); // last day of that month
  return { start, end };
};

export function buildMonthlyInvoiceEmailBlock(monthly: any, inv: any) {
  const total = Number(monthly?.finalTotal ?? 0);
  const advance = Number(monthly?.advance ?? 0);
  const due = Number(monthly?.balanceDue ?? 0);
  const tax = Number(monthly?.totalTaxAmount ?? 0);
  const subTotal = Number(monthly?.netTotal ?? 0);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.6">

    <table width="100%" style="border-collapse:collapse;margin-bottom:10px">
      <tr>
        <td><strong>Invoice Number:</strong> ${inv?.invoiceNumber ?? "-"}</td>
        <td><strong>Invoice Date:</strong> ${monthly?.invoiceDate ?? "-"}</td>
        <td><strong>Invoice Month:</strong> ${monthly?.invoiceMonth ?? "-"}</td>
      </tr>
    </table>

    <table width="100%" style="border-collapse:collapse;margin-top:4px">
      <tr>
        <td valign="top" style="width:50%;padding:10px;border:1px solid #e5e5e5;background:#f6f6f6">
          <div style="font-weight:bold;margin-bottom:6px">Billing To</div>
          <div>
            ${monthly?.companyName}<br/>
            Vehicle No: ${monthly?.vehicleNumber}<br/>
            Route: ${monthly?.route ?? "-"}
          </div>
        </td>
        <td valign="top" style="width:50%;padding:10px;border:1px solid #e5e5e5;background:#f6f6f6">
          <div style="font-weight:bold;margin-bottom:6px">Invoice Details</div>
          <table width="100%">
            <tr><td>Vehicle Type</td><td>${monthly?.vehicleTypeName}</td></tr>
            <tr><td>Package Amount</td><td>₹${monthly?.packageAmount}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="margin:14px 0 6px;font-weight:bold">Fare Summary</div>
    <table width="100%" style="border-collapse:collapse">
      <tr><td>Package Amount</td><td align="right">₹${monthly?.packageAmount}</td></tr>
      <tr><td>Extra KM Charges</td><td align="right">₹${monthly?.extraKmAmount}</td></tr>
      <tr><td>Extra Days Charges</td><td align="right">₹${monthly?.extraDaysAmount}</td></tr>
      <tr><td>Extra Charges</td><td align="right">₹${monthly?.extraChargesInputAmount}</td></tr>
      <tr><td>Discount</td><td align="right">-₹${monthly?.discount}</td></tr>

      <tr><td><strong>Sub Total</strong></td><td align="right"><strong>₹${subTotal}</strong></td></tr>
      <tr><td>Tax</td><td align="right">₹${tax}</td></tr>

      <tr><td><strong>Total Amount</strong></td><td align="right"><strong>₹${total}</strong></td></tr>
      <tr><td>Advance Paid</td><td align="right">-₹${advance}</td></tr>
      <tr><td><strong>Total Due</strong></td><td align="right"><strong>₹${due}</strong></td></tr>
    </table>

  </div>
  `;
}
// ✅ FIXED: Remove all rounding - store exact amounts from frontend

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// export const createMonthlyInvoice = async (req: Request, res: Response) => {
//   const sequelize = MonthlyInvoice.sequelize as Sequelize;

//   try {
//     const {
//       invoiceDate,
//       invoiceMonth,
//       companyId,
//       vehicleTypeId,
//       vehicleNumber,
//       route,
//       packageDataId,
//       packageDetails,

//       // ✅ Counts from frontend
//       extraKm,
//       extraDays,
//       extraHrs,

//       extraChargeType,
//       extraChargesInputAmount,
//       discount,
//       advance,
//       selectedTaxIds,

//       // ✅ CRITICAL: Use pre-calculated amounts from frontend
//       packageAmount,
//       extraKmAmount,
//       extraDaysAmount,
//       extraHrsAmount,
//       netTotal,
//       taxes,
//       totalTaxAmount,
//       finalTotal,
//       balanceDue,
//     } = req.body;

//     // ✅ Log to verify frontend values are received
//     console.log("📥 Received from frontend:", {
//       packageAmount,
//       extraKmAmount,
//       extraDaysAmount,
//       extraHrsAmount,
//       netTotal,
//       finalTotal,
//       balanceDue
//     });

//     // ✅ Basic validation
//     if (!invoiceDate || !invoiceMonth || !companyId || !vehicleTypeId || !vehicleNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "invoiceDate, invoiceMonth, companyId, vehicleTypeId, vehicleNumber are required",
//       });
//     }

//     // ✅ Validate masters
//     const company = await Company.findOne({ where: { companyId } });
//     if (!company) return res.status(404).json({ success: false, message: "Company not found" });

//     const vt = await VehicleType.findOne({ where: { vehicleTypeId } });
//     if (!vt) return res.status(404).json({ success: false, message: "VehicleType not found" });

//     // ✅ USE FRONTEND CALCULATED VALUES DIRECTLY - NO RECALCULATION!
//     const pkgAmount = toNum(packageAmount);
//     const extraKmAmt = toNum(extraKmAmount);
//     const extraDaysAmt = toNum(extraDaysAmount);
//     const extraHrsAmt = toNum(extraHrsAmount);

//     const disc = toNum(discount);
//     const adv = toNum(advance);
//     const extraChargeAmt = toNum(extraChargesInputAmount);

//     const netTotalValue = toNum(netTotal);
//     const totalTaxAmt = toNum(totalTaxAmount);
//     const finalTotalValue = toNum(finalTotal);
//     const balanceDueValue = toNum(balanceDue);

//     // ✅ Counts (can be integers for display)
//     const extraKmCount = toNum(extraKm);
//     const extraDaysCount = toNum(extraDays);
//     const extraHrsCount = toNum(extraHrs);

//     // ✅ Extract rates from packageDetails (for reference only - NOT for calculation)
//     const extraKmRate = toNum(packageDetails?.extraKmRate);
//     const extraHourRate = toNum(packageDetails?.extraHourRate);

//     // ✅ Log to verify values before saving
//     console.log("💾 Values to be stored:", {
//       pkgAmount,
//       extraKmAmt,
//       extraDaysAmt,
//       extraHrsAmt,
//       netTotalValue,
//       totalTaxAmt,
//       finalTotalValue,
//       balanceDueValue
//     });

//     // ✅ Get tax details if needed (for validation)
//     const allowTax =
//       String((company as any).allowTax || "").toLowerCase() === "yes" ||
//       String((company as any).allowTax || "").toLowerCase() === "true";

//     // ✅ Validate taxes array matches selectedTaxIds
//     let taxRows: any[] = [];
//     if (allowTax && Array.isArray(taxes) && taxes.length) {
//       taxRows = taxes; // Use frontend calculated taxes
//     }

//     const { start, end } = getMonthRange(invoiceMonth);

//     // ✅ TRANSACTION
//     const result = await sequelize.transaction(async (t) => {
//       const createdMonthly = await MonthlyInvoice.create(
//         {
//           invoiceDate,
//           invoiceMonth,

//           companyId,
//           companyName: (company as any).companyName,

//           vehicleTypeId,
//           vehicleTypeName: (vt as any).vehicleType,

//           vehicleNumber,
//           route,

//           packageDataId: packageDataId || null,
//           packageDetails: packageDetails || null,

//           // ✅ Counts
//           extraKm: extraKmCount,
//           extraDays: extraDaysCount,
//           extraHrs: extraHrsCount,

//           // ✅ Rates (store for reference, NOT for calculation)
//           extraHourRate: extraHourRate,

//           extraChargeType: extraChargeType || "toll",
//           extraChargesInputAmount: extraChargeAmt,

//           discount: disc,
//           advance: adv,

//           // ✅ EXACT AMOUNTS FROM FRONTEND - NO ROUNDING!
//           packageAmount: pkgAmount,
//           extraKmAmount: extraKmAmt,
//           extraDaysAmount: extraDaysAmt,
//           extraHrsAmount: extraHrsAmt,

//           netTotal: netTotalValue,
//           taxes: taxRows,
//           totalTaxAmount: totalTaxAmt,

//           finalTotal: finalTotalValue,
//           balanceDue: balanceDueValue,

//           closeStatus: 0,
//         },
//         { transaction: t }
//       );

//       const inv = await Invoice.create(
//         {
//           startDate: start,
//           endDate: end,

//           invoiceAmount: balanceDueValue, // ✅ Exact value
//           invoiceStatus: "0",

//           companyId,
//           vehicleTypeId,

//           monthlyInvoiceId: (createdMonthly as any).monthlyInvoiceId,
//         },
//         { transaction: t }
//       );

//       await (createdMonthly as any).update({ invoiceId: (inv as any).invoiceId }, { transaction: t });

//       return { createdMonthly, inv };
//     });

//     // ✅ PDF GENERATION (optional)
//     let pdfFileName: string | null = null;

//     try {
//       const BASE_URL = "http://localhost:5000";
//       const pdfResponse = await axios.post(
//         `${BASE_URL}/app/appInvoiceRoutes/month-generate-invoice-pdf`,
//         { monthlyInvoiceId: (result.createdMonthly as any).monthlyInvoiceId },
//         { headers: { Authorization: req.headers.authorization } }
//       );
//       pdfFileName = pdfResponse.data?.data?.fileName || null;
//       console.log("✅ Branded monthly PDF generated:", pdfFileName);
//     } catch (err) {
//       console.error("❌ Error calling month-generate-invoice-pdf:", err);
//     }

//     // ✅ EMAIL (optional)
//     try {
//       const emailConfigs = await fetchAllEmailConfs();
//       const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "MONTHLY_BOOKING");

//       if (orderConfirmConf && pdfFileName) {
//         const monthlyPdfPath = path.join(process.cwd(), "uploads", "invoices", "monthly", pdfFileName);

//         await sendEmailFromTemplate(
//           orderConfirmConf.emailCode,
//           {
//             to: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
//             OrderNumber: (result.inv as any).invoiceNumber,
//             BookingNumber: (result.createdMonthly as any).monthlyInvoiceId,
//             InvoiceTemple: "",
//           },
//           [{ path: monthlyPdfPath, filename: pdfFileName }]
//         );

//         console.log("✅ Monthly invoice email sent with branded PDF");
//       }
//     } catch (e) {
//       console.error("❌ Monthly email send failed:", e);
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Monthly invoice + Invoice created",
//       data: {
//         monthlyInvoice: result.createdMonthly,
//         invoice: result.inv,
//       },
//     });
//   } catch (error: any) {
//     console.error("createMonthlyInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };
export const createMonthlyInvoice = async (req: Request, res: Response) => {
  const sequelize = MonthlyInvoice.sequelize as Sequelize;

  try {
    const {
      invoiceDate,
      invoiceMonth,
      companyId,
      routes,
    } = req.body;

    if (!invoiceDate || !invoiceMonth || !companyId) {
      return res.status(400).json({
        success: false,
        message: "invoiceDate, invoiceMonth, and companyId are required",
      });
    }

    const company = await Company.findOne({ where: { companyId } });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    // Normalize input routes: if routes is array, use it; otherwise fallback to single route object from body
    let rawRoutes: any[] = [];
    if (Array.isArray(routes) && routes.length > 0) {
      rawRoutes = routes;
    } else if (req.body.vehicleTypeId || req.body.vehicleNumber) {
      rawRoutes = [req.body];
    }

    if (rawRoutes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one route item is required for the invoice",
      });
    }

    const routeItemsToSave: any[] = [];
    let grandNetTotal = 0;
    let grandFinalTotal = 0;
    let grandAdvance = 0;
    let grandExtraCharges = 0;
    let grandDiscount = 0;
    const combinedTaxMap: Record<string, { taxName: string; taxPercent: number; amount: number }> = {};

    for (const rItem of rawRoutes) {
      const normalizedPkgDetails = normalizePackageDetails(rItem.packageDetails, rItem);

      const pkgAmount = toNum(rItem.packageAmount || normalizedPkgDetails.amount);
      const extraKmAmt = toNum(rItem.extraKmAmount);
      const extraDaysAmt = toNum(rItem.extraDaysAmount);
      const extraHrsAmt = toNum(rItem.extraHrsAmount);
      const extraHourRateVal = toNum(rItem.extraHourRate || normalizedPkgDetails.extraHourRate);
      const disc = toNum(rItem.discount);
      const adv = toNum(rItem.advance);

      const extraKmCount = toNum(rItem.extraKm);
      const extraDaysCount = toNum(rItem.extraDays);
      const extraHrsCount = toNum(rItem.extraHrs);

      const extraChargesArr = Array.isArray(rItem.extraCharges)
        ? rItem.extraCharges.map((x: any) => ({
          type: String(x.type || "other"),
          amount: toNum(x.amount),
        }))
        : [];
      const extraChargeAmt = extraChargesArr.reduce((sum: number, x: any) => sum + x.amount, 0);

      const netTotalVal = toNum(rItem.netTotal) || Math.max(0, pkgAmount + extraKmAmt + extraDaysAmt + extraHrsAmt - disc);

      const itemTaxes = Array.isArray(rItem.taxes) ? rItem.taxes : [];
      const totalTaxAmt = itemTaxes.reduce((s: number, t: any) => s + toNum(t.amount), 0);
      const finalTotalVal = toNum(rItem.finalTotal) || (netTotalVal + totalTaxAmt + extraChargeAmt);
      const itemBalanceDue = Math.max(0, finalTotalVal - adv);

      // Accumulate into combined header tax map
      itemTaxes.forEach((t: any) => {
        const key = t.taxId || t.taxName || "Tax";
        if (!combinedTaxMap[key]) {
          combinedTaxMap[key] = { taxName: t.taxName || "Tax", taxPercent: toNum(t.taxPercent), amount: 0 };
        }
        combinedTaxMap[key].amount += toNum(t.amount);
      });

      grandNetTotal += netTotalVal;
      grandFinalTotal += finalTotalVal;
      grandAdvance += adv;
      grandExtraCharges += extraChargeAmt;
      grandDiscount += disc;

      routeItemsToSave.push({
        route: rItem.route || "",
        vehicleTypeId: rItem.vehicleTypeId || null,
        vehicleTypeName: rItem.vehicleTypeName || "",
        vehicleNumber: rItem.vehicleNumber || "",
        packageDataId: rItem.packageDataId || normalizedPkgDetails.packageId || null,
        packageDetails: normalizedPkgDetails,
        packageAmount: pkgAmount,
        extraKm: extraKmCount,
        extraKmAmount: extraKmAmt,
        extraDays: extraDaysCount,
        extraDaysAmount: extraDaysAmt,
        extraHrs: extraHrsCount,
        extraHourRate: extraHourRateVal,
        extraHrsAmount: extraHrsAmt,
        extraChargeType: rItem.extraChargeType || "toll",
        extraChargesInputAmount: extraChargeAmt,
        extraCharges: extraChargesArr,
        discount: disc,
        advance: adv,
        netTotal: netTotalVal,
        taxes: itemTaxes,
        totalTaxAmount: totalTaxAmt,
        finalTotal: finalTotalVal,
        balanceDue: itemBalanceDue,
      });
    }

    const headerTaxRows = Object.values(combinedTaxMap);
    const headerTotalTaxAmount = headerTaxRows.reduce((s, t) => s + t.amount, 0);
    const grandBalanceDue = Math.max(0, grandFinalTotal - grandAdvance);

    const firstRoute = routeItemsToSave[0];
    const { start, end } = getMonthRange(invoiceMonth);

    // Run EVERYTHING in ONE Sequelize Transaction
    const result = await sequelize.transaction(async (t) => {
      const createdMonthly = await MonthlyInvoice.create(
        {
          invoiceDate,
          invoiceMonth,
          companyId,
          companyName: (company as any).companyName,

          // Backward compatibility fallback fields from first route item
          vehicleTypeId: firstRoute.vehicleTypeId,
          vehicleTypeName: firstRoute.vehicleTypeName,
          vehicleNumber: firstRoute.vehicleNumber,
          route: firstRoute.route,
          packageDataId: firstRoute.packageDataId,
          packageDetails: firstRoute.packageDetails,
          extraKm: firstRoute.extraKm,
          extraDays: firstRoute.extraDays,
          extraHrs: firstRoute.extraHrs,
          extraHourRate: firstRoute.extraHourRate,
          extraChargeType: firstRoute.extraChargeType,
          extraChargesInputAmount: grandExtraCharges,
          extraCharges: firstRoute.extraCharges,
          discount: grandDiscount,
          advance: grandAdvance,
          packageAmount: firstRoute.packageAmount,
          extraKmAmount: firstRoute.extraKmAmount,
          extraDaysAmount: firstRoute.extraDaysAmount,
          extraHrsAmount: firstRoute.extraHrsAmount,

          // Aggregated Header Totals
          netTotal: grandNetTotal,
          taxes: headerTaxRows,
          totalTaxAmount: headerTotalTaxAmount,
          finalTotal: grandFinalTotal,
          balanceDue: grandBalanceDue,
          closeStatus: 0,
        },
        { transaction: t }
      );

      // Create linked Invoice record
      const inv = await Invoice.create(
        {
          startDate: start,
          endDate: end,
          invoiceAmount: grandBalanceDue,
          invoiceStatus: "0",
          companyId,
          vehicleTypeId: firstRoute.vehicleTypeId,
          monthlyInvoiceId: (createdMonthly as any).monthlyInvoiceId,
        },
        { transaction: t }
      );

      await (createdMonthly as any).update(
        { 
          invoiceId: (inv as any).invoiceId,
          monthlyBookingCode: (inv as any).invoiceNumber,
        },
        { transaction: t }
      );

      // Create all Route Items linked to createdMonthly.monthlyInvoiceId
      const itemsWithHeaderId = routeItemsToSave.map((item) => ({
        ...item,
        monthlyInvoiceId: (createdMonthly as any).monthlyInvoiceId,
      }));

      const createdItems = await MonthlyInvoiceItems.bulkCreate(itemsWithHeaderId, {
        transaction: t,
      });

      return { createdMonthly, inv, createdItems };
    });

    // PDF GENERATION
    let pdfFileName: string | null = null;
    try {
      const BASE_URL = "http://localhost:5000";
      const pdfResponse = await axios.post(
        `${BASE_URL}/app/appInvoiceRoutes/month-generate-invoice-pdf`,
        { monthlyInvoiceId: (result.createdMonthly as any).monthlyInvoiceId },
        { headers: { Authorization: req.headers.authorization } }
      );
      pdfFileName = pdfResponse.data?.data?.fileName || null;
      console.log("✅ Branded monthly PDF generated:", pdfFileName);
    } catch (err) {
      console.error("❌ Error calling month-generate-invoice-pdf:", err);
    }

    // EMAIL
    try {
      const emailConfigs = await fetchAllEmailConfs();
      const orderConfirmConf = emailConfigs.find(
        (conf: any) => conf.emailCode === "MONTHLY_BOOKING"
      );

      if (orderConfirmConf && pdfFileName) {
        const monthlyPdfPath = path.join(
          process.cwd(), "uploads", "invoices", "monthly", pdfFileName
        );
        await sendEmailFromTemplate(
          orderConfirmConf.emailCode,
          {
            to: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
            OrderNumber: (result.inv as any).invoiceNumber,
            BookingNumber: (result.createdMonthly as any).monthlyInvoiceId,
            InvoiceTemple: "",
          },
          [{ path: monthlyPdfPath, filename: pdfFileName }]
        );
      }
    } catch (e) {
      console.error("❌ Monthly email send failed:", e);
    }

    return res.status(201).json({
      success: true,
      message: "Monthly invoice created successfully",
      data: {
        monthlyInvoice: result.createdMonthly,
        invoice: result.inv,
        monthlyInvoiceItems: result.createdItems,
      },
    });
  } catch (error: any) {
    console.error("createMonthlyInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const deleteMonthlyInvoice = async (
  req: Request,
  res: Response
) => {
  const sequelize = MonthlyInvoice.sequelize as Sequelize;

  try {
    const { monthlyInvoiceId } = req.params;

    if (!monthlyInvoiceId) {
      return res.status(400).json({
        success: false,
        message: "monthlyInvoiceId is required",
      });
    }

    await sequelize.transaction(async (t) => {
      const monthlyInvoice = await MonthlyInvoice.findByPk(monthlyInvoiceId, {
        transaction: t,
      });

      if (!monthlyInvoice) {
        throw new Error("Monthly Invoice not found");
      }

      if (monthlyInvoice.invoiceId) {
        await Invoice.destroy({
          where: { invoiceId: monthlyInvoice.invoiceId },
          transaction: t,
        });
      }

      await MonthlyInvoiceItems.destroy({
        where: { monthlyInvoiceId },
        transaction: t,
      });

      await MonthlyInvoice.destroy({
        where: { monthlyInvoiceId },
        transaction: t,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Monthly Invoice deleted successfully.",
    });
  } catch (error: any) {
    console.error("Delete Monthly Invoice Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


export const deleteMonthlyInvoiceItem = async (req: Request, res: Response) => {
  const sequelize = MonthlyInvoice.sequelize as Sequelize;

  try {
    const monthlyInvoiceItemId =
      req.params.monthlyInvoiceItemId || req.body.monthlyInvoiceItemId;

    if (!monthlyInvoiceItemId) {
      return res.status(400).json({
        success: false,
        message: "monthlyInvoiceItemId is required",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      // 1. Find the item
      const item = await MonthlyInvoiceItems.findByPk(monthlyInvoiceItemId, {
        transaction: t,
      });

      if (!item) {
        return { notFound: true };
      }

      const monthlyInvoiceId = item.monthlyInvoiceId;

      // 2. Query all items for this monthly invoice
      const allItems = await MonthlyInvoiceItems.findAll({
        where: { monthlyInvoiceId },
        transaction: t,
      });

      const remainingItems = allItems.filter(
        (i: any) => String(i.monthlyInvoiceItemId) !== String(monthlyInvoiceItemId)
      );

      // 3. If this was the last remaining Route Card -> Delete header + invoice + item
      if (remainingItems.length === 0) {
        await item.destroy({ transaction: t });

        const monthlyInvoice = await MonthlyInvoice.findByPk(monthlyInvoiceId, {
          transaction: t,
        });

        if (monthlyInvoice) {
          if (monthlyInvoice.invoiceId) {
            await Invoice.destroy({
              where: { invoiceId: monthlyInvoice.invoiceId },
              transaction: t,
            });
          }

          await MonthlyInvoice.destroy({
            where: { monthlyInvoiceId },
            transaction: t,
          });
        }

        return { entireInvoiceDeleted: true };
      }

      // 4. Otherwise delete only this single route card item
      await item.destroy({ transaction: t });

      // 5. Recalculate combined totals from remaining items
      let packageAmountSum = 0;
      let extraKmAmountSum = 0;
      let extraDaysAmountSum = 0;
      let extraHrsAmountSum = 0;
      let totalTaxAmountSum = 0;
      let finalTotalSum = 0;
      let balanceDueSum = 0;
      let grandAdvanceSum = 0;
      let grandDiscountSum = 0;
      let grandExtraChargesSum = 0;

      const combinedTaxMap: Record<
        string,
        { taxId?: string; taxName: string; taxPercent: number; amount: number }
      > = {};

      remainingItems.forEach((rItem: any) => {
        packageAmountSum += toNum(rItem.packageAmount);
        extraKmAmountSum += toNum(rItem.extraKmAmount);
        extraDaysAmountSum += toNum(rItem.extraDaysAmount);
        extraHrsAmountSum += toNum(rItem.extraHrsAmount);
        totalTaxAmountSum += toNum(rItem.totalTaxAmount);
        finalTotalSum += toNum(rItem.finalTotal);
        balanceDueSum += toNum(rItem.balanceDue);
        grandAdvanceSum += toNum(rItem.advance);
        grandDiscountSum += toNum(rItem.discount);
        grandExtraChargesSum += toNum(rItem.extraChargesInputAmount);

        const itemTaxes = Array.isArray(rItem.taxes) ? rItem.taxes : [];
        itemTaxes.forEach((tx: any) => {
          const key = tx.taxId || tx.taxName || "Tax";
          if (!combinedTaxMap[key]) {
            combinedTaxMap[key] = {
              taxId: tx.taxId,
              taxName: tx.taxName || "Tax",
              taxPercent: toNum(tx.taxPercent),
              amount: 0,
            };
          }
          combinedTaxMap[key].amount += toNum(tx.amount);
        });
      });

      const combinedTaxesArr = Object.values(combinedTaxMap);

      // 6. Update MonthlyInvoice Header
      const monthlyInvoice = await MonthlyInvoice.findByPk(monthlyInvoiceId, {
        transaction: t,
      });

      if (monthlyInvoice) {
        await monthlyInvoice.update(
          {
            packageAmount: packageAmountSum,
            extraKmAmount: extraKmAmountSum,
            extraDaysAmount: extraDaysAmountSum,
            extraHrsAmount: extraHrsAmountSum,
            totalTaxAmount: totalTaxAmountSum,
            finalTotal: finalTotalSum,
            balanceDue: balanceDueSum,
            advance: grandAdvanceSum,
            discount: grandDiscountSum,
            extraChargesInputAmount: grandExtraChargesSum,
            taxes: combinedTaxesArr,
          },
          { transaction: t }
        );

        // 7. Update linked Invoice table record
        if (monthlyInvoice.invoiceId) {
          const inv = await Invoice.findByPk(monthlyInvoice.invoiceId, {
            transaction: t,
          });

          if (inv) {
            await inv.update(
              {
                invoiceAmount: balanceDueSum,
              },
              { transaction: t }
            );
          }
        }
      }

      return {
        entireInvoiceDeleted: false,
        monthlyInvoiceId,
        remainingItemsCount: remainingItems.length,
      };
    });

    if ((result as any)?.notFound) {
      return res.status(404).json({
        success: false,
        message: "Route Card not found",
      });
    }

    if ((result as any)?.entireInvoiceDeleted) {
      return res.status(200).json({
        success: true,
        entireInvoiceDeleted: true,
        message: "Entire Monthly Invoice deleted as all Route Cards were removed.",
      });
    }

    return res.status(200).json({
      success: true,
      entireInvoiceDeleted: false,
      message: "Route Card deleted successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error("deleteMonthlyInvoiceItem Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete Route Card",
    });
  }
};

export const resendMonthlyInvoice = async (req: Request, res: Response) => {

  const { monthlyInvoiceId } = req.body;

  const createdMonthly = await MonthlyInvoice.findOne({ where: { monthlyInvoiceId: monthlyInvoiceId } });
  // ✅ PDF GENERATION (optional)
  let pdfFileName: string | null = null;

  try {
    const BASE_URL = "http://localhost:5000";
    const pdfResponse = await axios.post(
      `${BASE_URL}/app/appInvoiceRoutes/month-generate-invoice-pdf`,
      { monthlyInvoiceId: (createdMonthly as any).monthlyInvoiceId },
      { headers: { Authorization: req.headers.authorization } }
    );
    pdfFileName = pdfResponse.data?.data?.fileName || null;
    console.log("✅ Branded monthly PDF generated:", pdfFileName);
  } catch (err) {
    console.error("❌ Error calling month-generate-invoice-pdf:", err);
  }

  // ✅ EMAIL (optional)
  try {
    const emailConfigs = await fetchAllEmailConfs();
    const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "MONTHLY_BOOKING");

    if (orderConfirmConf && pdfFileName) {
      const monthlyPdfPath = path.join(process.cwd(), "uploads", "invoices", "monthly", pdfFileName);

      await sendEmailFromTemplate(
        orderConfirmConf.emailCode,
        {
          to: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
          OrderNumber: (createdMonthly as any).invoiceNumber,
          BookingNumber: (createdMonthly as any).monthlyInvoiceId,
          InvoiceTemple: "",
        },
        [{ path: monthlyPdfPath, filename: pdfFileName }]
      );

      console.log("✅ Monthly invoice email sent with branded PDF");
    }
  } catch (e) {
    console.error("❌ Monthly email send failed:", e);
  }

  return res.status(201).json({
    success: true,
    message: "Monthly invoice + Invoice created",
    data: {
      monthlyInvoice: createdMonthly,
      //    invoice: inv,
    },
  });
};

// export const createMonthlyInvoice = async (req: Request, res: Response) => {
//   const sequelize = MonthlyInvoice.sequelize as Sequelize;

//   try {
//     const {
//       invoiceDate,
//       invoiceMonth,
//       companyId,
//       vehicleTypeId,
//       vehicleNumber,
//       route,
//       packageDataId,
//       packageDetails,
//       extraKm,
//       extraDays,
//       extraHrs,
//       extraChargeType,
//       extraChargesInputAmount,
//       discount,
//       advance,
//       selectedTaxIds,
//     } = req.body;

//     if (!invoiceDate || !invoiceMonth || !companyId || !vehicleTypeId || !vehicleNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "invoiceDate, invoiceMonth, companyId, vehicleTypeId, vehicleNumber are required",
//       });
//     }

//     // ✅ Validate masters
//     const company = await Company.findOne({ where: { companyId } });
//     if (!company) return res.status(404).json({ success: false, message: "Company not found" });

//     const vt = await VehicleType.findOne({ where: { vehicleTypeId } });
//     if (!vt) return res.status(404).json({ success: false, message: "VehicleType not found" });

//     // ✅ Compute amounts
//     const pkgAmount = n(packageDetails?.amount);
//     const pkgDays = n(packageDetails?.hours); // "days"
//     const extraKmRate = n(packageDetails?.extraKmRate);
//     const perDayRate = pkgDays > 0 ? pkgAmount / pkgDays : 0;
// const extraHourRate = n(packageDetails?.extraHourRate); // ✅ from frontend meta
// const extraHrsCount = n(extraHrs);
// const extraHrsAmt = extraHrsCount * extraHourRate;

//     const extraKmCount = n(extraKm);
//     const extraDaysCount = n(extraDays);

//     const extraKmAmt = extraKmCount * extraKmRate;
//     const extraDaysAmt = extraDaysCount * perDayRate;

//     const disc = n(discount);
//     const adv = n(advance);
//     const extraChargeAmt = n(extraChargesInputAmount);

// const netTotal = Math.max(0, pkgAmount + extraKmAmt + extraDaysAmt + extraHrsAmt - disc);

//     // ✅ taxes
//     const allowTax =
//       String(company.allowTax || "").toLowerCase() === "yes" ||
//       String(company.allowTax || "").toLowerCase() === "true";

//     let taxRows: any[] = [];
//     if (allowTax && Array.isArray(selectedTaxIds) && selectedTaxIds.length) {
//       const dbTaxes = await Tax.findAll({
//         where: { isActive: true, taxId: selectedTaxIds },
//         attributes: ["taxId", "taxName", "taxPercent"],
//       });

//       taxRows = dbTaxes.map((t: any) => {
//         const pct = Number(t.taxPercent || 0);
//         const amount = Math.round((netTotal * pct) / 100);
//         return { taxId: t.taxId, taxName: t.taxName, taxPercent: pct, amount };
//       });
//     }

//     const totalTaxAmount = taxRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
//     const finalTotal = netTotal + totalTaxAmount + extraChargeAmt;
//     const balanceDue = Math.max(0, finalTotal - adv);

//     const { start, end } = getMonthRange(invoiceMonth);

//     // ✅ TRANSACTION: MonthlyInvoice + Invoice both create
// const result = await sequelize.transaction(async (t) => {
//   const createdMonthly = await MonthlyInvoice.create(
//     {
//       invoiceDate,
//       invoiceMonth,

//       companyId,
//       companyName: company.companyName,
// extraHrs: extraHrsCount,             // ✅ if column exists
// extraHrsAmount: extraHrsAmt,         // ✅ if column exists
// extraHourRate: extraHourRate,        // ✅ if column exists

//       vehicleTypeId,
//       vehicleTypeName: vt.vehicleType,

//       vehicleNumber,
//       route,
//       packageDataId: packageDataId || null,
//       packageDetails: packageDetails || null,

//       extraKm: extraKmCount,
//       extraDays: extraDaysCount,

//       extraChargeType: extraChargeType || "toll",
//       extraChargesInputAmount: extraChargeAmt,

//       discount: disc,
//       advance: adv,

//       packageAmount: pkgAmount,
//       extraKmAmount: extraKmAmt,
//       extraDaysAmount: extraDaysAmt,

//       netTotal,
//       taxes: taxRows,
//       totalTaxAmount,

//       finalTotal,
//       balanceDue,

//       // ✅ FIX: correct column name
//       closeStatus: 0, // if "Close Order" = close then put 1
//     },
//     { transaction: t }
//   );

//   const inv = await Invoice.create(
//     {
//       startDate: start,
//       endDate: end,

//       invoiceAmount: Math.round(balanceDue),
//       invoiceStatus: "0",

//       companyId,
//       vehicleTypeId,

//       // ✅ make sure Invoice model has this column
//       monthlyInvoiceId: createdMonthly.monthlyInvoiceId,

//     },
//     { transaction: t }
//   );

//   // ✅ FIX: store invoiceId inside monthly_invoice table
//   await createdMonthly.update({ invoiceId: inv.invoiceId }, { transaction: t });

//   return { createdMonthly, inv };
// });


// let pdfFileName: string | null = null;

// try {
//   const BASE_URL = "http://localhost:5000"; // ✅ FIXED PORT

//   const pdfResponse = await axios.post(
//     `${BASE_URL}/app/appInvoiceRoutes/month-generate-invoice-pdf`,
//     {
//       monthlyInvoiceId: result.createdMonthly.monthlyInvoiceId,
//     },
//     {
//       headers: {
//         Authorization: req.headers.authorization, // pass JWT
//       },
//     }
//   );

//   pdfFileName = pdfResponse.data?.data?.fileName || null;

//   console.log("✅ Branded monthly PDF generated:", pdfFileName);
// } catch (err) {
//   console.error("❌ Error calling month-generate-invoice-pdf:", err);
// }


// const emailConfigs = await fetchAllEmailConfs();
// const orderConfirmConf = emailConfigs.find(
//   (conf: any) => conf.emailCode === "MONTHLY_BOOKING"
// );

// if (orderConfirmConf && pdfFileName) {
//   const monthlyPdfPath = path.join(
//     process.cwd(),
//     "uploads",
//     "invoices",
//     "monthly",
//     pdfFileName
//   );

//   const payLink = `${config.baseurl.apibaseurl}/invoice/monthly/pay/${result.inv.invoiceId}`;

//   await sendEmailFromTemplate(
//     orderConfirmConf.emailCode,
//     {
//       to: "robertjayakumar@gmail.com,traveldesk@gracecabs.com",
//       OrderNumber: result.inv.invoiceNumber,
//       BookingNumber: result.createdMonthly.monthlyInvoiceId,
//       InvoiceTemple: "", // optional (PDF is main)
//     //  PayLink: payLink,
//     },
//     [
//       {
//         path: monthlyPdfPath,
//         filename: pdfFileName,
//       },
//     ]
//   );

//   console.log("✅ Monthly invoice email sent with branded PDF");
// }



//     return res.status(201).json({
//       success: true,
//       message: "Monthly invoice + Invoice created",
//       data: {
//         monthlyInvoice: result.createdMonthly,
//         invoice: result.inv,
//       },
//     });
//   } catch (error: any) {
//     console.error("createMonthlyInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };

export const getAllMonthlyInvoiceDetails = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      vehicleTypeId,
      invoiceMonth,
      closeStatus,
      search,
      page = "1",
      limit = "20",
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereMonthly: any = {};
    if (companyId) whereMonthly.companyId = companyId;
    if (vehicleTypeId) whereMonthly.vehicleTypeId = vehicleTypeId;
    if (invoiceMonth) whereMonthly.invoiceMonth = invoiceMonth;
    if (closeStatus !== undefined && closeStatus !== "") whereMonthly.closeStatus = Number(closeStatus);

    // ✅ search by vehicleNumber
    if (search && String(search).trim()) {
      whereMonthly.vehicleNumber = { [Op.like]: `%${String(search).trim()}%` };
    }

    // ✅ Invoice filter: ONLY PENDING
    const whereInvoice: any = {
      invoiceStatus: "0", // ✅ only pending invoices
    };

    // ✅ optional invoiceNumber search (also keeps invoiceStatus=0)
    if (search && String(search).trim()) {
      whereInvoice[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${String(search).trim()}%` } },
      ];
    }

    const result = await MonthlyInvoice.findAndCountAll({
      where: whereMonthly,
      include: [
        {
          model: Invoice,
          required: true, // ✅ IMPORTANT: only rows having invoice & matches whereInvoice
          where: whereInvoice,
          attributes: [
            "invoiceId",
            "invoiceNumber",
            "startDate",
            "endDate",
            "invoiceAmount",
            "invoiceStatus",
            "companyId",
            "vehicleTypeId",
            "closePendingId",
            "monthlyInvoiceId",
            "paymentId",
            "createdAt",
          ],
          include: [
            {
              model: Payment,
              as: "payment",
              required: false,
              attributes: [
                "paymentId",
                "paymentMode",
                "isOnline",
                "isActive",
                "transactionId",
                "status",
                "amount",
                "tax",
                "orderId",
                "gatewayOrderId",
                "paymentUrl",
                "expiresAt",
                "meta",
                "createdAt",
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    // ✅ Add status label in response (Pending / Paid)
    const rowsWithStatus = result.rows.map((row: any) => {
      const json = row.toJSON();

      // Invoice can be `invoice` or `Invoices` based on association name
      const inv = json.invoice || json.Invoices || json.Invoice;

      const invStatus = String(inv?.invoiceStatus ?? "");
      const statusLabel = invStatus === "0" ? "Pending" : invStatus === "9" ? "Paid" : "Unknown";

      return {
        ...json,
            invoiceNumber: json.monthlyBookingCode,

        status: statusLabel, // ✅ new field
      };
    });

    return res.status(200).json({
      success: true,
      message: "Monthly invoice (Pending only) + Invoice + Payment details fetched",
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.count,
        totalPages: Math.ceil(result.count / limitNum),
      },
      data: rowsWithStatus,
    });
  } catch (error: any) {
    console.error("getAllMonthlyInvoiceDetails error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getAllMonthlyInvoice = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      vehicleTypeId,
      invoiceMonth,
      closeStatus,
      search,
      page = "1",
      limit = "20",
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereMonthly: any = {};
    if (companyId) whereMonthly.companyId = companyId;
    if (vehicleTypeId) whereMonthly.vehicleTypeId = vehicleTypeId;
    if (invoiceMonth) whereMonthly.invoiceMonth = invoiceMonth;
    if (closeStatus !== undefined && closeStatus !== "") whereMonthly.closeStatus = Number(closeStatus);

    // ✅ search by vehicleNumber
    if (search && String(search).trim()) {
      whereMonthly.vehicleNumber = { [Op.like]: `%${String(search).trim()}%` };
    }

    // ✅ Invoice filter: ONLY PENDING
    const whereInvoice: any = {
      invoiceStatus: "9", // ✅ only pending invoices
    };

    // ✅ optional invoiceNumber search (also keeps invoiceStatus=0)
    if (search && String(search).trim()) {
      whereInvoice[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${String(search).trim()}%` } },
      ];
    }

    const result = await MonthlyInvoice.findAndCountAll({
      where: whereMonthly,
      include: [
        {
          model: Invoice,
          required: true, // ✅ IMPORTANT: only rows having invoice & matches whereInvoice
          where: whereInvoice,
          attributes: [
            "invoiceId",
            "invoiceNumber",
            "startDate",
            "endDate",
            "invoiceAmount",
            "invoiceStatus",
            "companyId",
            "vehicleTypeId",
            "closePendingId",
            "monthlyInvoiceId",
            "paymentId",
            "createdAt",
          ],
          include: [
            {
              model: Payment,
              as: "payment",
              required: false,
              attributes: [
                "paymentId",
                "paymentMode",
                "isOnline",
                "isActive",
                "transactionId",
                "status",
                "amount",
                "tax",
                "orderId",
                "gatewayOrderId",
                "paymentUrl",
                "expiresAt",
                "meta",
                "createdAt",
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    // ✅ Add status label in response (Pending / Paid)
    const rowsWithStatus = result.rows.map((row: any) => {
      const json = row.toJSON();

      // Invoice can be `invoice` or `Invoices` based on association name
      const inv = json.invoice || json.Invoices || json.Invoice;

      const invStatus = String(inv?.invoiceStatus ?? "");
      const statusLabel = invStatus === "0" ? "Pending" : invStatus === "9" ? "Paid" : "Unknown";

      return {
        ...json,
        status: statusLabel, // ✅ new field
      };
    });

    return res.status(200).json({
      success: true,
      message: "Monthly invoice (Pending only) + Invoice + Payment details fetched",
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.count,
        totalPages: Math.ceil(result.count / limitNum),
      },
      data: rowsWithStatus,
    });
  } catch (error: any) {
    console.error("getAllMonthlyInvoiceDetails error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const filterMonthlyInvoices = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      status = "all",          // all | paid | pending
      fromDate,                // YYYY-MM-DD
      toDate,                  // YYYY-MM-DD
      page = "1",
      limit = "20",
      search,                  // optional: vehicleNumber or invoiceNumber search
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // --------------------
    // MonthlyInvoice WHERE
    // --------------------
    const whereMonthly: any = {};

    // ✅ companyName filter
    if (companyName && String(companyName).trim()) {
      whereMonthly.companyName = { [Op.like]: `%${String(companyName).trim()}%` };
    }

    // ✅ date range filter (invoiceDate is DATEONLY in MonthlyInvoice)
    if (fromDate && toDate) {
      whereMonthly.invoiceDate = { [Op.between]: [String(fromDate), String(toDate)] };
    } else if (fromDate) {
      whereMonthly.invoiceDate = { [Op.gte]: String(fromDate) };
    } else if (toDate) {
      whereMonthly.invoiceDate = { [Op.lte]: String(toDate) };
    }

    // ✅ optional: vehicleNumber search
    if (search && String(search).trim()) {
      whereMonthly[Op.or] = [
        { vehicleNumber: { [Op.like]: `%${String(search).trim()}%` } },
        { companyName: { [Op.like]: `%${String(search).trim()}%` } },
      ];
    }

    // --------------------
    // Invoice WHERE
    // --------------------
    const whereInvoice: any = {};

    // ✅ status filter by invoiceStatus
    // 0 = pending, 9 = paid
    let invoiceRequired = false; // default: keep monthly rows even if invoice missing

    if (String(status).toLowerCase() === "pending") {
      whereInvoice.invoiceStatus = "0";
      invoiceRequired = true; // ✅ only matching invoices
    } else if (String(status).toLowerCase() === "paid") {
      whereInvoice.invoiceStatus = "9";
      invoiceRequired = true;
    } else {
      // status = all => no invoiceStatus filter
      invoiceRequired = false;
    }

    // ✅ optional: invoiceNumber search ALSO (combine with status if present)
    if (search && String(search).trim()) {
      whereInvoice[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${String(search).trim()}%` } },
      ];
    }

    const result = await MonthlyInvoice.findAndCountAll({
      where: whereMonthly,
      include: [
        {
          model: Invoice,
          required: invoiceRequired,
          where: Object.keys(whereInvoice).length ? whereInvoice : undefined,
          attributes: [
            "invoiceId",
            "invoiceNumber",
            "startDate",
            "endDate",
            "invoiceAmount",
            "invoiceStatus",
            "companyId",
            "vehicleTypeId",
            "closePendingId",
            "monthlyInvoiceId",
            "paymentId",
            "createdAt",
          ],
          include: [
            {
              model: Payment,
              as: "payment",
              required: false,
              attributes: [
                "paymentId",
                "paymentMode",
                "isOnline",
                "isActive",
                "transactionId",
                "status",
                "amount",
                "tax",
                "orderId",
                "gatewayOrderId",
                "paymentUrl",
                "expiresAt",
                "meta",
                "createdAt",
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    // ✅ add statusLabel (Pending / Paid) based on invoice.invoiceStatus
    const rows = result.rows.map((r: any) => {
      const json = r.toJSON();
      const inv = json.invoice || json.Invoice || json.Invoices; // association name safe
      const invStatus = String(inv?.invoiceStatus ?? "");
      const statusLabel = invStatus === "0" ? "Pending" : invStatus === "9" ? "Paid" : "No Invoice";
      return { ...json, statusLabel };
    });

    return res.status(200).json({
      success: true,
      message: "Monthly invoice filter results (Monthly + Invoice + Payment)",
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.count,
        totalPages: Math.ceil(result.count / limitNum),
      },
      data: rows,
    });
  } catch (error: any) {
    console.error("filterMonthlyInvoices error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
export const getMonthlyInvoiceDetailsById = async (req: Request, res: Response) => {
  try {
    const { monthlyInvoiceId } = req.params;

    if (!monthlyInvoiceId) {
      return res.status(400).json({ success: false, message: "monthlyInvoiceId is required" });
    }

    // 1) monthly_invoice with monthlyInvoiceItems included
    const monthly = await MonthlyInvoice.findOne({
      where: { monthlyInvoiceId },
      include: [
        {
          model: MonthlyInvoiceItems,
          required: false,
        },
      ],
    });

    if (!monthly) {
      return res.status(404).json({ success: false, message: "Monthly invoice not found" });
    }

    const jsonMonthly = monthly.toJSON();

    // Backward compatibility: If monthlyInvoiceItems is empty (legacy single-route record), build 1-item array from header fields
    if (!jsonMonthly.monthlyInvoiceItems || jsonMonthly.monthlyInvoiceItems.length === 0) {
      jsonMonthly.monthlyInvoiceItems = [
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

    if (jsonMonthly.monthlyInvoiceItems && Array.isArray(jsonMonthly.monthlyInvoiceItems)) {
      jsonMonthly.monthlyInvoiceItems = jsonMonthly.monthlyInvoiceItems.map((item: any) => ({
        ...item,
        packageDetails: normalizePackageDetails(item.packageDetails, item),
      }));
    }
    if (jsonMonthly.packageDetails) {
      jsonMonthly.packageDetails = normalizePackageDetails(jsonMonthly.packageDetails, jsonMonthly);
    }

    // 2) invoice (prefer monthly.invoiceId; fallback: invoice.monthlyInvoiceId)
    const invoice = await Invoice.findOne({
      where: {
        [Op.or]: [
          jsonMonthly.invoiceId ? { invoiceId: jsonMonthly.invoiceId } : undefined,
          { monthlyInvoiceId: jsonMonthly.monthlyInvoiceId },
        ].filter(Boolean) as any,
      },
    });

    // 3) company
    const company = await Company.findOne({
      where: { companyId: jsonMonthly.companyId },
    });

    // 4) vehicleType
    const vehicleType = await VehicleType.findOne({
      where: { vehicleTypeId: jsonMonthly.vehicleTypeId },
    });

    // 5) vehicles list (all vehicles under this type)
    const vehicles = await Vehicle.findAll({
      where: { vehicleTypeId: jsonMonthly.vehicleTypeId },
      include: [
        {
          model: VehicleMaster,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // 6) vehicleMaster for THIS invoice vehicleNumber
    const vehicleMaster = await VehicleMaster.findOne({
      where: {
        vehicleNumber: jsonMonthly.vehicleNumber,
      },
      include: [
        { model: Vehicle, required: false },
        { model: VehicleType, required: false },
      ],
    }).catch(() => null);

    // 7) payment details using invoice.paymentId
    const payment = invoice?.paymentId
      ? await Payment.findOne({ where: { paymentId: invoice.paymentId } })
      : null;

    return res.status(200).json({
      success: true,
      message: "Monthly invoice full details fetched",
      data: {
        monthlyInvoice: jsonMonthly,
        invoice: invoice || null,
        company: company || null,
        vehicleType: vehicleType || null,
        vehicles,
        vehicleMaster: vehicleMaster || null,
        payment,
      },
    });
  } catch (error: any) {
    console.error("getMonthlyInvoiceDetailsById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


export const createAppInvoice = async (req: any, res: Response) => {
  try {
    const bookingId = req.body;
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }


    const paymentMode = await PaymentMode.findOne();
    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid paymentmodeId, PaymentMode not found'
      });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid bookingId, Booking not found'
      });
    }

    const payment = await Payment.create({
      paymentMode: paymentMode.paymentmodeId,
      isOnline: paymentMode.isOnline,
      isActive: paymentMode.isActive,
      transactionId: booking.bookingCode,
      status: ORDER.STATUS.PENDING,
      //   amount: newClosePending.totalAmount,
      //  tax: newClosePending.totalTaxAmount || 0
    })

    const updateConfirm = await Booking.update({ paymentId: payment.paymentId },
      {
        where: {
          bookingId: bookingId,
        }
      });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 10);

    const invoice = await Invoice.create({
      bookingId,
      paymentId: payment.paymentId,
      userId: booking.userId,
      vehicleTypeId: booking.vehicleTypeId,
      companyId: booking.user?.companyId,
      invoiceStatus: ORDER.STATUS.PENDING,
      startDate,
      endDate,
      // invoiceAmount: totalAmount,
    });

    const invoiceWithDetails = await Invoice.findOne({
      where: { invoiceId: invoice.invoiceId },
      include: [
        { model: User, required: false },
        { model: VehicleType, required: false },
        { model: Company, required: false },
      ],
    });

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    res.status(201).json({
      success: true,
      message: 'ClosePending & Payment created successfully',
      data: invoice, invoiceWithDetails
    });



  } catch (error) {
    console.error('Error creating ClosePending:', error);

    if (error instanceof Error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid packageDataId provided - foreign key constraint failed'
        });
      }
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.message
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPaymentForPendingInvoice = async (req: any, res: Response) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice with all related data
    const invoiceData = await Invoice.findOne({
      where: {
        invoiceId: invoiceId,
        invoiceStatus: ORDER.STATUS.PENDING,

      },

    });

    if (!invoiceData) {
      return res.status(404).json({
        success: false,
        message: 'Pending invoice not found'
      });
    }

    // Format response data
    const responseData = {
      invoiceId: invoiceData.invoiceId,
      orderNumber: invoiceData.booking?.bookingCode, // Order number from booking ID
      invoiceNumber: invoiceData.invoiceNumber, // Invoice number from invoice ID
      invoiceDate: invoiceData.createdAt,
      userName: invoiceData.booking?.user?.username,
      pickupPoint: invoiceData.booking?.pickupPoint,
      invoiceAmount: invoiceData.invoiceAmount || 0,
      totalAmount: invoiceData.invoiceAmount || 0,
      currentPaymentMode: invoiceData.payment?.paymentMode || null,
      transactionId: invoiceData.payment?.transactionId || null,
      remarks: invoiceData.booking?.remarks,

      bookingDetails: {
        startDate: invoiceData.startDate,
        endDate: invoiceData.endDate,
        vehicleType: invoiceData.booking?.vehicleType?.vehicleType,
        userId: invoiceData.userId,
        companyId: invoiceData.companyId
      }
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching pending invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: "error"
    });
  }
};

//payment initialize before paid
export const paymentInitialise = async (req: Request, res: Response) => {
  try {
    const { userId, bookingId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing user",
      });
    }

    await User.update(
      { isPayHolder: true },
      { where: { userId } }
    );

    let whereClause: any = {
      userId,
      confirmStatus: ORDER.STATUS.CLOSED,
    };


    if (Array.isArray(bookingId)) {
      // If multiple bookingIds passed
      whereClause.bookingId = { [Op.in]: bookingId };
    } else if (bookingId) {
      // If only one bookingId passed
      whereClause.bookingId = bookingId;
    }

    await Booking.update(
      { confirmStatus: ORDER.STATUS.INITIALIZED },
      { where: whereClause }
    );

    return res.status(200).json({
      success: true,
      message: "Payment Initialized",
      data: {
        userId,
        bookingId,
      },
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save payment",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const clearPaymentInitialise = async (req: Request, res: Response) => {
  try {
    const { records } = req.body; // [{ userId, bookingId: [] }]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No records provided",
      });
    }

    for (const rec of records) {
      const { userId, bookingId } = rec;

      // 🔹 Step 1: Reset isPayHolder = 0 in User table
      await User.update(
        { isPayHolder: 0 },          // not false → 0 (DB integer)
        { where: { userId } }
      );

      // 🔹 Step 2: Prepare where condition for booking update
      let whereClause: any = {
        userId,
        confirmStatus: ORDER.STATUS.INITIALIZED, // only initialized bookings
      };

      if (Array.isArray(bookingId)) {
        whereClause.bookingId = { [Op.in]: bookingId };
      } else if (bookingId) {
        whereClause.bookingId = bookingId;
      }

      // 🔹 Step 3: Update booking confirmStatus = CLOSED (5)
      await Booking.update(
        { confirmStatus: ORDER.STATUS.CLOSED },
        { where: whereClause }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payments cleared successfully!",
    });
  } catch (error) {
    console.error("Error clear payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear payment",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const savePaymentForInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId, paymentMode, transactionId, remarks, amount } = req.body;

    const invoiceIds = Array.isArray(invoiceId) ? invoiceId : [invoiceId];

    if (!invoiceIds.length || !paymentMode || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (invoiceId, paymentMode, transactionId)",
      });
    }

    // ✅ Get payment mode info
    const paymentModeData = await PaymentMode.findOne({
      where: { modelname: paymentMode, isDeleted: false },
    });

    if (!paymentModeData) {
      return res.status(400).json({ success: false, message: "Invalid paymentMode" });
    }

    // ✅ Pre-check: is transactionId already used?
    const existing = await Payment.findOne({ where: { transactionId } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "TransactionId already exists",
        fields: { transactionId },
      });
    }

    // ✅ Calculate total tax from invoices
    let totalTax = 0;
    for (const id of invoiceIds) {
      const inv = await Invoice.findByPk(id);
      if (inv && inv.getDataValue("totaltax")) {
        totalTax += Number(inv.getDataValue("totaltax")) || 0;
      }
    }

    // ✅ Create new payment record
    const payment = await Payment.create({
      paymentMode,
      remarks,
      transactionId,
      isOnline: paymentModeData.isOnline ?? false,
      isActive: paymentModeData.isActive ?? false,
      status: 9, // PAYMENTCOMPLETED
      amount,
      tax: totalTax,
    });

    // ✅ Update all invoices & related bookings
    for (const id of invoiceIds) {
      const invoice = await Invoice.findByPk(id);
      if (!invoice) continue;

      await invoice.update({
        invoiceStatus: 9, // PAYMENTCOMPLETED
        paymentId: payment.paymentId,
      });

      await Booking.update(
        { confirmStatus: 9, paymentId: payment.paymentId, },
        { where: { bookingId: invoice.bookingId } }
      );

    }

    return res.status(200).json({
      success: true,
      message: "Payment saved successfully.",
      data: {
        paymentId: payment.paymentId,
        totalAmount: payment.amount,
        totalTax,
        paymentMode,
      },
    });
  } catch (error) {
    console.error("Error saving payment:", error);
    if (error instanceof UniqueConstraintError || (error as any).name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "TransactionId already exists. please try another",
        error: (error as any).message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save payment",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getCompletedList = async (req: any, res: any) => {
  try {
    const { companyId, startDate, endDate } = req.query; // Changed from req.body to req.query

    // Validate required parameters
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and End date are required'
      });
    }

    // Build where conditions
    const whereConditions: any = {
      companyId: companyId,
      createdAt: {
        [Op.between]: [startDate, endDate]
      }, invoiceStatus: ORDER.STATUS.PAYMENTCOMPLETED
    };

    // Find all completed invoices with required associations
    const completedInvoices = await Invoice.findAll({
      where: whereConditions,
      include: [
        { model: Booking, required: false, where: { confirmStatus: ORDER.STATUS.PAYMENTCOMPLETED } }, // Use required: false to allow invoices without a booking
        { model: User, required: false },
        { model: Payment, required: false, where: { status: ORDER.STATUS.PAYMENTCOMPLETED } }, // Assuming payment status 9 means paymentcompleted
      ],
      order: [['createdAt', 'DESC']],
    });

    // Format the response data
    const formattedData = completedInvoices.map((invoice: any) => ({
      orderNumber: invoice.booking?.bookingCode || 'N/A',
      invoiceNumber: invoice.invoiceNumber,
      orderDate: invoice.createdAt,
      pickupDate: invoice.booking?.pickupDate || null,
      pickupPoint: invoice.booking?.pickupPoint || 'N/A',
      userName: invoice.user?.username || 'N/A',
      userEmail: invoice.user?.email || 'N/A',
      totalAmount: parseFloat(invoice.invoiceAmount || 0),
      paymentDetails: {
        paymentId: invoice.payment?.paymentId,
        paymentMode: invoice.payment?.paymentMode || 'N/A',
        transactionId: invoice.payment?.transactionId || 'N/A',
        paymentAmount: parseFloat(invoice.payment?.amount || 0),
        tax: parseFloat(invoice.payment?.tax || 0),
        paymentStatus: invoice.payment?.status,
        isOnline: invoice.payment?.isOnline,
        paymentCreatedAt: invoice.payment?.createdAt
      },
      invoiceStatus: invoice.invoiceStatus,
      invoiceId: invoice.invoiceId,
      userId: invoice.user?.userId,
      bookingId: invoice.booking?.bookingId
    }));

    const totalRecords = formattedData.length;

    return res.status(200).json({
      success: true,
      message: 'Completed orders fetched successfully',
      data: formattedData,
      count: totalRecords,
      dateRange: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error fetching completed orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch completed orders',
      error: "An unexpected error occurred"
    });
  }
};


export const editMonthlyInvoice = async (req: Request, res: Response) => {
  const sequelize = MonthlyInvoice.sequelize as Sequelize;

  try {
    const {
      monthlyInvoiceId,
      invoiceDate,
      invoiceMonth,
      companyId,
      routes,
    } = req.body;

    if (!monthlyInvoiceId) {
      return res.status(400).json({
        success: false,
        message: "monthlyInvoiceId is required",
      });
    }

    // Fetch existing monthly invoice
    const existingMonthly = await MonthlyInvoice.findByPk(monthlyInvoiceId);
    if (!existingMonthly) {
      return res.status(404).json({
        success: false,
        message: "Monthly Invoice not found",
      });
    }

    if (existingMonthly.closeStatus === 1) {
      return res.status(400).json({
        success: false,
        message: "Closed monthly invoice cannot be edited",
      });
    }

    const company = await Company.findOne({ where: { companyId: companyId || existingMonthly.companyId } });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    // Normalize incoming routes array
    let rawRoutes: any[] = [];
    if (Array.isArray(routes) && routes.length > 0) {
      rawRoutes = routes;
    } else if (req.body.vehicleTypeId || req.body.vehicleNumber) {
      rawRoutes = [req.body];
    }

    if (rawRoutes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one route item is required for the invoice",
      });
    }

    const { start, end } = getMonthRange(invoiceMonth || existingMonthly.invoiceMonth);

    // Entire Edit flow runs inside ONE Sequelize Transaction
    const result = await sequelize.transaction(async (t) => {
      // 1. Fetch existing items in DB
      const dbItems = await MonthlyInvoiceItems.findAll({
        where: { monthlyInvoiceId },
        transaction: t,
      });

      const dbItemMap = new Map<string, MonthlyInvoiceItems>();
      dbItems.forEach((item) => {
        dbItemMap.set(item.monthlyInvoiceItemId, item);
      });

      const processedItemIds = new Set<string>();

      // 2. Synchronize incoming route items (Update existing, Create new)
      for (const rItem of rawRoutes) {
        const itemId = rItem.monthlyInvoiceItemId || rItem.id;
        const normalizedPkgDetails = normalizePackageDetails(rItem.packageDetails, rItem);

        const pkgAmount = toNum(rItem.packageAmount || normalizedPkgDetails.amount);
        const extraKmAmt = toNum(rItem.extraKmAmount);
        const extraDaysAmt = toNum(rItem.extraDaysAmount);
        const extraHrsAmt = toNum(rItem.extraHrsAmount);
        const extraHourRateVal = toNum(rItem.extraHourRate || normalizedPkgDetails.extraHourRate);
        const disc = toNum(rItem.discount);
        const adv = toNum(rItem.advance);

        const extraKmCount = toNum(rItem.extraKm);
        const extraDaysCount = toNum(rItem.extraDays);
        const extraHrsCount = toNum(rItem.extraHrs);

        const extraChargesArr = Array.isArray(rItem.extraCharges)
          ? rItem.extraCharges.map((x: any) => ({
            type: String(x.type || "other"),
            amount: toNum(x.amount),
          }))
          : [];
        const extraChargeAmt = extraChargesArr.reduce((sum: number, x: any) => sum + x.amount, 0);

        const netTotalVal = toNum(rItem.netTotal) || Math.max(0, pkgAmount + extraKmAmt + extraDaysAmt + extraHrsAmt - disc);
        const itemTaxes = Array.isArray(rItem.taxes) ? rItem.taxes : [];
        const totalTaxAmt = itemTaxes.reduce((s: number, tx: any) => s + toNum(tx.amount), 0);
        const finalTotalVal = toNum(rItem.finalTotal) || (netTotalVal + totalTaxAmt + extraChargeAmt);
        const itemBalanceDue = Math.max(0, finalTotalVal - adv);

        const itemPayload = {
          monthlyInvoiceId,
          route: rItem.route || "",
          vehicleTypeId: rItem.vehicleTypeId || null,
          vehicleTypeName: rItem.vehicleTypeName || "",
          vehicleNumber: rItem.vehicleNumber || "",
          packageDataId: rItem.packageDataId || normalizedPkgDetails.packageId || null,
          packageDetails: normalizedPkgDetails,
          packageAmount: pkgAmount,
          extraKm: extraKmCount,
          extraKmAmount: extraKmAmt,
          extraDays: extraDaysCount,
          extraDaysAmount: extraDaysAmt,
          extraHrs: extraHrsCount,
          extraHourRate: extraHourRateVal,
          extraHrsAmount: extraHrsAmt,
          extraChargeType: rItem.extraChargeType || "toll",
          extraChargesInputAmount: extraChargeAmt,
          extraCharges: extraChargesArr,
          discount: disc,
          advance: adv,
          netTotal: netTotalVal,
          taxes: itemTaxes,
          totalTaxAmount: totalTaxAmt,
          finalTotal: finalTotalVal,
          balanceDue: itemBalanceDue,
        };

        if (itemId && dbItemMap.has(itemId)) {
          // UPDATE existing item
          const existingItem = dbItemMap.get(itemId)!;
          await existingItem.update(itemPayload, { transaction: t });
          processedItemIds.add(itemId);
        } else {
          // CREATE new item
          const newItem = await MonthlyInvoiceItems.create(itemPayload, { transaction: t });
          processedItemIds.add(newItem.monthlyInvoiceItemId);
        }
      }

      // 3. DELETE items removed from UI
      for (const [existingId, dbItem] of dbItemMap.entries()) {
        if (!processedItemIds.has(existingId)) {
          await dbItem.destroy({ transaction: t });
        }
      }

      // 4. Fetch all remaining items to recalculate Header Totals
      const currentItems = await MonthlyInvoiceItems.findAll({
        where: { monthlyInvoiceId },
        transaction: t,
      });

      let grandNetTotal = 0;
      let grandFinalTotal = 0;
      let grandAdvance = 0;
      let grandExtraCharges = 0;
      let grandDiscount = 0;
      const combinedTaxMap: Record<string, { taxName: string; taxPercent: number; amount: number }> = {};

      currentItems.forEach((ci) => {
        grandNetTotal += toNum(ci.netTotal);
        grandFinalTotal += toNum(ci.finalTotal);
        grandAdvance += toNum(ci.advance);
        grandExtraCharges += toNum(ci.extraChargesInputAmount);
        grandDiscount += toNum(ci.discount);

        const itemTaxes = Array.isArray(ci.taxes) ? ci.taxes : [];
        itemTaxes.forEach((tx: any) => {
          const key = tx.taxId || tx.taxName || "Tax";
          if (!combinedTaxMap[key]) {
            combinedTaxMap[key] = { taxName: tx.taxName || "Tax", taxPercent: toNum(tx.taxPercent), amount: 0 };
          }
          combinedTaxMap[key].amount += toNum(tx.amount);
        });
      });

      const headerTaxRows = Object.values(combinedTaxMap);
      const headerTotalTaxAmount = headerTaxRows.reduce((s, tx) => s + tx.amount, 0);
      const grandBalanceDue = Math.max(0, grandFinalTotal - grandAdvance);
      const firstRoute = currentItems[0] || rawRoutes[0];

      // 5. Update MonthlyInvoice Header (monthlyBookingCode & invoiceId NEVER change)
      await existingMonthly.update(
        {
          invoiceDate: invoiceDate || existingMonthly.invoiceDate,
          invoiceMonth: invoiceMonth || existingMonthly.invoiceMonth,
          companyId: companyId || existingMonthly.companyId,
          companyName: (company as any).companyName,

          // Legacy fields fallback
          vehicleTypeId: firstRoute.vehicleTypeId,
          vehicleTypeName: firstRoute.vehicleTypeName,
          vehicleNumber: firstRoute.vehicleNumber,
          route: firstRoute.route,
          packageDataId: firstRoute.packageDataId,
          packageDetails: firstRoute.packageDetails,
          extraKm: firstRoute.extraKm,
          extraDays: firstRoute.extraDays,
          extraHrs: firstRoute.extraHrs,
          extraHourRate: firstRoute.extraHourRate,
          extraChargeType: firstRoute.extraChargeType,
          extraChargesInputAmount: grandExtraCharges,
          extraCharges: firstRoute.extraCharges,
          discount: grandDiscount,
          advance: grandAdvance,
          packageAmount: firstRoute.packageAmount,
          extraKmAmount: firstRoute.extraKmAmount,
          extraDaysAmount: firstRoute.extraDaysAmount,
          extraHrsAmount: firstRoute.extraHrsAmount,

          // Recalculated Header Totals
          netTotal: grandNetTotal,
          taxes: headerTaxRows,
          totalTaxAmount: headerTotalTaxAmount,
          finalTotal: grandFinalTotal,
          balanceDue: grandBalanceDue,
        },
        { transaction: t }
      );

      // 6. Update linked Invoice (keep same invoiceId & invoiceNumber)
      if (existingMonthly.invoiceId) {
        const inv = await Invoice.findByPk(existingMonthly.invoiceId, { transaction: t });
        if (inv) {
          await inv.update(
            {
              startDate: start,
              endDate: end,
              invoiceAmount: grandBalanceDue,
            },
            { transaction: t }
          );
        }
      }

      return { monthly: existingMonthly, items: currentItems };
    });

    // 7. Regenerate PDF
    let pdfFileName: string | null = null;
    try {
      const BASE_URL = "http://localhost:5000";
      const pdfResponse = await axios.post(
        `${BASE_URL}/app/appInvoiceRoutes/month-generate-invoice-pdf`,
        { monthlyInvoiceId },
        { headers: { Authorization: req.headers.authorization } }
      );
      pdfFileName = pdfResponse.data?.data?.fileName || null;
    } catch (err) {
      console.error("PDF generation failed:", err);
    }

    // EMAIL
    try {
      const emailConfigs = await fetchAllEmailConfs();
      const orderConfirmConf = emailConfigs.find(
        (conf: any) => conf.emailCode === "MONTHLY_BOOKING"
      );

      if (orderConfirmConf && pdfFileName) {
        const monthlyPdfPath = path.join(
          process.cwd(), "uploads", "invoices", "monthly", pdfFileName
        );
        await sendEmailFromTemplate(
          orderConfirmConf.emailCode,
          {
            to: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
            OrderNumber: existingMonthly.monthlyBookingCode,
            BookingNumber: monthlyInvoiceId,
            InvoiceTemple: "",
          },
          [{ path: monthlyPdfPath, filename: pdfFileName }]
        );
      }
    } catch (e) {
      console.error("Email error:", e);
    }

    return res.status(200).json({
      success: true,
      message: "Monthly invoice updated successfully",
      data: {
        monthlyInvoice: result.monthly,
        monthlyInvoiceItems: result.items,
      },
    });
  } catch (error: any) {
    console.error("editMonthlyInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Change Invoice Number — Monthly Invoice
// Uses InvoiceSequence (not MAX of invoice table).
// ─────────────────────────────────────────────────────────────────────────────
export const changeMonthlyInvoiceNumber = async (req: Request, res: Response) => {
  const sequelize = MonthlyInvoice.sequelize as Sequelize;

  try {
    const { monthlyInvoiceId } = req.body;

    if (!monthlyInvoiceId) {
      return res.status(400).json({
        success: false,
        message: "monthlyInvoiceId is required",
      });
    }

    // 1. Fetch monthly invoice
    const monthly = await MonthlyInvoice.findByPk(monthlyInvoiceId);
    if (!monthly) {
      return res.status(404).json({
        success: false,
        message: "Monthly invoice not found",
      });
    }

    const companyId = monthly.companyId;

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
    await sequelize.transaction(async (t) => {
      newInvoiceNumber = await Invoice.generateNextInvoiceNumber(
        companyId,
        companyCode,
        monthly.invoiceId, // Exclude this monthly invoice's linked invoiceId
        t
      );

      // 5. Update MonthlyInvoice.monthlyBookingCode
      await monthly.update(
        { monthlyBookingCode: newInvoiceNumber },
        { transaction: t }
      );

      // 6. Update linked Invoice.invoiceNumber
      if (monthly.invoiceId) {
        const inv = await Invoice.findByPk(monthly.invoiceId, { transaction: t });
        if (inv) {
          await inv.update(
            { invoiceNumber: newInvoiceNumber },
            { transaction: t }
          );
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Invoice Number Updated Successfully",
      newInvoiceNumber,
    });
  } catch (error: any) {
    console.error("changeMonthlyInvoiceNumber error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
