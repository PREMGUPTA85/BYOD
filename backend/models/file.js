const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  title: String,
  fileUrl: String,
  assignedTo: String,
  uploadedBy: String
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);