const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');

// @desc    Get time logs
// @route   GET /api/time-logs
// @access  Private
const getTimeLogs = async (req, res) => {
  try {
    const { projectId, billed } = req.query;
    let query = { userId: req.user._id };

    if (projectId) query.projectId = projectId;
    if (billed !== undefined) query.billed = billed === 'true';

    const timeLogs = await TimeLog.find(query)
      .populate({
        path: 'projectId',
        select: 'name clientId',
        populate: { path: 'clientId', select: 'name hourlyRate' },
      })
      .sort({ startTime: -1 });

    res.json(timeLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create time log (manual entry)
// @route   POST /api/time-logs
// @access  Private
const createTimeLog = async (req, res) => {
  try {
    const { projectId, startTime, endTime, duration, description } = req.body;

    if (!projectId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Project, start time and end time are required' });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Calculate duration in minutes if not provided
    const calcDuration = duration || Math.round((end - start) / 60000);

    const timeLog = await TimeLog.create({
      userId: req.user._id,
      projectId,
      startTime: start,
      endTime: end,
      duration: calcDuration,
      description: description || '',
      billed: false,
    });

    const populated = await TimeLog.findById(timeLog._id).populate({
      path: 'projectId',
      select: 'name clientId',
      populate: { path: 'clientId', select: 'name hourlyRate' },
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update time log
// @route   PUT /api/time-logs/:id
// @access  Private
const updateTimeLog = async (req, res) => {
  try {
    const timeLog = await TimeLog.findOne({ _id: req.params.id, userId: req.user._id });

    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    const { description, billed } = req.body;

    if (description !== undefined) timeLog.description = description;
    if (billed !== undefined) timeLog.billed = billed;

    const updated = await timeLog.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete time log
// @route   DELETE /api/time-logs/:id
// @access  Private
const deleteTimeLog = async (req, res) => {
  try {
    const timeLog = await TimeLog.findOne({ _id: req.params.id, userId: req.user._id });

    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    await TimeLog.deleteOne({ _id: timeLog._id });
    res.json({ message: 'Time log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unbilled time logs for a client within date range (for invoice wizard)
// @route   GET /api/time-logs/unbilled
// @access  Private
const getUnbilledLogs = async (req, res) => {
  try {
    const { clientId, startDate, endDate } = req.query;

    if (!clientId || !startDate || !endDate) {
      return res.status(400).json({ message: 'clientId, startDate and endDate are required' });
    }

    // Get all projects for this client belonging to the user
    const projects = await Project.find({ clientId, userId: req.user._id });
    const projectIds = projects.map(p => p._id);

    const timeLogs = await TimeLog.find({
      userId: req.user._id,
      projectId: { $in: projectIds },
      billed: false,
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).populate({
      path: 'projectId',
      select: 'name clientId',
      populate: { path: 'clientId', select: 'name hourlyRate' },
    }).sort({ startTime: 1 });

    res.json(timeLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog, getUnbilledLogs };
