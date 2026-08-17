import { Request, Response } from 'express';
import { Vendor } from '../models/vendor'; // Adjust path as needed
import { USERS } from "../utils/costants";
const { ROLES } = USERS;
import { Op } from 'sequelize';


// Get All Owners (filtered by deleted status)
export const getOwner = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const { status } = req.query;

    let whereClause: any = {};

    // status = 1 => get deleted owners
    // status = 0 or undefined => get active owners
    if (status === "1") {
      whereClause.isDeleted = true;
    } else {
      whereClause.isDeleted = false;
    }

    const vendors = await Vendor.findAll({ where: whereClause });

    res.status(200).json({
      message: 'Owners fetched successfully',
      vendor: vendors,
    });

  } catch (err) {
    console.error('Error fetching owners:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Owner by ID
export const getOwnerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const owner = await Vendor.findByPk(id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Owner retrieved successfully',
      data: owner
    });

  } catch (err: any) {
    console.error('Error fetching owner:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching owner',
      error: err.message
    });
  }
};

export const updateOwner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendorName, email, phno, address, country, state, city, vehicleId } = req.body;

    const owner = await Vendor.findByPk(id);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    if (email && email !== owner.email) {
      const existingOwner = await Vendor.findOne({ 
        where: { email, vendorId: { [Op.ne]: id } }
      });
      if (existingOwner) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    await owner.update({
      ...(vendorName && { vendorName }),
      ...(email && { email }),
      ...(phno && { phno }),
      ...(address && { address }),
      ...(country && { country }),
      ...(state && { state }),
      ...(city && { city }),
      ...(vehicleId !== undefined && { vehicleId })
    });

    res.status(200).json({
      success: true,
      message: 'Owner updated successfully',
      data: owner
    });

  } catch (err: any) {
    console.error('Error updating owner:', err);
    res.status(400).json({ success: false, message: 'Error updating owner', error: err.message });
  }
};
// Delete Owner
export const deleteOwner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const owner = await Vendor.unscoped().findByPk(id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    // Hard delete - completely remove from database
    await owner.update({isDeleted:true});

    res.status(200).json({
      success: true,
      message: 'Owner deleted successfully',
      data:owner
    });

  } catch (err: any) {
    console.error('Error deleting owner:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting owner',
      error: err.message
    });
  }
};

// Restore (reactivate) Owner
export const restoreOwner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const owner = await Vendor.unscoped().findByPk(id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    await owner.update({ isDeleted: false });

    res.status(200).json({
      success: true,
      message: 'Owner restored successfully',
      data: owner
    });

  } catch (err: any) {
    console.error('Error restoring owner:', err);
    res.status(500).json({
      success: false,
      message: 'Error restoring owner',
      error: err.message
    });
  }
};