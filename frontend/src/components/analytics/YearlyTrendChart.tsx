import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const YearlyTrendChart = ({ data }: { data: Array<{ label: string; cases: number; cumulative: number }> }) => (
  <div className="grid gap-5 xl:grid-cols-2">
    <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
      <h3 className="mb-4 text-base font-bold text-slate-900 tracking-tight">Cases per Month</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="cases" fill="#0D9488" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
      <h3 className="mb-4 text-base font-bold text-slate-900 tracking-tight">Cumulative Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="cumulative" stroke="#0D9488" fill="#99F6E4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
