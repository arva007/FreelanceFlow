const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');

// @desc    Load sample data for demo
// @route   POST /api/sample-data
// @access  Private
const loadSampleData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if sample data already exists
    const existingClients = await Client.countDocuments({ userId });

    if (existingClients >= 3) {
      return res.status(400).json({
        message: 'Sample data appears to already be loaded. Clear existing data first.',
        alreadyLoaded: true,
      });
    }

    // Check plan limits - sample data needs pro or no clients yet
    if (req.user.plan === 'free' && existingClients >= 2) {
      return res.status(403).json({
        message: 'Upgrade to Pro to load sample data (requires more than 2 clients).',
      });
    }

    // ─── Create Clients ──────────────────────────────────────────────────────
    const clients = await Client.insertMany([
      {
        userId,
        name: 'Acme Corp',
        email: 'contact@acmecorp.com',
        phone: '+91-98765-43210',
        company: 'Acme Corporation',
        address: '123 Business Park, Mumbai, Maharashtra',
        hourlyRate: 1500,
      },
      {
        userId,
        name: 'TechStart Inc',
        email: 'hello@techstart.io',
        phone: '+91-87654-32109',
        company: 'TechStart Inc',
        address: '456 Innovation Hub, Bangalore, Karnataka',
        hourlyRate: 2000,
      },
      {
        userId,
        name: 'Creative Studio',
        email: 'design@creativestudio.in',
        phone: '+91-76543-21098',
        company: 'Creative Studio Pvt Ltd',
        address: '789 Design Lane, Delhi',
        hourlyRate: 1200,
      },
    ]);

    const [acme, techstart, creative] = clients;

    // ─── Create Projects ─────────────────────────────────────────────────────
    const now = new Date();
    const pastMonth = new Date(now); pastMonth.setMonth(now.getMonth() - 1);
    const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);

    const projects = await Project.insertMany([
      {
        userId,
        clientId: acme._id,
        name: 'E-Commerce Website Redesign',
        description: 'Complete overhaul of the Acme Corp e-commerce platform with modern UI/UX',
        status: 'Active',
        budget: 150000,
        startDate: pastMonth,
        endDate: nextMonth,
      },
      {
        userId,
        clientId: acme._id,
        name: 'Mobile App Development',
        description: 'iOS and Android app for Acme Corp customers',
        status: 'Active',
        budget: 200000,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
      },
      {
        userId,
        clientId: techstart._id,
        name: 'SaaS Dashboard MVP',
        description: 'Build the initial MVP dashboard for TechStart\'s analytics product',
        status: 'Active',
        budget: 120000,
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      },
      {
        userId,
        clientId: techstart._id,
        name: 'API Integration Project',
        description: 'Integrate 3rd party APIs into TechStart platform',
        status: 'Completed',
        budget: 80000,
        startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      },
      {
        userId,
        clientId: creative._id,
        name: 'Brand Identity Package',
        description: 'Logo, style guide and brand assets for Creative Studio',
        status: 'Completed',
        budget: 60000,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    ]);

    const [ecom, mobileApp, saas, api, brand] = projects;

    // ─── Create Tasks ────────────────────────────────────────────────────────
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
    const inTwoDays = new Date(now); inTwoDays.setDate(now.getDate() + 2);

    await Task.insertMany([
      { userId, projectId: ecom._id, title: 'Design homepage wireframes', description: 'Create wireframes for new homepage layout', status: 'Completed', dueDate: pastMonth },
      { userId, projectId: ecom._id, title: 'Develop product listing page', description: 'Implement responsive product grid', status: 'In Progress', dueDate: tomorrow },
      { userId, projectId: ecom._id, title: 'Set up payment gateway', description: 'Integrate Razorpay payment gateway', status: 'Pending', dueDate: nextWeek },
      { userId, projectId: ecom._id, title: 'Mobile responsive testing', description: 'Test on all device sizes', status: 'Pending', dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5) },

      { userId, projectId: mobileApp._id, title: 'UI/UX Design for App', description: 'Design all screens in Figma', status: 'Completed' },
      { userId, projectId: mobileApp._id, title: 'User authentication flow', description: 'Implement login/register/OTP', status: 'In Progress', dueDate: inTwoDays },
      { userId, projectId: mobileApp._id, title: 'Push notifications setup', description: 'Configure Firebase push notifications', status: 'Pending', dueDate: nextWeek },

      { userId, projectId: saas._id, title: 'Dashboard layout design', description: 'Design the main dashboard', status: 'Completed' },
      { userId, projectId: saas._id, title: 'Chart components', description: 'Build recharts components for analytics', status: 'In Progress', dueDate: tomorrow },
      { userId, projectId: saas._id, title: 'User management module', description: 'Admin user management', status: 'Pending', dueDate: nextWeek },

      { userId, projectId: api._id, title: 'API documentation review', status: 'Completed' },
      { userId, projectId: api._id, title: 'OAuth integration', status: 'Completed' },

      { userId, projectId: brand._id, title: 'Logo concepts (3 options)', status: 'Completed' },
      { userId, projectId: brand._id, title: 'Brand guidelines document', status: 'Completed' },
    ]);

    // ─── Create Time Logs ────────────────────────────────────────────────────
    const createTimeLog = (projectId, daysAgo, durationMins, desc) => {
      const start = new Date(now);
      start.setDate(now.getDate() - daysAgo);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + durationMins);
      return { userId, projectId, startTime: start, endTime: end, duration: durationMins, description: desc, billed: false };
    };

    const timeLogData = [
      // Ecom project - some recent unbilled
      createTimeLog(ecom._id, 1, 180, 'Working on product listing page components'),
      createTimeLog(ecom._id, 2, 240, 'Implementing cart functionality and checkout flow'),
      createTimeLog(ecom._id, 3, 120, 'Bug fixes and code review'),
      createTimeLog(ecom._id, 5, 300, 'Database schema design and API endpoints'),
      createTimeLog(ecom._id, 7, 150, 'Setting up project infrastructure and CI/CD'),
      createTimeLog(ecom._id, 10, 270, 'Homepage redesign implementation'),

      // Mobile app - mix
      createTimeLog(mobileApp._id, 1, 240, 'Authentication flow development'),
      createTimeLog(mobileApp._id, 4, 360, 'UI component library setup'),
      createTimeLog(mobileApp._id, 8, 180, 'Navigation architecture'),
      createTimeLog(mobileApp._id, 12, 300, 'Database models and API integration'),

      // SaaS
      createTimeLog(saas._id, 2, 210, 'Building recharts dashboard components'),
      createTimeLog(saas._id, 6, 330, 'State management and context setup'),
      createTimeLog(saas._id, 9, 180, 'Authentication and protected routes'),

      // API project - will be billed (older)
      { ...createTimeLog(api._id, 45, 480, 'OAuth2 integration with Google'), billed: true },
      { ...createTimeLog(api._id, 50, 360, 'REST API endpoint implementation'), billed: true },
      { ...createTimeLog(api._id, 55, 240, 'API documentation and testing'), billed: true },

      // Brand project - billed
      { ...createTimeLog(brand._id, 30, 360, 'Logo design - 3 concepts'), billed: true },
      { ...createTimeLog(brand._id, 35, 240, 'Brand guidelines document creation'), billed: true },
      { ...createTimeLog(brand._id, 40, 180, 'Revision rounds and final delivery'), billed: true },
    ];

    const savedTimeLogs = await TimeLog.insertMany(timeLogData);

    // ─── Create Invoices ─────────────────────────────────────────────────────
    // Invoice for API project (TechStart)
    const apiTimeLogs = savedTimeLogs.filter(l => l.projectId.toString() === api._id.toString());
    const apiHours = apiTimeLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
    const apiSubtotal = apiHours * techstart.hourlyRate;
    const apiTax = apiSubtotal * 0.18;

    const inv1 = await Invoice.create({
      userId,
      clientId: techstart._id,
      invoiceNumber: 'INV-0001',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      dateRangeStart: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      dateRangeEnd: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      items: apiTimeLogs.map(log => ({
        description: log.description,
        hours: Math.round(log.duration / 60 * 100) / 100,
        rate: techstart.hourlyRate,
        amount: Math.round((log.duration / 60) * techstart.hourlyRate * 100) / 100,
        timeLogId: log._id,
        projectId: api._id,
        date: log.startTime,
      })),
      subtotal: Math.round(apiSubtotal * 100) / 100,
      taxRate: 18,
      tax: Math.round(apiTax * 100) / 100,
      total: Math.round((apiSubtotal + apiTax) * 100) / 100,
      status: 'Paid',
      timeLogIds: apiTimeLogs.map(l => l._id),
    });

    // Invoice for Brand project (Creative)
    const brandTimeLogs = savedTimeLogs.filter(l => l.projectId.toString() === brand._id.toString());
    const brandHours = brandTimeLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
    const brandSubtotal = brandHours * creative.hourlyRate;
    const brandTax = brandSubtotal * 0.18;

    const inv2 = await Invoice.create({
      userId,
      clientId: creative._id,
      invoiceNumber: 'INV-0002',
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      dateRangeStart: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      dateRangeEnd: new Date(now.getFullYear(), now.getMonth(), 1),
      items: brandTimeLogs.map(log => ({
        description: log.description,
        hours: Math.round(log.duration / 60 * 100) / 100,
        rate: creative.hourlyRate,
        amount: Math.round((log.duration / 60) * creative.hourlyRate * 100) / 100,
        timeLogId: log._id,
        projectId: brand._id,
        date: log.startTime,
      })),
      subtotal: Math.round(brandSubtotal * 100) / 100,
      taxRate: 18,
      tax: Math.round(brandTax * 100) / 100,
      total: Math.round((brandSubtotal + brandTax) * 100) / 100,
      status: 'Outstanding',
      timeLogIds: brandTimeLogs.map(l => l._id),
    });

    // Draft invoice placeholder for Acme
    await Invoice.create({
      userId,
      clientId: acme._id,
      invoiceNumber: 'INV-0003',
      date: new Date(),
      items: [],
      subtotal: 0,
      taxRate: 18,
      tax: 0,
      total: 0,
      status: 'Draft',
      notes: 'Draft invoice for upcoming billing cycle',
    });

    res.json({
      message: 'Sample data loaded successfully!',
      summary: {
        clients: clients.length,
        projects: projects.length,
        timeLogs: timeLogData.length,
        invoices: 3,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all user data
// @route   DELETE /api/sample-data
// @access  Private
const clearSampleData = async (req, res) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      TimeLog.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      Invoice.deleteMany({ userId }),
      Project.deleteMany({ userId }),
      Client.deleteMany({ userId }),
    ]);

    res.json({ message: 'All your data has been cleared.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { loadSampleData, clearSampleData };
