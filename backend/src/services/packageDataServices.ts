
// // comment on 10/5 old code 
// import { Request, Response } from 'express';
// import { PackageData } from '../models';
// import { USERS } from "../utils/costants";
// const { ROLES } = USERS;
 
// // Helper function to extract km values from packages JSON
// const extractKmFromPackages = (packages: any): number[] => {
//     try {
//         if (typeof packages === 'string') {
//             packages = JSON.parse(packages);
//         }
 
//         const kmValues: number[] = [];
 
//         if (Array.isArray(packages)) {
//             packages.forEach(pkg => {
//                 if (pkg.localPerKm) {
//                     const val = parseInt(pkg.localPerKm);
//                     if (!isNaN(val)) kmValues.push(val);
//                 }
//                 if (pkg.OutstationPerKm) {
//                     const val = parseInt(pkg.OutstationPerKm);
//                     if (!isNaN(val)) kmValues.push(val);
//                 }
//                if (pkg.km) {
//     const val = parseInt(pkg.km);
//     if (!isNaN(val)) kmValues.push(val);
// }

//             });
//         } else if (typeof packages === 'object') {
//             Object.keys(packages).forEach(key => {
//                 if (
//                     key.toLowerCase().includes('localperkm') ||
//                     key.toLowerCase().includes('outstationperkm') ||
//                     key.toLowerCase().includes('km')
//                 ) {
//                     const val = parseInt(packages[key]);
//                     if (!isNaN(val)) kmValues.push(val);
//                 }
//             });
//         }
 
//         return kmValues;
//     } catch (error) {
//         console.error('Error extracting km values:', error);
//         return [];
//     }
// };
 
 
// // Create PackageData with KM validation
// export const createPackageData = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }
 
//         const { packageType, companyId, packages } = req.body;
 
//         // Validation
//         if (!packageType || !companyId || !packages) {
//             res.status(400).json({
//                 success: false,
//                 message: 'packageType, companyId, and packages are required fields'
//             });
//             return;
//         }
 
//         // Extract km values from the new packages
//         const newKmValues = extractKmFromPackages(packages);
 
//         if (newKmValues.length === 0) {
//             res.status(400).json({
//                 success: false,
//                 message: 'No valid km values found in packages'
//             });
//             return;
//         }
 
//         // Check for existing records with same packageType and companyId
//         const existingRecords = await PackageData.findAll({
//             where: {
//                 packageType,
//                 companyId,
//                 isDeleted: false // Assuming you have soft delete
//             }
//         });
 
//         // Check for duplicate km values in existing records
//         const duplicateKmValues: number[] = [];
//         let recordToUpdate: any = null;
 
//         for (const record of existingRecords) {
//             const existingKmValues = extractKmFromPackages(record.packages);
 
//             // Check if any new km values already exist
//             for (const newKm of newKmValues) {
//                 if (existingKmValues.includes(newKm)) {
//                     duplicateKmValues.push(newKm);
//                     recordToUpdate = record;
//                     break;
//                 }
//             }
//         }
 
//         // If duplicates found, update existing record instead of creating new one
//         if (duplicateKmValues.length > 0 && recordToUpdate) {
 
//             await recordToUpdate.update({
//                 packages: typeof packages === 'string' ? packages : JSON.stringify(packages)
//             });
 
 
//             const updatedRecord = await PackageData.findByPk(recordToUpdate.packageDataId);
 
//             res.status(200).json({
//                 success: true,
//                 message: `PackageData updated successfully. Duplicate km values found: ${duplicateKmValues.join(', ')}`,
//                 data: updatedRecord,
//                 action: 'updated'
//             });
//             return;
//         }
 
//         // No duplicates found, create new record
//         const newPackageData = await PackageData.create({
//             packageType,
//             companyId,
//             packages: typeof packages === 'string' ? packages : JSON.stringify(packages)
//         });
 
//         const createdPackageData = await PackageData.findByPk(newPackageData.packageDataId);
 
//         res.status(201).json({
//             success: true,
//             message: 'PackageData created successfully',
//             data: createdPackageData,
//             action: 'created'
//         });
 
//     } catch (error) {
//         console.error('Error creating/updating package data:', error);
 
//         // Handle specific Sequelize errors
//         if (error instanceof Error) {
//             if (error.name === 'SequelizeForeignKeyConstraintError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Invalid packageTypes or companyId provided'
//                 });
//                 return;
//             }
 
//             if (error.name === 'SequelizeValidationError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Validation error',
//                     details: error.message
//                 });
//                 return;
//             }
 
//             if (error.name === 'SequelizeUniqueConstraintError') {
//                 res.status(409).json({
//                     success: false,
//                     message: 'PackageData with this combination already exists'
//                 });
//                 return;
//             }
//         }
 
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// };
 
// // REMOVED: upsertPackageData function - not needed as createPackageData already handles upsert logic
 
// // Get single PackageData by ID
// export const getPackageDataById = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }
//         const { id } = req.params;
 
//         if (!id) {
//             res.status(400).json({
//                 success: false,
//                 message: 'PackageData ID is required'
//             });
//             return;
//         }
 
//         const packageData = await PackageData.findByPk(id);
 
//         if (!packageData) {
//             res.status(404).json({
//                 success: false,
//                 message: 'PackageData not found'
//             });
//             return;
//         }
 
