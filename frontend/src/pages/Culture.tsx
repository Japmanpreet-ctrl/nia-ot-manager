import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, FlaskConical, Pencil, Plus, Save, Trash2, X, type LucideIcon, Activity } from 'lucide-react';
import { formatDate, getApiErrorMessage } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useOperationsOverview, useSaveOperationsOverview } from '../hooks/useAnalytics';
import { useUiStore } from '../store/uiStore';
import { PageWrapper } from '../components/layout/PageWrapper';
import type { OperationsOverview } from '../types';

type SectionKey = 'culture';
type Row = Record<string, string | number>;
type OtTab = 'OT-1' | 'OT-2' | 'OT-3' | 'OT-4';

const templates: Record<SectionKey, Row> = {
  culture: { sample: '', site: '', collected_on: format(new Date(), 'yyyy-MM-dd'), result: 'Awaited', status: 'Pending' }
};

const configs = {
  culture: {
    title: 'Culture Record',
    subtitle: 'Environmental culture surveillance',
    columns: ['sample', 'site', 'collected_on', 'result', 'status'],
    labels: ['Sample', 'Site', 'Collected', 'Result', 'Status']
  }
} satisfies Record<SectionKey, { title: string; subtitle: string; columns: string[]; labels: string[] }>;

export const Culture = () => {
  const { can } = useAuth();
  const showToast = useUiStore((state) => state.showToast);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data, isLoading } = useOperationsOverview(date);
  const saveOverview = useSaveOperationsOverview();
  const [draft, setDraft] = useState<OperationsOverview | null>(null);
  const [activeTab, setActiveTab] = useState<OtTab>('OT-1');

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const activeTabRows = useMemo(() => {
    return (draft?.culture || []).filter(row => row.ot_name === activeTab || (!row.ot_name && activeTab === 'OT-1'));
  }, [draft, activeTab]);

  const metrics = useMemo(() => ({
    pendingCultures: activeTabRows.filter((row) => row.status === 'Pending').length || 0
  }), [activeTabRows]);

  if (!can('view_operations')) return <Navigate to="/dashboard" replace />;

  const upsertRow = (_section: SectionKey, row: Row, filteredIndex?: number) => {
    setDraft((current) => {
      if (!current) return current;
      const allRows = [...current.culture] as any[];
      
      const newRow = { ...row, ot_name: activeTab };

      if (typeof filteredIndex === 'number') {
        let count = -1;
        const actualIndex = allRows.findIndex(r => {
          const ot = r.ot_name || 'OT-1';
          if (ot === activeTab) count++;
          return count === filteredIndex;
        });
        if (actualIndex !== -1) {
          allRows[actualIndex] = newRow;
        }
      } else {
        allRows.push(newRow);
      }
      return { ...current, culture: allRows };
    });
  };

  const deleteRow = (_section: SectionKey, filteredIndex: number) => {
    setDraft((current) => {
      if (!current) return current;
      const allRows = [...current.culture] as any[];
      let count = -1;
      const actualIndex = allRows.findIndex(r => {
        const ot = r.ot_name || 'OT-1';
        if (ot === activeTab) count++;
        return count === filteredIndex;
      });
      if (actualIndex !== -1) {
        allRows.splice(actualIndex, 1);
      }
      return { ...current, culture: allRows };
    });
  };

  const save = async () => {
    if (!draft) return;
    try {
      const saved = await saveOverview.mutateAsync({ ...draft, date });
      setDraft(saved);
      showToast('success', 'OT culture record saved');
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    }
  };

  return (
    <PageWrapper title="OT Culture Record" subtitle="Maintain daily culture records for each OT">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Register Date</p>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
          {draft?.updated_by && <p className="mt-2 text-xs text-slate-500">Last saved by {draft.updated_by} on {draft.updated_at ? formatDate(draft.updated_at.slice(0, 10)) : '-'}</p>}
        </div>
        <button type="button" onClick={save} disabled={!draft || saveOverview.isPending} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saveOverview.isPending ? 'Saving...' : 'Save Culture Record'}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit mb-6">
        {(['OT-1', 'OT-2', 'OT-3', 'OT-4'] as OtTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="h-4 w-4" />
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-1">
        <ReadinessCard title={`${activeTab} Culture Watch`} value={metrics.pendingCultures} detail="reports pending" icon={FlaskConical} tone={metrics.pendingCultures ? 'amber' : 'emerald'} />
      </div>

      {isLoading || !draft ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm mt-6">Loading culture records...</div>
      ) : (
        <OperationsSection
          section={'culture'}
          rows={activeTabRows}
          onDelete={deleteRow}
          onSave={upsertRow}
        />
      )}
    </PageWrapper>
  );
};

