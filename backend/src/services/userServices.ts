import { Request, Response } from 'express';
import { User } from '../models/user';
import { Company } from '../models/company';
import { Op } from 'sequelize';                    
import { sendEmailFromTemplate } from "../services/emailConfServices"; 
import { MapCount } from '../models/mapCount';
import XLSX from "xlsx";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { includeDeleted } = req.query;

    const query: any = {
      include: [
        {
          model: Company,
          as: "company", 
          required: false,
          attributes: ["companyId", "companyName"],
        },
      ],
    };[ 
       
      
    ]

    const users =
      includeDeleted === "1"
        ? await User.unscoped().findAll(query)
        : await User.findAll(query);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message,
    });
  }
};
export const getAllUserByCompany = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { includeDeleted } = req.query;

    let users;

    if (includeDeleted === "1") {
      // Include deleted users but only for selected company
      users = await User.unscoped().findAll({
        where: { companyId }
      });
    } else {
      // Only active users of selected company
      users = await User.findAll({
        where: { companyId }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message,
    });
  }
};



// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message,
    });
  }
};


// export const uploadUsersFromExcel = async (req: Request, res: Response) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "File not uploaded" });
//     }

//     const workbook = XLSX.readFile(req.file.path);
//     const sheetName = workbook.SheetNames[0];
//     const sheetData: any[] = XLSX.utils.sheet_to_json(
//       workbook.Sheets[sheetName]
//     );

//     const usersToInsert = sheetData.map((row) => ({
//       userId: uuidv4(), // ✅ auto generate
//       username: row.username,
//       email: row.email,
//       mobile: row.mobile,
//       password: row.password || "123456",
//       role: row.role || "user",
//       gender: row.gender || null,
//       country: row.country,
//       city: row.city,
//       status: "active",
//       isDeleted: false,
//       isConfirmed: true,
//     }));

//     await User.bulkCreate(usersToInsert);

//     // delete uploaded file
//     fs.unlinkSync(req.file.path);

//     return res.json({
//       success: true,
//       message: `${usersToInsert.length} users uploaded successfully`,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Upload failed" });
//   }
// };

// export const uploadUsersFromExcel = async (req: Request, res: Response) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "File not uploaded" });
//     }

//     const workbook = XLSX.readFile(req.file.path);
//     const sheetName = workbook.SheetNames[0];
//     const rawData: any[] = XLSX.utils.sheet_to_json(
//       workbook.Sheets[sheetName]
//     );

//     let inserted = 0;
//     let updated = 0;
//     let skipped: any[] = [];

//     for (const row of rawData) {
//       // 🔥 Normalize keys (handles Excel header issues)
//       const normalizedRow: any = {};
//       Object.keys(row).forEach((key) => {
//         normalizedRow[key.trim().toLowerCase()] = row[key];
//       });

//       const username = normalizedRow.username;
//       const email = normalizedRow.email;
//       const mobile = normalizedRow.mobile;
//       const companyId = normalizedRow.companyid;

//       // ❌ Validation
//       if (!username || !email || !mobile || !companyId) {
//         skipped.push({
//           row,
//           reason: "Missing required fields (username/email/mobile/companyId)",
//         });
//         continue;
//       }

//       const existingUser = await User.findOne({
//         where: {
//           [Op.or]: [{ email }, { mobile }],
//         },
//       });

//       if (existingUser) {
//         await existingUser.update({
//           username,
//           email,
//           mobile,
//           companyId,
//           role: normalizedRow.role || existingUser.role,
//           gender: normalizedRow.gender || existingUser.gender,
//           country: normalizedRow.country || existingUser.country,
//           city: normalizedRow.city || existingUser.city,
//         });

//         updated++;
//       } else {
//         await User.create({
//           userId: uuidv4(),
//           username,
//           email,
//           mobile,
//           companyId,
//           password: normalizedRow.password || "123456",
//           role: normalizedRow.role || "user",
//           gender: normalizedRow.gender || null,
//           country: normalizedRow.country,
//           city: normalizedRow.city,
//           status: "active",
//           isDeleted: false,
//           isConfirmed: true,
//         });

//         inserted++;
//       }
//     }

//     fs.unlinkSync(req.file.path);

//     let message = "";

// if (inserted === 0 && updated === 0) {
//   message = "Missing required fields";
// } else if (inserted > 0 && updated === 0) {
//   message = `${inserted} users added successfully`;
// } else if (inserted === 0 && updated > 0) {
//   message = `${updated} users updated successfully`;
// } else {
//   message = `${inserted} added, ${updated} updated successfully`;
// }

