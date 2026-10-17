import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatHours, getStatusClass } from '../utils/helpers';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then(res => setInvoice(res.data))
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/invoices/${id}/pdf`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/invoices/${id}`, { status });
      setInvoice(res.data);
      toast.success(`Invoice marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!invoice) return <div className="text-center py-16 text-slate-400">Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/invoices" className="text-slate-400 hover:text-white">← Back</Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{invoice.invoiceNumber}</h1>
            <p className="text-slate-400 text-sm">{invoice.clientId?.name}</p>
          </div>
          <span className={getStatusClass(invoice.status)}>{invoice.status}</span>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'Paid' && (
            <button onClick={() => updateStatus('Paid')} disabled={updatingStatus} className="btn-success text-sm">
              ✓ Mark Paid
            </button>
          )}
          {invoice.status === 'Draft' && (
            <button onClick={() => updateStatus('Sent')} disabled={updatingStatus} className="btn-secondary text-sm">
              Send Invoice
            </button>
          )}
          <button onClick={handleDownloadPDF} disabled={downloading} className="btn-primary text-sm">
            {downloading ? '⏳ Generating PDF...' : '⬇ Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="card">
        {/* Invoice Header */}
        <div className="bg-dark-700/60 -mx-6 -mt-6 rounded-t-xl p-6 mb-6 border-b border-dark-600">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
                <span className="font-bold text-white text-lg">FreelanceFlow</span>
              </div>
              <p className="text-slate-400 text-sm">Project Management for Freelancers</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{invoice.invoiceNumber}</p>
              <span className={getStatusClass(invoice.status)}>{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Invoice Date</p>
            <p className="text-white">{formatDate(invoice.date)}</p>
            {invoice.dueDate && (
              <>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-3 mb-1">Due Date</p>
                <p className="text-white">{formatDate(invoice.dueDate)}</p>
              </>
            )}
            {invoice.dateRangeStart && (
              <>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-3 mb-1">Period</p>
                <p className="text-slate-300 text-sm">{formatDate(invoice.dateRangeStart)} – {formatDate(invoice.dateRangeEnd)}</p>
              </>
            )}
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-white font-medium">{invoice.clientId?.company || invoice.clientId?.name}</p>
            <p className="text-slate-400 text-sm">{invoice.clientId?.name}</p>
            {invoice.clientId?.email && <p className="text-slate-400 text-sm">{invoice.clientId?.email}</p>}
            {invoice.clientId?.address && <p className="text-slate-400 text-sm">{invoice.clientId?.address}</p>}
          </div>
        </div>

        {/* Items Table */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="mb-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.date ? formatDate(item.date) : '—'}</td>
                    <td className="font-mono">{item.hours}h</td>
                    <td>{formatCurrency(item.rate)}/hr</td>
                    <td className="text-right font-medium text-emerald-400">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-slate-200">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax ({invoice.taxRate}%)</span>
              <span className="text-slate-200">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="border-t border-dark-600 pt-2 flex justify-between">
              <span className="text-white font-bold">Total Due</span>
              <span className="text-emerald-400 font-bold text-xl">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Notes</p>
            <p className="text-slate-300 text-sm">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
