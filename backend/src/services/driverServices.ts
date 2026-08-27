import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Drivers } from '../models';
import { Vehicle } from '../models/vehicle';
import { Booking } from '../models/booking';
import { VehicleType } from '../models/vehicleType';
import { VehicleMaster } from '../models/vehicleMaster';
import { User } from '../models/user';
import { DriverNotification } from '../models/driverNotification';
import { USERS, ORDER } from "../utils/costants";
import { Security } from '../utils/Security';
import { Op } from "sequelize";
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const { ROLES } = USERS;

// 0. Driver Self-Registration (/driver/register)
export const driverRegister = async (req: Request, res: Response) => {
  try {
    const {
      driverName,
      name,
      phno,
      mobile,
      phone,
      driverEmail,
      email,
      licenseNo,
      password,
      confirmPassword,
      city,
      state
    } = req.body;

    const fullName = String(driverName || name || '').trim();
    const rawPhone = String(phno || mobile || phone || '').trim();
    const userEmail = driverEmail || email ? String(driverEmail || email).trim().toLowerCase() : null;
    const userPass = String(password || '').trim();
    const confirmPass = String(confirmPassword || '').trim();

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!rawPhone) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '').trim();
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid mobile number (at least 10 digits).'
      });
    }

    if (!userPass) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    if (userPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPass && userPass !== confirmPass) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.'
      });
    }

    if (userEmail && !/^\S+@\S+\.\S+$/.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Check if phone or email already exists in Drivers table
    const whereOr: any[] = [{ phno: cleanPhone }];
    if (cleanPhone.length >= 10) {
      whereOr.push({ phno: { [Op.like]: `%${cleanPhone.slice(-10)}` } });
    }
    if (userEmail) {
      whereOr.push({ driverEmail: userEmail });
    }

    const existingDriver = await Drivers.unscoped().findOne({
      where: {
        [Op.or]: whereOr,
        isDeleted: false
      }
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: 'Driver account already exists. Please login.'
      });
    }

    // Clean or generate default license format
    let cleanLicense = licenseNo ? String(licenseNo).trim().toUpperCase() : null;
    if (cleanLicense) {
      const existingLicense = await Drivers.unscoped().findOne({
        where: { licenseNo: cleanLicense, isDeleted: false }
      });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'A driver with this license number already exists.'
        });
      }
    } else {
      cleanLicense = `DL-TN-${cleanPhone.slice(-6)}`;
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(userPass, 10);

    // Initial state must be OFFLINE and NOT available until first successful login!
    const newDriver = await Drivers.create({
      driverName: fullName,
      phno: cleanPhone,
      driverEmail: userEmail,
      password: hashedPassword,
      licenseNo: cleanLicense,
      role: 'driver',
      status: 'OFFLINE',
      isAvailable: false,
      isDeleted: false,
      city: city ? String(city).trim() : 'Chennai',
      state: state ? String(state).trim() : 'Tamil Nadu',
      country: 'India'
    });

    return res.status(201).json({
      success: true,
      message: 'Driver account registered successfully! Please log in to become available.',
      driver: {
        driverId: newDriver.driverId,
        driverName: newDriver.driverName,
        phno: newDriver.phno,
        driverEmail: newDriver.driverEmail,
        status: newDriver.status,
        isAvailable: newDriver.isAvailable
      }
    });
  } catch (err: any) {
    console.error('Driver Register Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register driver',
      error: err.message
    });
  }
};

