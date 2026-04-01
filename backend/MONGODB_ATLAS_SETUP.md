# MongoDB Atlas Setup Guide for Reunite

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Start Free" or sign in if you already have an account
3. Create a new account with your email
4. Verify your email address

## Step 2: Create a Cluster

1. After login, click **"Create"** to create a new project (or use default)
2. Click **"Create a Cluster"**
3. Choose **Free Tier** (M0 - Sandbox)
4. Select your region closest to your users
5. Click **"Create Cluster"** (wait 2-3 minutes for deployment)

## Step 3: Create Database User

1. In the left sidebar, go to **"Security"** → **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter Username: `reunite_user` (or your preference)
5. Enter a strong Password (save this securely!)
6. Under **"Built-in roles"**, select **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Whitelist IP Address

1. Go to **"Security"** → **"Network Access"**
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, use your actual server IP
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go to **"Databases"** (in left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"3.12 or later"**
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://reunite_user:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=reunite
   ```

## Step 6: Update Your .env File

Replace `PASSWORD` in the connection string with your actual password, then add to `.env`:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://reunite_user:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/reunite?retryWrites=true&w=majority

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

## Step 7: Test Connection

Run this command to verify the connection:

```bash
npm start
```

You should see in console:
```
Connected to MongoDB
```

## Step 8: Create Indexes in MongoDB Atlas (Optional but Recommended)

For better query performance, create indexes:

1. In MongoDB Atlas, click on **"Collections"** in your cluster
2. Select your **reunite** database
3. For each collection, create indexes:

### For `items` collection:
- Index on `status` (ascending)
- Index on `postedBy` (ascending)
- Index on `isActive` (ascending)  
- Compound index: `status`, `isActive`, `createdAt` (descending)

### For `notifications` collection:
- Index on `userId` (ascending)
- Index on `type` (ascending)
- Index on `createdAt` (descending)

### For `users` collection:
- Index on `email` (unique)
- Index on `role` (ascending)

## Troubleshooting

### "Connect ECONNREFUSED"
- ✅ Check IP whitelist includes your IP
- ✅ Verify MONGODB_URI has PASSWORD (not literal "PASSWORD")
- ✅ Ensure cluster is running (should say "Active")

### "Authentication failed"
- ✅ Wrong username or password - verify in Database Access
- ✅ Special characters in password - wrap in quotes: `password@123`
- ✅ URL-encode special characters using:
  ```javascript
  const encodePassword = (pwd) => encodeURIComponent(pwd);
  // Example: password@123 becomes password%40123
  ```

### "Timeout connecting to database"
- ✅ Wait 2-3 minutes for cluster to fully deploy
- ✅ Check network connection
- ✅ Try editing `/backend/config/db.js` and increase `serverSelectionTimeoutMS`

### "No ${oppositeStatus} items found to match"
- This is normal! It means there are no "Found" items to match against "Lost" items yet
- The Smart Matcher will activate once you have items with opposite statuses

## Production Deployment Tips

1. **Use Environment Variables** - Never hardcode connection strings
2. **IP Whitelisting** - Whitelist only your production server IP
3. **Read-Only Replicas** - Consider setting up read replicas for scaling
4. **Backup** - Enable automated backups (free with M0+)
5. **Monitoring** - Use MongoDB Atlas monitoring for performance insights

## MongoDB Atlas Dashboard Overview

- **Metrics**: View database performance, operations, storage
- **Alerts**: Set up notifications for unusual activity
- **Performance Advisor**: Get recommendations for query optimization
- **Logs**: View connection logs and errors

## Helpful Links

- MongoDB Atlas Docs: https://docs.mongodb.com/manual/
- Connection String Options: https://docs.mongodb.com/manual/reference/connection-string/
- Mongoose Docs: https://mongoosejs.com/

---

**Once connected to MongoDB Atlas, your Smart Matcher Agent will start matching Lost and Found items automatically!**
