const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/screenshot-saas');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String, // Old field
  email: String,
  password: String,
  role: String,
  tokenCreationEnabled: Boolean,
  active: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function deleteAllUsers() {
  try {
    console.log('🗑️  Starting user cleanup...');
    
    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} existing users`);
    
    if (userCount > 0) {
      // Delete all users
      const result = await User.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} users`);
    } else {
      console.log('ℹ️  No users found to delete');
    }
    
    console.log('🎉 User cleanup completed successfully!');
    console.log('💡 You can now create new users with firstName and lastName fields');
    process.exit(0);
  } catch (error) {
    console.error('❌ User cleanup failed:', error);
    process.exit(1);
  }
}

deleteAllUsers();