// 1. Driver Login (Direct, Secure, Dynamic)
export const driverLogin = async (req: Request, res: Response) => {
  try {
    const { identifier, phone, email, phno, password } = req.body;
    const loginId = String(identifier || phone || phno || email || '').trim();
    const loginPass = String(password || '').trim();

    if (!loginId || !loginPass) {
      return res.status(400).json({

        success: false,
        message: 'Please provide mobile number / email and password.'
      });
    }

    const numericPhone = loginId.replace(/[^0-9]/g, '');

    const whereConditions: any[] = [
      { driverEmail: loginId },
      { phno: loginId }
    ];
    if (numericPhone.length >= 10) {
      whereConditions.push({ phno: { [Op.like]: `%${numericPhone.slice(-10)}` } });
    }

    const driver = await Drivers.unscoped().findOne({
      where: {
        [Op.or]: whereConditions,
        isDeleted: false
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          required: false,
          include: [{ model: VehicleMaster, as: 'vehicleMaster', required: false }]
        },
        { model: VehicleType, as: 'vehicleType', required: false }
      ]
    });

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Driver not found with this mobile number or email.'
      });
    }

    let isMatch = false;
    if (driver.password) {
      try {
        isMatch = await bcrypt.compare(loginPass, driver.password);
      } catch {
        isMatch = false;
      }
      if (!isMatch && driver.password === loginPass) {
        isMatch = true;
        const hashed = await bcrypt.hash(loginPass, 10);
        await driver.update({ password: hashed }).catch(() => {});
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please verify your credentials and try again.'
      });
    }

    const activeTrip = await Booking.findOne({
      where: {
        driverId: driver.driverId,
        confirmStatus: {
          [Op.in]: ['TRIP_STARTED', 'Trip Started']
        }
      }
    });


    const now = new Date();
    const loginStatus = activeTrip ? 'ON_TRIP' : 'AVAILABLE';

    await driver.update({
      status: loginStatus,
      isAvailable: true,
      role: 'driver',
      lastLoginAt: now,
      lastSeenAt: now
    });

    const token = Security.generateJwtToken(
      {
        userId: driver.driverId,
        driverId: driver.driverId,
        role: 'driver',
        roles: 'driver',
        name: driver.driverName,
        phone: driver.phno,
        email: driver.driverEmail
      },
      process.env.JWT_SECRET || 'supersecret',
      '7d'
    );

    let vehicleNumber = (driver as any).vehicle?.vehicleMaster?.vehicleNumber || (driver as any).vehicle?.vehicleNumber;
    if (!vehicleNumber && driver.vehicleId) {
      const vm = await VehicleMaster.findOne({ where: { vehicleId: driver.vehicleId, isDeleted: false } });
      if (vm) vehicleNumber = vm.vehicleNumber;
    }
    if (!vehicleNumber) vehicleNumber = 'Not Assigned';

    const vehicleName = (driver as any).vehicle?.vehicleName || (driver as any).vehicleType?.vehicleType || 'Not Assigned';

    return res.status(200).json({
      success: true,
      message: 'Driver login successful',
      accessToken: token,
      token,
      role: 'driver',
      roles: 'driver',
      id: driver.driverId,
      driverId: driver.driverId,
      driver: {
        driverId: driver.driverId,
        driverName: driver.driverName,
        phno: driver.phno,
        driverEmail: driver.driverEmail,
        licenseNo: driver.licenseNo,
        status: loginStatus,
        isAvailable: true,
        vehicleName,
        vehicleNumber,
        vehicleId: driver.vehicleId,
        activeTrip: activeTrip ? activeTrip.toJSON() : null
      }
    });
  } catch (err: any) {
    console.error('Driver Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Driver login failed due to server error',
      error: err.message
    });
  }
};