//         // Parse the packages JSON string to object for better readability
//         const parsedPackageData = {
//             ...packageData.toJSON(),
//             packages: typeof packageData.packages === 'string'
//                 ? JSON.parse(packageData.packages)
//                 : packageData.packages
//         };
 
//         res.status(200).json({
//             success: true,
//             message: 'PackageData retrieved successfully',
//             data: parsedPackageData
//         });
 
//     } catch (error) {
//         console.error('Error fetching package data:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// };
 
// // Get all PackageData with optional filtering (No pagination)
// export const getAllPackageData = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }
//         const { packageType, companyId } = req.query;
 
//         const where: any = {};
//         if (packageType) where.packageType = packageType;
//         if (companyId) where.companyId = companyId;
 
//         const packageData = await PackageData.findAll({
//             where,
//             order: [['createdAt', 'DESC']]
//         });
 
//         // Parse packages JSON for all records
//         const parsedPackageData = packageData.map(item => ({
//             ...item.toJSON(),
//             packages: typeof item.packages === 'string'
//                 ? JSON.parse(item.packages)
//                 : item.packages
//         }));
 
//         res.status(200).json({
//             success: true,
//             message: 'PackageData retrieved successfully',
//             data: parsedPackageData,
//             total: parsedPackageData.length
//         });
 
//     } catch (error) {
//         console.error('Error fetching package data:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// };
 
// // Update PackageData
// export const updatePackageData = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }
//         const { id } = req.params;
//         const { packageType, companyId, packages } = req.body;
 
//         // Validation
//         if (!id) {
//             res.status(400).json({
//                 success: false,
//                 message: 'PackageData ID is required'
//             });
//             return;
//         }
 
//         // Check if PackageData exists
//         const existingPackageData = await PackageData.findByPk(id);
//         if (!existingPackageData) {
//             res.status(404).json({
//                 success: false,
//                 message: 'PackageData not found'
//             });
//             return;
//         }
 
//         // Prepare update data - only include fields that are provided
//         const updateData: any = {};
//         if (packageType !== undefined) updateData.packageType = packageType;
//         if (companyId !== undefined) updateData.companyId = companyId;
//         if (packages !== undefined) {
//             updateData.packages = typeof packages === 'string'
//                 ? packages
//                 : JSON.stringify(packages);
//         }
 
 
//         // Check if there's anything to update
//         if (Object.keys(updateData).length === 0) {
//             res.status(400).json({
//                 success: false,
//                 message: 'At least one field (packageType, companyId, or packages) is required for update'
//             });
//             return;
//         }
 
//         // Update the package data
//         await existingPackageData.update(updateData);
 
//         // Fetch the updated package data
//         const updatedPackageData = await PackageData.findByPk(id);
 
//         res.status(200).json({
//             success: true,
//             message: 'PackageData updated successfully',
//             data: updatedPackageData
//         });
 
//     } catch (error) {
//         console.error('Error updating package data:', error);
 
//         // Handle specific Sequelize errors
//         if (error instanceof Error) {
//             if (error.name === 'SequelizeForeignKeyConstraintError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Invalid companyId provided'
//                 });
//                 return;
//             }
 
//             if (error.name === 'SequelizeValidationError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Validation error',
//                     details: error.message
//                 });
//                 return;
//             }
 
//             if (error.name === 'SequelizeUniqueConstraintError') {
//                 res.status(409).json({
//                     success: false,
//                     message: 'PackageData with this combination already exists'
//                 });
//                 return;
//             }
//         }
 
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// };
 
// // Delete PackageData (Soft delete)
// export const deletePackageData = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }
//         const { id } = req.params;
 
//         if (!id) {
//             res.status(400).json({
//                 success: false,
//                 message: 'PackageData ID is required'
//             });
//             return;
//         }
 
//         // Check if PackageData exists
//         const packageData = await PackageData.unscoped().findByPk(id);
//         if (!packageData) {
//             res.status(404).json({
//                 success: false,
//                 message: 'PackageData not found'
//             });
//             return;
//         }
 
//         // Soft delete
//         await packageData.update({ isDeleted: true });
 
//         res.status(200).json({
//             success: true,
//             message: 'PackageData deleted successfully'
//         });
 
//     } catch (error) {
//         console.error('Error deleting package data:', error);
 
//         // Handle foreign key constraint errors (if other records reference this)
//         if (error instanceof Error && error.name === 'SequelizeForeignKeyConstraintError') {
//             res.status(400).json({
//                 success: false,
//                 message: 'Cannot delete PackageData as it is referenced by other records'
//             });
//             return;
//         }
 
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// };


// export const copyPackageData = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }

//         const { sourceCompanyId, targetCompanyId, packageType } = req.body;

//         // Validation
//         if (!sourceCompanyId || !targetCompanyId) {
//             res.status(400).json({
//                 success: false,
//                 message: 'sourceCompanyId and targetCompanyId are required fields'
//             });
//             return;
//         }

//         if (sourceCompanyId === targetCompanyId) {
//             res.status(400).json({
//                 success: false,
//                 message: 'Source and target company cannot be the same'
//             });
//             return;
//         }

//         // Build where clause dynamically
//         const whereClause: any = {
//             companyId: sourceCompanyId,
//             isDeleted: false
//         };
//         if (packageType) {
//             // only copy specific package type (e.g. LocalCity)
//             whereClause.packageType = packageType;
//         }

