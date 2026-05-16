import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

/* ─────────────────────── helpers ─────────────────────── */

const parsePositiveInt = (value: unknown, fallback = 0): number => {
  const n = parseInt(String(value ?? fallback), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Derive status from counts — prevents negative stock logic */
const deriveStatus = (
  available: number,
  inLaundry: number,
  damaged: number,
  threshold: number
): string => {
  if (available <= 0 && inLaundry === 0) return 'Out of Stock';
  if (damaged > 0 && available <= 0) return 'Damaged';
  if (inLaundry > 0 && available <= 0) return 'In Laundry';
  if (available <= threshold) return 'Low Stock';
  return 'Available';
};

const writeAuditLog = async (payload: {
  linen_item_id: string | null;
  action: string;
  quantity_change?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  performed_by_uid?: string;
  performed_by_name?: string;
}) => {
  try {
    await supabase.from('ot_linen_audit_logs').insert(payload);
  } catch {
    // audit failures must not break the main flow
  }
};

/* ─────────────────────── GET /linen/stats ─────────────────────── */
export const getLinenStats = async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('ot_linen_items')
    .select('quantity_available, in_laundry, damaged, minimum_threshold, status')
    .eq('is_deleted', false);

  if (error) {
    console.error('Supabase error in getLinenStats:', error);
    return res.status(500).json({ error: error.message });
  }

  const rows = data || [];
  const stats = {
    total_items: rows.length,
    total_available: rows.reduce((s, r) => s + (r.quantity_available ?? 0), 0),
    total_in_laundry: rows.reduce((s, r) => s + (r.in_laundry ?? 0), 0),
    total_damaged: rows.reduce((s, r) => s + (r.damaged ?? 0), 0),
    low_stock_count: rows.filter((r) => (r.quantity_available ?? 0) <= (r.minimum_threshold ?? 0) && (r.quantity_available ?? 0) > 0).length,
    out_of_stock_count: rows.filter((r) => r.status === 'Out of Stock').length,
  };

  res.json(stats);
};

/* ─────────────────────── GET /linen/items ─────────────────────── */
export const getLinenItems = async (req: AuthRequest, res: Response) => {
  const page = Math.max(parseInt(String(req.query.page || '1')), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const status = String(req.query.status || '').trim();
  const laundryStatus = String(req.query.laundry_status || '').trim();

  let query = supabase
    .from('ot_linen_items')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('category', { ascending: true })
    .order('item_name', { ascending: true })
    .range(from, to);

  if (search) {
    query = query.ilike('item_name', `%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (laundryStatus) {
    // Filter by items that have active laundry logs with this status
    const { data: laundryItems } = await supabase
      .from('ot_linen_laundry_logs')
      .select('linen_item_id')
      .eq('laundry_status', laundryStatus);
    const ids = (laundryItems || []).map((l) => l.linen_item_id);
    if (ids.length > 0) {
      query = query.in('id', ids);
    } else {
      return res.json({ data: [], total: 0, page, totalPages: 1 });
    }
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('Supabase error in getLinenItems:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json({
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.max(Math.ceil((count || 0) / limit), 1),
  });
};

/* ─────────────────────── POST /linen/items ─────────────────────── */
export const createLinenItem = async (req: AuthRequest, res: Response) => {
  const { item_name, category, quantity_available, minimum_threshold, unit, notes, damaged, in_laundry } = req.body;

  if (!item_name || !category) {
    return res.status(400).json({ error: 'item_name and category are required.' });
  }

  const available = parsePositiveInt(quantity_available);
  const threshold = parsePositiveInt(minimum_threshold);
  const damagedQty = parsePositiveInt(damaged);
  const inLaundryQty = parsePositiveInt(in_laundry);

  const status = deriveStatus(available, inLaundryQty, damagedQty, threshold);

  const payload = {
    item_name: String(item_name).trim(),
    category: String(category).trim(),
    quantity_available: available,
    in_laundry: inLaundryQty,
    damaged: damagedQty,
    minimum_threshold: threshold,
    unit: String(unit || 'pieces').trim(),
    status,
    notes: notes ? String(notes).trim() : null,
    is_deleted: false,
    created_by_uid: req.user?.uid,
    created_by_name: req.user?.full_name || req.user?.email,
    updated_by_uid: req.user?.uid,
    updated_by_name: req.user?.full_name || req.user?.email,
  };

  const { data, error } = await supabase
    .from('ot_linen_items')
    .insert(payload)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await writeAuditLog({
    linen_item_id: data.id,
    action: 'created',
    new_values: data,
    performed_by_uid: req.user?.uid,
    performed_by_name: req.user?.full_name || req.user?.email,
  });

  res.status(201).json(data);
};

/* ─────────────────────── PUT /linen/items/:id ─────────────────────── */
export const updateLinenItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('ot_linen_items')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (fetchError || !existing) return res.status(404).json({ error: 'Linen item not found.' });

  const available = parsePositiveInt(req.body.quantity_available ?? existing.quantity_available);
  const threshold = parsePositiveInt(req.body.minimum_threshold ?? existing.minimum_threshold);
  const damagedQty = parsePositiveInt(req.body.damaged ?? existing.damaged);
  const inLaundryQty = parsePositiveInt(req.body.in_laundry ?? existing.in_laundry);

  const status = deriveStatus(available, inLaundryQty, damagedQty, threshold);

  const updates: Record<string, unknown> = {
    quantity_available: available,
    in_laundry: inLaundryQty,
    damaged: damagedQty,
    minimum_threshold: threshold,
    status,
    updated_by_uid: req.user?.uid,
    updated_by_name: req.user?.full_name || req.user?.email,
    updated_at: new Date().toISOString(),
  };

  if (req.body.item_name !== undefined) updates.item_name = String(req.body.item_name).trim();
  if (req.body.category !== undefined) updates.category = String(req.body.category).trim();
  if (req.body.unit !== undefined) updates.unit = String(req.body.unit).trim();
  if (req.body.notes !== undefined) updates.notes = req.body.notes ? String(req.body.notes).trim() : null;

  const { data, error } = await supabase
    .from('ot_linen_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await writeAuditLog({
    linen_item_id: id,
    action: 'updated',
    old_values: existing,
    new_values: data,
    performed_by_uid: req.user?.uid,
    performed_by_name: req.user?.full_name || req.user?.email,
  });

  res.json(data);
};

/* ─────────────────────── DELETE /linen/items/:id ─────────────────────── */
export const deleteLinenItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: existing } = await supabase
    .from('ot_linen_items')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (!existing) return res.status(404).json({ error: 'Linen item not found.' });

  const { error } = await supabase
    .from('ot_linen_items')
    .update({
      is_deleted: true,
      updated_by_uid: req.user?.uid,
      updated_by_name: req.user?.full_name || req.user?.email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });

  await writeAuditLog({
    linen_item_id: id,
    action: 'deleted',
    old_values: existing,
    performed_by_uid: req.user?.uid,
    performed_by_name: req.user?.full_name || req.user?.email,
  });

  res.json({ success: true });
};

/* ─────────────────────── GET /linen/laundry ─────────────────────── */
export const getLaundryLogs = async (req: AuthRequest, res: Response) => {
  const itemId = req.query.item_id ? String(req.query.item_id) : null;
  const status = req.query.status ? String(req.query.status) : null;

  let query = supabase
    .from('ot_linen_laundry_logs')
    .select(`*, ot_linen_items(item_name, category, unit)`)
    .order('created_at', { ascending: false });

  if (itemId) query = query.eq('linen_item_id', itemId);
  if (status) query = query.eq('laundry_status', status);

  const { data, error } = await query;
  if (error) {
    console.error('Supabase error in getLaundryLogs:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
};

/* ─────────────────────── POST /linen/laundry ─────────────────────── */
export const createLaundryLog = async (req: AuthRequest, res: Response) => {
  const { linen_item_id, quantity_sent, date_sent, expected_return_date, notes } = req.body;

  if (!linen_item_id || !quantity_sent || !date_sent || !expected_return_date) {
    return res.status(400).json({ error: 'linen_item_id, quantity_sent, date_sent, and expected_return_date are required.' });
  }

  const qtySent = parsePositiveInt(quantity_sent);
  if (qtySent <= 0) return res.status(400).json({ error: 'quantity_sent must be greater than 0.' });

  // Check the linen item exists and has enough stock
  const { data: item, error: itemError } = await supabase
    .from('ot_linen_items')
    .select('*')
    .eq('id', linen_item_id)
    .eq('is_deleted', false)
    .single();

  if (itemError || !item) return res.status(404).json({ error: 'Linen item not found.' });

  if (item.quantity_available < qtySent) {
    return res.status(400).json({
      error: `Not enough stock. Available: ${item.quantity_available}, Requested: ${qtySent}.`,
    });
  }

  // Create laundry log
  const { data: logEntry, error: logError } = await supabase
    .from('ot_linen_laundry_logs')
    .insert({
      linen_item_id,
      quantity_sent: qtySent,
      date_sent,
      expected_return_date,
      returned_quantity: 0,
      laundry_status: 'Sent',
      notes: notes ? String(notes).trim() : null,
      sent_by_uid: req.user?.uid,
      sent_by_name: req.user?.full_name || req.user?.email,
      updated_by_uid: req.user?.uid,
      updated_by_name: req.user?.full_name || req.user?.email,
    })
    .select()
    .single();

  if (logError) return res.status(400).json({ error: logError.message });

  // Update item: deduct from available, add to in_laundry
  const newAvailable = Math.max(item.quantity_available - qtySent, 0);
  const newInLaundry = (item.in_laundry || 0) + qtySent;
  const newStatus = deriveStatus(newAvailable, newInLaundry, item.damaged || 0, item.minimum_threshold || 0);

  const { error: updateError } = await supabase
    .from('ot_linen_items')
    .update({
      quantity_available: newAvailable,
      in_laundry: newInLaundry,
      status: newStatus,
      updated_by_uid: req.user?.uid,
      updated_by_name: req.user?.full_name || req.user?.email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', linen_item_id);

  if (updateError) return res.status(400).json({ error: updateError.message });

  await writeAuditLog({
    linen_item_id,
    action: 'laundry_sent',
    quantity_change: -qtySent,
    old_values: { quantity_available: item.quantity_available, in_laundry: item.in_laundry },
    new_values: { quantity_available: newAvailable, in_laundry: newInLaundry },
    performed_by_uid: req.user?.uid,
    performed_by_name: req.user?.full_name || req.user?.email,
  });

  res.status(201).json(logEntry);
};

/* ─────────────────────── PUT /linen/laundry/:id ─────────────────────── */
export const updateLaundryLog = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { returned_quantity, laundry_status, notes } = req.body;

  const { data: log, error: logFetchError } = await supabase
    .from('ot_linen_laundry_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (logFetchError || !log) return res.status(404).json({ error: 'Laundry log not found.' });

  const prevReturned = log.returned_quantity || 0;
  const newReturned = parsePositiveInt(returned_quantity ?? prevReturned);

  if (newReturned > log.quantity_sent) {
    return res.status(400).json({ error: `Returned quantity (${newReturned}) cannot exceed sent quantity (${log.quantity_sent}).` });
  }

  const deltaReturned = newReturned - prevReturned; // additional returned items this update
  const pending = log.quantity_sent - newReturned;
  const status = laundry_status || (pending === 0 ? 'Returned' : newReturned > 0 ? 'Partially Returned' : log.laundry_status);

  const { data: updatedLog, error: updateLogError } = await supabase
    .from('ot_linen_laundry_logs')
    .update({
      returned_quantity: newReturned,
      pending_quantity: pending,
      laundry_status: status,
      notes: notes !== undefined ? (notes ? String(notes).trim() : null) : log.notes,
      updated_by_uid: req.user?.uid,
      updated_by_name: req.user?.full_name || req.user?.email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateLogError) return res.status(400).json({ error: updateLogError.message });

  // Update item counts: returned items go back to available, removed from in_laundry
  if (deltaReturned !== 0) {
    const { data: item } = await supabase
      .from('ot_linen_items')
      .select('*')
      .eq('id', log.linen_item_id)
      .single();

    if (item) {
      const newAvailable = Math.max((item.quantity_available || 0) + deltaReturned, 0);
      const newInLaundry = Math.max((item.in_laundry || 0) - deltaReturned, 0);
      const newStatus = deriveStatus(newAvailable, newInLaundry, item.damaged || 0, item.minimum_threshold || 0);

      await supabase
        .from('ot_linen_items')
        .update({
          quantity_available: newAvailable,
          in_laundry: newInLaundry,
          status: newStatus,
          updated_by_uid: req.user?.uid,
          updated_by_name: req.user?.full_name || req.user?.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', log.linen_item_id);

      await writeAuditLog({
        linen_item_id: log.linen_item_id,
        action: 'laundry_returned',
        quantity_change: deltaReturned,
        old_values: { quantity_available: item.quantity_available, in_laundry: item.in_laundry },
        new_values: { quantity_available: newAvailable, in_laundry: newInLaundry },
        performed_by_uid: req.user?.uid,
        performed_by_name: req.user?.full_name || req.user?.email,
      });
    }
  }

  res.json(updatedLog);
};

/* ─────────────────────── GET /linen/audit ─────────────────────── */
export const getLinenAuditLogs = async (req: AuthRequest, res: Response) => {
  const itemId = req.query.item_id ? String(req.query.item_id) : null;
  const page = Math.max(parseInt(String(req.query.page || '1')), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '30')), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('ot_linen_audit_logs')
    .select(`*, ot_linen_items(item_name, category)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (itemId) query = query.eq('linen_item_id', itemId);

  const { data, error, count } = await query;
  if (error) {
    console.error('Supabase error in getLinenAuditLogs:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json({
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.max(Math.ceil((count || 0) / limit), 1),
  });
};
