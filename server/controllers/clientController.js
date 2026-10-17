const Client = require('../models/Client');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const TimeLog = require('../models/TimeLog');

const FREE_PLAN_CLIENT_LIMIT = 2;

// @desc    Get all clients for user
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res) => {
  try {
    // Free plan limit check
    if (req.user.plan === 'free') {
      const count = await Client.countDocuments({ userId: req.user._id });
      if (count >= FREE_PLAN_CLIENT_LIMIT) {
        return res.status(403).json({
          message: `You have reached the Free plan limit of ${FREE_PLAN_CLIENT_LIMIT} clients. Upgrade to Pro for unlimited clients.`,
          limitReached: true,
        });
      }
    }

    const { name, email, phone, company, address, hourlyRate } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const client = await Client.create({
      userId: req.user._id,
      name,
      email,
      phone,
      company,
      address,
      hourlyRate: hourlyRate || 0,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get related projects
    const projects = await Project.find({ clientId: client._id, userId: req.user._id });

    // Get total time logged for this client
    const projectIds = projects.map(p => p._id);
    const timeLogs = await TimeLog.find({ projectId: { $in: projectIds }, userId: req.user._id });
    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = totalMinutes / 60;

    // Get invoices
    const invoices = await Invoice.find({ clientId: client._id, userId: req.user._id });
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const outstanding = invoices
      .filter(inv => inv.status === 'Outstanding' || inv.status === 'Sent')
      .reduce((sum, inv) => sum + inv.total, 0);

    res.json({
      client,
      projects,
      invoices,
      stats: {
        totalProjects: projects.length,
        totalHours: Math.round(totalHours * 100) / 100,
        totalInvoiced,
        outstanding,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { name, email, phone, company, address, hourlyRate } = req.body;

    client.name = name || client.name;
    client.email = email !== undefined ? email : client.email;
    client.phone = phone !== undefined ? phone : client.phone;
    client.company = company !== undefined ? company : client.company;
    client.address = address !== undefined ? address : client.address;
    client.hourlyRate = hourlyRate !== undefined ? hourlyRate : client.hourlyRate;

    const updated = await client.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Delete related data
    const projects = await Project.find({ clientId: client._id, userId: req.user._id });
    const projectIds = projects.map(p => p._id);

    await TimeLog.deleteMany({ projectId: { $in: projectIds }, userId: req.user._id });
    await Project.deleteMany({ clientId: client._id, userId: req.user._id });
    await Invoice.deleteMany({ clientId: client._id, userId: req.user._id });
    await Client.deleteOne({ _id: client._id });

    res.json({ message: 'Client and all related data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, createClient, getClient, updateClient, deleteClient };
