import express from 'express';
import {getAllVehicles,getVehicleById,getAvailableVehicles,updateVehicle,updateVehicleStatus,getVehiclesByVehileTypeId,
    getAllVehiclesForWeb,softDeleteVehicle,restoreVehicle,deleteVehicle,getAssignedTrip, getVehiclesByVehicleType,getVehiclesByVehicleTypeForWeb,
    getPackagesByVehicleType,getVehicleModelsByTypeId,getCompletedTrip } from '../services/vehicleServices';
import { authMiddleware } from '../middleware/authMiddleware';


const router = express.Router();
import { uploadVehicleImg } from "../middleware/uploadConfig";

// Protected routes (authentication required)



router.get('/getAllVehicles',authMiddleware,getAllVehicles);
router.get('/getAllVehiclesForWeb',authMiddleware,getAllVehiclesForWeb);
router.get('/getAvailableVehicle',authMiddleware,getAvailableVehicles );
router.get('/:vehicleId/getVehicleById',authMiddleware,getVehicleById );

// router.put('/:vehicleId/updateVehicle',authMiddleware,updateVehicle );
router.put('/:vehicleId/updateVehicle', uploadVehicleImg.array("vehicleImg", 5),  updateVehicle);
router.put('/:vehicleId/updateVehicleStatus',authMiddleware,updateVehicleStatus );
router.put('/:vehicleId/softDeleteVehicle', authMiddleware, softDeleteVehicle); // ✅ add this
router.put('/:vehicleId/restoreVehicle', authMiddleware, restoreVehicle);       // ✅ add this
router.delete('/:vehicleId/deleteVehicle',authMiddleware,deleteVehicle);
router.get('/getAssignedTrip',authMiddleware,getAssignedTrip);
router.get('/getCompletedTrip',authMiddleware,getCompletedTrip);
router.get('/getAssignedTrip',authMiddleware, getVehiclesByVehileTypeId);
router.get('/:vehicleTypeId/getVehiclesByVehicleType', getVehiclesByVehicleType);
router.get('/:vehicleTypeId/getVehiclesByVehicleTypeForWeb',getVehiclesByVehicleTypeForWeb);
router.get('/getPackagesByVehicleType',authMiddleware, getPackagesByVehicleType);
router.get("/vehicleType/:vehicleTypeId/vehicle-models", getVehicleModelsByTypeId);
export default router;