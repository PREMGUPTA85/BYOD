// routes/student.js
// Defines all student-specific routes
// All routes here are protected: user must be logged in AND have the 'student' role

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { getDashboard, logActivity, checkUrl, getMyLogs, getFiles, markTaskComplete, clearCompletedTasks } = require('../controllers/studentController');
// Apply authentication to all student routes
router.use(authenticateToken);
// Apply role check to all student routes
router.use(requireRole('student'));

// GET /api/student/dashboard — view assigned tasks
router.get('/dashboard', getDashboard);

// PUT /api/student/tasks/:id/complete — mark a task as complete
router.put('/tasks/:id/complete', markTaskComplete);

// PUT /api/student/tasks/clear-completed — hide completed tasks
router.put('/tasks/clear-completed', clearCompletedTasks);


router.get('/files', getFiles);


// POST /api/student/log — submit an activity log
router.post('/log', logActivity);

// GET /api/student/check-url?url=domain.com — check if URL is blocked
router.get('/check-url', checkUrl);

// GET /api/student/my-logs — see own activity history
router.get('/my-logs', getMyLogs);

module.exports = router;
