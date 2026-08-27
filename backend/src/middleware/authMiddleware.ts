import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Drivers } from '../models/drivers';

export interface AuthenticatedRequest extends Request {
  userId?: any;
  role?: string;
  driverId?: string;
  user?: any;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, Please add token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: any;
      roles?: string;
      role?: string;
      driverId?: string;
      id?: string;
    };

    req.userId = decoded.userId || decoded.driverId || decoded.id;
    req.role = decoded.roles || decoded.role;
    if (req.role === 'driver' || decoded.driverId) {
      req.driverId = decoded.driverId || String(req.userId);
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not valid or expired token' });
  }
};

export const driverAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, driver token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: any;
      roles?: string;
      role?: string;
      driverId?: string;
      id?: string;
    };

    const userRole = (decoded.roles || decoded.role || '').toLowerCase();
    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, message: 'Access forbidden: Driver role required' });
    }

    const driverId = String(decoded.driverId || decoded.userId || decoded.id);
    req.userId = driverId;
    req.role = 'driver';
    req.driverId = driverId;

    // Verify driver exists and is active
    const driver = await Drivers.unscoped().findByPk(driverId);
    if (!driver || driver.isDeleted) {
      return res.status(401).json({ success: false, message: 'Driver account inactive or not found' });
    }

    // Heartbeat update on every authenticated driver request
    driver.lastSeenAt = new Date();
    await driver.save().catch(() => {});

    req.user = driver;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired driver session' });
  }
};

