// models/Task.js
// Stores tasks assigned by teachers to students

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // 'all' means assigned to every student, or a specific userId
  assignedTo: {
    type: String,
    default: 'all'
  },
  completedBy: {
    type: [String],
    default: []
  },
  hiddenBy: {
    type: [String],
    default: []
  },
  dueDate: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    default: 'teacher'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
