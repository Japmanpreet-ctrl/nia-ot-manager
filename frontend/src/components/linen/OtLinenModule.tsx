import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle, CheckCircle2, Boxes, WashingMachine, Scissors,
  Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react';
import { getApiErrorMessage } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';
import {
  useLinenStats, useLinenItems, useCreateLinenItem, useUpdateLinenItem,
  useDeleteLinenItem, useLaundryLogs, useCreateLaundryLog, useUpdateLaundryLog,
  useLinenAuditLogs
} from '../../hooks/useLinen';
import { LinenItemModal } from './LinenItemModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { SendLaundryModal, ReturnLaundryModal, LaundryLogsPanel } from './LaundryModal';
import type { OtLinenItem, OtLinenItemInput, OtLinenLaundryLog } from '../../types';

const CATEGORIES = ['Drapes & Covers', 'Gowns & Wear', 'Towels & Wraps', 'Sheets & Linen', 'Packs & Sets', 'Other'];
const STATUSES = ['Available', 'In Laundry', 'Damaged', 'Out of Stock', 'Low Stock'];

const statusColors: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700',
  'Low Stock': 'bg-amber-100 text-amber-700',
  'In Laundry': 'bg-blue-100 text-blue-700',
  Damaged: 'bg-orange-100 text-orange-700',
  'Out of Stock': 'bg-red-100 text-red-700',
};

const actionColors: Record<string, string> = {
  created: 'bg-emerald-100 text-emerald-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  laundry_sent: 'bg-amber-100 text-amber-700',
  laundry_returned: 'bg-teal-100 text-teal-700',
};

type ActivePanel = null | { type: 'laundry'; itemId: string } | { type: 'audit' };

