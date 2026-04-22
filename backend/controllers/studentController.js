// controllers/studentController.js
// Handles student-specific features: view tasks, log activity, check URL

const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Restriction = require('../models/Restriction');
const logger = require('../utils/logger'); // EventEmitter-based logger
const File = require('../models/file');



// GET /api/student/dashboard
// Returns tasks assigned to this student (or to 'all')
async function getDashboard(req, res, next) {
  try {
    // Get tasks assigned to everyone OR specifically to this user
    const tasks = await Task.find({
      $or: [{ assignedTo: 'all' }, { assignedTo: req.user.id }]
    }).sort({ createdAt: -1 });

    // Map tasks to dynamically inject a 'status' for this specific student
    const processedTasks = tasks
      .filter(task => !(task.hiddenBy && task.hiddenBy.includes(req.user.id)))
      .map(task => {
        const taskObj = task.toObject();
        taskObj.status = task.completedBy && task.completedBy.includes(req.user.id) 
          ? 'completed' 
          : 'pending';
        return taskObj;
      });

    res.json({
      success: true,
      user: { name: req.user.name, role: req.user.role },
      tasks: processedTasks
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/student/log
// Student logs an activity (e.g., "Started Task", "Submitted Work")
async function logActivity(req, res, next) {
  try {
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: 'Action is required.' });
    }

    // 1. Use EventEmitter logger to write to activity.log file
    logger.logActivity(req.user.name, action, details || '');

    // 2. Also save to MongoDB for structured queries
    const log = new ActivityLog({
      userId: req.user.id,
      userName: req.user.name,
      action,
      details: details || ''
    });
    await log.save();

    res.json({ success: true, message: 'Activity logged successfully.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/check-url?url=youtube.com
// Checks if the given URL is in the blocked restrictions list
async function checkUrl(req, res, next) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required.' });
    }

    // Normalize the URL (lowercase, remove protocol)
    const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

    // Check against blocked list
    const restriction = await Restriction.findOne({ url: normalizedUrl });

    if (restriction) {
      // Log this attempt
      logger.logActivity(req.user.name, 'Blocked URL Access Attempt', normalizedUrl);
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name,
        action: 'Blocked URL Access Attempt',
        details: normalizedUrl
      });

      return res.json({
        success: true,
        allowed: false,
        message: `🚫 Access Denied! The URL "${normalizedUrl}" is restricted.`
      });
    }

    res.json({
      success: true,
      allowed: true,
      message: `✅ Access Allowed! The URL "${normalizedUrl}" is not restricted.`
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/my-logs
// Get activity logs for the currently logged-in student
async function getMyLogs(req, res, next) {
  try {
    const logs = await ActivityLog.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}


async function getFiles(req, res) {
  try {
    const files = await File.find({
      $or: [
        { assignedTo: 'all' },
        { assignedTo: req.user.id },
        { assignedTo: req.user.name }
      ]
    });

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/student/announcements
// Get latest announcements from teacher
async function getAnnouncements(req, res, next) {
  try {
    const Announcement = require('../models/Announcement');
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, announcements });
  } catch (err) {
    next(err);
  }
}

async function markTaskComplete(req, res, next) {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!task.completedBy) {
      task.completedBy = [];
    }

    if (!task.completedBy.includes(req.user.id)) {
      task.completedBy.push(req.user.id);
      await task.save();
      
      // Log activity
      logger.logActivity(req.user.name, 'Completed Task', task.title);
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name,
        action: 'Completed Task',
        details: task.title
      });
    }

    res.json({ success: true, message: 'Task marked as complete.' });
  } catch (err) {
    next(err);
  }
}

async function clearCompletedTasks(req, res, next) {
  try {
    const tasksToHide = await Task.find({
      completedBy: req.user.id,
      hiddenBy: { $ne: req.user.id }
    });

    for (let task of tasksToHide) {
      if (!task.hiddenBy) task.hiddenBy = [];
      task.hiddenBy.push(req.user.id);
      await task.save();
    }

    res.json({ success: true, message: 'Completed tasks hidden successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, logActivity, checkUrl, getMyLogs, getFiles, getAnnouncements, markTaskComplete, clearCompletedTasks };
