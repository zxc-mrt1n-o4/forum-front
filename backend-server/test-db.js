const db = require('./database/sqlite');

async function testDatabase() {
  console.log('Testing SQLite database...');

  try {
    // Test database connection
    const stats = db.getStats();
    console.log('✅ Database connected successfully');
    console.log('📊 Stats:', stats);
    
    // Test creating a user
    console.log('\n🧪 Testing user creation...');
    const testUser = {
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123'
    };
    
    const user = await db.createUser(testUser);
    console.log('✅ User created:', user);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase(); 