// server.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const securityHeaders = require('./middleware/securityHeaders');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');

const app = express();
const server = http.createServer(app);

// ─── CORS CONFIGURATION ──────────────────────────────────────────────────────
const allowedOrigins = [
  'https://byod-umber.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow if no origin (like Postman or local server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost') || 
                      origin.startsWith('http://127.0.0.1');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS globally - This handles both normal requests and OPTIONS pre-flights
// without needing the crashing app.options() line.
app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions
});

// ─── MongoDB CONNECTION ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── GLOBAL MIDDLEWARE ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(securityHeaders);

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  proxy: true, 
  cookie: {
    // Set secure to false on localhost (HTTP), true on Render (HTTPS)
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000 
  }
}));

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'BYOD Classroom API is running.' });
});


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});


// ─── SOCKET.IO LOGIC ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('announcement', async (data) => {
    try {
      const Announcement = require('./models/Announcement');
      const newAnn = new Announcement({ message: data.message, from: data.from || 'Teacher' });
      await newAnn.save();
      
      io.emit('announcement', {
        message: newAnn.message,
        from: newAnn.from,
        time: newAnn.createdAt.toLocaleTimeString()
      });
    } catch (err) {
      console.error('Error saving announcement:', err);
    }
  });

  socket.on('alert-student', (data) => {
    io.emit('alert', {
      message: data.message,
      studentName: data.studentName,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected');
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});