import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useRecords } from '../hooks/useRecords';
import { useUiStore } from '../store/uiStore';
import { PageWrapper } from '../components/layout/PageWrapper';
import { SearchBar } from '../components/shared/SearchBar';
import { FilterBar } from '../components/shared/FilterBar';
import { RecordGrid } from '../components/records/RecordGrid';
import { RecordDetailModal } from '../components/records/RecordDetailModal';

export const Records = () => {
  const [page, setPage] = useState(1);
  const { filters, setFilter, clearFilters, selectedRecord, setSelectedRecord } = useUiStore();
  const { data, isLoading } = useRecords({ ...filters, page, limit: 12 });
  const { data: allData } = useRecords({ limit: 100 });
  const consultants = useMemo(() => Array.from(new Set((allData?.data || []).map((record) => record.consultant_name))).sort(), [allData]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilter(key, value);
  };

  return (
    <PageWrapper
      title="OT Records"
      subtitle="Search, filter, and review patient operation theatre records"
      actions={<Link to="/add-record" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700"><Plus className="h-4 w-4" />Add Record</Link>}
    >
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-700">{data?.total ?? 0} total</span>
      </div>
      <SearchBar value={filters.search} onChange={(value) => updateFilter('search', value)} />
      <FilterBar
        date={filters.date}
        consultant={filters.consultant}
        anesthesiaType={filters.anesthesia_type}
        consultants={consultants}
        onDateChange={(value) => updateFilter('date', value)}
        onConsultantChange={(value) => updateFilter('consultant', value)}
        onAnesthesiaChange={(value) => updateFilter('anesthesia_type', value)}
        onClear={() => { clearFilters(); setPage(1); }}
      />
      <RecordGrid records={data?.data || []} isLoading={isLoading} onRecordClick={setSelectedRecord} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Previous</button>
        {Array.from({ length: data?.totalPages || 1 }, (_, index) => index + 1).slice(0, 8).map((number) => (
          <button key={number} type="button" onClick={() => setPage(number)} className={`h-10 w-10 rounded-lg text-sm font-bold ${number === page ? 'bg-teal-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{number}</button>
        ))}
        <button type="button" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Next</button>
      </div>
      {selectedRecord && <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </PageWrapper>
  );
};
