import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle, CheckCircle2, Boxes, RefreshCw,
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react';
import { 
  useLinenItems, 
  useLinenStats, 
  useLinenAuditLogs, 
  useDeleteLinenItem,
  useCreateLinenItem,
  useUpdateLinenItem,
  useCreateLaundryLog
} from '../../hooks/useLinen';
import { getApiErrorMessage } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';
import { LinenItemModal } from './LinenItemModal';
import { SendLaundryModal } from './LaundryModal';

export const OtLinenModule = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [laundryItem, setLaundryItem] = useState<any>(null);

  const showToast = useUiStore((s) => s.showToast);

  const stats = useLinenStats();
  const items = useLinenItems({ 
    page, 
    search: debouncedSearch.trim() || undefined, 
    category: filterCategory || undefined, 
    status: filterStatus || undefined 
  });
  const auditLogs = useLinenAuditLogs({ page: 1 });
  
  const deleteMutation = useDeleteLinenItem();
  const createMutation = useCreateLinenItem();
  const updateMutation = useUpdateLinenItem();
  const createLaundryMutation = useCreateLaundryLog();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this linen item?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('success', 'Item deleted');
    } catch (e) {
      showToast('error', getApiErrorMessage(e));
    }
  };

  const itemsData = items.data;
  const statsData = stats.data;

  const isAnyError = items.isError || stats.isError;
  const errorMessage = getApiErrorMessage(items.error || stats.error);

  return (
    <div className="space-y-6">
      {isAnyError && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Error loading Linen data</p>
            <p className="text-xs opacity-90">{errorMessage}</p>
          </div>
          <button 
            onClick={() => { items.refetch(); stats.refetch(); }}
            className="px-3 py-1 bg-white border border-red-200 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Items" value={statsData?.total_items ?? 0} icon={Boxes} color="blue" />
        <StatCard label="Available" value={statsData?.total_available ?? 0} icon={CheckCircle2} color="emerald" />
        <StatCard label="In Laundry" value={statsData?.total_in_laundry ?? 0} icon={RefreshCw} color="amber" />
        <StatCard label="Critical/Out" value={(statsData?.low_stock_count ?? 0) + (statsData?.out_of_stock_count ?? 0)} icon={AlertTriangle} color="red" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main Inventory List */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search linen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedItem(null); setShowItemModal(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Laundry</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading items...</span>
                      </div>
                    </td></tr>
                  ) : items.isError ? (
                    <tr><td colSpan={5} className="p-8 text-center text-red-500">
                      <p className="text-sm font-semibold">Failed to load items</p>
                      <p className="text-xs opacity-80">{errorMessage}</p>
                    </td></tr>
                  ) : (itemsData?.data || []).length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm italic">
                      No linen items found. Try adjusting filters or adding new items.
                    </td></tr>
                  ) : (itemsData?.data || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{item.item_name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700">{item.quantity_available}</span>
                        <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.in_laundry}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setLaundryItem(item)} title="Send to Laundry" className="p-2 text-amber-500 hover:text-amber-600"><RefreshCw className="h-4 w-4" /></button>
                          <button onClick={() => { setSelectedItem(item); setShowItemModal(true); }} title="Edit" className="p-2 text-slate-400 hover:text-teal-600"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(item.id)} title="Delete" className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {itemsData && itemsData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">Page {page} of {itemsData.totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-30"><ChevronLeft /></button>
                  <button disabled={page >= itemsData.totalPages} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-30"><ChevronRight /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Log Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              Recent Updates
            </h3>
            <div className="space-y-4">
              {auditLogs.isLoading ? (
                <p className="text-xs text-slate-400">Loading logs...</p>
              ) : (auditLogs.data?.data || []).slice(0, 5).map((log) => (
                <div key={log.id} className="border-l-2 border-slate-100 pl-3">
                  <p className="text-xs font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-500">{log.ot_linen_items?.item_name || 'System'}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{log.created_at ? format(new Date(log.created_at), 'dd MMM, HH:mm') : '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showItemModal && (
        <LinenItemModal
          mode={selectedItem ? 'edit' : 'add'}
          initial={selectedItem}
          onCancel={() => { setShowItemModal(false); setSelectedItem(null); }}
          onSubmit={async (payload) => {
            try {
              if (selectedItem) {
                await updateMutation.mutateAsync({ id: selectedItem.id, ...payload });
                showToast('success', 'Item updated');
              } else {
                await createMutation.mutateAsync(payload);
                showToast('success', 'Item created');
              }
              setShowItemModal(false);
              setSelectedItem(null);
            } catch (e) {
              showToast('error', getApiErrorMessage(e));
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {laundryItem && (
        <SendLaundryModal
          item={laundryItem}
          onCancel={() => setLaundryItem(null)}
          onSubmit={async (payload) => {
            try {
              await createLaundryMutation.mutateAsync(payload);
              showToast('success', 'Sent to laundry');
              setLaundryItem(null);
            } catch (e) {
              showToast('error', getApiErrorMessage(e));
            }
          }}
          isLoading={createLaundryMutation.isPending}
        />
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${colors[color]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Available': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Low Stock': 'bg-amber-50 text-amber-700 border-amber-100',
    'In Laundry': 'bg-blue-50 text-blue-700 border-blue-100',
    'Out of Stock': 'bg-red-50 text-red-700 border-red-100',
    'Damaged': 'bg-slate-50 text-slate-700 border-slate-100'
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles['Available']}`}>
      {status}
    </span>
  );
};
