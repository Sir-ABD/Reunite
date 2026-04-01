const mongoose = require('mongoose');
const User = require('./models/user.model');
require('dotenv').config();

async function seedTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const testUser = {
      name: 'Test Member',
      email: 'member@test.com',
      password: 'password123',
      role: 'user',
      isActive: true
    };

    const adminUser = {
      name: 'System Admin',
      email: 'admin@reunite.com',
      password: 'adminpassword123',
      role: 'admin',
      isActive: true
    };

    // Helper to seed or update
    const seedUser = async (userData) => {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        existing.isActive = true;
        existing.password = userData.password;
        existing.role = userData.role;
        await existing.save();
        console.log(`User ${userData.email} updated and activated.`);
      } else {
        await User.create(userData);
        console.log(`User ${userData.email} created successfully.`);
      }
    };

    await seedUser(testUser);
    await seedUser(adminUser);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding test user:', error);
  }
}

seedTestUser();
