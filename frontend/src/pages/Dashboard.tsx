import { Activity, Calendar, Clock, Scissors, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalyticsSummary } from '../hooks/useAnalytics';
import { useRecords } from '../hooks/useRecords';
import { useUiStore } from '../store/uiStore';
import { formatTime } from '../lib/utils';
import { PageWrapper } from '../components/layout/PageWrapper';
import { StatCard } from '../components/analytics/StatCard';
import { RecordGrid } from '../components/records/RecordGrid';
import { RecordDetailModal } from '../components/records/RecordDetailModal';

export const Dashboard = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: summary } = useAnalyticsSummary();
  const { data: records, isLoading } = useRecords({ date: today, limit: 6 });
  const { selectedRecord, setSelectedRecord } = useUiStore();

  return (
    <PageWrapper title="Shalyatantra OT Dashboard" subtitle="Daily surgical activity, occupancy, and operational readiness">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Today's Cases" value={summary?.today_count ?? 0} icon={Scissors} color="teal" />
        <StatCard title="This Month" value={summary?.month_count ?? 0} icon={Calendar} color="blue" />
        <StatCard title="This Year" value={summary?.year_count ?? 0} icon={TrendingUp} color="purple" />
        <StatCard title="OT Timing" value={`${formatTime(summary?.earliest_ot_today)} - ${formatTime(summary?.latest_case_today)}`} icon={Clock} color="amber" />
        <StatCard title="Occupancy" value={`${summary?.occupancy_rate_today ?? 0}%`} icon={Activity} color="teal" />
      </div>
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-slate-200/50 to-transparent blur-3xl opacity-50" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily OT Downtime</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">{summary?.downtime_today || '00h 00m'}</p>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
            Calculated from an 8-hour planned OT day, using occupied surgical case time.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Today's OT Records</h2>
          <p className="text-sm text-slate-500">{format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
        <RecordGrid records={records?.data || []} isLoading={isLoading} onRecordClick={setSelectedRecord} emptySubtitle="Add the first OT record for today" />
      </section>
      {selectedRecord && <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </PageWrapper>
  );
};
