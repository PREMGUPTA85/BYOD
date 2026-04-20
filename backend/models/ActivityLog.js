// models/ActivityLog.js
// Stores log entries of student actions (task started, URL checked, etc.)

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Reference to the user who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  // Short description of what was done (e.g., "Started Task", "Checked URL")
  action: {
    type: String,
    required: true
  },
  // Extra details about the action
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
