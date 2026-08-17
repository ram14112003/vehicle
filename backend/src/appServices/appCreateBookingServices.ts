import { Request, Response } from 'express';
import { Booking } from '../models/booking';
import { Vehicle } from '../models/vehicle';
import { VehicleType } from '../models/vehicleType';
import { User } from '../models/user';
import { Company } from '../models/company';
import { USERS,ORDER } from "../utils/costants";
const { STATUS } = ORDER;
const { ROLES } = USERS;

export const createBooking = async (req: any, res: Response) => {
  const { bookingDate, bookingTime, pickupPoint, pickupCity, dropPoint, travellersCount,
    femaleCount, maleCount, remarks, purpose, vehicleId,driverId, vehicleTypeId, preferredType, roundTrip, pickupAirport, pickupStation, flightNo, trainNo,
    notes, pickupLongitude, pickupLatitude, dropLatitude, dropLongitude, userId, pickupArea,predefinedArea, approximatetds2,approximatetds1 } = req.body;

  try {
    const employeeId = req.userId;

    if (req.role === ROLES.DRIVER) {
      return res.status(403).json({ message: 'Not able to authorize' });
    }

    const confirmStatus = STATUS.PENDING;
    const bookingStatus = STATUS.PENDING;

    const booking = await Booking.create({
      bookingDate, bookingTime, employeeId, pickupPoint, pickupCity, dropPoint, travellersCount,
      femaleCount, maleCount, remarks, purpose, confirmStatus, bookingStatus, vehicleId,driverId, vehicleTypeId,
      preferredType, roundTrip, pickupAirport, pickupStation, flightNo, trainNo, notes,
      pickupLongitude, pickupLatitude, dropLatitude, dropLongitude, userId, pickupArea,predefinedArea, approximatetds2,approximatetds1
    });

    // Build include array conditionally
    const includeArray = [];

    // Only include Vehicle if vehicleId exists
    if (vehicleId) {
      includeArray.push({
        model: Vehicle,
        include: [
          {
            model: VehicleType,
          },
        ],
      });
    } else {
      // Include only VehicleType if no specific vehicle is selected
      includeArray.push({
        model: VehicleType,
      });
    }

      const bookingWithDetails = await Booking.findOne({
               where: { invoiceId: booking.bookingId },
               include: [
                   { model: User,    required: false },
                   { model: VehicleType ,    required: false},
                   { model: Company,    required: false },
               ],
               });
               
 // SUCCESS response
    return res.status(201).json({
      success: true,
      message: "Booked successfully",
      booking: bookingWithDetails,
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

