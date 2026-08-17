import express from 'express';
import { createEmailConf,getAllEmailConf,getEmailConfById,updateEmailConf } from '../services/emailConfServices';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/createEmailConf', createEmailConf);

router.get('/getAllEmailConf',authMiddleware, getAllEmailConf);
router.get('/getEmailConfById/:id',authMiddleware,getEmailConfById)
router.put('/updateEmailConf/:id',authMiddleware, updateEmailConf);

export default router;