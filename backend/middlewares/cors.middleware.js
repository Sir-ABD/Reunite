const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:5000', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // Allow requests with no origin (e.g., mobile apps or curl)
      callback(null, true);
      return;
    }
    const normalizedOrigin = origin.replace(/\/$/, ''); // Remove trailing slash
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${normalizedOrigin} not in ${allowedOrigins}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

module.exports = { corsConfig: cors(corsOptions) };