const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const TimeLog = require('../models/TimeLog');
const PDFDocument = require('pdfkit');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    let query = { userId: req.user._id };

    if (status) query.status = status;
    if (clientId) query.clientId = clientId;

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email company')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const { clientId, timeLogIds, taxRate, dueDate, notes, dateRangeStart, dateRangeEnd } = req.body;

    if (!clientId || !timeLogIds || timeLogIds.length === 0) {
      return res.status(400).json({ message: 'Client and time logs are required' });
    }

    // Verify client belongs to user
    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Fetch time logs - verify they belong to user and are unbilled
    const timeLogs = await TimeLog.find({
      _id: { $in: timeLogIds },
      userId: req.user._id,
      billed: false,
    }).populate('projectId', 'name');

    if (timeLogs.length === 0) {
      return res.status(400).json({ message: 'No valid unbilled time logs found' });
    }

    // Check for already billed logs
    const requestedCount = timeLogIds.length;
    if (timeLogs.length !== requestedCount) {
      return res.status(400).json({ message: 'Some time logs are already billed or not found' });
    }

    // Build invoice items
    const hourlyRate = client.hourlyRate || 0;
    const items = timeLogs.map(log => {
      const hours = log.duration / 60;
      const amount = hours * hourlyRate;
      return {
        description: log.description || `Work on ${log.projectId ? log.projectId.name : 'Project'}`,
        hours: Math.round(hours * 100) / 100,
        rate: hourlyRate,
        amount: Math.round(amount * 100) / 100,
        timeLogId: log._id,
        projectId: log.projectId ? log.projectId._id : null,
        date: log.startTime,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRateVal = taxRate || 0;
    const tax = Math.round((subtotal * taxRateVal / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments({ userId: req.user._id });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      userId: req.user._id,
      clientId,
      invoiceNumber,
      date: new Date(),
      dueDate: dueDate || null,
      dateRangeStart: dateRangeStart || null,
      dateRangeEnd: dateRangeEnd || null,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate: taxRateVal,
      tax,
      total,
      status: 'Draft',
      notes: notes || '',
      timeLogIds: timeLogs.map(log => log._id),
    });

    // Mark time logs as billed
    await TimeLog.updateMany(
      { _id: { $in: timeLogs.map(l => l._id) } },
      { billed: true }
    );

    const populated = await Invoice.findById(invoice._id).populate('clientId', 'name email company address');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('clientId', 'name email company address phone');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { status, notes, dueDate } = req.body;

    if (status) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate !== undefined) invoice.dueDate = dueDate;

    const updated = await invoice.save();
    const populated = await Invoice.findById(updated._id).populate('clientId', 'name email company address');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete invoice (and unmark time logs)
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Unmark time logs as billed
    if (invoice.timeLogIds && invoice.timeLogIds.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: invoice.timeLogIds }, userId: req.user._id },
        { billed: false }
      );
    }

    await Invoice.deleteOne({ _id: invoice._id });
    res.json({ message: 'Invoice deleted and time logs unmarked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('clientId', 'name email company address phone')
      .populate('userId', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);

    // ─── Header ───────────────────────────────────────────────────────────────
    // Background header bar
    doc.rect(0, 0, doc.page.width, 120).fill('#1e293b');

    // Logo / Brand name
    doc.fill('#ffffff').fontSize(28).font('Helvetica-Bold')
      .text('FreelanceFlow', 50, 35);
    doc.fill('#94a3b8').fontSize(11).font('Helvetica')
      .text('Project Management for Freelancers', 50, 68);

    // Invoice label on right
    doc.fill('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text('INVOICE', 400, 35, { align: 'right', width: 160 });
    doc.fill('#94a3b8').fontSize(11).font('Helvetica')
      .text(invoice.invoiceNumber, 400, 65, { align: 'right', width: 160 });

    doc.moveDown(2);

    // ─── From / To Info ───────────────────────────────────────────────────────
    const infoY = 145;
    doc.fill('#1e293b').fontSize(10).font('Helvetica-Bold').text('FROM', 50, infoY);
    doc.fill('#374151').fontSize(11).font('Helvetica-Bold')
      .text(invoice.userId.name || 'Freelancer', 50, infoY + 18);
    doc.fill('#6b7280').fontSize(10).font('Helvetica')
      .text(invoice.userId.email || '', 50, infoY + 34);

    doc.fill('#1e293b').fontSize(10).font('Helvetica-Bold').text('BILL TO', 310, infoY);
    doc.fill('#374151').fontSize(11).font('Helvetica-Bold')
      .text(invoice.clientId.company || invoice.clientId.name, 310, infoY + 18);
    doc.fill('#6b7280').fontSize(10).font('Helvetica')
      .text(invoice.clientId.name, 310, infoY + 34);
    if (invoice.clientId.email) {
      doc.text(invoice.clientId.email, 310, infoY + 50);
    }
    if (invoice.clientId.address) {
      doc.text(invoice.clientId.address, 310, infoY + 66);
    }

    // ─── Invoice Details Box ──────────────────────────────────────────────────
    const detailY = 265;
    doc.rect(50, detailY, doc.page.width - 100, 70).fill('#f8fafc');
    doc.rect(50, detailY, doc.page.width - 100, 70).stroke('#e2e8f0');

    const colW = (doc.page.width - 100) / 4;
    const details = [
      { label: 'Invoice Date', value: new Date(invoice.date).toLocaleDateString('en-IN') },
      { label: 'Due Date', value: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'On Receipt' },
      { label: 'Status', value: invoice.status },
      { label: 'Amount Due', value: `₹${invoice.total.toFixed(2)}` },
    ];

    details.forEach((d, i) => {
      const x = 50 + i * colW + 15;
      doc.fill('#64748b').fontSize(9).font('Helvetica-Bold').text(d.label, x, detailY + 12);
      doc.fill('#1e293b').fontSize(11).font('Helvetica-Bold').text(d.value, x, detailY + 30);
    });

    // ─── Items Table ──────────────────────────────────────────────────────────
    const tableY = detailY + 90;
    const tableHeaders = ['Description', 'Date', 'Hours', 'Rate', 'Amount'];
    const colWidths = [200, 80, 60, 80, 80];
    const colXs = [50, 250, 330, 390, 470];

    // Table header
    doc.rect(50, tableY, doc.page.width - 100, 28).fill('#1e293b');
    tableHeaders.forEach((h, i) => {
      doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text(h, colXs[i], tableY + 9, { width: colWidths[i] - 10 });
    });

    // Table rows
    let rowY = tableY + 28;
    invoice.items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(50, rowY, doc.page.width - 100, 26).fill(bg);
      doc.rect(50, rowY, doc.page.width - 100, 26).stroke('#e2e8f0');

      doc.fill('#374151').fontSize(9).font('Helvetica')
        .text(item.description || '', colXs[0], rowY + 8, { width: colWidths[0] - 10 });
      doc.text(item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-', colXs[1], rowY + 8, { width: colWidths[1] - 10 });
      doc.text(item.hours.toFixed(2), colXs[2], rowY + 8, { width: colWidths[2] - 10 });
      doc.text(`₹${item.rate.toFixed(2)}`, colXs[3], rowY + 8, { width: colWidths[3] - 10 });
      doc.fill('#1e293b').font('Helvetica-Bold')
        .text(`₹${item.amount.toFixed(2)}`, colXs[4], rowY + 8, { width: colWidths[4] - 10 });

      rowY += 26;
    });

    // ─── Totals ───────────────────────────────────────────────────────────────
    rowY += 15;
    const totalsX = 380;

    const addTotalRow = (label, value, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(totalsX - 10, rowY - 5, 185, 28).fill('#1e293b');
        doc.fill('#ffffff');
      } else {
        doc.fill('#374151');
      }
      doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(label, totalsX, rowY, { width: 100 });
      doc.text(value, totalsX + 100, rowY, { width: 75, align: 'right' });
      rowY += (highlight ? 28 : 20);
    };

    addTotalRow('Subtotal', `₹${invoice.subtotal.toFixed(2)}`);
    addTotalRow(`Tax (${invoice.taxRate}%)`, `₹${invoice.tax.toFixed(2)}`);
    addTotalRow('TOTAL DUE', `₹${invoice.total.toFixed(2)}`, true, true);

    // ─── Notes ────────────────────────────────────────────────────────────────
    if (invoice.notes) {
      rowY += 20;
      doc.fill('#64748b').fontSize(9).font('Helvetica-Bold').text('NOTES', 50, rowY);
      rowY += 15;
      doc.fill('#374151').fontSize(9).font('Helvetica').text(invoice.notes, 50, rowY, { width: 400 });
    }

    // ─── Footer ───────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill('#1e293b');
    doc.fill('#94a3b8').fontSize(9).font('Helvetica')
      .text('Generated by FreelanceFlow • Project Management for Freelancers', 50, doc.page.height - 30, {
        align: 'center', width: doc.page.width - 100,
      });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInvoices, createInvoice, getInvoice, updateInvoice, deleteInvoice, downloadInvoicePDF };
