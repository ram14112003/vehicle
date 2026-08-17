import express from 'express';
import {listPickUpArea,getPickupAreaById,updatePickupArea,deletePickupArea, restorePickupArea } from '../services/pickupAreaServices';
import { authMiddleware } from '../middleware/authMiddleware';


const router = express.Router();

// Protected routes (authentication required)


router.get('/listArea',authMiddleware,listPickUpArea );
router.get('/getPickupAreaById/:id',authMiddleware,getPickupAreaById);
router.put('/pickupAreaUpdate/:id',authMiddleware,updatePickupArea);
router.delete('/pickupAreaDelete/:id',authMiddleware,deletePickupArea );
router.put('/pickupAreaRestore/:id', authMiddleware, restorePickupArea);

export default router;