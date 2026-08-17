import express from 'express';
import { listPickupCity,getPickupCityById,updatePickupCity,deletePickupCity, restorePickupCity } from '../services/pickupCityServices';
import { authMiddleware } from '../middleware/authMiddleware';


const router = express.Router();

// Protected routes (authentication required)


router.get('/listCity',authMiddleware,listPickupCity );
router.get('/getPickupCityById/:id',authMiddleware,getPickupCityById );
 
router.put('/pickupCityUpdate/:id',authMiddleware,updatePickupCity );
router.delete('/pickupCityDelete/:id',authMiddleware,deletePickupCity );
router.put('/pickupCityRestore/:id', authMiddleware, restorePickupCity);

export default router;