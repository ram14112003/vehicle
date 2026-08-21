import express from 'express';
import {
  getAllVehicleTypes,
  getVehicleTypeById,
  updateVehicleType,
  deleteVehicleType,
  restoreVehicleType,
  getAllVehicleTypesforWeb,
  getVehicleTypeWithVehicles,
  getAllVehicleTypeByType,
  calculateFare
} from '../services/vehicleTypeServices';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadVehicleImg } from "../middleware/uploadConfig";

const router = express.Router();

// Public fleet & fare routes
router.get('/getAllVehicleType', getAllVehicleTypes);
router.get('/getAllVehicleTypesforWeb', getAllVehicleTypesforWeb);
router.get("/vehicleTypeWithVehicles", getVehicleTypeWithVehicles);
router.post('/calculate-fare', calculateFare);

// Protected vehicle routes
router.get('/getAllVehicleTypeByType', authMiddleware, getAllVehicleTypeByType);
router.get('/:id', authMiddleware, getVehicleTypeById);
router.put('/:id/update', authMiddleware, uploadVehicleImg.array("vehicleImg", 5), updateVehicleType);
router.delete('/:id/delete', authMiddleware, deleteVehicleType);
router.patch('/:id/restore', authMiddleware, restoreVehicleType);

export default router;