//     return res.json({
//       success: true,
//       message,
//       summary: {
//         total: rawData.length,
//         inserted,
//         updated,
//         skipped: skipped.length,
//       },
//       skippedData: skipped,
//    //   debug: rawData, // 🔥 helps you see actual Excel data
//     });
//   } catch (error: any) {
//     console.error("Upload Error:", error);
//     return res.status(500).json({
//       message: "Upload failed",
//       error: error.message,
//     });
//   }
// };

export const uploadUsersFromExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File not uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawData: any[] = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName]
    );

    // 🔥 Get valid DB columns from Sequelize model
    const validColumns = Object.keys(User.rawAttributes);

    let inserted = 0;
    let updated = 0;
    let skipped: any[] = [];

    for (const row of rawData) {
      // 🔥 Normalize keys (lowercase)
      const normalizedRow: any = {};
      Object.keys(row).forEach((key) => {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      });

      const username = normalizedRow.username;
      const email = normalizedRow.email;
      const mobile = normalizedRow.mobile;
      const companyId = normalizedRow.companyid;

      // ❌ Required validation
      if (!username || !email || !mobile || !companyId) {
        skipped.push({
          row,
          reason: "Missing required fields",
        });
        continue;
      }

      // 🔥 Map Excel → Sequelize fields correctly
      const userPayload: any = {};

      validColumns.forEach((col) => {
        const lowerCol = col.toLowerCase();

        if (normalizedRow.hasOwnProperty(lowerCol)) {
          userPayload[col] = normalizedRow[lowerCol];
        }
      });

      // 🔥 Ensure required fields are set
      userPayload.username = username;
      userPayload.email = email;
      userPayload.mobile = mobile;
      userPayload.companyId = companyId;

      // Defaults
      if (!userPayload.password) userPayload.password = "123456";
      if (!userPayload.role) userPayload.role = "user";
      if (!userPayload.status) userPayload.status = "active";

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { mobile }],
        },
      });

      if (existingUser) {
        await existingUser.update(userPayload);
        updated++;
      } else {
        await User.create({
          userId: uuidv4(),
          ...userPayload,
          isDeleted: false,
          isConfirmed: true,
        });
        inserted++;
      }
    }

    fs.unlinkSync(req.file.path);

    let message = "";

    if (inserted === 0 && updated === 0) {
      message = "Missing required fields";
    } else if (inserted > 0 && updated === 0) {
      message = `${inserted} users added successfully`;
    } else if (inserted === 0 && updated > 0) {
      message = `${updated} users updated successfully`;
    } else {
      message = `${inserted} added, ${updated} updated successfully`;
    }

    return res.json({
      success: true,
      message,
      summary: {
        total: rawData.length,
        inserted,
        updated,
        skipped: skipped.length,
      },
      skippedData: skipped,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, mobile, gender, country, city, companyId, userAddress, presentAddress, state, pinCode, isManager, danfossuserId,
  managerId, managerEmail,costCenter  } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender. Must be one of: male, female, other',
      });
    }
let companyName = "";
    // Validate companyId if provided
    if (companyId) {
      const existingCompany = await Company.findByPk(companyId);
      if (!existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company not found with the provided companyId',
        });
      }
        companyName = existingCompany.companyName;

    }
// 🔴 Danfoss email validation
if (companyName.toLowerCase().includes("danfoss")) {
  if (email && !email.toLowerCase().endsWith("@danfoss.com")) {
    return res.status(400).json({
      success: false,
      message: "Danfoss users must use @danfoss.com email only",
    });
  }
}
    // Check for duplicate email (excluding current user)
    if (email) {
      const existingUserByEmail = await User.findOne({
        where: {
          email,
          userId: { [Op.ne]: id }
        }
      });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }

    // Check for duplicate mobile (excluding current user)
    if (mobile) {
      const existingUserByMobile = await User.findOne({
        where: {
          mobile,
          userId: { [Op.ne]: id }
        }
      });
      if (existingUserByMobile) {
        return res.status(400).json({
          success: false,
          message: 'User with this mobile number already exists',
        });
      }
    }
    let companyManager = false;
    if(isManager) {
      companyManager = isManager;
    }
    //  Update user with new fields
    await user.update({
      username,
      email,
      mobile,
      gender,
      country,
      city,
      companyId,
      isManager,
      userAddress,
      presentAddress,
      companyManager,
      state,
      pinCode,
        danfossuserId: danfossuserId || null,
  managerId: managerId || null,
  managerEmail: managerEmail || null,
  costCenter: costCenter || null 
    });

    // Fetch updated user with company details
    const updatedUser = await User.findByPk(id);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

