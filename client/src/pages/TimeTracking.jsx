import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTimer } from '../context/TimerContext';
import { formatDate, formatHours, formatDuration } from '../utils/helpers';

const ManualTimeForm = ({ projects, onClose, onSaved }) => {
  const [form, setForm] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startHour: '09',
    startMin: '00',
    hours: '',
    minutes: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId || (!form.hours && !form.minutes)) {
      return toast.error('Project and duration are required');
    }

    const totalMins = (parseInt(form.hours || 0) * 60) + parseInt(form.minutes || 0);
    if (totalMins <= 0) return toast.error('Duration must be greater than 0');

    const startTime = new Date(`${form.date}T${form.startHour}:${form.startMin}:00`);
    const endTime = new Date(startTime.getTime() + totalMins * 60000);

    setLoading(true);
    try {
      await api.post('/time-logs', {
        projectId: form.projectId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: totalMins,
        description: form.description,
      });
      toast.success('Time logged successfully');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-dark-700">
          <h3 className="font-semibold text-white text-lg">Manual Time Entry</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Project *</label>
            <select className="select" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.clientId?.name})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Start Time</label>
              <div className="flex gap-1">
                <input className="input" type="number" min="0" max="23" value={form.startHour} onChange={e => setForm({ ...form, startHour: e.target.value.padStart(2, '0') })} placeholder="HH" />
                <input className="input" type="number" min="0" max="59" value={form.startMin} onChange={e => setForm({ ...form, startMin: e.target.value.padStart(2, '0') })} placeholder="MM" />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Duration *</label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <input className="input" type="number" min="0" max="24" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="Hours" />
              </div>
              <span className="text-slate-400">:</span>
              <div className="flex-1">
                <input className="input" type="number" min="0" max="59" value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} placeholder="Minutes" />
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-1">Enter hours and minutes worked</p>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What did you work on?" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Logging...' : 'Log Time'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TimeTracking = () => {
  const [timeLogs, setTimeLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterBilled, setFilterBilled] = useState('');

  const {
    isRunning, elapsed, projectId: timerProject, description: timerDesc,
    startTimer, stopTimer, cancelTimer, formatTime, setProjectId, setDescription,
  } = useTimer();

  const fetchData = async () => {
    try {
      const [logsRes, projRes] = await Promise.all([
        api.get('/time-logs', { params: { billed: filterBilled !== '' ? filterBilled : undefined } }),
        api.get('/projects'),
      ]);
      setTimeLogs(logsRes.data);
      setProjects(projRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterBilled]);

  const handleStop = async () => {
    const log = await stopTimer();
    if (log) fetchData();
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/time-logs/${deleteConfirm._id}`);
      toast.success('Time log deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete time log');
    }
  };

  const totalHours = timeLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
  const billedHours = timeLogs.filter(l => l.billed).reduce((sum, l) => sum + l.duration, 0) / 60;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">{totalHours.toFixed(1)}h total tracked</p>
        </div>
        <button onClick={() => setShowManual(true)} className="btn-secondary">
          + Manual Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Billed Hours</p>
          <p className="text-2xl font-bold text-emerald-400">{billedHours.toFixed(1)}h</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Unbilled Hours</p>
          <p className="text-2xl font-bold text-amber-400">{(totalHours - billedHours).toFixed(1)}h</p>
        </div>
      </div>

      {/* Timer */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Live Timer</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="label">Project</label>
            <select
              className="select"
              value={timerProject}
              onChange={e => setProjectId(e.target.value)}
              disabled={isRunning}
            >
              <option value="">Select project...</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.clientId?.name})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="label">Description</label>
            <input
              className="input"
              value={timerDesc}
              onChange={e => setDescription(e.target.value)}
              placeholder="What are you working on?"
              disabled={isRunning}
            />
          </div>
          <div className="flex items-end gap-3">
            {/* Timer display */}
            <div className={`text-3xl font-mono font-bold min-w-[120px] text-center py-2 px-4 rounded-xl ${isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-dark-700 text-slate-400'}`}>
              {formatTime(elapsed)}
            </div>
            {!isRunning ? (
              <button
                onClick={() => startTimer(timerProject, timerDesc)}
                disabled={!timerProject}
                className="btn-success disabled:opacity-40 disabled:cursor-not-allowed"
                id="start-timer-btn"
              >
                ▶ Start
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleStop} className="btn-danger" id="stop-timer-btn">
                  ■ Stop & Save
                </button>
                <button onClick={cancelTimer} className="btn-secondary">
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        {isRunning && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Timer running — navigating away won't reset it</span>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'All'], ['false', 'Unbilled'], ['true', 'Billed']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterBilled(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterBilled === val ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Time Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : timeLogs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">⏱</p>
          <h3 className="text-white font-semibold mb-2">No time logs yet</h3>
          <p className="text-slate-400 text-sm">Start the timer or add a manual entry</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeLogs.map(log => (
                <tr key={log._id}>
                  <td className="text-slate-400">{formatDate(log.startTime)}</td>
                  <td>
                    <p className="font-medium text-slate-200">{log.projectId?.name || '—'}</p>
                    <p className="text-slate-500 text-xs">{log.projectId?.clientId?.name}</p>
                  </td>
                  <td className="max-w-xs">
                    <p className="truncate text-slate-300">{log.description || '—'}</p>
                  </td>
                  <td>
                    <span className="font-mono text-slate-200">{formatHours(log.duration)}h</span>
                    <span className="text-slate-500 text-xs ml-1">({formatDuration(log.duration)})</span>
                  </td>
                  <td>
                    <span className={log.billed ? 'badge-paid' : 'badge-pending'}>
                      {log.billed ? '✓ Billed' : 'Unbilled'}
                    </span>
                  </td>
                  <td>
                    {!log.billed && (
                      <button onClick={() => setDeleteConfirm(log)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showManual && (
        <ManualTimeForm
          projects={projects}
          onClose={() => setShowManual(false)}
          onSaved={fetchData}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-2">Delete Time Log?</h3>
            <p className="text-slate-400 text-sm mb-4">This will delete the time log: {formatDuration(deleteConfirm.duration)}</p>
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

export default TimeTracking;
