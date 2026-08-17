import express from 'express';



import { getOwner,getOwnerById,updateOwner, deleteOwner,restoreOwner } from '../services/ownerServices';

import { authMiddleware } from '../middleware/authMiddleware';


const router = express.Router();

// Protected routes (authentication required)


router.get('/getAllOwner',authMiddleware,getOwner);
router.get('/getOwnerById/:id',authMiddleware,getOwnerById);
router.put('/updateOwner/:id',authMiddleware,updateOwner);
router.delete('/deleteOwner/:id',authMiddleware,deleteOwner);
router.put('/:id/restore', authMiddleware, restoreOwner);


export default router;