import express from 'express';
import {uploadUsersFromExcel, getCurrentUser,getUsersByStatus, getAllUsers, getUserById, updateUser,updateUserStatus, deleteUser,logout, getAllUserByCompany,
    getUsersByConfirmationStatus, getUsersByGender, confirmUser, addNewAddress, 
    getUserAddresses, getUserByManager, updateUserAddress, deleteUserAddress, restoreUser, permanentDeleteUser,
    getCompanyManagers,
    getMapCount,
    appMapCount,
    getManagerDetailsByUserId,
    getUsersByCompany
 } from '../services/userServices';
import { authMiddleware } from '../middleware/authMiddleware';
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Protected routes (authentication required)
router.post("/upload-users", upload.single("file"), uploadUsersFromExcel);
// Protected routes (authentication required)

router.get('/getCurrentUser', getCurrentUser);
router.get('/getUsersByStatus/:status', getUsersByStatus);
router.post('/logout', logout);

router.get('/getAllUsers',authMiddleware, getAllUsers);

router.get('/getAllUserByCompany/:companyId',authMiddleware, getAllUserByCompany);

router.get('/getUsersByConfirmationStatus/:confirmed', authMiddleware, getUsersByConfirmationStatus); 
router.get('/getUsersByGender/:gender', authMiddleware, getUsersByGender); 
router.put('/confirmUser/:id', authMiddleware, confirmUser); 

router.get('/:id',authMiddleware, getUserById);
 
router.put('/updateUser/:id',authMiddleware, updateUser);
router.put('/:id/status',authMiddleware, updateUserStatus);
router.delete('/deleteUser/:id',authMiddleware, deleteUser);

router.post('/:id/address', addNewAddress);
router.get('/:id/addresses', getUserAddresses);
router.put('/:id/address/:idx', updateUserAddress);
router.delete('/:id/address/:idx', deleteUserAddress);


router.get('/:userId/getUsersManager', getUserByManager);

router.put('/restoreUser/:id', authMiddleware, restoreUser);
router.delete('/permanentDeleteUser/:id', authMiddleware, permanentDeleteUser);
router.get("/company/:companyId/managers", getCompanyManagers);

router.put("/app/appMapCount", appMapCount);

router.get("/getManagerByUserId/:userId", getManagerDetailsByUserId);
router.get("/getUsersByCompany/:companyId", getUsersByCompany);


export default router;