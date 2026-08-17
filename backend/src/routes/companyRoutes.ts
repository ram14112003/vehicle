import express from 'express';
import {getAllCompany,getCompanyById,updateCompany,deleteCompany, restoreCompany, getCompanyBySeoUrl,getCompanyTaxes} from '../services/companyServices';
import { authMiddleware,} from '../middleware/authMiddleware';
import { uploadCompanyLogo } from "../middleware/uploadConfig"; 

const router = express.Router();

router.get("/getAllCompany",getAllCompany);
router.get("/:seoUrl", getCompanyBySeoUrl);
router.get("/company/:companyId/taxes", getCompanyTaxes);
router.get("/getCompanyById/:id",authMiddleware,getCompanyById);
// router.put("/companyUpdate/:id",authMiddleware,updateCompany);
router.put(
  "/companyUpdate/:id",
  uploadCompanyLogo.single("companyLogo"), // 👈 Added here
  authMiddleware,
  updateCompany
);
router.delete("/companyDelete/:id",authMiddleware,deleteCompany);
router.put("/companyRestore/:id", authMiddleware, restoreCompany);

export default router;