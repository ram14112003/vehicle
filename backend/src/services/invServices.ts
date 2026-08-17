
import { Request, Response } from "express";
import { Invoice } from "../models/invoice";
import { Booking } from "../models/booking";
import { Vendor } from "../models/vendor";
import { Payment } from "../models/payment";
import { ClosePending } from "../models/closepending";
import { PackageData } from "../models/packageData";
import { ORDER, USERS } from "../utils/costants";
import { User } from "../models/user";
const { ROLES } = USERS;
import config from '../config/config';
import { Op, fn, col, literal, Sequelize } from "sequelize";
import { Company, Drivers, Vehicle, VehicleMaster, VehicleType } from "../models";
import { sendEmailFromTemplate, fetchAllEmailConfs } from "../services/emailConfServices";
import { formatDateTime } from '../utils/formatDateTime';
import { buildEmailInvoiceBlockFromRaw, buildRemainderEmailInvoiceBlockFromRaw } from "../services/closependingorderServices";
import path from "path";
import fs from "fs";
import { generateInvoiceHTML, mapBookingToInvoiceData } from "../appServices/appInvoiceServices";
import puppeteer from "puppeteer";

export const createInvoice = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { bookingId, closependingId, vendorId, paymentId, invoiceStatus } = req.body;

    // Required Params Validation
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }
    if (!closependingId) {
      return res.status(400).json({ success: false, message: "closependingId is required" });
    }
    const booking = await Booking.findByPk(bookingId, {

    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }


    const closePending = await ClosePending.findByPk(closependingId, { include: [PackageData] });
    if (!closePending) {
      return res.status(404).json({ success: false, message: "ClosePending not found" });
    }


    const vendor = vendorId ? await Vendor.findByPk(vendorId) : null;


    const payment = paymentId ? await Payment.findByPk(paymentId) : null;


    const invoiceCount = await Invoice.count();
    const invoiceNumber = invoiceCount + 1;

    const packageAmount = closePending.packageAmount || 0;
    const driverBatta = 600; // Example, can be dynamic
    const tollgate = closePending.extraCharges || 0;
    const totalAmount = Number(packageAmount) + Number(driverBatta) + Number(tollgate);


    const invoice = await Invoice.create({
      bookingId,
      vendorId,
      paymentId,
      userId: booking.userId,
      vehicleId: booking.vehicleId,
      employeeId: null,
      companyId: booking.user?.companyId,
      invoiceStatus: invoiceStatus || "pending",
      startDate: closePending.garageOpenDateTime,
      endDate: closePending.garageCloseDateTime,
      invoiceNumber,
      invoiceAmount: totalAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
      details: {
        booking,
        closePending,
        vendor,
        payment,
        calculatedAmount: {
          packageAmount,
          driverBatta,
          tollgate,
          totalAmount,
        },
      },
    });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating invoice",
      error: error.message,
    });
  }
};
// Get Pending Invoices with filters
export const getInvoicesPayHolder = async (req: Request, res: Response) => {
  try {
    const { userId, companyId, email, startDate, endDate } = req.query;

    // Prevent search on empty filters
    if (!companyId && !email && !startDate && !endDate && !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one search filter (User, Email, Company, or Date Range).",
      });
    }

    // Base filter → pending invoices
    const whereClause: any = { invoiceStatus: 0 };

    // 🔹 Filters
    if (userId) {
      whereClause["$user.userId$"] = userId;
    }
    if (companyId) {
      whereClause["$user.company.companyId$"] = companyId;
    }
    if (email) {
      whereClause["$user.email$"] = email;
    }
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(startDate as string),
          new Date(endDate as string),
        ],
      };
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          attributes: [
            "bookingId",
            "bookingCode",
            "pickupCity",
            "pickupArea",
            "pickupPoint",
            "confirmStatus",
          ],
          where: {
            confirmStatus: ORDER.STATUS.INITIALIZED, // ✅ only initialized bookings
          },
        },
        {
          model: User,
          attributes: ["userId", "username", "userAddress", "email", "mobile"],
          include: [
            {
              model: Company,
              attributes: ["companyId", "companyName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = invoices.map((inv) => ({
      orderNumber: inv.booking?.bookingCode || "",
      bookingId: inv.booking?.bookingId || "",
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.createdAt,
      userName: inv.user?.username || "",
      pickupCity: inv.booking?.pickupCity || "",
      pickupArea: inv.booking?.pickupArea || "",
      pickupPoint: inv.booking?.pickupPoint || "",
      invoiceAmount: inv.invoiceAmount,

      // 🔹 Extra user details
      userId: inv.user?.userId || "",
      userEmail: inv.user?.email || "",
      userMobile: inv.user?.mobile || "",
      userAddress: inv.user?.userAddress || "",

      // 🔹 Company details
      companyId: inv.user?.company?.companyId || "",
      companyName: inv.user?.company?.companyName || "",
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching initialized invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch initialized invoices",
    });
  }
};

// export const sendInvoiceReminder = async (req: Request, res: Response) => {
//   try {
//     const { invoiceNumbers } = req.body;

