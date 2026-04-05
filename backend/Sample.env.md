# 📁 Environment Variables Configuration (Sample.env)

This file lists all the environment variables used by the Reunite Backend. Copy this to a `.env` file in the root of the `backend/` directory and fill in your actual values.

---

## 🌩️ Cloudinary Configuration
Use Cloudinary for image hosting.
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
- `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
- `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret.

## 🔐 JWT & Authentication
- `JWT_SECRET`: A long, random string used to sign JWT tokens.
- `JWT_EXPIRES_IN`: Expiration time for tokens (e.g., `1d` or `7d`).
- `GOOGLE_CLIENT_ID`: Google OAuth2 Client ID (from Google Console).
- `GOOGLE_CLIENT_SECRET`: Google OAuth2 Client Secret.

## 🗄️ Database
- `MONGODB_URI`: Your MongoDB connection string (e.g., MongoDB Atlas).

## 🤖 AI Features (Gemini)
- `GEMINI_API_KEY`: Google Gemini API key for smart matching/text optimization.

## 📧 Email Configuration (SMTP)
- `EMAIL_USER`: Your email address (e.g., Gmail).
- `EMAIL_PASSWORD`: Your email app password (NOT your login password).

## 🌐 Network & CORS
- `PORT`: (Default: `5000`) The port the server listens on (Render/Railway will set this automatically).
- `NODE_ENV`: Set to `production` for deployment, `development` for local work.
- `FRONTEND_URL`: The URL of your front-end (e.g., `https://your-app.vercel.app`).
- `ALLOWED_ORIGINS`: A comma-separated list of allowed origins for CORS (e.g., `https://your-app.vercel.app,http://localhost:5173`).
- `BACKEND_URL`: The base URL of your backend server (e.g., `https://your-app.onrender.com`).

---

## 🚀 Production Deployment Notes
When deploying to a platform like Render or Railway:
1. Ensure `NODE_ENV` is set to `production`.
2. Ensure `FRONTEND_URL` and `ALLOWED_ORIGINS` are correctly set to your Vercel URL.
3. Ensure the database user has access from your deployment IPs (likely "Allow access from anywhere" in Atlas).
