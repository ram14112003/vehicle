import express from 'express';
import { uploadSignature } from "../middleware/uploadConfig";
import {
  driverRegister,
  driverLogin,
  driverLogout,
  getDriverMe,
  updateDriverAvailability,
  driverHeartbeat,
  getDriverBookings,
  startDriverTrip,
  completeDriverTrip,
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

import { authMiddleware, driverAuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Driver Authentication & Session
router.post("/register", driverRegister);
router.post("/driverRegister", driverRegister);
router.post("/login", driverLogin);
router.post("/driverLogin", driverLogin);
router.post("/logout", driverAuthMiddleware, driverLogout);
router.get("/me", driverAuthMiddleware, getDriverMe);
router.patch("/availability", driverAuthMiddleware, updateDriverAvailability);
router.post("/heartbeat", driverAuthMiddleware, driverHeartbeat);


// Driver Portal Bookings & Trip Actions
router.get("/my-bookings", driverAuthMiddleware, getDriverBookings);
router.post("/bookings/:bookingId/start", driverAuthMiddleware, startDriverTrip);
router.post("/bookings/:bookingId/complete", driverAuthMiddleware, completeDriverTrip);

// Driver CRUD (Admin)
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