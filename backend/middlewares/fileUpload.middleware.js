const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter for image types
const fileFilter = (req, file, cb) => {
  console.log('File received in middleware:', file); // Debug log
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    console.log('File type accepted:', file.mimetype);
    return cb(null, true);
  }
  console.log('File type rejected:', file.mimetype);
  cb(new Error('Only images (jpeg, jpg, png) are allowed'));
};

// Multer upload configuration
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// Middleware to handle file upload (optional)
exports.uploadFile = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: 'File upload error: ' + err.message, code: 'MULTER_ERROR' });
    } else if (err) {
      console.error('File type error:', err.message);
      return res.status(400).json({ error: err.message, code: 'INVALID_FILE_TYPE' });
    }
    console.log('File after upload:', req.file); // Debug log
    // File is optional; proceed even if no file is uploaded
    next();
  });
};