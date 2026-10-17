import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatHours, formatDuration } from '../utils/helpers';

const STEPS = ['Select Client', 'Date Range', 'Review Logs', 'Generate Invoice'];

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [unbilledLogs, setUnbilledLogs] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data));
  }, []);

  const fetchUnbilledLogs = async () => {
    if (!selectedClient) return;
    setLoadingLogs(true);
    try {
      const res = await api.get('/time-logs/unbilled', {
        params: { clientId: selectedClient._id, startDate: dateRange.start, endDate: dateRange.end },
      });
      setUnbilledLogs(res.data);
      setSelectedLogs(res.data.map(l => l._id));
    } catch (err) {
      toast.error('Failed to fetch time logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const toggleLog = (logId) => {
    setSelectedLogs(prev =>
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  const selected = unbilledLogs.filter(l => selectedLogs.includes(l._id));
  const subtotal = selected.reduce((sum, log) => {
    const hours = log.duration / 60;
    return sum + hours * (selectedClient?.hourlyRate || 0);
  }, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleNext = async () => {
    if (step === 0 && !selectedClient) return toast.error('Please select a client');
    if (step === 1) {
      await fetchUnbilledLogs();
    }
    if (step === 2 && selectedLogs.length === 0) return toast.error('Select at least one time log');
    setStep(s => s + 1);
  };

  const handleCreate = async () => {
    if (selectedLogs.length === 0) return toast.error('No time logs selected');
    setCreating(true);
    try {
      const res = await api.post('/invoices', {
        clientId: selectedClient._id,
        timeLogIds: selectedLogs,
        taxRate,
        dueDate: dueDate || undefined,
        notes,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
      });
      toast.success('Invoice created successfully!');
      navigate(`/invoices/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Invoice</h1>
        <p className="text-slate-400 text-sm mt-1">Generate an invoice from unbilled time logs</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-500 text-white ring-4 ring-primary-500/30' : 'bg-dark-700 text-slate-500'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-slate-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary-600' : 'bg-dark-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Client */}
      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white text-lg">Select Client</h2>
          {clients.length === 0 ? (
            <p className="text-slate-400">No clients found. Add a client first.</p>
          ) : (
            <div className="space-y-2">
              {clients.map(client => (
                <button
                  key={client._id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedClient?._id === client._id ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 hover:border-dark-500 bg-dark-700/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{client.name}</p>
                      <p className="text-slate-400 text-sm">{client.company} • {client.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-medium">{formatCurrency(client.hourlyRate)}/hr</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date Range */}
      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white text-lg">Select Date Range</h2>
          <p className="text-slate-400 text-sm">Fetch all unbilled time logs for <strong className="text-white">{selectedClient?.name}</strong> in this period.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input" type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Due Date (Optional)</label>
            <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Tax Rate (%)</label>
            <input className="input" type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, bank details, etc." />
          </div>
        </div>
      )}

      {/* Step 3: Review Logs */}
      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white text-lg">Review Unbilled Time Logs</h2>
          {loadingLogs ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : unbilledLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">✓</p>
              <p className="text-slate-300 font-medium">No unbilled time logs found</p>
              <p className="text-slate-500 text-sm mt-1">
                There are no unbilled time logs for {selectedClient?.name} in the selected date range.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">{unbilledLogs.length} time logs found • {selectedLogs.length} selected</p>
                <button
                  onClick={() => setSelectedLogs(selectedLogs.length === unbilledLogs.length ? [] : unbilledLogs.map(l => l._id))}
                  className="text-primary-400 text-sm hover:text-primary-300"
                >
                  {selectedLogs.length === unbilledLogs.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {unbilledLogs.map(log => {
                  const hours = log.duration / 60;
                  const amount = hours * (selectedClient?.hourlyRate || 0);
                  return (
                    <label key={log._id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedLogs.includes(log._id) ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-700/40 border border-transparent hover:border-dark-600'}`}>
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log._id)}
                        onChange={() => toggleLog(log._id)}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{log.description || 'Work session'}</p>
                        <p className="text-xs text-slate-500">{log.projectId?.name} • {formatDate(log.startTime)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono text-slate-300">{formatHours(log.duration)}h</p>
                        <p className="text-xs text-emerald-400">{formatCurrency(amount)}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Generate */}
      {step === 3 && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-white text-lg">Invoice Summary</h2>
          <div className="grid grid-cols-2 gap-4 p-4 bg-dark-700/50 rounded-xl">
            <div>
              <p className="text-slate-400 text-xs">Client</p>
              <p className="text-white font-medium">{selectedClient?.name}</p>
              <p className="text-slate-400 text-sm">{selectedClient?.company}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Date Range</p>
              <p className="text-white text-sm">{formatDate(dateRange.start)} – {formatDate(dateRange.end)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Time Logs ({selectedLogs.length})</span>
              <span className="text-slate-300">{selected.reduce((s, l) => s + l.duration, 0) / 60 | 0}h {selected.reduce((s, l) => s + l.duration, 0) % 60}m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Rate</span>
              <span className="text-slate-300">{formatCurrency(selectedClient?.hourlyRate)}/hr</span>
            </div>
            <div className="border-t border-dark-600 pt-2 flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax ({taxRate}%)</span>
              <span className="text-slate-300">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t border-dark-600 pt-2 flex justify-between">
              <span className="text-white font-semibold">Total Due</span>
              <span className="text-emerald-400 font-bold text-xl">{formatCurrency(total)}</span>
            </div>
          </div>
          {notes && (
            <div className="p-3 bg-dark-700/40 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">Notes</p>
              <p className="text-slate-300 text-sm">{notes}</p>
            </div>
          )}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-300 text-xs">
              ✓ After generating, the {selectedLogs.length} selected time log{selectedLogs.length !== 1 ? 's' : ''} will be marked as <strong>billed</strong> and cannot be invoiced again.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary">← Back</button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={loadingLogs}
            className="btn-primary"
          >
            {loadingLogs ? 'Loading...' : step === 2 && unbilledLogs.length === 0 ? 'No Logs Available' : 'Next →'}
          </button>
        ) : (
          <button onClick={handleCreate} disabled={creating || selectedLogs.length === 0} className="btn-primary">
            {creating ? '⏳ Generating...' : '📄 Generate Invoice'}
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceCreate;
