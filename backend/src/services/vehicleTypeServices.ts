import { Request, Response } from 'express';
import { VehicleType } from '../models/vehicleType'; // Adjust path as needed
import { Vehicle } from '../models/vehicle'; 
import { Drivers } from '../models/drivers';
import { Booking } from '../models/booking'; 
import { USERS } from "../utils/costants";
import { Op, Transaction } from "sequelize";
import { PackageData } from "../models/packageData"; // ✅ make sure path is correct
const { ROLES } = USERS;

// ✅ helper: safely parse JSON
const safeJson = (v: any) => {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return null;
  }
};

// ✅ helper: rename vehicle key inside packages.vehicles
const renameVehicleKeyInPackages = (packagesObj: any, oldKey: string, newKey: string) => {
  if (!packagesObj || typeof packagesObj !== "object") return { changed: false, packagesObj };
  const vehicles = packagesObj.vehicles;
  if (!vehicles || typeof vehicles !== "object") return { changed: false, packagesObj };

  if (vehicles[oldKey] === undefined) return { changed: false, packagesObj };

  // if newKey already exists (rare), merge to avoid loss
  if (vehicles[newKey] !== undefined) {
    vehicles[newKey] = { ...vehicles[oldKey], ...vehicles[newKey] };
    delete vehicles[oldKey];
    return { changed: true, packagesObj };
  }

  vehicles[newKey] = vehicles[oldKey];
  delete vehicles[oldKey];
  return { changed: true, packagesObj };
};

// ✅ sync rename into all PackageData rows
const syncVehicleTypeRenameToPackageData = async (
  oldName: string,
  newName: string,
  transaction: Transaction
) => {
  if (!oldName || !newName) return 0;
  if (oldName === newName) return 0;

  // ✅ optional filter to reduce scan (works if packages stored as TEXT)
  const rows = await PackageData.findAll({
    where: {
      isDeleted: false,
      packages: { [Op.like]: `%\"${oldName}\"%` }, // best-effort filter
    } as any,
    transaction,
  });

  let updatedCount = 0;

  for (const row of rows) {
    const pkg = safeJson((row as any).packages);
    if (!pkg) continue;

    const before = JSON.stringify(pkg);

    const { changed, packagesObj } = renameVehicleKeyInPackages(pkg, oldName, newName);
    if (!changed) continue;

    const after = JSON.stringify(packagesObj);
    if (after === before) continue;

    (row as any).packages = after;
    await row.save({ transaction });
    updatedCount++;
  }

  return updatedCount;
};

export const updateVehicleType = async (req: any, res: Response) => {
  const { id } = req.params;
     const updateData = req.body;

  const { vehicleType,  seatCapacity, priorMinutes } = req.body;

     const newImages = req.files ? (req.files as Express.Multer.File[]).map(f => f.filename) : [];


  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    if (!id) {
      return res.status(400).json({ message: "Vehicle type ID is required" });
    }

    const existingVehicleType = await VehicleType.findOne({
      where: { vehicleTypeId: id },
    });

    if (!existingVehicleType) {
      return res.status(404).json({ message: "Vehicle type not found" });
    }

    
    if (newImages.length > 0) {
      updateData.vehicleImg = newImages;
    }

        if (updateData.vehicleType && updateData.vehicleType !== existingVehicleType.vehicleType) {
            const existing = await VehicleType.findOne({
                where: { vehicleType: updateData.vehicleType }
            });
            if (existing) {
                return res.status(400).json({ message: 'Vehicle name already exists' });
            }
        }

    const oldName = String(existingVehicleType.vehicleType || "");
    const newName = vehicleType !== undefined ? String(vehicleType) : oldName;

    // ✅ prevent duplicates
    if (vehicleType && vehicleType !== existingVehicleType.vehicleType) {
      const duplicate = await VehicleType.findOne({ where: { vehicleType } });
      if (duplicate && duplicate.vehicleTypeId !== id) {
        return res.status(400).json({ message: "Vehicle type name already exists" });
      }
    }

    const sequelize = VehicleType.sequelize;
    if (!sequelize) {
      return res.status(500).json({ message: "DB connection not found" });
    }

  const result = await sequelize.transaction(async (transaction) => {
  if (vehicleType !== undefined)
    existingVehicleType.vehicleType = vehicleType;

  if (seatCapacity !== undefined)
    existingVehicleType.seatCapacity = Number(seatCapacity);

  if (priorMinutes !== undefined)
    (existingVehicleType as any).priorMinutes = Number(priorMinutes);

  // ✅ IMAGE UPDATE (THIS WAS MISSING)
  if (newImages.length > 0) {
    (existingVehicleType as any).vehicleImg = newImages;
  }

  await existingVehicleType.save({ transaction });

  let packagesUpdatedCount = 0;
  if (oldName && newName && oldName !== newName) {
    packagesUpdatedCount = await syncVehicleTypeRenameToPackageData(
      oldName,
      newName,
      transaction
    );
  }

  return { packagesUpdatedCount };
});


    return res.status(200).json({
      message: "Vehicle type updated successfully",
      data: existingVehicleType,
      packagesUpdatedCount: result.packagesUpdatedCount, // ✅ how many records updated
    });
  } catch (err) {
    console.error("Error updating vehicle type:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const getAllVehicleTypesforWeb = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let whereClause: any = {};
    if (status === '1') {
      whereClause = { isDeleted: true };  // Trash view
    } else {
      whereClause = { isDeleted: false }; // Active view
    }

    const vehicleTypes = await VehicleType.unscoped().findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',     required: false, 
          include: [
            {
              model: Drivers,
              as: 'driver' ,  required: false, 
            }
          ]
        }
      ]
    });

    res.status(200).json({ data: vehicleTypes });
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle types' });
  }
};

