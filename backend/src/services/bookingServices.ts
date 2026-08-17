import { Request, Response } from 'express';
import { Booking } from '../models/booking';
import { Vehicle } from '../models/vehicle';
import { OnCallInvoice } from '../models/onCallInvoice';
import { OnCallInvoiceItems } from '../models/onCallInvoiceItems';
import { MonthlyInvoice } from '../models/monthlyInvoice';
import { MonthlyInvoiceItems } from '../models/monthlyInvoiceItems';
import { VehicleType } from '../models/vehicleType';
import { USERS } from "../utils/costants";
import { ORDER } from '../utils/costants';
import { ClosePending, Employee, Invoice, PackageData, PaymentMode, Tax, User } from '../models';
import { Payment } from "../models/payment";
import { Drivers, Vendor, VehicleMaster } from '../models';
import { Company } from "../models/company";
import { Op, fn, col, literal } from "sequelize";
const { ROLES } = USERS;
import { fetchAllEmailConfs, sendEmailFromTemplate } from "../services/emailConfServices";
import { formatDateTime } from "../utils/formatDateTime";
import { sendNotification } from "../utils/sendNotification";
import { normalizePackageDetails } from './closependingorderServices';
import { CreatedAt } from 'sequelize-typescript';
import puppeteer from "puppeteer";
import path from 'path';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Partner } from '../models/Partner';
import { UniqueConstraintError } from "sequelize";
import fs from 'fs';

const logoPath = path.join(__dirname, "..", "images", "logo.png");
const logoBase64 = fs.readFileSync(logoPath, "base64");
const logoSrc = `data:image/jpeg;base64,${logoBase64}`;
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

//  Keep date exactly as DB, but use your IST formatting when Date object is present
const fmtDT = (d?: string | Date | null) => {
  if (!d) return "-";

  // If DB sends a plain string → use it directly (no formatting, no shift)
  if (typeof d === "string") return d;

  // Otherwise, format properly using your common util
  return formatDateTime(d);
};

// Simple date (for due date, etc.)
const fmtD = (d?: string | Date | null) => {
  if (!d) return "-";
  const parsed = dayjs(d, "YYYY-MM-DD HH:mm:ss", true);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : "-";
};

const n = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

function mapToUserInvoiceData(booking: any, targetInvoiceId?: string) {
  console.log("mapuser ",booking,targetInvoiceId);
  const invs = booking?.payment?.invoices || [];
  const invoice = targetInvoiceId
    ? invs.find((i: any) => i.invoiceId === targetInvoiceId)
    : invs[0];

 const cp = invoice?.closePending || {};

// ✅ Read from closependings.selectedPackageData first (your DB column)
const pkgRaw =
  cp?.selectedPackageData ??
  cp?.packageData?.selectedPackageData ??
  cp?.packageData?.packages;

const pkg = (() => {
  try {
    const parsed = typeof pkgRaw === "string" ? JSON.parse(pkgRaw) : pkgRaw;
    // sometimes it may be an array
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {
    return null;
  }
})();

const lineItems: Array<{ label: string; value: number }> = [];

/* 1️⃣ Package Amount */
if (pkg && pkg.amount !== undefined && pkg.amount !== null) {
  lineItems.push({
    label: "Package Amount",
    value: n(pkg.amount),
  });
}

/* 2️⃣ Additional KMs */
if (cp?.additionalKmsAmount !== undefined) {
  lineItems.push({
    label: cp?.additionalKms
      ? `Additional Km(s) (${n(cp.additionalKms)} × ₹${n(cp.additionalKmRate || 55)})`
      : "Additional Km(s)",
    value: n(cp.additionalKmsAmount),
  });
}

/* 3️⃣ Additional Hours */
if (cp?.additionalHoursAmount !== undefined) {
  lineItems.push({
    label: cp?.additionalHours
      ? `Additional Hours (${n(cp.additionalHours)} × ₹${n(cp.additionalHourRate || 50)})`
      : "Additional Hours",
    value: n(cp.additionalHoursAmount),
  });
}

/* 4️⃣ Sub Total */
if (cp?.totalAmount !== undefined) {
  lineItems.push({
    label: "Total Amount",
    value: n(cp.totalAmount),
  });
}

/* 5️⃣ CGST */
if (cp?.totalTaxAmount !== undefined) {
  lineItems.push({
    label: "Total Tax Amount",
    value: n(cp.totalTaxAmount),
  });
}

/* 6️⃣ Extra Charges */
if (cp?.extraCharges) {
  lineItems.push({
    label: cp?.chargesTitle || "Extra Charges",
    value: n(cp.extraCharges),
  });
}

/* 7️⃣ Discount */
if (cp?.discountAmount) {
  lineItems.push({
    label: "Discount Amount",
    value: -n(cp.discountAmount),
  });
}

/* 8️⃣ Advance */
if (cp?.advanceAmount) {
  lineItems.push({
    label: "Advance",
    value: -n(cp.advanceAmount),
  });
}

/* 9️⃣ Total Due */
lineItems.push({
  label: "Total Due",
  value: n(cp?.totalDue ?? invoice?.invoiceAmount),
});

  const data = {
    invoiceNumber: invoice?.invoiceNumber || booking?.bookingCode || booking?.bookingId,
   // invoiceDate: fmtDT(invoice?.createdAt || invoice?.startDate),
    //dueDate: fmtD(invoice?.endDate ||  dayjs(invoice?.createdAt || new Date()).add(7, "day").toDate()),
    invoiceDate: fmtDT(
  // prefer invoice.startDate (if present), else fallback to invoice.createdAt or booking.createdAt
  invoice?.startDate
    ? // make sure we pass a Date to fmtDT
      (typeof invoice.startDate === "string" ? dayjs(invoice.startDate).toDate() : invoice.startDate)
    : invoice?.createdAt || booking?.createdAt
),

dueDate: fmtDT(
  // prefer invoice.endDate (if present), else fallback to createdAt + 7 days
  invoice?.endDate
    ? (typeof invoice.endDate === "string" ? dayjs(invoice.endDate).toDate() : invoice.endDate)
    : dayjs(invoice?.createdAt || booking?.createdAt || new Date()).add(10, "day").toDate()
),
   // startDate: fmtDT(invoice?.startDate),
   // endDate: fmtDT(invoice?.endDate),

    customerName: booking?.user?.username || "Customer",
    customerAddress:
      (booking?.user?.company?.companyName ? booking.user.company.companyName + ", " : "") +
      (booking?.user?.company?.companyAddress || booking?.user?.userAddress || "-"),
    gstNo: booking?.user?.company?.gstNo || "-",
    city: booking?.user?.city || "-",
    state: booking?.user?.state || "-",
    country: booking?.user?.country || "India",

    orderNumber: booking?.bookingCode || booking?.bookingId,
    pickupPoint: booking?.pickupPoint || "-",
    vehicleType:
      booking?.vehicleType?.vehicleTypeName ||
      booking?.vehicle?.vehicleMaster?.vehicleModelName || "-",
    pickupDate: fmtDT(booking?.bookingDate || cp?.pickupDate),
        vehicleNumber: booking.vehicle?.vehicleNumber || booking.vehicle?.vehicleMaster?.vehicleNumber,

    email: booking?.user?.email || "-",
    mobile: booking?.user?.mobile || "-",

    tripDetails: `${booking?.pickupPoint || ""} → ${booking?.dropPoint || booking?.pickupCity || ""}`,
    lineItems,

    garageOpen: {
      kms: n(cp?.garageOpenKm || cp?.garageKms),
      dateTime: fmtDT(cp?.garageOpenDateTime),
    },
    garageClose: {
      kms: n(cp?.garageCloseKm || cp?.garageKms),
      dateTime: fmtDT(cp?.garageCloseDateTime),
    },
    usageKms: n(cp?.garageKms),
    usageHours: n(cp?.usageHours),
  };
  console.log("inv star ",invoice.startDate," ",invoice.endDate," booking.cre ",booking.createdAt);
  return data;
}

export { mapToUserInvoiceData };




export const createPartner = async (req: Request, res: Response) => {
  try {
     // Check if email already exists
    const existingEmail = await Partner.findOne({ where: { email: req.body.email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered!",
      });
    }
    const partner = await Partner.create(req.body);

    // Build email data placeholders
    const emailData = {
      UserName: partner.name,
      Name: partner.name,
      Email: partner.email,
      ContactNumber: partner.contactNumber,
      PresentAddress: partner.presentAddress,
      CityPreferred: partner.cityPreferred,
      VehicleType: partner.vehicleType,
      LicenseNo: partner.licenseNo,
      RegistrationNumber: partner.registrationNumber,
      RegistrationYear: partner.registrationYear,
      FuelType: partner.fuelType,
      PassengerCapacity: partner.passengerCapacity.toString(),

      // From & To emails
      to: "gracecabs1975@gmail.com,traveldesk@gracecabs.com",
      UserEmail: partner.email,

      // If template uses FromName & FromAddress
      FromName: "Grace Cabs",
      FromAddress: "traveldesk@gracecabs.com",
    };

    // Send Email using template
    await sendEmailFromTemplate("PARTNER_MESSAGE", emailData);

    return res.status(201).json({
      success: true,
      message: "Partner details submitted & email sent successfully!",
      data: partner,
    });

  } catch (error: any) {
    console.error("Error:", error);

    if (error instanceof UniqueConstraintError) {
      const field = error.errors[0].path; // email, contactNumber, or registrationNumber
      return res.status(400).json({
        success: false,
        message: `${field} already registered!`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to submit details",
      error: error.message,
    });
  }

};


// export const createPartner = async (req: Request, res: Response) => {
//   try {
//     const partner = await Partner.create(req.body);
//     res.status(201).json({
//       success: true,
//       message: "Partner details submitted successfully!",
//       data: partner,
//     });
//   } catch (error: any) {
//     console.log("Error:", error);
//     res.status(400).json({
//       success: false,
//       message: "Failed to submit details",
//       error: error.message,
//     });
//   }
// };


// Get All Drivers
export const getAllOrders = async (req:any, res: Response) => {
  try {
    const role = req.role;
    const userid = req.userId;
    console.log(role,userid);
    // if (role === ROLES.DRIVER) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied. You are not authorized to view orders.',
    //   });
    // }
    console.log("userrrrrrrrr",User.findOne(userid));
    if(role === ROLES.USER) {
      const orders = await Booking.findAll({
             include: [
                     { model: VehicleType,    required: false,    
                       include: [
                      {
                        model: Vehicle,
                        as: "vehicle",
                        required: false,
                      },] },
                     { model:  Vehicle,    required: false},
                     { model:  User,   as: 'user', required: false,
                       attributes: ['userId', 'username', 'email', 'mobile'],
                                                  include: [
                              {
                                model: Company,
                          //      as: 'company',     // must match User → Company alias
                                required: false,
                                attributes: ['companyId', 'companyName']
                              }
                            ]},
                 ],    
                   where: { userId: userid },
                  order: [['createdAt', 'DESC']]
    });
  //    console.log(orders);
//     console.log(
//   'Booking associations:',
//   Object.keys(Booking.associations)
// );
    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully.',
      data: orders,
    });
    } 
   // if(role === ROLES.USER) {
    else {
           const orders = await Booking.findAll({
             include: [
                     { model: VehicleType,    required: false,
                          include: [
                      {
                        model: Vehicle,
                        as: "vehicle",
                        required: false,
                      },]
                      },
                     { model:  Vehicle,    required: false},
                         { model:  User,   as: 'user', required: false,
                       attributes: ['userId', 'username', 'email', 'mobile'],
                                              include: [
                              {
                                model: Company,
                          //      as: 'company',     // must match User → Company alias
                                required: false,
                                attributes: ['companyId', 'companyName']
                              }
                            ]
                     },
                     
                 ],    
                //   where: { userId: userid },
                  order: [['createdAt', 'DESC']]
    });
    //  console.log(orders);
    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully.',
      data: orders,
    });
    }
   
  } catch (error) {
    console.error('[GET_ALL_ORDERS_ERROR]', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving orders.',
      error: (error as Error).message,
    });
  }
};


export const getOrdersByStatus = async (confirmStatus: number) => {
  return await Booking.findAll({
    where: { confirmStatus },include: [
                    { model: VehicleType ,    required: false},
                    { model: Vehicle,    required: false },
                ], order: [["createdAt", "DESC"]],
  });
};

export const editBooking = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId } = req.params;
    const updateFields = req.body;

    // Authorization check
    if (role === ROLES.DRIVER) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to edit this booking.',
      });
    }

    // Find the booking by ID
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Update the booking fields
    await booking.update(updateFields);

     //push notification
        try {
          const user = await User.findOne({
            where: { userId: booking.userId },
          });
          const driverToken = await Drivers.findOne({
            where: { driverId: booking.driverId },
          });
        
          const fcm_token = driverToken?.fcm_token;
          const user_fcm_token = user?.fcm_token;
          console.log("driver confirm booking1 ",fcm_token);
          if (!fcm_token) {
            console.log("No FCM token found for driver:", booking.driverId);
           // return;
          }
          else {
              sendNotification(fcm_token, `Hi ${driverToken?.driverName}, Booking changed, pls check..`, `Booking changed for ${driverToken?.driverName}`);
          }
          if(!user_fcm_token) {
            console.log("No FCM token found for driver:", booking.userId);
           // return;
          } else {  
            sendNotification(user_fcm_token, `Hi ${user?.username}, Booking changed, pls check..`, `Booking changed for ${user?.username}`);
          }
        
        
        } catch (error: any) {
          console.error("Notification send error:", error);
        }

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully.',
      data: booking,
    });
  } catch (error) {
    console.error('[EDIT_BOOKING_ERROR]', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the booking.',
      error: (error as Error).message,
    });
  }
};

export const editCloseBooking = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId } = req.params;
    const updateFields = req.body;

    // Authorization check
    if (role === ROLES.DRIVER) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to edit this booking.',
      });
    }

    // Find the booking by ID
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Update the booking fields
    await booking.update(updateFields);

     //push notification
        try {
          const user = await User.findOne({
            where: { userId: booking.userId },
          });
          const driverToken = await Drivers.findOne({
            where: { driverId: booking.driverId },
          });
        
          const fcm_token = driverToken?.fcm_token;
          const user_fcm_token = user?.fcm_token;
          console.log("driver confirm booking2 ",fcm_token);
          if (!fcm_token) {
            console.log("No FCM token found for driver:", booking.driverId);
           // return;
          }
          if(!user_fcm_token) {
            console.log("No FCM token found for driver:", booking.userId);
           // return;
          }
        
          await sendNotification(fcm_token, `Hi ${driverToken?.driverName}, Booking changed, pls check..`, `Booking changed for ${driverToken?.driverName}`);
          await sendNotification(user_fcm_token, `Hi ${user?.username}, Booking changed, pls check..`, `Booking changed for ${user?.username}`);
          
        } catch (error: any) {
          console.error("Notification send error:", error);
        }

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully.',
      data: booking,
    });
  } catch (error) {
    console.error('[EDIT_BOOKING_ERROR]', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the booking.',
      error: (error as Error).message,
    });
  }
};

// export const cancelBooking = async (req: any, res: Response) => {
//   try {
//     const role = req.role;
//     const { bookingId,remarks } = req.body;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const updateConfirm = await Booking.update({ confirmStatus: ORDER.STATUS.CANCELLED, remarks: remarks },
//       {
//         where: {
//           bookingId: bookingId,
//         }
//       }
//     );

//     if (updateConfirm[0] === 0) {
//       return res.status(200).json({ message: 'No matching bookings found to update' });
//     }

//     return res.status(200).json({
//       message: 'Trip Cancel status updated successfully',
//       updateConfirm
//     });
//   } catch (err) {
//     console.error('Trip cancel Status Error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };


