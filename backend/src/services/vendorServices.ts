import { Request, Response } from 'express';
import { Vendor } from '../models/vendor';
import { Vehicle } from '../models/vehicle';
import { Drivers } from '../models/drivers';
import { Booking } from '../models/booking';
import { Company } from '../models/company';
import { Employee } from '../models/employee';
import { USERS } from "../utils/costants";
import { VehicleType } from '../models/vehicleType';
import { VehicleMaster } from '../models/vehicleMaster';
const { ROLES } = USERS;
import { ORDER } from '../utils/costants';
import { sendNotification } from "../utils/sendNotification";
// import { sendWhatsAppMessage } from '../utils/whatsapp';
// import { sendWhatsAppMessageTwilio } from '../utils/whatsapp';
// import { sendWhatsAppMessageMeta } from '../utils/whatsapp';
import { sendEmailFromTemplate, fetchAllEmailConfs } from "../services/emailConfServices";
import { User } from "../models/user";
import { formatDateTime,formatToIST } from '../utils/formatDateTime';
import { sendSmsNotifications } from '../utils/smsNotifications';
import moment from "moment-timezone";

export const confirmBooking = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId, driverId, vehicleId, vehicleMasterId } = req.body;
    const bookingData = await Booking.findByPk(bookingId);
    if (!bookingData) {
  return res.status(404).json({ message: "Booking not found" });
}
  
const userData = await User.findOne({ where: { userId: bookingData?.userId } });
 
