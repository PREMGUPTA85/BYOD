// controllers/authController.js
// Handles all authentication logic: signup, login, logout

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Helper: create a signed JWT token for a user
function generateToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' } // Token expires in 8 hours
  );
}

// POST /api/auth/signup
// Creates a new user account
async function signup(req, res, next) {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Create and save new user (password is hashed via pre-save hook in model)
    const user = new User({ name, email, password, role: role || 'student' });
    await user.save();

    // Generate token and set it as a cookie
    const token = generateToken(user);
res.cookie('token', token, {
  httpOnly: true,
  secure: false,
  sameSite: 'none',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',           // ✅ IMPORTANT
});
   res.status(201).json({
  success: true,
  message: 'Account created successfully.',
  token, // ✅ ADD THIS LINE
  user: { id: user._id, name: user.name, role: user.role }
});
  } catch (err) {
    next(err); // Pass to global error handler
  }
}

// POST /api/auth/login
// Verifies credentials and returns a JWT
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate token and send as cookie
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });

    res.json({
  success: true,
  message: 'Login successful.',
  token, // ✅ ADD THIS LINE
  user: { id: user._id, name: user.name, role: user.role }
});
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
// Clears the JWT cookie
function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
}

// GET /api/auth/me
// Returns the currently logged-in user's info (from token)
function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

module.exports = { signup, login, logout, getMe };
