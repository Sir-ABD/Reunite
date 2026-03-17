const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Define the log file path
const logFilePath = process.env.LOG_FILE_PATH || '/tmp/access.log';

// Create a write stream for logging
const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Export the middleware
module.exports = morgan('combined', {
  stream: accessLogStream,
});