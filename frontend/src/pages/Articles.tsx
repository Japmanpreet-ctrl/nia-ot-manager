import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { format, isBefore, addDays } from 'date-fns';
import { AlertTriangle, CheckCircle2, HardDrive, Pencil, Plus, Save, Trash2, X, type LucideIcon, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getApiErrorMessage } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useOperationsOverview, useSaveOperationsOverview } from '../hooks/useAnalytics';
import { useUiStore } from '../store/uiStore';
import { PageWrapper } from '../components/layout/PageWrapper';
import type { OperationsOverview } from '../types';

type ArticleRow = OperationsOverview['articles'][0];

const blankArticle: ArticleRow = {
  item_name: '',
  category: 'Anesthesia',
  asset_tag: '',
  location: 'OT-1',
  purchase_date: format(new Date(), 'yyyy-MM-dd'),
  warranty_expiry: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
  next_maintenance_date: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
  status: 'Functional'
};

const categories = ['Anesthesia', 'Imaging', 'Tables', 'Lights', 'Monitors', 'Cautery', 'Ventilators', 'Instruments', 'Other'];
const locations = ['OT-1', 'OT-2', 'OT-3', 'OT-4', 'CSSD', 'Recovery', 'Pre-op'];

export const Articles = () => {
  const { can } = useAuth();
  const showToast = useUiStore((state) => state.showToast);
  // Using today's date to fetch global articles
  const date = format(new Date(), 'yyyy-MM-dd');
  const { data, isLoading } = useOperationsOverview(date);
  const saveOverview = useSaveOperationsOverview();
  const [draft, setDraft] = useState<OperationsOverview | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [panel, setPanel] = useState<{ mode: 'add' | 'update'; index?: number } | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const rows = draft?.articles || [];

  const filteredRows = useMemo(() => {
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;
        if (locationFilter !== 'all' && row.location !== locationFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            row.item_name.toLowerCase().includes(q) ||
            row.asset_tag.toLowerCase().includes(q) ||
            row.category.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [rows, search, categoryFilter, locationFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: rows.length,
      functional: rows.filter((r) => r.status === 'Functional').length,
      maintenance: rows.filter((r) => r.status === 'Maintenance Required').length,
      warrantyExpiring: rows.filter((r) => {
        if (!r.warranty_expiry) return false;
        const expiry = new Date(r.warranty_expiry);
        // Expiring within 30 days
        const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diffDays > 0 && diffDays <= 30;
      }).length
    };
  }, [rows]);

  if (!can('view_operations')) return <Navigate to="/dashboard" replace />;

  const save = async () => {
    if (!draft) return;
    try {
      const saved = await saveOverview.mutateAsync({ ...draft, date });
      setDraft(saved);
      showToast('success', 'Articles saved successfully');
      setPanel(null);
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    }
  };

  const upsert = (item: ArticleRow, originalIndex?: number) => {
    setDraft((current) => {
      if (!current) return current;
      const updated = [...current.articles];
      if (typeof originalIndex === 'number') updated[originalIndex] = item;
      else updated.push(item);
      return { ...current, articles: updated };
    });
    setPanel(null);
  };

  const remove = (index: number) => {
    setDraft((current) => {
      if (!current) return current;
      const updated = current.articles.filter((_, i) => i !== index);
      return { ...current, articles: updated };
    });
  };

  return (
    <PageWrapper title="OT Permanent Articles" subtitle="Manage capital equipment and permanent assets">
      <div className="grid gap-5 md:grid-cols-4 mb-6">
        <StatCard title="Total Assets" value={stats.total} icon={HardDrive} tone="blue" />
        <StatCard title="Functional" value={stats.functional} icon={CheckCircle2} tone="emerald" />
        <StatCard title="Needs Maintenance" value={stats.maintenance} icon={AlertTriangle} tone={stats.maintenance ? 'amber' : 'slate'} />
        <StatCard title="Warranty Expiring Soon" value={stats.warrantyExpiring} icon={ShieldAlert} tone={stats.warrantyExpiring ? 'red' : 'slate'} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Articles Master Register</h2>
            <p className="mt-1 text-sm text-slate-500">Track equipment details, maintenance, and warranty status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPanel({ mode: 'add' })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Plus className="h-4 w-4" />
              Add Article
            </button>
            <button type="button" onClick={save} disabled={!draft || saveOverview.isPending} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saveOverview.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item name, asset tag, or category" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
          </label>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500">
            <option value="all">All locations</option>
            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {panel && draft && (
          <ArticlePanel
            title={panel.mode === 'add' ? 'Add Article' : 'Update Article'}
            initialRow={panel.mode === 'update' && typeof panel.index === 'number' ? draft.articles[panel.index] : blankArticle}
            onCancel={() => setPanel(null)}
            onSubmit={(row) => upsert(row, panel.mode === 'update' ? panel.index : undefined)}
          />
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading articles...</div>
          ) : (
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Asset Tag</th><th>Name / Category</th><th>Location</th><th>Purchase & Warranty</th><th>Next Maint.</th><th>Status</th><th className="text-right">Action</th></tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No articles found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ row, index }) => (
                    <tr key={index} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{row.asset_tag || '-'}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{row.item_name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{row.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{row.location}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p><span className="text-slate-400">Pur:</span> {row.purchase_date}</p>
                        <p className="mt-0.5"><span className="text-slate-400">War:</span> {row.warranty_expiry}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{row.next_maintenance_date || '-'}</td>
                      <td className="px-4 py-3">
                        <ArticleStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setPanel({ mode: 'update', index })} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            <Pencil className="h-3.5 w-3.5" /> Update
                          </button>
                          <button type="button" onClick={() => remove(index)} className="inline-flex rounded-lg p-2 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </PageWrapper>
  );
};

const toneMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-50 text-slate-600'
};

const StatCard = ({ title, value, icon: Icon, tone }: { title: string; value: number | string; icon: LucideIcon; tone: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-2xl p-3 ${toneMap[tone] || toneMap.slate}`}><Icon className="h-6 w-6" /></div>
    </div>
  </div>
);

const ArticleStatusBadge = ({ status }: { status: string }) => {
  if (status === 'Functional') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Functional</span>;
  }
  if (status === 'Maintenance Required') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Maintenance Required</span>;
  }
  if (status === 'Out of Order') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700"><AlertTriangle className="h-3.5 w-3.5" />Out of Order</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{status}</span>;
};

const ArticlePanel = ({ title, initialRow, onCancel, onSubmit }: { title: string; initialRow: ArticleRow; onCancel: () => void; onSubmit: (row: ArticleRow) => void }) => {
  const [form, setForm] = useState<ArticleRow>({ ...initialRow });

  const update = (field: keyof ArticleRow, value: string) => setForm((c) => ({ ...c, [field]: value }));

  const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100';

  return (
    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5">
      <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Asset Tag</span>
            <input value={form.asset_tag} onChange={(event) => update('asset_tag', event.target.value)} className={inputClass} placeholder="e.g., OT-ANES-001" />
          </label>
          <label className="xl:col-span-2">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Item Name</span>
            <input value={form.item_name} onChange={(event) => update('item_name', event.target.value)} className={inputClass} placeholder="e.g., Anesthesia Workstation" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Category</span>
            <select value={form.category} onChange={(event) => update('category', event.target.value)} className={inputClass}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Location</span>
            <select value={form.location} onChange={(event) => update('location', event.target.value)} className={inputClass}>
              {locations.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Status</span>
            <select value={form.status} onChange={(event) => update('status', event.target.value)} className={inputClass}>
              <option value="Functional">Functional</option>
              <option value="Maintenance Required">Maintenance Required</option>
              <option value="Out of Order">Out of Order</option>
              <option value="Condemned">Condemned</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Next Maint. Date</span>
            <input type="date" value={form.next_maintenance_date} onChange={(event) => update('next_maintenance_date', event.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Purchase Date</span>
            <input type="date" value={form.purchase_date} onChange={(event) => update('purchase_date', event.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Warranty Expiry</span>
            <input type="date" value={form.warranty_expiry} onChange={(event) => update('warranty_expiry', event.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={() => onSubmit(form)} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700">Apply Changes</button>
        </div>
      </div>
    </div>
  );
};
