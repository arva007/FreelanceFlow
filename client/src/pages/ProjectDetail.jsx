import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatHours, formatDuration, getStatusClass, getBudgetColor } from '../utils/helpers';

const TaskForm = ({ task, projectId, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Pending',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setLoading(true);
    try {
      if (task?._id) {
        await api.put(`/tasks/${task._id}`, form);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', { ...form, projectId });
        toast.success('Task created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-dark-700">
          <h3 className="font-semibold text-white text-lg">{task ? 'Edit Task' : 'Add Task'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : task ? 'Update' : 'Add Task'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Project not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/${deleteTask._id}`);
      toast.success('Task deleted');
      setDeleteTask(null);
      fetchProject();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const toggleTaskStatus = async (task) => {
    const next = task.status === 'Pending' ? 'In Progress' : task.status === 'In Progress' ? 'Completed' : 'Pending';
    try {
      await api.put(`/tasks/${task._id}`, { status: next });
      fetchProject();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!data) return <div className="text-center py-16 text-slate-400">Project not found</div>;

  const { project, tasks, timeLogs, budgetStats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link to="/projects" className="text-slate-400 hover:text-white">← Back</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className={getStatusClass(project.status)}>{project.status}</span>
          </div>
          <p className="text-slate-400">{project.clientId?.name} • {project.clientId?.company}</p>
        </div>
      </div>

      {/* Budget Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Budget</p>
          <p className="text-xl font-bold text-white">{formatCurrency(budgetStats.budget)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Amount Used</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(budgetStats.amountUsed)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Remaining</p>
          <p className={`text-xl font-bold ${budgetStats.remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(budgetStats.remaining)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">Total Hours</p>
          <p className="text-xl font-bold text-blue-400">{budgetStats.totalHours}h</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-semibold text-white">Budget Usage</h2>
            <p className="text-slate-400 text-sm">{budgetStats.totalHours}h × ₹{budgetStats.hourlyRate}/hr = {formatCurrency(budgetStats.amountUsed)}</p>
          </div>
          <span className={`text-lg font-bold ${budgetStats.budgetPercent >= 100 ? 'text-red-400' : budgetStats.budgetPercent >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {budgetStats.budgetPercent}%
          </span>
        </div>
        <div className="progress-bar h-3">
          <div
            className={`progress-fill ${getBudgetColor(budgetStats.budgetPercent)}`}
            style={{ width: `${Math.min(budgetStats.budgetPercent, 100)}%` }}
          />
        </div>
        {budgetStats.budgetPercent >= 80 && (
          <p className={`text-xs mt-2 ${budgetStats.budgetPercent >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
            {budgetStats.budgetPercent >= 100 ? '⚠ Budget exceeded!' : '⚠ Approaching budget limit'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Tasks ({tasks.length})</h2>
            <button onClick={() => { setEditTask(null); setShowTaskForm(true); }} className="btn-primary text-xs py-1.5">+ Add Task</button>
          </div>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task._id} className="flex items-center gap-3 p-3 bg-dark-700/40 rounded-lg group">
                  <button onClick={() => toggleTaskStatus(task)} className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : task.status === 'In Progress' ? 'border-blue-400' : 'border-dark-500'}`}>
                      {task.status === 'Completed' && <span className="text-white text-xs">✓</span>}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</p>
                    {task.dueDate && <p className="text-slate-500 text-xs">{formatDate(task.dueDate)}</p>}
                  </div>
                  <span className={`text-xs ${getStatusClass(task.status)} flex-shrink-0`}>{task.status}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditTask(task); setShowTaskForm(true); }} className="text-slate-400 hover:text-white text-xs">✎</button>
                    <button onClick={() => setDeleteTask(task)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No tasks yet</p>
            </div>
          )}
        </div>

        {/* Time Logs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Time Logs ({timeLogs.length})</h2>
            <Link to="/time-tracking" className="text-primary-400 text-sm hover:text-primary-300">Log Time →</Link>
          </div>
          {timeLogs.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeLogs.map(log => (
                <div key={log._id} className="flex items-center justify-between p-3 bg-dark-700/40 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm truncate">{log.description || 'Work session'}</p>
                    <p className="text-slate-500 text-xs">{formatDate(log.startTime)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-slate-200 text-sm font-mono">{formatHours(log.duration)}h</p>
                    <span className={`text-xs ${log.billed ? 'badge-paid' : 'badge-pending'}`}>{log.billed ? 'Billed' : 'Unbilled'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No time logged yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Project Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Start Date</p>
            <p className="text-slate-200">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">End Date</p>
            <p className="text-slate-200">{formatDate(project.endDate)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Hourly Rate</p>
            <p className="text-slate-200">{formatCurrency(project.clientId?.hourlyRate)}/hr</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Created</p>
            <p className="text-slate-200">{formatDate(project.createdAt)}</p>
          </div>
        </div>
        {project.description && (
          <div className="mt-4 pt-4 border-t border-dark-700">
            <p className="text-slate-500 text-xs mb-1">Description</p>
            <p className="text-slate-300 text-sm">{project.description}</p>
          </div>
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          task={editTask}
          projectId={id}
          onClose={() => { setShowTaskForm(false); setEditTask(null); }}
          onSaved={fetchProject}
        />
      )}

      {deleteTask && (
        <div className="modal-overlay" onClick={() => setDeleteTask(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-2">Delete Task?</h3>
            <p className="text-slate-400 text-sm mb-4">Delete "{deleteTask.title}"?</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteTask} className="btn-danger flex-1 justify-center">Delete</button>
              <button onClick={() => setDeleteTask(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
