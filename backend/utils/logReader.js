// utils/logReader.js
// Reads the activity log file using Node.js Streams
// Also provides a function to compress logs using zlib (Gzip)

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../logs/activity.log');

/**
 * Reads the log file line-by-line using a ReadStream
 * Returns the full content as a string via a Promise
 */
function readLogsAsString() {
  return new Promise((resolve, reject) => {
    // Check if log file exists first
    if (!fs.existsSync(LOG_FILE)) {
      return resolve('No logs found yet.');
    }

    let content = '';
    // Create a readable stream to read the file
    const readStream = fs.createReadStream(LOG_FILE, { encoding: 'utf8' });

    // Collect data chunks
    readStream.on('data', (chunk) => {
      content += chunk;
    });

    readStream.on('end', () => {
      resolve(content);
    });

    readStream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Pipes the log file through zlib.createGzip() and sends it as a compressed response
 * Used for the "Download Compressed Logs" feature
 * @param {object} res - Express response object
 */
function streamCompressedLogs(res) {
  if (!fs.existsSync(LOG_FILE)) {
    return res.status(404).json({ success: false, message: 'No log file found.' });
  }

  // Set headers to tell browser this is a downloadable gzip file
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="activity.log.gz"');

  // Create a read stream for the log file
  const readStream = fs.createReadStream(LOG_FILE);
  // Create a gzip transform stream
  const gzip = zlib.createGzip();

  // Pipe: file → gzip → response
  readStream.pipe(gzip).pipe(res);
}

module.exports = { readLogsAsString, streamCompressedLogs };
