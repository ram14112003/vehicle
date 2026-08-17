import { Request, Response } from 'express';
import { Company, Employee, Invoice, Tax, Vendor, User, Booking } from '../models';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;
import { Op } from 'sequelize';
import {normalizeManagerEmails } from '../utils/email';
import { ORDER } from '../utils/costants';


export const getCompanyBySeoUrl = async (req: Request, res: Response) => {
  try {
    const { seoUrl } = req.params;

    if (!seoUrl) {
      return res.status(400).json({ message: "SEO URL is required" });
    }

    const company = await Company.findOne({
      where: { seoUrl, isDeleted: false },
      attributes: ["companyId", "companyName", "companyLogo", "seoUrl"]
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(200).json(company);
  } catch (error: any) {
    console.error("Error fetching company:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getAllCompany = async (req: Request, res: Response) => {
  try {

    const { status } = req.query;
    let company;
    if (status === '1') {
      company = await Company.unscoped().findAll({
        where: {
          isDeleted: true,
        },
      });
    } else {
      company = await Company.findAll({
        where: {
          isDeleted: false,
        },
      });
    }

    res.status(200).json({
      message: 'Company retrieved successfully',
      data: company,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving Companies',
      error: error.message,
    });
  }
};
const isTruthy = (v: any) => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1";
};
export const getCompanyTaxes = async (req: Request, res: Response) => {
  try {
    const companyId = (req.params.companyId || req.query.companyId) as string;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    // ✅ company details
    const company = await Company.findOne({
      where: { companyId, isDeleted: false },
      attributes: [
        "companyId",
        "companyName",
        "companyPhno",
        "domainName",
        "seoUrl",
        "gstNo",
        "managerEmail",
        "managerApproval",
        "allowTax",
        "companyLogo",
        "companyAddress",
        "startTime",
        "closeTime",
        "priorMinutes",
      ],
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // ✅ tax only when allowTax is truthy
    let taxes: any[] = [];
    const allowTax = isTruthy((company as any).allowTax);

    if (allowTax) {
      taxes = await Tax.findAll({
        where: { isActive: true },
        attributes: ["taxId", "taxName", "taxPercent"],
        order: [["taxName", "ASC"]],
      });
    }

    return res.status(200).json({
      success: true,
      company,
      allowTax,
      taxes,
    });
  } catch (error: any) {
    console.error("getCompanyWithTaxes error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// GET SINGLE COMPANY BY ID
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const company = await Company.findOne({
      where: {
        companyId: id
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({
      message: 'Company retrieved successfully',
      data: company,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving company',
      error: error.message,
    });
  }
};

// export const updateCompany = async (req: any, res: Response) => {
//   try {
//     const { id } = req.params;
//     const {
//       companyName,
//       companyPhno,
//       domainName,
//       managerEmail,
//       seoUrl,
//       allowTax,
//       bookingRules,
//       managerApproval,
//       gstNo,
//         needEmail,        // ✅ ADD
// companyAddress,
//       startTime,
//       closeTime,
//       companyCode,
//       priorMinutes
//     } = req.body;

//     const companyLogoPath = req.file ? req.file.filename : null;

//     // ✅ No role check here

//     if (!id) {
//       return res.status(400).json({ message: 'Company ID is required' });
//     }

//     const company = await Company.findOne({ where: { companyId: id } });
// const needEmailBoolean =
//   needEmail === "true" || needEmail === true ? 1 : 0;

//     if (!company) {
//       return res.status(404).json({ message: 'Company not found' });
//     }

//     // Check if managerEmail is being updated and already exists in another company
//     if (managerEmail && managerEmail !== company.managerEmail) {
//       const existing = await Company.findOne({
//         where: {
//           managerEmail,
//           companyId: { [Op.ne]: id }
//         }
//       });

//       if (existing) {
//         return res.status(400).json({ message: 'Manager email already exists in another company' });
//       }
//     }

//     const updateData: any = {
//       companyName: companyName || company.companyName,
//       companyPhno: companyPhno || company.companyPhno,
//       domainName: domainName || company.domainName,
//       managerEmail: managerEmail || company.managerEmail,
//       seoUrl: seoUrl || company.seoUrl,
//       allowTax: allowTax || company.allowTax,
//         needEmail: needEmailBoolean, 
//       gstNo: gstNo ?? company.gstNo,
//       companyAddress: companyAddress ?? company.companyAddress, 
//       managerApproval: managerApproval ?? company.managerApproval,
//       startTime: startTime || company.startTime,
//       closeTime: closeTime || company.closeTime,
//          companyCode: companyCode || company.companyCode,
//       priorMinutes: priorMinutes || company.priorMinutes
//     };

//     if (bookingRules) {
//       updateData.bookingRules = JSON.parse(bookingRules);
//     }

//     if (companyLogoPath) {
//       updateData.companyLogo = companyLogoPath;
//     }

//     // Update the company record
//     await company.update(updateData);

//     res.status(200).json({
//       message: 'Company updated successfully',
//       data: company,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       message: 'Error updating company',
//       error: error.message,
//     });
//   }
// };

export const updateCompany = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const {
      companyName,
      companyPhno,
      domainName,
      managerEmail,
      seoUrl,
      allowTax,
      bookingRules,
      managerApproval,
      gstNo,
      needEmail,
      companyAddress,
      startTime,
      closeTime,
      companyCode,
      priorMinutes
    } = req.body;

    const companyLogoPath = req.file ? req.file.filename : null;

    if (!id) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    const company = await Company.findOne({ where: { companyId: id } });

    const needEmailBoolean =
      needEmail === "true" || needEmail === true ? 1 : 0;

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

       const oldManagers = company.managerEmail
      ? normalizeManagerEmails(company.managerEmail)
      : [];

        let normalizedManagers: string[] = oldManagers;
    if (managerEmail !== undefined) {
      normalizedManagers = normalizeManagerEmails(managerEmail);
    }

    // ✅ normalize manager emails (same logic as createCompany)
    // let normalizedManagers: string[] = company.managerEmail
    //   ? normalizeManagerEmails(company.managerEmail)
    //   : [];

    // if (managerEmail !== undefined) {
    //   normalizedManagers = normalizeManagerEmails(managerEmail);
    // }

    const updateData: any = {
      companyName: companyName || company.companyName,
      companyPhno: companyPhno || company.companyPhno,
      domainName: domainName || company.domainName,
      managerEmail: normalizedManagers.join(", "),
      seoUrl: seoUrl || company.seoUrl,
      allowTax: allowTax ?? company.allowTax,
      needEmail: needEmailBoolean,
      gstNo: gstNo ?? company.gstNo,
      companyAddress: companyAddress ?? company.companyAddress,
       managerApproval: managerApproval ?? company.managerApproval,
      startTime: startTime || company.startTime,
      closeTime: closeTime || company.closeTime,
      companyCode: companyCode || company.companyCode,
     priorMinutes: priorMinutes || company.priorMinutes
    };

    if (bookingRules) {
      updateData.bookingRules = JSON.parse(bookingRules);
    }

    if (companyLogoPath) {
      updateData.companyLogo = companyLogoPath;
    }

    // ✅ update company
    await company.update(updateData);

    // ✅ NEW LOGIC → update users if their email exists in manager list
    // if (normalizedManagers.length) {
    //   await User.update(
    //     { companyManager: 1 },
    //     {
    //       where: {
    //         email: normalizedManagers
    //       }
    //     }
    //   );
    // }


    const removedManagers = oldManagers.filter(
      email => !normalizedManagers.includes(email)
    );

    if (removedManagers.length) {
      await User.update(
        { companyManager: 0, isManager: 0 },
        { where: { email: removedManagers } }
      );
    }

    if (normalizedManagers.length) {
      await User.update(
        { companyManager: 1, isManager: 1 },
        { where: { email: normalizedManagers } }
      );
    }
    
    res.status(200).json({
      message: "Company updated successfully",
      data: company
    });


  } catch (error: any) {
    res.status(500).json({
      message: "Error updating company",
      error: error.message
    });
  }
};


// 🗑️ Soft Delete (Move to Trash)
export const deleteCompany = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const company = await Company.findOne({
      where: { companyId: id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.update({ isDeleted: true });
    
        // 2️⃣ Get all users under this company
    const users = await User.findAll({
      where: { companyId: id },
      attributes: ['userId']
    });

    const userIds = users.map(u => u.userId);

    // 3️⃣ Soft delete users
    await User.update(
      { isDeleted: true },
      { where: { companyId: id } }
    );

    // 4️⃣ Cancel their bookings
    if (userIds.length > 0) {
      await Booking.update(
        { confirmStatus: ORDER.STATUS.CANCELLED },
        { where: { userId: userIds } }
      );
    }


    return res.status(200).json({
      message: 'Company moved to trash successfully',
      deletedCompany: {
        id: company.companyId,
        name: company.companyName,
        managerEmail: company.managerEmail,
        domainName: company.domainName,
      },
    });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return res.status(500).json({
      message: 'Error deleting company',
      error: error.message,
    });
  }
};


// ♻️ Restore from Trash
export const restoreCompany = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Include deleted records in search
    const company = await Company.unscoped().findOne({
      where: { companyId: id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.update({ isDeleted: false });

        // 2️⃣ Restore users under this company
    await User.unscoped().update(
      { isDeleted: false },
      {
        where: { companyId: id }
      }
    );


    res.status(200).json({
      message: 'Company restored successfully',
      restoredCompany: {
        id: company.companyId,
        name: company.companyName,
        managerEmail: company.managerEmail,
        domainName: company.domainName,
      },
    });
  } catch (error: any) {
    console.error('Error restoring company:', error);
    res.status(500).json({
      message: 'Error restoring company',
      error: error.message,
    });
  }
};
