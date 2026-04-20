// models/Restriction.js
// Stores blocked URLs that students are not allowed to access

const mongoose = require('mongoose');

const restrictionSchema = new mongoose.Schema({
  // The URL or domain to block (e.g., "youtube.com", "facebook.com")
  url: {
    type: String,
    required: [true, 'URL is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  // Teacher who added this restriction
  addedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Restriction', restrictionSchema);
