import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';
import { consumableCatalog, type ConsumableSection } from '../data/consumableCatalog';

type OperationsSection = 'inventory' | 'sterilization' | 'fumigation' | 'culture';
type InventoryBatch = {
  id: string;
  batch_number: string;
  quantity: number;
  received_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  is_opening_stock?: boolean;
};
type InventoryRow = Record<string, unknown> & {
  section?: string;
  category?: string;
  item?: string;
  stock?: number | string;
  unit?: string;
  reorder_level?: number | string;
  batches?: InventoryBatch[];
};
type OperationsOverview = {
  date: string;
  inventory: InventoryRow[];
  sterilization: Array<Record<string, string | number>>;
  fumigation: Array<Record<string, string | number>>;
  culture: Array<Record<string, string | number>>;
  articles: Array<Record<string, string | number>>;
  /** Catalog rows deliberately removed by staff, so they are not reseeded on save. */
  deleted_inventory_keys?: string[];
  updated_by?: string;
  updated_at?: string;
};

const globalInventoryKey = '__global_inventory__';
const globalArticlesKey = '__global_articles__';
const operationsStorageBucket = 'ot-operations';
const operationsStoragePath = 'store.json';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const validConsumableSections: ConsumableSection[] = ['Surgery OPD', 'Operation Theatre', 'Shalya Tantra'];
const anaesthesiaCategory = 'Anaesthesia & airway management';
const consumableCategoryRenames: Record<string, string> = {
  anesthesia: anaesthesiaCategory,
  'surgical consumables & sutures': 'Surgery',
  'surgical draping & operative-field preparation': 'Surgery',
  'dressing & wound management': 'Dressing, examination & minor procedures',
  'general examination & patient care': 'Dressing, examination & minor procedures',
  'minor procedures & opd interventions': 'Dressing, examination & minor procedures'
};
const normalizeConsumableCategory = (value: unknown) => {
  const category = String(value || '').trim();
  return consumableCategoryRenames[category.toLocaleLowerCase()] || category;
};

