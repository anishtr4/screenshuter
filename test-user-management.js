// Simple test script to verify user management API endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// Test credentials (you'll need to update these)
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function getUsers() {
  try {
    const response = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get users successful');
    console.log('Users:', response.data.users.map(u => ({ 
      id: u._id, 
      email: u.email, 
      active: u.active 
    })));
    return response.data.users;
  } catch (error) {
    console.error('❌ Get users failed:', error.response?.data || error.message);
    return [];
  }
}

async function createTestUser() {
  try {
    const response = await axios.post(`${API_BASE}/users`, {
      email: `test-${Date.now()}@example.com`,
      password: 'test123',
      role: 'user'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Create user successful');
    console.log('New user ID:', response.data.user._id);
    return response.data.user;
  } catch (error) {
    console.error('❌ Create user failed:', error.response?.data || error.message);
    return null;
  }
}

async function updateUser(userId) {
  try {
    const response = await axios.patch(`${API_BASE}/users/${userId}`, {
      active: false
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Update user successful');
    return true;
  } catch (error) {
    console.error('❌ Update user failed:', error.response?.data || error.message);
    return false;
  }
}

async function deleteUser(userId) {
  try {
    const response = await axios.delete(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Delete user successful');
    return true;
  } catch (error) {
    console.error('❌ Delete user failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting User Management API Tests...\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }
  
  // Step 2: Get existing users
  console.log('\n📋 Getting existing users...');
  await getUsers();
  
  // Step 3: Create a test user
  console.log('\n➕ Creating test user...');
  const newUser = await createTestUser();
  if (!newUser) {
    console.log('❌ Cannot proceed without creating user');
    return;
  }
  
  // Step 4: Update the test user
  console.log('\n✏️ Updating test user...');
  await updateUser(newUser._id);
  
  // Step 5: Delete the test user
  console.log('\n🗑️ Deleting test user...');
  await deleteUser(newUser._id);
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