const company = await Company.findOne({ where:  { companyId: userData?.companyId } });
   
       const whereCondition: any = { bookingId };
    
      if (company?.managerApproval) {
      
         whereCondition.confirmStatus= ORDER.STATUS.PENDING;
          whereCondition.bookingStatus= ORDER.STATUS.CONFIRMED;
      } else if(!company?.managerApproval) {
       
          whereCondition.confirmStatus= ORDER.STATUS.PENDING;
          whereCondition.bookingStatus= ORDER.STATUS.PENDING;
      }
    
    // 🔹 Update Booking Status
    const updateConfirm = await Booking.update(
      {
        confirmStatus: ORDER.STATUS.CONFIRMED,
        bookingStatus: ORDER.STATUS.CONFIRMED,
        driverId,
        vehicleId,
        vehicleMasterId
      },
      {
          where: whereCondition,
      }
    );

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    // 🔹 Fetch booking with relations for email
    const booking = await Booking.findByPk(bookingId);
    const user = booking ? await User.findByPk(booking.userId) : null;
    const driver = await Drivers.findByPk(driverId);
   // const vehicle = await Vehicle.findByPk(vehicleId);
    const vehicle = await Vehicle.findByPk(vehicleId, {
  include: [{ model: VehicleMaster, as: "vehicleMaster", required: false }],
});
    //push notification
    try {
      const driverToken = await Drivers.findOne({
        where: { driverId },
      });
    
      const fcm_token = driverToken?.fcm_token;
      const user_fcm_token = user?.fcm_token;
      console.log("driver confirm booking ",fcm_token);
      if (!fcm_token) {
        console.log("No FCM token found for driver:", driverId);
       // return;
      }
      if(!user_fcm_token) {
        console.log("No FCM token found for driver:", driverId);
       // return;
      }
    
      await sendNotification(fcm_token, `Hi ${driverToken?.driverName}, Booking assigned, pls check..`, `Booking assigned for ${driverToken?.driverName}`);
      await sendNotification(user_fcm_token, `Hi ${user?.username}, Booking confirmed, pls check..`, `Booking confirmed for ${user?.username}`);
      
    } catch (error: any) {
      console.error("Notification send error:", error);
    }

    // let formattedBookingDate = "";
    // if (booking?.bookingDate && booking?.bookingTime) {
    //   const bookingDateTime = new Date(`${booking.bookingDate}T${booking.bookingTime}`);
    //   formattedBookingDate = formatDateTime(bookingDateTime);
    // } else if (booking?.bookingDate) {
    //   formattedBookingDate = formatDateTime(new Date(booking.bookingDate));
    // }

  const formattedBookingDate = formatToIST(booking?.bookingDate, booking?.bookingTime);
  console.log("Formatted:", formattedBookingDate);

    // Parse booking pickup datetime (prefer booking.bookingDate which usually has offset)
    let pickupMoment: moment.Moment | null = null;
    try {
      if (booking?.bookingDate) {
        // preserves any provided offset like "+05:30"
        pickupMoment = moment.parseZone(booking.bookingDate);
      } else if (booking?.bookingDate && booking?.bookingTime) {
        // fallback if date and time stored separately
        pickupMoment = moment.tz(
          `${booking.bookingDate} ${booking.bookingTime}`,
          "YYYY-MM-DD HH:mm:ss",
          "Asia/Kolkata"
        );
      }
    } catch (e) {
      console.log("pickupMoment parse error:", e);
      pickupMoment = null;
    }

    const now = moment();
    const shouldSendSms =
      !!(pickupMoment && pickupMoment.isValid() && pickupMoment.isAfter(now));

    if (!pickupMoment || !pickupMoment?.isValid()) {
      console.log("Could not parse pickup datetime; SMS will be skipped to avoid wrong notifications.");
    }
    console.log(
      "pickupMoment:",
      pickupMoment ? pickupMoment.toISOString() : "n/a",
      "shouldSendSms:",
      shouldSendSms
    );
      console.log("need email.",booking?.user?.company?.needEmail);
      
       let needEmail = false;
      
          if (user?.companyId) {
            const company = await Company.findByPk(
              user.companyId,
              { attributes: ["needEmail"] }
            );
            needEmail = company?.needEmail === true;
          }
   if(needEmail && shouldSendSms === true)
          {
            console.log(" Company has enabled email notifications.");
    // 🔹 Get email templates dynamically
    const emailConfigs = await fetchAllEmailConfs();
    const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_CONFIRMATION_NOTIF");
    const driverConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_CONFIRMATION_DRIVER");
    
    // ✅ Fetch exact selected vehicleMaster (BEST)
    const vehicleMaster = await VehicleMaster.findByPk(vehicleMasterId, {
      include: [{ model: Vehicle, as: "vehicle", required: false, attributes: ["vehicleId", "vehicleName"] }],
    });

    const vehicleName = vehicleMaster?.vehicle?.vehicleName ?? "";
    const vehicleNumber = vehicleMaster?.vehicleNumber ?? "";
    //const vehicleModelName = vehicleMaster?.vehicleModelName ?? "";
    console.log("vehic num ",booking?.vehicle?.vehicleMaster?.vehicleNumber);
    try {

    console.log("driverdetails email send ",driver?.phno);
    // 🔹 Send email to USER
    if (user?.email && orderConfirmConf) {
      await sendEmailFromTemplate(orderConfirmConf.emailCode, {
        UserName: user?.username ?? "",
        UserEmail: user?.email ?? "",
        OrderNumber: booking?.bookingCode ?? "",
        BookingDetails: `
          Pickup: ${booking?.pickupArea ?? ""}, ${booking?.pickupCity ?? ""}<br/>
          Drop:  ${booking?.dropPoint ?? ""}<br/>
          Date: ${formattedBookingDate}
        `,
        DriverDetails: `
          Driver: ${driver?.driverName ?? ""}<br/>
          Driver_Phno: ${driver?.phno ?? ""}<br/>
        Vehicle: ${vehicleName ?? ""}</br/>
        Vehicle Number: ${vehicleNumber ?? ""}<br/>
        `,
        WEB_SITE_NAME: "www.gracecabs.com",
        WEB_SITE_EMAIL: "traveledesk@gracecabs.com",
        CONTACT_NO: "+91 98417 22675",

      });
    }

    const driverEmail = driver?.driverEmail;

   if (driverEmail && driverConfirmConf) {
  await sendEmailFromTemplate(driverConfirmConf.emailCode, {
    to: driverEmail,  
    DriverName: driver?.driverName ?? "",
    OrderNumber: booking?.bookingCode ?? "",
    BookingDetails: `
      Pickup: ${booking?.pickupArea ?? ""}, ${booking?.pickupCity ?? ""}<br/>
      Drop: ${booking?.dropPoint ?? ""}<br/>
      BookingDate: ${formattedBookingDate}
    `,
    UserDetails: `
      Customer: ${user?.username ?? ""}<br/>
      Moblie:  ${user?.mobile ?? ""}<br/>
      Email: ${user?.email ?? ""}<br/>
    `
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
  }
} else {
  console.log(" Company has disabled email notifications.");
}

// SMS services when booking confirmed - centralized helper
    try {
      await sendSmsNotifications({ booking, user, driver, vehicle, formattedBookingDate, shouldSendSms });
    } catch (smsErr: any) {
      console.error('SMS send error:', smsErr);
      return res.status(500).json({ error: 'Internal server error' });
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

export const confirmBookingforWeb = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const loggedUser = req.userId;

    const { bookingId, driverId, vehicleId, vehicleMasterId } = req.body;

    if (!bookingId || !driverId || !vehicleId || !vehicleMasterId) {
      return res.status(400).json({
        message: "bookingId, driverId, vehicleId, vehicleMasterId are required",
      });
    }

    const bookingData = await Booking.findByPk(bookingId);
    if (!bookingData) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Auth
    const empData = await Employee.findOne({ where: { employeeId: loggedUser } });
    if (empData?.role !== ROLES.SUPERADMIN) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const whereCondition: any = { bookingId };
    whereCondition.confirmStatus = ORDER.STATUS.PENDING;
    //whereCondition.bookingStatus = ORDER.STATUS.PENDING;

    // ✅ Update Booking Status + store vehicleMasterId
    const updateConfirm = await Booking.update(
      {
        confirmStatus: ORDER.STATUS.CONFIRMED,
        bookingStatus: ORDER.STATUS.CONFIRMED,
        driverId,
        vehicleId,
        vehicleMasterId, // ✅ STORE HERE
      },
      { where: whereCondition }
    );

    if (updateConfirm[0] === 0) {
      return res.status(200).json({ message: "No matching bookings found to update" });
    }

    // 🔹 Fetch booking for notifications
    const booking = await Booking.findByPk(bookingId);
    const user = booking ? await User.findByPk(booking.userId) : null;
    const driver = await Drivers.findByPk(driverId);

    // ✅ Fetch exact selected vehicleMaster (BEST)
    const vehicleMaster = await VehicleMaster.findByPk(vehicleMasterId, {
      include: [{ model: Vehicle, as: "vehicle", required: false, attributes: ["vehicleId", "vehicleName"] }],
    });

    const vehicleName = vehicleMaster?.vehicle?.vehicleName ?? "";
    const vehicleNumber = vehicleMaster?.vehicleNumber ?? "";
    const vehicleModelName = vehicleMaster?.vehicleModelName ?? "";

    const formattedBookingDate = formatToIST(booking?.bookingDate, booking?.bookingTime);

    // Parse pickupMoment
    let pickupMoment: moment.Moment | null = null;
    try {
      if (booking?.bookingDate && booking?.bookingTime) {
        const dateOnly = moment(booking.bookingDate).format("YYYY-MM-DD");
        const combined = `${dateOnly} ${booking.bookingTime}`;
        pickupMoment = moment.tz(combined, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata");
      }
    } catch (err) {
      console.log("pickupMoment parse error:", err);
      pickupMoment = null;
    }

    const now = moment().tz("Asia/Kolkata");
    const shouldSendSms = !!pickupMoment && pickupMoment.isValid() && pickupMoment.isAfter(now);

    // Company needEmail
    let needEmail = false;
    if (user?.companyId) {
      const company = await Company.findByPk(user.companyId, { attributes: ["needEmail"] });
      needEmail = company?.needEmail === true;
    }

    // ✅ EMAIL
    if (needEmail && shouldSendSms === true) {
      const emailConfigs = await fetchAllEmailConfs();
      const orderConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_CONFIRMATION_NOTIF");
      const driverConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_CONFIRMATION_DRIVER");

      try {
        // User email
        if (user?.email && orderConfirmConf) {
          await sendEmailFromTemplate(orderConfirmConf.emailCode, {
            UserName: user?.username ?? "",
            UserEmail: user?.email ?? "",
            OrderNumber: booking?.bookingCode ?? "",
            BookingDetails: `
              Pickup: ${booking?.pickupArea ?? ""}, ${booking?.pickupCity ?? ""}<br/>
              Drop:  ${booking?.dropPoint ?? ""}<br/>
              Pickup Date: ${formattedBookingDate}
            `,
            DriverDetails: `
              Driver: ${driver?.driverName ?? ""}<br/>
              Driver_Phno: ${driver?.phno ?? ""}<br/>
              Vehicle: ${vehicleName}<br/>
              Vehicle No: ${vehicleNumber}<br/>
            `,
            GraceDetails: `
              WEB_SITE_NAME: "www.gracecabs.com" <br/>
              WEB_SITE_EMAIL: "traveldesk@gracecabs.com" <br/>
              CONTACT_NO: "+91 98417 22675"<br/>
            `,
          });
        }

        // Driver email
        const driverEmail = driver?.driverEmail;
        if (driverEmail && driverConfirmConf) {
          await sendEmailFromTemplate(driverConfirmConf.emailCode, {
            to: driverEmail,
            DriverName: driver?.driverName ?? "",
            OrderNumber: booking?.bookingCode ?? "",
            BookingDetails: `
              Pickup: ${booking?.pickupArea ?? ""}, ${booking?.pickupCity ?? ""}<br/>
              Drop: ${booking?.dropPoint ?? ""}<br/>
              BookingDate: ${formattedBookingDate}
            `,
            UserDetails: `
              Customer: ${user?.username ?? ""}<br/>
              Moblie:  ${user?.mobile ?? ""}<br/>
              Email: ${user?.email ?? ""}<br/>
            `,
            VehicleDetails: `
              Vehicle: ${vehicleName}<br/>
              Vehicle No: ${vehicleNumber}<br/>
              Model: ${vehicleModelName}<br/>
            `,
          });
        }
      } catch (emailErr: any) {
        console.error("email send error:", emailErr);
      }
    } else {
      console.log("Company has disabled email OR shouldSendSms false");
    }

    // ✅ SMS (centralized)
    try {
      await sendSmsNotifications({
        booking,
        user,
        driver,
        vehicle: {
          vehicleName,
          vehicleNumber,
          vehicleModelName,
          vehicleMasterId,
          vehicleId,
        },
        formattedBookingDate,
        shouldSendSms,
      });
    } catch (smsErr: any) {
      console.error("SMS send error:", smsErr);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(200).json({
      message: "Booking confirmed successfully",
      updateConfirm,
      stored: { vehicleId, vehicleMasterId }, // ✅ for quick verify
    });
  } catch (err) {
    console.error("Update Confirm Status Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



// Get All Vendors (Simple list without associations)
export const getAllVendors = async (req: any, res: Response) => {
  try {
    const role = req.role;
 
      const { status } = req.query
      let vendors;

      if (status === '1') {
        vendors = await Vendor.unscoped().findAll({
        where: { isDeleted: true },
        order: [["createdAt", "DESC"]],
        });
      }
      else {
        vendors = await Vendor.findAll({
        where: { isDeleted: false },
        order: [["createdAt", "DESC"]],
        });
      }
      res.status(200).json({ message: 'Vendors retrieved successfully', vendors });
      return;
  
  } catch (err) {
    res.status(500).json({ error: err });
  }
};



// Get Vendor by ID (Simple find)
export const getVendorById = async (req: any, res: Response) => {
  const { vendorId } = req.params;

  try {
    const role = req.role;
    if (role == ROLES.ADMIN) {
      const vendor = await Vendor.findByPk(vendorId, {
        include: [
          {
            model: Vehicle, required: false,
            as: 'vehicles' // Only include vehicles owned by vendor
          }
        ]
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      res.status(200).json({ message: 'Vendor retrieved successfully', vendor });
      return;
    } else {
      return res.status(403).json({ message: 'Not Authorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};


// Update Vendor
export const updateVendor = async (req: any, res: Response) => {
  const { vendorId } = req.params;
  const updateData = req.body;

  try {
    const role = req.role;
    if (role == ROLES.ADMIN) {
      const vendor = await Vendor.findByPk(vendorId);

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== vendor.email) {
        const existingVendor = await Vendor.findOne({ where: { email: updateData.email } });
        if (existingVendor) {
          return res.status(400).json({ message: 'Email already exists for another vendor' });
        }
      }

      await vendor.update(updateData);

      res.status(200).json({ message: 'Vendor updated successfully', vendor });
      return;
    } else {
      return res.status(403).json({ message: 'Not Authorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// Delete Vendor
export const deleteVendor = async (req: any, res: Response) => {
  const { vendorId } = req.params;

  try {
    const role = req.role;
    if (role == ROLES.ADMIN) {
      const vendor = await Vendor.unscoped().findByPk(vendorId);


      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Check if vendor has associated vehicles
      // const associatedVehicles = await Vehicle.findAll({ where: { vendorId } });
      // if (associatedVehicles.length > 0) {
      //   return res.status(400).json({
      //     message: 'Cannot delete vendor. Vendor has associated vehicles. Please reassign or delete vehicles first.'
      //   });
      // }

      await vendor.update({ isDeleted: true });

      res.status(200).json({ message: 'Owner deleted successfully' });
      return;
    } else {
      return res.status(403).json({ message: 'Not Authorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};



export const createDriver = async (req: any, res: Response) => {
  const { driverName, driverEmail, phno, password, city, state, country, address,
    licenseNo,licExpDate, pincode,  vehicleTypeId, trackingSource  } = req.body;
  try {
    const drole = req.role;
    if (drole === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }
    const role = ROLES.DRIVER;
    const existing = await Drivers.findOne({ where: { phno } });
    if (existing) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    const driver = await Drivers.create({
      driverName, driverEmail, phno, password, city, state, country, address,role: role,
      pincode, licenseNo, licExpDate, vehicleTypeId, trackingsource:trackingSource
    });

    const driverWithVehicle = await Drivers.findOne({
      where: { driverId: driver.driverId },
      include: [{
        model: Vehicle, required: false,
        include: [{ model: VehicleType, required: false, }]
      }]
    });

    res.status(201).json({
      message: "Registered successfully",
      driver: driverWithVehicle
    });

  } catch (err: any) {
    console.error('Validation Error Details:', err.errors || err);
    return res.status(400).json({ message: err.message, errors: err.errors });
  }
};

// export const createVehicleType = async (req: any, res: Response) => {
//   const { vehicleType, AdvanceBookingHours, seatCapacity, priorMinutes, bookingType } = req.body;

//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: "Not Authorized" });
//     }

//     // ✅ validate bookingType
//     const bt = String(bookingType || "").toLowerCase().trim();
//     if (!["regular", "monthly"].includes(bt)) {
//       return res.status(400).json({ message: "Invalid bookingType. Use regular or monthly." });
//     }

//     const existing = await VehicleType.findOne({ where: { vehicleType } });
//     if (existing) return res.status(400).json({ message: "Vehicle already registered" });

//     const vehiType = await VehicleType.create({
//       vehicleType,
//       AdvanceBookingHours,
//       seatCapacity: Number(seatCapacity),
//       priorMinutes: Number(priorMinutes ?? 0),
//       bookingType: bt, // ✅ NEW
//     });

//     return res.status(201).json({ message: "Vehicle type created successfully", vehiType });
//   } catch (err) {
//     return res.status(500).json({ error: err });
//   }
// };


// export const createVehicleType = async (req: any, res: Response) => {
//   const { vehicleType, AdvanceBookingHours, seatCapacity, priorMinutes } = req.body; // ✅ NEW
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const existing = await VehicleType.findOne({ where: { vehicleType } });
//     if (existing) return res.status(400).json({ message: 'Vehicle already registered' });

//     const vehiType = await VehicleType.create({
//       vehicleType,
//       AdvanceBookingHours,
//       seatCapacity,
//       priorMinutes: Number(priorMinutes ?? 0), // ✅ NEW (safe default)
//     });

//     res.status(201).json({ message: 'Vehicle type created successfully', vehiType });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

// export const createVehicleType = async (req: any, res: Response) => {
//   const { vehicleType, AdvanceBookingHours, seatCapacity } = req.body;
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const existing = await VehicleType.findOne({ where: { vehicleType } });
//     if (existing) return res.status(400).json({ message: 'Vehicle already registered' });

//     const vehiType = await VehicleType.create({ vehicleType, AdvanceBookingHours, seatCapacity });

//     res.status(201).json({ message: 'Vehicle type created successfully', vehiType });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };


export const createVehicleType = async (req: any, res: Response) => {
  const { vehicleType, seatCapacity, priorMinutes } = req.body; // ✅ NEW
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }
  const vehicleImg = req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : [];

    const existing = await VehicleType.findOne({ where: { vehicleType } });
    if (existing) return res.status(400).json({ message: 'Vehicle already registered' });

    const vehiType = await VehicleType.create({
      vehicleType,
      seatCapacity,vehicleImg,
      priorMinutes: Number(priorMinutes ?? 0), // ✅ NEW (safe default)
    });

    res.status(201).json({ message: 'Vehicle type created successfully', vehiType });
    return;

  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// export const createVehicleType = async (req: any, res: Response) => {
//   const { vehicleType, AdvanceBookingHours, seatCapacity } = req.body;
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const existing = await VehicleType.findOne({ where: { vehicleType } });
//     if (existing) return res.status(400).json({ message: 'Vehicle already registered' });

//     const vehiType = await VehicleType.create({ vehicleType, AdvanceBookingHours, seatCapacity });

//     res.status(201).json({ message: 'Vehicle type created successfully', vehiType });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

export const createVehicle = async (req: any, res: Response) => {
 const {
  vehicleName,
  vehicleTypeId,
  manufacturing,
  availableStatus
} = req.body;

  const vehicleImg = req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : [];

  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const existing = await Vehicle.findOne({ where: { vehicleTypeId, vehicleName } });
    if (existing) return res.status(400).json({ message: 'Vehicle already registered' });

    const vehicle = await Vehicle.create({
      vehicleName, vehicleTypeId, manufacturing, vehicleImg,
      availableStatus
    });

    res.status(201).json({ message: 'Registered successfully', vehicle });
    return;

  } catch (err) {
    res.status(500).json({ error: err });
  }
};




export const createVehicleMaster = async (req: any, res: Response) => {
  const { vehicleNumber, vehicleId, vendorId } = req.body;
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const existing = await VehicleMaster.findOne({ where: { vehicleNumber } });
    if (existing) {
      return res.status(400).json({ message: 'Vehicle already registered' });
    }

    // Fetch vehicle details + type name
    const vehicleData = await Vehicle.findByPk(vehicleId, {
      include: [{ model: VehicleType, required: false, attributes: ['vehicleType'] }]
    });

    if (!vehicleData) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Fetch owner details
    const vendorData = await Vendor.findByPk(vendorId);
    if (!vendorData) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    const vehicleMaster = await VehicleMaster.create({
      vehicleNumber,
      vehicleId,
      vendorId,
      vehicleModelName: vehicleData.vehicleName,
      vehicleTypeId: vehicleData.vehicleTypeId,
      vehicleType: vehicleData.vehicleType?.vehicleType || '',
      vendorName: vendorData.vendorName
    });

    res.status(201).json({ message: 'Registered successfully', vehicleMaster });
  } catch (err) {
    console.error("Error creating vehicle master:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
};


export const updateBookingVehicleDriver = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId, driverId, vehicleId, vehicleMasterId } = req.body;

    console.log("updateBookingVehicleDriver:", { bookingId, driverId, vehicleId, vehicleMasterId });

    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    if (!bookingId || !driverId || !vehicleId || !vehicleMasterId) {
      return res.status(400).json({
        message: "bookingId, driverId, vehicleId, vehicleMasterId are required",
      });
    }

    // ✅ Check VehicleMaster (selected one)
    const vm = await VehicleMaster.findByPk(vehicleMasterId);

    if (!vm) {
      return res.status(404).json({ message: "VehicleMaster not found" });
    }

    // ✅ optional safety: ensure vehicleId matches vehicleMaster.vehicleId
    if (vm.vehicleId !== vehicleId) {
      return res.status(400).json({
        message: "Selected vehicleId and vehicleMasterId mismatch",
      });
    }

    // ✅ Update booking (store both)
    const updateBooking = await Booking.update(
      {
        driverId,
        vehicleId,
        vehicleMasterId,
        preferredType: vm.vehicleType || null, // ✅ vehicleType from vehicleMaster
      },
      { where: { bookingId } }
    );
    console.log("con ",updateBooking);
    if (updateBooking[0] === 0) {
      return res.status(200).json({ message: "No booking updated" });
    }

    // ---- Pickup time logic (same as yours but fixed) ----
    const bookings = await Booking.findOne({ where: { bookingId } });

    let pickupMoment: moment.Moment | null = null;
    try {
      if (bookings?.bookingDate && bookings?.bookingTime) {
        const dateOnly = moment(bookings.bookingDate).format("YYYY-MM-DD");
        pickupMoment = moment.tz(
          `${dateOnly} ${bookings.bookingTime}`,
          "YYYY-MM-DD HH:mm:ss",
          "Asia/Kolkata"
        );
      } else if (bookings?.bookingDate) {
        pickupMoment = moment.parseZone(bookings.bookingDate as any);
      }
    } catch (e) {
      console.log("pickupMoment parse error:", e);
      pickupMoment = null;
    }

    const now = moment().tz("Asia/Kolkata");
    const shouldSendSms = !!(pickupMoment && pickupMoment.isValid() && pickupMoment.isAfter(now));

    console.log("pickupMoment:", pickupMoment ? pickupMoment.toISOString() : "n/a", "shouldSendSms:", shouldSendSms);

    // Fetch updated booking, user, driver
    const booking = await Booking.findByPk(bookingId);
    const user = booking ? await User.findByPk(booking.userId) : null;
    const driver = await Drivers.findByPk(driverId);

    // ✅ Vehicle details for SMS/Email should be from VehicleMaster -> Vehicle
    const vehicleMaster = await VehicleMaster.findByPk(vehicleMasterId, {
      include: [{ model: Vehicle, as: "vehicle", required: false }],
    });

    const vehicleName = vehicleMaster?.vehicle?.vehicleName ?? "";
    const vehicleNumber = vehicleMaster?.vehicleNumber ?? "";
    const vehicleModelName = vehicleMaster?.vehicleModelName ?? "";

    let formattedBookingDate = "";
    if (booking?.bookingDate && booking?.bookingTime) {
      const dateOnly = moment(booking.bookingDate).format("YYYY-MM-DD");
      formattedBookingDate = formatDateTime(new Date(`${dateOnly}T${booking.bookingTime}`));
    } else if (booking?.bookingDate) {
      formattedBookingDate = formatDateTime(new Date(booking.bookingDate));
    }

    // Email configs
    const emailConfigs = await fetchAllEmailConfs();
    const driverConfirmConf = emailConfigs.find((conf: any) => conf.emailCode === "ORDER_CONFIRMATION_DRIVER");

    try {
      if (driver?.driverEmail && driverConfirmConf) {
        await sendEmailFromTemplate(driverConfirmConf.emailCode, {
          to: driver.driverEmail,
          DriverName: driver?.driverName ?? "",
          OrderNumber: booking?.bookingCode ?? "",
          BookingDetails: `
            Pickup: ${booking?.pickupArea ?? ""}, ${booking?.pickupCity ?? ""}<br/>
            Drop: ${booking?.dropPoint ?? ""}<br/>
            BookingDate: ${formattedBookingDate}
          `,
          UserDetails: `
            Customer: ${user?.username ?? ""}<br/>
            Mobile: ${user?.mobile ?? ""}<br/>
            Email: ${user?.email ?? ""}<br/>
          `,
          VehicleDetails: `
            Vehicle: ${vehicleName}<br/>
            Vehicle No: ${vehicleNumber}<br/>
            Model: ${vehicleModelName}<br/>
          `,
        });
      }
    } catch (notifyErr) {
      console.error("Driver notification error:", notifyErr);
    }

    // ✅ SMS send
    try {
      await sendSmsNotifications({
        booking,
        user,
        driver,
        vehicle: {
          vehicleId,
          vehicleMasterId,
          vehicleName,
          vehicleNumber,
          vehicleModelName,
        },
        formattedBookingDate,
        shouldSendSms,
      });
    } catch (smsErr: any) {
      console.error("SMS send error:", smsErr);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(200).json({
      message: "Booking updated with new vehicle & driver. Notifications sent to driver.",
      updateBooking,
      stored: { vehicleId, vehicleMasterId },
    });
  } catch (err) {
    console.error("Update Vehicle/Driver Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
