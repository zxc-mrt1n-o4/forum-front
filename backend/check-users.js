const db = require('./database/sqlite');

console.log('Checking users in database...');

const users = db.getAllUsers();
console.log('Total users:', users.length);

users.forEach(user => {
  console.log(`User: ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
});

// Test password comparison
const bcrypt = require('bcryptjs');

// Try to get a user with password to test password verification
const testUser = db.getUserByEmail('test@example.com');
if (testUser) {
  console.log('\nTesting password for test@example.com...');
  const userWithPassword = db.getUserByIdWithPassword(testUser.id);
  if (userWithPassword) {
    console.log('User found with password hash:', userWithPassword.password.substring(0, 20) + '...');
    
    // Test password comparison
    bcrypt.compare('password123', userWithPassword.password).then(result => {
      console.log('Password "password123" matches:', result);
    }).catch(err => {
      console.error('Password comparison error:', err);
    });
  }
}

db.close(); 