//     if (!invoiceNumbers || invoiceNumbers.length === 0) {
//       return res.status(400).json({ success: false, message: "No invoice numbers provided" });
//     }

//     // 🔹 Get all email templates dynamically
//     const emailConfigs = await fetchAllEmailConfs();
//     const invoiceMsgConf = emailConfigs.find((conf: any) => conf.emailCode === "INVOICE_MSG");

//     if (!invoiceMsgConf) {
//       return res.status(404).json({ success: false, message: "Invoice email template not found" });
//     }

//     // 🔹 Fetch invoices with user details
//     const invoicesToSend = await Invoice.findAll({
//       where: { invoiceNumber: invoiceNumbers },
//       include: [{ model: User, attributes: ["userId", "username", "email"] }],
//     });

//     if (invoicesToSend.length === 0) {
//       return res.status(404).json({ success: false, message: "No matching invoices found" });
//     }

//     // 🔹 Loop through invoices
//     for (const invoice of invoicesToSend) {
//       const customerEmail = invoice.user?.email;
//       if (!customerEmail) {
//         console.warn(`No email found for invoice ${invoice.invoiceNumber}. Skipping.`);
//         continue;
//       }
//       //  Use custom date format
//       const invoiceDate = formatDateTime(new Date(invoice.createdAt));

//       const invoiceList = `
//         Invoice #: ${invoice.invoiceNumber}<br/>
//         Amount: ₹${invoice.invoiceAmount}<br/>
//         Date: ${invoiceDate}<br/>
//       `;
// const BASE_URL = config.baseurl.apibaseurl;
// const payLink = `${BASE_URL}/invoice/user-invoice-details/${invoice.userId}`;

//       // 🔹 Send email using template
//       await sendEmailFromTemplate(invoiceMsgConf.emailCode, {
//         UserName: invoice.user?.username ?? "Customer",
//         UserEmail: customerEmail!,
//         InvoiceNumber: invoice.invoiceNumber!,
//         InvoiceList: invoiceList,
//         PaymentLink:payLink!,
//       });
//     }

//     return res.json({ success: true, message: "Invoice reminder emails sent successfully" });
//   } catch (error: any) {
//     console.error("Email send error:", error);
//     return res.status(500).json({ success: false, message: "Failed to send invoice reminders" });
//   }
// };

