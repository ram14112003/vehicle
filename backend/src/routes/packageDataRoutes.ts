import express from 'express';
import {createPackageData,getAllPackageData,getPackageDataById,updatePackageData,deletePackageData,copyPackageData } from '../services/packageDataServices';
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();


router.post('/createPackageData',createPackageData);
//router.post('/copyPackageData',copyPackageData)
router.get('/getAllPackageData',getAllPackageData);
router.get('/getPackageDataById/:id',getPackageDataById);
router.put('/updatePackageData/:id',updatePackageData);
router.delete('/deletePackageData/:id',deletePackageData);

router.post('/copyPackageData',copyPackageData);





export default router;