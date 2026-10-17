import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, getStatusClass } from '../utils/helpers';

const ProjectForm = ({ project, clients, onClose, onSaved }) => {
  const [form, setForm] = useState({
    clientId: project?.clientId?._id || project?.clientId || '',
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'Active',
    budget: project?.budget || '',
    startDate: project?.startDate ? project.startDate.split('T')[0] : '',
    endDate: project?.endDate ? project.endDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.clientId) return toast.error('Name and client are required');
    setLoading(true);
    try {
      if (project?._id) {
        await api.put(`/projects/${project._id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/projects', form);
        toast.success('Project created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-dark-700">
          <h3 className="font-semibold text-white text-lg">{project ? 'Edit Project' : 'New Project'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Client *</label>
            <select className="select" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">Select a client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Project Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Project name" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>Active</option>
                <option>Completed</option>
                <option>On Hold</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Budget (₹)</label>
              <input className="input" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="150000" min="0" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchProjects = async () => {
    try {
      const [projRes, clientRes] = await Promise.all([
        api.get('/projects', { params: { status: filterStatus || undefined } }),
        api.get('/clients'),
      ]);
      setProjects(projRes.data);
      setClients(clientRes.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [filterStatus]);

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${deleteConfirm._id}`);
      toast.success('Project deleted');
      setDeleteConfirm(null);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowForm(true); }} className="btn-primary">
          + New Project
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Active', 'Completed', 'On Hold'].map(s => (
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
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📁</p>
          <h3 className="text-white font-semibold text-lg mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">+ New Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card hover:border-primary-500/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link to={`/projects/${project._id}`} className="font-semibold text-white hover:text-primary-400 transition-colors text-base block truncate">
                    {project.name}
                  </Link>
                  <p className="text-slate-400 text-sm">{project.clientId?.name}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 ${getStatusClass(project.status)}`}>{project.status}</span>
              </div>
              {project.description && (
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Budget</p>
                  <p className="text-emerald-400 font-medium">{formatCurrency(project.budget)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Deadline</p>
                  <p className="text-slate-300">{formatDate(project.endDate)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
                <Link to={`/projects/${project._id}`} className="btn-secondary flex-1 justify-center text-xs py-1.5">View</Link>
                <button onClick={() => { setEditProject(project); setShowForm(true); }} className="btn-secondary flex-1 justify-center text-xs py-1.5">Edit</button>
                <button onClick={() => setDeleteConfirm(project)} className="text-red-400 hover:text-red-300 px-2 text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editProject}
          clients={clients}
          onClose={() => { setShowForm(false); setEditProject(null); }}
          onSaved={fetchProjects}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg mb-2">Delete Project?</h3>
            <p className="text-slate-400 text-sm mb-4">
              This will delete <strong>{deleteConfirm.name}</strong> and all related tasks and time logs.
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

export default Projects;
