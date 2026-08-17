import express from 'express';
import { getAllOrders, editBooking, cancelBooking, declineBooking, getOrderById, getCancelledBooking ,
  getOrderByEmployeeId,getBookingDetails, getOrderPaymentListById,getOverallInvoiceReport,companyBookingReport,
  getMonthlyBookings,getAllOrdersByUser,getCancelledOrdersByUser,getClosedOrdersByUser,getConfirmedOrdersByUser,
  getOrdersByStatus,getPaymentCompletedOrdersByUser,getPendingOrdersByUser,getPendingInvoicesByUser,getPaymentPendingOrdersByUser,downloadUserInvoicePdf,
  createPartner,editCloseBooking } from '../services/bookingServices';

import { authMiddleware } from '../middleware/authMiddleware';
import {
  getConfirmedOrders,
  getPendingOrders,
  getClosedOrders,
  getCompletedOrders,
  getPaymentCompletedOrders
} from '../controllers/bookingControllers';
const router = express.Router();

router.post("/partners",  createPartner);

router.get("/getAllOrders", authMiddleware,getAllOrders);
router.post("/getOrdersById", authMiddleware,getOrderById);
router.post("/getOrderPaymentListById", authMiddleware,getOrderPaymentListById);
router.post("/getOrderByEmployeeId", authMiddleware,getOrderByEmployeeId);

router.get('/status/confirmed', authMiddleware, getConfirmedOrders);
router.get('/status/pending', authMiddleware, getPendingOrders);
router.get('/status/closed', authMiddleware, getClosedOrders);
router.get('/status/completed', authMiddleware, getCompletedOrders);
router.get('/status/paymentcompleted', authMiddleware, getPaymentCompletedOrders);
router.get('/status/cancelled', authMiddleware, getCancelledBooking);

router.put('/editBooking/:bookingId', authMiddleware, editBooking);
router.put('/editCloseBooking/:bookingId', authMiddleware, editCloseBooking);
router.put("/cancelBooking", authMiddleware, cancelBooking);
router.put("/declineBooking", authMiddleware, declineBooking);
router.get('/status/cancelled', authMiddleware, getCancelledBooking);

router.get("/details/:bookingCode", getBookingDetails);
router.get("/getallinvoicereport", getOverallInvoiceReport);
router.get("/companyBookingReport", authMiddleware, companyBookingReport);
router.get('/getmonthlybookings', authMiddleware, getMonthlyBookings);

router.get("/user/:userId/all", getAllOrdersByUser);    //my order details
router.get("/user/:userId/pending", getPendingOrdersByUser);
router.get("/user/:userId/pending-invoices", getPendingInvoicesByUser); //pending invoices
router.get("/user/:userId/confirmed", getConfirmedOrdersByUser);
router.get("/user/:userId/payment-completed", getPaymentCompletedOrdersByUser);
router.get("/user/:userId/closed", getClosedOrdersByUser);
router.get("/user/:userId/cancelled", getCancelledOrdersByUser);
router.get("/user/:userId/payment-pending", getPaymentPendingOrdersByUser);
router.get("/user/invoices/:bookingId/:invoiceId/pdf",  authMiddleware, downloadUserInvoicePdf);

export default router;
