import express from 'express';
import {getAllVehicleTypes,getVehicleTypeById,updateVehicleType,deleteVehicleType,restoreVehicleType,getAllVehicleTypesforWeb,getVehicleTypeWithVehicles,getAllVehicleTypeByType } from '../services/vehicleTypeServices';
import { authMiddleware } from '../middleware/authMiddleware';

import { uploadVehicleImg } from "../middleware/uploadConfig";
const  router = express.Router();

// Protected routes (authentication required)

router.get('/getAllVehicleType',getAllVehicleTypes );
router.get('/getAllVehicleTypeByType',authMiddleware,getAllVehicleTypeByType );
router.get('/getAllVehicleTypesforWeb',authMiddleware,getAllVehicleTypesforWeb);
router.get("/vehicleTypeWithVehicles",authMiddleware,getVehicleTypeWithVehicles);
router.get('/:id',authMiddleware,getVehicleTypeById );
router.put('/:id/update',authMiddleware, uploadVehicleImg.array("vehicleImg", 5),updateVehicleType);

router.delete('/:id/delete',authMiddleware,deleteVehicleType)
router.patch('/:id/restore', authMiddleware, restoreVehicleType);

export default router;