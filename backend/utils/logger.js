// utils/logger.js
// EventEmitter-based activity logger
// When an event is emitted, it writes to a log file using the fs module

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Create our custom logger by extending EventEmitter
class ActivityLogger extends EventEmitter {
  constructor() {
    super();
    this.logFile = path.join(__dirname, '../logs/activity.log');

    // Listen for 'log' events and write them to the file
    this.on('log', (entry) => {
      // Format: [timestamp] [user] action - details
      const line = `[${new Date().toISOString()}] [${entry.userName}] ${entry.action} - ${entry.details}\n`;
      
      // Append the log line to the file (creates the file if it doesn't exist)
      fs.appendFileSync(this.logFile, line, 'utf8');
    });
  }

  // Convenience method to log an activity
  logActivity(userName, action, details = '') {
    this.emit('log', { userName, action, details });
  }
}

// Export a single shared instance (singleton pattern)
module.exports = new ActivityLogger();
