import { Request, Response } from 'express';
import axios from 'axios';
import { Pickuparea } from '../models';
import { USERS } from "../utils/costants";
import { Op } from 'sequelize';
const { ROLES } = USERS;



// GET SINGLE AREA BY ID

export const listPickUpArea = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let whereCondition = {};

    if (status === "1") {
      // Return only deleted entries
      whereCondition = { isDeleted: true };
    } else {
      // Return only active entries
      whereCondition = { isDeleted: false };
    }

    const pickuparea = await Pickuparea.unscoped().findAll({
      where: whereCondition
    });

    res.status(200).json({
      message: 'pickarea retrieved successfully',
      data: pickuparea,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving pickarea',
      error: error.message,
    });
  }
};

export const getPickupAreaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Area ID is required' });
    }

    const area = await Pickuparea.findOne({
      where: { 
        areaId: id,
      }
    });

    if (!area) {
      return res.status(404).json({ message: 'Pickup area not found' });
    }

    res.status(200).json({
      message: 'Pickup area retrieved successfully',
      data: area,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving pickup area',
      error: error.message,
    });
  }
};

// UPDATE AREA ONLY (Separate from city updates)
export const updatePickupArea = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { pickupCity, pickupArea} = req.body; // Only allow area-specific fields
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Area ID is required' });
    }

    const area = await Pickuparea.findOne({
      where: { 
        areaId: id,
      }
    });

    if (!area) {
      return res.status(404).json({ message: 'Pickup area not found' });
    }

    // Check for duplicate area name if changing
    if (pickupArea && pickupArea !== area.pickupArea) {
      const duplicate = await Pickuparea.findOne({
        where: {
      
          pickupCity: area.pickupCity,
          pickupArea:area.pickupArea,
          areaId:{ [Op.ne]: id } 
        }
      });

      if (duplicate) {
        return res.status(400).json({
          message: 'An area with this name already exists in the same city',
        });
      }
    }

    // Update ONLY area-specific fields
    await area.update({
       pickupCity:pickupCity || area.pickupCity,
      pickupArea: pickupArea || area.pickupArea
      // Note: country, state, pickupCity are NOT updated here
    });

    res.status(200).json({
      message: 'Pickup area updated successfully',
      data: area,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating pickup area',
      error: error.message,
    });
  }
};

// DELETE AREA
export const deletePickupArea = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Area ID is required' });
    }

    const area = await Pickuparea.unscoped().findOne({
      where: { 
        areaId: id,
      }
    });

    if (!area) {
      return res.status(404).json({ message: 'Pickup area not found' });
    }

    await area.update({isDeleted:true});

    res.status(200).json({
      message: 'Pickup area deleted successfully',
      deletedArea:area
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error deleting pickup area',
      error: error.message,
    });
  }
};

// RESTORE AREA
export const restorePickupArea = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Area ID is required' });
    }

    const area = await Pickuparea.unscoped().findOne({
      where: { areaId: id }
    });

    if (!area) {
      return res.status(404).json({ message: 'Pickup area not found' });
    }

    // Set isDeleted to false
    await area.update({ isDeleted: false });

    res.status(200).json({
      message: 'Pickup area restored successfully',
      restoredArea: area
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error restoring pickup area',
      error: error.message,
    });
  }
};

