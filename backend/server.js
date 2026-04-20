// server.js
// Main entry point for the BYOD Classroom Management System
// Sets up Express, connects to MongoDB, configures Socket.IO, and registers all routes

require('dotenv').config(); // Load .env variables

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Import our custom middleware
const securityHeaders = require('./middleware/securityHeaders');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');

// ─── App Setup ───────────────────────────────────────────────────────────────

const app = express();

// Create HTTP server so Socket.IO can share it with Express
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
// cors: '*' allows any frontend to connect (fine for development)
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors({
  origin: 'https://byod-umber.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options(/(.*)/, cors());
// ─── Connect to MongoDB ──────────────────────────────────────────────────────

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Stop the server if DB fails
  });

// ─── Global Middleware ────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());
// Parse URL-encoded form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse cookies (needed to read the JWT token cookie)
app.use(cookieParser());
// Apply our custom security headers to all responses
app.use(securityHeaders);

// Session middleware (for storing session data server-side)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,   // Set to true in production with HTTPS
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

// CORS middleware (allows frontend on a different port to communicate with this backend)




// ─── API Routes ───────────────────────────────────────────────────────────────

// Authentication: signup, login, logout
app.use('/api/auth', authRoutes);

// Student-only endpoints (protected)
app.use('/api/student', studentRoutes);

// Teacher/admin-only endpoints (protected)
app.use('/api/teacher', teacherRoutes);



app.use('/uploads', express.static('uploads'));
// ─── Root Route ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'BYOD Classroom API is running.' });
});

// ─── Socket.IO — Real-Time Announcements ─────────────────────────────────────

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // When a teacher emits an announcement, broadcast it to ALL connected clients
  // Event: 'announcement' → teachers send, students receive
  socket.on('announcement', (data) => {
    console.log('📢 Announcement:', data.message);
    // Broadcast to everyone (including sender)
    io.emit('announcement', {
      message: data.message,
      from: data.from || 'Teacher',
      time: new Date().toLocaleTimeString()
    });
  });

  // When a teacher emits a 'alert-student', only that student gets notified
  socket.on('alert-student', (data) => {
    io.emit('alert', {
      message: data.message,
      studentName: data.studentName,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ─── Error Handling Middleware ────────────────────────────────────────────────

// This MUST be the last middleware registered
// It catches errors passed via next(err) from any route/controller
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 BYOD Classroom Management System — Ready!`);
});