//when cancel the order that time send email to user
export const cancelBooking = async (req: any, res: Response) => {
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

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update booking + related records
    const [affected] = await Booking.update(
      { confirmStatus: ORDER.STATUS.CANCELLED, remarks },
      { where: { bookingId } }
    );

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

if (booking.user?.companyId) {
  const company = await Company.findByPk(
    booking.user.companyId,
    { attributes: ["needEmail"] }
  );
  needEmail = company?.needEmail === true;
}

console.log("cancel needEmail:", needEmail);
     if(needEmail)
    {
    try {
      const user = booking.user as any;
      if (!user?.email) throw new Error("User email not found");

      const bookingDateTime = new Date(booking.bookingDate);
      const formattedBookingDate = formatDateTime(bookingDateTime);

      const emailConfigs = await fetchAllEmailConfs();
      const cancelClientConf = emailConfigs.find(
        (c: any) => c.emailCode === "ORDER_CANCEL_EMAIL_TO_CLIENT"
      );

      if (cancelClientConf) {
        await sendEmailFromTemplate(cancelClientConf.emailCode, {
          UserName: user.username || "",
          UserEmail: user.email,
          OrderNumber: booking.bookingCode,
          CancelRemarks: remarks || "No remarks provided",
          BookingDetails: `
            Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
            Drop: ${booking.dropPoint}<br/>
            Date: ${formattedBookingDate}<br/>
          `,
        });
      }
    } catch (emailError) {
      console.error("Cancel booking email error:", emailError);
    }
  }

     
    try{
      const user = booking.user as any;
      if(user?.mobile){
              const apiKey =  process.env.TWO_FACTOR_API_KEY;
        const senderId =  process.env.TWO_FACTOR_SENDER_ID;
        const templateName = "Booking Cancellation";
        if (!apiKey || !senderId) {
          console.error(" SMS API configuration missing in environment variables");
        } else {
          // Build SMS URL with parameters
          const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${user?.mobile}&from=${senderId}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(user?.username|| '',)}&var2=${encodeURIComponent(booking?.bookingCode || '',)}&var3=${encodeURIComponent(booking?.pickupArea || '',)}&var4=${encodeURIComponent(booking?.dropPoint || '',)}`;
 
          // Send SMS using fetch
          const smsResponse = await fetch(smsUrl);
 
          if (!smsResponse.ok) {
            throw new Error(`SMS API request failed with status: ${smsResponse.status}`);
          }
 
          const smsResult = await smsResponse.json();
          console.log(" SMS sent successfully:", smsResult);
        }
      } else {
        console.log(" User mobile number not found");
      }
 
    }catch(err){
      console.log("1234",err)
    }

    return res.status(200).json({
      message:
        "Trip cancelled successfully. Booking, Payment & Invoice updated if available. Email sent to user if configured.",
    });
  } catch (err) {
    console.error("Trip cancel Status Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCancelledBooking = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.findAll({
      where: { confirmStatus: ORDER.STATUS.CANCELLED },
    });

    res.status(200).json({
      message: "Cancelled bookings fetched successfully",
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch cancelled bookings",
      error: error.message,
    });
  }
};

export const declineBooking = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId, remarks } = req.body;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const updateConfirm = await Booking.update({ bookingStatus: ORDER.STATUS.DECLINED, remarks: remarks },
      {
        where: {
          bookingId: bookingId,
        }
      }
    );

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    return res.status(200).json({
      message: 'Trip Declined status updated successfully',
      updateConfirm
    });
  } catch (err) {
    console.error('Trip decline Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// export const getOrderById = async (req: Request, res: Response) => {
//   try {
//     const { bookingId } = req.body;

//     if (!bookingId) {
//       return res.status(400).json({
//         success: false,
//         message: "bookingId is required in request body.",
//       });
//     }

//     const order = await Booking.findByPk(bookingId, {
//       include: [
//         {
//           model: VehicleType,
//           as: "vehicleType",
//           required: false,
//         },

//         // ✅ Booking -> VehicleMaster -> Vehicle (YOUR REQUIRED FLOW)
//         {
//           model: VehicleMaster,
//           as: "vehicleMaster", // ✅ from Booking.belongsTo(VehicleMaster)
//           required: false,
//           attributes: [
//             "vehicleMasterId",
//             "vehicleNumber",
//             "vehicleModelName",
//             "vehicleTypeId",
//             "vehicleType",
//             "vendorId",
//             "vendorName",
//             "vehicleId",
//           ],
//           include: [
//             {
//               model: Vehicle, // ✅ from VehicleMaster.belongsTo(Vehicle)
//               as: "vehicle",  // ✅ MUST MATCH alias in vehicleMaster.ts
//               required: false,
//               attributes: [
//                 "vehicleId",
//                 "vehicleName",
//                 "manufacturing",
//                 "vehicleImg",
//                 "availableStatus",
//                 "vehicleTypeId",
//               ],
//             },
//             {
//               model: Vendor,
//               as: "vendor",
//               required: false,
//               attributes: ["vendorId", "vendorName"],
//             },
//           ],
//         },

//         {
//           model: Invoice,
//           as: "invoice",
//           required: false,
//           where: { bookingId },
//           attributes: [
//             "invoiceId",
//             "invoiceNumber",
//             "invoiceAmount",
//             "invoiceStatus",
//             "startDate",
//             "endDate",
//             "closePendingId",
//             "paymentId",
//             "createdAt",
//           ],
//           include: [
//             {
//               model: ClosePending,
//               as: "closePending",
//               required: false,
//               attributes: [
//                 "closependingId",
//                 "pickupDate",
//                 "garageKms",
//                 "garageOpenDateTime",
//                 "garageCloseDateTime",
//                 "guestKms",
//                 "guestOpenDateTime",
//                 "guestCloseDateTime",
//                 "hideGuestDetails",
//                 "packageDataId",
//                 "companyId",
//                 "additionalKms",
//                 "additionalHours",
//                 "discountAmount",
//                 "packageAmount",
//                 "additionalKmsAmount",
//                 "additionalHoursAmount",
//                 "extraCharges",
//                 "extraDriverBeta",
//                 "cgstApplicable",
//                 "igstApplicable",
//                 "sgstApplicable",
//                 "cgstAmount",
//                 "igstAmount",
//                 "sgstAmount",
//                 "totalTaxAmount",
//                 "totalAmount",
//                 "totalDue",
//                 "isDeleted",
//                 "createdAt",
//                 "total",
//                 "advanceAmount",
//                 "garageOpenKm",
//                 "garageCloseKm",
//                 "guestOpenKm",
//                 "guestCloseKm",
//                 "selectedPackageData",
//                 "chargesTitle",
//                 "chargesRemarks",
//               ],
//             },
//             {
//               model: Payment,
//               as: "payment",
//               required: false,
//               attributes: [
//                 "paymentId",
//                 "status",
//                 "paymentMode",
//                 "isOnline",
//                 "amount",
//                 "transactionId",
//                 "tax",
//                 "createdAt",
//               ],
//             },
//           ],
//         },

//         {
//           model: User,
//           as: "user",
//           required: false,
//           attributes: [
//             "userId",
//             "username",
//             "email",
//             "mobile",
//             "companyId",
//             "userAddress",
//           ],
//           include: [
//             {
//               model: Company,
//               as: "company",
//               required: false,
//               attributes: ["companyId", "companyName", "companyAddress", "managerEmail"],
//             },
//           ],
//         },

//         {
//           model: Drivers,
//           as: "driver",
//           required: false,
//           attributes: [
//             "driverId",
//             "driverName",
//             "driverEmail",
//             "phno",
//             "city",
//             "state",
//             "country",
//             "address",
//             "pincode",
//             "licenseNo",
//             "ratings",
//           ],
//         },
//       ],
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Booking details retrieved successfully.",
//       data: order,
//     });
//   } catch (error) {
//     console.error("[GET_ORDER_BY_ID_ERROR]", error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while retrieving the booking.",
//       error: (error as Error).message,
//     });
//   }
// };
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required in request body.",
      });
    }

    const order = await Booking.findByPk(bookingId, {
      include: [
        {
          model: VehicleType,
          as: "vehicleType",
          required: false,
        },

        // ✅ Booking -> VehicleMaster -> Vehicle (YOUR REQUIRED FLOW)
        {
          model: VehicleMaster,
          as: "vehicleMaster", // ✅ from Booking.belongsTo(VehicleMaster)
          required: false,
          attributes: [
            "vehicleMasterId",
            "vehicleNumber",
            "vehicleModelName",
            "vehicleTypeId",
            "vehicleType",
            "vendorId",
            "vendorName",
            "vehicleId",
          ],
          include: [
            {
              model: Vehicle, // ✅ from VehicleMaster.belongsTo(Vehicle)
              as: "vehicle",  // ✅ MUST MATCH alias in vehicleMaster.ts
              required: false,
              attributes: [
                "vehicleId",
                "vehicleName",
                "manufacturing",
                "vehicleImg",
                "availableStatus",
                "vehicleTypeId",
              ],
            },
            {
              model: Vendor,
              as: "vendor",
              required: false,
              attributes: ["vendorId", "vendorName"],
            },
          ],
        },

        {
          model: Invoice,
          as: "invoice",
          required: false,
          where: { bookingId },
          attributes: [
            "invoiceId",
            "invoiceNumber",
            "invoiceAmount",
            "invoiceStatus",
            "startDate",
            "endDate",
            "closePendingId",
            "paymentId",
            "createdAt",
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
                "usageHours",
                "guestOpenDateTime",
                "guestCloseDateTime",
                "hideGuestDetails",
                "packageDataId",
                "companyId",
                "additionalKms",
                "additionalHours",
                "discountAmount",
                "packageAmount",
                "additionalKmsAmount",
                "additionalHoursAmount",
                "extraCharges",
                "extraDriverBeta",
                "cgstApplicable",
                "igstApplicable",
                "sgstApplicable",
                "cgstAmount",
                "igstAmount",
                "sgstAmount",
                "totalTaxAmount",
                "totalAmount",
                "totalDue",
                "isDeleted",
                "createdAt",
                "total",
                "advanceAmount",
                "garageOpenKm",
                "garageCloseKm",
                "guestOpenKm",
                "guestCloseKm",
                "selectedPackageData",
                "chargesTitle",
                "chargesRemarks",
                "extraChargesBreakup",
              ],
            },
            {
              model: Payment,
              as: "payment",
              required: false,
              attributes: [
                "paymentId",
                "status",
                "paymentMode",
                "isOnline",
                "amount",
                "transactionId",
                "tax",
                "createdAt",
              ],
            },
          ],
        },

        {
          model: User,
          as: "user",
          required: false,
          attributes: [
            "userId",
            "username",
            "email",
            "mobile",
            "companyId",
            "userAddress",
          ],
          include: [
            {
              model: Company,
              as: "company",
              required: false,
              attributes: ["companyId", "companyName", "companyAddress", "managerEmail"],
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
            "ratings",
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully.",
      data: order,
    });
  } catch (error) {
    console.error("[GET_ORDER_BY_ID_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the booking.",
      error: (error as Error).message,
    });
  }
};

export const getOrderByEmployeeId = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required in request body.",
      });
    }

    const whereCondition: any = {};

    // If this id exists as employee -> set employeeId
    const isEmployee = await Employee.findOne({ where: { employeeId } });
    if (isEmployee) whereCondition.employeeId = employeeId;

    // If this id exists as user -> set userId
    const isUser = await User.findOne({ where: { userId: employeeId } });
    if (isUser) whereCondition.userId = employeeId;

    // Note: removed Vehicle/VehicleMaster from include to avoid association/eager-loading errors
    const orders = await Booking.findAll({
      where: whereCondition,
      include: [
        {
          model: VehicleType,
          as: "vehicleType",
          required: false,
              include: [
                  {
                    model: Vehicle,
                    as: "vehicle",
                    required: false,
                  }, ],
        },
        {
          model: Payment,
          as: "payment",
          required: false,
          attributes: ["paymentId", "status", "paymentMode", "amount"],
        },
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["userId", "username", "email", "mobile", "companyId"],
          include: [
            {
              model: Company,
              as: "company",
              required: false,
              attributes: ["companyId", "companyName", "companyAddress", "managerEmail"],
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
            "ratings",
            "trackingsource", // DB column on driver (contains "GPS" or "IP Address")
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // 1) collect unique vehicleIds from bookings
    const vehicleIds = Array.from(
      new Set(
        orders
          .map((o: any) => (o.get ? o.get({ plain: true }).vehicleId : o.vehicleId))
          .filter(Boolean)
      )
    );

    // 2) fetch vehicle master rows for those vehicleIds (no association required)
    const vehicleMap: Record<string, { vehicleId: string; vehicleNumber: string }> = {};
    if (vehicleIds.length > 0) {
      // adjust attribute names if your VehicleMaster PK or column names differ
      const vehicleMasters = await VehicleMaster.findAll({
        where: { vehicleId: vehicleIds },
        attributes: ["vehicleId", "vehicleNumber"],
        raw: true,
      });

      vehicleMasters.forEach((v: any) => {
        vehicleMap[v.vehicleId] = v;
      });
    }

    // 3) map each booking to the shape you want and inject vehicleNumber, trackingSource & is_gps_track into vehicleType
    const mapped = orders.map((o: any) => {
      const bookingObj = o.get ? o.get({ plain: true }) : { ...o };

      // ensure vehicleType exists as object (not null) so we can inject fields
      if (!bookingObj.vehicleType) bookingObj.vehicleType = {};

      // Inject vehicleNumber (note: your sample used "vechicleNumber" spelling — keep or change)
      const vehId = bookingObj.vehicleId;
      if (vehId && vehicleMap[vehId] && vehicleMap[vehId].vehicleNumber) {
        // Keep the same key as your requested response ("vechicleNumber") — change to "vehicleNumber" if preferred
        bookingObj.vehicleType.vechicleNumber = vehicleMap[vehId].vehicleNumber;
      }

      // Read driver's trackingsource raw value (from DB). It will be "GPS" or "IP Address"
      const rawTrackingSource =
        bookingObj.driver && bookingObj.driver.trackingsource
          ? String(bookingObj.driver.trackingsource).trim()
          : null;

      // Set trackingSource in response using the raw DB value (if any)
      if (rawTrackingSource) {
        bookingObj.vehicleType.trackingSource = rawTrackingSource;
      } else {
        // you can choose to omit or set null — here we set null to be explicit
        bookingObj.vehicleType.trackingSource = null;
      }

      // Determine is_gps_track: true only when DB value indicates GPS (case-insensitive)
      // DB values: "GPS" or "IP Address" per your note — check for 'gps' substring to be safe.
      bookingObj.vehicleType.is_gps_track =
        !!rawTrackingSource && /gps/i.test(rawTrackingSource);

      return bookingObj;
    });

    return res.status(200).json({
      success: true,
      message: "Booking retrieved successfully.",
      data: mapped,
    });
  } catch (error) {
    console.error("[GET_ORDER_BY_ID_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the booking.",
      error: (error as Error).message,
    });
  }
};
export const getBookingDetails = async (req: Request, res: Response) => {
  try {
    const { bookingCode } = req.params;

    const booking = await Booking.findOne({
      where: { bookingCode },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userId", "username", "email", "mobile", "companyId"],
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["companyId", "companyName", "allowTax"],
            },
          ],
        },
      ],
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const userCompanyId = booking.companyId || booking.user?.companyId;
    const allowTax = booking.user?.company?.allowTax || "";

    // ✅ Vehicle table rates REMOVE. Name மட்டும் போதும்.
    const vehicle = booking.vehicleId
      ? await Vehicle.findOne({
          where: { vehicleId: booking.vehicleId },
          attributes: ["vehicleId", "vehicleName", "vehicleTypeId"],
        })
      : null;

    const vehicleType = await VehicleType.findOne({
      where: { vehicleTypeId: booking.vehicleTypeId },
      attributes: ["vehicleTypeId", "vehicleType", "AdvanceBookingHours"],
    });

    if (!vehicleType) return res.status(404).json({ message: "VehicleType not found" });

    // helpers
    const norm = (s: any) => String(s || "").replace(/\s+/g, "").toLowerCase();

    const safeJson = (v: any) => {
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      return v;
    };

    const pickVehicleRow = (vehiclesObj: any, vehicleTypeName: string) => {
      if (!vehiclesObj || typeof vehiclesObj !== "object") return null;
      const wanted = norm(vehicleTypeName);
      const key = Object.keys(vehiclesObj).find((k) => norm(k) === wanted);
      return key ? vehiclesObj[key] : null;
    };

    const packageData = await PackageData.findAll({
      where: { companyId: userCompanyId, isDeleted: false },
      attributes: ["packageDataId", "packageType", "packages", "companyId"],
      order: [["createdAt", "DESC"]],
    });

    const pickupNorm = norm(booking.pickupPoint);
    const isOutstationPickup = pickupNorm.includes("outstation");
    const isMonthlyPickup =
      pickupNorm.includes("monthly") ||
      pickupNorm.includes("monthlybooking") ||
      pickupNorm.includes("monthlybookings");

    const filteredPackages = packageData.filter((pkg: any) => {
      const t = norm(pkg.packageType);

      if (isOutstationPickup) return t.includes("outstation");
      if (isMonthlyPickup) return t.includes("monthlybookings");

      // Local/Airport/Railway -> local type packages
      return t.includes("local") || t.includes("airport") || t.includes("railway");
    });

    const formattedPackages = filteredPackages.map((pkg: any) => {
      const parsed = safeJson(pkg.packages);

      // ✅ NEW FORMAT (object)
      if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
        const vehiclesObj = parsed.vehicles || {};
        const row = pickVehicleRow(vehiclesObj, vehicleType.vehicleType) || {};

        /* ✅ OUTSTATION */
        if (isOutstationPickup) {
          const perKm = Number(row?.perKm ?? 0);
          const driverBattaPerDay = Number(row?.driverBattaPerDay ?? 0);
          const minimumKmPerDay = Number(row?.minimumKmPerDay ?? 0);

          return {
            packageDataId: pkg.packageDataId,
            packageType: pkg.packageType,
            companyId: pkg.companyId,
            vehicleType: vehicleType.vehicleType,
            packages: [
              {
                outstationPerKm: perKm,
                driverBattaPerDay,
                minimumKmPerDay,
                amount: { amt: perKm, driverBattaPerDay },
              },
            ],
          };
        }

        /* ✅ MONTHLY BOOKINGS (dynamic) */
        if (isMonthlyPickup) {
          const defs = parsed.packageDefinitions || {};
          const keys = Object.keys(defs || {})
            .filter((k) => /^package\d+$/i.test(k))
            .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")));

          const getDef = (id: string) => ({
            hours: Number(defs?.[id]?.hours ?? 0),
            km: Number(defs?.[id]?.km ?? 0),
          });

          const extraHour = Number(row?.extraHour ?? 0);

          const monthlyPackages = keys.map((pid) => {
            const def = getDef(pid);
            return {
              packageId: pid,
              monthlyPerHour: def.hours, // (stored as days/hours)
              monthlyPerKm: def.km,
              amount: Number(row?.[pid] ?? 0),
              extraHour,
            };
          });

          return {
            packageDataId: pkg.packageDataId,
            packageType: pkg.packageType,
            companyId: pkg.companyId,
            vehicleType: vehicleType.vehicleType,
            packages: monthlyPackages,
          };
        }

        /* ✅ LOCAL CITY (dynamic ALL packages) */
        const defs = parsed.packageDefinitions || {};

        // 🔥 IMPORTANT: get all package keys dynamically
        const keys = Object.keys(defs || {})
          .filter((k) => /^package\d+$/i.test(k))
          .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")));

        const extraKm = Number(row?.extraKm ?? 0);
        const extraHour = Number(row?.extraHour ?? 0);

        const getDef = (id: string) => ({
          hours: Number(defs?.[id]?.hours ?? 0),
          km: Number(defs?.[id]?.km ?? 0),
        });

        const localPackages = keys.map((pid) => {
          const def = getDef(pid);
          return {
            packageId: pid,
            localPerHour: def.hours,
            localPerKm: def.km,
            amount: Number(row?.[pid] ?? 0),
            extraKm,
            extraHour,
          };
        });

        return {
          packageDataId: pkg.packageDataId,
          packageType: pkg.packageType,
          companyId: pkg.companyId,
          vehicleType: vehicleType.vehicleType,
          packages: localPackages,
        };
      }

      // ✅ OLD FORMAT (array) fallback
      const arr: any[] = Array.isArray(parsed) ? parsed : [];
      const matched = arr.map((p: any) => {
        const amount =
          p[vehicleType.vehicleType] ??
          p[String(vehicleType.vehicleType || "").toLowerCase()] ??
          p[String(vehicleType.vehicleType || "").toUpperCase()] ??
          0;

        if (isOutstationPickup) {
          const perKm = Number(p.OutstationPerKm ?? p.perKm ?? 0);
          const driverBattaPerDay = Number(p.OSDriverBata ?? p.driverBattaPerDay ?? 0);

          return {
            outstationPerKm: perKm,
            driverBattaPerDay,
            minimumKmPerDay: Number(p.minimumKmPerDay ?? 0),
            amount: { amt: perKm, driverBattaPerDay },
          };
        }

        return {
          localPerKm: Number(p.localPerKm ?? 0),
          localPerHour: Number(p.localPerHour ?? 0),
          amount: Number(amount ?? 0),
          extraKm: Number(p.extraKm ?? 0),
          extraHour: Number(p.extraHour ?? 0),
        };
      });

      return {
        packageDataId: pkg.packageDataId,
        packageType: pkg.packageType,
        companyId: pkg.companyId,
        vehicleType: vehicleType.vehicleType,
        packages: matched,
      };
    });

    // taxes
    let taxDetails = null;
    if (allowTax && (allowTax.toLowerCase() === "yes" || allowTax === "true")) {
      taxDetails = await Tax.findAll({
        where: { isActive: true },
        attributes: ["taxId", "taxName", "taxPercent"],
      });
    }

    return res.json({
      booking,
      vehicle,
      userId: booking.user?.userId,
      companyId: booking.user?.companyId,
      vehicleType,
      packages: formattedPackages,
      tax: taxDetails,
    });
  } catch (error: any) {
    console.error("Error fetching booking details:", error);
    return res.status(500).json({ message: error.message });
  }
};
// export const getBookingDetails = async (req: Request, res: Response) => {
//   try {
//     const { bookingCode } = req.params;

//     const booking = await Booking.findOne({
//       where: { bookingCode },
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: ["userId", "username", "email", "mobile", "companyId"],
//           include: [
//             {
//               model: Company,
//               as: "company",
//               attributes: ["companyId", "companyName", "allowTax"],
//             },
//           ],
//         },
//       ],
//     });

//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     const userCompanyId = booking.user?.companyId;
//     const allowTax = booking.user?.company?.allowTax || "";

//     // ✅ Vehicle table rates REMOVE. Name மட்டும் போதும்.
//     const vehicle = booking.vehicleId
//       ? await Vehicle.findOne({
//           where: { vehicleId: booking.vehicleId },
//           attributes: ["vehicleId", "vehicleName", "vehicleTypeId"],
//         })
//       : null;

//     const vehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId: booking.vehicleTypeId },
//       attributes: ["vehicleTypeId", "vehicleType", "AdvanceBookingHours"],
//     });

//     if (!vehicleType) return res.status(404).json({ message: "VehicleType not found" });

//     // helpers
//     const norm = (s: any) => String(s || "").replace(/\s+/g, "").toLowerCase();

//     const safeJson = (v: any) => {
//       if (!v) return null;
//       if (typeof v === "string") {
//         try {
//           return JSON.parse(v);
//         } catch {
//           return null;
//         }
//       }
//       return v;
//     };

//     const pickVehicleRow = (vehiclesObj: any, vehicleTypeName: string) => {
//       if (!vehiclesObj || typeof vehiclesObj !== "object") return null;
//       const wanted = norm(vehicleTypeName);
//       const key = Object.keys(vehiclesObj).find((k) => norm(k) === wanted);
//       return key ? vehiclesObj[key] : null;
//     };

//     const packageData = await PackageData.findAll({
//       where: { companyId: userCompanyId, isDeleted: false },
//       attributes: ["packageDataId", "packageType", "packages", "companyId"],
//       order: [["createdAt", "DESC"]],
//     });

//     const pickupNorm = norm(booking.pickupPoint);
//     const isOutstationPickup = pickupNorm.includes("outstation");

//     const filteredPackages = packageData.filter((pkg: any) => {
//       const t = norm(pkg.packageType);
//       if (isOutstationPickup) return t.includes("outstation");
//       return t.includes("local") || t.includes("airport") || t.includes("railway");
//     });

//     const formattedPackages = filteredPackages.map((pkg: any) => {
//       const parsed = safeJson(pkg.packages);

//       // ✅ NEW FORMAT (object)
//       if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
//         const vehiclesObj = parsed.vehicles || {};
//         const row = pickVehicleRow(vehiclesObj, vehicleType.vehicleType) || {};

//         // ✅ OUTSTATION: only from packageData JSON
//         if (isOutstationPickup) {
//           const perKm = Number(row?.perKm ?? 0);
//           const driverBattaPerDay = Number(row?.driverBattaPerDay ?? 0);
//           const minimumKmPerDay = Number(row?.minimumKmPerDay ?? 0);

//           return {
//             packageDataId: pkg.packageDataId,
//             packageType: pkg.packageType,
//             companyId: pkg.companyId,
//             vehicleType: vehicleType.vehicleType,
//             packages: [
//               {
//                 outstationPerKm: perKm,
//                 driverBattaPerDay,
//                 minimumKmPerDay,
//                 // (optional) keep old object structure if some screen expects amount obj
//                 amount: { amt: perKm, driverBattaPerDay },
//               },
//             ],
//           };
//         }

//         // ✅ LOCAL CITY: extraKm/extraHour only from packageData JSON
//         const defs = parsed.packageDefinitions || {};
//         const extraKm = Number(row?.extraKm ?? 0);
//         const extraHour = Number(row?.extraHour ?? 0);

//         const getDef = (id: string) => ({
//           hours: Number(defs?.[id]?.hours ?? 0),
//           km: Number(defs?.[id]?.km ?? 0),
//         });

//         const localPackages = ["package1", "package2", "package3", "package4"].map((pid) => {
//           const def = getDef(pid);
//           return {
//             packageId: pid,
//             localPerHour: def.hours, // base package hours
//             localPerKm: def.km,      // base package km
//             amount: Number(row?.[pid] ?? 0),
//             extraKm,
//             extraHour,
//           };
//         });

//         return {
//           packageDataId: pkg.packageDataId,
//           packageType: pkg.packageType,
//           companyId: pkg.companyId,
//           vehicleType: vehicleType.vehicleType,
//           packages: localPackages,
//         };
//       }

//       // ✅ OLD FORMAT (array) fallback - NO VEHICLE TABLE fallback
//       const arr: any[] = Array.isArray(parsed) ? parsed : [];
//       const matched = arr.map((p: any) => {
//         const amount =
//           p[vehicleType.vehicleType] ??
//           p[String(vehicleType.vehicleType || "").toLowerCase()] ??
//           p[String(vehicleType.vehicleType || "").toUpperCase()] ??
//           0;

//         if (isOutstationPickup) {
//           // only from package JSON
//           const perKm = Number(p.OutstationPerKm ?? p.perKm ?? 0);
//           const driverBattaPerDay = Number(p.OSDriverBata ?? p.driverBattaPerDay ?? 0);

//           return {
//             outstationPerKm: perKm,
//             driverBattaPerDay,
//             minimumKmPerDay: Number(p.minimumKmPerDay ?? 0),
//             amount: { amt: perKm, driverBattaPerDay },
//           };
//         }

//         // local old format may not have extraKm/extraHour
//         return {
//           localPerKm: Number(p.localPerKm ?? 0),
//           localPerHour: Number(p.localPerHour ?? 0),
//           amount: Number(amount ?? 0),
//           extraKm: Number(p.extraKm ?? 0),
//           extraHour: Number(p.extraHour ?? 0),
//         };
//       });

//       return {
//         packageDataId: pkg.packageDataId,
//         packageType: pkg.packageType,
//         companyId: pkg.companyId,
//         vehicleType: vehicleType.vehicleType,
//         packages: matched,
//       };
//     });

//     // taxes
//     let taxDetails = null;
//     if (allowTax && (allowTax.toLowerCase() === "yes" || allowTax === "true")) {
//       taxDetails = await Tax.findAll({
//         where: { isActive: true },
//         attributes: ["taxId", "taxName", "taxPercent"],
//       });
//     }

//     return res.json({
//       booking,
//       vehicle,      // ✅ name மட்டும்
//       userId: booking.user?.userId,
//       companyId: booking.user?.companyId,
//       vehicleType,
//       packages: formattedPackages,
//       tax: taxDetails,
//     });
//   } catch (error: any) {
//     console.error("Error fetching booking details:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };
// export const getBookingDetails = async (req: Request, res: Response) => {
//   try {
//     const { bookingCode } = req.params;

//     const booking = await Booking.findOne({
//       where: { bookingCode },
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: ["userId", "username", "email", "mobile", "companyId"],
//           include: [
//             {
//               model: Company,
//               as: "company",
//               attributes: ["companyId", "companyName", "allowTax"],
//             },
//           ],
//         },
//       ],
//     });

//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     const userCompanyId = booking.user?.companyId;
//     const allowTax = booking.user?.company?.allowTax || "";

//     // ✅ Vehicle table rates REMOVE. Name மட்டும் போதும்.
//     const vehicle = booking.vehicleId
//       ? await Vehicle.findOne({
//           where: { vehicleId: booking.vehicleId },
//           attributes: ["vehicleId", "vehicleName", "vehicleTypeId"],
//         })
//       : null;

//     const vehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId: booking.vehicleTypeId },
//       attributes: ["vehicleTypeId", "vehicleType", "AdvanceBookingHours"],
//     });

//     if (!vehicleType) return res.status(404).json({ message: "VehicleType not found" });

//     // helpers
//     const norm = (s: any) => String(s || "").replace(/\s+/g, "").toLowerCase();

//     const safeJson = (v: any) => {
//       if (!v) return null;
//       if (typeof v === "string") {
//         try {
//           return JSON.parse(v);
//         } catch {
//           return null;
//         }
//       }
//       return v;
//     };

//     const pickVehicleRow = (vehiclesObj: any, vehicleTypeName: string) => {
//       if (!vehiclesObj || typeof vehiclesObj !== "object") return null;
//       const wanted = norm(vehicleTypeName);
//       const key = Object.keys(vehiclesObj).find((k) => norm(k) === wanted);
//       return key ? vehiclesObj[key] : null;
//     };

//     const packageData = await PackageData.findAll({
//       where: { companyId: userCompanyId, isDeleted: false },
//       attributes: ["packageDataId", "packageType", "packages", "companyId"],
//       order: [["createdAt", "DESC"]],
//     });

//     const pickupNorm = norm(booking.pickupPoint);
//     const isOutstationPickup = pickupNorm.includes("outstation");

//     const filteredPackages = packageData.filter((pkg: any) => {
//       const t = norm(pkg.packageType);
//       if (isOutstationPickup) return t.includes("outstation");
//       return t.includes("local") || t.includes("airport") || t.includes("railway");
//     });

//     const formattedPackages = filteredPackages.map((pkg: any) => {
//       const parsed = safeJson(pkg.packages);

//       // ✅ NEW FORMAT (object)
//       if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
//         const vehiclesObj = parsed.vehicles || {};
//         const row = pickVehicleRow(vehiclesObj, vehicleType.vehicleType) || {};

//         // ✅ OUTSTATION: only from packageData JSON
//         if (isOutstationPickup) {
//           const perKm = Number(row?.perKm ?? 0);
//           const driverBattaPerDay = Number(row?.driverBattaPerDay ?? 0);
//           const minimumKmPerDay = Number(row?.minimumKmPerDay ?? 0);

//           return {
//             packageDataId: pkg.packageDataId,
//             packageType: pkg.packageType,
//             companyId: pkg.companyId,
//             vehicleType: vehicleType.vehicleType,
//             packages: [
//               {
//                 outstationPerKm: perKm,
//                 driverBattaPerDay,
//                 minimumKmPerDay,
//                 // (optional) keep old object structure if some screen expects amount obj
//                 amount: { amt: perKm, driverBattaPerDay },
//               },
//             ],
//           };
//         }

//         // ✅ LOCAL CITY: extraKm/extraHour only from packageData JSON
//         const defs = parsed.packageDefinitions || {};
//         const extraKm = Number(row?.extraKm ?? 0);
//         const extraHour = Number(row?.extraHour ?? 0);

//         const getDef = (id: string) => ({
//           hours: Number(defs?.[id]?.hours ?? 0),
//           km: Number(defs?.[id]?.km ?? 0),
//         });

//         const localPackages = ["package1", "package2", "package3", "package4"].map((pid) => {
//           const def = getDef(pid);
//           return {
//             packageId: pid,
//             localPerHour: def.hours, // base package hours
//             localPerKm: def.km,      // base package km
//             amount: Number(row?.[pid] ?? 0),
//             extraKm,
//             extraHour,
//           };
//         });

//         return {
//           packageDataId: pkg.packageDataId,
//           packageType: pkg.packageType,
//           companyId: pkg.companyId,
//           vehicleType: vehicleType.vehicleType,
//           packages: localPackages,
//         };
//       }

//       // ✅ OLD FORMAT (array) fallback - NO VEHICLE TABLE fallback
//       const arr: any[] = Array.isArray(parsed) ? parsed : [];
//       const matched = arr.map((p: any) => {
//         const amount =
//           p[vehicleType.vehicleType] ??
//           p[String(vehicleType.vehicleType || "").toLowerCase()] ??
//           p[String(vehicleType.vehicleType || "").toUpperCase()] ??
//           0;

//         if (isOutstationPickup) {
//           // only from package JSON
//           const perKm = Number(p.OutstationPerKm ?? p.perKm ?? 0);
//           const driverBattaPerDay = Number(p.OSDriverBata ?? p.driverBattaPerDay ?? 0);

//           return {
//             outstationPerKm: perKm,
//             driverBattaPerDay,
//             minimumKmPerDay: Number(p.minimumKmPerDay ?? 0),
//             amount: { amt: perKm, driverBattaPerDay },
//           };
//         }

//         // local old format may not have extraKm/extraHour
//         return {
//           localPerKm: Number(p.localPerKm ?? 0),
//           localPerHour: Number(p.localPerHour ?? 0),
//           amount: Number(amount ?? 0),
//           extraKm: Number(p.extraKm ?? 0),
//           extraHour: Number(p.extraHour ?? 0),
//         };
//       });

//       return {
//         packageDataId: pkg.packageDataId,
//         packageType: pkg.packageType,
//         companyId: pkg.companyId,
//         vehicleType: vehicleType.vehicleType,
//         packages: matched,
//       };
//     });

//     // taxes
//     let taxDetails = null;
//     if (allowTax && (allowTax.toLowerCase() === "yes" || allowTax === "true")) {
//       taxDetails = await Tax.findAll({
//         where: { isActive: true },
//         attributes: ["taxId", "taxName", "taxPercent"],
//       });
//     }

//     return res.json({
//       booking,
//       vehicle,      // ✅ name மட்டும்
//       userId: booking.user?.userId,
//       companyId: booking.user?.companyId,
//       vehicleType,
//       packages: formattedPackages,
//       tax: taxDetails,
//     });
//   } catch (error: any) {
//     console.error("Error fetching booking details:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };

export const getOrderPaymentListById = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }

    // 🔹 Fetch payment with related invoices and bookings (via invoice.bookingId)
    const payment = await Payment.findOne({
      where: { paymentId },
      attributes: [
        "paymentId",
        "transactionId",
        "paymentMode",
        "amount",
        "tax",
        "status",
        "isOnline",
        "createdAt",
        "meta"
      ],
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
            "endDate",
            "bookingId",
          ],
          include: [
            {
              model: Booking,
              as: "booking",
              required: false,
              attributes: [
                "bookingId",
                "bookingCode",
                "bookingDate",
                "pickupPoint",
                "dropPoint",
                "confirmStatus",
                "bookingStatus",
                "purpose",
                "roundTrip",
                "vehicleTypeId",
              ],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const paymentObj: any = payment.toJSON ? payment.toJSON() : payment;

    // BANK REF (RRN) — check multiple likely paths (including lastStatusCheck)
    const bankRefNo =
      paymentObj?.meta?.lastStatusCheck?.payment_gateway_response?.rrn ??
      paymentObj?.meta?.lastStatusCheck?.txn_detail?.rrn ??
      paymentObj?.meta?.statusCheck?.payment_gateway_response?.rrn ??
      paymentObj?.meta?.statusCheck?.txn_detail?.rrn ??
      paymentObj?.meta?.payment_gateway_response?.rrn ??
      paymentObj?.meta?.txn_detail?.rrn ??
      paymentObj?.meta?.rrn ??
      null;

    // PAYMENT REF (gateway txn id) — prefer gateway txn ids present in meta
    const paymentRefNo =
      paymentObj?.meta?.lastStatusCheck?.txn_id ??
      paymentObj?.meta?.lastStatusCheck?.txn_detail?.txn_id ??
      paymentObj?.meta?.lastStatusCheck?.txn_uuid ??
      paymentObj?.meta?.lastGatewayTxn ?? // sometimes stored as string like SG3707-ORDER-1
      paymentObj?.meta?.statusCheck?.txn_id ??
      paymentObj?.meta?.statusCheck?.txn_detail?.txn_id ??
      paymentObj?.meta?.txn_uuid ??
      paymentObj?.transactionId ?? // fallback to DB column (less preferred)
      null;

    // attach to data so client receives in data.* (consistent with your example)
    paymentObj.bankRefNo = bankRefNo;
    paymentObj.paymentRefNo = paymentRefNo;

    return res.status(200).json({
      success: true,
      message: "Payment, Invoice, and Booking details fetched successfully",
      data: paymentObj,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      // error: error.message,
    });
  }
};

const toYMD = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

// export const getOverallInvoiceReport = async (req: Request, res: Response) => {
//   try {
//     const { from, to, companyId } = req.query as {
//       from: string;
//       to: string;
//       companyId: string;
//     };
// const taxes = await Tax.findAll({
//   where: { isActive: true },
//   attributes: ["taxName", "taxPercent"],
// });
// // 🔹 build dynamic tax object
// const taxAmounts: Record<string, number> = {};



//     if (!from || !to || !companyId) {
//       return res.status(400).json({ message: "from, to, companyId required" });
//     }

//     const start = new Date(from);
//     start.setHours(0, 0, 0, 0);

//     const end = new Date(to);
//     end.setHours(23, 59, 59, 999);

//     // 🔹 Step 1: Fetch bookings that belong to users of given company
//     const bookings = await Booking.findAll({
//       where: {
//         createdAt: { [Op.between]: [start, end] },
//       },
//       include: [
//         {
//           model: User,
//           as: "user",
//           where: { companyId },
//           include: [{ model: Company, as: "company" }],
//         },
//         {
//           model: Vehicle,
//           as: "vehicle",
//           include: [
//             {
//               model: VehicleMaster,
//               as: "vehicleMaster",
//               attributes: ['vehicleNumber'] // only select what you need
//             },
//           ],
//         },

//         {
//           model: Invoice,
//           as: "invoice",
//           required: false,
//           limit: 1, // latest invoice
//           order: [["createdAt", "DESC"]],
//         },
//         {
//           model: Payment,
//           as: "payment",
//           required: false,
//         },
//       ],
//       order: [["bookingDate", "ASC"]],
//     });

//     // 🔹 Step 2: Prepare result rows
//     const rows = await Promise.all(
//       bookings.map(async (b) => {
// const invoice = b.invoice?.[0];
//         const payment = b.payment;

//         // ClosePending (match by companyId + pickupDate)
//         // const cp = await ClosePending.findOne({
//         //   where: {
//         //     companyId,
//         //     pickupDate: toYMD(b.bookingDate),
//         //     isDeleted: 0,
//         //   },
//         // });

//         const cp = await ClosePending.findOne({
//   where: {
//     companyId,
//     pickupDate: {
//       [Op.between]: [
//         new Date(b.bookingDate.setHours(0, 0, 0, 0)),
//         new Date(b.bookingDate.setHours(23, 59, 59, 999)),
//       ],
//     },
//     isDeleted: false,
//   },
// });

// // compute cp total (if cp record exists)
// let cpTotal = 0;
// if (cp) {
//   cpTotal =
//     Number(cp.packageAmount || 0) +
//     Number(cp.additionalKmsAmount || 0) +
//     Number(cp.additionalHoursAmount || 0) +
//     Number(cp.extraCharges || 0) -
//     Number(cp.discountAmount || 0) 
// }

//    // 🔹 Compute dynamic tax amounts AFTER cp exists
//     const taxAmounts: Record<string, number> = {};
//     if (cp) {
//       taxes.forEach((t: any) => {
//         const key = `${t.taxName.toLowerCase()}Amount`; // e.g., cgstAmount
//         taxAmounts[`cp_${key}`] = Number((cp as any)[key] || 0);
//       });
//     } else {
//       taxes.forEach((t: any) => {
//         const key = `${t.taxName.toLowerCase()}Amount`;
//         taxAmounts[`cp_${key}`] = 0;
//       });
//     }
// let paymentStatus: string = "Pending";

// if (invoice && Number(invoice.invoiceStatus) === 9) {
//   paymentStatus = "Paid";
// } else {
//   paymentStatus = "Pending";
// }




//         return {
//           orderNumber: b.bookingCode,
//           invoiceNumber: invoice?.invoiceNumber || "",
//           invoiceDate: invoice?.createdAt || null,
//           dueDate: invoice?.endDate || null,
//           pickupDate: b.bookingDate,
//           companyName: b.user?.company?.companyName,
//           userName: b.user?.username,
//           pickupArea: b.pickupArea,
//           pickupCity: b.pickupCity,
//           pickupPoint: b.pickupPoint,
//           pickupDetails: `${b.pickupArea}, ${b.pickupCity}`,

//           vehicleNumber: b.vehicle?.vehicleMaster?.vehicleNumber,
//           // cp_packageAmount: cp?.packageAmount || 0,
//           // cp_additionalKms: cp?.additionalKms || 0,
//           // cp_additionalKmsAmount: cp?.additionalKmsAmount || 0,
//           // cp_additionalHours: cp?.additionalHours || 0,
//           // cp_additionalHoursAmount: cp?.additionalHoursAmount || 0,
//           cp_extraCharges: cp?.extraCharges || 0,
//           // cp_discountAmount: cp?.discountAmount || 0,
       
//           cp_totalAmount: cpTotal,
//             ...taxAmounts, // 🔥 dynamic taxes here

//           invoiceAmount: invoice?.invoiceAmount || 0,
//           paymentStatus,
//         };
//       })
//     );

//     // 🔹 Step 3: Summary totals
//     const summary = rows.reduce(
//       (acc, r) => {
//         acc.totalInvoiceAmount += Number(r.invoiceAmount || 0);
//         acc.totalClosePending += Number(r.cp_totalAmount || 0);
//         return acc;
//       },
//       { companyBookingCount: rows.length, totalInvoiceAmount: 0, totalClosePending: 0 }
//     );

// return res.json({
//   from,
//   to,
//   companyId,
//   taxList: taxes,   // ✅ tax table data here
//   summary,
//   rows
// });
//   } catch (err: any) {
//     console.error(err);
//     return res
//       .status(500)
//       .json({ message: "Report error", error: err?.message });
//   }
// };

// export const getOverallInvoiceReport = async (req: Request, res: Response) => {
//   try {
//     const { from, to, companyId } = req.query as any;

//     if (!from || !to || !companyId) {
//       return res.status(400).json({
//         message: "from, to, companyId required",
//       });
//     }

//     /* -------------------- DATE RANGE -------------------- */
//     const start = new Date(from);
//     start.setHours(0, 0, 0, 0);

//     const end = new Date(to);
//     end.setHours(23, 59, 59, 999);

//     /* -------------------- BOOKINGS -------------------- */
//     const bookings = await Booking.findAll({
//       where: {
//         createdAt: { [Op.between]: [start, end] },
//  // ❌ Exclude unwanted statuses
//     confirmStatus: {
//       [Op.notIn]: [0, 1, 6, 7],
//     },
        
//       },

//       include: [
//         {
//           model: User,
//           as: "user",
//           where: { companyId },
//           include: [{ model: Company, as: "company" }],
//         },
//             {
//       model: VehicleMaster,
//       as: "vehicleMaster",
//       attributes: ["vehicleNumber", "vehicleModelName", "vehicleType"],
//       required: false,
//     },
//         {
//           model: Vehicle,
//           as: "vehicle",
//           include: [
//             {
//               model: VehicleMaster,
//               as: "vehicleMaster",
//               attributes: ["vehicleNumber", "vehicleType"],
//             },
//           ],
//         },
//         {
//           model: Invoice,
//           as: "invoice",
//           required: false,
//           limit: 1,
//           order: [["createdAt", "DESC"]],
//         },
//       ],
//       order: [["createdAt", "ASC"]],
//     });

//     /* -------------------- ROW BUILD -------------------- */
//     const rows = await Promise.all(
//       bookings.map(async (b, index) => {
//         const invoice = b.invoice?.[0] ?? null;

//         /* ✅ CORRECT WAY: Invoice → closePendingId */
//         let cp: ClosePending | null = null;
//         if (invoice?.closePendingId) {
//           cp = await ClosePending.findByPk(invoice.closePendingId);
//         }

//         /* ---------------- KM ---------------- */
//         const garageOpenKm = cp?.garageOpenKm ?? 0;
//         const garageCloseKm = cp?.garageCloseKm ?? 0;
//         const totalKm =
//           garageCloseKm > garageOpenKm
//             ? garageCloseKm - garageOpenKm
//             : 0;

            

//         /* ---------------- AMOUNTS ---------------- */
//         const packageAmount = Number(cp?.packageAmount ?? 0);
//         const additionalKmsAmount = Number(cp?.additionalKmsAmount ?? 0);
//         const additionalHoursAmount = Number(cp?.additionalHoursAmount ?? 0);
//         const extraDriverBeta = Number(cp?.extraDriverBeta ?? 0);

//         const isOutstation = b.pickupPoint === "Outstation";

//         const grossAmount = isOutstation
//           ? packageAmount + extraDriverBeta
//           : packageAmount + additionalKmsAmount + additionalHoursAmount;

//         /* ---------------- PAYMENT STATUS ---------------- */
//         let paymentStatus = "Pending";
//         if (invoice && Number(invoice.invoiceStatus) === 9) {
//           paymentStatus = "Completed";
//         }

        
//         const formatTime = (dateInput: any) => {
//   if (!dateInput) return null;
//   const d = new Date(dateInput);
//   return d.toISOString().split('T')[1].split('.')[0]; // Result: "01:39:29"
// };


//         /* ---------------- FINAL ROW ---------------- */
//         return {
//           sno: index + 1,
//           orderNumber: b.bookingCode,
//           tripSheetNumber: cp?.tripSheetNumber ?? "",
//           invoiceNumber: invoice?.invoiceNumber ?? "",
//           invoiceDate: invoice?.createdAt ?? null,
//           pickupDate: b.bookingDate ?? null,
//           companyName: b.user?.company?.companyName ?? "",
//           vehicleNumber: b.vehicleMaster?.vehicleNumber ?? "",
//           carType: b.vehicleMaster?.vehicleType ?? "",
//           userName: `${b.user?.username ?? ""}(${b.user?.email?? ""})`,
//           pickupPoint: b.pickupPoint ?? "",
//           tripDetails: `${b.pickupArea ?? ""} - ${b.pickupCity ?? ""} to ${b.dropPoint ?? ""}`,

//           garageOpenKm,
//           garageCloseKm,
//           totalKm,

//           garageOpenDateTime: formatTime(cp?.garageOpenDateTime ?? null),
//           garageCloseDateTime: formatTime(cp?.garageCloseDateTime ?? null),
//           usageHours: cp?.usageHours ?? "",

//           additionalKms: cp?.additionalKms ?? 0,
//           additionalHours: cp?.additionalHours ?? 0,
//           packageAmount,
//           cabCharge: packageAmount,
//           driverBata: extraDriverBeta,

//           grossAmount,
//           cgstAmount: cp?.cgstAmount ?? 0,
//           sgstAmount: cp?.sgstAmount ?? 0,
//           tollParking: cp?.extraCharges ?? 0,

//           invoiceAmount: invoice?.invoiceAmount ?? 0,
//           paymentStatus,
//         };
//       })
//     );

//     /* ---------------- RESPONSE ---------------- */
//     return res.json({
//       from,
//       to,
//       companyId,
//       rows,
//     });
//   } catch (err: any) {
//     console.error("Overall Invoice Report Error:", err);
//     return res.status(500).json({
//       message: "Report error",
//       error: err.message,
//     });
//   }
// };
// export const getOverallInvoiceReport = async (req: Request, res: Response) => {
//   try {
//     const { from, to, companyId, bookingType } = req.query as any;

//     if (!from || !to || !companyId || !bookingType) {
//       return res.status(400).json({
//         message: "from, to, companyId, bookingType required",
//       });
//     }

//     /* -------------------- DATE RANGE -------------------- */
//     const start = new Date(from);
//     start.setHours(0, 0, 0, 0);

//     const end = new Date(to);
//     end.setHours(23, 59, 59, 999);

//             const formatTime = (dateInput: any) => {
//   if (!dateInput) return null;
//   const d = new Date(dateInput);

//   const hours = d.getHours().toString().padStart(2, "0");
//   const minutes = d.getMinutes().toString().padStart(2, "0");
//   const seconds = d.getSeconds().toString().padStart(2, "0");

//   return `${hours}:${minutes}:${seconds}`; // IST / Local time
// };

// const formatDate = (dateInput: any) => {
//   if (!dateInput) return null;
//   const d = new Date(dateInput);

//   const day = d.getDate().toString().padStart(2, "0");
//   const month = (d.getMonth() + 1).toString().padStart(2, "0");
//   const year = d.getFullYear();

//   return `${day}-${month}-${year}`; // dd-mm-yyyy
// };


//         /* -------------------- COMPANY FILTER -------------------- */
//     const userWhere: any = {};
//     if (companyId !== "ALL") {
//       userWhere.companyId = companyId;
//     }

//     /* =========================================================
//    ONCALL REPORT
// ========================================================= */
// if (bookingType === "oncall") {

//   const oncallWhere: any = {
//     CreatedAt: {
//       [Op.between]: [start, end],
//     },
//   };

//   if (companyId !== "ALL") {
//     oncallWhere.companyId = companyId;
//   }

//   const invoices = await OnCallInvoice.findAll({
//     where: oncallWhere,
//     include: [
//       {
//         model: Company,
//         as: "company",
//       },
//       {
//         model: OnCallInvoiceItems,
//         as: "invoiceItems",
//       },
//     ],
//     order: [["createdAt", "ASC"]],
//   });

//   const rows: any[] = [];

//   let sno = 1;

//   invoices.forEach((invoice: any) => {

//     invoice.invoiceItems?.forEach((item: any) => {

//       let cgstAmount = 0;
//       let sgstAmount = 0;

//       try {

//         const taxes =
//           typeof item.taxes === "string"
//             ? JSON.parse(item.taxes)
//             : item.taxes;

//         if (Array.isArray(taxes)) {
//           taxes.forEach((t: any) => {
//             const taxName =
//               (t.taxName || "").toUpperCase();
//             if (taxName.includes("CGST")) {
//               cgstAmount += Number(t.taxAmount || 0);
//             }
//             if (taxName.includes("SGST")) {
//               sgstAmount += Number(t.taxAmount || 0);
//             }
//           });
//         }
//       } catch (err) {}

//       rows.push({
//         sno: sno++,
//         tripSheetNumber: item.tripSheetNo,
//         invoiceNumber: invoice.onCallInvoiceCode,
//         invoiceDate: formatDate(invoice.createdAt),
//         pickupDate: formatDate(item.date),
//         companyName:
//           invoice.company?.companyName ??
//           invoice.companyName,
//         vehicleNumber: item.vehicleNo,
//         carType: item.vehicleTypeId,
//         userName: item.bookedBy,
//         behalfOfName: item.guestName,
//         pickupPoint: "",
//         tripDetails: item.tripDetails,
//         packageLabel: item.travelPackage,
//         garageOpenKm: item.garageOpenKm,
//         garageCloseKm: item.garageCloseKm,
//         totalKm:
//           Number(item.garageCloseKm || 0) -
//           Number(item.garageOpenKm || 0),
//         garageOpenDateTime: item.startingTime,
//         garageCloseDateTime: item.closingTime,
//         usageHours: item.usageHours,
//         additionalKms: item.additionalKms,
//         additionalHours: item.additionalHours,
//         packageAmount: item.packageAmount,
//         cabCharge:
//           Number(item.packageAmount || 0) +
//           Number(item.additionalKmsAmount || 0) +
//           Number(item.additionalHoursAmount || 0),
//         driverBata: item.driverBatta,
//         grossAmount: item.amount,
//         cgstAmount,
//         sgstAmount,
//         tollParking: item.extraCharges,
//         invoiceAmount: item.total,
//       });
//     });
//   });

//   return res.json({
//     from,
//     to,
//     companyId,
//     bookingType,
//     rows,
//   });
// }

// /* =========================================================
//    MONTHLY REPORT
// ========================================================= */
// if (bookingType === "monthly") {

//   const monthlyWhere: any = {
//     CreatedAt:  {
//       [Op.between]: [start, end],
//     },
//   };

//   if (companyId !== "ALL") {
//     monthlyWhere.companyId = companyId;
//   }

//   const invoices = await MonthlyInvoice.findAll({
//     where: monthlyWhere,
//     include: [
//       {
//         model: Company,
//         as: "company",
//         required: false,
//       },
//       {
//         model: Invoice,
//         as: "invoice",
//         required: false,
//       },
//     ],
//     order: [["createdAt", "ASC"]],
//   });

//   const rows = invoices.map((m: any, index: number) => {

//     let cgstAmount = 0;
//     let sgstAmount = 0;

//     if (Array.isArray(m.taxes)) {
//       m.taxes.forEach((tax: any) => {
//         const name =
//           (tax.taxName || "").toUpperCase();
//         if (name.includes("CGST")) {
//           cgstAmount += Number(tax.taxAmount || 0);
//         }
//         if (name.includes("SGST")) {
//           sgstAmount += Number(tax.taxAmount || 0);
//         }
//       });
//     }

//     const tollParking = Array.isArray(m.extraCharges)
//       ? m.extraCharges.reduce(
//           (sum: number, e: any) =>
//             sum + Number(e.amount || 0),
//           0
//         )
//       : 0;

//     return {
//       sno: index + 1,
//       orderNumber: m.monthlyBookingCode,
//       tripSheetNumber: "",
//       invoiceNumber:
//         m.invoice?.invoiceNumber ?? "",
//       invoiceDate: formatDate(m.invoiceDate),
//       pickupDate: formatDate(m.invoiceDate),
//       companyName: m.companyName,
//       vehicleNumber: m.vehicleNumber,
//       carType: m.vehicleTypeName,
//       userName: "",
//       behalfOfName: "",
//       pickupPoint: "",
//       tripDetails: m.route,
//       packageLabel:
//         m.packageDetails?.label ??
//         m.packageDetails?.packageName ??
//         "",
//       garageOpenKm: 0,
//       garageCloseKm: 0,
//       totalKm: m.extraKm,
//       garageOpenDateTime: "",
//       garageCloseDateTime: "",
//       usageHours: m.extraHrs,
//       additionalKms: m.extraKm,
//       additionalHours: m.extraHrs,
//       packageAmount: m.packageAmount,
//       cabCharge:
//         Number(m.packageAmount || 0) +
//         Number(m.extraKmAmount || 0) +
//         Number(m.extraHrsAmount || 0),
//       driverBata: 0,
//       grossAmount: m.netTotal,
//       cgstAmount,
//       sgstAmount,
//       tollParking,
//       invoiceAmount: m.finalTotal,
//       paymentStatus:
//         m.closeStatus === 1
//           ? "Completed"
//           : "Pending",
//     };
//   });

//   return res.json({
//     from,
//     to,
//     companyId,
//     bookingType,
//     rows,
//   });
// }

//     /* -------------------- BOOKINGS -------------------- */
//   if (bookingType === "normal") {
// const bookingWhere: any = {
//   createdAt: { [Op.between]: [start, end] },
// };

// // if (companyId !== "ALL") {
// //   bookingWhere.companyId = companyId;
// // }

// const bookings = await Booking.findAll({
//   where: bookingWhere,

//       include: [
//         {
//           model: Company,
//           as: "company",
//           required: false,
//         },
//         {
//           model: User,
//           as: "user",
//         //  where: { companyId },
//           include: [{ model: Company, as: "company" }],
//         },
//         {
//           model: VehicleMaster,
//           as: "vehicleMaster",
//           attributes: ["vehicleNumber", "vehicleModelName", "vehicleType"],
//           required: false,
//         },
//         {
//           model: Vehicle,
//           as: "vehicle",
//           include: [
//             {
//               model: VehicleMaster,
//               as: "vehicleMaster",
//               attributes: ["vehicleNumber", "vehicleType"],
//             },
//           ],
//         },
//         // {
//         //   model: Invoice,
//         //   as: "invoice",
//         //   required: false,
//         //   limit: 1,
//         //   order: [["createdAt", "DESC"]],
//         // },
//       {
//   model: Invoice,
//   as: "invoice",
//   where: {
//     createdAt: {
//       [Op.between]: [start, end],
//     },
//     ...(companyId !== "ALL" && { companyId }),
//   },
//   required: true,
// }
//       ],
//       order: [["createdAt", "ASC"]],
//     });

//     /* -------------------- ROW BUILD -------------------- */
//     const rows = await Promise.all(
//       bookings.map(async (b, index) => {
//         const invoice = b.invoice?.[0] ?? null;

//         /* ✅ CORRECT WAY: Invoice → closePendingId */
//         let cp: ClosePending | null = null;
//         if (invoice?.closePendingId) {
//           cp = await ClosePending.findByPk(invoice.closePendingId);
//         }

//         /* ---------------- PACKAGE LABEL ---------------- */
//         let packageLabel = "";
//         if (cp) {
//           try {
//             // Debug: Log the raw data to see what we're working with
//             console.log("ClosePending ID:", cp.id);
//             console.log("selectedPackageData type:", typeof cp.selectedPackageData);
//             console.log("selectedPackageData value:", cp.selectedPackageData);
            
//             // Try to parse selectedPackageData
//             if (cp.selectedPackageData) {
//               let parsedData;
              
//               if (typeof cp.selectedPackageData === 'string') {
//                 parsedData = JSON.parse(cp.selectedPackageData);
//               } else if (typeof cp.selectedPackageData === 'object') {
//                 parsedData = cp.selectedPackageData;
//               }
              
//               console.log("Parsed data:", parsedData);
//               console.log("Label:", parsedData?.label);
              
//               packageLabel = parsedData?.label ?? "";
//             }
//           } catch (error) {
//             console.error("Error parsing selectedPackageData:", error);
//             packageLabel = "";
//           }
//         }

//         /* ---------------- KM ---------------- */
//         const garageOpenKm = cp?.garageOpenKm ?? 0;
//         const garageCloseKm = cp?.garageCloseKm ?? 0;
//         const totalKm =
//           garageCloseKm > garageOpenKm
//             ? garageCloseKm - garageOpenKm
//             : 0;

//         /* ---------------- AMOUNTS ---------------- */
//         const packageAmount = Number(cp?.packageAmount ?? 0);
//         const additionalKmsAmount = Number(cp?.additionalKmsAmount ?? 0);
//         const additionalHoursAmount = Number(cp?.additionalHoursAmount ?? 0);
//         const extraDriverBeta = Number(cp?.extraDriverBeta ?? 0);


//         const isOutstation = b.pickupPoint === "Outstation";

//         const grossAmount = isOutstation
//           ? packageAmount + extraDriverBeta
//           : packageAmount + additionalKmsAmount + additionalHoursAmount;

//         /* ---------------- PAYMENT STATUS ---------------- */
//         let paymentStatus = "Pending";
//         if (invoice && Number(invoice.invoiceStatus) === 9) {
//           paymentStatus = "Completed";
//         }

//         // const formatTime = (dateInput: any) => {
//         //   if (!dateInput) return null;
//         //   const d = new Date(dateInput);
//         //   return d.toISOString().split('T')[1].split('.')[0]; // Result: "01:39:29"
//         // };

// const cabCharge = packageAmount + additionalKmsAmount + additionalHoursAmount;


//         /* ---------------- FINAL ROW ---------------- */
//         return {
//           sno: index + 1,
//           orderNumber: b.bookingCode,
//           tripSheetNumber: cp?.tripSheetNumber ?? "",
//           invoiceNumber: invoice?.invoiceNumber ?? "",
//          // invoiceDate: invoice?.createdAt ?? null,
//           //pickupDate: b.bookingDate ?? null,
//           invoiceDate: formatDate(invoice?.createdAt ?? null),
//           pickupDate: formatDate(b.bookingDate ?? null),
//           companyName: b.company?.companyName ?? "",
//           vehicleNumber: b.vehicleMaster?.vehicleNumber ?? "",
//           carType: b.vehicleMaster?.vehicleType ?? "",
//           userName: `${b.user?.username ?? ""}(${b.user?.email ?? ""})`,
//           selfName: b.selfName ?? "",
//           behalfOfName:b.behalfOfName ?? "",
//           pickupPoint: b.pickupPoint ?? "",
//           tripDetails: `${b.pickupArea ?? ""} - ${b.pickupCity ?? ""} to ${b.dropPoint ?? ""}`,

//           packageLabel, // ✅ Package label from selectedPackageData
          
//           garageOpenKm,
//           garageCloseKm,
//           totalKm,

//           garageOpenDateTime: formatTime(cp?.garageOpenDateTime ?? null),
//           garageCloseDateTime: formatTime(cp?.garageCloseDateTime ?? null),
//           usageHours: cp?.usageHours ?? "",

//           additionalKms: cp?.additionalKms ?? 0,
//           additionalHours: cp?.additionalHours ?? 0,
//           packageAmount,
//          cabCharge: cabCharge,
//           driverBata: extraDriverBeta,

//           grossAmount,
//           cgstAmount: cp?.cgstAmount ?? 0,
//           sgstAmount: cp?.sgstAmount ?? 0,
//           tollParking: cp?.extraCharges ?? 0,

//           invoiceAmount: invoice?.invoiceAmount ?? 0,
//           paymentStatus,
//         };
//       })
//     );

//     /* ---------------- RESPONSE ---------------- */
//     return res.json({
//       from,
//       to,
//       companyId,
//         bookingType,
//       rows,
//     });
//   }
//   } catch (err: any) {
//     console.error("Overall Invoice Report Error:", err);
//     return res.status(500).json({
//       message: "Report error",
//       error: err.message,
//     });
//   }
// };

export const getOverallInvoiceReport = async (req: Request, res: Response) => {
  try {
    const { from, to, companyId, bookingType } = req.query as any;

    if (!from || !to || !companyId || !bookingType) {
      return res.status(400).json({
        message: "from, to, companyId, bookingType required",
      });
    }

    /* -------------------- DATE RANGE -------------------- */
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const formatTime = (dateInput: any) => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const seconds = d.getSeconds().toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    };

    const formatDate = (dateInput: any) => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    /* -------------------- VEHICLE TYPE LOOKUP MAP -------------------- */
    // ✅ fetch all vehicle types ONCE, build an id → name map for fast lookup
    const allVehicleTypes = await VehicleType.findAll({
      attributes: ["vehicleTypeId", "vehicleType"],
    });
    const vehicleTypeMap = new Map<string, string>();
    allVehicleTypes.forEach((vt: any) => {
      vehicleTypeMap.set(vt.vehicleTypeId, vt.vehicleType);
    });
    
    /* =========================================================
       ONCALL ROWS BUILDER
    ========================================================= */
const buildOncallRows = async () => {
  const oncallWhere: any = {
    CreatedAt: { [Op.between]: [start, end] },
  };
  if (companyId !== "ALL") {
    oncallWhere.companyId = companyId;
  }

  const invoices = await OnCallInvoice.findAll({
    where: oncallWhere,
    include: [
      { model: Company, as: "company" },
      { model: OnCallInvoiceItems, as: "invoiceItems" },
    ],
    order: [["createdAt", "ASC"]],
  });

  const rows: any[] = [];
  let sno = 1;

  invoices.forEach((invoice: any) => {
    invoice.invoiceItems?.forEach((item: any) => {
      let cgstAmount = 0;
      let sgstAmount = 0;

      try {
        const taxes =
          typeof item.taxes === "string" ? JSON.parse(item.taxes) : item.taxes;

        if (Array.isArray(taxes)) {
          taxes.forEach((t: any) => {
            const taxName = (t.taxName || "").toUpperCase();
            if (taxName.includes("CGST")) cgstAmount += Number(t.taxAmount || 0);
            if (taxName.includes("SGST")) sgstAmount += Number(t.taxAmount || 0);
          });
        }
      } catch (err) {}

      // ✅ build a detailed package label — works for BOTH localcity AND outstation
      let packageLabel = item.travelPackage || "";
      try {
        const meta =
          typeof item.selectedPackageMeta === "string"
            ? JSON.parse(item.selectedPackageMeta || "{}")
            : item.selectedPackageMeta;

        if (meta) {
          if (item.packageType === "outstation") {
            const perKm = meta.perKm ?? 0;
            const batta = meta.driverBattaPerDay ?? 0;
            const minKm = meta.minimumKmPerDay;
            const days = item.packageDays || 1;

            packageLabel =
              `Outstation - ₹${perKm}/km, Batta ₹${batta}/day` +
              (minKm ? `, Min ${minKm}km/day` : "") +
              ` (${days} day${days > 1 ? "s" : ""})`;
          } else if (meta.title) {
            packageLabel = `${meta.title} (${meta.hours ?? 0}hrs/${meta.km ?? 0}km) - ₹${meta.amount ?? 0}`;
          }
        }
      } catch (err) {
        // keep fallback packageLabel as-is if parsing fails
      }

      rows.push({
        sno: sno++,
        tripSheetNumber: item.tripSheetNo,
        invoiceNumber: invoice.onCallInvoiceCode,
        invoiceDate: formatDate(invoice.createdAt),
        pickupDate: formatDate(item.date),
        companyName: invoice.company?.companyName ?? invoice.companyName,
        vehicleNumber: item.vehicleNo,
carType: vehicleTypeMap.get(item.vehicleTypeId) || item.vehicleTypeId,
        userName: item.bookedBy,
        behalfOfName: item.guestName,
        pickupPoint: "",
        tripDetails: item.tripDetails,
        packageLabel,
        garageOpenKm: item.garageOpenKm,
        garageCloseKm: item.garageCloseKm,
        totalKm:  item.garageKms,
        garageOpenDateTime: item.startingTime,
        garageCloseDateTime: item.closingTime,
        usageHours: item.usageHours,
        garageKms: Number(item.garageKms || item.totalKm || 0),
        additionalKms: item.additionalKms,
        additionalHours: item.additionalHours,
        packageAmount: item.packageAmount,
        cabCharge:
          Number(item.packageAmount || 0) +
          Number(item.additionalKmsAmount || 0) +
          Number(item.additionalHoursAmount || 0),
        driverBata: item.driverBatta,
        discountAmount: item.discountAmount, // ✅ NEW
        advanceAmount: item.advanceAmount,   // ✅ NEW
        grossAmount: item.amount,
        cgstAmount,
        sgstAmount,
        tollParking: item.extraCharges,
        invoiceAmount: item.totalDue,
        
      });
    });
  });

  return rows;
};

    const formatInvoiceMonth = (invoiceMonth: string): string => {
      if (!invoiceMonth) return "";
      const parts = invoiceMonth.split("-");
      if (parts.length === 2) {
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        if (first > 12 && second >= 1 && second <= 12) {
          return `${monthNames[second - 1]}-${first}`;
        } else if (first >= 1 && first <= 12 && second > 12) {
          return `${monthNames[first - 1]}-${second}`;
        }
      }
      return invoiceMonth;
    };

    /* =========================================================
       MONTHLY ROWS BUILDER
    ========================================================= */
const buildMonthlyRows = async () => {
  const monthlyWhere: any = {
    invoiceDate: { [Op.between]: [start, end] },
  };
  if (companyId !== "ALL") {
    monthlyWhere.companyId = companyId;
  }

  const invoices = await MonthlyInvoice.findAll({
    where: monthlyWhere,
    include: [
      { model: Company, as: "company", required: false },
      { model: Invoice, as: "invoice", required: false },
      { model: MonthlyInvoiceItems, as: "monthlyInvoiceItems", required: false },
    ],
    order: [["createdAt", "ASC"]],
  });

  const rows: any[] = [];
  let sno = 1;

  invoices.forEach((m: any) => {
    const rawItems = m.monthlyInvoiceItems && m.monthlyInvoiceItems.length > 0
      ? m.monthlyInvoiceItems
      : [
          {
            monthlyInvoiceItemId: m.monthlyInvoiceId,
            route: m.route,
            vehicleTypeId: m.vehicleTypeId,
            vehicleTypeName: m.vehicleTypeName,
            vehicleNumber: m.vehicleNumber,
            packageDataId: m.packageDataId,
            packageDetails: m.packageDetails,
            packageAmount: m.packageAmount,
            extraKm: m.extraKm,
            extraKmAmount: m.extraKmAmount,
            extraDays: m.extraDays,
            extraDaysAmount: m.extraDaysAmount,
            extraHrs: m.extraHrs,
            extraHrsAmount: m.extraHrsAmount,
            extraCharges: m.extraCharges,
            extraChargesInputAmount: m.extraChargesInputAmount,
            discount: m.discount,
            advance: m.advance,
            netTotal: m.netTotal,
            taxes: m.taxes,
            totalTaxAmount: m.totalTaxAmount,
            finalTotal: m.finalTotal,
            balanceDue: m.balanceDue,
          },
        ];

    const taxesRaw = typeof m.taxes === "string" ? JSON.parse(m.taxes || "[]") : (m.taxes || []);
    const taxBreakup = Array.isArray(taxesRaw)
      ? taxesRaw.map((t: any) => ({
          taxName: (t.taxName || "UNKNOWN").toString().trim(),
          amount: Number(t.amount ?? t.taxAmount ?? 0),
        }))
      : [];

    const tollParking = Array.isArray(m.extraCharges)
      ? m.extraCharges.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
      : Number(m.extraChargesInputAmount || 0);

    const invoiceMonthFmt = formatInvoiceMonth(m.invoiceMonth) || m.invoiceMonth || "";

    rawItems.forEach((item: any) => {
      const pkgDetails = normalizePackageDetails(item.packageDetails, item);

      const pkgDays = pkgDetails.days || 0;
      const pkgKm = pkgDetails.km || 0;
      const pkgAmount = Number(item.packageAmount || pkgDetails.amount || 0);

      const vehicleNo = item.vehicleNumber || m.vehicleNumber || "";
      const vehicleType = item.vehicleTypeName || m.vehicleTypeName || "";
      const routeStr = item.route || m.route || "";

      const extraKm = Number(item.extraKm || 0);
      const extraKmAmount = Number(item.extraKmAmount || 0);
      const extraHrs = Number(item.extraHrs || 0);
      const extraHrsAmount = Number(item.extraHrsAmount || 0);
      const driverBata = Number(item.extraDaysAmount || item.driverBatta || 0);
      const subTotal = Number(item.netTotal || (pkgAmount + extraKmAmount + extraHrsAmount + driverBata));

      // Parse item taxes or fallback to header taxes
      const itemTaxesRaw = item.taxes && Array.isArray(item.taxes) && item.taxes.length > 0 ? item.taxes : m.taxes;
      const taxesParsed = typeof itemTaxesRaw === "string" ? JSON.parse(itemTaxesRaw || "[]") : (itemTaxesRaw || []);
      const taxBreakup = Array.isArray(taxesParsed)
        ? taxesParsed.map((t: any) => ({
            taxName: (t.taxName || "UNKNOWN").toString().trim(),
            amount: Number(t.amount ?? t.taxAmount ?? 0),
          }))
        : [];

      const totalTaxAmount = taxBreakup.reduce((s, t) => s + Number(t.amount || 0), 0);

      const tollParking = Array.isArray(item.extraCharges || m.extraCharges)
        ? (item.extraCharges || m.extraCharges).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
        : Number(item.extraChargesInputAmount ?? m.extraChargesInputAmount ?? 0);

      const extraChargesInputAmount = Number(item.extraChargesInputAmount ?? m.extraChargesInputAmount ?? tollParking);
      const discountAmount = Number(item.discount ?? m.discount ?? 0);
      const advanceAmount = Number(item.advance ?? m.advance ?? 0);
      const finalTotal = Number(item.finalTotal ?? m.finalTotal ?? (subTotal + totalTaxAmount + extraChargesInputAmount - discountAmount));
      const balanceDue = Number(item.balanceDue ?? m.balanceDue ?? Math.max(0, finalTotal - advanceAmount));

      const description = `Towards for the month of ${invoiceMonthFmt}\n\nVehicle No : ${vehicleNo}\n\nVehicle Type : ${vehicleType}\n\nRoute : ${routeStr}\n\nMonthly Cab Charges\n\nCoverage :\n${pkgDays} Days / ${pkgKm} KM - ₹${pkgAmount.toLocaleString("en-IN")}`;

      rows.push({
        sno: sno++,
        monthlyInvoiceId: m.monthlyInvoiceId,
        orderNumber: m.monthlyBookingCode,
        tripSheetNumber: "",
        invoiceNumber: m.monthlyBookingCode || m.invoice?.invoiceNumber || "",
        invoiceDate: formatDate(m.invoiceDate),
        invoiceMonth: invoiceMonthFmt,
        pickupDate: formatDate(m.invoiceDate),
        companyName: m.companyName || m.company?.companyName || "",
        vehicleNumber: vehicleNo,
        carType: vehicleType,
        route: routeStr,
        tripDetails: routeStr,
        packageLabel: pkgDetails.label ?? pkgDetails.packageName ?? "Monthly Package",
        pkgDays,
        pkgKm,
        packageAmount: pkgAmount,
        extraKm,
        extraKmAmount,
        extraHrs,
        extraHrsAmount,
        extraDays: Number(item.extraDays || 0),
        driverBata,
        subTotal,
        description,
        cabCharge: pkgAmount,
        grossAmount: pkgAmount,
        taxBreakup,
        totalTaxAmount,
        tollParking: extraChargesInputAmount,
        extraChargesInputAmount,
        discountAmount,
        advanceAmount,
        finalTotal,
        balanceDue,
        invoiceAmount: finalTotal,
        paymentStatus: m.closeStatus === 1 ? "Completed" : "Pending",
      });
    });
  });

  return rows;
};

    /* =========================================================
       NORMAL (BOOKINGS) ROWS BUILDER
    ========================================================= */
    const buildNormalRows = async () => {
      const bookingWhere: any = {
        createdAt: { [Op.between]: [start, end] },
      };

      const bookings = await Booking.findAll({
        where: bookingWhere,
        include: [
          { model: Company, as: "company", required: false },
          {
            model: User,
            as: "user",
            include: [{ model: Company, as: "company" }],
          },
          {
            model: VehicleMaster,
            as: "vehicleMaster",
            attributes: ["vehicleNumber", "vehicleModelName", "vehicleType"],
            required: false,
          },
          {
            model: Vehicle,
            as: "vehicle",
            include: [
              {
                model: VehicleMaster,
                as: "vehicleMaster",
                attributes: ["vehicleNumber", "vehicleType"],
              },
            ],
          },
          {
            model: Invoice,
            as: "invoice",
            where: {
              createdAt: { [Op.between]: [start, end] },
              ...(companyId !== "ALL" && { companyId }),
            },
            required: true,
          },
        ],
        order: [["createdAt", "ASC"]],
      });

      return Promise.all(
        bookings.map(async (b: any, index: number) => {
          const invoice = b.invoice?.[0] ?? null;

          let cp: ClosePending | null = null;
          if (invoice?.closePendingId) {
            cp = await ClosePending.findByPk(invoice.closePendingId);
          }

          let packageLabel = "";
          if (cp) {
            try {
              if (cp.selectedPackageData) {
                let parsedData;
                if (typeof cp.selectedPackageData === "string") {
                  parsedData = JSON.parse(cp.selectedPackageData);
                } else if (typeof cp.selectedPackageData === "object") {
                  parsedData = cp.selectedPackageData;
                }
                packageLabel = parsedData?.label ?? "";
              }
            } catch (error) {
              packageLabel = "";
            }
          }

          const garageOpenKm = cp?.garageOpenKm ?? 0;
          const garageCloseKm = cp?.garageCloseKm ?? 0;
          const totalKm = garageCloseKm > garageOpenKm ? garageCloseKm - garageOpenKm : 0;

          const packageAmount = Number(cp?.packageAmount ?? 0);
          const additionalKmsAmount = Number(cp?.additionalKmsAmount ?? 0);
          const additionalHoursAmount = Number(cp?.additionalHoursAmount ?? 0);
          const extraDriverBeta = Number(cp?.extraDriverBeta ?? 0);

          const isOutstation = b.pickupPoint === "Outstation";

          const grossAmount = isOutstation
            ? packageAmount + extraDriverBeta
            : packageAmount + additionalKmsAmount + additionalHoursAmount;

          let paymentStatus = "Pending";
          if (invoice && Number(invoice.invoiceStatus) === 9) {
            paymentStatus = "Completed";
          }

          const cabCharge = packageAmount + additionalKmsAmount + additionalHoursAmount;

          return {
            sno: index + 1,
            orderNumber: b.bookingCode,
            tripSheetNumber: cp?.tripSheetNumber ?? "",
            invoiceNumber: invoice?.invoiceNumber ?? "",
            invoiceDate: formatDate(invoice?.createdAt ?? null),
            pickupDate: formatDate(b.bookingDate ?? null),
            companyName: b.company?.companyName ?? "",
            vehicleNumber: b.vehicleMaster?.vehicleNumber ?? "",
            carType: b.vehicleMaster?.vehicleType ?? "",
            userName: `${b.user?.username ?? ""}(${b.user?.email ?? ""})`,
            selfName: b.selfName ?? "",
            behalfOfName: b.behalfOfName ?? "",
            pickupPoint: b.pickupPoint ?? "",
            tripDetails: `${b.pickupArea ?? ""} - ${b.pickupCity ?? ""} to ${b.dropPoint ?? ""}`,
            packageLabel,
            garageOpenKm,
            garageCloseKm,
            totalKm,
            garageOpenDateTime: formatTime(cp?.garageOpenDateTime ?? null),
            garageCloseDateTime: formatTime(cp?.garageCloseDateTime ?? null),
            usageHours: cp?.usageHours ?? "",
            additionalKms: cp?.additionalKms ?? 0,
            additionalHours: cp?.additionalHours ?? 0,
            packageAmount,
            cabCharge,
            driverBata: extraDriverBeta,
            grossAmount,
            cgstAmount: cp?.cgstAmount ?? 0,
            sgstAmount: cp?.sgstAmount ?? 0,
            tollParking: cp?.extraCharges ?? 0,
            invoiceAmount: invoice?.invoiceAmount ?? 0,
            paymentStatus,
          };
        })
      );
    };

    /* =========================================================
       DISPATCH BASED ON bookingType
    ========================================================= */
    if (bookingType === "all") {
      // ✅ Run all 3 reports in parallel, return separately so
      // frontend can put each into its own sheet in one workbook
      const [normalRows, monthlyRows, oncallRows] = await Promise.all([
        buildNormalRows(),
        buildMonthlyRows(),
        buildOncallRows(),
      ]);

      return res.json({
        from,
        to,
        companyId,
        bookingType,
        normalRows,
        monthlyRows,
        oncallRows,
      });
    }

    if (bookingType === "oncall") {
      const rows = await buildOncallRows();
      return res.json({ from, to, companyId, bookingType, rows });
    }

    if (bookingType === "monthly") {
      const rows = await buildMonthlyRows();
      return res.json({ from, to, companyId, bookingType, rows });
    }

    if (bookingType === "normal") {
      const rows = await buildNormalRows();
      return res.json({ from, to, companyId, bookingType, rows });
    }

    return res.status(400).json({ message: "Invalid bookingType" });
  } catch (err: any) {
    console.error("Overall Invoice Report Error:", err);
    return res.status(500).json({
      message: "Report error",
      error: err.message,
    });
  }
};



export const companyBookingReport = async (req: Request, res: Response) => {
  try {
    const { from, to, companyId, pickupPoint, period = "month" } = req.query as Record<string, string>;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId is required" });
    }

    // Booking filter
    const bookingWhere: any = {};
    if (from && to) bookingWhere.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    else if (from) bookingWhere.createdAt = { [Op.gte]: new Date(from) };
    else if (to) bookingWhere.createdAt = { [Op.lte]: new Date(to) };

    // if (pickupPoint) bookingWhere.pickupPoint = pickupPoint;
if (pickupPoint && pickupPoint !== "All") {
  bookingWhere.pickupPoint = pickupPoint.trim();
}
// If pickupPoint = "All" or undefined → do not filter, let all pickup points come

    // Period grouping
    let periodAttr: any;
    switch (period) {
      case "date":
        periodAttr = fn("DATE", col("booking.createdAt"));
        break;
      case "week":
        periodAttr = literal("CONCAT('W', WEEK(booking.createdAt,1), '-', YEAR(booking.createdAt))");
        break;
      case "year":
        periodAttr = fn("YEAR", col("booking.createdAt"));
        break;
      case "month":
      default:
        periodAttr = fn("DATE_FORMAT", col("booking.createdAt"), "%b-%Y");
        break;
    }

    const rows = await Invoice.findAll({
      attributes: [
        [periodAttr, "period_label"],
        [col("booking.pickupPoint"), "pickupPoint"],
        [fn("SUM", literal(`CASE WHEN invoiceStatus = ${ORDER.STATUS.PAYMENTCOMPLETED} THEN 1 ELSE 0 END`)), "paidOrderCount"],
        [fn("SUM", literal(`CASE WHEN invoiceStatus = ${ORDER.STATUS.PAYMENTCOMPLETED} THEN IFNULL(invoiceAmount,0) ELSE 0 END`)), "paidOrderAmount"],
        [fn("SUM", literal(`CASE WHEN invoiceStatus = ${ORDER.STATUS.PENDING} THEN 1 ELSE 0 END`)), "pendingOrderCount"],
        [fn("SUM", literal(`CASE WHEN invoiceStatus = ${ORDER.STATUS.PENDING} THEN IFNULL(invoiceAmount,0) ELSE 0 END`)), "pendingOrderAmount"],
        [fn("SUM", literal(`CASE WHEN invoiceStatus = ${ORDER.STATUS.CANCELLED} THEN 1 ELSE 0 END`)), "cancelOrderCount"],
        [fn("SUM", literal(`CASE WHEN invoiceStatus = ${ORDER.STATUS.CANCELLED} THEN IFNULL(invoiceAmount,0) ELSE 0 END`)), "cancelOrderAmount"],
      ],
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: [],
          required: true,
          where: bookingWhere,
        },
        {
          model: User,
          as: "user",
          attributes: [],
          where: { companyId },
        },
      ],
      group: ["period_label", "booking.pickupPoint"],
      order: [["period_label", "ASC"]],
      raw: true,
    });

    const normalized = rows.map((r: any) => ({
      period: r.period_label,
      pickupPoint: r.pickupPoint,
      paidOrderCount: Number(r.paidOrderCount) || 0,
      paidOrderAmount: Number(r.paidOrderAmount) || 0,
      pendingOrderCount: Number(r.pendingOrderCount) || 0,
      pendingOrderAmount: Number(r.pendingOrderAmount) || 0,
      cancelOrderCount: Number(r.cancelOrderCount) || 0,
      cancelOrderAmount: Number(r.cancelOrderAmount) || 0,
    }));

    return res.json({ success: true, data: normalized });
  } catch (err: any) {
    console.error("companyBookingReport error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

// GET /api/bookings/monthly?year=2025
interface MonthlyBookingResult {
  month: number;
  totalBookings: string;
}
export const getMonthlyBookings = async (req: Request, res: Response) => {
  try {
    // End date = today
    const endDate = new Date();

    // Start date = 11 months before today
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);

    // Fetch bookings within last 12 months
    const results = await Booking.findAll({
      attributes: [
        [fn("YEAR", col("bookingDate")), "year"],
        [fn("MONTH", col("bookingDate")), "month"],
        [fn("COUNT", col("bookingId")), "totalBookings"],
      ],
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [fn("YEAR", col("bookingDate")), fn("MONTH", col("bookingDate"))],
      order: [
        [fn("YEAR", col("bookingDate")), "ASC"],
        [fn("MONTH", col("bookingDate")), "ASC"],
      ],
      raw: true,
    }) as unknown as { year: number; month: number; totalBookings: string }[];

    // Generate rolling 12 months data
    const monthlyData: { year: number; month: number; totalBookings: number }[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 12; i++) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1; // Month is 0-based
      const row = results.find((r) => r.year === y && r.month === m);

      monthlyData.push({
        year: y,
        month: m,
        totalBookings: row ? parseInt(row.totalBookings) : 0,
      });

      current.setMonth(current.getMonth() + 1); // Move to next month
    }

    return res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    console.error("[GET_MONTHLY_BOOKINGS_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving monthly bookings.",
      error: (error as Error).message,
    });
  }
};

// 🟡 Get ALL Orders for a specific user
export const getAllOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const orders = await Booking.findAll({
      where: { userId },
      include: [
        { model: Invoice, include: [{ model: Payment }, { model: ClosePending }] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 🟡 Get Pending Orders
export const getPendingOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const orders = await Booking.findAll({
      where: {
        userId,
        confirmStatus: ORDER.STATUS.PENDING,
      },
      include: [
        { model: Invoice, include: [{ model: Payment }, { model: ClosePending }] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// 🟡 Get Pending invoices based on user
export const getPendingInvoicesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Invoice,
          required: true, // must have an invoice to be a "pending invoice"
          include: [
            { model: ClosePending, required: false },
            { model: Payment, required: false }, // allow no payment row yet
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Keep invoices with no payment OR payment.status === "0" (Not Paid)
    const data = bookings
      .map((b: any) => b.toJSON())
      .map((b: any) => ({
        ...b,
        invoice: (b.invoice || []).filter(
          (inv: any) => !inv.payment || inv.payment.status === "0"
        ),
      }))
      .filter((b: any) => b.invoice && b.invoice.length > 0);

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error("Error fetching pending invoices:", e);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};



// 🟢 Get Confirmed Orders
export const getConfirmedOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const orders = await Booking.findAll({
      where: {
        userId,
        confirmStatus: ORDER.STATUS.CONFIRMED,
      },
      include: [
        { model: Invoice, include: [{ model: Payment }, { model: ClosePending }] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching confirmed orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// 💳 Get Payment Completed Orders
export const getPaymentCompletedOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const orders = await Booking.findAll({
      where: {
        userId,
        confirmStatus: ORDER.STATUS.PAYMENTCOMPLETED,
      },
      include: [
        { model: Invoice, include: [{ model: Payment }, { model: ClosePending }] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching payment completed orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// 🔒 Get Closed Orders
export const getClosedOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const orders = await Booking.findAll({
      where: {
        userId,
        confirmStatus: ORDER.STATUS.CONFIRMED,
      },
      include: [
        { model: Invoice, include: [{ model: Payment }, { model: ClosePending }] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching closed orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ❌ Get Cancelled Orders
export const getCancelledOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const orders = await Booking.findAll({
      where: {
        userId,
        confirmStatus: ORDER.STATUS.CANCELLED,
      },
      include: [
        { model: Invoice, include: [{ model: Payment }, { model: ClosePending }] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching cancelled orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPaymentPendingOrdersByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch invoices with invoiceStatus = 0 (pending)
    const invoices = await Invoice.findAll({
      where: {
        userId,
        invoiceStatus: ORDER.STATUS.PENDING, // 0
      },
      include: [
        {
          model: Booking,
          as: "booking", // make sure alias matches model
        },
        {
          model: ClosePending,
          as: "closePending",
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!invoices.length) {
      return res.status(404).json({
        success: false,
        message: "No pending invoices found for this user.",
      });
    }

    const response = invoices.map((inv) => ({
      invoiceId: inv.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      invoiceAmount: inv.invoiceAmount,
      invoiceStatus: inv.invoiceStatus,
      startDate: inv.startDate,
      endDate: inv.endDate,
      createdAt: inv.createdAt,
      booking: inv.booking,
      closePending: inv.closePending,
      payment: inv.payment,
    }));

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// export const generateInvoiceHTMLForuser = (data: any): string => {
//   return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>Invoice</title>
//      <style>
//         * {
//             margin: 0;
//             padding: 0;
//             box-sizing: border-box;
//         }

//         body {
//             font-family: Arial, sans-serif;
//             background-color: #fff;
//             padding: 12px;
//             font-size: 11px;
//         }

//         .invoice-container {
//             max-width: 800px;
//             margin: 0 auto;
//             background-color: white;
//             border: 1px solid #ddd;
//             padding: 18px;
//         }

//         .header {
//             display: flex;
//             justify-content: space-between;
//             align-items: flex-start;
//             margin-bottom: 18px;
//             padding-bottom: 10px;
//             border-bottom: 2px solid #333;
//         }        

//         .company-name .travels {
//             color: #4CAF50;
//         }

//         .invoice-info {
//             text-align: right;
//             font-size: 11px;
//             line-height: 1.5;
//         }

//         .invoice-info strong {
//             color: #333;
//         }

//         .section-header {
//             background-color:  rgba(82, 121, 152, 1);
//             padding: 5px 12px;
//             font-weight: bold;
//             color: #333;
//             margin: 12px 0 6px 0;
//             font-size: 12px;
//         }

//         .billing-booking-row {
//     display: flex;
//     justify-content: space-between;
//     gap: 40px;
//     margin: 20px 0;
// }

// .billing-section {
//     flex: 1;
//     min-width: 45%;
// }

// .booking-section {
//     flex: 1;
//     min-width: 45%;
// }

// .section-header {
//     font-weight: bold;
//     font-size: 14px;
//     margin-bottom: 10px;
//     border-bottom: 1px solid #ddd;
//     padding-bottom: 5px;
// }

// .field-group {
//     margin-bottom: 8px;
//     font-size: 12px;
//     display: flex;
//     justify-content: space-between;
// }

// .field-label {
//     font-weight: 500;
//     min-width: 140px;
// }

// .field-value {
//     text-align: right;
// }

    

//         .trip-info {
//             font-size: 11px;
//             margin: 6px 0;
//         }

//         .invoice-section-header {
//             display: flex;
//             justify-content: space-between;
//             align-items: center;
//             padding: 6px 12px;
//             background-color: rgba(82, 121, 152, 1);
//             font-weight: bold;
//             color: #333;
//             margin: 12px 0 0 0;
//             font-size: 12px;
//         }

//         .invoice-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin: 0 0 12px 0;
//         }

//         .invoice-table td {
//             padding: 5px 12px;
//             border: none;
//             font-size: 11px;
//             vertical-align: top;
//         }

//         .invoice-table td:first-child {
//             text-align: left;
//             color: #333;
//         }

//         .invoice-table td:last-child {
//             text-align: right;
//             font-weight: 500;
//         }

//         .additional-charges {
//             font-weight: bold;
//             color: #333;
//             padding-top: 8px !important;
//         }

//         .additional-item {
//             padding-left: 20px;
//             color: #666;
//             font-size: 10px;
//         }

//         .subtotal-row td {
//             padding-top: 8px !important;
//             font-weight: 600;
//             border-top: 1px solid #ddd;
//         }

//         .total-row {
//             border-top: 2px solid #333;
//         }

//         .total-row td {
//             font-weight: bold;
//             font-size: 18px;
//             color: #4CAF50;
//             padding-top: 10px !important;
//         }

//         .usage-table {
//             width: 100%;
//             border-collapse: collapse;
//             border: 2px solid #333;
//             margin: 12px 0;
//         }

//         .usage-table th,
//         .usage-table td {
//             border: 1px solid #333;
//             padding: 5px 8px;
//             text-align: center;
//             font-size: 10px;
//         }

//         .usage-table th {
//             background-color: #f0f0f0;
//             font-weight: bold;
//         }

//         .footer-info {
//             margin-top: 15px;
//             font-size: 9px;
//             line-height: 1.3;
//             border-top: 1px solid #ddd;
//             padding-top: 12px;
//         }

//         .footer-row {
//             display: flex;
//             margin-bottom: 3px;
//         }

//         .footer-label {
//             font-weight: bold;
//             min-width: 80px;
//         }

//         @media print {
//             body {
//                 padding: 0;
//             }
//             .invoice-container {
//                 border: none;
//                 padding: 12px;
//             }
//         }

//         @page {
//             size: A4;
//             margin: 12mm;
//         }


// .logo-section {
//     display: flex;
//     align-items: center; 
//     gap: 10px;           
// }

// .logo-img {
//     height: 60px;       
//     width: auto;
// }

// .email-color{
//     color: rgb(39, 89, 129);
//     font-weight:bold;
//     }
//     .phone-color{
//     color: #4CAF50;
//       font-weight:bold;
//     }
//       /* ===== Total Due Highlight ===== */
// .total-due-row td {
//   border-top: 1px solid #000 !important;   /* ✅ border top */
//   padding-top: 12px;
// }

// .total-due-label {
//   font-weight: 800 !important;            /* ✅ bold */
//   font-size: 18px;                         /* ✅ bigger text */
// }

// .total-due-amount {
//   font-weight: 900 !important;            /* ✅ bold */
//   font-size: 18px;                         /* ✅ bigger */
//   color: #0a8a2a !important;               /* ✅ green */
// }
//     </style>
// </head>
// <body>
//   <div class="invoice-container">

//     <!-- Header -->
//     <div class="header">
//      <div class="logo-section">
//     <img src="${logoSrc}" alt="Grace Cabs" class="logo-img" />
//     </div>
//       <div class="invoice-info">
//         <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
//         <p><strong>Invoice Date:</strong> ${data.invoiceDate}</p>
//       </div>
//     </div>

//     <!-- Billing & Booking -->
//    <div class="billing-booking-row">
//     <div class="billing-section">
//         <div class="section-header">Billing To</div>
//         <div class="field-group">${data.customerName}</div>
//         <div class="field-group">${data.customerAddress}</div>
//         <div class="field-group">GST NO: ${data.gstNo}</div>
//         <div class="field-group">${data.city}</div>
//         <div class="field-group">${data.state}, ${data.country}</div>
//     </div>

//       <div class="booking-section">
//         <div class="section-header">Booking Details</div>
      
//         <div class="field-group">
//             <span class="field-label">Order Number</span>
//             <span class="field-value">${data.orderNumber}</span>
//         </div>
//         <div class="field-group">
//             <span class="field-label">Pickup Type</span>
//             <span class="field-value">${data.pickupPoint}</span>
//         </div>
//         <div class="field-group">
//             <span class="field-label">Vehicle Type</span>
//             <span class="field-value">${data.vehicleType}</span>
//         </div>
//         <div class="field-group">
//             <span class="field-label">Pickup Date</span>
//             <span class="field-value">${data.pickupDate}</span>
//         </div>
//         <div class="field-group">
//             <span class="field-label">Booking Email Id</span>
//             <span class="field-value email-color">${data.email}</span>
//         </div>
//         <div class="field-group">
//             <span class="field-label">Booking Mobile No</span>
//             <span class="field-value phone-color">${data.mobile}</span>
//         </div>
//     </div>
// </div>

//     <!-- Trip Details -->
//         <div class="section-header">Trip Details</div>
//         <div class="trip-info">${data.tripDetails}</div>
      
//   <!-- Usage Table -->
//         <table class="usage-table">
//             <thead>
//                 <tr>
//                     <th></th>
//                     <th>GARAGE OPEN</th>
//                     <th>GARAGE CLOSE</th>
//                     <th>USAGE</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 <tr>
//                     <td><strong>KM's</strong></td>
//                     <td>${data.garageOpen.kms}</td>
//                     <td>${data.garageClose.kms}</td>
//                     <td>${data.usageKms}</td>
//                 </tr>
//                 <tr>
//                     <td><strong>DATE & TIME</strong></td>
//                     <td>${data.garageOpen.dateTime}</td>
//                     <td>${data.garageClose.dateTime}</td>
//                     <td>${data.usageHours} hr(s)</td>
//                 </tr>
//             </tbody>
//         </table>

//     <!-- Invoice Details -->
//       <!-- Invoice Details -->
//         <div class="invoice-section-header">
//             <span>Invoice Details</span>
//             <span>Amount (Rs)</span>
//         </div>
//       <table class="invoice-table">
     
//       <tbody>
//   ${data.lineItems
//     .map((item: any) => {
//       const isTotalDue =
//         String(item.label || "").toLowerCase().includes("total due");

//       return `
//         <tr class="${isTotalDue ? "total-due-row" : ""}">
//           <td class="${isTotalDue ? "total-due-label" : ""}">${item.label}</td>
//           <td class="${isTotalDue ? "total-due-amount" : ""}">
//             ${Number(item.value).toFixed(2)}
//           </td>
//         </tr>
//       `;
//     })
//     .join("")}
// </tbody>
//       </table>

//         <!-- Footer Information -->
//         <div class="footer-info">
//             <div class="footer-row">
//                 <span class="footer-label">Regd.Office:</span>
//                 <span>Grace Cabs  Pvt. Ltd., 7/621 NESAMANI NAGAR, PERUMBAKKAM, CHENNAI - 600100</span>
//             </div>
//             <div class="footer-row">
//                 <span class="footer-label">Website:</span>
//                 <span>gracecabs.com</span>
//             </div>
//             <div class="footer-row">
//                 <span class="footer-label">GSTIN:</span>
//                 <span>33AAMCG2518C1Z0</span>
//             </div>
//             <div class="footer-row">
//                 <span class="footer-label">PAN No.:</span>
//                 <span>AAMCG2518C</span>
//             </div>
//             <div class="footer-row">
//                 <span class="footer-label">SAC:</span>
//                 <span>996609</span>
//             </div>
//             <div class="footer-row">
//                 <p>It is a system generated invoice which does not need a signature</p>
//             </div>
//         </div>
//     </div>
// </body>
// </html>
//   `;
// };
export const generateInvoiceHTMLForuser = (data: any): string => {
  // ✅ read cp (ClosePending) safely from multiple possible shapes
  const cp =
    data?.closePending ||
    data?.payment?.invoices?.[0]?.closePending ||
    data?.invoice?.closePending ||
    data?.cp ||
    {};

  const n2 = (v: any) => {
    const x = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(x) ? x : 0;
  };

  // ✅ build tax rows based on what was selected during closePending
  const buildSelectedTaxRows = () => {
    const rows: { label: string; value: number }[] = [];

    const igstOn = cp?.igstApplicable === true || cp?.igstApplicable === 1;
    const cgstOn = cp?.cgstApplicable === true || cp?.cgstApplicable === 1;
    const sgstOn = cp?.sgstApplicable === true || cp?.sgstApplicable === 1;

    const igstAmt = n2(cp?.igstAmount);
    const cgstAmt = n2(cp?.cgstAmount);
    const sgstAmt = n2(cp?.sgstAmount);

    // ✅ show only chosen taxes (and only if amount > 0)
    if (igstOn && igstAmt !== 0) rows.push({ label: "IGST", value: igstAmt });
    if (cgstOn && cgstAmt !== 0) rows.push({ label: "CGST", value: cgstAmt });
    if (sgstOn && sgstAmt !== 0) rows.push({ label: "SGST", value: sgstAmt });

    // fallback: if flags missing but totalTaxAmount exists
    if (!rows.length) {
      const totalTax = n2(cp?.totalTaxAmount ?? data?.totalTaxAmount);
      if (totalTax !== 0) rows.push({ label: "Tax", value: totalTax });
    }

    return rows;
  };

  // ✅ remove any existing "Tax / CGST / SGST / IGST" rows from lineItems
  const baseItems: any[] = Array.isArray(data?.lineItems) ? [...data.lineItems] : [];
  const cleanedItems = baseItems.filter((it) => {
    const l = String(it?.label ?? "").toLowerCase().trim();
    if (!l) return true;
    // remove if it is any tax row
    return !(
      l === "tax" ||
      l.includes("cgst") ||
      l.includes("sgst") ||
      l.includes("igst") ||
      l.includes("total tax")
    );
  });

  // ✅ insert selected tax rows exactly after "Sub Total" row
  const selectedTaxRows = buildSelectedTaxRows();

  const finalLineItems: any[] = [];
  let inserted = false;

  for (const item of cleanedItems) {
    finalLineItems.push(item);

    const label = String(item?.label ?? "").toLowerCase();
    const isSubTotalRow =
      label.replace(/\s+/g, " ").includes("sub total") ||
      item?.isSubTotal === true;

    if (isSubTotalRow && !inserted) {
      for (const tx of selectedTaxRows) {
        finalLineItems.push({
          label: tx.label,
          value: tx.value,
          isBold: false,
          isSubItem: false,
        });
      }
      inserted = true;
    }
  }

  // fallback: if subtotal not found, append taxes before total amount if possible, else at end
  if (!inserted && selectedTaxRows.length) {
    for (const tx of selectedTaxRows) {
      finalLineItems.push({ label: tx.label, value: tx.value });
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#fff; padding:12px; font-size:11px; }
    .invoice-container { max-width:800px; margin:0 auto; background:#fff; border:1px solid #ddd; padding:18px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; padding-bottom:10px; border-bottom:2px solid #333; }
    .invoice-info { text-align:right; font-size:11px; line-height:1.5; }
    .section-header { background-color: rgba(82, 121, 152, 1); padding:5px 12px; font-weight:bold; color:#333; margin:12px 0 6px 0; font-size:12px; }

    .billing-booking-row { display:flex; justify-content:space-between; gap:40px; margin:20px 0; }
    .billing-section { flex:1; min-width:45%; }
    .booking-section { flex:1; min-width:45%; }
    .field-group { margin-bottom:8px; font-size:12px; display:flex; justify-content:space-between; }
    .field-label { font-weight:500; min-width:140px; }
    .field-value { text-align:right; }

    .trip-info { font-size:11px; margin:6px 0; }

    .invoice-section-header { display:flex; justify-content:space-between; align-items:center; padding:6px 12px; background-color: rgba(82, 121, 152, 1); font-weight:bold; color:#333; margin:12px 0 0 0; font-size:12px; }

    .invoice-table { width:100%; border-collapse:collapse; margin:0 0 12px 0; }
    .invoice-table td { padding:5px 12px; border:none; font-size:11px; vertical-align:top; }
    .invoice-table td:first-child { text-align:left; color:#333; }
    .invoice-table td:last-child { text-align:right; font-weight:500; }

    .subtotal-row td { padding-top:8px !important; font-weight:600; border-top:1px solid #ddd; }

    .usage-table { width:100%; border-collapse:collapse; border:2px solid #333; margin:12px 0; }
    .usage-table th, .usage-table td { border:1px solid #333; padding:5px 8px; text-align:center; font-size:10px; }
    .usage-table th { background:#f0f0f0; font-weight:bold; }

    .footer-info { margin-top:15px; font-size:9px; line-height:1.3; border-top:1px solid #ddd; padding-top:12px; }
    .footer-row { display:flex; margin-bottom:3px; }
    .footer-label { font-weight:bold; min-width:80px; }

    .logo-section { display:flex; align-items:center; gap:10px; }
    .logo-img { height:60px; width:auto; }

    .email-color{ color: rgb(39, 89, 129); font-weight:bold; }
    .phone-color{ color:#4CAF50; font-weight:bold; }

    .total-due-row td { border-top:1px solid #000 !important; padding-top:12px; }
    .total-due-label { font-weight:800 !important; font-size:18px; }
    .total-due-amount { font-weight:900 !important; font-size:18px; color:#0a8a2a !important; }

    @page { size:A4; margin:12mm; }
  </style>
</head>
<body>
  <div class="invoice-container">

    <div class="header">
      <div class="logo-section">
        <img src="${logoSrc}" alt="Grace Cabs" class="logo-img" />
      </div>
      <div class="invoice-info">
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${data.invoiceDate}</p>
      </div>
    </div>

    <div class="billing-booking-row">
      <div class="billing-section">
        <div class="section-header">Billing To</div>
        <div class="field-group">${data.customerName}</div>
        <div class="field-group">${data.customerAddress}</div>
        <div class="field-group">GST NO: ${data.gstNo}</div>
        <div class="field-group">${data.city}</div>
        <div class="field-group">${data.state}, ${data.country}</div>
      </div>

      <div class="booking-section">
        <div class="section-header">Booking Details</div>
        <div class="field-group"><span class="field-label">Order Number</span><span class="field-value">${data.orderNumber}</span></div>
        <div class="field-group"><span class="field-label">Pickup Type</span><span class="field-value">${data.pickupPoint}</span></div>
        <div class="field-group"><span class="field-label">Vehicle Type</span><span class="field-value">${data.vehicleType} (${data.vehicleNumber})</span></div>
        <div class="field-group"><span class="field-label">Pickup Date</span><span class="field-value">${data.pickupDate}</span></div>
        <div class="field-group"><span class="field-label">Booking Email Id</span><span class="field-value email-color">${data.email}</span></div>
        <div class="field-group"><span class="field-label">Booking Mobile No</span><span class="field-value phone-color">${data.mobile}</span></div>
      </div>
    </div>

    <div class="section-header">Trip Details</div>
    <div class="trip-info">${data.tripDetails}</div>

    <table class="usage-table">
      <thead>
        <tr><th></th><th>GARAGE OPEN</th><th>GARAGE CLOSE</th><th>USAGE</th></tr>
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

    <div class="invoice-section-header">
      <span>Invoice Details</span>
      <span>Amount (Rs)</span>
    </div>

    <table class="invoice-table">
      <tbody>
        ${finalLineItems
          .map((item: any) => {
            const isTotalDue =
              String(item.label || "").toLowerCase().includes("total due");

            const isSubTotal =
              String(item.label || "").toLowerCase().replace(/\s+/g, " ").includes("sub total") ||
              item.isSubTotal === true;

            return `
              <tr class="${isTotalDue ? "total-due-row" : ""} ${isSubTotal ? "subtotal-row" : ""}">
                <td class="${isTotalDue ? "total-due-label" : ""}">${item.label}</td>
                <td class="${isTotalDue ? "total-due-amount" : ""}">
                  ${n2(item.value).toFixed(2)}
                </td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>

    <div class="footer-info">
      <div class="footer-row"><span class="footer-label">Regd.Office:</span><span>Grace Cabs  Pvt. Ltd., 7/621 NESAMANI NAGAR, PERUMBAKKAM, CHENNAI - 600100</span></div>
      <div class="footer-row"><span class="footer-label">Website:</span><span>gracecabs.com</span></div>
      <div class="footer-row"><span class="footer-label">GSTIN:</span><span>33AAMCG2518C1Z0</span></div>
      <div class="footer-row"><span class="footer-label">PAN No.:</span><span>AAMCG2518C</span></div>
      <div class="footer-row"><span class="footer-label">SAC:</span><span>996609</span></div>
      <div class="footer-row"><p>It is a system generated invoice which does not need a signature</p></div>
    </div>

  </div>
</body>
</html>
  `;
};


export const downloadUserInvoicePdf = async (req: any, res: Response) => {
  try {
    const { bookingId, invoiceId } = req.params;

    const role: string | undefined = req.role;
    const userIdFromAuth: string | undefined =
      req.userId || req.user?.id || req.user?.userId;

    if (!bookingId || !invoiceId) {
      return res.status(400).json({ success: false, message: "bookingId & invoiceId required" });
    }
    const where: any = { bookingId };
    if (role === USERS.ROLES.USER) {
      if (!userIdFromAuth) {
        return res.status(401).json({ success: false, message: "Unauthorized: userId missing" });
      }
      where.userId = userIdFromAuth;
    }

    // const booking = await Booking.findOne({
    //   where,
    //   include: [
    //     { model: VehicleType, as: "vehicleType", required: false },
    //     { model: Vehicle, as: "vehicle", required: false, include: [{ model: VehicleMaster, as: "vehicleMaster", required: false }] },
    //     {
    //       model: Payment, as: "payment", required: false, include: [
    //         { model: Invoice, as: "invoices", required: false, include: [{ model: ClosePending, as: "closePending", required: false, include: [{ model: PackageData, as: "packageData", required: false }] }] }
    //       ]
    //     },
    //     { model: User, as: "user", required: false, include: [{ model: Company, as: "company", required: false }] },
    //     { model: Drivers, as: "driver", required: false },
    //   ],
    // });
     const booking = await Booking.findByPk(bookingId, {
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
           attributes:["localPerKm","localPerHour"]
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
                                            "additionalHoursAmount"
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
                                    "gstNo"
                                ],
                            },
                        ],
                    },
                    {
                        model: Vehicle,
                        as: "vehicle",
                        required: false,
                        attributes:["localPerKm"],
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

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not accessible" });
    }

    // --- Ensure invoices attached to booking.payment.invoices exist and include the requested invoice ---
    const invsFromBooking: any[] = booking?.payment?.invoices ?? [];

    let invoiceFoundInBooking = false;
    if (invsFromBooking.length) {
      if (invoiceId) {
        invoiceFoundInBooking = invsFromBooking.some((i: any) =>
          String(i.invoiceId) === String(invoiceId) ||
          String(i.invoiceNumber) === String(invoiceId)
        );
      } else {
        invoiceFoundInBooking = true;
      }
    }

    if (!invoiceFoundInBooking) {
      // fetch invoice from DB using bookingId and optional invoiceId filter
      const invoiceWhere: any = { bookingId: booking.bookingId };
      if (invoiceId) {
        // IMPORTANT: do NOT query by `id` — your table's PK is invoiceId, not id.
        invoiceWhere[Op.or] = [
          { invoiceId: invoiceId },
          { invoiceNumber: invoiceId },
        ];
      }

      const invoiceFromDb = await Invoice.findOne({
        where: invoiceWhere,
        include: [
          { model: ClosePending, as: "closePending", required: false, include: [{ model: PackageData, as: "packageData", required: false }] },
        ],
      });

      if (!invoiceFromDb) {
        return res.status(404).json({ success: false, message: "Invoice not found for this booking" });
      }

      booking.payment = booking.payment || {};
      booking.payment.invoices = [invoiceFromDb];
    }

    const data = mapToUserInvoiceData(booking, invoiceId);
    if (!data) {
      return res.status(404).json({ success: false, message: "Invoice not found for this booking" });
    }

    const html = generateInvoiceHTMLForuser(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });
    await browser.close();

    const filename = `${data.invoiceNumber}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    return res.send(pdf);
  } catch (err: any) {
    console.error("[downloadUserInvoicePdf]", err);
    return res.status(500).json({ success: false, message: "Failed to generate PDF", error: err?.message });
  }
};
