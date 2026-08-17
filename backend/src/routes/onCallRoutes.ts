import express from 'express';
import { createOncallInvoice, downloadOncallInvoicePDF, editOnCallInvoice, getAllOnCallInvoices, getOnCallInvoiceById, updateOnCallInvoice,removeOnCallInvoiceItem, deleteOnCallInvoice, changeOnCallInvoiceNumber } from '../services/onCallServices';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/createOncallInvoice', createOncallInvoice);
router.get('/getAll', getAllOnCallInvoices);
router.get('/getById/:onCallBillId', getOnCallInvoiceById);
router.put('/edit/:onCallBillId', editOnCallInvoice);
router.post('/generatePdf', downloadOncallInvoicePDF); 
router.put(
  "/update-oncall-invoice/:onCallBillId",
  updateOnCallInvoice
);
router.delete('/remove-item/:onCallInvoiceItemId', removeOnCallInvoiceItem);


router.delete(
  "/onCallInvoice/:onCallBillId",
  deleteOnCallInvoice
);

router.post('/change-invoice-number', authMiddleware, changeOnCallInvoiceNumber);

export default router;