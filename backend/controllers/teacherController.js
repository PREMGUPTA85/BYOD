// controllers/teacherController.js
// Handles all teacher/admin features: view students, view logs, manage restrictions, assign tasks

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog.js');
const Restriction = require('../models/Restriction.js');
const Task = require('../models/Task');
const { readLogsAsString, streamCompressedLogs } = require('../utils/logReader.js');
const { validationResult } = require('express-validator');
const File = require('../models/file');
// GET /api/teacher/students
// Returns list of all student accounts
async function getStudents(req, res, next) {
  try {
    // Only fetch students, exclude passwords from the response
    const students = await User.find({ role: 'student' }, '-password').sort({ name: 1 });
    res.json({ success: true, students });
  } catch (err) {
    next(err);
  }
}

// GET /api/teacher/logs
// Reads activity log file using fs ReadStream and returns as text
async function getLogs(req, res, next) {
  try {
    const content = await readLogsAsString();
    res.json({ success: true, logs: content });
  } catch (err) {
    next(err);
  }
}

// GET /api/teacher/logs/download
// Streams a gzip-compressed version of the log file for download
function downloadLogs(req, res, next) {
  try {
    streamCompressedLogs(res);
  } catch (err) {
    next(err);
  }
}

// GET /api/teacher/logs/db
// Fetch structured logs from MongoDB (supports filtering by student name)
async function getDbLogs(req, res, next) {
  try {
    const { student } = req.query;
    const filter = student ? { userName: { $regex: student, $options: 'i' } } : {};
    const logs = await ActivityLog.find(filter).sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

// GET /api/teacher/restrictions
// Returns all blocked URLs
async function getRestrictions(req, res, next) {
  try {
    const restrictions = await Restriction.find().sort({ createdAt: -1 });
    res.json({ success: true, restrictions });
  } catch (err) {
    next(err);
  }
}

// POST /api/teacher/restrictions
// Adds a new URL to the blocked list
async function addRestriction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { url } = req.body;
    // Normalize: remove protocol and path, keep only domain
    const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

    // Check if already blocked
    const existing = await Restriction.findOne({ url: normalizedUrl });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This URL is already restricted.' });
    }

    const restriction = new Restriction({ url: normalizedUrl, addedBy: req.user.name });
    await restriction.save();

    res.status(201).json({ success: true, message: 'URL blocked successfully.', restriction });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/teacher/restrictions/:id
// Removes a URL from the blocked list
async function removeRestriction(req, res, next) {
  try {
    const restriction = await Restriction.findByIdAndDelete(req.params.id);
    if (!restriction) {
      return res.status(404).json({ success: false, message: 'Restriction not found.' });
    }
    res.json({ success: true, message: 'URL unblocked successfully.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/teacher/tasks
// Assigns a task to one or all students
async function assignTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, assignedTo, dueDate } = req.body;
    const task = new Task({
      title,
      description: description || '',
      assignedTo: assignedTo || 'all',
      dueDate: dueDate || '',
      createdBy: req.user.name
    });
    await task.save();

    res.status(201).json({ success: true, message: 'Task assigned successfully.', task });
  } catch (err) {
    next(err);
  }
}

// GET /api/teacher/tasks
// Returns all tasks (for teacher to review)
async function getTasks(req, res, next) {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

const uploadFile = async (req, res) => {
  try {
    console.log("📥 BODY:", req.body);
    console.log("📂 FILE:", req.file);

    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, assignedTo } = req.body;

    const newFile = new File({
      title,
      fileUrl: "/uploads/" + req.file.filename,
      assignedTo: assignedTo || "all"
    });

    await newFile.save();

    console.log("✅ SAVED TO DB");

    res.json({ success: true, message: "File uploaded successfully" });

  } catch (err) {
    console.error("🔥 ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStudents,
  getLogs,
  downloadLogs,
  getDbLogs,
  getRestrictions,
  addRestriction,
  removeRestriction,
  assignTask,
  getTasks,
  uploadFile   
};