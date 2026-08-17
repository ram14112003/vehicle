import express from 'express';
import {getAllVehicleMaster,updateVehicleMaster,deleteVehicleMaster,restoreVehicleMaster} from '../services/vehicleMasterServices';
import { authMiddleware } from '../middleware/authMiddleware';
import { Vehicle } from '../models';
import { VehicleType } from '../models';
import { Vendor } from '../models';

const router = express.Router();

router.get('/getAllVehicleMaster',authMiddleware,getAllVehicleMaster );
router.put("/:id/update", updateVehicleMaster);
router.delete("/:id/delete", deleteVehicleMaster);
router.put("/:id/restore", restoreVehicleMaster);

// routes/vehicleMasterRoutes.ts (or suitable router)
router.get("/dropdown/models", async (_req, res) => {
  const rows = await Vehicle.findAll({
    attributes: ["vehicleId", "vehicleName", "vehicleTypeId"], // ✅
  });

  res.json({
    data: rows.map(r => ({
      id: r.vehicleId,
      label: r.vehicleName,
      vehicleTypeId: r.vehicleTypeId, // ✅ IMPORTANT
    })),
  });
});


router.get("/dropdown/types", async (_req, res) => {
  const rows = await VehicleType.findAll({ attributes: ["vehicleTypeId", "vehicleType"] });
  res.json({ data: rows.map(r => ({ id: r.vehicleTypeId, label: r.vehicleType })) });
});

router.get("/dropdown/vendors", async (_req, res) => {
  const rows = await Vendor.findAll({ attributes: ["vendorId", "vendorName"] });
  res.json({ data: rows.map(r => ({ id: r.vendorId, label: r.vendorName })) });
});


export default router;