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

/**
 * OT Inventory access: Admin, Doctor, Nurse, and ALL Data Entry users (any level).
 * Data Entry Level 5 also inherits OT Operations access via requireOperationsAccess.
 */
export const requireInventoryAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const canAccess =
    user?.role === 'admin' ||
    user?.role === 'doctor' ||
    user?.role === 'nurse' ||
    user?.role === 'data_entry';

  if (!canAccess) {
    return res.status(403).json({
      error: 'Access denied. Insufficient permissions.'
    });
  }

  next();
};
