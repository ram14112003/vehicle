import { Router } from "express";
import { createInvoice,getPendingInvoices, sendInvoiceReminder,getInvoicesPayHolder,getFilteredPendingInvoices,getCompletedInvoices,
    getAllInvoices,getAllCompanyInvoices,getInvoicesByUserId,getcompanyOrderSummery,getUserOrderStats,getInvoiceStatusCount, cancelInvoice, 
    resendClosePendingInvoiceEmail} from "../services/invServices"
import { authMiddleware } from '../middleware/authMiddleware';
 
const router = Router();
 

router.post("/sendInvoiceReminder", authMiddleware, sendInvoiceReminder);

router.post("/createInvoice", authMiddleware, createInvoice);
router.post(
  "/invoice/resend-closepending-email",
  authMiddleware,
  resendClosePendingInvoiceEmail
);
 router.get("/getPendingInvoices", authMiddleware, getPendingInvoices);
 router.get("/getInvoicesPayHolder", authMiddleware, getInvoicesPayHolder);
router.get("/getFilteredPendingInvoices", authMiddleware, getFilteredPendingInvoices);
router.get("/getCompletedInvoices", authMiddleware, getCompletedInvoices);
router.get("/getAllInvoices", authMiddleware, getAllInvoices);
router.get("/summary", getAllCompanyInvoices);
router.get("/invoices/:userId", getInvoicesByUserId);
router.get("/getcompanyOrderSummery", getcompanyOrderSummery);
router.get("/user-order-stats/:userId", getUserOrderStats);
router.get("/invoice/status-count", getInvoiceStatusCount);

router.put("/invoice/cancelInvoice", cancelInvoice)
export default router;
 

