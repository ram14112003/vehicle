import { Request, Response } from 'express';
import { Vendor } from '../models/vendor';
import { Op, where } from 'sequelize';
import bcrypt from 'bcrypt';
import { Booking } from '../models/booking';
import { Vehicle } from '../models/vehicle';
import { VehicleType } from '../models/vehicleType';
import { Tax } from '../models/tax';
import { Company, Employee, User, Invoice, Payment, VehicleMaster, ClosePending } from '../models';
import { USERS, ORDER, USERSTATUS,COMPANY } from "../utils/costants";
import moment from "moment-timezone";
import sequelize from 'sequelize';
import { error } from 'console';
const { STATUS } = ORDER;
const { ROLES } = USERS;
const { NAME } = COMPANY;
const { USER_STATUS } = USERSTATUS;

import { formatDateTime } from '../utils/formatDateTime';
import { sendNotification } from "../utils/sendNotification";
import { sendEmailFromTemplate } from "../services/emailConfServices";
import { fetchAllEmailConfs } from "../services/emailConfServices";
import config from '../config/config';
import { sendTransactionalSms } from './smsServices';
import {normalizeManagerEmails } from '../utils/email';
import { sendSmsNotifications } from '../utils/smsNotifications';

import crypto from "crypto";



export const createVendor = async (req: any, res: Response) => {
  const { vendorName, email, phno, password, address, country, state, city, vehicleId, companyId, vehicleCount, refererVendor } = req.body;

  try {
    const existing = await Vendor.findOne({ where: { email } });

    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }
    if (existing) {
      return res.status(400).json({ message: 'Vendor already registered' });
    }
    const role = ROLES.ADMIN;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdBy = req.user?.employeeId;
    const vendor = await Vendor.create({ vendorName, email, phno, password: hashedPassword,
       address, country, state, city, vehicleId, companyId, vehicleCount, role, refererVendor, createdBy });

    res.status(201).json({ message: 'Registered successfully', vendor });


  } catch (err: any) {
    console.error('Create Vendor Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};

export const createBookingForWeb = async (req: any, res: Response) => {
  const {
    bookingDate,
    bookingTime,
    pickupPoint,
    pickupCity,
    dropPoint,
    travellersCount,
    femaleCount,
    maleCount,
    remarks,
    purpose,
    vehicleId,
    driverId,
    vehicleTypeId,
    preferredType,
    roundTrip,
    pickupAirport,
    pickupStation,
    flightNo,
    trainNo,
    notes,
    pickupLongitude,
    pickupLatitude,
    dropLatitude,
    userId,
    bookingCreatedBy,
     behalfOfName,
     behalfOfPhone,
    dropLongitude,
    pickupArea,
    predefinedArea,
    approximatetds2,
    approximatetds1,
      costCenter,
  managerUserId,
  managerEmail,
  } = req.body;

  try {
    // Logged-in person (can be employee or user)
    const loggedInId = req.userId;

    if (req.role === ROLES.DRIVER) {
      return res.status(403).json({ message: "Not able to authorize" });
    }

    // Check user active/inactive
    const user = await User.findOne({ where: { userId: userId } });
    if (user?.status === USER_STATUS.INACTIVE) {
      return res.status(403).json({ message: "User not active" });
    }

    // ✅ Fix: Decide who created this booking
    let createdBy = loggedInId;
    let employeeId = null;

    if (req.role === ROLES.EMPLOYEE) {
      // Employee creating booking for user
      employeeId = loggedInId;
    } else if (req.role === ROLES.USER) {
      // User booking for themselves
      employeeId = null; // no employee
    }

    const confirmStatus = STATUS.PENDING;
    const bookingStatus = STATUS.PENDING;
    const driverTripStatus = STATUS.PENDING;
    const autoApproveStatus = STATUS.PENDING;    
    const company = await Company.findByPk(user?.companyId);

    // Derive booking time if not given
    let finalBookingTime = bookingTime;
    if (!bookingTime && bookingDate) {
      const timePart = bookingDate.split("T")[1]?.split("+")[0]?.split("Z")[0] || "";
      finalBookingTime = timePart.substring(0, 8);
    }

    
    // ✅ Create booking properly
    const booking = await Booking.create({
      bookingDate,
      bookingTime: finalBookingTime,
      employeeId, // can be null for user
      pickupPoint,
      pickupCity,
      dropPoint,
      travellersCount,
      femaleCount,
      maleCount,
      remarks,
      purpose,
      confirmStatus,
      bookingStatus,
      vehicleId,
      driverId,
      vehicleTypeId,
      preferredType,
      roundTrip,
      pickupAirport,
      pickupStation,
      flightNo,
      trainNo,
      notes,
      pickupLongitude,
      pickupLatitude,
      dropLatitude,
      dropLongitude,
      userId,
      bookingCreatedBy,
        behalfOfName,
        behalfOfPhone,
      autoApproveStatus,
      pickupArea,
      predefinedArea,
      approximatetds2,
      approximatetds1,
        // ✅ ADD THESE
  costCenter,
  managerUserId,
  driverTripStatus,
  managerEmail,
      createdBy,
    });

       // ================= DANFOSS MANAGER ALERT =================
   // if (company?.companyName?.toLowerCase().includes("danfoss")) {
  // if (managerUserId && managerUserId.trim() !== "") {
  //     console.log("in if comp ",company?.companyName)
  //     const managerUser = await User.findOne({
  //       where: { userId: managerUserId },
  //     });
  //     console.log(managerUser?.username," ",managerUser?.isManager);
  //     await sendEmailForDanManager(booking, managerUser?.email, managerUser?.username);
  //    await sendSMSForDanManager(booking, managerUser?.mobile, user?.mobile);


  //     autoApproveIfNoAction(booking.bookingId);
  //   }

if (managerEmail && managerEmail.trim() !== "") {

  // await sendEmailForDanManager(
  //   booking,
  //   managerEmail,
  //   "Manager"
  // );

  // Split emails if comma separated
  const managerEmails = managerEmail
    .split(",")
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0);

  // Send email to each manager
  // for (const email of managerEmails) {
  //   try {
  //     await sendEmailForDanManager(
  //       booking,
  //       email,
  //       "Manager"
  //     );
  //   } catch (error) {
  //     console.error(`Failed to send manager email to ${email}:`, error);
  //   }
  // }
  // generate token once
const token = crypto.randomBytes(32).toString("hex");

// save token once
await Booking.update(
  { managerApprovalToken: token },
  { where: { bookingId: booking.bookingId } }
);

// send email to all managers with same token
for (const email of managerEmails) {
  try {
    await sendEmailForDanManager(
      booking,
      email,
      "Manager",
      token
    );
  } catch (error) {
    console.error(`Failed to send manager email to ${email}:`, error);
  }
}

  autoApproveIfNoAction(booking.bookingId);
}
    // Include vehicle info
    const includeArray = [];
    if (vehicleId) {
      includeArray.push({
        model: Vehicle,
        include: [{ model: VehicleType }],
      });
    } else {
      includeArray.push({ model: VehicleType });
    }

    const bookingWithDetails = await Booking.findByPk(booking.bookingId, {
      include: includeArray,
    });
//console.log("copamnyyy ",bookingWithDetails?.user?.company?.needEmail);

 let needEmail = false;

    if (user?.companyId) {
      const company = await Company.findByPk(
        user.companyId,
        { attributes: ["needEmail"] }
      );
      needEmail = company?.needEmail === true;
    }
   // console.log("need ",needEmail);
 const pickupMoment = booking && booking.bookingDate
    ? moment.parseZone(booking.bookingDate)
    : bookingDate
    ? moment.parseZone(bookingDate)
    : null;

        const now = moment();
    if (pickupMoment?.isAfter(now)) {
          // Email logic 
          console.log("in if  ",pickupMoment?.isAfter(now));
          if(needEmail && company?.managerApproval === false)
          {
            await sendBookingEmailToUser(booking, userId);
    //             try {
    //   const user = await User.findByPk(userId);
    //   const bookingDateTime = new Date(bookingDate);
    //   const cabAssignedDateTime = new Date(bookingDateTime.getTime() - 10 * 60000);
    //   const cabAssignedMinutes = "20";
    //   const formattedBookingDate = formatDateTime(bookingDateTime);

    //   const emailConfigs = await fetchAllEmailConfs();
    //   const orderConfirmConf = emailConfigs.find(
    //     (conf: any) => conf.emailCode === "ORDER_BOOKING_EMAIL_TO_CLIENT"
    //   );

    //   if (user?.email && orderConfirmConf) {
    //     await sendEmailFromTemplate(orderConfirmConf.emailCode, {
    //       UserName: user.username || "",
    //       UserEmail: user.email,
    //       OrderNumber: booking.bookingCode,
    //       BookingDetails: `
    //         Pickup: ${pickupPoint}, ${pickupCity}<br/>
    //         Drop: ${dropPoint}<br/>
    //         Pickup Date: ${formattedBookingDate}<br/>
    //       `,
    //       CabAssignedMinutes: cabAssignedMinutes,
    //     });
    //   }
    // } catch (error: any) {
    //   console.error("email send error:", error);
    // }

          } else {
      console.log(" Company has disabled email notifications.");
          }

          //sms block
          if(!company?.managerApproval)
        {
const user = await User.findByPk(userId);
  await sendBookingSMSToUser(user);
//          try {
//      if (user?.mobile) {
//        const mobileNumber = user.mobile;
   
//        try {
//            // 2Factor API configuration from environment variables
//          const apiKey =  process.env.TWO_FACTOR_API_KEY;
//          const senderId = process.env.TWO_FACTOR_SENDER_ID;
//          const templateName = "Booking Creation";
     
//          if (!apiKey || !senderId) {
//            throw new Error("SMS API configuration missing in environment variables");
//          }
     
//          // Build SMS URL with parameters
//          const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${mobileNumber}&from=${senderId}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(user.username)}`;
     
// //          Send SMS using fetch
//          const smsResponse = await fetch(smsUrl);
     
//          if (!smsResponse.ok) {
//            throw new Error(`SMS API request failed with status: ${smsResponse.status}`);
//          }
     
//          const smsResult = await smsResponse.json();
     
//          console.log(" SMS sent successfully:", smsResult);
//        } catch (smsError: any) {
//          console.error(" SMS send error:", smsError.message);
// //       // Optional: You can also log to error tracking service here
//        }
//      } else {
//        console.log(" User mobile number not found");
//      }
//    } catch (error: any) {
//      console.error(" Unexpected error in SMS sending process:", error);
//    } 
 
}}
   else {
      console.log(
        `Pickup (${pickupMoment?.toISOString()}) is not in the future (now: ${moment().toISOString()}); skipping SMS.`
      );
    }
 
    return res.status(201).json({
      success: true,
      message: "Booked successfully",
      booking: bookingWithDetails,
    });
  } catch (err: any) {
    console.error("Create Booking Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};
export const createBookingForWebOnCall = async (req: any, res: Response) => {
  const {
    bookingDate,
    bookingTime,
    pickupPoint,
    pickupCity,
    dropPoint,
    travellersCount,
    femaleCount,
    maleCount,
    remarks,
    purpose,
    vehicleId,
    driverId,
    vehicleTypeId,
    preferredType,
    roundTrip,
    pickupAirport,
    pickupStation,
    flightNo,
    trainNo,
    notes,
    pickupLongitude,
    pickupLatitude,
    dropLatitude,
    userId,
    bookingCreatedBy,
     behalfOfName,
     behalfOfPhone,
    dropLongitude,
    pickupArea,
    predefinedArea,
    approximatetds2,
    approximatetds1,
      costCenter,
  managerUserId,
  managerEmail,
  companyId, // 🔥 ADD
  selfName, 
  } = req.body;

  try {
    // Logged-in person (can be employee or user)
    const loggedInId = req.userId;

    if (req.role === ROLES.DRIVER) {
      return res.status(403).json({ message: "Not able to authorize" });
    }

    // Check user active/inactive
    const user = await User.findOne({ where: { userId: userId } });
    if (user?.status === USER_STATUS.INACTIVE) {
      return res.status(403).json({ message: "User not active" });
    }

    // ✅ Fix: Decide who created this booking
    let createdBy = loggedInId;
    let employeeId = null;

    if (req.role === ROLES.EMPLOYEE) {
      // Employee creating booking for user
      employeeId = loggedInId;
    } else if (req.role === ROLES.USER) {
      // User booking for themselves
      employeeId = null; // no employee
    }

    const confirmStatus = STATUS.PENDING;
    const bookingStatus = STATUS.PENDING;
    const autoApproveStatus = STATUS.PENDING;    
    const company = await Company.findByPk(user?.companyId);

    // Derive booking time if not given
    let finalBookingTime = bookingTime;
    if (!bookingTime && bookingDate) {
      const timePart = bookingDate.split("T")[1]?.split("+")[0]?.split("Z")[0] || "";
      finalBookingTime = timePart.substring(0, 8);
    }

    
    // ✅ Create booking properly
    const booking = await Booking.create({
      bookingDate,
      bookingTime: finalBookingTime,
      employeeId, // can be null for user
      pickupPoint,
      pickupCity,
      dropPoint,
      travellersCount,
      femaleCount,
      maleCount,
      remarks,
      purpose,
      confirmStatus,
      bookingStatus,
      vehicleId,
      driverId,
      vehicleTypeId,
      preferredType,
      roundTrip,
      pickupAirport,
      pickupStation,
      flightNo,
      trainNo,
      notes,
      pickupLongitude,
      pickupLatitude,
      dropLatitude,
      dropLongitude,
      userId,
      bookingCreatedBy,
        behalfOfName,
        behalfOfPhone,
      autoApproveStatus,
      pickupArea,
      predefinedArea,
      approximatetds2,
      approximatetds1,
        // ✅ ADD THESE
  costCenter,
  managerUserId,
  managerEmail,
      createdBy,
        companyId,
        selfName
    });

       // ================= DANFOSS MANAGER ALERT =================
   // if (company?.companyName?.toLowerCase().includes("danfoss")) {
  // if (managerUserId && managerUserId.trim() !== "") {
  //     console.log("in if comp ",company?.companyName)
  //     const managerUser = await User.findOne({
  //       where: { userId: managerUserId },
  //     });
  //     console.log(managerUser?.username," ",managerUser?.isManager);
  //     await sendEmailForDanManager(booking, managerUser?.email, managerUser?.username);
  //    await sendSMSForDanManager(booking, managerUser?.mobile, user?.mobile);


  //     autoApproveIfNoAction(booking.bookingId);
  //   }

if (managerEmail && managerEmail.trim() !== "") {

  // await sendEmailForDanManager(
  //   booking,
  //   managerEmail,
  //   "Manager"
  // );

  // Split emails if comma separated
  const managerEmails = managerEmail
    .split(",")
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0);

  // Send email to each manager
  // for (const email of managerEmails) {
  //   try {
  //     await sendEmailForDanManager(
  //       booking,
  //       email,
  //       "Manager"
  //     );
  //   } catch (error) {
  //     console.error(`Failed to send manager email to ${email}:`, error);
  //   }
  // }
  // generate token once
const token = crypto.randomBytes(32).toString("hex");

// save token once
await Booking.update(
  { managerApprovalToken: token },
  { where: { bookingId: booking.bookingId } }
);

// send email to all managers with same token
for (const email of managerEmails) {
  try {
    await sendEmailForDanManager(
      booking,
      email,
      "Manager",
      token
    );
  } catch (error) {
    console.error(`Failed to send manager email to ${email}:`, error);
  }
}

  autoApproveIfNoAction(booking.bookingId);
}
    // Include vehicle info
    const includeArray = [];
    if (vehicleId) {
      includeArray.push({
        model: Vehicle,
        include: [{ model: VehicleType }],
      });
    } else {
      includeArray.push({ model: VehicleType });
    }

    const bookingWithDetails = await Booking.findByPk(booking.bookingId, {
      include: includeArray,
    });
//console.log("copamnyyy ",bookingWithDetails?.user?.company?.needEmail);

 let needEmail = false;

    if (user?.companyId) {
      const company = await Company.findByPk(
        user.companyId,
        { attributes: ["needEmail"] }
      );
      needEmail = company?.needEmail === true;
    }
   // console.log("need ",needEmail);
 const pickupMoment = booking && booking.bookingDate
    ? moment.parseZone(booking.bookingDate)
    : bookingDate
    ? moment.parseZone(bookingDate)
    : null;

        const now = moment();
    if (pickupMoment?.isAfter(now)) {
          // Email logic 
          console.log("in if  ",pickupMoment?.isAfter(now));
          if(needEmail && company?.managerApproval === false)
          {
            await sendBookingEmailToUser(booking, userId);
    //             try {
    //   const user = await User.findByPk(userId);
    //   const bookingDateTime = new Date(bookingDate);
    //   const cabAssignedDateTime = new Date(bookingDateTime.getTime() - 10 * 60000);
    //   const cabAssignedMinutes = "20";
    //   const formattedBookingDate = formatDateTime(bookingDateTime);

    //   const emailConfigs = await fetchAllEmailConfs();
    //   const orderConfirmConf = emailConfigs.find(
    //     (conf: any) => conf.emailCode === "ORDER_BOOKING_EMAIL_TO_CLIENT"
    //   );

    //   if (user?.email && orderConfirmConf) {
    //     await sendEmailFromTemplate(orderConfirmConf.emailCode, {
    //       UserName: user.username || "",
    //       UserEmail: user.email,
    //       OrderNumber: booking.bookingCode,
    //       BookingDetails: `
    //         Pickup: ${pickupPoint}, ${pickupCity}<br/>
    //         Drop: ${dropPoint}<br/>
    //         Pickup Date: ${formattedBookingDate}<br/>
    //       `,
    //       CabAssignedMinutes: cabAssignedMinutes,
    //     });
    //   }
    // } catch (error: any) {
    //   console.error("email send error:", error);
    // }

          } else {
      console.log(" Company has disabled email notifications.");
          }

          //sms block
          if(!company?.managerApproval)
        {
const user = await User.findByPk(userId);
  await sendBookingSMSToUser(user);
//          try {
//      if (user?.mobile) {
//        const mobileNumber = user.mobile;
   
//        try {
//            // 2Factor API configuration from environment variables
//          const apiKey =  process.env.TWO_FACTOR_API_KEY;
//          const senderId = process.env.TWO_FACTOR_SENDER_ID;
//          const templateName = "Booking Creation";
     
//          if (!apiKey || !senderId) {
//            throw new Error("SMS API configuration missing in environment variables");
//          }
     
//          // Build SMS URL with parameters
//          const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${mobileNumber}&from=${senderId}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(user.username)}`;
     
// //          Send SMS using fetch
//          const smsResponse = await fetch(smsUrl);
     
//          if (!smsResponse.ok) {
//            throw new Error(`SMS API request failed with status: ${smsResponse.status}`);
//          }
     
//          const smsResult = await smsResponse.json();
     
//          console.log(" SMS sent successfully:", smsResult);
//        } catch (smsError: any) {
//          console.error(" SMS send error:", smsError.message);
// //       // Optional: You can also log to error tracking service here
//        }
//      } else {
//        console.log(" User mobile number not found");
//      }
//    } catch (error: any) {
//      console.error(" Unexpected error in SMS sending process:", error);
//    } 
 
}}
   else {
      console.log(
        `Pickup (${pickupMoment?.toISOString()}) is not in the future (now: ${moment().toISOString()}); skipping SMS.`
      );
    }
 
    return res.status(201).json({
      success: true,
      message: "Booked successfully",
      booking: bookingWithDetails,
    });
  } catch (err: any) {
    console.error("Create Booking Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};
export const createBooking = async (req: any, res: Response) => {
  const { bookingDate, bookingTime, pickupPoint, pickupCity, dropPoint, travellersCount, 
    femaleCount, maleCount, remarks, purpose, vehicleId, driverId, vehicleTypeId, preferredType,
    roundTrip, pickupAirport, pickupStation, flightNo, trainNo, notes, pickupLongitude, pickupLatitude,
    dropLatitude, 
    //userId: bodyUserId, 
    dropLongitude, pickupArea, predefinedArea, approximatetds2, approximatetds1,   costCenter, managerUserId, managerEmail,
      behalfOfName, behalfOfPhone
  } = req.body;

  try {
    //let employeeId: string | null = null;
    //let finalUserId: string | null = bodyUserId ?? null;
    console.log("time ",bookingDate, bookingTime);
    const createdBy = req.userId;

    //const employee = await Employee.findOne({ where: { employeeId: createdBy } });
    //last add
    const user = await User.findOne({ where: { userId: createdBy } });
   // const parsedDateTime = moment.tz( `${bookingDate}`, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata");
   // const bookingDateAsDate = parsedDateTime.toDate();

   // const formattedBookingDate = parsedDateTime.format("YYYY-MM-DD HH:mm:ss");    
   // const formattedBookingTime = parsedDateTime.format("HH:mm:ss");  
const parsedDateTime = moment.utc(bookingDate).tz("Asia/Kolkata");

const bookingDateAsDate = parsedDateTime.toDate();
const formattedBookingDate = parsedDateTime.format("YYYY-MM-DD HH:mm:ss");
const formattedBookingTime = parsedDateTime.format("HH:mm:ss");
    // only time

    // if (employee) {
    //   employeeId = employee.employeeId;
    // }

    // if (!finalUserId && user) {
    //   finalUserId = user.userId;
    // }

    if (req.role === ROLES.DRIVER) {
      return res.status(403).json({ message: 'Not able to authorize' });
    }

     if (user?.status === USER_STATUS.INACTIVE) {
      return res.status(403).json({ message: 'User not active' });
    }

    const confirmStatus = STATUS.PENDING;
    const bookingStatus = STATUS.PENDING;
    const autoApproveStatus = STATUS.PENDING;
     const driverTripStatus = STATUS.PENDING;
        const company = await Company.findByPk(user?.companyId);

    // --- Create Booking ---
    const booking = await Booking.create({
     // bookingDate: bookingDateAsDate, bookingTime: formattedBookingTime, pickupPoint, pickupCity, dropPoint, travellersCount,
      bookingDate: bookingDateAsDate, bookingTime:formattedBookingTime, pickupPoint, pickupCity, dropPoint, travellersCount,
      femaleCount, maleCount, remarks, purpose, confirmStatus, bookingStatus, vehicleId, driverId,
      vehicleTypeId, preferredType, roundTrip, pickupAirport, pickupStation, flightNo, trainNo, notes,  behalfOfName,behalfOfPhone,
      pickupLongitude, pickupLatitude, dropLatitude, dropLongitude, userId:createdBy,
      pickupArea, predefinedArea, approximatetds2, approximatetds1, createdBy, costCenter, managerUserId, managerEmail, autoApproveStatus,
      driverTripStatus
    });

         // ================= DANFOSS MANAGER ALERT =================
    //if (company?.companyName?.toLowerCase().includes("danfoss")) {
    if (managerEmail && managerEmail.trim() !== "") {
      console.log("in if comp ",company?.companyName)
      // const managerUser = await User.findOne({
      //   where: { userId: managerUserId },
      // });
      //const formattedPickupDateForEmail =  parsedDateTime.format("DD/MM/YYYY hh:mm A");
      // combine date + time correctly
const datePart = moment.utc(booking.bookingDate).format("YYYY-MM-DD");
const dateTimeString = `${datePart} ${booking.bookingTime}`;

const formattedPickupDateForEmail = moment(dateTimeString, "YYYY-MM-DD HH:mm:ss")
  .tz("Asia/Kolkata")
  .format("DD/MM/YYYY hh:mm A");
      console.log("manager ",managerEmail);
     // await sendEmailForDanManager(booking, managerUser?.email, managerUser?.username);
     // await sendEmailForDanManagerFromMob(booking, managerUser?.email, managerUser?.username,formattedPickupDateForEmail   );
     
       // Split emails if comma separated
  const managerEmails = managerEmail
    .split(",")
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0);

  // Send email to each manager
  for (const email of managerEmails) {
    try {
      await sendEmailForDanManagerFromMob(
        booking,email,"Manager",formattedPickupDateForEmail
      );
    } catch (error) {
      console.error(`Failed to send manager email to ${email}:`, error);
    }
  }
     //await sendSMSForDanManager(booking, managerUser?.mobile, user?.mobile);


      autoApproveIfNoAction(booking.bookingId);
    }



    // --- Include Vehicle / VehicleType ---
    const includeArray = [];
    if (vehicleId) {
      includeArray.push({
        model: Vehicle,
        include: [{ model: VehicleType }],
      });
    } else {
      includeArray.push({ model: VehicleType });
    }

const bookingWithDetails = await Booking.findByPk(booking.bookingId, {
  include: includeArray,
});

try {
  const getVendor = await VehicleMaster.findOne({
    where: { vehicleTypeId: bookingWithDetails?.vehicleTypeId },
  });

   const vendor = await Vendor.findOne({
    where: { vendorId: getVendor?.vendorId},
  });

  const fcm_token = vendor?.fcm_token;
  console.log("createbooking , vendor token ",fcm_token)

  if (!fcm_token) {
    console.log("No FCM token found for vendor:",vendor?.vendorName);
   // return;
  }

  await sendNotification(fcm_token, `Hello ${vendor?.vendorName} , new booking created `, `Booking created , please confirm booking.. `);
  
} catch (error: any) {
  console.error("Notification send error:", error);
}

try {
    const smsText =
      `Your booking #${booking.bookingId} is created. ` +
      `Pickup: ${pickupPoint} , ${pickupCity}, Drop: ${dropPoint || '-'}, Date: ${formattedBookingDate}.`;
  console.log("time check",smsText);
   // await sendTransactionalSms((user as any).mobile, smsText);


} catch (error: any) {
 console.error("sms send error:", error);
}

    // -----------------------------
    // 📧 Send Email to User
    // -----------------------------
    
 let needEmail = false;

    if (user?.companyId) {
      const company = await Company.findByPk(
        user.companyId,
        { attributes: ["needEmail"] }
      );
      needEmail = company?.needEmail === true;
    }
//      if(needEmail)
//           {
//        try{
//         console.log("user: ",createdBy);
//     const user = await User.findByPk(createdBy);

// //    const bookingDateTime = parsedDateTime;
//    // const bookingDateTime = new Date(bookingDate);
//    const bookingDateTime = parsedDateTime.toDate();
//     const cabAssignedDateTime =  moment(parsedDateTime).subtract(20, "minutes");

//     //const cabAssignedMinutes = formatDateTime(cabAssignedDateTime);
//     const cabAssignedMinutes = "20";
//    // const formattedBookingDateEmail = bookingDateTime.format("DD/MM/YYYY hh:mm A");
//     //const formattedBookingDate = bookingDateTime.format("DD/MM/YYYY hh:mm A");
//  const formattedBookingDate = formatDateTime(bookingDateTime);
 
//     const emailConfigs = await fetchAllEmailConfs();
//     const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_BOOKING_EMAIL_TO_CLIENT");
//         if(company?.managerApproval === false) {
//     if (user?.email && orderConfirmConf) {
//       await sendEmailFromTemplate(orderConfirmConf.emailCode, {
//         UserName: user.username || "",
//         UserEmail: user.email,
//         OrderNumber: booking.bookingCode,
//         BookingDetails: `
//       Pickup: ${pickupPoint}, ${pickupCity}<br/>
//       Drop: ${dropPoint}<br/>
//       Pickup Date: ${formattedBookingDate}<br/>
//     `,
//         CabAssignedMinutes: cabAssignedMinutes
//       });
//     }}

//     }
//     catch (error: any) {
//     console.error('email send error:', error);
//     // res.status(500).json({
//     //   success: false,
//     //   message: 'Error email error',
//     //   error: error.message
//     // });
//   }
// } 
if (needEmail && company?.managerApproval === false) {
  await sendBookingEmailToUser(booking, createdBy);
}
else {
  console.log(" Company has disabled email notifications.");
}

    // 🔹 Get email template code dynamically
const bookingWithVehicle = await Booking.findByPk(booking.bookingId);

//sms block

 try {
        if(!company?.managerApproval)
        {
  // if (user?.mobile) {
  //   const mobileNumber = user.mobile;
   
  //   try {
  //     // 2Factor API configuration from environment variables
  //     const apiKey =  process.env.TWO_FACTOR_API_KEY;
  //     const senderId =  process.env.TWO_FACTOR_SENDER_ID;
  //     const templateName = "Booking Creation";
     
  //     if (!apiKey || !senderId) {
  //       throw new Error("SMS API configuration missing in environment variables");
  //     }
     
  //     // Build SMS URL with parameters
  //     const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${mobileNumber}&from=${senderId}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(user.username)}`;
     
  //     // Send SMS using fetch
  //     const smsResponse = await fetch(smsUrl);
     
  //     if (!smsResponse.ok) {
  //       throw new Error(`SMS API request failed with status: ${smsResponse.status}`);
  //     }
     
  //     const smsResult = await smsResponse.json();
     
  //     console.log(" SMS sent successfully:", smsResult);
  //   } catch (smsError: any) {
  //     console.error(" SMS send error:", smsError.message);
  //     // Optional: You can also log to error tracking service here
  //   }
  // }
   await sendBookingSMSToUser(user);
  } else {
    console.log(" User mobile number not found");
  }
} catch (error: any) {
  console.error(" Unexpected error in SMS sending process:", error);
}
 
   // SUCCESS response
    return res.status(201).json({
      success: true,
      message: "Booked successfully",
      booking: bookingWithVehicle,
    });

  } catch (err: any) {
    console.error('Create Booking Error:', err);

    // ERROR response
    return res.status(500).json({
      success: false,
      message: err.message || 'Something went wrong',
    });
  }
};


export const getAllBooking = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: VehicleType, required: false },
        { model: Vehicle, required: false },
      ]
    });

    res.status(200).json({
      message: 'BookingOrder retrieved successfully',
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving BookingOrder',
      error: error.message,
    });
  }
};