const defaultInventory = () => [
    { category: anaesthesiaCategory, item: 'Propofol 10 mg/ml', stock: 42, unit: 'vials', reorder_level: 20, status: 'Adequate' },
    { category: anaesthesiaCategory, item: 'Bupivacaine Heavy 0.5%', stock: 18, unit: 'ampoules', reorder_level: 24, status: 'Reorder' },
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

const isMissingOperationsTable = (error: { code?: string; message?: string } | null | undefined) =>
  Boolean(
    error &&
    (error.code === 'PGRST205' ||
      error.message?.includes("Could not find the table 'public.ot_operations'"))
  );

const readStorageStore = async (): Promise<Record<string, OperationsOverview>> => {
  try {
    const { data, error } = await supabase.storage
      .from(operationsStorageBucket)
      .download(operationsStoragePath);

    if (error) {
      if (error.message?.toLowerCase().includes('not found')) return {};
      console.error('Error reading Supabase storage operations store:', error.message);
      return {};
    }

    return JSON.parse(await data.text()) as Record<string, OperationsOverview>;
  } catch (err) {
    console.error('Fatal error reading storage operations store:', err);
    return {};
  }
};

const writeStorageStore = async (store: Record<string, OperationsOverview>) => {
  const payload = JSON.stringify(store, null, 2);
  const file = new Blob([payload], { type: 'application/json' });

  const upload = async () =>
    supabase.storage
      .from(operationsStorageBucket)
      .upload(operationsStoragePath, file, {
        contentType: 'application/json',
        upsert: true,
      });

  let { error } = await upload();
  if (error && error.message?.toLowerCase().includes('bucket not found')) {
    const { error: bucketError } = await supabase.storage.createBucket(operationsStorageBucket, {
      public: false,
    });
    if (bucketError && !bucketError.message?.toLowerCase().includes('already exists')) {
      console.error('Error creating Supabase storage operations bucket:', bucketError.message);
      return false;
    }
    ({ error } = await upload());
  }

  if (error) {
    console.error('Error writing Supabase storage operations store:', error.message);
    return false;
  }

  return true;
};

const readStore = async (): Promise<Record<string, OperationsOverview>> => {
  try {
    const { data, error } = await supabase.from('ot_operations').select('*');
    if (error) {
      if (isMissingOperationsTable(error)) {
        return readStorageStore();
      }
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
    if (isMissingOperationsTable(error)) {
      const store = await readStorageStore();
      store[date] = data;
      return writeStorageStore(store);
    }
    console.error(`Error writing to Supabase ot_operations for date ${date}:`, error.message);
    throw new Error(`Database write failed: ${error.message}`);
  }
  return true;
};

const normalizeDate = (value: unknown) => String(value || today()).slice(0, 10);
const dailySections: OperationsSection[] = ['sterilization', 'fumigation', 'culture'];
const sortInventory = (rows: InventoryRow[]) =>
  [...rows].sort((a, b) =>
    String(a.section || 'Operation Theatre').trim().localeCompare(String(b.section || 'Operation Theatre').trim(), undefined, {
      sensitivity: 'base',
      numeric: true
    }) ||
    String(a.category || '').trim().localeCompare(String(b.category || '').trim(), undefined, {
      sensitivity: 'base',
      numeric: true
    }) ||
    String(a.item || '').trim().localeCompare(String(b.item || '').trim(), undefined, {
      sensitivity: 'base',
      numeric: true
    })
  );

const batchId = (seed: string) => `batch-${seed.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'item'}`;
const dateKey = (value?: string | null) => value?.slice(0, 10) || null;
const todayKey = () => today();

const normalizeBatches = (row: InventoryRow): InventoryBatch[] => {
  const fallbackStock = Math.max(Number(row.stock) || 0, 0);
  const source = Array.isArray(row.batches)
    ? row.batches
    : fallbackStock > 0
      ? [{
          id: batchId(`opening-${row.section || 'operation-theatre'}-${row.category || ''}-${row.item || ''}`),
          batch_number: 'Opening stock',
          quantity: fallbackStock,
          notes: 'Migrated from stock recorded before batch tracking.',
          is_opening_stock: true
        }]
      : [];

  const usedIds = new Set<string>();
  const batchNumberCounts = new Map<string, number>();
  return source.map((value, index) => {
    const raw = value && typeof value === 'object' ? value as Partial<InventoryBatch> : {};
    let id = String(raw.id || batchId(`${row.section || 'operation-theatre'}-${row.category || ''}-${row.item || ''}-${index + 1}`)).trim();
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    const baseBatchNumber = String(raw.batch_number || (raw.is_opening_stock ? 'Opening stock' : `Batch ${index + 1}`)).trim();
    const batchNumberKey = baseBatchNumber.toLocaleLowerCase();
    const occurrence = (batchNumberCounts.get(batchNumberKey) || 0) + 1;
    batchNumberCounts.set(batchNumberKey, occurrence);
    return {
      id,
      batch_number: occurrence === 1 ? baseBatchNumber : `${baseBatchNumber} (${occurrence})`,
      quantity: Math.max(Number(raw.quantity) || 0, 0),
      received_date: dateKey(raw.received_date),
      expiry_date: dateKey(raw.expiry_date),
      notes: raw.notes ? String(raw.notes).trim() : null,
      is_opening_stock: Boolean(raw.is_opening_stock)
    };
  });
};

const getExpiryDetails = (batches: InventoryBatch[]) => {
  const activeBatches = batches.filter((batch) => batch.quantity > 0);
  const expired = activeBatches.filter((batch) => batch.expiry_date && batch.expiry_date < todayKey());
  const usable = activeBatches.filter((batch) => !batch.expiry_date || batch.expiry_date >= todayKey());
  const datedUsable = usable.filter((batch) => batch.expiry_date).sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));
  const nextExpiry = datedUsable[0]?.expiry_date || null;
  const expiringSoon = datedUsable.some((batch) => {
    const expiry = new Date(`${batch.expiry_date}T00:00:00Z`).getTime();
    const days = Math.floor((expiry - new Date(`${todayKey()}T00:00:00Z`).getTime()) / 86_400_000);
    return days <= 90;
  });
  const hasNoExpiry = usable.some((batch) => !batch.expiry_date);
  return {
    usableStock: usable.reduce((sum, batch) => sum + batch.quantity, 0),
    nextExpiry,
    expiryStatus: expired.length > 0
      ? 'Expired'
      : expiringSoon
        ? 'Expiring Soon'
        : activeBatches.length === 0
          ? 'No Batches'
          : hasNoExpiry
            ? 'No Expiry Recorded'
            : 'In Date'
  };
};

