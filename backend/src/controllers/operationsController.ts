import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

type OperationsSection = 'inventory' | 'sterilization' | 'fumigation' | 'culture';
type OperationsOverview = {
  date: string;
  inventory: Array<Record<string, string | number>>;
  sterilization: Array<Record<string, string | number>>;
  fumigation: Array<Record<string, string | number>>;
  culture: Array<Record<string, string | number>>;
  articles: Array<Record<string, string | number>>;
  updated_by?: string;
  updated_at?: string;
};

const globalInventoryKey = '__global_inventory__';
const globalArticlesKey = '__global_articles__';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const defaultInventory = () => [
    { category: 'Anesthesia', item: 'Propofol 10 mg/ml', stock: 42, unit: 'vials', reorder_level: 20, status: 'Adequate' },
    { category: 'Anesthesia', item: 'Bupivacaine Heavy 0.5%', stock: 18, unit: 'ampoules', reorder_level: 24, status: 'Reorder' },
    { category: 'Antibiotics', item: 'Ceftriaxone 1 g', stock: 86, unit: 'vials', reorder_level: 40, status: 'Adequate' },
    { category: 'Antibiotics', item: 'Piperacillin-Tazobactam 4.5 g', stock: 14, unit: 'vials', reorder_level: 18, status: 'Reorder' },
    { category: 'Analgesics', item: 'Paracetamol IV 1 g', stock: 64, unit: 'bottles', reorder_level: 30, status: 'Adequate' },
    { category: 'Analgesics', item: 'Tramadol 50 mg/ml', stock: 22, unit: 'ampoules', reorder_level: 20, status: 'Adequate' },
    { category: 'Life Saving Drugs', item: 'Adrenaline 1 mg/ml', stock: 28, unit: 'ampoules', reorder_level: 20, status: 'Adequate' },
    { category: 'Life Saving Drugs', item: 'Atropine 0.6 mg/ml', stock: 16, unit: 'ampoules', reorder_level: 20, status: 'Reorder' }
];

const defaultArticles = () => [
    { item_name: 'Anesthesia Workstation', category: 'Anesthesia', asset_tag: 'OT-ANES-001', location: 'OT-1', purchase_date: '2022-01-15', warranty_expiry: '2027-01-14', next_maintenance_date: '2024-07-15', status: 'Functional' },
    { item_name: 'C-Arm Machine', category: 'Imaging', asset_tag: 'OT-IMG-001', location: 'OT-2', purchase_date: '2021-11-20', warranty_expiry: '2026-11-19', next_maintenance_date: '2024-06-20', status: 'Maintenance Required' },
    { item_name: 'Operating Table', category: 'Tables', asset_tag: 'OT-TBL-001', location: 'OT-1', purchase_date: '2023-05-10', warranty_expiry: '2033-05-09', next_maintenance_date: '2024-11-10', status: 'Functional' }
];

const defaultOverview = (date: string): OperationsOverview => ({
  date,
  inventory: defaultInventory(),
  articles: defaultArticles(),
  sterilization: [
    { set_name: 'Major laparotomy set', method: 'Autoclave', cycle: '134 C / 30 min', indicator: 'Passed', released_by: 'CSSD Incharge', time: '07:20' },
    { set_name: 'Minor procedure set', method: 'Autoclave', cycle: '134 C / 30 min', indicator: 'Passed', released_by: 'OT Nurse', time: '08:05' },
    { set_name: 'Laparoscopic tower instruments', method: 'ETO', cycle: 'Overnight', indicator: 'Passed', released_by: 'CSSD Incharge', time: '06:45' },
    { set_name: 'Dressing drums', method: 'Autoclave', cycle: '121 C / 45 min', indicator: 'Passed', released_by: 'OT Nurse', time: '07:40' }
  ],
  fumigation: [
    { area: 'Main OT', method: 'Hydrogen peroxide vapor', started_at: '20:00', completed_at: '21:15', next_due: 'Tomorrow 20:00', status: 'Completed' },
    { area: 'Pre-op room', method: 'Sodium hypochlorite terminal cleaning', started_at: '19:20', completed_at: '20:00', next_due: 'Tomorrow 19:30', status: 'Completed' },
    { area: 'Recovery bay', method: 'UV cycle + surface disinfection', started_at: '18:30', completed_at: '19:00', next_due: 'Today 18:30', status: 'Due Today' }
  ],
  culture: [
    { sample: 'OT air settle plate', site: 'Main OT center', collected_on: date, result: 'No growth', status: 'Clear' },
    { sample: 'Instrument trolley swab', site: 'Sterile trolley', collected_on: date, result: 'No growth', status: 'Clear' },
    { sample: 'AC vent swab', site: 'Laminar airflow vent', collected_on: date, result: 'Awaited', status: 'Pending' },
    { sample: 'Floor swab', site: 'Near operating table', collected_on: date, result: 'No pathogenic growth', status: 'Clear' }
  ]
});

const readStore = async (): Promise<Record<string, OperationsOverview>> => {
  try {
    const { data, error } = await supabase.from('ot_operations').select('*');
    if (error) {
      console.error('Error reading from Supabase ot_operations:', error.message);
      return {};
    }
    const store: Record<string, OperationsOverview> = {};
    (data || []).forEach((row) => {
      store[row.date] = row.data;
    });
    return store;
  } catch (err) {
    console.error('Fatal error reading ot_operations:', err);
    return {};
  }
};