//add new address for user
export const addNewAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // userId
    const { label, country, state, city, pinCode, presentAddress, userAddress } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    //  Always fetch the latest addresses directly from DB
    const latestUser = await User.findByPk(id, { attributes: ['addresses'] });
    const current = (latestUser?.get('addresses') as any[]) || [];

    //  Add the new address
    const newAddress = { label, country, state, city, pinCode, presentAddress, userAddress };
    const updatedAddresses = [...current, newAddress];

    // Save full updated array back to DB
    await user.update({ addresses: updatedAddresses });

    //  Return the refreshed data
    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: updatedAddresses
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error adding address',
      error: error.message
    });
  }
};

//get user address - newaddress
export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: ['userId', 'addresses'] });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: user.addresses || [] });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: 'Error fetching addresses', error: error.message });
  }
};


//update user address - new address
export const updateUserAddress = async (req: Request, res: Response) => {
  try {
    const { id, idx } = req.params;
    const i = Number(idx);
    const { label, country, state, city, pinCode, presentAddress, userAddress } = req.body;

    const user = await User.findByPk(id, { attributes: ['addresses'] });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });

    const arr: any[] = (user.get('addresses') as any[]) || [];
    if (isNaN(i) || i < 0 || i >= arr.length) {
      return res.status(400).json({ success:false, message:'Invalid address index' });
    }

    arr[i] = { label, country, state, city, pinCode, presentAddress, userAddress };
    await (await User.findByPk(id))?.update({ addresses: arr });

    return res.status(200).json({ success:true, message:'Address updated', data: arr });
  } catch (e:any) {
    return res.status(400).json({ success:false, message:'Error updating address', error: e.message });
  }
};

///remove user address - new address
export const deleteUserAddress = async (req: Request, res: Response) => {
  try {
    const { id, idx } = req.params;
    const i = Number(idx);

    const user = await User.findByPk(id, { attributes: ['addresses'] });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });

    const arr: any[] = (user.get('addresses') as any[]) || [];
    if (isNaN(i) || i < 0 || i >= arr.length) {
      return res.status(400).json({ success:false, message:'Invalid address index' });
    }

    arr.splice(i, 1);
    await (await User.findByPk(id))?.update({ addresses: arr });

    return res.status(200).json({ success:true, message:'Address removed', data: arr });
  } catch (e:any) {
    return res.status(400).json({ success:false, message:'Error removing address', error: e.message });
  }
};


export const getUserByManager = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { includeDeleted } = req.query;

    
    const user = await User.findByPk(userId);
    // const bool = user?.isManager;
        const bool = user?.companyManager;

    if(!bool) {
      return res.status(404).json({
        success: false,
        message: 'User is not manager',
      });
    } 
    let users;

    if (includeDeleted === "1") {
      // Include deleted users but only for selected company
      users = await User.unscoped().findAll({
        where: { companyId: user?.companyId }
      });
    } else {
      // Only active users of selected company
      users = await User.findAll({
        where: {  companyId: user?.companyId  }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message,
    });
  }
};


// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, suspended, pending',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.update({ status });

    // Fetch updated user with company details
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Company, 
          attributes: ['companyId', 'companyName']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating user status',
      error: error.message,
    });
  }
};

// FIXED Delete user function
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.unscoped().findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already deleted
    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is already deleted',
      });
    }

    // FIXED: Use boolean true instead of string "true"
    await user.update({ 
      isDeleted: true,  // Changed from "true" to true
      status: "inactive" 
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

export const confirmUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isConfirmed } = req.body;

    // Validate isConfirmed
    if (typeof isConfirmed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isConfirmed must be a boolean value",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ isConfirmed });

    // Fetch updated user with company details
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Company,
          attributes: ["companyId", "companyName"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    //  Send confirmation email if user is confirmed
    if (isConfirmed && updatedUser) {
      try {
        await sendEmailFromTemplate("USER_CONFIRMATION_MESSAGE", {
          UserName: updatedUser.username || updatedUser.username || "User",
          UserEmail: updatedUser.email,
          CompanyName: updatedUser.company?.companyName || "Your Company",
        });

        console.log(" Confirmation email sent to:", updatedUser.email);
      } catch (emailErr: any) {
        console.error(" Error sending confirmation email:", emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `User ${isConfirmed ? "confirmed" : "unconfirmed"} successfully`,
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: "Error updating user confirmation status",
      error: error.message,
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Company, 
          attributes: ['companyId', 'companyName']
        }
      ],
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Current user retrieved successfully',
      data: user
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving current user',
      error: error.message
    });
  }
};

