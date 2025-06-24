const db = require('./database/sqlite');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = db.getUserByEmail('admin@forum.com');
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email: admin@forum.com');
      console.log('Password: admin123');
      console.log('Is Admin:', existingAdmin.isAdmin);
      
      // Update existing user to be admin if not already
      if (!existingAdmin.isAdmin) {
        db.updateUser(existingAdmin.id, { isAdmin: true, isVerified: true });
        console.log('✅ Updated user to admin status!');
      }
      return;
    }

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@forum.com',
      password: 'admin123', // Will be hashed by createUser
      role: 'admin', // Keep for compatibility
      isVerified: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Admin Creation Script',
      registrationIP: '127.0.0.1'
    };

    const admin = await db.createUser(adminData);
    
    // Make sure the user is set as admin
    db.updateUser(admin.id, { isAdmin: true, isVerified: true });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@forum.com');
    console.log('Password: admin123');
    console.log('Is Admin: true');
    console.log('Please save these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

createAdmin(); 