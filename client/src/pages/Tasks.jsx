import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, getStatusClass } from '../utils/helpers';

const TaskForm = ({ task, projects, onClose, onSaved }) => {
  const [form, setForm] = useState({
    projectId: task?.projectId?._id || task?.projectId || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Pending',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.projectId) return toast.error('Title and project are required');
    setLoading(true);
    try {
      if (task?._id) {
        await api.put(`/tasks/${task._id}`, form);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', form);
        toast.success('Task created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
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
            <label className="label">Project *</label>
            <select className="select" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
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

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      const [taskRes, projRes] = await Promise.all([
        api.get('/tasks', { params: { status: filterStatus || undefined } }),
        api.get('/projects'),
      ]);
      setTasks(taskRes.data);
      setProjects(projRes.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${deleteConfirm._id}`);
      toast.success('Task deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const updateStatus = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const grouped = {
    'Pending': tasks.filter(t => t.status === 'Pending'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    'Completed': tasks.filter(t => t.status === 'Completed'),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowForm(true); }} className="btn-primary">
          + Add Task
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Pending', 'In Progress', 'Completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}
          >
            {s || 'All'} {s ? `(${grouped[s]?.length || 0})` : `(${tasks.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">✓</p>
          <h3 className="text-white font-semibold text-lg mb-2">No tasks yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create tasks to track project progress</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">+ Add Task</button>
        </div>
      ) : filterStatus ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td>
                    <p className="font-medium text-slate-200">{task.title}</p>
                    {task.description && <p className="text-slate-500 text-xs">{task.description}</p>}
                  </td>
                  <td>{task.projectId?.name || '—'}</td>
                  <td><span className={getStatusClass(task.status)}>{task.status}</span></td>
                  <td>{formatDate(task.dueDate)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditTask(task); setShowForm(true); }} className="text-slate-400 hover:text-white text-sm">Edit</button>
                      <button onClick={() => setDeleteConfirm(task)} className="text-red-400 hover:text-red-300 text-sm">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Kanban view
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([status, statusTasks]) => (
            <div key={status} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200">{status}</h3>
                <span className="text-xs text-slate-500 bg-dark-700 px-2 py-0.5 rounded-full">{statusTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {statusTasks.map(task => (
                  <div key={task._id} className="p-3 bg-dark-700/50 rounded-lg border border-dark-600 hover:border-primary-500/30 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{task.projectId?.name}</p>
                        {task.dueDate && <p className="text-xs text-slate-500 mt-0.5">{formatDate(task.dueDate)}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-dark-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {status !== 'Pending' && <button onClick={() => updateStatus(task, status === 'In Progress' ? 'Pending' : 'In Progress')} className="text-xs text-slate-400 hover:text-white">← Back</button>}
                      {status !== 'Completed' && <button onClick={() => updateStatus(task, status === 'Pending' ? 'In Progress' : 'Completed')} className="text-xs text-primary-400 hover:text-primary-300">→ Next</button>}
                      <button onClick={() => { setEditTask(task); setShowForm(true); }} className="text-xs text-slate-400 hover:text-white ml-auto">Edit</button>
                      <button onClick={() => setDeleteConfirm(task)} className="text-xs text-red-400 hover:text-red-300">Del</button>
                    </div>
                  </div>
                ))}
                {statusTasks.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No tasks</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editTask}
          projects={projects}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          onSaved={fetchData}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-2">Delete Task?</h3>
            <p className="text-slate-400 text-sm mb-4">"{deleteConfirm.title}"</p>
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

export default Tasks;