export const OtLinenModule = () => {
  const showToast = useUiStore((s) => s.showToast);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OtLinenItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OtLinenItem | null>(null);
  const [sendLaundryTarget, setSendLaundryTarget] = useState<OtLinenItem | null>(null);
  const [returnLaundryTarget, setReturnLaundryTarget] = useState<OtLinenLaundryLog | null>(null);

  // Queries
  const stats = useLinenStats();
  const items = useLinenItems({ page, search: search || undefined, category: filterCategory || undefined, status: filterStatus || undefined });
  const laundryLogs = useLaundryLogs(activePanel?.type === 'laundry' ? { item_id: activePanel.itemId } : undefined);
  const auditLogs = useLinenAuditLogs({ page: 1 });

  // Mutations
  const createItem = useCreateLinenItem();
  const updateItem = useUpdateLinenItem();
  const deleteItem = useDeleteLinenItem();
  const createLaundry = useCreateLaundryLog();
  const updateLaundry = useUpdateLaundryLog();

  const statData = stats.data;
  const itemsData = items.data;

  // Handlers
  const handleCreate = async (payload: OtLinenItemInput) => {
    try {
      await createItem.mutateAsync(payload);
      setAddOpen(false);
      showToast('success', 'Linen item added successfully.');
    } catch (e) { showToast('error', getApiErrorMessage(e)); }
  };

  const handleUpdate = async (payload: OtLinenItemInput) => {
    if (!editTarget) return;
    try {
      await updateItem.mutateAsync({ id: editTarget.id, ...payload });
      setEditTarget(null);
      showToast('success', 'Linen item updated.');
    } catch (e) { showToast('error', getApiErrorMessage(e)); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      showToast('success', `"${deleteTarget.item_name}" deleted.`);
    } catch (e) { showToast('error', getApiErrorMessage(e)); }
  };

  const handleSendLaundry = async (payload: Parameters<typeof createLaundry.mutateAsync>[0]) => {
    try {
      await createLaundry.mutateAsync(payload);
      setSendLaundryTarget(null);
      showToast('success', 'Items sent to laundry. Stock updated.');
    } catch (e) { showToast('error', getApiErrorMessage(e)); }
  };

  const handleReturnLaundry = async (payload: Parameters<typeof updateLaundry.mutateAsync>[0]) => {
    try {
      await updateLaundry.mutateAsync(payload);
      setReturnLaundryTarget(null);
      showToast('success', 'Laundry return updated. Stock restored.');
    } catch (e) { showToast('error', getApiErrorMessage(e)); }
  };

  const resetFilters = () => { setSearch(''); setFilterCategory(''); setFilterStatus(''); setPage(1); };
  const hasFilters = search || filterCategory || filterStatus;

  const totalPages = itemsData?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* ── Stats Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Items" value={statData?.total_items ?? '—'} icon={Boxes} color="teal" />
        <StatCard label="Available" value={statData?.total_available ?? '—'} icon={CheckCircle2} color="emerald" />
        <StatCard label="In Laundry" value={statData?.total_in_laundry ?? '—'} icon={WashingMachine} color="blue" />
        <StatCard label="Damaged" value={statData?.total_damaged ?? '—'} icon={Scissors} color="orange" />
        <StatCard label="Low Stock" value={statData?.low_stock_count ?? '—'} icon={AlertTriangle} color="amber" />
        <StatCard label="Out of Stock" value={statData?.out_of_stock_count ?? '—'} icon={AlertTriangle} color="red" />
      </div>

      {/* ── Main Section ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">OT Linen Inventory</h2>
            <p className="mt-0.5 text-sm text-slate-500">Track availability, laundry cycles, and stock levels.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivePanel(activePanel?.type === 'audit' ? null : { type: 'audit' })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ClipboardList className="h-4 w-4" />
              Audit Log
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Add Linen
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 lg:grid-cols-[1fr_160px_160px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by item name…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button type="button" onClick={resetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <X className="h-4 w-4" />Reset
            </button>
          )}
        </div>

        {/* Audit Log Panel */}
        {activePanel?.type === 'audit' && (
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Audit Log — Recent Activity</h4>
              <button type="button" onClick={() => setActivePanel(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {auditLogs.isLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (auditLogs.data?.data || []).length === 0 ? (
              <p className="text-sm text-slate-500">No audit logs yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Qty Change</th>
                      <th className="px-3 py-2">Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(auditLogs.data?.data || []).map((log) => (
                      <tr key={log.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-500">{format(new Date(log.created_at), 'dd MMM yy HH:mm')}</td>
                        <td className="px-3 py-2 font-semibold">{log.ot_linen_items?.item_name ?? '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${actionColors[log.action] || 'bg-slate-100 text-slate-700'}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {log.quantity_change != null ? (
                            <span className={`font-bold ${log.quantity_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{log.performed_by_name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {items.isLoading ? (
          <div className="p-8 text-sm font-semibold text-slate-500">Loading linen inventory…</div>
        ) : items.isError ? (
          <div className="p-8 text-sm font-semibold text-red-600">{getApiErrorMessage(items.error)}</div>
        ) : (itemsData?.data || []).length === 0 ? (
          <div className="p-8 text-center">
            <Boxes className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No linen items found.</p>
            <button type="button" onClick={() => setAddOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-700">
              <Plus className="h-4 w-4" />Add First Item
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">In Laundry</th>
                    <th className="px-4 py-3 text-right">Damaged</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated By</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(itemsData?.data || []).map((item) => (
                    <>
                      <tr key={item.id} className="border-t border-slate-100 align-middle hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{item.item_name}</p>
                          <p className="text-xs text-slate-400">{item.unit}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{item.category}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{item.quantity_available}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">{item.in_laundry}</td>
                        <td className="px-4 py-3 text-right font-semibold text-orange-600">{item.damaged}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{item.minimum_threshold}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                            {['Out of Stock', 'Low Stock', 'Damaged'].includes(item.status)
                              ? <AlertTriangle className="h-3 w-3" />
                              : <CheckCircle2 className="h-3 w-3" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {item.updated_by_name || item.created_by_name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" title="Send to Laundry"
                              onClick={() => setSendLaundryTarget(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50">
                              <WashingMachine className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Laundry Logs"
                              onClick={() => setActivePanel(activePanel?.type === 'laundry' && activePanel.itemId === item.id ? null : { type: 'laundry', itemId: item.id })}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">
                              <ClipboardList className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Edit"
                              onClick={() => setEditTarget(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Delete"
                              onClick={() => setDeleteTarget(item)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline laundry logs panel */}
                      {activePanel?.type === 'laundry' && activePanel.itemId === item.id && (
                        <tr key={`laundry-${item.id}`}>
                          <td colSpan={9} className="p-0">
                            <LaundryLogsPanel
                              itemId={item.id}
                              logs={laundryLogs.data || []}
                              onReturn={setReturnLaundryTarget}
                              onClose={() => setActivePanel(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {itemsData?.total ?? 0} items total
                </p>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Modals ── */}
      {addOpen && (
        <LinenItemModal mode="add" onCancel={() => setAddOpen(false)} onSubmit={handleCreate} isLoading={createItem.isPending} />
      )}
      {editTarget && (
        <LinenItemModal mode="edit" initial={editTarget} onCancel={() => setEditTarget(null)} onSubmit={handleUpdate} isLoading={updateItem.isPending} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal itemName={deleteTarget.item_name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isLoading={deleteItem.isPending} />
      )}
      {sendLaundryTarget && (
        <SendLaundryModal item={sendLaundryTarget} onCancel={() => setSendLaundryTarget(null)} onSubmit={handleSendLaundry} isLoading={createLaundry.isPending} />
      )}
      {returnLaundryTarget && (
        <ReturnLaundryModal log={returnLaundryTarget} onCancel={() => setReturnLaundryTarget(null)} onSubmit={handleReturnLaundry} isLoading={updateLaundry.isPending} />
      )}
    </div>
  );
};

/* ── Stat Card ── */
const colorMap: Record<string, string> = {
  teal: 'bg-teal-50 text-teal-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Boxes; color: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-xl p-2.5 ${colorMap[color] || colorMap.teal}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);
