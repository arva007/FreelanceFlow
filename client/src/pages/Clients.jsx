import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, getStatusClass } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const ClientForm = ({ client, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    company: client?.company || '',
    address: client?.address || '',
    hourlyRate: client?.hourlyRate || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Client name is required');
    setLoading(true);
    try {
      if (client?._id) {
        await api.put(`/clients/${client._id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client added');
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save client';
      toast.error(msg);
      if (err.response?.data?.limitReached) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-dark-700">
          <h3 className="font-semibold text-white text-lg">{client ? 'Edit Client' : 'Add New Client'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Client name" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
            </div>
            <div>
              <label className="label">Hourly Rate (₹)</label>
              <input className="input" type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="1500" min="0" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { user } = useAuth();

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients', { params: { search } });
      setClients(res.data);
    } catch (err) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [search]);

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${deleteConfirm._id}`);
      toast.success('Client deleted');
      setDeleteConfirm(null);
      fetchClients();
    } catch (err) {
      toast.error('Failed to delete client');
    }
  };

  const limitReached = user?.plan === 'free' && clients.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditClient(null); setShowForm(true); }}
          className="btn-primary"
          id="add-client-btn"
        >
          + Add Client
        </button>
      </div>

      {/* Free plan warning */}
      {limitReached && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-amber-300 font-medium text-sm">⚠ Free Plan Limit Reached</p>
          <p className="text-amber-200/70 text-xs mt-1">
            You have reached the Free plan limit of 2 clients. Upgrade to Pro for unlimited clients.
          </p>
          <Link to="/settings" className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300 font-medium">
            Upgrade to Pro →
          </Link>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">👥</p>
          <h3 className="text-white font-semibold text-lg mb-2">No clients yet</h3>
          <p className="text-slate-400 text-sm mb-6">Add your first client to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">+ Add Client</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Hourly Rate</th>
                <th>Since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client._id}>
                  <td>
                    <Link to={`/clients/${client._id}`} className="text-primary-400 hover:text-primary-300 font-medium">
                      {client.name}
                    </Link>
                  </td>
                  <td>{client.company || '—'}</td>
                  <td>{client.email || '—'}</td>
                  <td>{client.phone || '—'}</td>
                  <td className="font-medium text-emerald-400">{formatCurrency(client.hourlyRate)}/hr</td>
                  <td>{formatDate(client.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditClient(client); setShowForm(true); }}
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(client)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ClientForm
          client={editClient}
          onClose={() => { setShowForm(false); setEditClient(null); }}
          onSaved={fetchClients}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg mb-2">Delete Client?</h3>
            <p className="text-slate-400 text-sm mb-4">
              This will delete <strong>{deleteConfirm.name}</strong> and all related projects, tasks, time logs, and invoices. This cannot be undone.
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

export default Clients;
