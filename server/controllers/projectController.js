const Project = require('../models/Project');
const Client = require('../models/Client');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { clientId, status } = req.query;
    let query = { userId: req.user._id };

    if (clientId) query.clientId = clientId;
    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('clientId', 'name email hourlyRate')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { clientId, name, description, status, budget, startDate, endDate } = req.body;

    if (!name || !clientId) {
      return res.status(400).json({ message: 'Name and client are required' });
    }

    // Verify client belongs to user
    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const project = await Project.create({
      userId: req.user._id,
      clientId,
      name,
      description,
      status: status || 'Active',
      budget: budget || 0,
      startDate,
      endDate,
    });

    const populated = await Project.findById(project._id).populate('clientId', 'name email hourlyRate');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project with stats
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('clientId', 'name email hourlyRate company');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get tasks
    const tasks = await Task.find({ projectId: project._id, userId: req.user._id }).sort({ createdAt: -1 });

    // Get time logs
    const timeLogs = await TimeLog.find({ projectId: project._id, userId: req.user._id }).sort({ createdAt: -1 });

    // Calculate budget stats
    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = totalMinutes / 60;
    const hourlyRate = project.clientId ? project.clientId.hourlyRate : 0;
    const amountUsed = totalHours * hourlyRate;
    const remaining = project.budget - amountUsed;
    const budgetPercent = project.budget > 0 ? Math.round((amountUsed / project.budget) * 100) : 0;

    res.json({
      project,
      tasks,
      timeLogs,
      budgetStats: {
        totalHours: Math.round(totalHours * 100) / 100,
        hourlyRate,
        amountUsed: Math.round(amountUsed * 100) / 100,
        budget: project.budget,
        remaining: Math.round(remaining * 100) / 100,
        budgetPercent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { clientId, name, description, status, budget, startDate, endDate } = req.body;

    if (clientId) {
      const client = await Client.findOne({ _id: clientId, userId: req.user._id });
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      project.clientId = clientId;
    }

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.status = status || project.status;
    project.budget = budget !== undefined ? budget : project.budget;
    project.startDate = startDate !== undefined ? startDate : project.startDate;
    project.endDate = endDate !== undefined ? endDate : project.endDate;

    const updated = await project.save();
    const populated = await Project.findById(updated._id).populate('clientId', 'name email hourlyRate');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Task.deleteMany({ projectId: project._id, userId: req.user._id });
    await TimeLog.deleteMany({ projectId: project._id, userId: req.user._id });
    await Project.deleteOne({ _id: project._id });

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };
