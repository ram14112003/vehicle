import { Request, Response } from 'express';
import { Package } from '../models/package';
import { VehicleType } from '../models/vehicleType'; // Changed from Vehicle to VehicleType
import { Company } from '../models/company';
import { PackageData } from '../models';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;

 export const createPackage = async (req: any, res: Response) =>  {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { companyId, packageType } = req.body;

    if (!companyId || !packageType) {
      return res.status(400).json({
        success: false,
        message: "company and packageType are required fields",
      });
    }

    // ✅ add Monthly Bookings
    const validPackageTypes = ["Out Station", "Local City Use", "Monthly Bookings"];
    if (!validPackageTypes.includes(packageType)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid packageType. Must be "Out Station" or "Local City Use" or "Monthly Bookings"',
      });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const newPackage = await Package.create({ companyId, packageType });
    const createdPackage = await Package.findByPk(newPackage.packageId);

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: createdPackage,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// Create Package
// export const createPackage = async (req: any, res: Response) =>  {
//     try {
//          if (req.role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }
//         const { companyId,packageType } = req.body;
 
//         // Validation
//         if (!companyId || !packageType) {
//             res.status(400).json({
//                 success: false,
//                 message: 'company and packageType are required fields'
//             });
//             return;
//         }
//         // Validate packageType enum
//         const validPackageTypes = ['Out Station', 'Local City Use'];
//         if (!validPackageTypes.includes(packageType)) {
//             res.status(400).json({
//                 success: false,
//                 message: 'Invalid packageType. Must be either "Out Station" or "Local City Use"'
//             });
//             return;
//         }
 
//         // Check if company exists
//         const company = await Company.findByPk(companyId);
//         if (!company) {
//             res.status(404).json({
//                 success: false,
//                 message: 'Company not found'
//             });
//             return;
//         }
 
//         // Create the package
//         const newPackage = await Package.create({
//             companyId,
//             packageType
//         });
 
//         // Fetch the created package with company details
//         const createdPackage = await Package.findByPk(newPackage.packageId);
 
//         res.status(201).json({
//             success: true,
//             message: 'Package created successfully',
//             data: createdPackage
//         });
 
//     } catch (error) {
//         console.error('Error creating package:', error);
       
//         // Handle specific Sequelize errors
//         if (error instanceof Error) {
//             // Handle foreign key constraint errors
//             if (error.name === 'SequelizeForeignKeyConstraintError') {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Invalid companyId provided'
//                 });
//                 return;
//             }
           
//             // Handle validation errors
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
//             message: 'Internal server error'
//         });
//     }
// };
 
// export const getvehicleTypesByPackageId = async (req: any, res: Response) => {
//     try {
//         if (req.role === ROLES.USER) {
//             return res.status(403).json({ message: 'Not Authorized' });
//         }
//         const { packageId } = req.params;
 
//         if (!packageId) {
//             res.status(400).json({
//                 success: false,
//                 message: 'Package ID is required'
//             });
//             return;
//         }
 
//         // Get package details
//         const packageDetails = await Package.findByPk(packageId);
//         if (!packageDetails) {
//             res.status(404).json({
//                 success: false,
//                 message: 'Package not found'
//             });
//             return;
//         }
 
//         // Get all available vehicle types instead of vehicles
//         const vehicleTypes = await VehicleType.findAll({
//             where: { isDeleted: false }
//         });
 
//         // Format vehicle types based on package type
//         const formattedVehicleTypes = vehicleTypes.map(vehicleType => {
//             const baseFields = {
//                 vehicleTypeId: vehicleType.vehicleTypeId,
//                 vehicleType: vehicleType.vehicleType,
//                 createdAt: vehicleType.createdAt
//             };
 
//             return baseFields;
//         });
       
//         res.status(200).json({
//             success: true,
//             message: "Vehicle Types Retrieved Successfully",
//             data: {
//                 packageInfo: packageDetails,
//                 vehicleTypes: formattedVehicleTypes, // Changed from vehicles to vehicleTypes
//                 totalCount: formattedVehicleTypes.length
//             }
//         });
 
//     } catch (error) {
//         console.error('Error fetching vehicle types by package ID:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// };
export const getvehicleTypesByPackageId = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { packageId } = req.params;
    if (!packageId) {
      return res
        .status(400)
        .json({ success: false, message: "Package ID is required" });
    }

    const packageDetails = await Package.findByPk(packageId);
    if (!packageDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });
    }

    // ✅ NOW: Return ALL vehicle types (no bookingType filter)
    const vehicleTypes = await VehicleType.findAll({
      where: { isDeleted: false },
      order: [["vehicleType", "ASC"]],
    });

    const formattedVehicleTypes = vehicleTypes.map((vt: any) => ({
      vehicleTypeId: vt.vehicleTypeId,
      vehicleType: vt.vehicleType,
      bookingType: vt.bookingType, // optional - UI ku venumna use panniko
      createdAt: vt.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Vehicle Types Retrieved Successfully",
      data: {
        packageInfo: packageDetails,
        vehicleTypes: formattedVehicleTypes,
        totalCount: formattedVehicleTypes.length,
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle types by package ID:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
// Get package by companyId and packageType
export const getPackageByCompanyAndType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { companyId, packageType } = req.query;
 
        if (!companyId || !packageType) {
            res.status(400).json({
                success: false,
                message: "companyId and packageType are required"
            });
            return;
        }
 
        const validPackageTypes = ['Out Station', 'Local City Use'];
        if (!validPackageTypes.includes(String(packageType))) {
            res.status(400).json({
                success: false,
                message: 'Invalid packageType. Must be either "Out Station" or "Local City Use"'
            });
            return;
        }
 
        const existingPackage = await Package.findOne({
            where: {
                companyId: String(companyId),
                packageType: String(packageType),
                isDeleted: false
            }
        });
 
        if (!existingPackage) {
            res.status(404).json({
                success: false,
                message: "Package not found"
            });
            return;
        }
 
        res.status(200).json({
            success: true,
            message: "Package fetched successfully",
            data: existingPackage
        });
    } catch (error) {
        console.error("Error fetching package:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