const normalizeInventoryRow = (row: InventoryRow): InventoryRow => {
    const normalizedRow = { ...row, category: normalizeConsumableCategory(row.category) };
    const batches = normalizeBatches(normalizedRow);
    const { usableStock, nextExpiry, expiryStatus } = getExpiryDetails(batches);
    const stock = usableStock;
    const reorderLevel = Number(normalizedRow.reorder_level) || 0;
    return {
      ...normalizedRow,
      section: validConsumableSections.includes(normalizedRow.section as ConsumableSection)
        ? normalizedRow.section
        : 'Operation Theatre',
      category: normalizedRow.category,
      item: String(normalizedRow.item || '').trim(),
      unit: String(normalizedRow.unit || '').trim(),
      stock,
      batches,
      expiry_status: expiryStatus,
      next_expiry_date: nextExpiry,
      reorder_level: reorderLevel,
      shortage: Math.max(reorderLevel - stock, 0),
      status: stock === 0 && reorderLevel === 0
        ? 'Not Stocked'
        : stock <= 0
          ? 'Critical'
          : stock <= reorderLevel
            ? 'Reorder'
            : 'Adequate'
    };
  };

/** Combines exact duplicate consumables created by a category merger without losing stock history. */
const consolidateDuplicateInventoryRows = (rows: InventoryRow[]) => {
  const combined = new Map<string, InventoryRow>();
  rows.forEach((row) => {
    const key = [row.category, row.item]
      .map((value) => String(value || '').trim().toLocaleLowerCase())
      .join('|');
    const existing = combined.get(key);
    if (key === '|') {
      combined.set(`${key}|${combined.size}`, row);
      return;
    }
    if (!existing) {
      combined.set(key, row);
      return;
    }
    combined.set(key, {
      ...existing,
      unit: String(existing.unit || row.unit || '').trim(),
      reorder_level: Math.max(Number(existing.reorder_level) || 0, Number(row.reorder_level) || 0),
      batches: [...(existing.batches || []), ...(row.batches || [])]
    });
  });
  return [...combined.values()];
};

const normalizeInventory = (rows: InventoryRow[]) =>
  sortInventory(consolidateDuplicateInventoryRows(rows.map(normalizeInventoryRow))).map(normalizeInventoryRow);

const inventoryKey = (row: InventoryRow) =>
  [row.section || 'Operation Theatre', row.category, row.item]
    .map((value) => String(value || '').trim().toLocaleLowerCase())
    .join('|');

const normalizeDeletedInventoryKeys = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((key): key is string => typeof key === 'string' && key.trim().length > 0)))
    : [];

const catalogInventoryKeys = new Set(consumableCatalog.map(inventoryKey));

/** Adds approved catalog rows once, except rows explicitly removed by staff. */
const mergeCatalogIntoInventory = (
  rows: InventoryRow[],
  deletedKeys: string[] = []
) => {
  const existing = normalizeInventory(rows);
  const keys = new Set(existing.map(inventoryKey));
  const deleted = new Set(normalizeDeletedInventoryKeys(deletedKeys));
  const missing = consumableCatalog.filter((row) => !keys.has(inventoryKey(row)) && !deleted.has(inventoryKey(row)));
  return normalizeInventory([...existing, ...missing]);
};

const getGlobalInventory = (store: Record<string, OperationsOverview>, date: string) => {
  const global = store[globalInventoryKey];
  return mergeCatalogIntoInventory(
    global?.inventory || store[date]?.inventory || defaultInventory(),
    global?.deleted_inventory_keys
  );
};

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
    const submittedInventory = normalizeInventory(
      req.body.inventory.map((row: InventoryRow) => ({ ...row }))
    );
    const submittedKeys = new Set(submittedInventory.map(inventoryKey));
    const previouslyDeleted = normalizeDeletedInventoryKeys(store[globalInventoryKey]?.deleted_inventory_keys);
    const deletedInventoryKeys = Array.from(new Set([
      ...previouslyDeleted.filter((key) => !submittedKeys.has(key)),
      ...Array.from(catalogInventoryKeys).filter((key) => !submittedKeys.has(key))
    ])).sort();
    const globalInventoryData = {
      ...(store[globalInventoryKey] || defaultOverview(globalInventoryKey)),
      date: globalInventoryKey,
      inventory: mergeCatalogIntoInventory(submittedInventory, deletedInventoryKeys),
      deleted_inventory_keys: deletedInventoryKeys,
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
