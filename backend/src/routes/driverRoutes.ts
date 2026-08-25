import express from 'express';
import { uploadSignature } from "../middleware/uploadConfig";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  restoreDriver,
  getDriverNotifications,
  markNotificationRead,
  markAllDriverNotificationsRead,
  getMyAssignedTrips,
  getVehiclesForDriver,
  getBookingByVehicleAndDriver,
  acceptBooking,
  startBooking,
  endBooking,
  updateDriverLocation,
  getDriverLocation
} from '../services/driverServices';

import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Driver CRUD
router.post("/create", createDriver);
router.post("/addDriver", createDriver);
router.get("/getAllDrivers", getAllDrivers);
router.get("/getDriverById/:driverId", getDriverById);
router.put("/update/:driverId", updateDriver);
router.delete("/delete/:driverId", deleteDriver);
router.put("/restore/:driverId", restoreDriver);

// Driver Notifications
router.get("/notifications/:driverId", getDriverNotifications);
router.put("/notifications/:notificationId/read", markNotificationRead);
router.put("/notifications/mark-all-read/:driverId", markAllDriverNotificationsRead);


// Driver Assigned Trips View
router.get("/my-trips/:driverId", getMyAssignedTrips);
router.get("/my-trips", getMyAssignedTrips);

// Legacy routes preserved
router.get("/getVehiForDriver", getVehiclesForDriver);
router.get("/getBookingByVehicleAndDriver", getBookingByVehicleAndDriver);
router.put("/acceptBooking", acceptBooking);
router.put("/startBooking", startBooking);
router.put("/endBooking", uploadSignature.single("signature"), endBooking);
router.put("/updateDriverLocation", updateDriverLocation);
router.get("/getDriverLocation", getDriverLocation);

export default router;