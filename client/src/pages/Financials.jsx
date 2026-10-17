import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/helpers';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-sm font-bold">
            {p.name}: {prefix === '₹' ? formatCurrency(p.value) : `${p.value}h`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Financials = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/financials')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load financial data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-16 text-slate-400">Failed to load data</div>;

  const { monthlyRevenue, outstandingData, projectBudgetData, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Revenue analytics and financial overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Outstanding</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(summary.totalOutstanding)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Hours</p>
          <p className="text-xl font-bold text-blue-400">{summary.totalHours.toFixed(1)}h</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Invoices</p>
          <p className="text-xl font-bold text-violet-400">{summary.totalInvoices}</p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card">
        <h2 className="font-semibold text-white mb-6">Monthly Revenue (Last 12 Months)</h2>
        {monthlyRevenue.every(m => m.revenue === 0) ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-3xl mb-2">📊</p>
            <p>No paid invoices yet. Mark invoices as paid to see revenue.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={v => v.split(' ')[0]}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding by Client */}
        <div className="card">
          <h2 className="font-semibold text-white mb-6">Outstanding Payments by Client</h2>
          {outstandingData.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">✓</p>
              <p>No outstanding payments!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={outstandingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {outstandingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {outstandingData.length > 0 && (
            <div className="mt-3 space-y-1">
              {outstandingData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-300">{d.name}</span>
                  </div>
                  <span className="text-red-400 font-medium">{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Budget Usage */}
        <div className="card">
          <h2 className="font-semibold text-white mb-6">Project Budget Usage</h2>
          {projectBudgetData.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">📁</p>
              <p>No projects yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={projectBudgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Bar dataKey="used" name="Used" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="remaining" name="Remaining" fill="#1e293b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financials;
