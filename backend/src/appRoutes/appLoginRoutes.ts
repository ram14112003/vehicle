import express from 'express';
import { sendOTP, verifyOTPLogin ,  resendOTP} from '../appServices/appLoginServices';


const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPLogin);
router.post('/resend-otp', resendOTP);

export default router;