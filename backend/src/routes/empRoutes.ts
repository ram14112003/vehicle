import express from 'express';
import { createVendor,createBooking,createCompany,confirmPendingOrderCount,paymentPendingOrderCount, confirmPendingOrderCountWeb,
    getAllBooking,getAllPendingBooking, addTax , taxList, editTax, deleteTax,paymentCompletedOrderCount, confirmPendingOrderForManager,confirmBookingByManager,
    getCompletedList, createBookingForWeb,
    cnfrmBookingByManagerEmail,
    rejectBookingByManager,
    createBookingForWebOnCall} from '../services/empServices';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadCompanyLogo } from "../middleware/uploadConfig";

const router = express.Router();


router.post('/createVendor',authMiddleware, createVendor);

router.post('/createBooking',authMiddleware, createBooking);
router.post('/createBookingForWeb',authMiddleware,createBookingForWeb);
router.post('/createBookingForWebOnCall',authMiddleware, createBookingForWebOnCall);
router.post('/createCompany',uploadCompanyLogo.single("companyLogo"),authMiddleware, createCompany);

// router.get('/getAllCompany',authMiddleware, getAllCompany);

router.get('/getAllBooking',authMiddleware, getAllBooking);

router.get('/getAllPendingBooking',authMiddleware, getAllPendingBooking);

// router.get('/getAllVendor',authMiddleware, getAllVendor);

router.post('/addTax',authMiddleware, addTax);

router.get('/getTaxList',authMiddleware, taxList);



router.get('/confirmPendingOrderCount',authMiddleware, confirmPendingOrderCount);
router.get('/confirmPendingOrderCountWeb',authMiddleware, confirmPendingOrderCountWeb);


router.get('/confirmPendingOrderForManager',authMiddleware, confirmPendingOrderForManager);

router.get('/paymentPendingOrderCount',authMiddleware, paymentPendingOrderCount);

router.get('/paymentCompletedOrderCount',authMiddleware, paymentCompletedOrderCount);
router.get('/getcompletedlist',authMiddleware, getCompletedList);  // get completed list

router.put('/confirmBookingByManager',authMiddleware, confirmBookingByManager);

router.get('/cnfrmBookingByManagerEmail', cnfrmBookingByManagerEmail);
router.get('/rejectBookingByManagerEmail', rejectBookingByManager);

router.put('/editTax/:taxId', authMiddleware, editTax);  
router.delete('/deleteTax/:taxId', authMiddleware, deleteTax);
export default router;