//         // Get all package data from source company
//         const sourcePackageData = await PackageData.findAll({
//             where: whereClause
//         });

//         if (sourcePackageData.length === 0) {
//             res.status(404).json({
//                 success: false,
//                 message: 'No package data found for the source company with given filters'
//             });
//             return;
//         }

//         // Check existing package data for target company
//         const targetWhereClause: any = {
//             companyId: targetCompanyId,
//             isDeleted: false
//         };
//         if (packageType) {
//             targetWhereClause.packageType = packageType;
//         }

//         const existingTargetData = await PackageData.findAll({
//             where: targetWhereClause
//         });

//         const copiedPackages = [];
//         const updatedPackages = [];
//         const skippedPackages = [];

//         for (const sourcePackage of sourcePackageData) {
//             try {
//                 // Extract km values from source package
//                 const sourceKmValues = extractKmFromPackages(sourcePackage.packages);

//                 // Check if similar package exists in target company
//                 const existingTargetPackage = existingTargetData.find(
//                     targetPkg => targetPkg.packageType === sourcePackage.packageType
//                 );

//                 if (existingTargetPackage) {
//                     // Check for km conflicts
//                     const existingKmValues = extractKmFromPackages(existingTargetPackage.packages);
//                     const hasConflict = sourceKmValues.some(km => existingKmValues.includes(km));

//                     if (hasConflict) {
//                         // Update existing package with merged data
//                         let mergedPackages =
//                             typeof sourcePackage.packages === 'string'
//                                 ? JSON.parse(sourcePackage.packages)
//                                 : sourcePackage.packages;

//                         await existingTargetPackage.update({
//                             packages:
//                                 typeof mergedPackages === 'string'
//                                     ? mergedPackages
//                                     : JSON.stringify(mergedPackages)
//                         });

//                         updatedPackages.push({
//                             packageType: sourcePackage.packageType,
//                             action: 'updated'
//                         });
//                     } else {
//                         // Create new package as no km conflicts
//                         const newPackageData = await PackageData.create({
//                             packageType: sourcePackage.packageType,
//                             companyId: targetCompanyId,
//                             packages:
//                                 typeof sourcePackage.packages === 'string'
//                                     ? sourcePackage.packages
//                                     : JSON.stringify(sourcePackage.packages)
//                         });

//                         copiedPackages.push({
//                             packageDataId: newPackageData.packageDataId,
//                             packageType: sourcePackage.packageType,
//                             action: 'created'
//                         });
//                     }
//                 } else {
//                     // No existing package, create new one
//                     const newPackageData = await PackageData.create({
//                         packageType: sourcePackage.packageType,
//                         companyId: targetCompanyId,
//                         packages:
//                             typeof sourcePackage.packages === 'string'
//                                 ? sourcePackage.packages
//                                 : JSON.stringify(sourcePackage.packages)
//                     });

//                     copiedPackages.push({
//                         packageDataId: newPackageData.packageDataId,
//                         packageType: sourcePackage.packageType,
//                         action: 'created'
//                     });
//                 }
//             } catch (packageError) {
//                 skippedPackages.push({
//                     packageDataId: sourcePackage.packageDataId,
//                     packageType: sourcePackage.packageType,
//                     error:
//                         packageError instanceof Error
//                             ? packageError.message
//                             : 'Unknown error'
//                 });
//             }
//         }

//         res.status(200).json({
//             success: true,
//             message: `Package data copied successfully from company ${sourceCompanyId} to company ${targetCompanyId}`,
//             data: {
//                 sourceCompanyId,
//                 targetCompanyId,
//                 totalSourcePackages: sourcePackageData.length,
//                 copiedPackages: copiedPackages.length,
//                 updatedPackages: updatedPackages.length,
//                 skippedPackages: skippedPackages.length,
//                 details: {
//                     copied: copiedPackages,
//                     updated: updatedPackages,
//                     skipped: skippedPackages
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error copying package data:', error);

//         // Handle specific Sequelize errors
//         if (error instanceof Error) {
//             if (error.name === 'SequelizeForeignKeyConstraintError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Invalid sourceCompanyId or targetCompanyId provided'
//                 });
//                 return;
//             }

//             if (error.name === 'SequelizeValidationError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Validation error',
//                     details: error.message
//                 });
//                 return;
//             }
//         }

//         res.status(500).json({
//             success: false,
//             message: 'Internal server error while copying package data'
//         });
//     }
// };


// comment on 10/5 old code 
import { Request, Response } from 'express';
import { PackageData } from '../models';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;
 
const extractKmFromPackages = (packages: any): number[] => {
  try {
    if (typeof packages === 'string') {
      packages = JSON.parse(packages);
    }

    const kmValues: number[] = [];

    if (packages?.vehicles && typeof packages.vehicles === 'object') {
      const vehicles = Object.values(packages.vehicles);

      vehicles.forEach((v: any) => {
        // Local City Use
        if (v.packageKm != null) {
          const val = parseInt(v.packageKm);
          if (!isNaN(val)) kmValues.push(val);
        }

        // Out Station
        if (v.minimumKmPerDay != null) {
          const val = parseInt(v.minimumKmPerDay);
          if (!isNaN(val)) kmValues.push(val);
        }
      });
    }

    return kmValues;
  } catch (error) {
    console.error('Error extracting km values:', error);
    return [];
  }
};
export const createPackageData = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { packageType, companyId, packages } = req.body;

    if (!packageType || !companyId || !packages) {
      return res.status(400).json({
        success: false,
        message: "packageType, companyId and packages are required",
      });
    }

