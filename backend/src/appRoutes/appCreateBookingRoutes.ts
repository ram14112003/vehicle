import express from 'express';
import { createBooking } from '../appServices/appCreateBookingServices';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();


router.post('/createBooking',authMiddleware, createBooking);

export default router;