// 2. Driver Logout
export const driverLogout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    if (!driverId) {
      return res.status(400).json({ success: false, message: 'Driver ID not found' });
    }

    await Drivers.unscoped().update(
      {
        status: 'OFFLINE',
        isAvailable: false,
        lastLogoutAt: new Date()
      },
      { where: { driverId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Driver logged out successfully and marked OFFLINE'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Get Authenticated Driver Profile (/driver/me)
export const getDriverMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver unauthorized' });
    }

    const driver = await Drivers.unscoped().findByPk(driverId, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          required: false,
          include: [{ model: VehicleMaster, as: 'vehicleMaster', required: false }]
        },
        { model: VehicleType, as: 'vehicleType', required: false }
      ]
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    let vehicleNumber = (driver as any).vehicle?.vehicleMaster?.vehicleNumber || (driver as any).vehicle?.vehicleNumber;
    if (!vehicleNumber && driver.vehicleId) {
      const vm = await VehicleMaster.findOne({ where: { vehicleId: driver.vehicleId, isDeleted: false } });
      if (vm) vehicleNumber = vm.vehicleNumber;
    }
    if (!vehicleNumber) vehicleNumber = 'Not Assigned';

    const vehicleName = (driver as any).vehicle?.vehicleName || (driver as any).vehicleType?.vehicleType || 'Not Assigned';

    const activeTrip = await Booking.findOne({
      where: {
        driverId,
        confirmStatus: {
          [Op.in]: ['TRIP_STARTED', 'Trip Started']
        }
      },
      include: [
        { model: User, as: 'user', required: false },
        { model: Vehicle, as: 'vehicle', required: false }
      ]
    });

    await driver.update({ lastSeenAt: new Date() }).catch(() => {});

    return res.status(200).json({
      success: true,
      driver: {
        ...driver.toJSON(),
        vehicleName,
        vehicleNumber,
        activeTrip: activeTrip ? activeTrip.toJSON() : null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Update Driver Availability (AVAILABLE / OFFLINE)
export const updateDriverAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    const { isAvailable, status } = req.body;

    const driver = await Drivers.unscoped().findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const activeTrip = await Booking.findOne({
      where: {
        driverId,
        confirmStatus: {
          [Op.in]: ['TRIP_STARTED', 'Trip Started']
        }
      }
    });


    let newStatus = status;
    let newIsAvailable = isAvailable;

    if (typeof isAvailable === 'boolean') {
      newStatus = isAvailable ? 'AVAILABLE' : 'OFFLINE';
      newIsAvailable = isAvailable;
    } else if (status) {
      newStatus = status.toUpperCase();
      newIsAvailable = newStatus === 'AVAILABLE';
    }

    if (activeTrip && newStatus === 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle to Available while currently on an active trip.'
      });
    }

    const finalStatus = activeTrip ? 'ON_TRIP' : newStatus;

    await driver.update({
      status: finalStatus,
      isAvailable: newIsAvailable,
      lastSeenAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Driver status updated to ${finalStatus}`,
      status: finalStatus,
      isAvailable: newIsAvailable
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Driver Heartbeat
export const driverHeartbeat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    if (driverId) {
      await Drivers.unscoped().update(
        { lastSeenAt: new Date() },
        { where: { driverId } }
      );
    }
    return res.status(200).json({ success: true, timestamp: new Date() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Get Bookings for Authenticated Driver (/driver/my-bookings)
export const getDriverBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver unauthorized' });
    }

    const bookings = await Booking.findAll({
      where: {
        driverId
      },
      include: [
        { model: User, as: 'user', required: false },
        {
          model: Vehicle,
          as: 'vehicle',
          required: false,
          include: [{ model: VehicleMaster, as: 'vehicleMaster', required: false }]
        },
        { model: VehicleType, as: 'vehicleType', required: false }
      ],
      order: [['bookingDate', 'DESC'], ['bookingTime', 'DESC']]
    });

    const vehicleMasters = await VehicleMaster.findAll({ where: { isDeleted: false } });
    const vmByVehicleId = new Map<string, string>();
    const vmByModelName = new Map<string, string>();
    vehicleMasters.forEach((vm) => {
      if (vm.vehicleId && vm.vehicleNumber) vmByVehicleId.set(vm.vehicleId, vm.vehicleNumber);
      if (vm.vehicleModelName && vm.vehicleNumber) vmByModelName.set(vm.vehicleModelName.toLowerCase().trim(), vm.vehicleNumber);
      if (vm.vehicleType && vm.vehicleNumber) vmByModelName.set(vm.vehicleType.toLowerCase().trim(), vm.vehicleNumber);
    });

    const enriched = bookings.map((b: any) => {
      const bJson = b.toJSON();
      const pref = (b.preferredType || b.vehicle?.vehicleName || '').toLowerCase().trim();
      const regNumber = b.vehicle?.vehicleMaster?.vehicleNumber ||
        (b.vehicleId ? vmByVehicleId.get(b.vehicleId) : null) ||
        (pref ? vmByModelName.get(pref) : null) ||
        'Not Added';

      const vehName = b.vehicle?.vehicleName || b.preferredType || 'Standard Vehicle';

      return {
        ...bJson,
        customerName: b.customerName || b.user?.username || b.riderName || 'Customer',
        customerPhone: b.customerPhone || b.user?.phno || b.riderPhone || 'N/A',
        vehicleName: vehName,
        vehicleNumber: regNumber,
        pickupLocation: b.pickupPoint,
        dropLocation: b.dropPoint,
        fare: b.totalFare || b.estimatedFare || b.finalFare || 0,
        bookingCode: b.bookingCode || b.bookingId.slice(0, 8),
        status: b.confirmStatus || b.bookingStatus || 'DRIVER_ASSIGNED'
      };
    });

    const activeTrip = enriched.find((b) => ['TRIP_STARTED', 'Trip Started'].includes(String(b.confirmStatus)));
    const assignedRides = enriched.filter((b) => ['DRIVER_ASSIGNED', 'Driver Assigned', '1', 1].includes(b.confirmStatus));
    const completedRides = enriched.filter((b) => ['COMPLETED', 'Completed', '4', 4, 'PAYMENTCOMPLETED', '9', 9].includes(b.confirmStatus));

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRides = assignedRides.filter((b) => String(b.bookingDate).includes(todayStr));
    const upcomingRides = assignedRides.filter((b) => !String(b.bookingDate).includes(todayStr));

    return res.status(200).json({
      success: true,
      data: {
        all: enriched,
        activeTrip: activeTrip || null,
        assignedRides,
        todayRides,
        upcomingRides,
        completedRides
      }
    });
  } catch (err: any) {
    console.error('Get Driver Bookings Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 7. Start Trip (/driver/bookings/:bookingId/start)
export const startDriverTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    const { bookingId } = req.params;

    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver unauthorized' });
    }

    const booking = await Booking.findOne({
      where: {
        bookingId,
        driverId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not assigned to you.'
      });
    }

    const existingActive = await Booking.findOne({
      where: {
        driverId,
        bookingId: { [Op.ne]: bookingId },
        confirmStatus: { [Op.in]: ['TRIP_STARTED', 'Trip Started'] }
      }
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ongoing trip (#${existingActive.bookingCode || existingActive.bookingId.slice(0, 8)}). Please complete it before starting a new trip.`
      });
    }

    await booking.update({
      confirmStatus: 'TRIP_STARTED',
      bookingStatus: 'TRIP_STARTED',
      driverTripStatus: 'TRIP_STARTED'
    });

    await Drivers.unscoped().update(
      { status: 'ON_TRIP', lastSeenAt: new Date() },
      { where: { driverId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Trip started successfully!',
      bookingCode: booking.bookingCode,
      status: 'TRIP_STARTED',
      driverStatus: 'ON_TRIP'
    });
  } catch (err: any) {
    console.error('Start Trip Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 8. Complete Trip (/driver/bookings/:bookingId/complete)
export const completeDriverTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.driverId || req.userId;
    const { bookingId } = req.params;
    const { paymentMethod = 'CASH', amountPaid } = req.body;

    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver unauthorized' });
    }

    const booking = await Booking.findOne({
      where: {
        bookingId,
        driverId
      }
    });


    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not assigned to you.'
      });
    }

    const driver = await Drivers.unscoped().findByPk(driverId);
    const newDriverStatus = driver?.isAvailable ? 'AVAILABLE' : 'OFFLINE';

    const updates: any = {
      confirmStatus: 'COMPLETED',
      bookingStatus: 'COMPLETED',
      driverTripStatus: 'TRIP_COMPLETED'
    };

    if (String(paymentMethod).toUpperCase() === 'CASH') {
      updates.paymentStatus = 'PAID_CASH';
      updates.paymentMethod = 'CASH';
      if (amountPaid) updates.paidAmount = amountPaid;
    }

    await booking.update(updates);

    await Drivers.unscoped().update(
      { status: newDriverStatus, lastSeenAt: new Date() },
      { where: { driverId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Trip completed successfully!',
      bookingCode: booking.bookingCode,
      status: 'COMPLETED',
      driverStatus: newDriverStatus
    });
  } catch (err: any) {
    console.error('Complete Trip Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};



// 1. Create New Driver (with strict backend validations)
export const createDriver = async (req: any, res: Response) => {
  try {
    const { driverName, phno, driverEmail, licenseNo, vehicleId, status = 'AVAILABLE' } = req.body;

    if (!driverName || !String(driverName).trim()) {
      return res.status(400).json({ success: false, message: 'Driver Name is required.' });
    }
    if (!phno || !String(phno).trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    if (!licenseNo || !String(licenseNo).trim()) {
      return res.status(400).json({ success: false, message: 'License number is required.' });
    }

    const cleanPhone = String(phno).replace(/[^0-9+]/g, '').trim();
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number (at least 10 digits).' });
    }

    const cleanLicense = String(licenseNo).trim().toUpperCase();

    // Check duplicate phone
    const existingPhone = await Drivers.unscoped().findOne({
      where: { phno: cleanPhone, isDeleted: false }
    });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'A driver with this phone number is already registered.' });
    }

    // Check duplicate license
    const existingLicense = await Drivers.unscoped().findOne({
      where: { licenseNo: cleanLicense, isDeleted: false }
    });
    if (existingLicense) {
      return res.status(400).json({ success: false, message: 'A driver with this license number is already registered.' });
    }

    let vehicleTypeId = null;
    if (vehicleId) {
      const veh = await Vehicle.findByPk(vehicleId);
      if (veh?.vehicleTypeId) {
        vehicleTypeId = veh.vehicleTypeId;
      }
    }

    const validStatus = ['AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'OFFLINE'].includes(status) ? status : 'AVAILABLE';
    const hashedPassword = req.body.password ? await bcrypt.hash(req.body.password, 10) : await bcrypt.hash(cleanPhone.slice(-6), 10);

    const newDriver = await Drivers.create({
      driverName: driverName.trim(),
      phno: cleanPhone,
      password: hashedPassword,
      role: 'driver',
      driverEmail: driverEmail ? driverEmail.trim() : null,
      licenseNo: cleanLicense,
      vehicleId: vehicleId || null,
      vehicleTypeId,
      status: validStatus,
      isAvailable: validStatus === 'AVAILABLE',
      isDeleted: false,
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India'
    });

    const created = await Drivers.findByPk(newDriver.driverId, {
      include: [
        { model: Vehicle, as: 'vehicle', required: false },
        { model: VehicleType, as: 'vehicleType', required: false }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Driver added successfully',
      driver: created
    });
  } catch (err: any) {
    console.error('Create Driver Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create driver',
      error: err.message
    });
  }
};

