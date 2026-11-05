import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, Boxes, CheckCircle2, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { getApiErrorMessage } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useOperationsOverview, useSaveOperationsOverview } from '../hooks/useAnalytics';
import { useUiStore } from '../store/uiStore';
import { PageWrapper } from '../components/layout/PageWrapper';
import type { ConsumableBatch, ConsumableExpiryStatus, OperationsOverview } from '../types';

type InventoryRow = OperationsOverview['inventory'][number];

const blankItem: InventoryRow = {
  // Kept for backward-compatible persistence; Hospital Consumables is one unified UI register.
  section: 'Operation Theatre',
  category: 'Anaesthesia & airway management',
  item: '',
  stock: 0,
  unit: 'vials',
  reorder_level: 0,
  shortage: 0,
  status: 'Not Stocked',
  batches: [],
  expiry_status: 'No Batches',
  next_expiry_date: null
};

export const Inventory = () => {
  const { can } = useAuth();
  const showToast = useUiStore((state) => state.showToast);
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data, isLoading, isError, error, refetch } = useOperationsOverview(today);
  const saveInventory = useSaveOperationsOverview();
  const [draft, setDraft] = useState<OperationsOverview | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [panel, setPanel] = useState<{ mode: 'add' | 'update'; index?: number } | null>(null);
  const [batchIndex, setBatchIndex] = useState<number | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  if (!can('view_inventory')) return <Navigate to="/dashboard" replace />;

  const rows = draft?.inventory || [];
  const categories = useMemo(() => Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).sort(), [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        const matchesSearch = !query || [row.category, row.item, row.unit, row.status, row.expiry_status].some((value) => String(value || '').toLowerCase().includes(query));
        const matchesCategory = category === 'all' || row.category === category;
        const matchesStatus = status === 'all' || row.status === status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => a.row.category.localeCompare(b.row.category) || a.row.item.localeCompare(b.row.item));
  }, [category, rows, search, status]);

  const critical = rows.filter((row) => row.status === 'Critical').length;
  const reorder = rows.filter((row) => row.status === 'Reorder').length;
  const totalStock = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  const batchItem = batchIndex === null ? null : draft?.inventory[batchIndex] || null;

  const upsertRow = (row: InventoryRow, index?: number) => {
    setDraft((current) => {
      if (!current) return current;
      const inventory = [...current.inventory];
      if (typeof index === 'number') inventory[index] = normalizeInventoryRow(row);
      else inventory.push(normalizeInventoryRow(row));
      return { ...current, inventory };
    });
    setPanel(null);
  };

  const deleteRow = (index: number) => {
    setDraft((current) => current ? { ...current, inventory: current.inventory.filter((_, rowIndex) => rowIndex !== index) } : current);
  };

  const saveBatches = (batches: ConsumableBatch[]) => {
    if (batchIndex === null) return;
    setDraft((current) => {
      if (!current || !current.inventory[batchIndex]) return current;
      const inventory = [...current.inventory];
      inventory[batchIndex] = normalizeInventoryRow({ ...inventory[batchIndex], batches });
      return { ...current, inventory };
    });
    setBatchIndex(null);
  };

  const save = async () => {
    if (!draft) return;
    const duplicate = findDuplicate(draft.inventory);
    if (duplicate) {
      showToast('error', `Duplicate inventory item: ${duplicate}`);
      return;
    }
    try {
      const saved = await saveInventory.mutateAsync({ ...draft, date: today });
      setDraft(saved);
      showToast('success', 'Hospital Consumables saved');
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    }
  };

  return (
    <PageWrapper title="Hospital Consumables" subtitle="Unified stock register with batch-level quantity and expiry tracking">
      <div className="grid gap-5 md:grid-cols-4">
        <InventoryStat title="Catalog Items" value={rows.length} icon={Boxes} tone="teal" />
        <InventoryStat title="Usable Stock Units" value={totalStock} icon={CheckCircle2} tone="blue" />
        <InventoryStat title="Reorder" value={reorder} icon={AlertTriangle} tone={reorder ? 'amber' : 'emerald'} />
        <InventoryStat title="Critical" value={critical} icon={AlertTriangle} tone={critical ? 'red' : 'emerald'} />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Hospital Consumables Register</h2>
            <p className="mt-1 text-sm text-slate-500">Usable stock excludes expired batches. Batches within 90 days of expiry are highlighted.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPanel({ mode: 'add' })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Plus className="h-4 w-4" />
              Add Consumable
            </button>
            <button type="button" onClick={save} disabled={!draft || saveInventory.isPending} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saveInventory.isPending ? 'Saving...' : 'Save Inventory'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 lg:grid-cols-[1fr_220px_150px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search consumable, category, unit, status, or expiry" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500">
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500">
            <option value="all">All status</option>
            <option value="Adequate">Adequate</option>
            <option value="Reorder">Reorder</option>
            <option value="Critical">Critical</option>
            <option value="Not Stocked">Not Stocked</option>
          </select>
          <button type="button" onClick={() => { setSearch(''); setCategory('all'); setStatus('all'); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <X className="h-4 w-4" />
            Reset
          </button>
        </div>

        {panel && draft && (
          <InventoryPanel
            title={panel.mode === 'add' ? 'Add Consumable' : 'Update Consumable'}
            categories={categories}
            initialRow={panel.mode === 'update' && typeof panel.index === 'number' ? draft.inventory[panel.index] : blankItem}
            onCancel={() => setPanel(null)}
            onSubmit={(row) => upsertRow(row, panel.mode === 'update' ? panel.index : undefined)}
          />
        )}

        {isLoading ? (
          <div className="p-8 text-sm font-semibold text-slate-500">Loading inventory...</div>
        ) : isError ? (
          <div className="space-y-3 p-8">
            <p className="text-sm font-semibold text-red-600">{getApiErrorMessage(error)}</p>
            <button type="button" onClick={() => refetch()} className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Retry</button>
          </div>
        ) : !draft ? (
          <div className="p-8 text-sm font-semibold text-slate-500">No inventory data found for today.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Category</th><th>Consumable</th><th>Usable Stock</th><th>Unit</th><th>Batches</th><th>Expiry</th><th>Reorder Level</th><th>Shortage</th><th>Status</th><th className="text-right">Action</th></tr>
              </thead>
              <tbody>
                {filteredRows.map(({ row, index }) => (
                  <tr key={index} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{row.category}</span></td>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.item}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.stock}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.unit}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => setBatchIndex(index)} className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100">Manage {row.batches?.length || 0}</button></td>
                    <td className="px-4 py-3"><ExpiryBadge status={row.expiry_status || 'No Batches'} date={row.next_expiry_date} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.reorder_level}</td>
                    <td className="px-4 py-3"><span className={Number(row.shortage || 0) > 0 ? 'font-bold text-red-600' : 'font-semibold text-emerald-600'}>{row.shortage || 0}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setPanel({ mode: 'update', index })} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Pencil className="h-3.5 w-3.5" />Update
                        </button>
                        <button type="button" onClick={() => deleteRow(index)} className="inline-flex rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {batchItem && <BatchManager item={batchItem} onCancel={() => setBatchIndex(null)} onSave={saveBatches} />}
    </PageWrapper>
  );
};

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100';

const InventoryPanel = ({ title, categories, initialRow, onCancel, onSubmit }: {
  title: string;
  categories: string[];
  initialRow: InventoryRow;
  onCancel: () => void;
  onSubmit: (row: InventoryRow) => void;
}) => {
  const [form, setForm] = useState<InventoryRow>({ ...initialRow });
  const [useCustomCategory, setUseCustomCategory] = useState(!categories.includes(String(initialRow.category || '')));

  const update = (key: keyof InventoryRow, value: string) => {
    const nextValue = key === 'reorder_level' ? Number(value) : value;
    setForm((current) => normalizeInventoryRow({ ...current, [key]: nextValue }));
  };

  return (
    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5">
      <div className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">Stock is calculated from batches. Use Manage Batches after saving to receive or update stock.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[210px_1fr_160px_140px]">
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Category</span>
            {useCustomCategory ? (
              <input value={String(form.category || '')} onChange={(event) => update('category', event.target.value)} className={inputClass} />
            ) : (
              <select value={String(form.category || '')} onChange={(event) => update('category', event.target.value)} className={inputClass}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            )}
            <button type="button" onClick={() => setUseCustomCategory((value) => !value)} className="mt-1 text-xs font-bold text-teal-700 hover:text-teal-800">
              {useCustomCategory ? 'Use existing category' : 'New category'}
            </button>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Consumable</span>
            <input value={String(form.item || '')} onChange={(event) => update('item', event.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Unit</span>
            <input value={String(form.unit || '')} onChange={(event) => update('unit', event.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Reorder Level</span>
            <input type="number" min={0} value={String(form.reorder_level ?? 0)} onChange={(event) => update('reorder_level', event.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <StatusBadge status={form.status} />
          <p className="text-sm font-semibold text-slate-600">Usable stock: <span className="text-teal-700">{form.stock || 0}</span> · Shortage: <span className={Number(form.shortage || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}>{form.shortage || 0}</span></p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={() => onSubmit(normalizeInventoryRow(form))} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700">Apply</button>
        </div>
      </div>
    </div>
  );
};

const normalizeInventoryRow = (row: InventoryRow): InventoryRow => {
  const batches = (row.batches || []).map((batch) => ({
    ...batch,
    quantity: Math.max(Number(batch.quantity) || 0, 0),
    expiry_date: batch.expiry_date || null,
    received_date: batch.received_date || null,
    notes: batch.notes || null
  }));
  const details = calculateBatchDetails(batches);
  const stock = details.usableStock;
  const reorderLevel = Number(row.reorder_level) || 0;
  return {
    ...row,
    batches,
    stock,
    reorder_level: reorderLevel,
    shortage: Math.max(reorderLevel - stock, 0),
    expiry_status: details.expiryStatus,
    next_expiry_date: details.nextExpiry,
    status: stock === 0 && reorderLevel === 0 ? 'Not Stocked' : stock <= 0 ? 'Critical' : stock <= reorderLevel ? 'Reorder' : 'Adequate'
  };
};

const calculateBatchDetails = (batches: ConsumableBatch[]) => {
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const active = batches.filter((batch) => batch.quantity > 0);
  const expired = active.filter((batch) => Boolean(batch.expiry_date && batch.expiry_date < currentDate));
  const usable = active.filter((batch) => !batch.expiry_date || batch.expiry_date >= currentDate);
  const datedUsable = usable.filter((batch) => batch.expiry_date).sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));
  const nextExpiry = datedUsable[0]?.expiry_date || null;
  const expiringSoon = datedUsable.some((batch) => daysUntil(batch.expiry_date) <= 90);
  const expiryStatus: ConsumableExpiryStatus = expired.length > 0
    ? 'Expired'
    : expiringSoon
      ? 'Expiring Soon'
      : active.length === 0
        ? 'No Batches'
        : usable.some((batch) => !batch.expiry_date)
          ? 'No Expiry Recorded'
          : 'In Date';
  return { usableStock: usable.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0), nextExpiry, expiryStatus };
};

const daysUntil = (date?: string | null) => date
  ? Math.floor((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`).getTime()) / 86_400_000)
  : Number.POSITIVE_INFINITY;

const getSingleBatchExpiryStatus = (batch: ConsumableBatch): ConsumableExpiryStatus => {
  if (batch.quantity <= 0) return 'No Batches';
  if (!batch.expiry_date) return 'No Expiry Recorded';
  if (batch.expiry_date < format(new Date(), 'yyyy-MM-dd')) return 'Expired';
  return daysUntil(batch.expiry_date) <= 90 ? 'Expiring Soon' : 'In Date';
};

const createBatchId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const BatchManager = ({ item, onCancel, onSave }: {
  item: InventoryRow;
  onCancel: () => void;
  onSave: (batches: ConsumableBatch[]) => void;
}) => {
  const [batches, setBatches] = useState<ConsumableBatch[]>(item.batches || []);
  const [error, setError] = useState('');
  const updateBatch = (index: number, key: keyof ConsumableBatch, value: string) => {
    setBatches((current) => current.map((batch, batchIndex) => batchIndex === index
      ? { ...batch, [key]: key === 'quantity' ? Math.max(Number(value) || 0, 0) : value || null }
      : batch));
  };
  const addBatch = () => setBatches((current) => [...current, {
    id: createBatchId(), batch_number: '', quantity: 0,
    received_date: format(new Date(), 'yyyy-MM-dd'), expiry_date: null, notes: null
  }]);
  const removeBatch = (index: number) => setBatches((current) => current.filter((_, batchIndex) => batchIndex !== index));
  const apply = () => {
    const numbers = batches.map((batch) => batch.batch_number.trim().toLowerCase());
    if (batches.some((batch) => !batch.batch_number.trim())) return setError('Enter a batch or lot number for every batch.');
    if (new Set(numbers).size !== numbers.length) return setError('Each batch or lot number must be unique for this consumable.');
    onSave(batches);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 sm:p-8">
      <div className="mx-auto my-4 w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Batch register</p><h2 className="mt-1 text-xl font-bold text-slate-900">{item.item}</h2><p className="mt-1 text-sm text-slate-500">Expired quantity is excluded from usable stock. Batches expiring within 90 days are flagged.</p></div>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-600">Usable stock after saving: <span className="text-teal-700">{calculateBatchDetails(batches).usableStock} {item.unit}</span></p><button type="button" onClick={addBatch} className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100"><Plus className="h-4 w-4" />Add Batch</button></div>
          {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          {batches.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">No batches recorded. Add a batch to receive stock for this consumable.</div> : <div className="space-y-3">
            {batches.map((batch, index) => <div key={batch.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.15fr_130px_160px_160px_1fr_auto]">
                <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Batch / Lot no.</span><input value={batch.batch_number} onChange={(event) => updateBatch(index, 'batch_number', event.target.value)} placeholder="e.g. LOT-2026-014" className={inputClass} /></label>
                <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Available quantity</span><input type="number" min={0} value={String(batch.quantity)} onChange={(event) => updateBatch(index, 'quantity', event.target.value)} className={inputClass} /></label>
                <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Received date</span><input type="date" value={batch.received_date || ''} onChange={(event) => updateBatch(index, 'received_date', event.target.value)} className={inputClass} /></label>
                <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Expiry date</span><input type="date" value={batch.expiry_date || ''} onChange={(event) => updateBatch(index, 'expiry_date', event.target.value)} className={inputClass} /></label>
                <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span><input value={batch.notes || ''} onChange={(event) => updateBatch(index, 'notes', event.target.value)} placeholder={batch.is_opening_stock ? 'Opening stock; expiry not recorded' : 'Optional'} className={inputClass} /></label>
                <div className="flex items-end"><button type="button" onClick={() => removeBatch(index)} className="h-11 rounded-xl p-3 text-red-500 hover:bg-red-50" aria-label={`Remove ${batch.batch_number || 'batch'}`}><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <div className="mt-3"><ExpiryBadge status={getSingleBatchExpiryStatus(batch)} date={batch.expiry_date} /></div>
            </div>)}
          </div>}
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 py-4"><button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" onClick={apply} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700">Apply Batches</button></div>
      </div>
    </div>
  );
};

const findDuplicate = (rows: InventoryRow[]) => {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.category}`.trim().toLowerCase() + '|' + `${row.item}`.trim().toLowerCase();
    if (!row.category || !row.item) continue;
    if (seen.has(key)) return `${row.item} (${row.category})`;
    seen.add(key);
  }
  return '';
};

const toneMap: Record<string, string> = {
  teal: 'bg-teal-50 text-teal-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  emerald: 'bg-emerald-50 text-emerald-600'
};

const InventoryStat = ({ title, value, icon: Icon, tone }: { title: string; value: number; icon: typeof Boxes; tone: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-2xl p-3 ${toneMap[tone] || toneMap.teal}`}><Icon className="h-6 w-6" /></div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const critical = status === 'Critical';
  const alert = ['Reorder', 'Critical'].includes(status);
  const unstocked = status === 'Not Stocked';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${critical ? 'bg-red-100 text-red-700' : alert ? 'bg-amber-100 text-amber-700' : unstocked ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
      {alert ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
};

const ExpiryBadge = ({ status, date }: { status: ConsumableExpiryStatus; date?: string | null }) => {
  const styles: Record<ConsumableExpiryStatus, string> = {
    'Expired': 'bg-red-100 text-red-700',
    'Expiring Soon': 'bg-amber-100 text-amber-700',
    'In Date': 'bg-emerald-100 text-emerald-700',
    'No Expiry Recorded': 'bg-blue-100 text-blue-700',
    'No Batches': 'bg-slate-100 text-slate-600'
  };
  const label = date && ['In Date', 'Expiring Soon'].includes(status)
    ? `${status} · ${format(new Date(`${date}T00:00:00`), 'dd MMM yyyy')}`
    : status;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{label}</span>;
};
