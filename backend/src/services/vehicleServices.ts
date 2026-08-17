import { Response } from 'express';
import { Vehicle } from '../models/vehicle';
import { VehicleType } from '../models/vehicleType';
// import { Vendor } from '../models/vendor';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;
import { VEHICLESTATUS } from '../utils/costants';
import { Booking, Drivers, VehicleMaster } from '../models';
const{STATUS} = VEHICLESTATUS
import { ORDER } from '../utils/costants';
import { PackageData } from '../models/packageData';
import { Tax } from '../models/tax';
import { Company } from '../models/company';
import { Request} from 'express';
import { Op } from 'sequelize';
import { Invoice } from '../models/invoice';
import { ClosePending } from '../models/closepending';


// GET All Vehicles


// GET All Vehicles (Updated)
export const getAllVehiclesForWeb = async (req: any, res: Response) => {
    try {
        const role = req.role;
        if (role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        const { isDeleted } = req.query; // Use 'isDeleted' from the query string
        let vehicles;

        if (isDeleted === '1') {
            // Fetch soft-deleted vehicles (trashed)
            vehicles = await Vehicle.unscoped().findAll({
                where: { isDeleted: true },
        include: [
          {
            model: Drivers,
            as: 'driver',
            required: false, // LEFT JOIN -> even if no driver
          },
        ],
            });
        } else {
            // Fetch active vehicles by default
            vehicles = await Vehicle.findAll({
                include: [
          {
            model: Drivers,
            as: 'driver',
            required: false, // LEFT JOIN
          },
        ]
            });
        }

        res.status(200).json({
            message: 'Vehicles retrieved successfully',
            count: vehicles.length,
            vehicles
        });
    } catch (err) {
        console.error('Error fetching vehicles:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//response changed based on app(mobile.) if any change need for use above api
export const getAllVehicles = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { isDeleted } = req.query;
    let vehicles;

    const includeOptions = [
      {
        model: VehicleType,
        as: "vehicleType",
        required: false,
        include: [
          {
            model: Drivers,
            as: "drivers",
            required: false,
          },
        ],
      },
      {
        model: VehicleMaster,
        as: "vehicleMaster", // this should match the HasOne alias
        required: false,
        attributes: ['vehicleNumber'], // only fetch vehicleNumber
      },
    ];

    if (isDeleted === "1") {
      // Fetch soft-deleted vehicles
      vehicles = await Vehicle.unscoped().findAll({
        where: { isDeleted: true },
        include: includeOptions,
      });
    } else {
      // Fetch active vehicles
      vehicles = await Vehicle.findAll({
        include: includeOptions,
      });
    }

    res.status(200).json({
      message: "Vehicles retrieved successfully",
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ... (existing getVehicleById, updateVehicle, updateVehicleStatus functions)

// NEW: Soft Delete Vehicle
export const softDeleteVehicle = async (req: any, res: Response) => {
    const { vehicleId } = req.params;

    try {
        const role = req.role;
        if (role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        await vehicle.update({ isDeleted: true });

        res.status(200).json({
            message: 'Vehicle moved to trash successfully',
            vehicleId
        });
    } catch (err) {
        console.error('Error soft-deleting vehicle:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// RESTORE Vehicle (Updated to use the new endpoint)
export const restoreVehicle = async (req: any, res: Response) => {
    const { vehicleId } = req.params;

    try {
        const role = req.role;
        if (role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        // Find the vehicle regardless of its `isDeleted` status
        const vehicle = await Vehicle.unscoped().findByPk(vehicleId); 
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        await vehicle.update({ isDeleted: false });

        res.status(200).json({
            message: 'Vehicle restored successfully',
            vehicleId
        });
    } catch (err) {
        console.error('Error restoring vehicle:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PERMANENT DELETE Vehicle (Updated to use hard delete)
export const deleteVehicle = async (req: any, res: Response) => {
    const { vehicleId } = req.params;

    try {
        const role = req.role;
        if (role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        // Use `destroy` to permanently delete the record
        const rowsDeleted = await Vehicle.destroy({
            where: { vehicleId }
        });

        if (rowsDeleted === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json({
            message: 'Vehicle permanently deleted successfully',
            vehicleId
        });
    } catch (err) {
        console.error('Error permanently deleting vehicle:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET Vehicle by ID
export const getVehicleById = async (req: any, res: Response) => {
    const { vehicleId } = req.params;

    try {
        const role = req.role;
           if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

        const vehicle = await Vehicle.findByPk(vehicleId,{
      include: [
        {
          model: Drivers,
          as: "drivers", 
          //attributes: ["id", "driverName"],
          required: false, 
        },
      ],
    });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle retrieved successfully', vehicle });
    } catch (err) {
        console.error('Error fetching vehicle:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// UPDATE Vehicle
export const updateVehicle = async (req: any, res: Response) => {
    const { vehicleId } = req.params;
    const updateData = req.body;

     const newImages = req.files ? (req.files as Express.Multer.File[]).map(f => f.filename) : [];


    try {
        const role = req.role;
        if (role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

           if (newImages.length > 0) {
      updateData.vehicleImg = newImages;
    }

        if (updateData.vehicleName && updateData.vehicleName !== vehicle.vehicleName) {
            const existing = await Vehicle.findOne({
                where: { vehicleName: updateData.vehicleName }
            });
            if (existing) {
                return res.status(400).json({ message: 'Vehicle name already exists' });
            }
        }

        await vehicle.update(updateData);

        const updatedVehicle = await Vehicle.findByPk(vehicleId);

        res.status(200).json({
            message: 'Vehicle updated successfully',
            vehicle: updatedVehicle
        });
    } catch (err) {
        console.error('Error updating vehicle:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// UPDATE Vehicle Status (Separate function for status updates only)
export const updateVehicleStatus = async (req: any, res: Response) => {
  const { vehicleId } = req.params;
  const { availableStatus } = req.body;
  
  try {
    const role = req.role;
       if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!availableStatus) {
      return res.status(400).json({ message: 'Available status is required' });
    }

    // Validate status using constants
    const validStatuses = Object.values(VEHICLESTATUS.STATUS);
    if (!validStatuses.includes(availableStatus)) {
      return res.status(400).json({ 
        message: `Invalid status. Valid options: ${validStatuses.join(', ')}`,
        validStatuses: validStatuses
      });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.update({ availableStatus });

    res.status(200).json({ 
      message: 'Vehicle status updated successfully', 
      vehicleId: vehicleId,
      availableStatus,
    });
  } catch (err) {
    console.error('Error updating vehicle status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// GET Available Vehicles
export const getAvailableVehicles = async (req: any, res: Response) => {
    try {
        const vehicles = await Vehicle.findAll({
            where: { availableStatus: 'AVAILABLE' },
        });

        res.status(200).json({
            message: 'Available vehicles retrieved successfully',
            count: vehicles.length,
            vehicles
        });
    } catch (err) {
        console.error('Error fetching available vehicles:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAssignedTrip = async (req: any, res: Response) => {
    try {
     
    const bookings = await Booking.findAll({ where: { 
       //  bookingStatus: ORDER.STATUS.CONFIRMED,
        confirmStatus: ORDER.STATUS.CONFIRMED 
    },
      include: [{
          model: Drivers,
          as: 'driver', required: false,
         attributes: [ 'driverName' ], 
        },
      ],});
    
    res.status(200).json({
      message: 'Bookings retrieved successfully for driver',
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving BookingOrder',
      error: error.message,
    });
  }
};



// Get Vehicle Type by ID
export const getVehiclesByVehileTypeId = async (req: any, res: Response) => {
  const { id } = req.params;
  
  try {
    if (!id) {
      return res.status(400).json({ message: 'Vehicle type ID is required' });
    }

    const vehicles = await Vehicle.findAll({  where: { vehicleTypeId: id },             include: [
          {
            model: Drivers,
            as: 'driver',
            required: false, 
          },
        ] });
    
    if (!vehicles) {
      return res.status(404).json({ message: 'Vehicles not found' });
    }

    res.status(200).json({
      message: 'Vehicles retrieved successfully',
      data: vehicles
    });

  } catch (err) {
    console.error('Error fetching vehicle type:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get Vehicle Type by ID
// Get Vehicle Type by ID  //response changed based on app(mobile.) if any change need use another api
export const getVehiclesByVehicleTypeForWeb = async (req: any, res: Response) => {
  const { vehicleTypeId } = req.params;

  try {
    if (!vehicleTypeId) {
      return res.status(400).json({ message: "Vehicle type ID is required" });
    }

    const vehicles = await Vehicle.findAll({
      where: { vehicleTypeId },
      include: [
        {
          model: VehicleType,
          as: "vehicleType",
          required: false,
          include: [
            {
              model: Drivers,
              as: "drivers",
              required: false,
            },
          ],
        },
      ],
    });

    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({ message: "Vehicles not found" });
    }

    const result = vehicles.map((v: any) => {
      const drivers = v.vehicleType?.drivers || [];
      return {
        ...v.toJSON(),
        drivers,
      };
    });

    res.status(200).json({
      message: "Vehicles retrieved successfully for the specified type",
      count: result.length,
      vehicles: result,
    });
  } catch (err) {
    console.error("Error fetching vehicle type:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVehiclesByVehicleType = async (req: any, res: Response) => {
  try {
    const { vehicleTypeId } = req.params;

    if (!vehicleTypeId || !isUuid(vehicleTypeId)) {
      return res.status(400).json({ message: "Invalid vehicleTypeId" });
    }

    // ✅ ensure vehicle type exists (DefaultScope applies: isDeleted=false)
    const vt = await VehicleType.findByPk(vehicleTypeId);
    if (!vt) {
      return res.status(404).json({ message: "Vehicle type not found" });
    }

    // ✅ Fetch all vehicle masters under this vehicleTypeId
    const rows = await VehicleMaster.findAll({
      where: {
        vehicleTypeId,
        isDeleted: 0, // VehicleMaster isDeleted is INTEGER in your model
      },
      attributes: [
        "vehicleMasterId",
        "vehicleTypeId",
        "vehicleModelName",
        "vehicleNumber",
        "vehicleId",
      ],
      order: [
        ["vehicleModelName", "ASC"],
        ["vehicleNumber", "ASC"],
      ],
    });

    // ✅ Flat list (model repeats for each vehicle number)
    const vehicles = rows.map((r) => ({
       vehicleId: r.vehicleId,
         vehicleName: r.vehicleModelName,
               vehicleTypeId: r.vehicleTypeId,
      vehicleMasterId: r.vehicleMasterId,

    
      vehicleNumber: r.vehicleNumber,
     
    }));

    // ✅ Grouped list (model -> vehicle numbers array)
    const groupedMap: Record<string, any[]> = {};
    for (const r of rows) {
      const key = r.vehicleModelName || "Unknown Model";
      if (!groupedMap[key]) groupedMap[key] = [];
      groupedMap[key].push({
        vehicleMasterId: r.vehicleMasterId,
        vehicleNumber: r.vehicleNumber,
        vehicleId: r.vehicleId,
      });
    }

    // const grouped = Object.keys(groupedMap).map((modelName) => ({
    //   vehicleModelName: modelName,
    //   vehicles: groupedMap[modelName],
    //   count: groupedMap[modelName].length,
    // }));

    return res.status(200).json({
      message: "Vehicle models fetched successfully",
      // vehicleType: {
      //   vehicleTypeId: vt.vehicleTypeId,
      //   vehicleType: vt.vehicleType,
      // },
      count: rows.length,
      // ✅ UI needs flat rows -> show model name repeated + vehicle number
      vehicles
      // ✅ UI needs grouped dropdown style
    //  grouped,
    });
  } catch (err) {
    console.error("getVehicleModelsByTypeId error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getPackagesByVehicleType = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, pickupPoint, companyId } = req.query as any;

    if (!vehicleTypeId || !pickupPoint || !companyId) {
      return res.status(400).json({
        success: false,
        message: "vehicleTypeId, pickupPoint, and companyId are required",
      });
    }

    const norm = (s: any) => String(s || "").replace(/\s+/g, "").toLowerCase();

    const safeJson = (v: any) => {
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      return v;
    };

    const pickVehicleRow = (vehiclesObj: any, vehicleTypeName: string) => {
      if (!vehiclesObj || typeof vehiclesObj !== "object") return null;
      const wanted = String(vehicleTypeName || "").toLowerCase();
      const key = Object.keys(vehiclesObj).find((k) => k.toLowerCase() === wanted);
      return key ? vehiclesObj[key] : null;
    };

    // ✅ helper: get sorted package keys package1..packageN from defs
    const getSortedPackageKeys = (defs: any) => {
      const keys = Object.keys(defs || {}).filter((k) => /^package\d+$/i.test(k));
      keys.sort((a, b) => {
        const na = Number(String(a).toLowerCase().replace("package", ""));
        const nb = Number(String(b).toLowerCase().replace("package", ""));
        return na - nb;
      });
      return keys;
    };

    // ✅ vehicle type
    const vehicleType = await VehicleType.findOne({
      where: { vehicleTypeId },
      attributes: ["vehicleTypeId", "vehicleType", "bookingType"],
    });

    if (!vehicleType) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle type not found" });
    }

    // ✅ read package records for this company
    const all = await PackageData.findAll({
      where: { companyId, isDeleted: false },
      attributes: ["packageDataId", "packageType", "packages", "companyId"],
      order: [["createdAt", "DESC"]],
    });

    const pickup = norm(pickupPoint);
    const isOut = pickup.includes("outstation");
    const isLocal = pickup.includes("local");
    const isMonthly =
      pickup.includes("monthly") ||
      pickup.includes("monthlybooking") ||
      pickup.includes("monthlybookings");

    const filtered = all.filter((pkg: any) => {
      const t = norm(pkg.packageType);

      if (isOut) return t.includes("outstation");
      if (isLocal) return t.includes("local");
      if (isMonthly) return t.includes("monthlybookings");
      return false;
    });

    const formattedPackages = filtered.map((pkg: any) => {
      const parsed = safeJson(pkg.packages) || {};
      const vehiclesObj = parsed.vehicles || {};
      const row = pickVehicleRow(vehiclesObj, vehicleType.vehicleType);

      /* ✅ OUT STATION */
      if (isOut) {
        return {
          packageDataId: pkg.packageDataId,
          packageType: pkg.packageType,
          companyId: pkg.companyId,
          vehicleType: vehicleType.vehicleType,
          outstation: {
            perKm: Number(row?.perKm ?? 0),
            driverBattaPerDay: Number(row?.driverBattaPerDay ?? 0),
            minimumKmPerDay: Number(row?.minimumKmPerDay ?? 0),
          },
        };
      }

      /* ✅ MONTHLY BOOKINGS (dynamic) */
   /* ✅ MONTHLY BOOKINGS (dynamic) */
if (isMonthly) {
  const defs = parsed.packageDefinitions || {};
  const pkgKeys = getSortedPackageKeys(defs);

  const getDef = (id: string) => ({
    hours: Number(defs?.[id]?.hours ?? 0), // stored as hours (you treat as days)
    km: Number(defs?.[id]?.km ?? 0),
  });

  const packagesArr = pkgKeys.map((id) => {
    const n = Number(String(id).toLowerCase().replace("package", ""));
    return {
      packageId: id,
      title: `Package ${Number.isFinite(n) ? n : id}`,
      ...getDef(id),
      amount: Number((row as any)?.[id] ?? 0),
    };
  });

  return {
    packageDataId: pkg.packageDataId,
    packageType: pkg.packageType,
    companyId: pkg.companyId,
    vehicleType: vehicleType.vehicleType,
    monthlyBookings: {
      packageDefinitions: defs,
      packages: packagesArr,
      extraKm: Number((row as any)?.extraKm ?? 0),   // ✅ ADD THIS
      extraHour: Number((row as any)?.extraHour ?? 0),
    },
  };
}


      /* ✅ LOCAL CITY (dynamic) */
      const defs = parsed.packageDefinitions || {};
      const pkgKeys = getSortedPackageKeys(defs);

      const getDef = (id: string) => ({
        hours: Number(defs?.[id]?.hours ?? 0),
        km: Number(defs?.[id]?.km ?? 0),
      });

      const packagesArr = pkgKeys.map((id) => {
        const n = Number(String(id).toLowerCase().replace("package", ""));
        return {
          packageId: id,
          title: `Package ${Number.isFinite(n) ? n : id}`,
          ...getDef(id),
          amount: Number((row as any)?.[id] ?? 0), // ✅ dynamic amount access
        };
      });

      return {
        packageDataId: pkg.packageDataId,
        packageType: pkg.packageType,
        companyId: pkg.companyId,
        vehicleType: vehicleType.vehicleType,
        localCity: {
          packageDefinitions: defs,
          packages: packagesArr, // ✅ now shows package1..packageN
          extraKm: Number(row?.extraKm ?? 0),
          extraHour: Number(row?.extraHour ?? 0),
        },
      };
    });

    // taxes (same as before)
    let taxDetails = null;
    const company = await Company.findOne({ where: { companyId } });
    if (
      company?.allowTax &&
      (String(company.allowTax).toLowerCase() === "yes" ||
        String(company.allowTax) === "true")
    ) {
      taxDetails = await Tax.findAll({
        where: { isActive: true },
        attributes: ["taxId", "taxName", "taxPercent"],
      });
    }

    return res.json({
      success: true,
      vehicleType,
      packages: formattedPackages,
      tax: taxDetails,
    });
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// export const getPackagesByVehicleType = async (req: Request, res: Response) => {
//   try {
//     const { vehicleTypeId, pickupPoint, companyId } = req.query as any;

//     if (!vehicleTypeId || !pickupPoint || !companyId) {
//       return res.status(400).json({
//         success: false,
//         message: "vehicleTypeId, pickupPoint, and companyId are required",
//       });
//     }

//     const norm = (s: any) => String(s || "").replace(/\s+/g, "").toLowerCase();
//     const safeJson = (v: any) => {
//       if (!v) return null;
//       if (typeof v === "string") {
//         try { return JSON.parse(v); } catch { return null; }
//       }
//       return v;
//     };

//     const pickVehicleRow = (vehiclesObj: any, vehicleTypeName: string) => {
//       if (!vehiclesObj || typeof vehiclesObj !== "object") return null;
//       const wanted = String(vehicleTypeName || "").toLowerCase();
//       const key = Object.keys(vehiclesObj).find((k) => k.toLowerCase() === wanted);
//       return key ? vehiclesObj[key] : null;
//     };

//     // ✅ vehicle type
//     const vehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId },
//       attributes: ["vehicleTypeId", "vehicleType", "bookingType"], // bookingType optional
//     });

//     if (!vehicleType) {
//       return res.status(404).json({ success: false, message: "Vehicle type not found" });
//     }

//     // ✅ read package records for this company
//     const all = await PackageData.findAll({
//       where: { companyId, isDeleted: false },
//       attributes: ["packageDataId", "packageType", "packages", "companyId"],
//       order: [["createdAt", "DESC"]],
//     });

//     const pickup = norm(pickupPoint); // "local" or "outstation" or "monthly"
//     const isOut = pickup.includes("outstation");
//     const isLocal = pickup.includes("local");
//     const isMonthly =
//       pickup.includes("monthly") || pickup.includes("monthlybooking") || pickup.includes("monthlybookings");

//     const filtered = all.filter((pkg: any) => {
//       const t = norm(pkg.packageType);

//       if (isOut) return t.includes("outstation");
//       if (isLocal) return t.includes("local");
//       if (isMonthly) return t.includes("monthlybookings"); // ✅ Monthly Bookings
//       return false;
//     });

//     const formattedPackages = filtered.map((pkg: any) => {
//       const parsed = safeJson(pkg.packages) || {};
//       const vehiclesObj = parsed.vehicles || {};
//       const row = pickVehicleRow(vehiclesObj, vehicleType.vehicleType);

//       /* ✅ OUT STATION */
//       if (isOut) {
//         return {
//           packageDataId: pkg.packageDataId,
//           packageType: pkg.packageType,
//           companyId: pkg.companyId,
//           vehicleType: vehicleType.vehicleType,
//           outstation: {
//             perKm: Number(row?.perKm ?? 0),
//             driverBattaPerDay: Number(row?.driverBattaPerDay ?? 0),
//             minimumKmPerDay: Number(row?.minimumKmPerDay ?? 0),
//           },
//         };
//       }

//       /* ✅ MONTHLY BOOKINGS */
//       if (isMonthly) {
//         const defs = parsed.packageDefinitions || {};
//         const getDef = (id: string) => ({
//           hours: Number(defs?.[id]?.hours ?? 0), // you can treat as days also
//           km: Number(defs?.[id]?.km ?? 0),
//         });

//         return {
//           packageDataId: pkg.packageDataId,
//           packageType: pkg.packageType,
//           companyId: pkg.companyId,
//           vehicleType: vehicleType.vehicleType,
//           monthlyBookings: {
//             packageDefinitions: defs,
//             packages: [
//               { packageId: "package1", title: "Package 1", ...getDef("package1"), amount: Number(row?.package1 ?? 0) },
//               { packageId: "package2", title: "Package 2", ...getDef("package2"), amount: Number(row?.package2 ?? 0) },
//               { packageId: "package3", title: "Package 3", ...getDef("package3"), amount: Number(row?.package3 ?? 0) },
//               { packageId: "package4", title: "Package 4", ...getDef("package4"), amount: Number(row?.package4 ?? 0) },
//               { packageId: "package5", title: "Package 5", ...getDef("package5"), amount: Number(row?.package5 ?? 0) },
//               { packageId: "package6", title: "Package 6", ...getDef("package6"), amount: Number(row?.package6 ?? 0) },
//               { packageId: "package7", title: "Package 7", ...getDef("package7"), amount: Number(row?.package7 ?? 0) },
//               { packageId: "package8", title: "Package 8", ...getDef("package8"), amount: Number(row?.package8 ?? 0) },
//             ],
//             extraHour: Number(row?.extraHour ?? 0), // ✅ only extraHour
//           },
//         };
//       }

//       /* ✅ LOCAL CITY (default) */
//       const defs = parsed.packageDefinitions || {};
//       const getDef = (id: string) => ({
//         hours: Number(defs?.[id]?.hours ?? 0),
//         km: Number(defs?.[id]?.km ?? 0),
//       });

//       return {
//         packageDataId: pkg.packageDataId,
//         packageType: pkg.packageType,
//         companyId: pkg.companyId,
//         vehicleType: vehicleType.vehicleType,
//         localCity: {
//           packageDefinitions: defs,
//           packages: [
//             { packageId: "package1", title: "Package 1", ...getDef("package1"), amount: Number(row?.package1 ?? 0) },
//             { packageId: "package2", title: "Package 2", ...getDef("package2"), amount: Number(row?.package2 ?? 0) },
//             { packageId: "package3", title: "Package 3", ...getDef("package3"), amount: Number(row?.package3 ?? 0) },
//             { packageId: "package4", title: "Package 4", ...getDef("package4"), amount: Number(row?.package4 ?? 0) },
//           ],
//           extraKm: Number(row?.extraKm ?? 0),
//           extraHour: Number(row?.extraHour ?? 0),
//         },
//       };
//     });

//     // taxes (same as before)
//     let taxDetails = null;
//     const company = await Company.findOne({ where: { companyId } });
//     if (
//       company?.allowTax &&
//       (String(company.allowTax).toLowerCase() === "yes" || String(company.allowTax) === "true")
//     ) {
//       taxDetails = await Tax.findAll({
//         where: { isActive: true },
//         attributes: ["taxId", "taxName", "taxPercent"],
//       });
//     }

//     return res.json({
//       success: true,
//       vehicleType,
//       packages: formattedPackages,
//       tax: taxDetails,
//     });
//   } catch (error: any) {
//     console.error("Error fetching packages:", error);
//     return res.status(500).json({ success: false, message: error.message || "Internal server error" });
//   }
// };
// export const getPackagesByVehicleType = async (req: Request, res: Response) => {
//   try {
//     const { vehicleTypeId, pickupPoint, companyId } = req.query as any;

//     if (!vehicleTypeId || !pickupPoint || !companyId) {
//       return res.status(400).json({
//         success: false,
//         message: "vehicleTypeId, pickupPoint, and companyId are required",
//       });
//     }

//     const norm = (s: any) => String(s || "").replace(/\s+/g, "").toLowerCase();
//     const safeJson = (v: any) => {
//       if (!v) return null;
//       if (typeof v === "string") {
//         try { return JSON.parse(v); } catch { return null; }
//       }
//       return v;
//     };

//     const pickVehicleRow = (vehiclesObj: any, vehicleTypeName: string) => {
//       if (!vehiclesObj || typeof vehiclesObj !== "object") return null;
//       const wanted = String(vehicleTypeName || "").toLowerCase();
//       const key = Object.keys(vehiclesObj).find((k) => k.toLowerCase() === wanted);
//       return key ? vehiclesObj[key] : null;
//     };

//     // ✅ vehicle type
//     const vehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId },
//       attributes: ["vehicleTypeId", "vehicleType"],
//     });

//     if (!vehicleType) {
//       return res.status(404).json({ success: false, message: "Vehicle type not found" });
//     }

//     // ✅ read package records for this company
//     const all = await PackageData.findAll({
//       where: { companyId, isDeleted: false },
//       attributes: ["packageDataId", "packageType", "packages", "companyId"],
//       order: [["createdAt", "DESC"]],
//     });

//     const pickup = norm(pickupPoint); // "local" or "outstation"
//     const isOut = pickup.includes("outstation");
//     const isLocal = pickup.includes("local");

//     const filtered = all.filter((pkg: any) => {
//       const t = norm(pkg.packageType);
//       if (isOut) return t.includes("outstation");
//       if (isLocal) return t.includes("local"); // localcityuse / airport... / etc
//       return false;
//     });

//     const formattedPackages = filtered.map((pkg: any) => {
//       const parsed = safeJson(pkg.packages) || {};
//       const vehiclesObj = parsed.vehicles || {};
//       const row = pickVehicleRow(vehiclesObj, vehicleType.vehicleType);

//       if (isOut) {
//         return {
//           packageDataId: pkg.packageDataId,
//           packageType: pkg.packageType,
//           companyId: pkg.companyId,
//           vehicleType: vehicleType.vehicleType,
//           outstation: {
//             perKm: Number(row?.perKm ?? 0),
//             driverBattaPerDay: Number(row?.driverBattaPerDay ?? 0),
//             minimumKmPerDay: Number(row?.minimumKmPerDay ?? 0),
//           },
//         };
//       }

//       // local city
//       const defs = parsed.packageDefinitions || {};
//       const getDef = (id: string) => ({
//         hours: Number(defs?.[id]?.hours ?? 0),
//         km: Number(defs?.[id]?.km ?? 0),
//       });

//       return {
//         packageDataId: pkg.packageDataId,
//         packageType: pkg.packageType,
//         companyId: pkg.companyId,
//         vehicleType: vehicleType.vehicleType,
//         localCity: {
//           packageDefinitions: defs,
//           packages: [
//             { packageId: "package1", title: "Package 1", ...getDef("package1"), amount: Number(row?.package1 ?? 0) },
//             { packageId: "package2", title: "Package 2", ...getDef("package2"), amount: Number(row?.package2 ?? 0) },
//             { packageId: "package3", title: "Package 3", ...getDef("package3"), amount: Number(row?.package3 ?? 0) },
//             { packageId: "package4", title: "Package 4", ...getDef("package4"), amount: Number(row?.package4 ?? 0) },
//           ],
//           extraKm: Number(row?.extraKm ?? 0),
//           extraHour: Number(row?.extraHour ?? 0),
//         },
//       };
//     });

//     // taxes (same as before)
//     let taxDetails = null;
//     const company = await Company.findOne({ where: { companyId } });
//     if (company?.allowTax && (String(company.allowTax).toLowerCase() === "yes" || String(company.allowTax) === "true")) {
//       taxDetails = await Tax.findAll({
//         where: { isActive: true },
//         attributes: ["taxId", "taxName", "taxPercent"],
//       });
//     }

//     return res.json({
//       success: true,
//       vehicleType,
//       packages: formattedPackages,
//       tax: taxDetails,
//     });
//   } catch (error: any) {
//     console.error("Error fetching packages:", error);
//     return res.status(500).json({ success: false, message: error.message || "Internal server error" });
//   }
// };
const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const getVehicleModelsByTypeId = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId } = req.params;

    if (!vehicleTypeId || !isUuid(vehicleTypeId)) {
      return res.status(400).json({ message: "Invalid vehicleTypeId" });
    }

    // ✅ ensure vehicle type exists (DefaultScope applies: isDeleted=false)
    const vt = await VehicleType.findByPk(vehicleTypeId);
    if (!vt) {
      return res.status(404).json({ message: "Vehicle type not found" });
    }

    // ✅ Fetch all vehicle masters under this vehicleTypeId
    const rows = await VehicleMaster.findAll({
      where: {
        vehicleTypeId,
        isDeleted: 0, // VehicleMaster isDeleted is INTEGER in your model
      },
      attributes: [
        "vehicleMasterId",
        "vehicleTypeId",
        "vehicleModelName",
        "vehicleNumber",
        "vehicleId",
      ],
      order: [
        ["vehicleModelName", "ASC"],
        ["vehicleNumber", "ASC"],
      ],
    });

    // ✅ Flat list (model repeats for each vehicle number)
    const items = rows.map((r) => ({
      vehicleMasterId: r.vehicleMasterId,
      vehicleTypeId: r.vehicleTypeId,
      vehicleModelName: r.vehicleModelName,
      vehicleNumber: r.vehicleNumber,
      vehicleId: r.vehicleId,
    }));

    // ✅ Grouped list (model -> vehicle numbers array)
    const groupedMap: Record<string, any[]> = {};
    for (const r of rows) {
      const key = r.vehicleModelName || "Unknown Model";
      if (!groupedMap[key]) groupedMap[key] = [];
      groupedMap[key].push({
        vehicleMasterId: r.vehicleMasterId,
        vehicleNumber: r.vehicleNumber,
        vehicleId: r.vehicleId,
      });
    }

    const grouped = Object.keys(groupedMap).map((modelName) => ({
      vehicleModelName: modelName,
      vehicles: groupedMap[modelName],
      count: groupedMap[modelName].length,
    }));

    return res.status(200).json({
      message: "Vehicle models fetched successfully",
      vehicleType: {
        vehicleTypeId: vt.vehicleTypeId,
        vehicleType: vt.vehicleType,
      },
      total: rows.length,
      // ✅ UI needs flat rows -> show model name repeated + vehicle number
      items,
      // ✅ UI needs grouped dropdown style
      grouped,
    });
  } catch (err) {
    console.error("getVehicleModelsByTypeId error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
// export const getPackagesByVehicleType = async (req: Request, res: Response) => {
//   try {
//     const { vehicleTypeId, pickupPoint, companyId } = req.query;

//     if (!vehicleTypeId || !pickupPoint || !companyId) {
//       return res.status(400).json({ message: "vehicleTypeId, pickupPoint, and companyId are required" });
//     }

//     //  Fetch VehicleType
//     const vehicleType = await VehicleType.findOne({
//       where: { vehicleTypeId },
//       attributes: ["vehicleTypeId", "vehicleType"],
//     });

//     if (!vehicleType) {
//       return res.status(404).json({ message: "Vehicle type not found" });
//     }

//     //  Fetch vehicle (to get default rates if package doesn't have)
//     const vehicle = await Vehicle.findOne({
//       where: { vehicleTypeId },
//       attributes: [
//         "vehicleId",
//         "vehicleName",
//         "localPerHour",
//         "localPerKm",
//         "OutstationPerKm",
//         // "OSDriverBata",
//         "vehicleTypeId",
//       ],
//     });

//     //  Fetch packages for the company
//     const packages = await PackageData.findAll({
//       where: { companyId },
//       attributes: ["packageDataId", "packageType", "packages", "companyId"],
//     });

//     const normalizedPickup = String(pickupPoint).replace(/\s+/g, "").toLowerCase();

//     //  Filter packages by pickupPoint
//     const filteredPackages = packages.filter((pkg) => {
//       const normalizedType = pkg.packageType.replace(/\s+/g, "").toLowerCase();
//       if (normalizedPickup === "outstation") return normalizedType.includes("outstation");
//       if (normalizedPickup.includes("local")) return normalizedType.includes("localcity");
//       return false;
//     });

//     //  Format packages
//     const formattedPackages = filteredPackages.map((pkg) => {
//       let parsed: any[] = [];
//       try {
//         parsed = JSON.parse(pkg.packages);
//       } catch (err) {
//         console.error("Invalid JSON in packageData", pkg.packageDataId);
//       }

//       const matched = parsed.map((p: any) => {
//         const amount = p[vehicleType.vehicleType] ?? vehicle?.localPerKm ?? 0;

//         if (normalizedPickup === "outstation") {
//           return {
//             outstationPerKm: p.OutstationPerKm ?? vehicle?.OutstationPerKm ?? null,
//             // osDriverBata: p.OSDriverBata ?? vehicle?.OSDriverBata ?? null,
//             amount,
//           };
//         } else {
//           return {
//             localPerKm: p.localPerKm ?? vehicle?.localPerKm ?? null,
//             localPerHour: p.localPerHour ?? vehicle?.localPerHour ?? null,
//             amount,
//           };
//         }
//       });

//       return {
//         packageDataId: pkg.packageDataId,
//         packageType: pkg.packageType,
//         companyId: pkg.companyId,
//         vehicleType: vehicleType.vehicleType,
//         packages: matched,
//       };
//     });

//     //  Optional: include taxes if company allows
//     let taxDetails = null;
//     const company = await Company.findOne({ where: { companyId } });
//     if (company?.allowTax && (company.allowTax.toLowerCase() === "yes" || company.allowTax === "true")) {
//       taxDetails = await Tax.findAll({
//         where: { isActive: true },
//         attributes: ["taxId", "taxName", "taxPercent"],
//       });
//     }

//     return res.json({ vehicleType, packages: formattedPackages, tax: taxDetails });
//   } catch (error: any) {
//     console.error("Error fetching packages:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };


export const getCompletedTrip = async (req: any, res: Response) => {
  try {
    const { driverId, startDate, endDate } = req.query;

    const whereCondition: any = {
      driverTripStatus: ORDER.STATUS.COMPLETED
    };

    // ✅ Date filter optional
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      whereCondition.bookingDate = {
        [Op.between]: [start, end]
      };
    }

    // ✅ Driver filter optional
    if (driverId) {
      whereCondition.driverId = driverId;
    }

    const bookings = await Booking.findAll({
      attributes: ['bookingCode', 'bookingDate'],
      where: whereCondition,
      include: [
        {
          model: Drivers,
          as: 'driver'
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['invoiceId', 'bookingId'],
          required: false,
          include: [
            {
              model: ClosePending,
              required: false,
              attributes: ['tripSheetNumber']
            }
          ]
        }
      ],
      order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']]
    });

    res.status(200).json({
      message: 'Trips fetched successfully',
      data: bookings,
    });

  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving BookingOrder',
      error: error.message,
    });
  }
};