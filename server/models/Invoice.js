const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  hours: Number,
  rate: Number,
  amount: Number,
  timeLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeLog',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  date: Date,
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  dateRangeStart: {
    type: Date,
  },
  dateRangeEnd: {
    type: Date,
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Outstanding'],
    default: 'Draft',
  },
  notes: {
    type: String,
    trim: true,
  },
  timeLogIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeLog',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ clientId: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
