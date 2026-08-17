import { Request, Response } from 'express';
import { Pickupcity } from '../models';
import { USERS } from "../utils/costants";
import { Op } from 'sequelize';
const { ROLES } = USERS;


// GET SINGLE CITY BY ID

export const listPickupCity = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let pickupcity;

    if (status === '1') {
      // Trashed entries: soft deleted (isDeleted = true) records மட்டும்
      pickupcity = await Pickupcity.unscoped().findAll({
        where: {
          isDeleted: true,
        },
      });
    } else {
      // Normal entries: soft deleted ஆகாத (isDeleted = false) records மட்டும்
      pickupcity = await Pickupcity.findAll({
        where: {
          isDeleted: false,
        },
      });
    }

    res.status(200).json({
      message: 'pickCity retrieved successfully',
      data: pickupcity,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving pickarea',
      error: error.message,
    });
  }
};
export const getPickupCityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'City ID is required' });
    }

    const city = await  Pickupcity.findOne({
      where: { 
        cityId: id,
   
      }
    });

    if (!city) {
      return res.status(404).json({ message: 'Pickup city not found' });
    }

    res.status(200).json({
      message: 'Pickup city retrieved successfully',
      data: city,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving pickup city',
      error: error.message,
    });
  }
};

// UPDATE CITY ONLY - FIXED VERSION
export const updatePickupCity = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { country, state, pickupCity, sortOrder, isPickupCity } = req.body;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'City ID is required' });
    }

    const city = await Pickupcity.findOne({
      where: { 
        cityId: id,
      }
    });

    if (!city) {
      return res.status(404).json({ message: 'Pickup city not found' });
    }

    // Check for duplicate city name if changing
    if (pickupCity && pickupCity !== city.pickupCity) {
      const duplicate = await Pickupcity.findOne({
        where: {

          pickupCity,
          cityId: { [Op.ne]: id } 
        }
      });

      if (duplicate) {
        return res.status(400).json({
          message: 'A city with this name already exists in the same state',
        });
      }
    }

    // Update the city record
    await city.update({
      country: country || city.country,
      state: state || city.state,
      pickupCity: pickupCity || city.pickupCity,
      sortOrder: sortOrder || city.sortOrder,
      isPickupCity: isPickupCity || city.isPickupCity,
    });

    // Reload to get updated data
    await city.reload();

    res.status(200).json({
      message: 'Pickup city updated successfully',
      data: city,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating pickup city',
      error: error.message,
    });
  }
};

// DELETE CITY
export const deletePickupCity = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'City ID is required' });
    }

    const city = await  Pickupcity.unscoped().findOne({
      where: { 
        cityId: id,
      }
    });

    if (!city) {
      return res.status(404).json({ message: 'Pickup city not found' });
    }

   

    await city.update({isDeleted:true});

    res.status(200).json({
      message: 'Pickup city deleted successfully',
      deletedCity: {
        name: city.pickupCity,
        country: city.country,
        state: city.state
      }
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error deleting pickup city',
      error: error.message,
    });
  }
};

// RESTORE CITY
export const restorePickupCity = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'City ID is required' });
    }

    const city = await Pickupcity.unscoped().findOne({
      where: {
        cityId: id
      }
    });

    if (!city) {
      return res.status(404).json({ message: 'Pickup city not found' });
    }

    // Restore by setting isDeleted = false
    await city.update({ isDeleted: false });

    res.status(200).json({
      message: 'Pickup city restored successfully',
      restoredCity: {
        name: city.pickupCity,
        country: city.country,
        state: city.state
      }
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error restoring pickup city',
      error: error.message,
    });
  }
};
