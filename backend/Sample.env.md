# 🌩️ Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# 🔐 JWT Configuration
JWT_SECRET=your_jwt_secret_key          # Use a strong, random secret
JWT_EXPIRES_IN=1d

# 🗄️ Database Configuration
MONGODB_URI=your_mongodb_connection_uri

# 📧 Email Configuration (Gmail SMTP)
EMAIL_USER=your_email@gmail.com         # Use an actual Gmail address
EMAIL_PASSWORD=your_app_password        # Use Gmail App Password (not regular password)

# 🌐 CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://your-production-frontend.com,http://localhost,*

# 🚦 Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000             # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100

# 📁 File Upload Configuration
UPLOADS_FOLDER=./uploads

# 📜 Logging Configuration
LOG_FILE_PATH=./logs/access.log

# ⚙️ Application Settings
PORT=5000
NODE_ENV=development
