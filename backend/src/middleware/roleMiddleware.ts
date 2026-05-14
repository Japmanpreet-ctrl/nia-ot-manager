import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };

export const requireOperationsAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const canAccess =
    user?.role === 'admin' ||
    user?.role === 'doctor' ||
    user?.role === 'nurse' ||
    (user?.role === 'data_entry' && user.role_level === 5);

  if (!canAccess) {
    return res.status(403).json({
      error: 'Access denied. Insufficient permissions.'
    });
  }

  next();
};
