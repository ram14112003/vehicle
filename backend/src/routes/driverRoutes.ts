import express from 'express';
import { uploadSignature } from "../middleware/uploadConfig";
import {getAllDrivers,getDriverById,updateDriver,deleteDriver,restoreDriver, getVehiclesForDriver, getBookingByVehicleAndDriver,
    acceptBooking, startBooking, endBooking, updateDriverLocation,getDriverLocation } from '../services/driverServices';

import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get("/getAllDrivers", authMiddleware,getAllDrivers);
router.get("/getDriverById/:driverId",authMiddleware,getDriverById);
router.put("/update/:driverId",authMiddleware,updateDriver);
router.delete("/delete/:driverId",authMiddleware,deleteDriver);
router.put("/restore/:driverId", authMiddleware, restoreDriver);

router.get("/getVehiForDriver", authMiddleware, getVehiclesForDriver);
router.get("/getBookingByVehicleAndDriver", authMiddleware, getBookingByVehicleAndDriver);

router.put("/acceptBooking", authMiddleware, acceptBooking);
router.put("/startBooking", authMiddleware, startBooking);
router.put("/endBooking",uploadSignature.single("signature"), authMiddleware, endBooking);

router.put("/updateDriverLocation",authMiddleware, updateDriverLocation);

router.get("/getDriverLocation",authMiddleware, getDriverLocation);




export default router;