export const getAllVehicleTypes = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let whereClause: any = {};
    if (status === "1") {
      whereClause = { isDeleted: true }; // Trash view
    } else {
      whereClause = { isDeleted: false }; // Active view
    }

    const vehicleTypes = await VehicleType.unscoped().findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          required: false,
        },
        {
          model: Drivers,
          as: "drivers",   // make sure alias matches your association
          required: false,
        },
      ],
    });

    res.status(200).json({
      message: "Vehicle types fetched successfully",
      data: vehicleTypes,
    });
  } catch (error) {
    console.error("Error fetching vehicle types:", error);
    res.status(500).json({ message: "Failed to fetch vehicle types", error });
  }
};





// Get Vehicle Type by ID
export const getVehicleTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    if (!id) {
      return res.status(400).json({ message: 'Vehicle type ID is required' });
    }

    const vehicleType = await VehicleType.findByPk(id);
    
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    res.status(200).json({
      message: 'Vehicle type retrieved successfully',
      data: vehicleType
    });

  } catch (err) {
    console.error('Error fetching vehicle type:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// // Update Vehicle Type
// export const updateVehicleType = async (req: any, res: Response) => {
//   const { id } = req.params;
//   const { vehicleType, AdvanceBookingHours,seatCapacity } = req.body;
  
//   try {
//     const role = req.role;
//        if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     if (!id) {
//       return res.status(400).json({ message: 'Vehicle type ID is required' });
//     }

//     const existingVehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId: id }
//     });
    
//     if (!existingVehicleType) {
//       return res.status(404).json({ message: 'Vehicle type not found' });
//     }

//     // Check if vehicleType name already exists (excluding current record)
//     if (vehicleType && vehicleType !== existingVehicleType.vehicleType) {
//       const duplicate = await VehicleType.findOne({ 
//         where: { 
//           vehicleType: vehicleType
//         } 
//       });
//       if (duplicate && duplicate.vehicleTypeId !== id) {
//         return res.status(400).json({ message: 'Vehicle type name already exists' });
//       }
//     }

//     // Update fields directly on the instance
//     if (vehicleType !== undefined) existingVehicleType.vehicleType = vehicleType;
//     if (AdvanceBookingHours !== undefined) existingVehicleType.AdvanceBookingHours = AdvanceBookingHours;
//     if (seatCapacity !== undefined) existingVehicleType.seatCapacity = Number(seatCapacity);

//     await existingVehicleType.save();

//     res.status(200).json({
//       message: 'Vehicle type updated successfully',
//       data: existingVehicleType
//     });

//   } catch (err) {
//     console.error('Error updating vehicle type:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
// export const updateVehicleType = async (req: any, res: Response) => {
//   const { id } = req.params;
//   const { vehicleType, AdvanceBookingHours, seatCapacity, priorMinutes } = req.body; // ✅ added priorMinutes

//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: "Not Authorized" });
//     }

//     if (!id) {
//       return res.status(400).json({ message: "Vehicle type ID is required" });
//     }

//     const existingVehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId: id },
//     });

//     if (!existingVehicleType) {
//       return res.status(404).json({ message: "Vehicle type not found" });
//     }

//     if (vehicleType && vehicleType !== existingVehicleType.vehicleType) {
//       const duplicate = await VehicleType.findOne({ where: { vehicleType } });
//       if (duplicate && duplicate.vehicleTypeId !== id) {
//         return res.status(400).json({ message: "Vehicle type name already exists" });
//       }
//     }

//     if (vehicleType !== undefined) existingVehicleType.vehicleType = vehicleType;
//     if (AdvanceBookingHours !== undefined) existingVehicleType.AdvanceBookingHours = AdvanceBookingHours;
//     if (seatCapacity !== undefined) existingVehicleType.seatCapacity = Number(seatCapacity);

//     // ✅ NEW
//     if (priorMinutes !== undefined) existingVehicleType.priorMinutes = Number(priorMinutes);

//     await existingVehicleType.save();

//     return res.status(200).json({
//       message: "Vehicle type updated successfully",
//       data: existingVehicleType,
//     });
//   } catch (err) {
//     console.error("Error updating vehicle type:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };


// Delete Vehicle Type
export const deleteVehicleType = async (req: any, res: Response) => {
  const { id } = req.params;
  
  try {
    const role = req.role;
        if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Vehicle type ID is required' });
    }

    const vehicleType = await VehicleType.unscoped().findByPk(id);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    await vehicleType.update({isDeleted :1});

    res.status(200).json({
      message: 'Vehicle type deleted successfully',
      data: { vehicleTypeId: id }
    });

  } catch (err) {
    console.error('Error deleting vehicle type:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Restore Vehicle Type
export const restoreVehicleType = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Vehicle type ID is required' });
    }

    const vehicleType = await VehicleType.unscoped().findByPk(id);

    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    if (!vehicleType.isDeleted) {
      return res.status(400).json({ message: 'Vehicle type is already active' });
    }

    await vehicleType.update({ isDeleted: false });

    res.status(200).json({
      message: 'Vehicle type restored successfully',
      data: { vehicleTypeId: id }
    });

  } catch (err) {
    console.error('Error restoring vehicle type:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getVehicleTypeWithVehicles = async (req: Request, res: Response) => {
  try {
    const vehicleTypes = await VehicleType.findAll({
      attributes: [
        "vehicleTypeId",
        "vehicleType",
        "priorMinutes",
        "seatCapacity",
        
      ],
      include: [
        {
          model: Vehicle,
          attributes: [
            "vehicleId",
            "vehicleName",
            "vehicleImg",
            "localPerHour",
            "localPerKm",
            "OutstationPerKm",
            "OSDriverBata",
            "availableStatus",
          ],
          where: { isDeleted: false },
          required: false, // Include even if no vehicles exist
        },
      ],
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
    });

    if (!vehicleTypes.length) {
      return res.status(404).json({ message: "No vehicle types found" });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle types with vehicles fetched successfully",
      data: vehicleTypes,
    });
  } catch (error: any) {
    console.error("Error fetching vehicle types:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vehicle data",
      error: error.message,
    });
  }
};

export const getAllVehicleTypeByType = async (req: Request, res: Response) => {
  try {
    const { status, bookingType } = req.query as {
      status?: string;
      bookingType?: string;
    };

    // ✅ status filter
    const whereClause: any = status === "1"
      ? { isDeleted: true }
      : { isDeleted: false };

    // ✅ bookingType filter (default = regular)
    const bt = (bookingType || "regular").toString().trim().toLowerCase();
    whereClause.bookingType = bt; // "regular" or "monthly"

    const vehicleTypes = await VehicleType.unscoped().findAll({
      where: whereClause,
      include: [
        { model: Vehicle, as: "vehicle", required: false },
        { model: Drivers, as: "drivers", required: false },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Vehicle types fetched successfully",
      data: vehicleTypes,
    });
  } catch (error) {
    console.error("Error fetching vehicle types:", error);
    return res.status(500).json({ message: "Failed to fetch vehicle types", error });
  }
};