const nINR = (n: any) => {
  const num = Number(n || 0);
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
export const sendInvoiceReminder = async (req: Request, res: Response) => {
  try {
    const { invoiceNumbers } = req.body;

    if (!invoiceNumbers || !Array.isArray(invoiceNumbers) || invoiceNumbers.length === 0) {
      return res.status(400).json({ success: false, message: "No invoice numbers provided" });
    }

    // 🔹 Email template
    const emailConfigs = await fetchAllEmailConfs();
    const invoiceMsgConf = emailConfigs.find((conf: any) => conf.emailCode === "INVOICE_MSG");

    if (!invoiceMsgConf) {
      return res.status(404).json({ success: false, message: "Invoice email template not found" });
    }

    // 🔹 Fetch selected invoices (full join same like earlier)
    const invoices: any[] = await Invoice.findAll({
      where: { invoiceNumber: invoiceNumbers },
      include: [
        {
          model: Booking,
          as: "booking",
          required: false,
          include: [
            {
              model: User,
              as: "user",
              required: false,
              include: [{ model: Company, as: "company", required: false }],
            },
            { model: VehicleType, as: "vehicleType", required: false },
            {
              model: Vehicle,
              as: "vehicle",
              required: false,
              include: [{ model: VehicleMaster, as: "vehicleMaster", required: false }],
            },
          ],
        },
        {
          model: ClosePending,
          as: "closePending",
          required: false,
          include: [{ model: PackageData, as: "packageData", required: false }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!invoices.length) {
      return res.status(404).json({ success: false, message: "No invoices found" });
    }

     /* ---------------- REMOVE DUPLICATES (IMPORTANT) ---------------- */
    const uniqueInvoiceMap = new Map<string, any>();

    for (const inv of invoices) {
      if (!uniqueInvoiceMap.has(inv.invoiceId)) {
        uniqueInvoiceMap.set(inv.invoiceId, inv);
      }
    }

    const uniqueInvoices = Array.from(uniqueInvoiceMap.values());

    // ✅ We send ONE email (since UI filters one user)
    const firstInv: any = uniqueInvoices[0];
    const booking0 = firstInv.booking;
    const user0 = booking0?.user;

    if (!user0?.email) {
      return res.status(400).json({ success: false, message: "User email not found" });
    }

    // ✅ build table rows (only selected rows)
    const rowsHtml = uniqueInvoices
      .map((inv: any) =>
        buildRemainderEmailInvoiceBlockFromRaw(
          inv.booking?.toJSON?.() ?? inv.booking,
          inv.closePending?.toJSON?.(),
          inv?.toJSON?.()
        )
      )
      .join("");

    // ✅ total amount from selected invoices only
    const totalAmount = uniqueInvoices.reduce(
      (sum: number, inv: any) => sum + Number(inv?.invoiceAmount || 0),
      0
    );

    const BASE_URL = config.baseurl.apibaseurl;
    const payLink = `${BASE_URL}/invoice/user-invoice-details/${user0.userId}`;

    // ✅ Email body like screenshot
    const emailInvoiceBlock = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.6">
        

        <h2 style="margin:18px 0 10px 0;">Invoice Details</h2>

        <table width="100%" style="border-collapse:collapse;border:1px solid #e5e5e5">
          <thead>
            <tr style="background:#f6f6f6">
              <th style="text-align:left;padding:10px;font-size:13px;border-bottom:1px solid #e5e5e5">Invoice Number</th>
              <th style="text-align:left;padding:10px;font-size:13px;border-bottom:1px solid #e5e5e5">Invoice Date</th>
              <th style="text-align:left;padding:10px;font-size:13px;border-bottom:1px solid #e5e5e5">Description</th>
              <th style="text-align:right;padding:10px;font-size:13px;border-bottom:1px solid #e5e5e5">Invoice Amount (Rs)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="text-align:right;margin-top:12px;">
          <span style="font-size:13px;color:#666;margin-right:10px;">Total Amount</span>
          <span style="font-size:24px;font-weight:bold;">${nINR(totalAmount)}</span>
        </div>

      
      
      </div>
    `;

        let recipientEmail = user0.email;
console.log("User Email: ", recipientEmail);
    if (user0.companyId) {
      const company = await Company.findByPk(user0.companyId, {
        attributes: ["needEmail"],
      });

      if (company?.needEmail === false) {
      recipientEmail = ["gracecabs1975@gmail.com","traveldesk@gracecabs.com"];
       
      }
    }
           
    await sendEmailFromTemplate(invoiceMsgConf.emailCode, {
      UserName: user0.username ?? "Customer",
      UserEmail:recipientEmail,
      InvoiceList: emailInvoiceBlock,
      PaymentLink: payLink,
    });

    return res.json({
      success: true,
      message: "Invoice reminder email sent successfully (selected invoices only)",
       sentTo: recipientEmail,
    });
  } catch (error) {
    console.error("Reminder mail error:", error);
    return res.status(500).json({ success: false, message: "Failed to send reminders" });
  }
};


// ✅ KEEP your existing getPendingInvoices as it is (no change needed)
export const getPendingInvoices = async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = req.query;

    const whereClause: any = { invoiceStatus: 0 };

    if (userId) whereClause["$user.userId$"] = userId;
    if (companyId) whereClause["$user.companyId$"] = companyId;

    const invoices: any[] = await Invoice.findAll({
      attributes: ["invoiceId", "invoiceNumber", "invoiceAmount", "createdAt", "bookingId", "userId", "paymentId"],
      where: whereClause,
      include: [
        {
          model: Booking,
          attributes: ["bookingId", "bookingCode", "pickupCity", "pickupArea", "pickupPoint"],
        },
        {
          model: User,
          attributes: ["userId", "username", "userAddress", "email", "mobile"],
          include: [{ model: Company, attributes: ["companyId", "companyName"] }],
        },
        {
          model: Payment,
          attributes: ["paymentId", "transactionId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = invoices.map((inv) => ({
      invoiceId: inv.invoiceId || "",
      orderNumber: inv.booking?.bookingCode || "",
      bookingId: inv.booking?.bookingId || "",
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.createdAt,
      userName: inv.user?.username || "",
      pickupCity: inv.booking?.pickupCity || "",
      pickupArea: inv.booking?.pickupArea || "",
      pickupPoint: inv.booking?.pickupPoint || "",
      invoiceAmount: inv.invoiceAmount,

      transactionId: inv.payment?.transactionId || "",

      userId: inv.user?.userId || "",
      userEmail: inv.user?.email || "",
      userMobile: inv.user?.mobile || "",
      userAddress: inv.user?.userAddress || "",

      companyId: inv.user?.company?.companyId || "",
      companyName: inv.user?.company?.companyName || "",
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching pending invoices:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending invoices" });
  }
};

export const getFilteredPendingInvoices = async (req: Request, res: Response) => {
  try {
    const { username, company, fromDate, toDate } = req.query;

    // Filters
    const invoiceWhere: any = { invoiceStatus: 0 };
    const userWhere: any = {};

    // Username filter
    if (username) {
      userWhere.username = { [Op.like]: `%${username}%` };
    }

    // Company filter
// Company filter
if (company && company !== "all") {
  userWhere.companyId = company;
}


    // Date range filter
   // Date range filter
if (fromDate && toDate) {
  const start = new Date(fromDate as string);
  const end = new Date(toDate as string);
  end.setHours(23, 59, 59, 999);

  invoiceWhere.createdAt = {
    [Op.gte]: start,
    [Op.lte]: end,
  };
}


    const invoices = await Invoice.findAll({
      where: invoiceWhere,
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: ["bookingId", "bookingCode", "pickupCity", "pickupArea"],
        },
        {
          model: User,
          as: "user",
          attributes: ["userId", "username", "companyId"],
          where: userWhere,
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["companyId", "companyName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format response
    const result = invoices.map((inv) => ({
      orderNumber: inv.booking?.bookingCode || "",
      bookingId: inv.booking?.bookingId || "",
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.createdAt,
      userName: inv.user?.username || "",
      companyName: inv.user?.company?.companyName || "",
      pickupCity: inv.booking?.pickupCity || "",
      pickupArea: inv.booking?.pickupArea || "",
      invoiceAmount: inv.invoiceAmount,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching pending invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending invoices",
    });
  }
};
export const getCompletedInvoices = async (req: Request, res: Response) => {
  try {
    const { username, company, fromDate, toDate } = req.query;

    // Filters
    const invoiceWhere: any = { invoiceStatus: 9 }; // ✅ Completed invoices only
    const userWhere: any = {};

    // Username filter
    if (username) {
      userWhere.username = { [Op.like]: `%${username}%` };
    }

// Company filter
if (company && company !== "all") {
  userWhere.companyId = company;
}


    // Date range filter
   // Date range filter
if (fromDate && toDate) {
  const start = new Date(fromDate as string);
  const end = new Date(toDate as string);
  end.setHours(23, 59, 59, 999);

  invoiceWhere.createdAt = {
    [Op.gte]: start,
    [Op.lte]: end,
  };
}


    const invoices = await Invoice.findAll({
      where: invoiceWhere,
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: [
            "bookingId",
            "bookingCode",
            "pickupCity",
            "pickupArea",
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["userId", "username", "companyId"],
          where: userWhere,
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["companyId", "companyName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Map the response
    const result = invoices.map((inv) => ({
      orderNumber: inv.booking?.bookingCode || "",
      bookingId: inv.booking?.bookingId || "",
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.createdAt,
      userName: inv.user?.username || "",
      companyName: inv.user?.company?.companyName || "",
      pickupPoint: `${inv.booking?.pickupCity || ""} - ${inv.booking?.pickupArea || ""}`,
      invoiceAmount: inv.invoiceAmount,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching completed invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed invoices",
      error: error.message,
    });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const { username, company, fromDate, toDate } = req.query;

    // Filters for invoices
    const invoiceWhere: any = {
      invoiceStatus: {
        [Op.ne]: '6', // Exclude cancelled invoices
      },
    };

    // Filters for users
    const userWhere: any = {};

    // Username filter
    if (username) {
      userWhere.username = { [Op.like]: `%${username}%` };
    }

    // Company filter
    if (company) {
      userWhere.companyId = company;
    }

    // Date range filter
    // Date range filter
if (fromDate && toDate) {
  const start = new Date(fromDate as string);
  const end = new Date(toDate as string);
  end.setHours(23, 59, 59, 999);

  invoiceWhere.createdAt = {
    [Op.gte]: start,
    [Op.lte]: end,
  };
}


    // Fetch all invoices with filters
    const invoices = await Invoice.findAll({
      where: invoiceWhere,
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: ["bookingId", "bookingCode", "pickupCity", "pickupArea"],
        },
        {
          model: User,
          as: "user",
          attributes: ["userId", "username", "companyId"],
          where: userWhere,
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["companyId", "companyName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Map the fetched data to the format required by the frontend table.
    const result = invoices.map((inv) => ({
      orderNumber: inv.booking?.bookingCode || "",
      bookingId: inv.booking?.bookingId || "",
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.createdAt,
      userName: inv.user?.username || "",
      companyName: inv.user?.company?.companyName || "",
      // Combine city and area to create the pickup point string
      pickupPoint: `${inv.booking?.pickupCity || ""} - ${inv.booking?.pickupArea || ""}`,
      invoiceAmount: inv.invoiceAmount,
      // Apply the logic for the Status field
      // If invoiceStatus is '4', set the status to "Paid", otherwise set it to "Not Paid".
      status: inv.invoiceStatus === '9' ? "Paid" : "Not Paid",
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching all invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all invoices",
      error: error.message,
    });
  }
};


export const getAllCompanyInvoices = async (req: Request, res: Response) => {
  try {
    const companies = await Company.findAll();

    if (!companies || companies.length === 0) {
      return res.status(404).json({ success: false, message: "No companies found!" });
    }

    const companySummaries: any[] = [];

    for (const company of companies) {
      // Get all bookings for this company
      const bookings = await Booking.findAll({
        include: [
          {
            model: User,
            as: "user",
            where: { companyId: company.companyId },
            attributes: []
          }
        ]
      });

      const bookingsCount = bookings.length;

      // ClosePending amounts (for company) - FIXING DOUBLE COUNTING ISSUE AND RENAMING
      let totalDue = 0; // RENAMED: totalAmount -> totalDue
      let taxAmount = 0;
    
      //  IMPORTANT FIX: Fetch ClosePending records ONCE outside of the booking loop
      const cps = await ClosePending.findAll({
        where: { companyId: company.companyId }
      });

      for (const cp of cps) {
        // Summing totalDue and taxAmount
        totalDue += Number(cp.totalDue || 0); // RENAMED: totalAmount variable used here
        taxAmount += Number(cp.totalTaxAmount || 0);
      }
      // The redundant and incorrect loops have been removed from here.

      // Invoices (for company)
      const invoices = await Invoice.findAll({
        where: { companyId: company.companyId }
      });

      let paidAmount = 0;
      for (const inv of invoices) {
        if (inv.invoiceStatus === ORDER.STATUS.PAYMENTCOMPLETED.toString()) {
          paidAmount += Number(inv.invoiceAmount || 0);
        }
      }

      const pendingAmount = totalDue - paidAmount; // RENAMED: totalAmount -> totalDue

      companySummaries.push({
        companyId: company.companyId,
        companyName: company.companyName,
        bookingsCount,
        totalDue: totalDue, // Mapped to the correct variable name
        taxAmount,
        paidAmount,
        pendingAmount
      });
    }

    return res.status(200).json({
      success: true,
      data: companySummaries
    });
  } catch (error: any) {
    console.error("Error fetching all company invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company invoice summaries",
      error: error.message
    });
  }
};



export const getcompanyOrderSummery = async (req: Request, res: Response) => {
  try {
    const { companyId, pickupPoint, fromDate, toDate, filterType } = req.query;

    const whereClause: any = {};

    // Filter by companyId
    if (companyId) {
      whereClause["$User.Company.companyId$"] = companyId as string;
    }

    // Filter by pickupPoint
    if (pickupPoint && pickupPoint !== "null" && pickupPoint !== "") {
      whereClause.pickupPoint = pickupPoint as string;
    }

    // Filter by date range
    if (fromDate && toDate) {
      whereClause.bookingDate = {
        [Op.between]: [new Date(fromDate as string), new Date(toDate as string)],
      };
    }

    // Determine grouping
    let periodAttr: any;
    switch (filterType) {
      case "daily":
        periodAttr = fn("DATE", col("Booking.bookingDate"));
        break;
      case "weekly":
        // Use date for each booking, we'll sum in code per week
        periodAttr = fn("DATE", col("Booking.bookingDate"));
        break;
      case "monthly":
        periodAttr = fn("DATE_FORMAT", col("Booking.bookingDate"), "%Y-%m");
        break;
      case "yearly":
        periodAttr = fn("YEAR", col("Booking.bookingDate"));
        break;
      default:
        periodAttr = fn("DATE", col("Booking.bookingDate"));
    }

    const orders = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Payment,
          required: false,
          attributes: [],
        },
        {
          model: User,
          required: true,
          include: [{ model: Company, required: true, attributes: [] }],
          attributes: [],
        },
      ],
      attributes: [
        [periodAttr, "period"],
        [fn("SUM", literal(`CASE WHEN Payment.status = 4 THEN Payment.amount ELSE 0 END`)), "paidAmount"],
        [fn("COUNT", literal(`CASE WHEN Payment.status = 4 THEN 1 END`)), "paidOrderCount"],
        [fn("SUM", literal(`CASE WHEN Payment.status = 5 THEN Payment.amount ELSE 0 END`)), "pendingAmount"],
        [fn("COUNT", literal(`CASE WHEN Payment.status = 5 THEN 1 END`)), "pendingOrderCount"],
        [fn("SUM", literal(`CASE WHEN Payment.status = 6 THEN Payment.amount ELSE 0 END`)), "cancelAmount"],
        [fn("COUNT", literal(`CASE WHEN Payment.status = 6 THEN 1 END`)), "cancelOrderCount"],
        [col("User.Company.companyId"), "companyId"],
        [col("User.Company.companyName"), "companyName"],
        [col("Booking.pickupPoint"), "pickupPoint"],
      ],
      group: [
        periodAttr,
        col("User.Company.companyId"),
        col("User.Company.companyName"),
        col("Booking.pickupPoint"),
      ],
      order: [[fn("MIN", col("Booking.bookingDate")), "ASC"]],
      raw: true,
    });

    // Aggregate weekly totals if filterType = weekly
    let finalData = orders;
    if (filterType === "weekly") {
      const weekMap: any = {};

      orders.forEach((o: any) => {
        const weekStart = new Date(o.period);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        weekStart.setDate(diff);
        const weekKey = `${o.companyId}-${o.pickupPoint}-${weekStart.toISOString().slice(0, 10)}`;

        if (!weekMap[weekKey]) {
          weekMap[weekKey] = {
            period: weekStart.toISOString().slice(0, 10),
            companyId: o.companyId,
            companyName: o.companyName,
            pickupPoint: o.pickupPoint,
            paidAmount: parseFloat(o.paidAmount),
            paidOrderCount: o.paidOrderCount,
            pendingAmount: parseFloat(o.pendingAmount),
            pendingOrderCount: o.pendingOrderCount,
            cancelAmount: parseFloat(o.cancelAmount),
            cancelOrderCount: o.cancelOrderCount,
          };
        } else {
          weekMap[weekKey].paidAmount += parseFloat(o.paidAmount);
          weekMap[weekKey].paidOrderCount += o.paidOrderCount;
          weekMap[weekKey].pendingAmount += parseFloat(o.pendingAmount);
          weekMap[weekKey].pendingOrderCount += o.pendingOrderCount;
          weekMap[weekKey].cancelAmount += parseFloat(o.cancelAmount);
          weekMap[weekKey].cancelOrderCount += o.cancelOrderCount;
        }
      });

      finalData = Object.values(weekMap).map((o: any) => ({
        ...o,
        paidAmount: o.paidAmount.toString(),
        pendingAmount: o.pendingAmount.toString(),
        cancelAmount: o.cancelAmount.toString(),
      }));
    }

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      data: finalData,
    });
  } catch (error) {
    console.error("[GET_COMPANY_ORDER_SUMMARY_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving orders.",
      error: (error as Error).message,
    });
  }
};

export const getInvoicesByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

const invoices = await Invoice.findAll({
  where: {
    userId,
    invoiceStatus: ORDER.STATUS.PENDING,
  },
  include: [
    {
      model: Booking,
      as: "booking",
      attributes: ["bookingDate", "bookingId", "pickupPoint"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["username", "email", "mobile"], // Include email and phone
        },
      ],
    },
    {
      model: Payment,
      as: "payment", // alias matches the @BelongsTo alias
      attributes: ["transactionId"], // Just get the transactionId
    },
  ],
  attributes: ["invoiceId", "invoiceNumber", "invoiceAmount", "createdAt"],
  order: [["createdAt", "DESC"]],
});

    // Transform the response
    const result = invoices.map((inv) => ({
      invoiceId: inv.invoiceId,
      bookingId: inv.booking ? inv.booking.bookingId : null,
      invoiceNumber: inv.invoiceNumber,
      invoiceAmount: inv.invoiceAmount,
      invoiceDate: inv.createdAt,
      pickupDate: inv.booking ? inv.booking.bookingDate : null,
      pickupType: inv.booking ? inv.booking.pickupPoint : null,
      username: inv.booking?.user ? inv.booking.user.username : null, // common username
      email:  inv.booking?.user ? inv.booking.user.email : null,
      phno:  inv.booking?.user ? inv.booking.user.mobile : null,
      transactionId: inv.payment ? inv.payment.transactionId : null, // <-- Added this line

    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


//get count based on user - user details
export const getUserOrderStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    // 1️⃣ Booking counts
    const bookingPendingCount = await Booking.count({
      where: { userId, confirmStatus: String(ORDER.STATUS.PENDING) },
    });

    const bookingClosedCount = await Booking.count({
      where: { userId, confirmStatus: String(ORDER.STATUS.CONFIRMED) },
    });

    // 2️⃣ Invoice counts & totals
    const pendingInvoices = await Invoice.findAll({
      where: { userId, invoiceStatus: ORDER.STATUS.PENDING }, // assuming invoiceStatus is still string
      attributes: ["invoiceAmount"],
    });
    const invoicePendingCount = pendingInvoices.length;
    const invoicePendingAmount = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.invoiceAmount || 0),
      0
    );

    const completedInvoices = await Invoice.findAll({
      where: { userId, invoiceStatus:  ORDER.STATUS.PAYMENTCOMPLETED },
      attributes: ["invoiceAmount"],
    });
    const invoiceCompletedCount = completedInvoices.length;
    const invoiceCompletedAmount = completedInvoices.reduce(
      (sum, inv) => sum + (inv.invoiceAmount || 0),
      0
    );

    // 3️⃣ Response
    return res.json({
      success: true,
      data: {
        confirmPendingOrder: bookingPendingCount,
        closedPendingOrder: bookingClosedCount,
        invoicePendingOrderCount: invoicePendingCount,
        invoicePendingOrderAmount: invoicePendingAmount,
        invoicepaidOrderCount: invoiceCompletedCount,
        invoicePaidOrderAmount: invoiceCompletedAmount,
        paymentPendingOrderCount: invoicePendingCount,
       paymentPendingOrderAmount: invoicePendingAmount,
        paymentCompletedOrderCount: invoiceCompletedCount,
        paymentCompletedOrderAmount: invoiceCompletedAmount,

      },
    });
  } catch (error) {
    console.error("Error fetching user order stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getInvoiceStatusCount = async (req: Request, res: Response) => {
  try {
    const pendingCount = await Invoice.count({
      where: { invoiceStatus: ORDER.STATUS.PENDING }
    });

    const completedCount = await Invoice.count({
      where: { invoiceStatus: ORDER.STATUS.PAYMENTCOMPLETED }
    });

    const totalCount = pendingCount + completedCount;

    // Percentage calculation
    const pendingPercentage = totalCount > 0 ? (pendingCount / totalCount) * 100 : 0;
    const completedPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        pending: pendingCount,
        completed: completedCount,
        pendingPercentage: pendingPercentage.toFixed(2), // 2 decimal places
        completedPercentage: completedPercentage.toFixed(2),
      },
    });
  } catch (error) {
    console.error("[GET_INVOICE_STATUS_COUNT_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice status counts",
      error: (error as Error).message,
    });
  }
};

//when cancel the order that time send email to user
export const cancelInvoice = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId, remarks } = req.body;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    // Get booking with user
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: User, as: "user" }],
    });

     const invoice = await Invoice.findOne({ where: {bookingId : booking?.bookingId  }});

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
   // console.log("bef ",booking);
    // Update booking + related records
    const [affected] = await Booking.update(
      { confirmStatus: ORDER.STATUS.CONFIRMED },
      { where: { bookingId } }
    );
 // console.log("aft ",booking);
    if (booking.paymentId) {
      await Payment.update(
        { status: ORDER.STATUS.CANCELLED },
        { where: { paymentId: booking.paymentId } }
      );
    }

    await Invoice.update(
      { invoiceStatus: ORDER.STATUS.CANCELLED },
      { where: { bookingId } }
    );

    if (affected === 0) {
      return res
        .status(200)
        .json({ message: "No matching bookings found to update" });
    }

    // -----------------------------
    // 📧 Send Email to User only
    // -----------------------------
    let needEmail = false;
    let companyName;

if (booking.user?.companyId) {
  const company = await Company.findByPk(
    booking.user.companyId,
    { attributes: ["needEmail"] }
  );
  needEmail = company?.needEmail === true;
  companyName = company?.companyName;
}

console.log("cancelll needEmail:", needEmail);
  if(needEmail)
    {
    try {
      const user = booking.user as any;
      console.log("inveoice cancelled ",user," ", user.email);
      if (!user?.email) throw new Error("User email not found");

      const bookingDateTime = new Date(booking.bookingDate);
      const formattedBookingDate = formatDateTime(bookingDateTime);

      const emailConfigs = await fetchAllEmailConfs();
      const cancelClientConf = emailConfigs.find(
        (c: any) => c.emailCode === "ORDER_CANCEL_EMAIL_TO_ADMIN"
      );
      console.log("cwn in bef if ",cancelClientConf, cancelClientConf?.emailCode);
      if (cancelClientConf) {
        console.log("inside if ",user.email);
        await sendEmailFromTemplate(cancelClientConf.emailCode, {
          UserName: user.username || "",
          UserEmail: user.email,
          OrderNumber: booking.bookingCode,
          CancelRemarks: remarks || "No remarks provided",
          InvoiceDetails: `
            payment: ${invoice?.invoiceAmount} <br/>
          `,
          BookingDetails: `
            Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
            Drop: ${booking.dropPoint}<br/>
            Date: ${formattedBookingDate}<br/>
          `,
        });
      }
    } catch (emailError) {
      console.error("Invoice booking email error:", emailError);
    }
  }
  else 
  {
       try {
     const user = booking.user as any;
      const bookingDateTime = new Date(booking.bookingDate);
      const formattedBookingDate = formatDateTime(bookingDateTime);

      const emailConfigs = await fetchAllEmailConfs();
      const cancelClientConf = emailConfigs.find(
        (c: any) => c.emailCode === "ORDER_CANCEL_EMAIL_TO_ADMIN"
      );
      console.log("cwn in bef if ",cancelClientConf, cancelClientConf?.emailCode);
      if (cancelClientConf) {
      //  console.log("inside if ",user.email);
        await sendEmailFromTemplate(cancelClientConf.emailCode, {
          UserName: "Sir",
          UserEmail: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
          OrderNumber: booking.bookingCode,
          CancelRemarks: remarks || "No remarks provided",
          InvoiceDetails: `
            payment: ${invoice?.invoiceAmount} <br/>
          `,
          BookingDetails: `
            username: ${user.username} <br/>
            Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
            Drop: ${booking.dropPoint}<br/>
            Date: ${formattedBookingDate}<br/>
          `,
        });
      }
    } catch (emailError) {
      console.error("Invoice booking email error:", emailError);
    }

  }

     try {
     const user = booking.user as any;
   if (user?.mobile) {
    const mobileNumber = user.mobile;
   
    try {
      // 2Factor API configuration from environment variables
      const apiKey = process.env.TWO_FACTOR_API_KEY;
      const senderId = process.env.TWO_FACTOR_SENDER_ID;
      const templateName = "Invoice Cancel";
     
      if (!apiKey || !senderId) {
        throw new Error("SMS API configuration missing in environment variables");
      }
     
      // Build SMS URL with parameters
      const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${mobileNumber}&from=${senderId}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(user.username || '')}&var2=${encodeURIComponent(booking?.bookingCode || '')}&var3=${encodeURIComponent(invoice?.invoiceNumber || '')}`;
 
      // Send SMS using fetch
      const smsResponse = await fetch(smsUrl);
     
      if (!smsResponse.ok) {
        throw new Error(`SMS API request failed with status: ${smsResponse.status}`);
      }
     
      const smsResult = await smsResponse.json();
     
      console.log(" SMS sent successfully:", smsResult);
    } catch (smsError: any) {
      console.error(" SMS send error:", smsError.message);
     
    }
  } else {
    console.log(" User mobile number not found");
  }
} catch (error: any) {
  console.error(" Unexpected error in SMS sending process:", error);
}
   
 

    return res.status(200).json({
      message:
        "Invoice cancelled successfully. Email sent to user if configured.",
    });
  } catch (err) {
    console.error("Invoice cancel Status Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const resendClosePendingInvoiceEmail = async (req: any, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }

    // ✅ Find latest invoice for this booking
    const invoice = await Invoice.findOne({
      where: { bookingId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: ClosePending,
          as: "closePending",
          required: false,
          include: [{ model: PackageData, as: "packageData", required: false }],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found for this booking" });
    }

    // ✅ Fetch booking with all details needed for email block + PDF mapping
    const completeBooking = await Booking.findByPk(bookingId, {
      include: [
        { model: VehicleType, as: "vehicleType", required: false },

        {
          model: User,
          as: "user",
          required: false,
          include: [{ model: Company, as: "company", required: false }],
        },

        // Booking -> Vehicle (if exists)
        {
          model: Vehicle,
          as: "vehicle",
          required: false,
          include: [{ model: VehicleMaster, as: "vehicleMaster", required: false }],
        },

        // Booking -> VehicleMaster (your main one)
        {
          model: VehicleMaster,
          as: "vehicleMaster",
          required: false,
        },

        { model: Drivers, as: "driver", required: false },
      ],
    });

    if (!completeBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const b = completeBooking.toJSON?.() ?? completeBooking;
    const cp = invoice.closePending?.toJSON?.() ?? invoice.closePending;
    const inv = invoice.toJSON?.() ?? invoice;

    if (!cp) {
      return res.status(404).json({
        success: false,
        message: "ClosePending not found for this booking invoice",
      });
    }

    // ✅ Ensure correct vehicleMaster (important!)
    let correctVehicleMaster: any = b.vehicleMaster;
    if (!correctVehicleMaster && b.vehicleMasterId) {
      correctVehicleMaster = await VehicleMaster.findByPk(b.vehicleMasterId, {
        attributes: ["vehicleMasterId", "vehicleNumber", "vehicleModelName", "vehicleType"],
      });
      correctVehicleMaster = correctVehicleMaster?.toJSON?.() ?? correctVehicleMaster;
    }

    const bookingForPdf = {
      ...b,
      vehicleMaster: correctVehicleMaster || b.vehicle?.vehicleMaster || b.vehicleMaster || null,

      // ✅ Make shape compatible with mapBookingToInvoiceData
      payment: {
        invoices: [
          {
            ...inv,
            closePending: {
              ...cp,
              packageData: cp?.packageData,
            },
          },
        ],
      },
    };

    // ✅ Build same email block used in createClosePending
    // ✅ Use same HTML as PDF so email body matches PDF
const invoiceData = mapBookingToInvoiceData(bookingForPdf);
const htmlContent = generateInvoiceHTML(invoiceData);

const emailInvoiceBlock = htmlContent;

    // ✅ Generate PDF (same as close pending)
    let pdfPath: string | null = null;
    let pdfFileName: string | null = null;

    try {
 
      const uploadsDir = path.join(process.cwd(), "uploads", "invoices");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(0);
      // await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 0 });
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 0 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      pdfFileName = `invoice_${bookingId}_${Date.now()}.pdf`;
      pdfPath = path.join(uploadsDir, pdfFileName);

      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      await browser.close();
    } catch (e) {
      console.error("PDF generation failed (resend):", e);
      pdfPath = null;
      pdfFileName = null;
    }

    // ✅ Email send
    const emailConfigs = await fetchAllEmailConfs();
    const conf = emailConfigs.find((x: any) => x.emailCode === "USER_INVOICE_EMAIL");

    if (!conf) {
      return res.status(500).json({ success: false, message: "Email template USER_INVOICE_EMAIL not found" });
    }

    const userEmail = b?.user?.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email not found" });
    }

    // ✅ Pay link (same style)
    const BASE_URL = config.baseurl.apibaseurl;
    const payLink = `${BASE_URL}/invoice/user-invoice-details/${b.userId}`;

    // ✅ needEmail logic (same as your createClosePending)
    let needEmail = false;
    if (b?.user?.companyId) {
      const company = await Company.findByPk(b.user.companyId, { attributes: ["needEmail"] });
      needEmail = company?.needEmail === true;
    }

    const toEmail = needEmail
      ? userEmail
      : "robertjayakumar@gmail.com,traveldesk@gracecabs.com";

    await sendEmailFromTemplate(
      conf.emailCode,
      {
        UserName: b?.user?.username ?? "",
        UserEmail: toEmail,
        OrderNumber: b?.bookingCode ?? b?.bookingId ?? "",
        InvoiceTemple: emailInvoiceBlock,
        PayLink: `<a href="${payLink}">Click here to Pay</a>`,
      },
      pdfPath && pdfFileName ? [{ path: pdfPath, filename: pdfFileName }] : []
    );

    return res.status(200).json({
      success: true,
      message: "Invoice email resent successfully!",
      data: { bookingId, invoiceNumber: inv.invoiceNumber, pdfGenerated: !!pdfPath },
    });
  } catch (err) {
    console.error("resendClosePendingInvoiceEmail error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};