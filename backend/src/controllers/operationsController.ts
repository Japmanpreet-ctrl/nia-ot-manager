import { promises as fs } from 'fs';
import path from 'path';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

type OperationsSection = 'inventory' | 'sterilization' | 'fumigation' | 'culture';
type OperationsOverview = {
  date: string;
  inventory: Array<Record<string, string | number>>;
  sterilization: Array<Record<string, string | number>>;
  fumigation: Array<Record<string, string | number>>;
  culture: Array<Record<string, string | number>>;
  updated_by?: string;
  updated_at?: string;
};

const dataDir = path.resolve(__dirname, '../../data');
const dataFile = path.join(dataDir, 'operations.json');
const globalInventoryKey = '__global_inventory__';
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

const defaultOverview = (date: string): OperationsOverview => ({
  date,
  inventory: defaultInventory(),
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
    return JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch {
    return {};
  }
};

const writeStore = async (store: Record<string, OperationsOverview>) => {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2));
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

export const getOperationsOverview = async (req: AuthRequest, res: Response) => {
  const date = normalizeDate(req.query.date);
  const store = await readStore();
  const daily = store[date] || defaultOverview(date);
  res.json({
    ...daily,
    date,
    inventory: getGlobalInventory(store, date)
  });
};

export const saveOperationsOverview = async (req: AuthRequest, res: Response) => {
  const date = normalizeDate(req.body.date || req.query.date);
  const store = await readStore();
  const current = store[date] || defaultOverview(date);
  const next: OperationsOverview = {
    ...current,
    inventory: getGlobalInventory(store, date),
    date,
    updated_by: req.user?.full_name || req.user?.email || 'User',
    updated_at: new Date().toISOString()
  };

  if (Array.isArray(req.body.inventory)) {
    store[globalInventoryKey] = {
      ...(store[globalInventoryKey] || defaultOverview(globalInventoryKey)),
      date: globalInventoryKey,
      inventory: normalizeInventory(req.body.inventory.map((row: Record<string, string | number>) => ({ ...row }))),
      updated_by: next.updated_by,
      updated_at: next.updated_at
    };
    next.inventory = store[globalInventoryKey].inventory;
  }

  for (const section of dailySections) {
    if (Array.isArray(req.body[section])) {
      next[section] = req.body[section].map((row: Record<string, string | number>) => ({ ...row }));
    }
  }

  store[date] = next;
  await writeStore(store);
  res.json(next);
};
