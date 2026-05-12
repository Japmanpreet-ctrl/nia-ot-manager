import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

const allowedFields = [
  'opd_number',
  'ipd_number',
  'patient_name',
  'gender',
  'age',
  'diagnosis',
  'surgical_procedure',
  'anesthesia_type',
  'ot_date',
  'ot_start_time',
  'final_case_time',
  'consultant_name',
  'anesthetist_name',
  'first_assistant',
  'second_assistant',
  'notes'
];

const sanitizeRecordBody = (body: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) clean[field] = body[field] === '' ? null : body[field];
  }
  return clean;
};

const liveIndiaRegistration = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}:${get('second')}`
  };
};

export const getRecords = async (req: AuthRequest, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const search = String(req.query.search || '').trim();

  let query = supabase
    .from('ot_records')
    .select('*', { count: 'exact' })
    .order('ot_date', { ascending: false })
    .order('ot_start_time', { ascending: false })
    .range(from, to);

  if (search) {
    const safeSearch = search.replace(/[%,()]/g, ' ').trim();
    query = query.or(`patient_name.ilike.%${safeSearch}%,opd_number.ilike.%${safeSearch}%,ipd_number.ilike.%${safeSearch}%`);
  }
  if (req.query.date) query = query.eq('ot_date', String(req.query.date));
  if (req.query.consultant) query = query.eq('consultant_name', String(req.query.consultant));
  if (req.query.anesthesia_type) query = query.eq('anesthesia_type', String(req.query.anesthesia_type));

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.max(Math.ceil((count || 0) / limit), 1)
  });
};

export const getRecordById = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase.from('ot_records').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Record not found' });
  res.json(data);
};

export const createRecord = async (req: AuthRequest, res: Response) => {
  const registration = liveIndiaRegistration();
  const payload = {
    ...sanitizeRecordBody(req.body),
    ot_date: registration.date,
    ot_start_time: registration.time,
    final_case_time: registration.time,
    created_by_uid: req.user?.uid,
    created_by_name: req.user?.full_name || req.user?.email
  };

  const { data, error } = await supabase.from('ot_records').insert(payload).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const updateRecord = async (req: AuthRequest, res: Response) => {
  const payload = sanitizeRecordBody(req.body);
  const { data, error } = await supabase
    .from('ot_records')
    .update(payload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const deleteRecord = async (req: AuthRequest, res: Response) => {
  const { error } = await supabase.from('ot_records').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
};
