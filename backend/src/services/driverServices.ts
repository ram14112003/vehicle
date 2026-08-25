import { Request, Response } from 'express';
import { Drivers } from '../models';
import { Vehicle } from '../models/vehicle';
import { Booking } from '../models/booking';
import { VehicleType } from '../models/vehicleType';
import { User } from '../models/user';
import { DriverNotification } from '../models/driverNotification';
import { USERS } from "../utils/costants";
import { ORDER } from '../utils/costants';
import { Op } from "sequelize";


const { ROLES } = USERS;

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

    const newDriver = await Drivers.create({
      driverName: driverName.trim(),
      phno: cleanPhone,
      driverEmail: driverEmail ? driverEmail.trim() : null,
      licenseNo: cleanLicense,
      vehicleId: vehicleId || null,
      vehicleTypeId,
      status: validStatus,
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

// 2. Get All Drivers (with Search, Status Filter & Active Booking Detection)
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
        { model: Vehicle, as: 'vehicle', required: false },
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

    const enrichedDrivers = drivers.map((d) => {
      const json = d.toJSON();
      const currentBooking = activeBookingMap.get(d.driverId) || null;
      return {
        ...json,
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
