import { Request, Response } from 'express';
import { Drivers } from '../models';
import { Vehicle } from '../models/vehicle';
import { Booking } from '../models/booking';
import { VehicleType } from '../models/vehicleType';
import { USERS } from "../utils/costants";
import { ORDER } from '../utils/costants';
const { ROLES } = USERS;


// Get All Drivers
// Driver Controller - getAllDrivers function
export const getAllDrivers = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const { status } = req.query;
    let drivers;
    if (status === 'trashed') {
      // Fetch only trashed drivers
      drivers = await Drivers.unscoped().findAll({
        where: { isDeleted: true },  include: [
          {
            model: VehicleType,  required: false,
            include: [{ model: Vehicle,   required: false }]
          }
        ]
      });
    } else {
      // Fetch only active drivers (default)
      drivers = await Drivers.findAll({
        where: { isDeleted: false }, include: [
          {
            model: VehicleType,
              required: false, 
            include: [{ model: Vehicle,   required: false, }]
          }
        ]
      });
    }


    res.status(200).json({
      message: "Drivers retrieved successfully",
      drivers: drivers.map(d => d.toJSON())
    });
   } catch (err) {
    res.status(500).json({ error: err });
  }
};

// Get Driver by ID
export const getDriverById = async (req: any, res: Response) => {
  const { driverId } = req.params;
  
  try {
    const role = req.role;
     if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const driver = await Drivers.findByPk(driverId,
       
    );
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json({ message: 'Driver retrieved successfully', driver });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const  updateDriver = async (req: any, res: Response) => {
  const { driverId } = req.params;
  const updateData = req.body;

  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const driver = await Drivers.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if email is being updated and if it already exists
    if (updateData.driverEmail && updateData.driverEmail !== driver.driverEmail) {
      const existingDriver = await Drivers.findOne({
        where: { driverEmail: updateData.driverEmail }
      });
      if (existingDriver) {
        return res.status(400).json({ message: 'Email already exists for another driver' });
      }
    }

    // ✅ Check if phone number is being updated and already exists
    if (updateData.phno && updateData.phno !== driver.phno) {
      const existingDriverWithPhone = await Drivers.findOne({
        where: { phno: updateData.phno }
      });
      if (existingDriverWithPhone) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }

await driver.update({
  ...updateData,
  trackingsource: updateData.trackingSource, // ✅ map correct DB column
});
    res.status(200).json({ message: 'Driver updated successfully', driver });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// Delete Driver
export const deleteDriver = async (req: any, res: Response) => {
  const { driverId } = req.params;
  
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const driver = await Drivers.unscoped().findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await driver.update({isDeleted : 1});
    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};


// Restore (Activate) Driver
export const restoreDriver = async (req: any, res: Response) => {
  const { driverId } = req.params;

  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const driver = await Drivers.unscoped().findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await driver.update({ isDeleted: false });

    res.status(200).json({ message: 'Driver restored successfully', driver });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const getVehiclesForDriver = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;

    const driver = await Drivers.findOne({
      where: { driverId, isDeleted: false },
      include: [
        {
          model: VehicleType,
          required: false,
          include: [
            {
              model: Vehicle,
              required: false
            }
          ]
        }
      ]
    });

    if (!driver) {
      return res.status(404).json({
        message: "No driver found with the given ID"
      });
    }

    res.status(200).json({
      message: "Vehicle details retrieved successfully",
      driver: driver.toJSON(), // clean Sequelize instance to plain JSON
    });
  } catch (err: any) {
    res.status(500).json({
      message: "Error retrieving vehicle details",
      error: err.message
    });
  }
};


export const getBookingByVehicleAndDriver = async (req: any, res: any) => {
  const {  driverId } = req.body; 
  console.log("hello  ",driverId);

  try {
    const bookings = await Booking.findAll({
      where: {
        //vehicleId: vehicleId,
        driverId: driverId,
        confirmStatus: ORDER.STATUS.CONFIRMED
      },
   include: [
                      { model: VehicleType ,    required: false, 
                                  include: [
                      {
                        model: Vehicle,
                        as: "vehicle",
                        required: false,
                      },]
                      },
                      { model: Vehicle,    required: false },
                  ],
      order: [['createdAt', 'DESC']] // optional: newest first
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        message: 'No bookings found for the given vehicleId and driverId'
      });
    }

    res.status(200).json({
      message: 'Bookings retrieved successfully',
      data: bookings
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving bookings',
      error: error.message
    });
  }
};

const updateBookingStatus = async (
  req: any,
  res: Response,
  expectedConfirmStatus: number,
  newBookingStatus: number,
  successMessage: string
) => {
  try {
    const role = req.role;
    const { bookingId, driverId } = req.body;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    console.log(expectedConfirmStatus,newBookingStatus);

    const updateResult = await Booking.update(
      { bookingStatus: newBookingStatus, driverId: driverId },
      {
        where: {
          bookingStatus: expectedConfirmStatus,
          bookingId: bookingId,
          driverId: driverId
        }
      }
    );

    if (updateResult[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    return res.status(200).json({
      message: successMessage,
      updateResult
    });
  } catch (err) {
    console.error('Update Booking Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const endBooking = async (req: any, res: Response) => {
  try {
    const { driverId, bookingId } = req.body;
    const role = req.role;
      const signature = req.file?.filename; 

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const updateResult = await Booking.update(
      { bookingStatus: ORDER.STATUS.COMPLETED, driverTripStatus: ORDER.STATUS.COMPLETED, driverId: driverId , signature},
      {
        where: {
          bookingStatus: ORDER.STATUS.STARTED,
          bookingId: bookingId,
          driverId: driverId
        }
      }
    );

    if (updateResult[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    return res.status(200).json({
      message: 'Trip End status updated successfully',
      updateResult
    });
  } catch (err) {
    console.error('Update Booking Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptBooking = (req: any, res: Response) =>
  updateBookingStatus(req, res, ORDER.STATUS.CONFIRMED, ORDER.STATUS.ACCEPTED, 'ACCEPTED status updated successfully');

export const startBooking = async (req: any, res: Response) => {
    try {
    const role = req.role;
    const { bookingId, driverId } = req.body;

    const onGoingTrip = await Booking.findAll({
            where: {
              driverId: driverId, 
              bookingStatus: ORDER.STATUS.STARTED
            },
          });
          
    if (onGoingTrip.length > 0) {
       return res.status(403).json({ message: 'Already in trip, please complete...' });
    }

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }



   // console.log(expectedConfirmStatus,newBookingStatus);

    const updateResult = await Booking.update(
      { bookingStatus: ORDER.STATUS.STARTED, driverId: driverId },
      {
        where: {
          bookingStatus: ORDER.STATUS.ACCEPTED,
          bookingId: bookingId,
          driverId: driverId
        }
      }
    );

    if (updateResult[0] === 0) {
      return res.status(200).json({ message: 'No matching bookings found to update' });
    }

    return res.status(200).json({
      message: "STARTED status updated successfully",
      updateResult
    });
  } catch (err) {
    console.error('Update Booking Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const updateDriverLocation = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId, driverId, latitude, longitude, angle } = req.body;
    console.log("updateDriverLocation - bookingId:", bookingId, "driverId:", driverId);

    // find the booking (single)
    const booking = await Booking.findOne({
      where: {
        bookingId,
        driverId
      },
    });

    if (!booking) {
      return res.status(403).json({ message: "Trip Not started..." });
    }

    // DEBUG: show bookingStatus and existing coords
    console.log("Found booking, bookingStatus:", booking.bookingStatus);
    console.log("Existing travelLatitude, travelLongitude, angle:", booking.travelLatitude, booking.travelLongitude, booking.angle);

    // Safely read existing trail (handles JSON arrays or stringified JSON)
    let trail: any[] = [];
    if (Array.isArray(booking.travelTrail)) {
      trail = booking.travelTrail;
    } else if (typeof booking.travelTrail === "string") {
      try {
        const parsed = JSON.parse(booking.travelTrail);
        trail = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // If parse fails, fallback to empty array
        console.warn("Could not parse travelTrail string, resetting to []");
        trail = [];
      }
    } else if (booking.travelTrail == null) {
      trail = [];
    } else {
      // If DB returns something else, try to coerce to array
      try {
        trail = Array.from(booking.travelTrail);
      } catch {
        trail = [];
      }
    }

    // Normalize new point values to strings (keeps consistent)
    const point = {
      lat: latitude != null ? String(latitude).trim() : "",
      lng: longitude != null ? String(longitude).trim() : "",
      angle: angle != null ? String(angle).trim() : "",
      ts: new Date().toISOString(),
    };

    // Compare lat,lng,and angle with the most recent saved point (index 0)
    const latest = trail[0] || null;
    const sameAsLatest =
      latest &&
      latest.lat === point.lat &&
      latest.lng === point.lng &&
      latest.angle === point.angle;

    if (!sameAsLatest) {
      // insert new point at front and keep max 5
      trail = [point, ...trail].slice(0, 5);
    } else {
      // If sameAsLatest is true we keep the trail unchanged.
      // NOTE: If you want to force an update even when coordinates are same
      // (e.g., to update updatedAt), we still call booking.update below with explicit fields.
      console.log("Point is same as latest; not prepending to trail.");
    }

    // If DB stores travelTrail as string, convert to string to avoid type issues.
    // Detect current type from booking.travelTrail:
    const needsStringify = typeof booking.travelTrail === "string";

    const toSave: any = {
      travelLatitude: point.lat,
      travelLongitude: point.lng,
      angle: point.angle,
      // store correctly according to DB current format
      travelTrail: needsStringify ? JSON.stringify(trail) : trail,
    };

    console.log("About to update booking instance with:", toSave);

    // Use the found instance to update — safer than class-level update where WHERE mismatches happen.
    // Passing { fields: [...] } ensures these fields are written.
    const updatedBooking = await booking.update(toSave, {
      fields: ["travelLatitude", "travelLongitude", "angle", "travelTrail"],
    });

    // Return the trail (if it was stringified in DB we still return parsed array)
    const returnedTrail = Array.isArray(updatedBooking.travelTrail)
      ? updatedBooking.travelTrail
      : (() => {
          try {
            return JSON.parse(updatedBooking.travelTrail as any);
          } catch {
            return trail;
          }
        })();

    return res.status(200).json({
      message: "latitude longitude updated successfully",
      last5: returnedTrail,
    });
  } catch (err) {
    console.error("Update driver location Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getDriverLocation = async (req: any, res: Response) => {
  try {
    const role = req.role;
    const { bookingId, driverId } = req.body;

    const startedTrip = await Booking.findOne({
      where: {
        bookingId: bookingId,
        driverId: driverId,
       // bookingStatus: ORDER.STATUS.STARTED,
      },
    });

    if (!startedTrip) {
      return res.status(403).json({ message: 'Trip Not started...' });
    }

    // Safely read the stored trail (array or JSON string)
    const rawTrail = (startedTrip as any).travelTrail;
    const trail: Array<{ lat: string; lng: string; angle?: string; ts: string }> =
      Array.isArray(rawTrail)
        ? rawTrail
        : (typeof rawTrail === 'string'
            ? (() => { try { return JSON.parse(rawTrail); } catch { return []; } })()
            : []);

    // Keep only the latest 5
    const last5 = trail.slice(0, 5);

    return res.status(200).json({
      message: 'get latitude longitude',
      current: {
        latitude: startedTrip.travelLatitude ?? '',
        longitude: startedTrip.travelLongitude ?? '',
        angle: (startedTrip as any).angle ?? '',
      },
      last5, // each item includes lat, lng, angle, ts
    });
  } catch (err) {
    console.error('get Booking Status Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};




