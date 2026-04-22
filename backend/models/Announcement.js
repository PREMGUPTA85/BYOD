const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  from: {
    type: String,
    default: 'Teacher'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Announcement', announcementSchema);
