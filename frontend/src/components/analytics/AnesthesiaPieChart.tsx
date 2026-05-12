import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const colors = ['#0D9488', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#64748B'];

export const AnesthesiaPieChart = ({ data }: { data: Array<{ name: string; value: number }> }) => (
  <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
    <h3 className="mb-4 text-base font-bold text-slate-900 tracking-tight">Anesthesia Breakdown</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {data.map((entry, index) => (
        <span key={entry.name} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
          {entry.name}: {entry.value}
        </span>
      ))}
    </div>
  </div>
);