// ✅ add to valid types
const validPackageTypes = ["Out Station", "Local City Use", "Monthly Bookings"];
    if (!validPackageTypes.includes(packageType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid packageType. Must be either "Out Station" or "Local City Use"',
      });
    }

    const parsedPackages =
      typeof packages === "string" ? JSON.parse(packages) : packages;

    const buildLocalKey = (defs: any) => {
      const keys = Object.keys(defs || {}).sort();
      return keys.map((k) => `${k}_${defs[k]?.hours ?? 0}_${defs[k]?.km ?? 0}`).join("|");
    };

    let uniqueKey: string | null = null;

    /* ---------------- LOCAL CITY USE ---------------- */
 /* ---------------- LOCAL CITY USE (DYNAMIC) ---------------- */
if (packageType === "Local City Use") {
  const defs = parsedPackages.packageDefinitions;
  const vehicles = parsedPackages.vehicles;

  if (!defs || typeof defs !== "object") {
    return res.status(400).json({
      success: false,
      message: "packageDefinitions is required for Local City Use",
    });
  }

  const required = Object.keys(defs || {}).sort();

  if (required.length < 4) {
    return res.status(400).json({
      success: false,
      message: "At least 4 packages are required for Local City Use",
    });
  }

  for (const k of required) {
    if (!defs[k] || defs[k].hours == null || defs[k].km == null) {
      return res.status(400).json({
        success: false,
        message: `packageDefinitions.${k}.hours and .km are required`,
      });
    }
  }

  if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
    return res.status(400).json({
      success: false,
      message: "vehicles object is required for Local City Use",
    });
  }

  for (const [vehicleType, v] of Object.entries(vehicles)) {
    const row: any = v;

    for (const k of required) {
      if (row[k] == null) {
        return res.status(400).json({
          success: false,
          message: `${vehicleType}.${k} amount is required`,
        });
      }
    }

    if (row.extraKm == null || row.extraHour == null) {
      return res.status(400).json({
        success: false,
        message: `${vehicleType}.extraKm and ${vehicleType}.extraHour are required`,
      });
    }
  }

  uniqueKey = buildLocalKey(defs);
}


    /* ---------------- OUT STATION (NO extraKm/extraHour) ---------------- */
    if (packageType === "Out Station") {
      const vehicles = parsedPackages.vehicles;

      if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
        return res.status(400).json({
          success: false,
          message: "vehicles object is required for Out Station",
        });
      }

      for (const [vehicleType, v] of Object.entries(vehicles)) {
        const row: any = v;
        if (
          row.perKm == null ||
          row.driverBattaPerDay == null ||
          row.minimumKmPerDay == null
        ) {
          return res.status(400).json({
            success: false,
            message: `Out Station requires perKm, driverBattaPerDay, minimumKmPerDay for ${vehicleType}`,
          });
        }
      }

      // one Out Station config per company
      uniqueKey = "OUT_STATION";
    }

    /* ---------------- MONTHLY BOOKINGS ---------------- */
