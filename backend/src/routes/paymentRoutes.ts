import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';

import {
  createPaymentSession,
  paymentCallback,
  getPaymentStatus,
  paymentReturnRelay,
} from '../services/paymentServices';

const router = express.Router();

// Parse JSON for your own endpoints
router.use(express.json());

// ✅ Protect your own endpoints
router.post('/payments/create-session', createPaymentSession);
router.get('/payments/status', getPaymentStatus);

// ❗ Public: called by the gateway — DO NOT add auth
// ✅ Parse x-www-form-urlencoded so req.body contains fields gateway sends
router.post('/payments/callback', express.urlencoded({ extended: true }), paymentCallback);
router.post('/payments/return',   express.urlencoded({ extended: true }), paymentReturnRelay);
router.get('/payments/return',    paymentReturnRelay);

export default router;
