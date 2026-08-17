import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: number;
  role?: string;
}

export const authMiddleware = (  req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  //console.log("jwtsecret: ",process.env.JWT_SECRET);
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, Please add token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      roles: string;
    };

    req.userId = decoded.userId;
    req.role = decoded.roles;
    //console.log("userid & role: ",req.userId,req.role);
   

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not valid' });
  }
};
