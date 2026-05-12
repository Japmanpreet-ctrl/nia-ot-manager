import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    full_name: string;
    db_id: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await admin.auth().verifyIdToken(token);
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', decoded.uid)
      .single();

    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          firebase_uid: decoded.uid,
          email: decoded.email || '',
          full_name: decoded.name || decoded.email || 'User',
          role: 'data_entry',
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

      req.user = {
        uid: decoded.uid,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
        db_id: userData.id,
      };
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