const toneMap: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600'
};

const ReadinessCard = ({ title, value, detail, icon: Icon, tone }: { title: string; value: number; detail: string; icon: LucideIcon; tone: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
      <div className={`rounded-2xl p-3 ${toneMap[tone] || toneMap.emerald}`}><Icon className="h-6 w-6" /></div>
    </div>
  </div>
);

const OperationsSection = ({ section, rows, onDelete, onSave }: {
  section: SectionKey;
  rows: Row[];
  onDelete: (section: SectionKey, index: number) => void;
  onSave: (section: SectionKey, row: Row, index?: number) => void;
}) => {
  const config = configs[section];
  const [mode, setMode] = useState<{ type: 'add' | 'update'; index?: number } | null>(null);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
        </div>
        <button type="button" onClick={() => setMode({ type: 'add' })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {mode && (
        <OperationEditor
          section={section}
          initialRow={mode.type === 'update' && typeof mode.index === 'number' ? rows[mode.index] : templates[section]}
          title={mode.type === 'add' ? `Add ${config.title}` : `Update ${config.title}`}
          onCancel={() => setMode(null)}
          onSubmit={(row) => {
            onSave(section, row, mode.type === 'update' ? mode.index : undefined);
            setMode(null);
          }}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{config.labels.map((label) => <th key={label} className="px-4 py-3">{label}</th>)}<th className="px-4 py-3 text-right">Action</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={config.labels.length + 1} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  No culture records found for this OT.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-slate-100 align-top">
                  {config.columns.map((column) => (
                    <td key={column} className="px-4 py-3">
                      {column === 'status' || column === 'indicator' ? <StatusBadge status={String(row[column] || '-')} /> : <span className="font-semibold text-slate-700">{String(row[column] || '-')}</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setMode({ type: 'update', index })} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <Pencil className="h-3.5 w-3.5" />
                        Update
                      </button>
                      <button type="button" onClick={() => onDelete(section, index)} className="inline-flex rounded-lg p-2 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const OperationEditor = ({ section, initialRow, title, onCancel, onSubmit }: {
  section: SectionKey;
  initialRow: Row;
  title: string;
  onCancel: () => void;
  onSubmit: (row: Row) => void;
}) => {
  const [form, setForm] = useState<Row>({ ...initialRow });
  const config = configs[section];

  return (
    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5">
      <div className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">Fill the fields and apply. Use Save Culture Record to persist the register.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {config.columns.map((column, index) => (
            <label key={column}>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{config.labels[index]}</span>
              {column === 'status' || column === 'indicator' ? (
                <select value={String(form[column] || '')} onChange={(event) => setForm((current) => ({ ...current, [column]: event.target.value }))} className={inputClass}>
                  {optionsFor(column).map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input
                  type={column.includes('time') || ['started_at', 'completed_at'].includes(column) ? 'time' : column === 'collected_on' ? 'date' : 'text'}
                  value={String(form[column] || '')}
                  onChange={(event) => setForm((current) => ({ ...current, [column]: event.target.value }))}
                  className={inputClass}
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={() => onSubmit(form)} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700">Apply</button>
        </div>
      </div>
    </div>
  );
};

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100';

const optionsFor = (field: string) => {
  return ['Completed', 'Due Today', 'Pending', 'Clear', 'No growth'];
};

const StatusBadge = ({ status }: { status: string }) => {
  const danger = ['Failed'].includes(status);
  const alert = ['Pending', 'Due Today'].includes(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${danger ? 'bg-red-100 text-red-700' : alert ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {danger || alert ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
};
