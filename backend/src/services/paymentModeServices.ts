import { Response } from 'express';
import { PaymentMode } from '../models/paymentmode'; 
import { USERS } from "../utils/costants";
const { ROLES } = USERS;

// Create Payment Mode
export const createPaymentMode = async (req: any, res: Response) => {
  const { modelname, sortorder, isOnline, isActive } = req.body;
  
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    
    const existing = await PaymentMode.findOne({ where: { modelname } });
    if (existing) {
      return res.status(400).json({ message: 'Payment mode already exists' });
    }

    const paymentMode = await PaymentMode.create({ 
      modelname, 
      sortorder, 
      isOnline,
      isActive
    });

    res.status(201).json({ 
      message: 'Payment mode created successfully', 
      paymentMode 
    });
    return;
    
   } catch (err: any) {
    res.status(500).json({
        message: 'Error create Payment modes',
        error: err.message,
      });
  }
};

// List All Payment Modes
export const listPaymentModes = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const paymentModes = await PaymentMode.findAll();

    res.status(200).json({
      message: 'Payment modes retrieved successfully',
      count: paymentModes.length,
      paymentModes
    });
    return;
    
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error retrieving Payment modes',
      error: error.message,
    });
  }
};


// Get Payment Mode by ID
export const getPaymentModeById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const paymentMode = await PaymentMode.findByPk(id);

    if (!paymentMode || paymentMode.isDeleted) {
      return res.status(404).json({ message: 'Payment mode not found' });
    }

    res.status(200).json({ paymentMode });
  } catch (err: any) {
    res.status(500).json({ 
       message: 'Error retrieving Payment modes',
      error: err.message,
    });
  }
};

// Update Payment Mode by ID
export const updatePaymentMode = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { modelname, sortorder, isOnline, isActive } = req.body;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const paymentMode = await PaymentMode.findByPk(id);

    if (!paymentMode || paymentMode.isDeleted) {
      return res.status(404).json({ message: 'Payment mode not found' });
    }

    await paymentMode.update({ modelname, sortorder, isOnline, isActive });

    res.status(200).json({ message: 'Payment mode updated successfully', paymentMode });
  } catch (err: any) {
    res.status(500).json({ 
       message: 'Error updating Payment modes',
      error: err.message,
    });
  }
};


// Soft Delete using DELETE method
export const deletePaymentMode = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const paymentMode = await PaymentMode.findByPk(id);

    if (!paymentMode || paymentMode.isDeleted) {
      return res.status(404).json({ message: 'Payment mode not found or already deleted' });
    }

    await paymentMode.update({ isDeleted: true });

    res.status(200).json({ message: 'Payment mode deleted (soft) successfully' });
  } catch (err: any) {
    res.status(500).json({ 
      message: 'Error deleting Payment modes',
      error: err.message,
    });
  }
};

// Restore
export const restorePaymentMode = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const paymentMode = await PaymentMode.unscoped().findByPk(id); 

    if (!paymentMode) {
      return res.status(404).json({ message: 'Payment mode not found' });
    }

    if (!paymentMode.isDeleted) {
      return res.status(400).json({ message: 'Payment mode is already active' });
    }

    await paymentMode.update({ isDeleted: false });

    res.status(200).json({ message: 'Payment mode restored successfully' });
  } catch (err: any) {
    res.status(500).json({ 
     message: 'Error restoring Payment modes',
      error: err.message,
    });
  }
};

// Filter by isActive (active/inactive)
export const filterPaymentModesByStatus = async (req: any, res: Response) => {
  try {
    const role = req.role;
    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const { status } = req.query;

    let isActive: boolean | undefined;

    if (status === 'active') {
      isActive = true;
    } else if (status === 'inactive') {
      isActive = false;
    }

    const paymentModes = await PaymentMode.findAll({
      where: {
        ...(isActive !== undefined ? { isActive } : {})
      }
    });

    res.status(200).json({
      message: `Payment modes${status ? ` (${status})` : ''} retrieved successfully`,
      count: paymentModes.length,
      paymentModes
    });
  } catch (err: any) {
    res.status(500).json({ 
      message: 'Error filterPaymentModesByStatus Payment modes',
      error: err.message,
    });
  }
};

// Filter Payment Modes by isOnline
export const getPaymentModesByOnlineStatus = async (req: any, res: Response) => {
  try {
    const role = req.role;

    if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    // Convert query param to boolean
    const isOnlineParam = req.query.isOnline;

    if (typeof isOnlineParam === 'undefined') {
      return res.status(400).json({ message: 'Missing isOnline query parameter' });
    }

    const isOnline = isOnlineParam === 'true';

    const paymentModes = await PaymentMode.findAll({
      where: { isOnline }
    });

    res.status(200).json({
      message: `Payment modes with isOnline = ${isOnline}`,
      count: paymentModes.length,
      paymentModes
    });

  } catch (err: any) {
    res.status(500).json({ 
      message: 'Error getPaymentModesByOnlineStatus  Payment modes',
      error: err.message,
     });
  }
};