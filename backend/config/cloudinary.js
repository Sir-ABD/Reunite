const cloudinary = require('cloudinary').v2;
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

// Validate required environment variables
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary configuration failed: Missing required environment variables.');
  process.exit(1); // Exit the application if Cloudinary is not configured
}

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully.');
} catch (error) {
  console.error('Cloudinary configuration failed:', error.message);
  process.exit(1); // Exit the application if Cloudinary configuration fails
}

module.exports = cloudinary;