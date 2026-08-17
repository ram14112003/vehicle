import { Response } from 'express';
import { VehicleMaster } from '../models/vehicleMaster';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;
import { VEHICLESTATUS } from '../utils/costants';
import { Vendor } from '../models/vendor';
import { Vehicle } from '../models/vehicle';
import { VehicleType } from '../models';
const {STATUS} = VEHICLESTATUS;
import { Op } from "sequelize";
// GET All Vehicle Masters
export const getAllVehicleMaster = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const { status } = req.query;
    let vehicles;

   if (status === '1') {
  // Trash view → only deleted vehicles
  vehicles = await VehicleMaster.findAll({
    where: { isDeleted: 1 }
  });
} else {
  // Normal view → only active vehicles
  vehicles = await VehicleMaster.findAll({
    where: { isDeleted: 0 }
  });
}


    // Map only required fields and send
    const formatted = vehicles.map(v => ({
      vehicleMasterId: v.vehicleMasterId,
      vehicleNumber: v.vehicleNumber,
      vehicleModel: v.vehicleModelName, // direct column
      vehicleType: v.vehicleType,       // direct column
      vendorName: v.vendorName,           // direct column
      isDeleted: v.isDeleted
    }));

    res.status(200).json({
      message: 'Vehicles retrieved successfully',
      count: formatted.length,
      vehicles: formatted
    });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVehicleMaster = async (req: any, res: Response) => {
  const { id } = req.params;

  // You can send either just names OR ids from dropdowns
  const {
    vehicleNumber,
    vehicleModelName,    // name of the model (free text) – or send vehicleId
    vehicleType,         // plain string (from vehicleType table) – or send vehicleTypeId
    vendorName,           // plain string – or send ownerId
    vehicleId,
    vehicleTypeId,
    vendorId,
  } = req.body;

  try {
    if (req.role === ROLES.USER) return res.status(403).json({ message: "Not Authorized" });

    const vm = await VehicleMaster.findByPk(id);
    if (!vm) return res.status(404).json({ message: "Vehicle not found" });

    // Resolve names from IDs if provided (keeps both id and denormalized name columns in sync)
    let resolvedModelName = vehicleModelName ?? vm.vehicleModelName;
    let resolvedTypeName  = vehicleType ?? vm.vehicleType;
    let resolvedVendorName = vendorName ?? vm.vendorName;

    if (vehicleId) {
      const v = await Vehicle.findByPk(vehicleId, { include: [VehicleType] });
      if (v) {
        resolvedModelName = v.vehicleName;
        // If you prefer to derive type from the VehicleType relation:
        resolvedTypeName = v.vehicleType?.vehicleType ?? resolvedTypeName;
      }
    }
    if (vehicleTypeId) {
      const vt = await VehicleType.findByPk(vehicleTypeId);
      if (vt) resolvedTypeName = vt.vehicleType;
    }
    if (vendorId) {
      const o = await Vendor.findByPk(vendorId);
      if (o) resolvedVendorName = o.vendorName;
    }

     if (vehicleNumber) {
  const existing = await VehicleMaster.findOne({
    where: {
      vehicleNumber: vehicleNumber,
vehicleMasterId: { [Op.ne]: id },
    },
  });

  if (existing) {
    return res.status(400).json({
      message: "VehicleNumber already exists",
    });
  }
}


    await vm.update({
      vehicleNumber: vehicleNumber ?? vm.vehicleNumber,
      vehicleId:     vehicleId     ?? vm.vehicleId,
      vehicleModelName: resolvedModelName,    //  correct column
      vehicleType:      resolvedTypeName,     //  stored as string in VehicleMaster
      vendorId:          vendorId     ?? vm.vendorId,
      vendorName:        resolvedVendorName,    //  correct column
    });

    return res.status(200).json({ message: "Vehicle updated successfully", data: vm });
  } catch (err) {
    console.error("Error updating vehicle:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// DELETE Vehicle (soft delete)
export const deleteVehicleMaster = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const vehicle = await VehicleMaster.unscoped().findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.update({ isDeleted: 1 });

    res.status(200).json({
      message: 'Vehicle deleted successfully',
      data: { vehicleMasterId: id }
    });

  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// RESTORE Vehicle
export const restoreVehicleMaster = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const vehicle = await VehicleMaster.unscoped().findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.update({ isDeleted: 0 });

    res.status(200).json({
      message: 'Vehicle restored successfully',
      data: { vehicleMasterId: id }
    });

  } catch (err) {
    console.error('Error restoring vehicle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
