import { Router } from 'express';
import {
  getReportSummary,
  getBookingsReport,
  getUserReports,
  getCustomerBookingHistory,
  getDriverReports,
  getVehicleReports,
  getBookingInvoiceData,
  exportReportExcel
} from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Note: If authentication is enabled on admin routes, we can include authMiddleware,
// or support optional token validation so exports/fetch work seamlessly.
router.get('/summary', getReportSummary);
router.get('/bookings', getBookingsReport);
router.get('/users', getUserReports);
router.get('/users/:userId/bookings', getCustomerBookingHistory);
router.get('/drivers', getDriverReports);
router.get('/vehicles', getVehicleReports);
router.get('/invoice/:bookingId', getBookingInvoiceData);
router.get('/export-excel', exportReportExcel);

export default router;
