import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatHours, formatDate, getStatusClass } from '../utils/helpers';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showSampleConfirm, setShowSampleConfirm] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleLoadSample = async () => {
    setLoadingSample(true);
    setShowSampleConfirm(false);
    try {
      const res = await api.post('/sample-data');
      toast.success(`Sample data loaded! ${res.data.summary.clients} clients, ${res.data.summary.projects} projects`);
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sample data');
    } finally {
      setLoadingSample(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { stats, upcomingTasks, recentActivity, projectBudgets } = data || {};

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), icon: '₹', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Outstanding', value: formatCurrency(stats?.outstanding), icon: '!', color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Active Projects', value: stats?.activeProjects, icon: '📁', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Clients', value: stats?.totalClients, icon: '👥', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Total Hours', value: `${stats?.totalHours || 0}h`, icon: '⏱', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Pending Invoices', value: stats?.pendingInvoices, icon: '📄', color: 'text-primary-400', bg: 'bg-primary-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your freelance business</p>
        </div>
        <button
          onClick={() => setShowSampleConfirm(true)}
          disabled={loadingSample}
          className="btn-secondary text-sm"
        >
          {loadingSample ? '⏳ Loading...' : '🎯 Load Sample Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-slate-400 text-xs mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/clients" className="flex flex-col items-center gap-2 p-4 bg-dark-700/50 hover:bg-dark-700 rounded-xl transition-all border border-dark-600 hover:border-primary-500/40 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
            <span className="text-sm text-slate-300 font-medium">Add Client</span>
          </Link>
          <Link to="/projects" className="flex flex-col items-center gap-2 p-4 bg-dark-700/50 hover:bg-dark-700 rounded-xl transition-all border border-dark-600 hover:border-primary-500/40 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
            <span className="text-sm text-slate-300 font-medium">New Project</span>
          </Link>
          <Link to="/time-tracking" className="flex flex-col items-center gap-2 p-4 bg-dark-700/50 hover:bg-dark-700 rounded-xl transition-all border border-dark-600 hover:border-primary-500/40 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">⏱</span>
            <span className="text-sm text-slate-300 font-medium">Start Timer</span>
          </Link>
          <Link to="/invoices/create" className="flex flex-col items-center gap-2 p-4 bg-dark-700/50 hover:bg-dark-700 rounded-xl transition-all border border-dark-600 hover:border-primary-500/40 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
            <span className="text-sm text-slate-300 font-medium">Create Invoice</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Upcoming Deadlines</h2>
            <Link to="/tasks" className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
          </div>
          {upcomingTasks?.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div key={task._id} className="flex items-start gap-3 p-3 bg-dark-700/40 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${task.status === 'In Progress' ? 'bg-blue-400' : 'bg-amber-400'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{task.title}</p>
                    <p className="text-slate-500 text-xs">{task.projectId?.name}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(task.dueDate)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">✓</p>
              <p>No upcoming deadlines</p>
            </div>
          )}
        </div>

        {/* Project Budget Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Project Budgets</h2>
            <Link to="/projects" className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
          </div>
          {projectBudgets?.length > 0 ? (
            <div className="space-y-4">
              {projectBudgets.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 text-sm truncate">{p.name}</span>
                    <span className={`text-xs font-medium ${p.budgetPercent >= 100 ? 'text-red-400' : p.budgetPercent >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.budgetPercent}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${p.budgetPercent >= 100 ? 'bg-red-500' : p.budgetPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(p.budgetPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500 text-xs">{formatCurrency(p.amountUsed)} used</span>
                    <span className="text-slate-500 text-xs">{formatCurrency(p.budget)} budget</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">📊</p>
              <p>No projects yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Recent Activity</h2>
          <Link to="/time-tracking" className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
        </div>
        {recentActivity?.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Description</th>
                  <th>Duration</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(log => (
                  <tr key={log._id}>
                    <td className="font-medium text-slate-200">{log.projectId?.name || '—'}</td>
                    <td className="text-slate-400 max-w-xs truncate">{log.description || '—'}</td>
                    <td>{formatHours(log.duration)}h</td>
                    <td>{formatDate(log.startTime)}</td>
                    <td>
                      <span className={log.billed ? 'badge-completed' : 'badge-pending'}>
                        {log.billed ? 'Billed' : 'Unbilled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p className="text-3xl mb-2">⏱</p>
            <p>No time logs yet. Start the timer!</p>
          </div>
        )}
      </div>

      {/* Sample Data Confirm Modal */}
      {showSampleConfirm && (
        <div className="modal-overlay" onClick={() => setShowSampleConfirm(false)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Load Sample Data?</h3>
            <p className="text-slate-400 text-sm mb-4">
              This will add sample clients, projects, tasks, time logs, and invoices to your account for demonstration purposes.
            </p>
            <div className="flex gap-3">
              <button onClick={handleLoadSample} className="btn-primary flex-1 justify-center">Yes, Load Sample Data</button>
              <button onClick={() => setShowSampleConfirm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