export const getAllPendingBooking = async (req: Request, res: Response) => {
  try {
    console.log("hello");
    const bookings = await Booking.findAll({
      where: {
        bookingStatus: { [Op.in]: [STATUS.PENDING, STATUS.CONFIRMED] }
      },
      attributes: [
        "bookingId",
        "bookingDate",
        "bookingTime",
        "signature",
        "bookingCode",
        "userId",
        "employeeId",
        "pickupPoint",
        "pickupCity",
        "pickupArea",
        "predefinedArea",
        "dropPoint",
        "pickupLongitude",
        "pickupLatitude",
        "dropLatitude",
        "dropLongitude",
        "travellersCount",
        "femaleCount",
        "maleCount",
        "pickupAirport",
        "pickupStation",
        "approximatetds2",
        "approximatetds1",
        "remarks",
        "purpose",
        "confirmStatus",
        "bookingStatus",
        "preferredType",
        "roundTrip",
        "notes",
        "vehicleId",
        "paymentId",
        "vehicleTypeId",
        "driverId",
        "createdBy",
        "createdAt"
      ],
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
            }
          ]
        },
        {
          model: Vehicle,
                as: "vehicle",      
          required: false,
          include: [
            {
              model: VehicleType,
              required: false,
              attributes: [
                "vehicleTypeId",
                "vehicleType",
                "AdvanceBookingHours",
                "seatCapacity",
                "vehicleImg",
                "isDeleted",
                "createdAt"
              ]
            }
          ]
        },
        {
          model: User,
          as: "user",
          required: true,
           attributes: ["userId", "username", "mobile"], 
          include: [
            {
              model: Company,
              as: "company",
              required: true,
              attributes: ["companyId", "managerApproval", "companyName"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Filtering based on company approval
// Filtering based on company approval 
// Filtering based on company approval 
    // Filtering based on company approval 
const filteredBookings = bookings.filter((booking: any) => {
  const company = booking?.user?.company;
  if (!company) return false;

  const confirmStatus = Number(booking.confirmStatus);
  const bookingStatus = Number(booking.bookingStatus);

  // Company requires manager approval
  if (company.managerApproval) {
    // Only after manager approval (0,1)
    return confirmStatus === 0 && bookingStatus === 1;
  } else {
    // No manager approval required → vendor pending (0,0)
    return confirmStatus === 0 && bookingStatus === 0;
  }
});


    // Format response
    const formattedData = filteredBookings.map((b: any) => ({
      bookingId: b.bookingId,
      bookingDate: b.bookingDate,
      bookingTime: b.bookingTime,
      signature: b.signature,
      bookingCode: b.bookingCode,
      userId: b.userId,
         username: b.user?.username || null,
      userPhno: b.user?.mobile || null,
      companyName: b.user?.company?.companyName || null,

      employeeId: b.employeeId,
      pickupPoint: b.pickupPoint,
      pickupCity: b.pickupCity,
      pickupArea: b.pickupArea,
      predefinedArea: b.predefinedArea,
      dropPoint: b.dropPoint,
      pickupLongitude: b.pickupLongitude,
      pickupLatitude: b.pickupLatitude,
      dropLatitude: b.dropLatitude,
      dropLongitude: b.dropLongitude,
      travellersCount: b.travellersCount,
      femaleCount: b.femaleCount,
      maleCount: b.maleCount,
      pickupAirport: b.pickupAirport,
      pickupStation: b.pickupStation,
      approximatetds2: b.approximatetds2,
      approximatetds1: b.approximatetds1,
      remarks: b.remarks,
      purpose: b.purpose,
      confirmStatus: b.confirmStatus,
      bookingStatus: b.bookingStatus,
      preferredType: b.preferredType,
      roundTrip: b.roundTrip,
      notes: b.notes,
      vehicleId: b.vehicleId,
      paymentId: b.paymentId,
      vehicleTypeId: b.vehicleTypeId,
      driverId: b.driverId,
      createdBy: b.createdBy,
      createdAt: b.createdAt,
        vehicleType: b.vehicleType
        ? {
            vehicleTypeId: b.vehicleType.vehicleTypeId,
            vehicleType: b.vehicleType.vehicleType,
            vehicleImg: b.vehicleType.vehicleImg,
            AdvanceBookingHours: b.vehicleType.AdvanceBookingHours,
            seatCapacity: b.vehicleType.seatCapacity,
            priorMinutes: b.vehicleType.priorMinutes,
            isDeleted: b.vehicleType.isDeleted,
            bookingType: b.vehicleType.bookingType,
            createdAt: b.vehicleType.createdAt,
            vehicle: b.vehicleType.vehicle || []
          } : null,
      // vehicleType: b.vehicle?.vehicleType
      //   ? {
      //       vehicleTypeId: b.vehicle.vehicleType.vehicleTypeId,
      //       vehicleType: b.vehicle.vehicleType.vehicleType,
      //       AdvanceBookingHours: b.vehicle.vehicleType.AdvanceBookingHours,
      //       seatCapacity: b.vehicle.vehicleType.seatCapacity,
      //       isDeleted: b.vehicle.vehicleType.isDeleted,
      //       createdAt: b.vehicle.vehicleType.createdAt
      //     }
      //   : null,
      vehicle: b.vehicle || null
    }));

    res.status(200).json({
      message: "PendingOrder retrieved successfully",
      count: formattedData.length,
      data: formattedData
    });
  } catch (error: any) {
    console.error("Error retrieving BookingOrder", error);
    res.status(500).json({
      message: "Error retrieving BookingOrder",
      error: error.message
    });
  }
};


export const createCompany = async (req: any, res: Response) => {
  const {
    companyName,
    companyPhno,
    domainName,
    managerEmail, // string (csv/newlines or JSON array string) OR array
    seoUrl,
    gstNo,
    allowTax,
    needEmail,
    userId,
    startTime,
    closeTime,
    companyCode,
    priorMinutes,
    companyAddress,
    managerApproval
  } = req.body;

  const companyLogo = req.file?.filename;
  //let managerApproval = 0;

  try {
    const role = req.role;
    const employeeId = req.userId;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const existing = await Company.findOne({ where: { companyName } });
    if (existing) {
      return res.status(400).json({ message: "Company already exists" });
    }

    //  normalize/split and store as array
    const managerEmails: string[] = normalizeManagerEmails(managerEmail);

    if (!managerEmails.length) {
      return res
        .status(400)
        .json({ message: "Please provide at least one manager email." });
    }
//const needEmailBoolean = needEmail === "true" || needEmail === true;



    const company = await Company.create({
      companyName,
      companyPhno,
      employeeId,
      companyLogo,
      domainName,
     managerEmail: managerEmails.join(', '), // stored as array/JSON column
      seoUrl,
      gstNo,
      allowTax,
      needEmail,
      userId,
      startTime,
      closeTime,
      companyCode,
      priorMinutes,
      companyAddress, 
      managerApproval,
      isDeleted: 0,
      createdAt: new Date()
    });

      await User.update(
      { companyManager: 1, isManager: 1 },
      {
        where: {
          email: managerEmails
        }
      }
    ); 

    return res
      .status(201)
      .json({ message: "Company created successfully", company });
  } catch (err) {
    console.error("Create Company Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const confirmPendingOrderCount = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const bookings = await Booking.findAll({
      where: {
        confirmStatus: STATUS.PENDING,
        bookingStatus: STATUS.PENDING
      },
      include: [
        { model: Vehicle, required: false },
        { model: VehicleType, required: false }
      ],
      order: [['createdAt', 'DESC']] // optional: newest first
    });

    const count = bookings.length;

    return res.status(200).json({
      message: 'confirmPendingOrders',
      count,
      data: bookings
    });

  } catch (err) {
    console.error('Fetch Confirm Pending Orders Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// export const confirmPendingOrderCountWeb = async (req: any, res: Response) => {
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const bookings = await Booking.findAll({
//       where: {
//         confirmStatus: STATUS.PENDING,
//         bookingStatus: STATUS.PENDING
//       },
//       include: [
//         { model: Vehicle, required: false },
//         { model: VehicleType, required: false }
//       ],
//       order: [['createdAt', 'DESC']] // optional: newest first
//     });


//     const count = bookings.length;
//     // console.log(formattedBookings);

//     return res.status(200).json({
//       message: 'confirmPendingOrders',
//       count,
//       data:bookings
//     });

//   } catch (err) {
//     console.error('Fetch Confirm Pending Orders Error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

export const confirmPendingOrderCountWeb = async (req: any, res: Response) => {
  try {
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const bookings = await Booking.findAll({
      include: [
        { model: Vehicle, required: false },
        { model: VehicleType, required: false },
        {
          model: User,
          as: "user",
          required: true,
          include: [
            {
              model: Company,
              as: "company",
              required: true,
              attributes: ["companyId", "managerApproval"]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 🔹 Apply same filtering logic as getAllPendingBooking
    const filteredBookings = bookings.filter((booking: any) => {
      const company = booking?.user?.company;
      if (!company) return false;

      const confirmStatus = Number(booking.confirmStatus);
      const bookingStatus = Number(booking.bookingStatus);

      if (company.managerApproval) {
        // After manager approval → waiting for vendor approval
        return confirmStatus === 0 && bookingStatus === 1;
      } else {
        // No manager approval → directly vendor pending
        return confirmStatus === 0 && bookingStatus === 0;
      }
    });

    const count = filteredBookings.length;

    return res.status(200).json({
      message: 'confirmPendingOrders',
      count,
      data: filteredBookings
    });

  } catch (err) {
    console.error('Fetch Confirm Pending Orders Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirmPendingOrderForManager = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const userId = req.userId;
  
const userData = await User.findOne({ where: { userId: userId } });
 
const company = await Company.findOne({ where:  { companyId: userData?.companyId } });
console.log("company ",company?.companyName);
if(!userData?.isManager) {
           res.status(401).json({
        success: false,
        message: 'Please login as manager..'
      });
}
const companyUsers = await User.findAll({
      where: { companyId: company?.companyId },
      attributes: ["userId"],
    });

    const companyUserIds = companyUsers.map((u) => u.userId);

    const bookings = await Booking.findAll({
      where: {
        confirmStatus: STATUS.PENDING,
        bookingStatus: STATUS.PENDING,
        userId: { [Op.in]: companyUserIds },
      },
      include: [
        { model: Vehicle, required: false },
        { model: VehicleType, required: false }
      ],
      order: [['createdAt', 'DESC']] // optional: newest first
    });

    const count = bookings.length;

    return res.status(200).json({
      message: 'confirmPendingOrders',
      count,
      data: bookings
    });

  } catch (err) {
    console.error('Fetch Confirm Pending Orders Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const paymentPendingOrderCount = async (req: any, res: Response) => {
  try {
    const role = req.role;

    if (role === USERS.ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { companyId, userId } = req.query;

    const whereBooking: any = {};
    const whereUser: any = {};
    const whereInvoice: any = {};

    // filter only pending invoices
    whereInvoice.invoiceStatus = ORDER.STATUS.PENDING;

    if (userId) {
      whereBooking.userId = userId;
    }

    if (companyId) {
      whereUser.companyId = companyId;
    }

    const invoices = await Invoice.findAll({
      where: whereInvoice,
      include: [
        //  booking details (pickup, drop, etc.)
        {
          model: Booking,
          required: true,
          where: whereBooking,
          attributes: [
            "bookingId",
            "bookingCode",
            "pickupPoint",
            "dropPoint",
            "bookingDate",
            "bookingStatus",
            "confirmStatus",
            "purpose",
            "roundTrip",
          ],
          include: [
            {
              model: User,
              as: "user",
              required: true,
              where: whereUser,
              attributes: ["userId", "username", "email", "companyId"],
              include: [
                {
                  model: Company,
                  attributes: ["companyId", "companyName"],
                },
              ],
            },
          ],
        },

        // ClosePending table via closePendingId
        {
          model: ClosePending,
          required: false,
          attributes: [
            "closependingId",
            "pickupDate",
            "garageKms",
            "guestKms",
            "packageAmount",
            "totalAmount",
            "discountAmount",
            "advanceAmount",
            "totalDue",
          ],
        },

        //  Payment info
        {
          model: Payment,
          as: "payment",
          required: false,
          attributes: ["paymentId", "transactionId", "amount", "status", "createdAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Pending invoice details fetched successfully",
      count: invoices.length,
      data: invoices,
    });
  } catch (err) {
    console.error("Fetch Pending Invoices Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const addTax = async (req: any, res: Response) => {
  const { taxName, taxPercent, isActive } = req.body;

  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }
    const existing = await Tax.findOne({ where: { taxName } });

    if (existing) {
      return res.status(400).json({ message: 'Tax already registered' });
    }

    const tax = await Tax.create({ taxName, taxPercent, isActive });
    res.status(201).json({ message: 'Registered successfully', tax });

  } catch (err: any) {
    console.error('Create Vendor Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};


export const taxList = async (req: Request, res: Response) => {
  try {
    const taxes = await Tax.findAll();

    res.status(200).json({
      message: 'Tax list get successfully',
      data: taxes,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving taxes',
      error: error.message,
    });
  }
};


//  Update Tax (Edit)
export const editTax = async (req: any, res: Response) => {
  const { taxId } = req.params;
  const { taxName, taxPercent, isActive } = req.body;

  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return res.status(404).json({ message: 'Tax not found' });
    }

    tax.taxName = taxName ?? tax.taxName;
    tax.taxPercent = taxPercent ?? tax.taxPercent;
    tax.isActive = isActive ?? tax.isActive;

    await tax.save();

    res.status(200).json({ message: 'Tax updated successfully', tax });
  } catch (err: any) {
    console.error('Edit Tax Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};


//  Delete Tax
export const deleteTax = async (req: any, res: Response) => {
  const { taxId } = req.params;

  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const deleted = await Tax.destroy({
      where: { taxId }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Tax not found or already deleted' });
    }

    res.status(200).json({ message: 'Tax deleted successfully' });
  } catch (err: any) {
    console.error('Delete Tax Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};

export const confirmPendingBooking = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId } = req.body;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const updateConfirm = await Booking.update({ pendingStatus: ORDER.STATUS.CONFIRMED },
      {
        where: {
          pendingStatus: ORDER.STATUS.PENDING,
          bookingId: bookingId,
        }
      }
    );

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    return res.status(200).json({
      message: 'Booking confirmed successfully',
      updateConfirm
    });
  } catch (err) {
    console.error('Update Confirm Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const confirmBookingByManager = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const userId = req.userId;
    const { bookingId } = req.body;

        const userAccess = await User.findAll({
          where: {
            userId: userId,
            isManager: 1
          }
        });

    if (!userAccess || userAccess.length === 0) {
        return res.status(403).json({ message: 'Not Authorized except empManager' });
      }

    const updateConfirm = await Booking.update({ 
      bookingStatus: ORDER.STATUS.CONFIRMED, 
   //   confirmStatus: ORDER.STATUS.CONFIRMED
     },
      {
        where: {
          confirmStatus: ORDER.STATUS.PENDING,
          bookingStatus: ORDER.STATUS.PENDING,
          bookingId: bookingId,
        }
      }
    );

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }
    const bookingDetails = await Booking.findOne({
            where: { bookingId },
          });
    const userDetail = await User.findOne({
            where: { userId: bookingDetails?.userId },
          });
       // push notification
        try {
      
          const fcm_token = userDetail?.fcm_token;
          console.log("driver confirm booking ",fcm_token);
          if (!fcm_token) {
            console.log("No FCM token found for driver:", userDetail?.username);
           // return;
          }
        
          await sendNotification(fcm_token, `Hi ${userDetail?.username}, Booking Confirmed, pls check..`, `Booking confirmed for ${userDetail?.username} by manager`);
       
        } catch (error: any) {
          console.error("Notification send error:", error);
        }
        //send mail 
        let needEmail = false;

if (userDetail?.companyId) {
  const company = await Company.findByPk(
   userDetail?.companyId,
    { attributes: ["needEmail"] }
  );
  needEmail = company?.needEmail === true;
}

console.log("cancel needEmail:", needEmail);
           if(needEmail)
          {
         const emailConfigs = await fetchAllEmailConfs();
            const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_BOOKING_EMAIL_TO_CLIENT");
            //const driverConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_CONFIRMATION_DRIVER");
        
            try {
        
            console.log("userdetails email send ",userDetail?.username);
            // 🔹 Send email to USER
            if (userDetail?.email && orderConfirmConf) {
              await sendEmailFromTemplate(orderConfirmConf.emailCode, {
                UserName: userDetail?.username ?? "",
                UserEmail: userDetail?.email ?? "",
                OrderNumber: bookingDetails?.bookingCode ?? "",
                   CabAssignedMinutes: "20",
                BookingDetails: `
                  Pickup: ${bookingDetails?.pickupPoint ?? ""}, ${bookingDetails?.pickupCity ?? ""}<br/>
                   Drop:  ${bookingDetails?.dropPoint ?? ""}<br/>
                `,
                // DriverDetails: `
                //   Driver: ${driver?.driverName ?? ""}<br/>
                //   Driver_Phno: ${driver?.phno ?? ""}<br/>
                //   Vehicle: ${vehicle?.vehicleName ?? ""}
                // `,

                WEB_SITE_NAME: "www.gracecabs.com",
        WEB_SITE_EMAIL: "traveldesk@gracecabs.com",
        CONTACT_NO: "+91 98417 22675",
        
              });
            }  
       
           }
              
            catch (error: any) {
            console.error('email send error:', error);
            // res.status(500).json({
            //   success: false,
            //   message: 'Error email error',
            //   error: error.message
            // });
          } } else {
  console.log(" Company has disabled email notifications.");
}


    return res.status(200).json({
      message: 'Booking confirmed successfully',
      updateConfirm
    });
  } catch (err) {
    console.error('Update Confirm Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
export const paymentCompletedOrderCount = async (req: any, res: Response) => {
  try {
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { paymentNo, startDate, endDate } = req.query;

    // ✅ Payment filter (PAYMENTCOMPLETED only)
    const paymentWhere: any = {
      status: ORDER.STATUS.PAYMENTCOMPLETED,
    };

    // ✅ paymentNo -> transactionId OR paymentMode
    if (paymentNo) {
      paymentWhere[Op.or] = [
        { transactionId: { [Op.like]: `%${paymentNo}%` } },
        { paymentMode: { [Op.like]: `%${paymentNo}%` } },
      ];
    }

    // ✅ Date range filter (on Payment.createdAt)
    if (startDate && endDate) {
      const from = new Date(startDate);
      const to = new Date(endDate);
      to.setHours(23, 59, 59, 999); // include full end day

      paymentWhere.createdAt = {
        [Op.between]: [from, to],
      };
    }

    /**
     * ✅ MAIN LOGIC:
     * ClosePending -> Invoice (invoiceId present) -> Payment (invoice.paymentId) -> Booking
     *
     * NOTE:
     * - Make sure Invoice model has FK: closependingId
     * - And Invoice belongsTo Payment with FK: paymentId
     * - ClosePending has HasMany Invoice (you already have it)
     */

    const closePendings = await ClosePending.findAll({
      // optional: you can add ClosePending level filters here if needed
      include: [
        {
          model: Invoice,
          as: "invoice", // ⚠️ If your alias is "invoices" or something else, change here
          required: true, // must have invoice
          attributes: [
            "invoiceId",
            "invoiceNumber",
            "invoiceAmount",
            "invoiceStatus",
            "paymentId",
            "bookingId",
          ],
          include: [
            {
              model: Payment,
              as: "payment", // ⚠️ If your alias is different in Invoice.belongsTo(Payment), change here
              required: true, // ✅ forces only PAYMENTCOMPLETED
              where: paymentWhere,
              attributes: [
                "paymentId",
                "transactionId",
                "paymentMode",
                "amount",
                "tax",
                "status",
                "isOnline",
                "createdAt",
              ],
            },
            {
              model: Booking,
              required: false,
              attributes: [
                "bookingId",
                "bookingCode",
                "confirmStatus",
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ✅ count: how many closepending rows matched
    return res.status(200).json({
      success: true,
      message: "Payment Completed Order Details (ClosePending -> Invoice -> Payment)",
      count: closePendings.length,
      data: closePendings,
    });
  } catch (err) {
    console.error("Fetch Payment Completed Orders Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const getCompletedList = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { paymentNo, companyId, startDate, endDate, search } = req.query;

    // Booking base filter (date range & simple search)
    const bookingWhere: any = {};
    if (startDate && endDate) {
      bookingWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (search) {
      bookingWhere[Op.or] = [
        { bookingCode: { [Op.like]: `%${search}%` } },
        { pickupPoint: { [Op.like]: `%${search}%` } },
      ];
    }

    // Company where must be applied on nested include (User -> Company)
    const companyWhere = companyId ? { companyId } : undefined;

    // Load bookings with related payment/invoice/user/company (no required: true so we don't drop rows prematurely)
    const bookings = await Booking.findAll({
      where: bookingWhere,
      include: [
        {
          model: Payment,
          as: "payment", // Booking -> Payment (may be null)
          required: false,
          attributes: ["paymentId", "transactionId", "paymentMode", "amount", "status", "isOnline", "createdAt"],
        },
        {
          model: Invoice,
          as: "invoice", // Booking -> Invoice (HasMany)
          required: false,
          attributes: ["invoiceId", "invoiceNumber", "invoiceAmount", "invoiceStatus", "createdAt"],
          include: [
            {
              model: Payment,
              as: "payment", // invoice -> payment (may be null)
              required: false,
              attributes: ["paymentId", "transactionId", "paymentMode", "amount", "status", "isOnline", "createdAt"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["userId", "username", "email", "mobile"],
          include: [
            {
              model: Company,
              attributes: ["companyId", "companyName"],
              where: companyWhere,
              required: companyWhere ? true : false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Helper to detect completed payment for a booking
    const isBookingCompleted = (b: any): boolean => {
      // 1) booking-level flags
      if (b.bookingStatus && String(b.bookingStatus) === String(ORDER.STATUS.PAYMENTCOMPLETED)) return true;
      if (b.confirmStatus && String(b.confirmStatus) === String(ORDER.STATUS.PAYMENTCOMPLETED)) return true;

      // 2) booking.payment
      if (b.payment && String(b.payment.status) === String(ORDER.STATUS.PAYMENTCOMPLETED)) return true;

      // 3) any invoice -> invoice.invoiceStatus or invoice.payment.status
      if (Array.isArray(b.invoice)) {
        for (const inv of b.invoice) {
          if (inv.invoiceStatus && String(inv.invoiceStatus) === String(ORDER.STATUS.PAYMENTCOMPLETED)) return true;
          if (inv.payment && String(inv.payment.status) === String(ORDER.STATUS.PAYMENTCOMPLETED)) return true;
        }
      }

      return false;
    };

    // Filter bookings based on completion and optional paymentNo
    const filtered = bookings.filter((b: any) => {
      // must be completed by any of the checks above
      if (!isBookingCompleted(b)) return false;

      // if paymentNo provided, ensure booking.payment or any invoice.payment transactionId matches
      if (paymentNo) {
        const txn = (b.payment && b.payment.transactionId) || "";
        if (txn && String(txn).includes(String(paymentNo))) return true;

        if (Array.isArray(b.invoice)) {
          for (const inv of b.invoice) {
            const invTxn = inv.payment?.transactionId;
            if (invTxn && String(invTxn).includes(String(paymentNo))) return true;
          }
        }
        // not matched
        return false;
      }

      // passed all checks
      return true;
    });

    // Map to response shape (use first invoice if any)
    const data = filtered.map((b: any) => {
      const pay = b.payment;
      const invoice = (b.invoice && b.invoice[0]) || null;
      const user = b.user;
      const company = user?.company;

      return {
        bookingId: b.bookingId,
        transactionId: pay?.transactionId || (invoice?.payment?.transactionId ?? null),
        paymentId: pay?.paymentId || (invoice?.payment?.paymentId ?? null),
        paymentMode: pay?.paymentMode || (invoice?.payment?.paymentMode ?? null),
        paymentStatus: pay?.status || (invoice?.payment?.status ?? null),
        totalAmount: pay?.amount || invoice?.invoiceAmount || null,
        isOnline: pay?.isOnline ?? invoice?.payment?.isOnline ?? null,
        paymentDate: pay?.createdAt || invoice?.payment?.createdAt || null,

        invoiceId: invoice?.invoiceId || null,
        invoiceNumber: invoice?.invoiceNumber || null,
        invoiceAmount: invoice?.invoiceAmount || null,
        invoiceStatus: invoice?.invoiceStatus || null,

        bookingIdRef: b.bookingId,
        orderNumber: b.bookingCode || null,
        pickupDate: b.bookingDate || null,
        pickupPoint: b.pickupPoint || null,
        purpose: b.purpose || null,
        orderDate: b.createdAt || null,

        userId: user?.userId || null,
        userName: user?.username || null,
        userEmail: user?.email || null,
        userMobile: user?.mobile || null,
        companyId: company?.companyId || null,
        companyName: company?.companyName || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Completed payment order details fetched successfully (from Booking)",
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("❌ getCompletedListFromBooking error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

async function sendEmailForDanManagerFromMob(booking: any, managerEmail?: string, managerName?: string,   formattedPickupDate?: string ) {
  try {
    console.log("manager ",managerName, " ",managerEmail);
    if (!managerEmail) return;

    const emailConfigs = await fetchAllEmailConfs();
    const emailcode = "MANAGER_ALERT";

    const template = emailConfigs.find((conf: any) => conf.emailCode === emailcode);
     console.log("templ ",template);
    if (!template) {
      console.log(`Email template with code ${emailcode} not found.`);
      return;
    }
    console.log(template);
    // generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // save token in DB
    const book = await Booking.update(
      { managerApprovalToken: token },
      { where: { bookingId: booking.bookingId } }
    );
    console.log("booking status ",book);

    // links
    const approveLink =
      `https://gracecabs.com/api/emp/cnfrmBookingByManagerEmail?bookingId=${booking.bookingId}&token=${token}`;

    const rejectLink =
      `https://gracecabs.com/api/emp/rejectBookingByManagerEmail?bookingId=${booking.bookingId}&token=${token}`;

    //const formattedPickupDate = moment(booking.bookingDate).tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A");
        const bookingUser = await User.findByPk(booking.userId);

      // email send
    await sendEmailFromTemplate(template.emailCode, {
       UserName: managerName || "Manager",
        UserEmail: managerEmail,
      BookingNumber: booking.bookingCode,

      BookingDetails: `
        UserName: ${bookingUser?.username},
        UserEmail: ${bookingUser?.email},
        UserMobile: ${bookingUser?.mobile},
        Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
        Drop: ${booking.dropPoint}<br/>
        Pickup Date: ${formattedPickupDate}<br/>
        Reason: ${booking.notes}<br/>
        <div style="margin-top:15px;">
        <a href="${approveLink}" 
         onclick="this.style.pointerEvents='none';this.style.opacity='0.6';"
           style="background:#28a745;color:#fff;padding:10px 18px;
           text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
           Approve
        </a>

        &nbsp;&nbsp;

        <a href="${rejectLink}" 
         onclick="this.style.pointerEvents='none';this.style.opacity='0.6';"
           style="background:#dc3545;color:#fff;padding:10px 18px;
           text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
           Reject
        </a></div>
        <br/>
      ` ,Alert: `Bookings are automatically approved after 20 minutes.`,
    });

  } catch (err: any) {
    console.error("Manager email error:", err.message);
  }
}

async function sendEmailForDanManager(booking: any, managerEmail?: string, managerName?: string, token?: string) {
  try {
    console.log("manager ",managerName, " ",managerEmail);
    if (!managerEmail) return;

    const emailConfigs = await fetchAllEmailConfs();
    const emailcode = "MANAGER_ALERT";

    const template = emailConfigs.find((conf: any) => conf.emailCode === emailcode);
     console.log("templ ",template);
    if (!template) {
      console.log(`Email template with code ${emailcode} not found.`);
      return;
    }
    console.log(template);
    // generate secure token
    // const token = crypto.randomBytes(32).toString("hex");

    // // save token in DB
    // const book = await Booking.update(
    //   { managerApprovalToken: token },
    //   { where: { bookingId: booking.bookingId } }
    // );
    console.log("booking status ");

    // links
    const approveLink =
      `https://gracecabs.com/api/emp/cnfrmBookingByManagerEmail?bookingId=${booking.bookingId}&token=${token}`;

    const rejectLink =
      `https://gracecabs.com/api/emp/rejectBookingByManagerEmail?bookingId=${booking.bookingId}&token=${token}`;

    const formattedPickupDate = moment(booking.bookingDate).tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A");
        const bookingUser = await User.findByPk(booking.userId);

      // email send
    await sendEmailFromTemplate(template.emailCode, {
       UserName: managerName || "Manager",
        UserEmail: managerEmail,
      BookingNumber: booking.bookingCode,

      BookingDetails: `
        UserName: ${bookingUser?.username},
        UserEmail: ${bookingUser?.email},
        UserMobile: ${bookingUser?.mobile},
        Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
        Drop: ${booking.dropPoint}<br/>
        Pickup Date: ${formattedPickupDate}<br/>
         Reason: ${booking.notes}<br/>
        <div style="margin-top:15px;">
        <a href="${approveLink}" 
         onclick="this.style.pointerEvents='none';this.style.opacity='0.6';"
           style="background:#28a745;color:#fff;padding:10px 18px;
           text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
           Approve
        </a>

        &nbsp;&nbsp;

        <a href="${rejectLink}" 
         onclick="this.style.pointerEvents='none';this.style.opacity='0.6';"
           style="background:#dc3545;color:#fff;padding:10px 18px;
           text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
           Reject
        </a></div><br/>`,
          Alert: `Bookings are automatically approved after 20 minutes.`,
    });

  } catch (err: any) {
    console.error("Manager email error:", err.message);
  }
}

async function sendSMSForDanManager(
  booking: any,
  managerMobile?: string,
  userPhone?: string
) {
  try {
     console.log("in manageremail ");
    if (!managerMobile) return;
    console.log("manageremail ",managerMobile);
       const bookingUser = await User.findByPk(booking.userId);
    console.log("user name in send sms ",bookingUser?.username);
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const senderId = process.env.TWO_FACTOR_SENDER_ID;

    if (!apiKey || !senderId) return;
let shortDropPoint = booking.dropPoint || "";
let shortPickup = booking.pickupArea || "";

// If length > 25, take only text before first comma
if (shortDropPoint.length > 27) {
  shortDropPoint = shortDropPoint.split(",")[0];
}

if (shortPickup.length > 27) {
  shortPickup = shortPickup.split(",")[0];
}
    const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${managerMobile}&from=${senderId}&templatename=${encodeURIComponent(
      "ManageAlert"
    )}&var1=${encodeURIComponent(booking.managerName || "Manager")}
&var2=${encodeURIComponent(booking.bookingCode)}
&var3=${encodeURIComponent(bookingUser?.username || "")}
&var4=${encodeURIComponent(userPhone || "")}
&var5=${encodeURIComponent(shortPickup)}
&var6=${encodeURIComponent(shortDropPoint)}`;

    const response = await fetch(smsUrl);
    const result = await response.json();

    console.log("Manager SMS sent:", result);

  } catch (err: any) {
    console.error("Manager SMS error:", err.message);
  }
}


export const cnfrmBookingByManagerEmail = async (req: any, res: Response) => {
  try {
    const { bookingId, token } = req.query;

    if (typeof token !== "string")
      return res.status(400).send(renderResponsePage("Invalid Link ❌", "Invalid link", "red"));

    const booking = await Booking.findOne({ where: { bookingId } });

    if (!booking)
      return res.status(404).send(renderResponsePage("Not Found ❌", "Booking not found", "red"));

    if (Number(booking.bookingStatus) === ORDER.STATUS.CANCELLED)
    return res.send(renderResponsePage("Rejected ❌", `This booking was already rejected.<br/>Booking Number: ${booking.bookingCode}`, "red"));

    console.log("bookkkkk ",booking.bookingStatus);
     if (Number(booking.bookingStatus) === 1) {
        return res.send(renderResponsePage("Already Approved ✔", `Booking already approved.<br/>Booking Number: ${booking.bookingCode}`, "green"));
    }

      if (!booking.managerApprovalToken)
      return res.send(renderResponsePage("⚠", "Manager already responsed.", "orange"));
    

    if (booking.managerApprovalToken !== token) {
      return res.send(renderResponsePage("Invalid ❌", "Invalid or expired link", "red"));
    }

    await booking.update({
      bookingStatus: ORDER.STATUS.CONFIRMED,
      managerApprovalToken: null
    });
    await sendBookingEmailToUser(booking, booking.userId);
const user = await User.findByPk(booking.userId);
await sendBookingSMSToUser(user);


    return res.send(renderResponsePage(
      `✔ Booking Approved.<br/>Booking Number: ${booking.bookingCode}`,
      "Booking approved successfully",
      "green"
    ));

} catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const rejectBookingByManager = async (req: any, res: Response) => {
  try {
    const { bookingId, token } = req.query;

    const booking = await Booking.findOne({ where: { bookingId } });

    if (!booking)
      return res.send(renderResponsePage("Not Found ❌", "Booking not found", "red"));
    
    if (Number(booking.bookingStatus) === 1) {
         return res.send(renderResponsePage("Already Approved ✔",  `Booking already approved.<br/>Booking Number: ${booking.bookingCode}`, "green"));
    }

    if (Number(booking.bookingStatus) === ORDER.STATUS.CANCELLED)
    return res.send(renderResponsePage("Rejected ❌", `This booking was already rejected..<br/>Booking Number: ${booking.bookingCode}`, "red"));


    if (!booking.managerApprovalToken)
       return res.send(renderResponsePage("⚠", "Manager already responsed.", "orange"));
    

    if (booking.managerApprovalToken !== token)
      return res.send(renderResponsePage("Invalid ❌", "Invalid or expired link", "red"));

    await booking.update({
      bookingStatus: ORDER.STATUS.CANCELLED,
      confirmStatus: ORDER.STATUS.CANCELLED,
      managerApprovalToken: null
    });

         
    try{
      const user =  await User.findByPk(booking.userId);

      console.log("user in cancel booking:  ",user);
      if(user?.mobile){
              const apiKey =  process.env.TWO_FACTOR_API_KEY;
        const senderId =  process.env.TWO_FACTOR_SENDER_ID;
        const templateName = "ManagerCancelBooking";
        if (!apiKey || !senderId) {
          console.error(" SMS API configuration missing in environment variables");
        } else {
           let shortDropPoint = booking.dropPoint || "";
          let shortPickup = booking.pickupArea || "";

          // If length > 25, take only text before first comma
          if (shortDropPoint.length > 27) {
            shortDropPoint = shortDropPoint.split(",")[0];
          }

          if (shortPickup.length > 27) {
            shortPickup = shortPickup.split(",")[0];
          }

          // Build SMS URL with parameters
          const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${user?.mobile}&from=${senderId}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(user?.username|| '',)}&var2=${encodeURIComponent(booking?.bookingCode || '',)}&var3=${encodeURIComponent(shortPickup || '',)}&var4=${encodeURIComponent(shortDropPoint || '',)}`;
 
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

    try {
       const bookingUser: any = await User.findByPk(booking.userId);
      const manager = await User.findByPk(booking.managerUserId);
    // 🔹 Format Date
    const formattedPickupDate = moment(booking.bookingDate)
      .tz("Asia/Kolkata")
      .format("DD/MM/YYYY hh:mm A");

  const emailcode = "ManagerCancelBooking";
    const emailConfigs = await fetchAllEmailConfs();
      
    const template = emailConfigs.find((conf: any) => conf.emailCode === emailcode);
     console.log("templ ",template, bookingUser.email);
  
     if (!template) {
        console.log("Email template not found");
      } else {
    await sendEmailFromTemplate(template.emailCode, {
       UserName:  bookingUser?.username || "",
        UserEmail: bookingUser?.email || "",
      BookingNumber: booking.bookingCode,

      BookingDetails: `

        Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
        Drop: ${booking.dropPoint}<br/>
        Pickup Date: ${formattedPickupDate}<br/>
      `,
      ManagerDetails: `
        ManagerEmail: ${booking.managerEmail}<br/>
      `
    });  
  }
    } catch(err) {
      console.error("Notification send error:", err);
    }

        return res.send(renderResponsePage(
      "✖ Booking Rejected",
      `This booking has been rejected by manager.<br/>Booking Number: ${booking.bookingCode}`,
      "red"
    ));

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

const renderResponsePage = (title: string, message: string, color: string) => {
  return `
  <html>
  <head>
  <title>${title}</title>

  </head>

  <body style="font-family:sans-serif;text-align:center;margin-top:80px;background:#f5f5f5;">
    <div style="background:white;padding:30px;border-radius:10px;width:350px;margin:auto;box-shadow:0 0 10px rgba(0,0,0,0.2);">
      <h2 style="color:${color}">${title}</h2>
      <p>${message}</p>

      <button onclick="window.close()" 
      style="padding:10px 20px;background:${color};color:white;border:none;border-radius:6px;cursor:pointer;">
      Close
      </button>
    </div>
  </body>

  </html>
  `;
};

async function autoApproveIfNoAction(bookingId: string) {
  setTimeout(async () => {
    try {
      const booking = await Booking.findByPk(bookingId);

      if (!booking) return;

      // if manager already acted → stop
      if (!booking.managerApprovalToken) return;

      // if still pending → auto approve
    
if (Number(booking.bookingStatus) === STATUS.PENDING) {
  await booking.update({
    bookingStatus: STATUS.CONFIRMED,
    autoApproveStatus: STATUS.CONFIRMED,
    managerApprovalToken: null
  });
    const user = await User.findByPk(booking.userId);
   await sendBookingEmailToUserAuto(booking, booking.userId);
    await sendBookingSMSToUser(user);

        console.log("Auto approved booking:", booking.bookingCode);
  } 
        const emailConfigs = await fetchAllEmailConfs();
        const bookingUser = await User.findByPk(booking.userId);
        const bookingDateTime = new Date(booking.bookingDate);
          const formattedBookingDate = formatDateTime(bookingDateTime);
 const orderConfirmConf = emailConfigs.find(
      (conf: any) => conf.emailCode === "BOOKING_AUTOAPPROVE_EMAIL_TO_MANAGER"
    );

    if (!orderConfirmConf) return;

    await sendEmailFromTemplate(orderConfirmConf.emailCode, {
       UserName: "Manager",
        UserEmail: booking.managerEmail,
      OrderNumber: booking.bookingCode,

      BookingDetails: `
        UserName: ${bookingUser?.username},
        UserEmail: ${bookingUser?.email},
        UserMobile: ${bookingUser?.mobile},
        Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
        Drop: ${booking.dropPoint}<br/>
        Pickup Date: ${formattedBookingDate}<br/>
         Reason: ${booking.notes}<br/>
        <br/>
      `,
    });

    } catch (err) {
      console.error("Auto approval error:", err);
    }
  }, 20 * 60 * 1000); // 20 minutes
}

async function sendBookingEmailToUser(booking: any, userId: string) {
  try {
    const user = await User.findByPk(userId);
    if (!user?.email) return;

    const bookingDateTime = new Date(booking.bookingDate);
    const formattedBookingDate = formatDateTime(bookingDateTime);
    const cabAssignedMinutes = "20";

    const emailConfigs = await fetchAllEmailConfs();
    const orderConfirmConf = emailConfigs.find(
      (conf: any) => conf.emailCode === "ORDER_BOOKING_EMAIL_TO_CLIENT"
    );

    if (!orderConfirmConf) return;

    await sendEmailFromTemplate(orderConfirmConf.emailCode, {
      UserName: user.username || "",
      UserEmail: user.email,
      OrderNumber: booking.bookingCode,
      BookingDetails: `
        Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
        Drop: ${booking.dropPoint}<br/>
        Pickup Date: ${formattedBookingDate}<br/>
      `,
      CabAssignedMinutes: cabAssignedMinutes,
    });

    console.log("User booking email sent");
  } catch (err) {
    console.error("User email send error:", err);
  }
}


async function sendBookingEmailToUserAuto(booking: any, userId: string) {
  try {
    const user = await User.findByPk(userId);
    if (!user?.email) return;

    const bookingDateTime = new Date(booking.bookingDate);
    const formattedBookingDate = formatDateTime(bookingDateTime);
    const cabAssignedMinutes = "20";

    const emailConfigs = await fetchAllEmailConfs();
    const orderConfirmConf = emailConfigs.find(
      (conf: any) => conf.emailCode === "BOOKING_AUTOAPPROVE_EMAIL_TO_CLIENT"
    );

    if (!orderConfirmConf) return;

    await sendEmailFromTemplate(orderConfirmConf.emailCode, {
      UserName: user.username || "",
      UserEmail: user.email,
      OrderNumber: booking.bookingCode,
      BookingDetails: `
        Pickup: ${booking.pickupArea}, ${booking.pickupCity}<br/>
        Drop: ${booking.dropPoint}<br/>
        Pickup Date: ${formattedBookingDate}<br/>
      `,
      CabAssignedMinutes: cabAssignedMinutes,
    });

    console.log("User booking email sent");
  } catch (err) {
    console.error("User email send error:", err);
  }
}

async function sendBookingSMSToUser(user: any) {
  try {
    if (!user?.mobile) {
      console.log("User mobile number not found");
      return;
    }

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const senderId = process.env.TWO_FACTOR_SENDER_ID;
    const templateName = "Booking Creation";

    if (!apiKey || !senderId) {
      throw new Error("SMS API configuration missing");
    }

    const smsUrl =
      `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}` +
      `&to=${user.mobile}` +
      `&from=${senderId}` +
      `&templatename=${encodeURIComponent(templateName)}` +
      `&var1=${encodeURIComponent(user.username)}`;

    const smsResponse = await fetch(smsUrl);

    if (!smsResponse.ok) {
      throw new Error(`SMS API request failed: ${smsResponse.status}`);
    }

    const result = await smsResponse.json();
    console.log("SMS sent successfully:", result);

  } catch (err: any) {
    console.error("SMS send error:", err.message);
  }
}