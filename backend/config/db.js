const mongoose = require('mongoose');

// Configure mongoose options
mongoose.set('strictQuery', true); // Enforce strict query mode for better error handling

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if unable to connect
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 10000, // Timeout after 10 seconds if no connection
      });
      console.log('Connected to MongoDB');
      return; // Exit the loop on successful connection
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error.message);

      if (retries === maxRetries) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

module.exports = connectDB;