// routes/auth.js
// Defines all authentication-related endpoints
// Uses express-validator to validate request body before processing

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { signup, login, logout, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// Validation rules for signup
const signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Please provide a valid email.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Role must be student or teacher.')
];

// Validation rules for login
const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email.'),
  body('password').notEmpty().withMessage('Password is required.')
];

// POST /api/auth/signup
router.post('/signup', signupRules, signup);

// POST /api/auth/login
router.post('/login', loginRules, login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me (protected route - requires valid JWT)
router.get('/me', authenticateToken, getMe);

module.exports = router;
