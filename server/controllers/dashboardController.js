const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [clients, projects, tasks, timeLogs, invoices] = await Promise.all([
      Client.countDocuments({ userId }),
      Project.find({ userId }).populate('clientId', 'hourlyRate'),
      Task.find({ userId, status: { $ne: 'Completed' }, dueDate: { $gte: new Date() } })
        .populate('projectId', 'name')
        .sort({ dueDate: 1 })
        .limit(5),
      TimeLog.find({ userId }),
      Invoice.find({ userId }).populate('clientId', 'name'),
    ]);

    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const totalHours = timeLogs.reduce((sum, log) => sum + log.duration, 0) / 60;

    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const outstandingInvoices = invoices.filter(inv =>
      inv.status === 'Outstanding' || inv.status === 'Sent'
    );
    const outstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const pendingInvoices = invoices.filter(inv => inv.status === 'Draft' || inv.status === 'Sent').length;

    // Recent activity: last 5 time logs
    const recentTimeLogs = await TimeLog.find({ userId })
      .populate({ path: 'projectId', select: 'name', populate: { path: 'clientId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Project budget overview
    const projectBudgets = await Promise.all(
      projects.slice(0, 5).map(async (p) => {
        const pLogs = timeLogs.filter(l => l.projectId.toString() === p._id.toString());
        const pHours = pLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
        const hourlyRate = p.clientId ? p.clientId.hourlyRate : 0;
        const amountUsed = pHours * hourlyRate;
        return {
          name: p.name,
          budget: p.budget,
          amountUsed: Math.round(amountUsed * 100) / 100,
          budgetPercent: p.budget > 0 ? Math.round((amountUsed / p.budget) * 100) : 0,
        };
      })
    );

    res.json({
      stats: {
        totalClients: clients,
        activeProjects,
        totalHours: Math.round(totalHours * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        pendingInvoices,
      },
      upcomingTasks: tasks,
      recentActivity: recentTimeLogs,
      projectBudgets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get financial data for charts
// @route   GET /api/financials
// @access  Private
const getFinancials = async (req, res) => {
  try {
    const userId = req.user._id;

    const invoices = await Invoice.find({ userId }).populate('clientId', 'name');
    const timeLogs = await TimeLog.find({ userId });
    const projects = await Project.find({ userId }).populate('clientId', 'hourlyRate name');

    // Monthly revenue (last 12 months)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleString('default', { month: 'short' });

      const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getFullYear() === year && d.getMonth() === month && inv.status === 'Paid';
      });

      monthlyRevenue.push({
        month: `${monthName} ${year}`,
        revenue: Math.round(monthInvoices.reduce((sum, inv) => sum + inv.total, 0) * 100) / 100,
      });
    }

    // Outstanding payments by client
    const outstandingByClient = {};
    invoices
      .filter(inv => inv.status === 'Outstanding' || inv.status === 'Sent')
      .forEach(inv => {
        const clientName = inv.clientId ? inv.clientId.name : 'Unknown';
        outstandingByClient[clientName] = (outstandingByClient[clientName] || 0) + inv.total;
      });

    const outstandingData = Object.entries(outstandingByClient).map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
    }));

    // Project budget usage
    const projectBudgetData = await Promise.all(
      projects.map(async (p) => {
        const pLogs = timeLogs.filter(l => l.projectId.toString() === p._id.toString());
        const pHours = pLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
        const hourlyRate = p.clientId ? p.clientId.hourlyRate : 0;
        const amountUsed = pHours * hourlyRate;
        return {
          name: p.name,
          budget: p.budget,
          used: Math.round(amountUsed * 100) / 100,
          remaining: Math.max(0, Math.round((p.budget - amountUsed) * 100) / 100),
        };
      })
    );

    // Summary stats
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
    const totalOutstanding = invoices
      .filter(i => i.status === 'Outstanding' || i.status === 'Sent')
      .reduce((sum, i) => sum + i.total, 0);
    const totalHours = timeLogs.reduce((sum, l) => sum + l.duration, 0) / 60;

    res.json({
      monthlyRevenue,
      outstandingData,
      projectBudgetData,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        totalInvoices: invoices.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getFinancials };
