import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatHours, getStatusClass } from '../utils/helpers';

const ClientDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clients/${id}`)
      .then(res => setData(res.data))
      .catch(() => toast.error('Client not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!data) return <div className="text-center py-16 text-slate-400">Client not found</div>;

  const { client, projects, invoices, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/clients" className="text-slate-400 hover:text-white transition-colors">← Back</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
          <p className="text-slate-400">{client.company}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Projects</p>
          <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Hours Logged</p>
          <p className="text-2xl font-bold text-blue-400">{stats.totalHours}h</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Invoiced</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalInvoiced)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.outstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Contact Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Email', value: client.email },
              { label: 'Phone', value: client.phone },
              { label: 'Company', value: client.company },
              { label: 'Address', value: client.address },
              { label: 'Hourly Rate', value: formatCurrency(client.hourlyRate) + '/hr' },
              { label: 'Client Since', value: formatDate(client.createdAt) },
            ].map(f => f.value && (
              <div key={f.label}>
                <p className="text-slate-500 text-xs">{f.label}</p>
                <p className="text-slate-200 text-sm">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Projects</h2>
            <Link to={`/projects?clientId=${client._id}`} className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
          </div>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map(project => (
                <Link key={project._id} to={`/projects/${project._id}`} className="flex items-center justify-between p-3 bg-dark-700/40 rounded-lg hover:bg-dark-700 transition-all group">
                  <div>
                    <p className="text-slate-200 text-sm font-medium group-hover:text-white">{project.name}</p>
                    <p className="text-slate-500 text-xs">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={getStatusClass(project.status)}>{project.status}</span>
                    <p className="text-slate-500 text-xs mt-1">{formatCurrency(project.budget)} budget</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-6">No projects for this client</p>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Invoices</h2>
          <Link to={`/invoices?clientId=${client._id}`} className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
        </div>
        {invoices.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td>
                      <Link to={`/invoices/${inv._id}`} className="text-primary-400 hover:text-primary-300">{inv.invoiceNumber}</Link>
                    </td>
                    <td>{formatDate(inv.date)}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td className="font-medium text-emerald-400">{formatCurrency(inv.total)}</td>
                    <td><span className={getStatusClass(inv.status)}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">No invoices for this client</p>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;
