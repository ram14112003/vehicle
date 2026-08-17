import express from 'express';
import {createPaymentMode,listPaymentModes, getPaymentModeById,updatePaymentMode, deletePaymentMode, 
        restorePaymentMode, filterPaymentModesByStatus, getPaymentModesByOnlineStatus } from '../services/paymentModeServices'
import { authMiddleware } from '../middleware/authMiddleware';


const router = express.Router();

// Protected routes (authentication required)
router.post('/createPaymentMode',authMiddleware,createPaymentMode)
router.get('/getAllPaymentMode',authMiddleware,listPaymentModes);

router.get('/getPaymentModeById/:id', authMiddleware, getPaymentModeById);
router.put('/updatePaymentMode/:id', authMiddleware, updatePaymentMode);
router.delete('/deletePaymentMode/:id', authMiddleware, deletePaymentMode);
router.put('/restorePaymentMode/:id', authMiddleware, restorePaymentMode);


router.get('/filterPaymentModes', authMiddleware, filterPaymentModesByStatus);
//   http://localhost:5000/api/paymentmode/filterPaymentModes?status=inactive
//   http://localhost:5000/api/paymentmode/filterPaymentModes?status=active

router.get('/filterByOnlineStatus', authMiddleware, getPaymentModesByOnlineStatus);
// http://localhost:5000/api/paymentmode/filterByOnlineStatus?isOnline=true
// http://localhost:5000/api/paymentmode/filterByOnlineStatus?isOnline=false

export default router;