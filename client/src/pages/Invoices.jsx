import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, getStatusClass } from '../utils/helpers';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices', { params: { status: filterStatus || undefined } });
      setInvoices(res.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [filterStatus]);

  const handleDelete = async () => {
    try {
      await api.delete(`/invoices/${deleteConfirm._id}`);
      toast.success('Invoice deleted and time logs unmarked');
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleStatusUpdate = async (invoice, status) => {
    try {
      await api.put(`/invoices/${invoice._id}`, { status });
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to update invoice');
    }
  };

  const handleDownloadPDF = (invoiceId) => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL}/invoices/${invoiceId}/pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    // Fetch with auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `invoice-${invoiceId}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Failed to download PDF'));
  };

  const totals = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0),
    outstanding: invoices.filter(i => i.status === 'Outstanding' || i.status === 'Sent').reduce((s, i) => s + i.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 text-sm mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/invoices/create" className="btn-primary">
          + Create Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Invoiced</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totals.total)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Paid</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Outstanding</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totals.outstanding)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Draft', 'Sent', 'Paid', 'Outstanding'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📄</p>
          <h3 className="text-white font-semibold text-lg mb-2">No invoices yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create your first invoice from unbilled time logs</p>
          <Link to="/invoices/create" className="btn-primary mx-auto">+ Create Invoice</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td>
                    <Link to={`/invoices/${inv._id}`} className="text-primary-400 hover:text-primary-300 font-medium">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td>
                    <p className="text-slate-200">{inv.clientId?.name}</p>
                    <p className="text-slate-500 text-xs">{inv.clientId?.company}</p>
                  </td>
                  <td>{formatDate(inv.date)}</td>
                  <td>{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                  <td className="font-medium text-emerald-400">{formatCurrency(inv.total)}</td>
                  <td>
                    <span className={getStatusClass(inv.status)}>{inv.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleDownloadPDF(inv._id)} className="text-xs text-blue-400 hover:text-blue-300">PDF</button>
                      {inv.status !== 'Paid' && (
                        <button onClick={() => handleStatusUpdate(inv, 'Paid')} className="text-xs text-emerald-400 hover:text-emerald-300">Mark Paid</button>
                      )}
                      {inv.status === 'Draft' && (
                        <button onClick={() => handleStatusUpdate(inv, 'Sent')} className="text-xs text-primary-400 hover:text-primary-300">Send</button>
                      )}
                      <button onClick={() => setDeleteConfirm(inv)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg mb-2">Delete Invoice?</h3>
            <p className="text-slate-400 text-sm mb-2">
              This will delete invoice <strong>{deleteConfirm.invoiceNumber}</strong>.
            </p>
            <p className="text-amber-300/80 text-xs mb-4">
              ⚠ The associated time logs will be marked as unbilled again, allowing them to be invoiced in the future.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
