import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';
import { roles } from '../types';

export const getMe = async (req: AuthRequest, res: Response) => {
  res.json({
    id: req.user?.db_id,
    firebase_uid: req.user?.uid,
    email: req.user?.email,
    full_name: req.user?.full_name,
    role: req.user?.role
  });
};

export const getUsers = async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (!roles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const { data, error } = await supabase.from('users').update({ role }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  if (req.user?.db_id === req.params.id) return res.status(400).json({ error: 'You cannot delete your own account' });
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
};
