import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

const pad = (value: number) => String(value).padStart(2, '0');
const OT_DAY_MINUTES = 8 * 60;
const localDate = (date: Date, timeZone = 'Asia/Kolkata') => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};
const minutesFromTime = (time?: string | null) => {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};
const minutesToClock = (minutes: number) => `${pad(Math.floor(minutes / 60))}h ${pad(minutes % 60)}m`;
const utilizationForRows = (rows: Array<{ ot_start_time: string | null }>) => {
  const timeStrings = rows
    .map((row) => row.ot_start_time)
    .filter((value): value is string => Boolean(value))
    .sort();
  const registrationTimes = rows
    .map((row) => minutesFromTime(row.ot_start_time))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  const firstStart = registrationTimes[0];
  const finalEnd = registrationTimes.at(-1);
  const occupied = firstStart !== undefined && finalEnd !== undefined && finalEnd > firstStart ? finalEnd - firstStart : 0;
  const downtime = Math.max(OT_DAY_MINUTES - occupied, 0);
  return {
    occupied_minutes: occupied,
    downtime_minutes: downtime,
    occupancy_rate: Math.min(Math.round((occupied / OT_DAY_MINUTES) * 100), 100),
    first_ot_start: timeStrings[0] || null,
    final_case_time: timeStrings.at(-1) || null
  };
};

export const getSummary = async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const today = localDate(now);
  const [year, month] = today.split('-');
  const monthStart = `${year}-${month}-01`;
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [todayResult, monthResult, yearResult, todayTimes] = await Promise.all([
    supabase.from('ot_records').select('id', { count: 'exact', head: true }).eq('ot_date', today),
    supabase.from('ot_records').select('id', { count: 'exact', head: true }).gte('ot_date', monthStart).lte('ot_date', today),
    supabase.from('ot_records').select('id', { count: 'exact', head: true }).gte('ot_date', yearStart).lte('ot_date', yearEnd),
    supabase.from('ot_records').select('ot_start_time').eq('ot_date', today).order('ot_start_time', { ascending: true })
  ]);

  const times = todayTimes.data || [];
  const utilization = utilizationForRows(times);

  res.json({
    today_count: todayResult.count || 0,
    month_count: monthResult.count || 0,
    year_count: yearResult.count || 0,
    earliest_ot_today: utilization.first_ot_start,
    latest_case_today: utilization.final_case_time,
    occupancy_rate_today: utilization.occupancy_rate,
    downtime_today: minutesToClock(utilization.downtime_minutes)
  });
};

export const getMonthlyAnalytics = async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const first = `${year}-${pad(month)}-01`;
  const last = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('ot_records')
    .select('ot_date, anesthesia_type, ot_start_time')
    .gte('ot_date', first)
    .lte('ot_date', last)
    .order('ot_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const daysInMonth = new Date(year, month, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${pad(month)}-${pad(index + 1)}`;
    const rows = (data || []).filter((record) => record.ot_date === date);
    const starts = rows.map((record) => record.ot_start_time).filter(Boolean).sort();
    return {
      date,
      day: index + 1,
      cases: rows.length,
      first_case_time: starts[0] || null,
      last_case_time: starts.at(-1) || null,
      ...utilizationForRows(rows)
    };
  });

  const anesthesiaMap = new Map<string, number>();
  for (const record of data || []) {
    anesthesiaMap.set(record.anesthesia_type, (anesthesiaMap.get(record.anesthesia_type) || 0) + 1);
  }

  res.json({
    daily,
    anesthesiaBreakdown: Array.from(anesthesiaMap, ([name, value]) => ({ name, value }))
  });
};

export const getYearlyAnalytics = async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const first = `${year}-01-01`;
  const last = `${year}-12-31`;

  const { data, error } = await supabase
    .from('ot_records')
    .select('ot_date, consultant_name')
    .gte('ot_date', first)
    .lte('ot_date', last)
    .order('ot_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  let cumulative = 0;
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const monthRows = (data || []).filter((record) => Number(record.ot_date.slice(5, 7)) === index + 1);
    cumulative += monthRows.length;
    const consultantCounts = new Map<string, number>();
    for (const row of monthRows) {
      consultantCounts.set(row.consultant_name, (consultantCounts.get(row.consultant_name) || 0) + 1);
    }
    const topConsultant = Array.from(consultantCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    return {
      month: index + 1,
      label: new Date(year, index, 1).toLocaleString('en-US', { month: 'short' }),
      cases: monthRows.length,
      cumulative,
      top_consultant: topConsultant
    };
  });

  const consultantTotals = new Map<string, number>();
  for (const record of data || []) {
    consultantTotals.set(record.consultant_name, (consultantTotals.get(record.consultant_name) || 0) + 1);
  }

  res.json({
    monthly,
    topConsultants: Array.from(consultantTotals, ([name, cases]) => ({name, cases }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10)
  });
};
