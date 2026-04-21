// routes/teacher.js
// Defines all teacher/admin routes
// All routes here require valid JWT + teacher role

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/teacherController');

const {
  getStudents, getLogs, downloadLogs, getDbLogs,
  getRestrictions, addRestriction, removeRestriction,
  assignTask, getTasks, deleteTask, clearLogs
} = require('../controllers/teacherController');

// Protect all teacher routes
router.use(authenticateToken);
router.use(requireRole('teacher'));

// --- Students ---
// GET /api/teacher/students
router.get('/students', getStudents);

// --- Logs ---
// GET /api/teacher/logs — read log file as text via stream
router.get('/logs', getLogs);
// GET /api/teacher/logs/download — download gzip-compressed log file
router.get('/logs/download', downloadLogs);
// GET /api/teacher/logs/db — get structured logs from MongoDB
router.get('/logs/db', getDbLogs);
// DELETE /api/teacher/logs — clear all database logs
router.delete('/logs', clearLogs);

// --- Restrictions ---
// GET /api/teacher/restrictions
router.get('/restrictions', getRestrictions);

// POST /api/teacher/restrictions — add a blocked URL
router.post('/restrictions', [
  body('url').notEmpty().withMessage('URL is required.')
], addRestriction);



router.post('/upload', upload.single('file'), uploadFile);


// DELETE /api/teacher/restrictions/:id — remove a blocked URL
router.delete('/restrictions/:id', removeRestriction);

// --- Tasks ---
// GET /api/teacher/tasks
router.get('/tasks', getTasks);

// DELETE /api/teacher/tasks/:id
router.delete('/tasks/:id', deleteTask);

// POST /api/teacher/tasks — assign a task
router.post('/tasks', [
  body('title').trim().notEmpty().withMessage('Task title is required.')
], assignTask);

module.exports = router;