const writeEntry = async (date: string, data: OperationsOverview, updatedBy: string) => {
  const { error } = await supabase
    .from('ot_operations')
    .upsert({
      date,
      data,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    });
  if (error) {
    console.error(`Error writing to Supabase ot_operations for date ${date}:`, error.message);
    if (error.code === 'PGRST205' || error.message.includes("Could not find the table 'public.ot_operations'")) {
      return false;
    }
    throw new Error(`Database write failed: ${error.message}`);
  }
  return true;
};

const normalizeDate = (value: unknown) => String(value || today()).slice(0, 10);
const dailySections: OperationsSection[] = ['sterilization', 'fumigation', 'culture'];
const sortInventory = (rows: Array<Record<string, string | number>>) =>
  [...rows].sort((a, b) =>
    String(a.category || '').trim().localeCompare(String(b.category || '').trim(), undefined, {
      sensitivity: 'base',
      numeric: true
    }) ||
    String(a.item || '').trim().localeCompare(String(b.item || '').trim(), undefined, {
      sensitivity: 'base',
      numeric: true
    })
  );

const normalizeInventory = (rows: Array<Record<string, string | number>>) =>
  sortInventory(rows).map((row) => {
    const stock = Number(row.stock) || 0;
    const reorderLevel = Number(row.reorder_level) || 0;
    return {
      ...row,
      category: String(row.category || '').trim(),
      item: String(row.item || '').trim(),
      unit: String(row.unit || '').trim(),
      stock,
      reorder_level: reorderLevel,
      shortage: Math.max(reorderLevel - stock, 0),
      status: stock <= 0 ? 'Critical' : stock <= reorderLevel ? 'Reorder' : 'Adequate'
    };
  });

const getGlobalInventory = (store: Record<string, OperationsOverview>, date: string) =>
  normalizeInventory(store[globalInventoryKey]?.inventory || store[date]?.inventory || defaultInventory());

const sortArticles = (rows: Array<Record<string, string | number>>) =>
  [...rows].sort((a, b) =>
    String(a.category || '').trim().localeCompare(String(b.category || '').trim()) ||
    String(a.item_name || '').trim().localeCompare(String(b.item_name || '').trim())
  );

const normalizeArticles = (rows: Array<Record<string, string | number>>) =>
  sortArticles(rows).map((row) => ({
    ...row,
    item_name: String(row.item_name || '').trim(),
    category: String(row.category || '').trim(),
    asset_tag: String(row.asset_tag || '').trim(),
    location: String(row.location || '').trim(),
    status: String(row.status || 'Functional')
  }));

const getGlobalArticles = (store: Record<string, OperationsOverview>, date: string) =>
  normalizeArticles(store[globalArticlesKey]?.articles || store[date]?.articles || defaultArticles());

export const getOperationsOverview = async (req: AuthRequest, res: Response) => {
  const date = normalizeDate(req.query.date);
  const store = await readStore();
  const daily = store[date] || defaultOverview(date);
  res.json({
    ...daily,
    date,
    inventory: getGlobalInventory(store, date),
    articles: getGlobalArticles(store, date)
  });
};

export const saveOperationsOverview = async (req: AuthRequest, res: Response) => {
  const date = normalizeDate(req.body.date || req.query.date);
  const store = await readStore();
  const current = store[date] || defaultOverview(date);
  const updatedBy = req.user?.full_name || req.user?.email || 'User';
  
  const next: OperationsOverview = {
    ...current,
    inventory: getGlobalInventory(store, date),
    articles: getGlobalArticles(store, date),
    date,
    updated_by: updatedBy,
    updated_at: new Date().toISOString()
  };

  // If inventory is provided, update global inventory record
  if (Array.isArray(req.body.inventory)) {
    const globalInventoryData = {
      ...(store[globalInventoryKey] || defaultOverview(globalInventoryKey)),
      date: globalInventoryKey,
      inventory: normalizeInventory(req.body.inventory.map((row: Record<string, string | number>) => ({ ...row }))),
      updated_by: updatedBy,
      updated_at: next.updated_at
    };
    await writeEntry(globalInventoryKey, globalInventoryData, updatedBy);
    next.inventory = globalInventoryData.inventory;
  }

  // If articles are provided, update global articles record
  if (Array.isArray(req.body.articles)) {
    const globalArticlesData = {
      ...(store[globalArticlesKey] || defaultOverview(globalArticlesKey)),
      date: globalArticlesKey,
      articles: normalizeArticles(req.body.articles.map((row: Record<string, string | number>) => ({ ...row }))),
      updated_by: updatedBy,
      updated_at: next.updated_at
    };
    await writeEntry(globalArticlesKey, globalArticlesData, updatedBy);
    next.articles = globalArticlesData.articles;
  }

  for (const section of dailySections) {
    if (Array.isArray(req.body[section])) {
      next[section] = req.body[section].map((row: Record<string, string | number>) => ({ ...row }));
    }
  }

  const persisted = await writeEntry(date, next, updatedBy);
  res.json({
    ...next,
    persistence_status: persisted ? 'saved' : 'schema_unavailable'
  });
};