// 10. Get All Drivers (with Search, Live Dynamic Status & Vehicle Number)
export const getAllDrivers = async (req: any, res: Response) => {
  try {
    const { status, search } = req.query;

    const whereClause: any = {
      isDeleted: false
    };

    if (status && status !== 'all' && status !== 'trashed') {
      whereClause.status = status.toUpperCase();
    }

    if (status === 'trashed') {
      whereClause.isDeleted = true;
    }

    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      whereClause[Op.or] = [
        { driverName: { [Op.like]: q } },
        { phno: { [Op.like]: q } },
        { licenseNo: { [Op.like]: q } }
      ];
    }

    const drivers = await Drivers.unscoped().findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          required: false,
          include: [{ model: VehicleMaster, as: 'vehicleMaster', required: false }]
        },
        { model: VehicleType, as: 'vehicleType', required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Fetch active bookings for these drivers to populate Current Booking
    const driverIds = drivers.map((d) => d.driverId);
    let activeBookings: any[] = [];
    if (driverIds.length > 0) {
      activeBookings = await Booking.findAll({
        where: {
          driverId: { [Op.in]: driverIds },
          confirmStatus: {
            [Op.in]: ['DRIVER_ASSIGNED', 'TRIP_STARTED', 'Driver Assigned', 'Trip Started']
          }
        },
        attributes: ['bookingId', 'bookingCode', 'driverId', 'pickupPoint', 'dropPoint', 'confirmStatus', 'bookingStatus']
      });
    }

    const activeBookingMap = new Map<string, any>();
    activeBookings.forEach((b) => {
      if (b.driverId) {
        activeBookingMap.set(b.driverId, b);
      }
    });

    // Preload VehicleMaster map
    const vehicleMasters = await VehicleMaster.findAll({ where: { isDeleted: false } });
    const vmByVehicleId = new Map<string, string>();
    vehicleMasters.forEach((vm) => {
      if (vm.vehicleId && vm.vehicleNumber) vmByVehicleId.set(vm.vehicleId, vm.vehicleNumber);
    });

    const enrichedDrivers = drivers.map((d) => {
      const json = d.toJSON();
      const currentBooking = activeBookingMap.get(d.driverId) || null;

      // Compute dynamic live status
      let dynamicStatus = d.status || 'AVAILABLE';
      if (currentBooking) {
        if (['TRIP_STARTED', 'Trip Started'].includes(currentBooking.confirmStatus)) {
          dynamicStatus = 'ON_TRIP';
        } else if (['DRIVER_ASSIGNED', 'Driver Assigned'].includes(currentBooking.confirmStatus)) {
          dynamicStatus = 'ASSIGNED';
        }
      } else if (!d.isAvailable || d.status === 'OFFLINE') {
        dynamicStatus = 'OFFLINE';
      }

      const vehicleNumber = (d as any).vehicle?.vehicleMaster?.vehicleNumber ||
        (d.vehicleId ? vmByVehicleId.get(d.vehicleId) : null) ||
        (d as any).vehicle?.vehicleNumber ||
        'Not Assigned';

      return {
        ...json,
        status: dynamicStatus,
        vehicleNumber,
        currentBooking
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Drivers retrieved successfully',
      drivers: enrichedDrivers
    });
  } catch (err: any) {
    console.error('Get All Drivers Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


// 3. Get Driver by ID
export const getDriverById = async (req: any, res: Response) => {
  const { driverId } = req.params;
  try {
    const driver = await Drivers.findByPk(driverId, {
      include: [
        { model: Vehicle, as: 'vehicle', required: false },
        { model: VehicleType, as: 'vehicleType', required: false }
      ]
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Active booking check
    const activeBooking = await Booking.findOne({
      where: {
        driverId,
        confirmStatus: {
          [Op.in]: ['DRIVER_ASSIGNED', 'TRIP_STARTED', 'Driver Assigned', 'Trip Started']
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Driver retrieved successfully',
      driver: {
        ...driver.toJSON(),
        currentBooking: activeBooking
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Update Driver (with active trip protection)
export const updateDriver = async (req: any, res: Response) => {
  const { driverId } = req.params;
  const updateData = req.body;

  try {
    const driver = await Drivers.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Uniqueness validations for updated phone
    if (updateData.phno && updateData.phno !== driver.phno) {
      const cleanPhone = String(updateData.phno).replace(/[^0-9+]/g, '').trim();
      const existingPhone = await Drivers.findOne({
        where: { phno: cleanPhone, driverId: { [Op.ne]: driverId }, isDeleted: false }
      });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'Phone number already registered to another driver.' });
      }
      updateData.phno = cleanPhone;
    }

    // Uniqueness validations for updated license
    if (updateData.licenseNo && updateData.licenseNo !== driver.licenseNo) {
      const cleanLicense = String(updateData.licenseNo).trim().toUpperCase();
      const existingLicense = await Drivers.findOne({
        where: { licenseNo: cleanLicense, driverId: { [Op.ne]: driverId }, isDeleted: false }
      });
      if (existingLicense) {
        return res.status(400).json({ success: false, message: 'License number already registered to another driver.' });
      }
      updateData.licenseNo = cleanLicense;
    }

    // 🛡️ CRITICAL PROTECTION: Cannot manually set to AVAILABLE if driver has an active trip!
    if (updateData.status === 'AVAILABLE' && driver.status !== 'AVAILABLE') {
      const activeTrip = await Booking.findOne({
        where: {
          driverId,
          confirmStatus: {
            [Op.in]: ['DRIVER_ASSIGNED', 'TRIP_STARTED', 'Driver Assigned', 'Trip Started']
          }
        }
      });

      if (activeTrip) {
        return res.status(400).json({
          success: false,
          message: `Cannot set driver to AVAILABLE. Driver is currently on active ride #${activeTrip.bookingCode || activeTrip.bookingId.slice(0, 8)}. Please complete or cancel the ride first.`
        });
      }
    }

    // Update vehicle association if vehicleId provided
    if (updateData.vehicleId) {
      const veh = await Vehicle.findByPk(updateData.vehicleId);
      if (veh?.vehicleTypeId) {
        updateData.vehicleTypeId = veh.vehicleTypeId;
      }
    }

    await driver.update(updateData);

    const updated = await Drivers.findByPk(driverId, {
      include: [
        { model: Vehicle, as: 'vehicle', required: false },
        { model: VehicleType, as: 'vehicleType', required: false }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      driver: updated
    });
  } catch (err: any) {
    console.error('Update Driver Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Delete / Deactivate Driver (safe deactivation preserving history)
export const deleteDriver = async (req: any, res: Response) => {
  const { driverId } = req.params;
  try {
    const driver = await Drivers.unscoped().findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Check if active trip in progress
    const activeTrip = await Booking.findOne({
      where: {
        driverId,
        confirmStatus: {
          [Op.in]: ['DRIVER_ASSIGNED', 'TRIP_STARTED', 'Driver Assigned', 'Trip Started']
        }
      }
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete/deactivate driver while assigned to an active trip.'
      });
    }

    await driver.update({ isDeleted: true, status: 'OFFLINE' });
    return res.status(200).json({ success: true, message: 'Driver deactivated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Restore Driver
export const restoreDriver = async (req: any, res: Response) => {
  const { driverId } = req.params;
  try {
    const driver = await Drivers.unscoped().findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await driver.update({ isDeleted: false, status: 'AVAILABLE' });
    return res.status(200).json({ success: true, message: 'Driver restored successfully', driver });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 7. Get Driver Notifications
export const getDriverNotifications = async (req: any, res: Response) => {
  try {
    const driverId = req.params.driverId || req.query.driverId;
    if (!driverId) {
      return res.status(400).json({ success: false, message: 'Driver ID is required' });
    }

    const notifications = await DriverNotification.findAll({
      where: { driverId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const unreadCount = await DriverNotification.count({
      where: {
        driverId,
        [Op.or]: [{ readStatus: false }, { isRead: false }]
      }
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 8. Mark Driver Notification as Read
export const markNotificationRead = async (req: any, res: Response) => {
  try {
    const { notificationId } = req.params;
    await DriverNotification.update(
      { readStatus: true, isRead: true },
      { where: { notificationId } }
    );
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const markAllDriverNotificationsRead = async (req: any, res: Response) => {
  try {
    const driverId = req.params.driverId || req.query.driverId;
    if (!driverId) {
      return res.status(400).json({ success: false, message: 'Driver ID is required' });
    }
    await DriverNotification.update(
      { readStatus: true, isRead: true },
      { where: { driverId } }
    );
    return res.status(200).json({ success: true, message: 'All driver notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 9. Get Assigned Trips for Driver (with customer privacy protection: only assigned driver gets customer phone)
export const getMyAssignedTrips = async (req: any, res: Response) => {
  try {
    const driverId = req.params.driverId || req.query.driverId || req.user?.driverId;
    if (!driverId) {
      return res.status(400).json({ success: false, message: 'Driver ID is required' });
    }

    const bookings = await Booking.findAll({
      where: {
        driverId,
        confirmStatus: {
          [Op.in]: ['DRIVER_ASSIGNED', 'TRIP_STARTED', 'Driver Assigned', 'Trip Started']
        }
      },
      include: [
        { model: User, as: 'user', required: false },
        { model: Vehicle, as: 'vehicle', required: false },
        { model: VehicleType, as: 'vehicleType', required: false }
      ],
      order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};


// 10. Existing Legacy Endpoints (Preserved for compatibility)
export const getVehiclesForDriver = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;
    const driver = await Drivers.findOne({
      where: { driverId, isDeleted: false },
      include: [{ model: VehicleType, required: false, include: [{ model: Vehicle, required: false }] }]
    });

    if (!driver) {
      return res.status(404).json({ message: "No driver found with the given ID" });
    }
    return res.status(200).json({ message: "Vehicle details retrieved successfully", driver: driver.toJSON() });
  } catch (err: any) {
    return res.status(500).json({ message: "Error retrieving vehicle details", error: err.message });
  }
};

export const getBookingByVehicleAndDriver = async (req: any, res: any) => {
  const { driverId } = req.body;
  try {
    const bookings = await Booking.findAll({
      where: { driverId, confirmStatus: ORDER.STATUS.CONFIRMED },
      include: [{ model: VehicleType, required: false }, { model: Vehicle, required: false }],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ message: 'Bookings retrieved successfully', data: bookings });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving bookings', error: error.message });
  }
};

export const acceptBooking = async (req: any, res: Response) => {
  return res.status(200).json({ message: 'Booking accepted' });
};

export const startBooking = async (req: any, res: Response) => {
  return res.status(200).json({ message: 'Booking started' });
};

export const endBooking = async (req: any, res: Response) => {
  return res.status(200).json({ message: 'Booking completed' });
};

export const updateDriverLocation = async (req: any, res: Response) => {
  return res.status(200).json({ message: 'Location updated' });
};

export const getDriverLocation = async (req: any, res: Response) => {
  return res.status(200).json({ message: 'Location retrieved' });
};
