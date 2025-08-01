const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/screenshot-saas');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  tokenCreationEnabled: Boolean,
  active: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function migrateUserNames() {
  try {
    console.log('🔄 Starting user name migration...');
    
    // Find users without names
    const usersWithoutNames = await User.find({
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' }
      ]
    });
    
    console.log(`📊 Found ${usersWithoutNames.length} users without names`);
    
    // Update each user with a default name based on email
    for (const user of usersWithoutNames) {
      const defaultName = user.email ? user.email.split('@')[0] : 'User';
      await User.updateOne(
        { _id: user._id },
        { $set: { name: defaultName } }
      );
      console.log(`✅ Updated user ${user.email} with name: ${defaultName}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUserNames();
