const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  billed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

timeLogSchema.index({ userId: 1 });
timeLogSchema.index({ projectId: 1 });
timeLogSchema.index({ billed: 1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
