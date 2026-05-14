import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';
import { supabase } from '../config/supabase';
import { formatAllowedDomainsHint, isEmailAllowedForAccess, isExternalAdminEmail } from '../config/emailAccess';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    role_level?: number | null;
    full_name: string;
    db_id: string;
  };
}

const getUserRoleLevel = (userData: Record<string, unknown>): number | null => {
  const raw = userData.role_level ?? userData.roleLevel ?? userData.level ?? null;
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await admin.auth().verifyIdToken(token);
    const tokenEmail = decoded.email ?? '';
    if (!isEmailAllowedForAccess(tokenEmail)) {
      return res.status(403).json({
        error: `This app is restricted to approved institute accounts (${formatAllowedDomainsHint()}).`,
      });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', decoded.uid)
      .single();

    if (!userData) {
      const isExternalAdmin = isExternalAdminEmail(decoded.email);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          firebase_uid: decoded.uid,
          email: decoded.email || '',
          full_name: decoded.name || decoded.email || 'User',
          role: isExternalAdmin ? 'admin' : 'data_entry',
        })
        .select()
        .single();

      if (insertError || !newUser) {
        return res.status(500).json({ error: insertError?.message || 'Unable to register user' });
      }

      req.user = {
        uid: decoded.uid,
        email: decoded.email || '',
        role: newUser.role,
        role_level: getUserRoleLevel(newUser),
        full_name: newUser.full_name,
        db_id: newUser.id,
      };
    } else {
      // Backward compatibility: migrate legacy role `student` to `data_entry`.
      if (userData.role === 'student') {
        const { data: migratedUser } = await supabase
          .from('users')
          .update({ role: 'data_entry' })
          .eq('id', userData.id)
          .select()
          .single();
        if (migratedUser) {
          userData.role = migratedUser.role;
        }
      }

      if (isExternalAdminEmail(userData.email) && userData.role !== 'admin') {
        const { data: promotedUser } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userData.id)
          .select()
          .single();
        if (promotedUser) {
          userData.role = promotedUser.role;
        }
      }

      req.user = {
        uid: decoded.uid,
        email: userData.email,
        role: userData.role,
        role_level: getUserRoleLevel(userData),
        full_name: userData.full_name,
        db_id: userData.id,
      };
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