if (packageType === "Monthly Bookings") {
  const defs = parsedPackages.packageDefinitions;
  const vehicles = parsedPackages.vehicles;

  if (!defs || typeof defs !== "object") {
    return res.status(400).json({
      success: false,
      message: "packageDefinitions is required for Monthly Bookings",
    });
  }

  const required = [
    "package1","package2","package3","package4",
    "package5","package6","package7","package8",
  ];

  for (const k of required) {
    if (!defs[k] || defs[k].hours == null || defs[k].km == null) {
      return res.status(400).json({
        success: false,
        message: `packageDefinitions.${k}.days(hours) and .km are required`,
      });
    }
  }

  if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
    return res.status(400).json({
      success: false,
      message: "vehicles object is required for Monthly Bookings",
    });
  }

  for (const [vehicleType, v] of Object.entries(vehicles)) {
    const row: any = v;

    for (const k of required) {
      if (row[k] == null) {
        return res.status(400).json({
          success: false,
          message: `${vehicleType}.${k} amount is required`,
        });
      }
    }

    // ✅ monthly needs only extraHour (no extraKm)
    if (row.extraHour == null) {
      return res.status(400).json({
        success: false,
        message: `${vehicleType}.extraHour is required`,
      });
    }
  }

  uniqueKey = buildLocalKey(defs); // reuse your same uniqueKey logic
}

    const existingRecords = await PackageData.findAll({
      where: { packageType, companyId, isDeleted: false },
    });

    let recordToUpdate: any = null;

    for (const record of existingRecords) {
      const existingPackages = JSON.parse(record.packages || "{}");

      if (packageType === "Local City Use") {
        const ek = buildLocalKey(existingPackages.packageDefinitions || {});
        if (ek === uniqueKey) {
          recordToUpdate = record;
          break;
        }
      }

      if (packageType === "Out Station") {
        recordToUpdate = record; // update first record
        break;
      }
    }

    if (recordToUpdate) {
      await recordToUpdate.update({
        packages: JSON.stringify(parsedPackages),
      });

      return res.status(200).json({
        success: true,
        message: "PackageData updated successfully",
        action: "updated",
        data: recordToUpdate,
      });
    }

    const newPackage = await PackageData.create({
      packageType,
      companyId,
      packages: JSON.stringify(parsedPackages),
    });

    return res.status(201).json({
      success: true,
      message: "PackageData created successfully",
      action: "created",
      data: newPackage,
    });
  } catch (error) {
    console.error("PackageData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// export const createPackageData = async (req: any, res: Response) => {
//   try {
//     if (req.role === ROLES.USER) {
//       return res.status(403).json({ message: "Not Authorized" });
//     }

//     const { packageType, companyId, packages } = req.body;

//     if (!packageType || !companyId || !packages) {
//       return res.status(400).json({
//         success: false,
//         message: "packageType, companyId and packages are required",
//       });
//     }

// // ✅ add to valid types
// const validPackageTypes = ["Out Station", "Local City Use", "Monthly Bookings"];
//     if (!validPackageTypes.includes(packageType)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid packageType. Must be either "Out Station" or "Local City Use"',
//       });
//     }

//     const parsedPackages =
//       typeof packages === "string" ? JSON.parse(packages) : packages;

//     const buildLocalKey = (defs: any) => {
//       const keys = Object.keys(defs || {}).sort();
//       return keys.map((k) => `${k}_${defs[k]?.hours ?? 0}_${defs[k]?.km ?? 0}`).join("|");
//     };

//     let uniqueKey: string | null = null;

//     /* ---------------- LOCAL CITY USE ---------------- */
//     if (packageType === "Local City Use") {
//       const defs = parsedPackages.packageDefinitions;
//       const vehicles = parsedPackages.vehicles;

//       if (!defs || typeof defs !== "object") {
//         return res.status(400).json({
//           success: false,
//           message: "packageDefinitions is required for Local City Use",
//         });
//       }

//       const required = ["package1", "package2", "package3", "package4"];
//       for (const k of required) {
//         if (!defs[k] || defs[k].hours == null || defs[k].km == null) {
//           return res.status(400).json({
//             success: false,
//             message: `packageDefinitions.${k}.hours and .km are required`,
//           });
//         }
//       }

//       if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "vehicles object is required for Local City Use",
//         });
//       }

//       for (const [vehicleType, v] of Object.entries(vehicles)) {
//         const row: any = v;

//         for (const k of required) {
//           if (row[k] == null) {
//             return res.status(400).json({
//               success: false,
//               message: `${vehicleType}.${k} amount is required`,
//             });
//           }
//         }

//         if (row.extraKm == null || row.extraHour == null) {
//           return res.status(400).json({
//             success: false,
//             message: `${vehicleType}.extraKm and ${vehicleType}.extraHour are required`,
//           });
//         }
//       }

//       uniqueKey = buildLocalKey(defs);
//     }

//     /* ---------------- OUT STATION (NO extraKm/extraHour) ---------------- */
//     if (packageType === "Out Station") {
//       const vehicles = parsedPackages.vehicles;

//       if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "vehicles object is required for Out Station",
//         });
//       }

//       for (const [vehicleType, v] of Object.entries(vehicles)) {
//         const row: any = v;
//         if (
//           row.perKm == null ||
//           row.driverBattaPerDay == null ||
//           row.minimumKmPerDay == null
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: `Out Station requires perKm, driverBattaPerDay, minimumKmPerDay for ${vehicleType}`,
//           });
//         }
//       }

//       // one Out Station config per company
//       uniqueKey = "OUT_STATION";
//     }

//     /* ---------------- MONTHLY BOOKINGS ---------------- */
// if (packageType === "Monthly Bookings") {
//   const defs = parsedPackages.packageDefinitions;
//   const vehicles = parsedPackages.vehicles;

//   if (!defs || typeof defs !== "object") {
//     return res.status(400).json({
//       success: false,
//       message: "packageDefinitions is required for Monthly Bookings",
//     });
//   }

//   const required = [
//     "package1","package2","package3","package4",
//     "package5","package6","package7","package8",
//   ];

//   for (const k of required) {
//     if (!defs[k] || defs[k].hours == null || defs[k].km == null) {
//       return res.status(400).json({
//         success: false,
//         message: `packageDefinitions.${k}.days(hours) and .km are required`,
//       });
//     }
//   }

//   if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: "vehicles object is required for Monthly Bookings",
//     });
//   }

//   for (const [vehicleType, v] of Object.entries(vehicles)) {
//     const row: any = v;

//     for (const k of required) {
//       if (row[k] == null) {
//         return res.status(400).json({
//           success: false,
//           message: `${vehicleType}.${k} amount is required`,
//         });
//       }
//     }

//     // ✅ monthly needs only extraHour (no extraKm)
//     if (row.extraHour == null) {
//       return res.status(400).json({
//         success: false,
//         message: `${vehicleType}.extraHour is required`,
//       });
//     }
//   }

//   uniqueKey = buildLocalKey(defs); // reuse your same uniqueKey logic
// }

//     const existingRecords = await PackageData.findAll({
//       where: { packageType, companyId, isDeleted: false },
//     });

//     let recordToUpdate: any = null;

//     for (const record of existingRecords) {
//       const existingPackages = JSON.parse(record.packages || "{}");

//       if (packageType === "Local City Use") {
//         const ek = buildLocalKey(existingPackages.packageDefinitions || {});
//         if (ek === uniqueKey) {
//           recordToUpdate = record;
//           break;
//         }
//       }

//       if (packageType === "Out Station") {
//         recordToUpdate = record; // update first record
//         break;
//       }
//     }

//     if (recordToUpdate) {
//       await recordToUpdate.update({
//         packages: JSON.stringify(parsedPackages),
//       });

//       return res.status(200).json({
//         success: true,
//         message: "PackageData updated successfully",
//         action: "updated",
//         data: recordToUpdate,
//       });
//     }

//     const newPackage = await PackageData.create({
//       packageType,
//       companyId,
//       packages: JSON.stringify(parsedPackages),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "PackageData created successfully",
//       action: "created",
//       data: newPackage,
//     });
//   } catch (error) {
//     console.error("PackageData Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };
// export const createPackageData = async (req: any, res: Response) => {
//   try {
//     if (req.role === ROLES.USER) {
//       return res.status(403).json({ message: "Not Authorized" });
//     }

//     const { packageType, companyId, packages } = req.body;

//     if (!packageType || !companyId || !packages) {
//       return res.status(400).json({
//         success: false,
//         message: "packageType, companyId and packages are required",
//       });
//     }

//     const validPackageTypes = ["Out Station", "Local City Use"];
//     if (!validPackageTypes.includes(packageType)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid packageType. Must be either "Out Station" or "Local City Use"',
//       });
//     }

//     const parsedPackages =
//       typeof packages === "string" ? JSON.parse(packages) : packages;

//     const buildLocalKey = (defs: any) => {
//       const keys = Object.keys(defs || {}).sort();
//       return keys.map((k) => `${k}_${defs[k]?.hours ?? 0}_${defs[k]?.km ?? 0}`).join("|");
//     };

//     let uniqueKey: string | null = null;

//     /* ---------------- LOCAL CITY USE ---------------- */
//     if (packageType === "Local City Use") {
//       const defs = parsedPackages.packageDefinitions;
//       const vehicles = parsedPackages.vehicles;

//       if (!defs || typeof defs !== "object") {
//         return res.status(400).json({
//           success: false,
//           message: "packageDefinitions is required for Local City Use",
//         });
//       }

//       const required = ["package1", "package2", "package3", "package4"];
//       for (const k of required) {
//         if (!defs[k] || defs[k].hours == null || defs[k].km == null) {
//           return res.status(400).json({
//             success: false,
//             message: `packageDefinitions.${k}.hours and .km are required`,
//           });
//         }
//       }

//       if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "vehicles object is required for Local City Use",
//         });
//       }

//       for (const [vehicleType, v] of Object.entries(vehicles)) {
//         const row: any = v;

//         for (const k of required) {
//           if (row[k] == null) {
//             return res.status(400).json({
//               success: false,
//               message: `${vehicleType}.${k} amount is required`,
//             });
//           }
//         }

//         if (row.extraKm == null || row.extraHour == null) {
//           return res.status(400).json({
//             success: false,
//             message: `${vehicleType}.extraKm and ${vehicleType}.extraHour are required`,
//           });
//         }
//       }

//       uniqueKey = buildLocalKey(defs);
//     }

//     /* ---------------- OUT STATION (NO extraKm/extraHour) ---------------- */
//     if (packageType === "Out Station") {
//       const vehicles = parsedPackages.vehicles;

//       if (!vehicles || typeof vehicles !== "object" || Object.keys(vehicles).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "vehicles object is required for Out Station",
//         });
//       }

//       for (const [vehicleType, v] of Object.entries(vehicles)) {
//         const row: any = v;
//         if (
//           row.perKm == null ||
//           row.driverBattaPerDay == null ||
//           row.minimumKmPerDay == null
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: `Out Station requires perKm, driverBattaPerDay, minimumKmPerDay for ${vehicleType}`,
//           });
//         }
//       }

//       // one Out Station config per company
//       uniqueKey = "OUT_STATION";
//     }

//     const existingRecords = await PackageData.findAll({
//       where: { packageType, companyId, isDeleted: false },
//     });

//     let recordToUpdate: any = null;

//     for (const record of existingRecords) {
//       const existingPackages = JSON.parse(record.packages || "{}");

//       if (packageType === "Local City Use") {
//         const ek = buildLocalKey(existingPackages.packageDefinitions || {});
//         if (ek === uniqueKey) {
//           recordToUpdate = record;
//           break;
//         }
//       }

//       if (packageType === "Out Station") {
//         recordToUpdate = record; // update first record
//         break;
//       }
//     }

//     if (recordToUpdate) {
//       await recordToUpdate.update({
//         packages: JSON.stringify(parsedPackages),
//       });

//       return res.status(200).json({
//         success: true,
//         message: "PackageData updated successfully",
//         action: "updated",
//         data: recordToUpdate,
//       });
//     }

//     const newPackage = await PackageData.create({
//       packageType,
//       companyId,
//       packages: JSON.stringify(parsedPackages),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "PackageData created successfully",
//       action: "created",
//       data: newPackage,
//     });
//   } catch (error) {
//     console.error("PackageData Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// export const createPackageData = async (req: any, res: Response) => {
//   try {
//     if (req.role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const { packageType, companyId, packages } = req.body;

//     if (!packageType || !companyId || !packages) {
//       return res.status(400).json({
//         success: false,
//         message: 'packageType, companyId and packages are required'
//       });
//     }

//     const parsedPackages =
//       typeof packages === 'string' ? JSON.parse(packages) : packages;

//     let uniqueKey: string | null = null;

//     /* ---------------- LOCAL CITY USE (NO CHANGE) ---------------- */
//     if (packageType === 'Local City Use') {
//       if (!parsedPackages.vehicles || typeof parsedPackages.vehicles !== 'object') {
//         return res.status(400).json({
//           success: false,
//           message: 'vehicles object is required for Local City Use'
//         });
//       }

//       const vehicleList = Object.values(parsedPackages.vehicles);
//       const firstVehicle: any = vehicleList[0];

//       if (!firstVehicle?.packageKm || !firstVehicle?.packageHour) {
//         return res.status(400).json({
//           success: false,
//           message: 'packageKm and packageHour are required'
//         });
//       }

//       uniqueKey = `${firstVehicle.packageKm}_${firstVehicle.packageHour}`;
//     }

//     /* ---------------- OUT STATION (UPDATED) ---------------- */
//     if (packageType === 'Out Station') {
//       if (!parsedPackages.vehicles || typeof parsedPackages.vehicles !== 'object') {
//         return res.status(400).json({
//           success: false,
//           message: 'vehicles object is required for Out Station'
//         });
//       }

//       const vehicleList = Object.values(parsedPackages.vehicles);
//       if (vehicleList.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'At least one vehicle must be added'
//         });
//       }

//       const firstVehicle: any = vehicleList[0];

//       if (
//         firstVehicle.perKm == null ||
//         firstVehicle.driverBattaPerDay == null ||
//         firstVehicle.minimumKmPerDay == null
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: 'perKm, driverBattaPerDay and minimumKmPerDay are required'
//         });
//       }

//       // uniqueness based on minimumKmPerDay
//       uniqueKey = String(firstVehicle.minimumKmPerDay);
//     }

//     const existingRecords = await PackageData.findAll({
//       where: { packageType, companyId, isDeleted: false }
//     });

//     let recordToUpdate: any = null;

//     for (const record of existingRecords) {
//       const existingPackages = JSON.parse(record.packages);

//       /* LOCAL CITY USE */
//       if (packageType === 'Local City Use') {
//         const vehicles = Object.values(existingPackages.vehicles || []);
//         if (vehicles.length > 0) {
//           const v: any = vehicles[0];
//           if (`${v.packageKm}_${v.packageHour}` === uniqueKey) {
//             recordToUpdate = record;
//             break;
//           }
//         }
//       }

//       /* OUT STATION */
//       if (packageType === 'Out Station') {
//         const vehicles = Object.values(existingPackages.vehicles || []);
//         if (vehicles.length > 0) {
//           const v: any = vehicles[0];
//           if (String(v.minimumKmPerDay) === uniqueKey) {
//             recordToUpdate = record;
//             break;
//           }
//         }
//       }
//     }

//     /* ---------------- UPDATE ---------------- */
//     if (recordToUpdate) {
//       await recordToUpdate.update({
//         packages: JSON.stringify(parsedPackages)
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'PackageData updated successfully',
//         action: 'updated',
//         data: recordToUpdate
//       });
//     }

//     /* ---------------- CREATE ---------------- */
//     const newPackage = await PackageData.create({
//       packageType,
//       companyId,
//       packages: JSON.stringify(parsedPackages)
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'PackageData created successfully',
//       action: 'created',
//       data: newPackage
//     });

//   } catch (error) {
//     console.error('PackageData Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };
 
// REMOVED: upsertPackageData function - not needed as createPackageData already handles upsert logic
 


// Get single PackageData by ID
export const getPackageDataById = async (req: any, res: Response) => {
    try {
        if (req.role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }
        const { id } = req.params;
 
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'PackageData ID is required'
            });
            return;
        }
 
        const packageData = await PackageData.findByPk(id);
 
        if (!packageData) {
            res.status(404).json({
                success: false,
                message: 'PackageData not found'
            });
            return;
        }
 
        // Parse the packages JSON string to object for better readability
        const parsedPackageData = {
            ...packageData.toJSON(),
            packages: typeof packageData.packages === 'string'
                ? JSON.parse(packageData.packages)
                : packageData.packages
        };
 
        res.status(200).json({
            success: true,
            message: 'PackageData retrieved successfully',
            data: parsedPackageData
        });
 
    } catch (error) {
        console.error('Error fetching package data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
 
// Get all PackageData with optional filtering (No pagination)
export const getAllPackageData = async (req: any, res: Response) => {
    try {
        if (req.role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }
        const { packageType, companyId } = req.query;
 
        const where: any = {};
        if (packageType) where.packageType = packageType;
        if (companyId) where.companyId = companyId;
 
        const packageData = await PackageData.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
 
        // Parse packages JSON for all records
        const parsedPackageData = packageData.map(item => ({
            ...item.toJSON(),
            packages: typeof item.packages === 'string'
                ? JSON.parse(item.packages)
                : item.packages
        }));
 
        res.status(200).json({
            success: true,
            message: 'PackageData retrieved successfully',
            data: parsedPackageData,
            total: parsedPackageData.length
        });
 
    } catch (error) {
        console.error('Error fetching package data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
 
// Update PackageData
export const updatePackageData = async (req: any, res: Response) => {
    try {
        if (req.role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }
        const { id } = req.params;
        const { packageType, companyId, packages } = req.body;
 
        // Validation
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'PackageData ID is required'
            });
            return;
        }
 
        // Check if PackageData exists
        const existingPackageData = await PackageData.findByPk(id);
        if (!existingPackageData) {
            res.status(404).json({
                success: false,
                message: 'PackageData not found'
            });
            return;
        }
 
        // Prepare update data - only include fields that are provided
        const updateData: any = {};
        if (packageType !== undefined) updateData.packageType = packageType;
        if (companyId !== undefined) updateData.companyId = companyId;
        if (packages !== undefined) {
            updateData.packages = typeof packages === 'string'
                ? packages
                : JSON.stringify(packages);
        }
 
 
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({
                success: false,
                message: 'At least one field (packageType, companyId, or packages) is required for update'
            });
            return;
        }
 
        // Update the package data
        await existingPackageData.update(updateData);
 
        // Fetch the updated package data
        const updatedPackageData = await PackageData.findByPk(id);
 
        res.status(200).json({
            success: true,
            message: 'PackageData updated successfully',
            data: updatedPackageData
        });
 
    } catch (error) {
        console.error('Error updating package data:', error);
 
        // Handle specific Sequelize errors
        if (error instanceof Error) {
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid companyId provided'
                });
                return;
            }
 
            if (error.name === 'SequelizeValidationError') {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    details: error.message
                });
                return;
            }
 
            if (error.name === 'SequelizeUniqueConstraintError') {
                res.status(409).json({
                    success: false,
                    message: 'PackageData with this combination already exists'
                });
                return;
            }
        }
 
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
 
