import express from 'express';
import { empRegister, empLogin,registerUser ,userLogin, vendorLogin, ownerRegister,sendOTP, verifyOTPLogin, resendOTP, forgetPassword, 
    forgetPasswordSendOtp,verifyOtpPassword,CompanyLogin,changePassword} from '../services/authServices';


const router = express.Router();

router.post('/empRegister', empRegister);
router.post('/empLogin', empLogin);
router.post('/createUser', registerUser); 
router.post('/userLogin',userLogin)
router.post('/companyLogin', CompanyLogin)

router.post('/vendorLogin', vendorLogin);

//router.post('/ownerRegister', ownerRegister);


//app routes//

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPLogin);
router.post('/resend-otp', resendOTP);

router.put('/forgetPassword', forgetPassword);
router.post('/forgetPasswordSendOtp', forgetPasswordSendOtp);
router.post('/verifyOtpPassword', verifyOtpPassword);
router.put('/changePassword', changePassword);


export default router;
