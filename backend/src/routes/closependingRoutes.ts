import express from 'express';
import {createClosePending, createAppInvoice,getPaymentForPendingInvoice,savePaymentForInvoice,getCompletedList,clearPaymentInitialise,
     paymentInitialise, 
     createMonthlyInvoice,
     resendMonthlyInvoice,
     getAllMonthlyInvoiceDetails,
     getMonthlyInvoiceDetailsById,
     getAllMonthlyInvoice,
     filterMonthlyInvoices,
     editMonthlyInvoice, 
     deleteMonthlyInvoice,
     deleteMonthlyInvoiceItem,
     changeMonthlyInvoiceNumber}  from '../services/closependingorderServices';
import { authMiddleware } from '../middleware/authMiddleware';
 
 
const router = express.Router();

 
// Protected routes (authentication required)
router.post('/createClosePending',authMiddleware,createClosePending);
router.post('/createAppInvoice',authMiddleware,createAppInvoice);
router.post("/monthlyInvoice/create", authMiddleware,createMonthlyInvoice);
router.post("/monthlyInvoice/resend", authMiddleware,resendMonthlyInvoice);
router.put("/monthlyInvoice/edit-monthly-invoice",editMonthlyInvoice);
router.get("/monthlyInvoice/getAll",authMiddleware, getAllMonthlyInvoiceDetails);
router.get("/monthlyInvoice/getAllmonthly",authMiddleware, getAllMonthlyInvoice);
router.get("/monthlyInvoice/filter", filterMonthlyInvoices);
router.get(  "/monthlyInvoice/:monthlyInvoiceId/details", authMiddleware,  getMonthlyInvoiceDetailsById);
router.get('/getPaymentForPendingInvoice/:invoiceId',authMiddleware,getPaymentForPendingInvoice);
router.post('/savePaymentForInvoice',authMiddleware,savePaymentForInvoice);
router.post('/paymentInitialise',paymentInitialise);
router.post('/clearPaymentInitialise',clearPaymentInitialise);
router.put("/monthly-invoice/edit", editMonthlyInvoice);
router.get('/getCompletedList',authMiddleware,getCompletedList);

router.delete(
  "/monthlyInvoice/:monthlyInvoiceId",
  deleteMonthlyInvoice
);

router.delete(
  "/monthlyInvoiceItem/:monthlyInvoiceItemId",
  authMiddleware,
  deleteMonthlyInvoiceItem
);

router.delete(
  "/monthlyInvoice/item/:monthlyInvoiceItemId",
  authMiddleware,
  deleteMonthlyInvoiceItem
);

router.post(
  "/monthlyInvoice/delete-route-item",
  authMiddleware,
  deleteMonthlyInvoiceItem
);

router.post("/monthlyInvoice/change-invoice-number", authMiddleware, changeMonthlyInvoiceNumber);
 
export default router;