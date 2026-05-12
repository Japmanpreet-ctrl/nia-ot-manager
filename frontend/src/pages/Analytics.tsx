import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { formatDate, formatTime } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useMonthlyAnalytics, useYearlyAnalytics } from '../hooks/useAnalytics';
import { PageWrapper } from '../components/layout/PageWrapper';
import { MonthlyBarChart } from '../components/analytics/MonthlyBarChart';
import { AnesthesiaPieChart } from '../components/analytics/AnesthesiaPieChart';
import { YearlyTrendChart } from '../components/analytics/YearlyTrendChart';

export const Analytics = () => {
  const { can } = useAuth();
  const now = new Date();
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const monthly = useMonthlyAnalytics(year, month);
  const yearly = useYearlyAnalytics(year);

  if (!can('view_analytics')) return <Navigate to="/dashboard" replace />;

  return (
    <PageWrapper title="OT Utilization Analytics" subtitle="Daily occupancy, downtime, case load, and yearly Shalyatantra OT trends">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-1">
          <button type="button" onClick={() => setView('monthly')} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === 'monthly' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>Monthly</button>
          <button type="button" onClick={() => setView('yearly')} className={`rounded-lg px-4 py-2 text-sm font-bold ${view === 'yearly' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>Yearly</button>
        </div>
        <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
        {view === 'monthly' && (
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2025, index, 1).toLocaleString('en-US', { month: 'long' })}</option>)}
          </select>
        )}
      </div>

      {view === 'monthly' ? (
        <>
          <MonthlyBarChart data={monthly.data?.daily || []} />
          <div className="grid gap-5 xl:grid-cols-2">
            <AnesthesiaPieChart data={monthly.data?.anesthesiaBreakdown || []} />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-slate-900">Daily Summary</h3>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2">Date</th><th>Cases</th><th>OT Start</th><th>Final Case</th><th>Occupancy</th><th>Down Time</th></tr></thead>
                  <tbody>
                    {(monthly.data?.daily || []).filter((row) => row.cases > 0).map((row) => (
                      <tr key={row.date} className="border-t border-slate-100"><td className="py-2 font-semibold">{formatDate(row.date)}</td><td>{row.cases}</td><td>{formatTime(row.first_ot_start)}</td><td>{formatTime(row.final_case_time)}</td><td>{row.occupancy_rate}%</td><td>{Math.floor(row.downtime_minutes / 60)}h {row.downtime_minutes % 60}m</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <YearlyTrendChart data={yearly.data?.monthly || []} />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-900">Yearly Summary</h3>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2">Month</th><th>Cases</th><th>Top Consultant</th></tr></thead>
              <tbody>
                {(yearly.data?.monthly || []).map((row) => (
                  <tr key={row.month} className="border-t border-slate-100"><td className="py-2 font-semibold">{row.label}</td><td>{row.cases}</td><td>{row.top_consultant}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageWrapper>
  );
};
