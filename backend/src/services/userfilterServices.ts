import { Request, Response } from "express";
import { Op } from "sequelize";
import { User } from "../models/user"; // Update with your correct model path

export const getFilteredUsers = async (req: Request, res: Response) => {
  try {
    const {
      search,         // username or email
      status,         // Active / Inactive
      confirmStatus,  // Yes / No
      orderBy,        // column name
      orderDir,       // ASC / DESC
      fromDate,       // optional date range start
      toDate          // optional date range end
    } = req.query;

    let whereClause: any = {};

    // Search by username or email
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Confirm status filter
    if (confirmStatus) {
      whereClause.isConfirmed = confirmStatus === "Yes";
    }

    // Date range filter (Register Date)
    if (fromDate && toDate) {
      whereClause.registerDate = {
        [Op.between]: [new Date(String(fromDate)), new Date(String(toDate))]
      };
    }

    // Order config
    let order: any = [["createdAt", "DESC"]];
    if (orderBy && orderDir) {
      order = [[String(orderBy), String(orderDir).toUpperCase()]];
    }

    const users = await User.findAll({
      where: whereClause,
      order,
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error in getFilteredUsers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