// Get users by status
export const getUsersByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;

    // Validate status
    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, suspended, pending',
      });
    }

    const users = await User.findAll({
      where: { status },
      include: [
        {
          model: Company,
          attributes: ['companyId', 'companyName']
        }
      ],
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    return res.status(200).json({
      success: true,
      message: `Users with status '${status}' retrieved successfully`,
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users by status',
      error: error.message,
    });
  }
};

// Get confirmed/unconfirmed users
export const getUsersByConfirmationStatus = async (req: Request, res: Response) => {
  try {
    const { confirmed } = req.params; // 'true' or 'false'

    const isConfirmed = confirmed === 'true';

    const users = await User.findAll({
      where: { isConfirmed },
      include: [
        {
          model: Company,
          attributes: ['companyId', 'companyName']
        }
      ],
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    return res.status(200).json({
      success: true,
      message: `${isConfirmed ? 'Confirmed' : 'Unconfirmed'} users retrieved successfully`,
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users by confirmation status',
      error: error.message,
    });
  }
};

// Get users by company
export const getUsersByCompany = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Validate if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const users = await User.findAll({
      where: { companyId },
       attributes: ["userId","danfossuserId", "username", "email","costCenter","mobile"],
    });

    return res.status(200).json({
      success: true,
      message: `Users for company retrieved successfully`,
      data: users,
      company: {
        companyId: company.companyId,
        companyName: company.companyName
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users by company',
      error: error.message,
    });
  }
};

// Get users by gender
export const getUsersByGender = async (req: Request, res: Response) => {
  try {
    const { gender } = req.params;

    // Validate gender
    if (!['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender. Must be one of: male, female, other',
      });
    }

    const users = await User.findAll({
      where: { gender },
    });

    return res.status(200).json({
      success: true,
      message: `Users with gender '${gender}' retrieved successfully`,
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users by gender',
      error: error.message,
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client-side storage.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// RESTORE USER
export const restoreUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.unscoped().findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is already active',
      });
    }

    await user.update({
      isDeleted: false,
      status: "active",
    });

    return res.status(200).json({
      success: true,
      message: 'User restored successfully',
    });
  } catch (error: any) {
    console.error('Error restoring user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error restoring user',
      error: error.message,
    });
  }
};

// PERMANENT DELETE USER
export const permanentDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.unscoped().findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.destroy(); // HARD DELETE

    return res.status(200).json({
      success: true,
      message: 'User permanently deleted',
    });
  } catch (error: any) {
    console.error('Error permanently deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error permanently deleting user',
      error: error.message,
    });
  }
};


export const getCompanyManagers = async (req: Request, res: Response) => {
  try {
    const companyId = (req.params.companyId || req.query.companyId) as string;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId is required" });
    }

    // ✅ ensure company exists (optional but good)
    const company = await Company.findOne({
      where: { companyId, isDeleted: false },
      attributes: ["companyId", "companyName", "companyCode", "seoUrl","managerApproval"],
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    // ✅ managers only (avoid sending password)
    const managers = await User.findAll({
      where: { companyId, isManager: true },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      company,
      count: managers.length,
      data: managers,
    });
  } catch (error: any) {
    console.error("getCompanyManagers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const appMapCount = async (req: any, res: Response) => {
  try {
//    const { type } = req.body; // "pickup" or "drop"

    // Get existing row (or create one)
    let record = await MapCount.findOne();

    if (!record) {
      record = await MapCount.create({});
    }

      await record.increment('appCount', { by: 1 });

    res.status(200).json({
      message: 'Count updated successfully'
    });

  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const webMapCount = async (req: any, res: Response) => {
  try {
//    const { type } = req.body; // "pickup" or "drop"

    // Get existing row (or create one)
    let record = await MapCount.findOne();

    if (!record) {
      record = await MapCount.create({});
    }

      await record.increment('webCount', { by: 1 });

    res.status(200).json({
      message: 'Count updated successfully'
    });

  } catch (err) {
    res.status(500).json({ error: err });
  }
};


export const getMapCount = async (req: any, res: Response) => {
  try {
    let record = await MapCount.findOne();

    if (!record) {
      record = await MapCount.create({});
    }

    res.status(200).json({
      appCount: record.appCount,
      webCount: record.webCount
    });

  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const getManagerDetailsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = (req.params.userId || req.query.userId) as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findOne({
      where: { userId },
      attributes: ["danfossuserId", "managerId", "managerEmail","costCenter","mobile"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("getManagerDetailsByUserId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};