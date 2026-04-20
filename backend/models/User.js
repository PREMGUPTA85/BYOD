// models/User.js
// Mongoose schema for storing user accounts (students and teachers)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  // Role determines what the user can access: student or teacher
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  }
}, { timestamps: true });

// Hash password before saving to database
// NOTE: In Mongoose 6+, async pre-hooks work WITHOUT calling next() manually.
// Returning a promise (via async) signals Mongoose to proceed automatically.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare plain password with stored hash
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