// Delete PackageData (Soft delete)
export const deletePackageData = async (req: any, res: Response) => {
    try {
        if (req.role === ROLES.USER) {
            return res.status(403).json({ message: 'Not Authorized' });
        }
        const { id } = req.params;
 
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'PackageData ID is required'
            });
            return;
        }
 
        // Check if PackageData exists
        const packageData = await PackageData.unscoped().findByPk(id);
        if (!packageData) {
            res.status(404).json({
                success: false,
                message: 'PackageData not found'
            });
            return;
        }
 
        // Soft delete
        await packageData.update({ isDeleted: true });
 
        res.status(200).json({
            success: true,
            message: 'PackageData deleted successfully'
        });
 
    } catch (error) {
        console.error('Error deleting package data:', error);
 
        // Handle foreign key constraint errors (if other records reference this)
        if (error instanceof Error && error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).json({
                success: false,
                message: 'Cannot delete PackageData as it is referenced by other records'
            });
            return;
        }
 
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

 
 export const copyPackageData = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const { sourceCompanyId, targetCompanyId, packageType } = req.body;

    if (!sourceCompanyId || !targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'sourceCompanyId and targetCompanyId are required'
      });
    }

    if (sourceCompanyId === targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Source and target company cannot be the same'
      });
    }

    const whereClause: any = { companyId: sourceCompanyId, isDeleted: false };
    if (packageType) whereClause.packageType = packageType;

    const sourcePackageData = await PackageData.findAll({ where: whereClause });

    if (sourcePackageData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No package data found for source company'
      });
    }

    const targetWhereClause: any = { companyId: targetCompanyId, isDeleted: false };
    if (packageType) targetWhereClause.packageType = packageType;

    const existingTargetData = await PackageData.findAll({
      where: targetWhereClause
    });

    const copiedPackages = [];
    const updatedPackages = [];
    const skippedPackages = [];

    for (const sourcePackage of sourcePackageData) {
      try {
        const sourceKmValues = extractKmFromPackages(sourcePackage.packages);

        const existingTargetPackage = existingTargetData.find(
          t => t.packageType === sourcePackage.packageType
        );

        if (existingTargetPackage) {
          const existingKmValues = extractKmFromPackages(
            existingTargetPackage.packages
          );

          const hasConflict = sourceKmValues.some(km =>
            existingKmValues.includes(km)
          );

          if (hasConflict) {
            await existingTargetPackage.update({
              packages:
                typeof sourcePackage.packages === 'string'
                  ? sourcePackage.packages
                  : JSON.stringify(sourcePackage.packages)
            });

            updatedPackages.push({
              packageType: sourcePackage.packageType,
              action: 'updated'
            });
          } else {
            const newPkg = await PackageData.create({
              packageType: sourcePackage.packageType,
              companyId: targetCompanyId,
              packages:
                typeof sourcePackage.packages === 'string'
                  ? sourcePackage.packages
                  : JSON.stringify(sourcePackage.packages)
            });

            copiedPackages.push({
              packageDataId: newPkg.packageDataId,
              packageType: sourcePackage.packageType,
              action: 'created'
            });
          }
        } else {
          const newPkg = await PackageData.create({
            packageType: sourcePackage.packageType,
            companyId: targetCompanyId,
            packages:
              typeof sourcePackage.packages === 'string'
                ? sourcePackage.packages
                : JSON.stringify(sourcePackage.packages)
          });

          copiedPackages.push({
            packageDataId: newPkg.packageDataId,
            packageType: sourcePackage.packageType,
            action: 'created'
          });
        }
      } catch (err) {
        skippedPackages.push({
          packageDataId: sourcePackage.packageDataId,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Package data copied successfully',
      data: {
        copied: copiedPackages,
        updated: updatedPackages,
        skipped: skippedPackages
      }
    });
  } catch (error) {
    console.error('Error copying package data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

 
 