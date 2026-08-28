import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Drivers } from '../models/drivers';
import config from '../config/config';

export interface AuthenticatedRequest extends Request {
  userId?: any;
  role?: string;
  driverId?: string;
  user?: any;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization || (req.headers as any)?.Authorization;
  if (typeof authHeader === 'string' && authHeader.trim()) {
    const trimmed = authHeader.trim();
    if (trimmed.startsWith('Bearer ')) {
      token = trimmed.substring(7).trim();
    } else if (trimmed.startsWith('Bearer')) {
      token = trimmed.substring(6).trim();
    } else {
      token = trimmed;
    }
  }

  if (!token && req.query?.token) {
    token = String(req.query.token).trim();
  }
  if (!token && req.body?.token) {
    token = String(req.body.token).trim();
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Not authorized, Please add token' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || config.security.jwtSecret || 'jk23DFEo';
    const decoded = jwt.verify(token, jwtSecret) as {
      userId?: any;
      roles?: string;
      role?: string;
      driverId?: string;
      id?: string;
      companyId?: string;
    };

    req.userId = decoded.userId || decoded.id || decoded.driverId;
    req.role = decoded.roles || decoded.role;
    if (req.role === 'driver' || decoded.driverId) {
      req.driverId = decoded.driverId || String(req.userId);
    }

    next();
  } catch (err: any) {
    console.error('JWT verification error in authMiddleware:', err?.message);
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

