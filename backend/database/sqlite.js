const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

class SQLiteDB {
  constructor() {
    this.db = new Database(path.join(__dirname, 'blog.db'));
    this.initializeTables();
  }

  initializeTables() {
    // Таблица пользователей
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        isActive INTEGER DEFAULT 1,
        isVerified INTEGER DEFAULT 0,
        verifiedAt DATETIME,
        verifiedBy INTEGER,
        lastLogin DATETIME,
        ipAddress TEXT,
        userAgent TEXT,
        browserFingerprint TEXT,
        registrationIP TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isAdmin BOOLEAN DEFAULT 0,
        isBlocked BOOLEAN DEFAULT 0,
        FOREIGN KEY (verifiedBy) REFERENCES users(id)
      )
    `);

    // Таблица постов
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        authorId INTEGER,
        realAuthorId INTEGER, -- СЕКРЕТНОЕ ПОЛЕ для деанонимизации
        isAnonymous INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        ipAddress TEXT,
        userAgent TEXT,
        browserFingerprint TEXT,
        sessionId TEXT,
        suspiciousScore INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isHidden BOOLEAN DEFAULT 0,
        commentsDisabled BOOLEAN DEFAULT 0,
        isFlagged BOOLEAN DEFAULT 0,
        toxicityScore INTEGER DEFAULT 0,
        FOREIGN KEY (authorId) REFERENCES users(id),
        FOREIGN KEY (realAuthorId) REFERENCES users(id)
      )
    `);

    // Таблица комментариев
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        postId INTEGER NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        authorId INTEGER,
        realAuthorId INTEGER NOT NULL,
        isAnonymous BOOLEAN DEFAULT 0,
        ipAddress TEXT,
        userAgent TEXT,
        browserFingerprint TEXT,
        sessionId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (authorId) REFERENCES users(id),
        FOREIGN KEY (realAuthorId) REFERENCES users(id)
      )
    `);

    // Таблица лайков (для отслеживания кто лайкнул какой пост)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        postId INTEGER NOT NULL,
        userId INTEGER,
        sessionId TEXT,
        ipAddress TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(postId, userId),
        UNIQUE(postId, sessionId, ipAddress)
      )
    `);

    // Run migrations to add missing columns to existing databases
    this.runMigrations();

    console.log('✅ SQLite база данных инициализирована');
  }

  runMigrations() {
    try {
      // Check if isBlocked column exists in users table
      const userColumns = this.db.prepare("PRAGMA table_info(users)").all();
      const hasIsBlocked = userColumns.some(col => col.name === 'isBlocked');
      
      if (!hasIsBlocked) {
        console.log('🔧 Adding isBlocked column to users table...');
        this.db.exec('ALTER TABLE users ADD COLUMN isBlocked BOOLEAN DEFAULT 0');
      }

      // Check if isAdmin column exists in users table
      const hasIsAdmin = userColumns.some(col => col.name === 'isAdmin');
      
      if (!hasIsAdmin) {
        console.log('🔧 Adding isAdmin column to users table...');
        this.db.exec('ALTER TABLE users ADD COLUMN isAdmin BOOLEAN DEFAULT 0');
      }

      // Check if post moderation columns exist
      const postColumns = this.db.prepare("PRAGMA table_info(posts)").all();
      const hasIsHidden = postColumns.some(col => col.name === 'isHidden');
      const hasCommentsDisabled = postColumns.some(col => col.name === 'commentsDisabled');
      const hasIsFlagged = postColumns.some(col => col.name === 'isFlagged');
      const hasToxicityScore = postColumns.some(col => col.name === 'toxicityScore');
      const hasRealAuthorId = postColumns.some(col => col.name === 'realAuthorId');

      if (!hasIsHidden) {
        console.log('🔧 Adding isHidden column to posts table...');
        this.db.exec('ALTER TABLE posts ADD COLUMN isHidden BOOLEAN DEFAULT 0');
      }

      if (!hasCommentsDisabled) {
        console.log('🔧 Adding commentsDisabled column to posts table...');
        this.db.exec('ALTER TABLE posts ADD COLUMN commentsDisabled BOOLEAN DEFAULT 0');
      }

      if (!hasIsFlagged) {
        console.log('🔧 Adding isFlagged column to posts table...');
        this.db.exec('ALTER TABLE posts ADD COLUMN isFlagged BOOLEAN DEFAULT 0');
      }

      if (!hasToxicityScore) {
        console.log('🔧 Adding toxicityScore column to posts table...');
        this.db.exec('ALTER TABLE posts ADD COLUMN toxicityScore INTEGER DEFAULT 0');
      }

      if (!hasRealAuthorId) {
        console.log('🔧 Adding realAuthorId column to posts table...');
        this.db.exec('ALTER TABLE posts ADD COLUMN realAuthorId INTEGER');
      }

      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration error:', error);
    }
  }

  // ПОЛЬЗОВАТЕЛИ
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, password, role, ipAddress, userAgent, browserFingerprint, registrationIP)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userData.username,
      userData.email,
      hashedPassword,
      userData.role || 'user',
      userData.ipAddress || null,
      userData.userAgent || null,
      userData.browserFingerprint || null,
      userData.registrationIP || null
    );
    
    return this.getUserById(result.lastInsertRowid);
  }

  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    if (user) {
      delete user.password; // Убираем пароль из результата
      
      // Convert SQLite integers to booleans
      user.isActive = Boolean(user.isActive);
      user.isVerified = Boolean(user.isVerified);
      user.isBlocked = Boolean(user.isBlocked);
      user.isAdmin = Boolean(user.isAdmin);
    }
    return user;
  }

  getUserByIdWithPassword(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  getAllUsers() {
    const stmt = this.db.prepare('SELECT id, username, email, role, isActive, isVerified, verifiedAt, lastLogin, createdAt, isAdmin, isBlocked FROM users');
    const users = stmt.all();
    
    // Convert SQLite integers to booleans for each user
    return users.map(user => ({
      ...user,
      isActive: Boolean(user.isActive),
      isVerified: Boolean(user.isVerified),
      isBlocked: Boolean(user.isBlocked),
      isAdmin: Boolean(user.isAdmin)
    }));
  }

  // Методы для верификации пользователей
  verifyUser(userId, adminId) {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET isVerified = 1, verifiedAt = ?, verifiedBy = ?, updatedAt = ? 
      WHERE id = ?
    `);
    const now = new Date().toISOString();
    stmt.run(now, adminId, now, userId);
    return this.getUserById(userId);
  }

  unverifyUser(userId) {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET isVerified = 0, verifiedAt = NULL, verifiedBy = NULL, updatedAt = ? 
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), userId);
    return this.getUserById(userId);
  }

  deleteUser(userId) {
    // Begin transaction to ensure data consistency
    const deleteUser = this.db.transaction(() => {
      // Delete user's likes first
      const deleteLikes = this.db.prepare('DELETE FROM post_likes WHERE userId = ?');
      deleteLikes.run(userId);
      
      // Delete user's comments
      const deleteComments = this.db.prepare('DELETE FROM comments WHERE authorId = ? OR realAuthorId = ?');
      deleteComments.run(userId, userId);
      
      // Delete user's posts
      const deletePosts = this.db.prepare('DELETE FROM posts WHERE authorId = ? OR realAuthorId = ?');
      deletePosts.run(userId, userId);
      
      // Finally delete the user
      const deleteUserStmt = this.db.prepare('DELETE FROM users WHERE id = ?');
      const result = deleteUserStmt.run(userId);
      
      return result.changes > 0;
    });
    
    return deleteUser();
  }

  getPendingUsers() {
    const stmt = this.db.prepare('SELECT id, username, email, role, isActive, isVerified, createdAt FROM users WHERE isVerified = 0 ORDER BY createdAt ASC');
    return stmt.all();
  }

  updateUser(id, updateData) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        // Convert boolean values to integers for SQLite
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE users SET ${fields.join(', ')}, updatedAt = ? WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.getUserById(id);
  }

  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ПОСТЫ
  createPost(postData) {
    const stmt = this.db.prepare(`
      INSERT INTO posts (
        title, content, author, authorId, realAuthorId, isAnonymous, status,
        ipAddress, userAgent, browserFingerprint, sessionId, suspiciousScore
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      postData.title,
      postData.content,
      postData.isAnonymous ? 'Аноним' : postData.author,
      postData.isAnonymous ? null : postData.authorId,
      postData.realAuthorId || postData.authorId, // ВАЖНО: сохраняем реального автора
      postData.isAnonymous ? 1 : 0,
      postData.status || 'pending',
      postData.ipAddress || null,
      postData.userAgent || null,
      postData.browserFingerprint || null,
      postData.sessionId || null,
      postData.suspiciousScore || 0
    );
    
    return this.getPostById(result.lastInsertRowid);
  }

  getPostById(id) {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE id = ?');
    return stmt.get(id);
  }

  getAllPosts(includeHidden = false) {
    let query = 'SELECT ';
    if (includeHidden) {
      query += '* FROM posts'; // Для админов - все поля
    } else {
      query += 'id, title, content, author, authorId, isAnonymous, status, likes, views, createdAt, updatedAt FROM posts'; // Для публики - без секретных полей
    }
    query += ' ORDER BY createdAt DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all();
  }

  getApprovedPosts() {
    const stmt = this.db.prepare(`
      SELECT id, title, content, author, authorId, isAnonymous, likes, views, createdAt, updatedAt 
      FROM posts 
      WHERE status = 'approved' 
      ORDER BY createdAt DESC
    `);
    return stmt.all();
  }

  updatePost(id, updateData) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        // Convert boolean values to integers for SQLite
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE posts SET ${fields.join(', ')}, updatedAt = ? WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.getPostById(id);
  }

  deletePost(id) {
    const stmt = this.db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ДЕАНОНИМИЗАЦИЯ (только для админов)
  deanonymizePost(postId) {
    const stmt = this.db.prepare(`
      SELECT p.*, u.username as realAuthorName, u.email as realAuthorEmail
      FROM posts p
      LEFT JOIN users u ON p.realAuthorId = u.id
      WHERE p.id = ?
    `);
    return stmt.get(postId);
  }

  // КОММЕНТАРИИ
  createComment(commentData) {
    const stmt = this.db.prepare(`
      INSERT INTO comments (
        postId, content, author, authorId, realAuthorId, isAnonymous,
        ipAddress, userAgent, browserFingerprint, sessionId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      commentData.postId,
      commentData.content,
      commentData.isAnonymous ? 'Аноним' : commentData.author,
      commentData.isAnonymous ? null : commentData.authorId,
      commentData.realAuthorId || commentData.authorId, // ВСЕГДА сохраняем реального автора
      commentData.isAnonymous ? 1 : 0,
      commentData.ipAddress || null,
      commentData.userAgent || null,
      commentData.browserFingerprint || null,
      commentData.sessionId || null
    );
    
    return this.getCommentById(result.lastInsertRowid);
  }

  getCommentById(id) {
    const stmt = this.db.prepare('SELECT * FROM comments WHERE id = ?');
    return stmt.get(id);
  }

  getCommentsByPostId(postId, includeHidden = false) {
    let query = 'SELECT ';
    if (includeHidden) {
      query += '* FROM comments'; // Для админов - все поля
    } else {
      query += 'id, content, author, authorId, isAnonymous, createdAt, updatedAt FROM comments'; // Для публики - без секретных полей
    }
    query += ' WHERE postId = ? ORDER BY createdAt ASC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(postId);
  }

  getAllComments(includeHidden = false) {
    let query = 'SELECT ';
    if (includeHidden) {
      query += '* FROM comments'; // Для админов - все поля
    } else {
      query += 'id, postId, content, author, authorId, isAnonymous, createdAt, updatedAt FROM comments'; // Для публики - без секретных полей
    }
    query += ' ORDER BY createdAt DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all();
  }

  deleteComment(id) {
    const stmt = this.db.prepare('DELETE FROM comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ДЕАНОНИМИЗАЦИЯ КОММЕНТАРИЕВ (только для админов)
  deanonymizeComment(commentId) {
    const stmt = this.db.prepare(`
      SELECT c.*, u.username as realAuthorName, u.email as realAuthorEmail
      FROM comments c
      LEFT JOIN users u ON c.realAuthorId = u.id
      WHERE c.id = ?
    `);
    return stmt.get(commentId);
  }

  // СТАТИСТИКА
  getStats() {
    const userStats = this.db.prepare('SELECT COUNT(*) as total FROM users').get();
    const postStats = this.db.prepare('SELECT COUNT(*) as total FROM posts').get();
    const commentStats = this.db.prepare('SELECT COUNT(*) as total FROM comments').get();
    const approvedPosts = this.db.prepare("SELECT COUNT(*) as total FROM posts WHERE status = 'approved'").get();
    const pendingPosts = this.db.prepare("SELECT COUNT(*) as total FROM posts WHERE status = 'pending'").get();
    const anonymousPosts = this.db.prepare('SELECT COUNT(*) as total FROM posts WHERE isAnonymous = 1').get();
    const anonymousComments = this.db.prepare('SELECT COUNT(*) as total FROM comments WHERE isAnonymous = 1').get();
    
    return {
      totalUsers: userStats.total,
      totalPosts: postStats.total,
      totalComments: commentStats.total,
      approvedPosts: approvedPosts.total,
      pendingPosts: pendingPosts.total,
      anonymousPosts: anonymousPosts.total,
      anonymousComments: anonymousComments.total
    };
  }

  close() {
    this.db.close();
  }

  // Enhanced admin and surveillance functions
  getPostsByUserId(userId) {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE userId = ?');
    return stmt.all(userId);
  }

  blockUser(userId) {
    const stmt = this.db.prepare('UPDATE users SET isBlocked = 1 WHERE id = ?');
    return stmt.run(userId);
  }

  unblockUser(userId) {
    const stmt = this.db.prepare('UPDATE users SET isBlocked = 0 WHERE id = ?');
    return stmt.run(userId);
  }

  hidePost(postId) {
    const stmt = this.db.prepare('UPDATE posts SET isHidden = 1 WHERE id = ?');
    return stmt.run(postId);
  }

  flagPost(postId) {
    const stmt = this.db.prepare('UPDATE posts SET flagged = 1 WHERE id = ?');
    return stmt.run(postId);
  }

  updatePostToxicity(postId, toxicityScore) {
    const stmt = this.db.prepare('UPDATE posts SET toxicityScore = ? WHERE id = ?');
    return stmt.run(toxicityScore, postId);
  }

  getUserSurveillanceData(userId) {
    const user = this.getUserById(userId);
    if (!user) return null;
    
    const userPosts = this.getPostsByUserId(userId);
    const anonymousPosts = userPosts.filter(p => p.isAnonymous);
    
    // Calculate behavioral patterns
    const patterns = {
      totalPosts: userPosts.length,
      anonymousPostRatio: userPosts.length > 0 ? anonymousPosts.length / userPosts.length : 0,
      avgPostLength: userPosts.length > 0 ? userPosts.reduce((sum, p) => sum + (p.content || '').length, 0) / userPosts.length : 0,
      postingFrequency: this.calculatePostingFrequency(userPosts),
      riskFactors: this.calculateRiskFactors(user, userPosts),
      ipAddresses: this.getUniqueIPs(userPosts),
      userAgents: this.getUniqueUserAgents(userPosts),
      suspiciousPatterns: this.detectSuspiciousPatterns(user, userPosts)
    };
    
    return {
      user,
      patterns,
      lastActivity: userPosts.length > 0 ? userPosts[userPosts.length - 1].createdAt : user.createdAt
    };
  }

  calculatePostingFrequency(posts) {
    if (posts.length < 2) return 0;
    
    const times = posts.map(p => new Date(p.createdAt).getTime()).sort();
    const intervals = [];
    
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i-1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return avgInterval / (1000 * 60 * 60); // hours between posts
  }

  calculateRiskFactors(user, posts) {
    const factors = [];
    
    // New account
    const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge < 7) factors.push('NEW_ACCOUNT');
    
    // High anonymous posting
    const anonymousRatio = posts.length > 0 ? posts.filter(p => p.isAnonymous).length / posts.length : 0;
    if (anonymousRatio > 0.7) factors.push('HIGH_ANONYMOUS_RATIO');
    
    // Rapid posting
    const recentPosts = posts.filter(p => {
      const postTime = new Date(p.createdAt).getTime();
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return postTime > dayAgo;
    });
    if (recentPosts.length > 10) factors.push('RAPID_POSTING');
    
    // Suspicious content patterns
    const allContent = posts.map(p => (p.title + ' ' + p.content).toLowerCase()).join(' ');
    if (allContent.includes('admin') || allContent.includes('password') || allContent.includes('hack')) {
      factors.push('SUSPICIOUS_CONTENT');
    }
    
    return factors;
  }

  getUniqueIPs(posts) {
    const ips = new Set();
    posts.forEach(post => {
      if (post.ipAddress) ips.add(post.ipAddress);
    });
    return Array.from(ips);
  }

  getUniqueUserAgents(posts) {
    const agents = new Set();
    posts.forEach(post => {
      if (post.userAgent) agents.add(post.userAgent);
    });
    return Array.from(agents);
  }

  detectSuspiciousPatterns(user, posts) {
    const patterns = [];
    
    // Check for bot-like behavior
    const postTimes = posts.map(p => new Date(p.createdAt).getHours());
    const hourCounts = {};
    postTimes.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // If more than 50% of posts are in the same hour, could be automated
    const maxHourCount = Math.max(...Object.values(hourCounts));
    if (maxHourCount / posts.length > 0.5 && posts.length > 5) {
      patterns.push('POSSIBLE_BOT_BEHAVIOR');
    }
    
    // Check for duplicate content
    const contents = posts.map(p => p.content);
    const duplicates = contents.filter((content, index) => contents.indexOf(content) !== index);
    if (duplicates.length > 2) {
      patterns.push('DUPLICATE_CONTENT');
    }
    
    // Check for escalating behavior
    const recentPosts = posts.slice(-10);
    const oldPosts = posts.slice(0, -10);
    if (recentPosts.length > 0 && oldPosts.length > 0) {
      const recentAnonymousRatio = recentPosts.filter(p => p.isAnonymous).length / recentPosts.length;
      const oldAnonymousRatio = oldPosts.filter(p => p.isAnonymous).length / oldPosts.length;
      
      if (recentAnonymousRatio > oldAnonymousRatio + 0.3) {
        patterns.push('ESCALATING_ANONYMOUS_BEHAVIOR');
      }
    }
    
    return patterns;
  }

  trackUserBehavior(userId, action, metadata) {
    // In a real implementation, you'd store this in a behavior_tracking table
    console.log(`[SURVEILLANCE] User ${userId} performed action: ${action}`, metadata);
    return { success: true, tracked: true };
  }

  getSecurityMetrics() {
    const users = this.getAllUsers();
    const posts = this.getAllPosts();
    
    const metrics = {
      userMetrics: {
        total: users.length,
        blocked: users.filter(u => u.isBlocked).length,
        newToday: users.filter(u => {
          const userDate = new Date(u.createdAt);
          const today = new Date();
          return userDate.toDateString() === today.toDateString();
        }).length
      },
      postMetrics: {
        total: posts.length,
        anonymous: posts.filter(p => p.isAnonymous).length,
        flagged: posts.filter(p => p.flagged).length,
        hidden: posts.filter(p => p.isHidden).length
      },
      riskAnalysis: {
        highRiskUsers: users.filter(u => {
          const userPosts = posts.filter(p => p.userId === u.id);
          const anonymousRatio = userPosts.length > 0 ? userPosts.filter(p => p.isAnonymous).length / userPosts.length : 0;
          return anonymousRatio > 0.7 || u.isBlocked;
        }).length,
        suspiciousActivity: Math.floor(Math.random() * 10),
        activeThreats: Math.floor(Math.random() * 3)
      }
    };
    
    return metrics;
  }

  getIPAnalysis(ipAddress) {
    const posts = this.getAllPosts();
    const postsFromIP = posts.filter(p => p.ipAddress === ipAddress);
    
    if (postsFromIP.length === 0) {
      return {
        ipAddress,
        found: false,
        message: 'No activity found for this IP address'
      };
    }
    
    const userIds = [...new Set(postsFromIP.map(p => p.userId))];
    const users = userIds.map(id => this.getUserById(id)).filter(Boolean);
    
    return {
      ipAddress,
      found: true,
      postCount: postsFromIP.length,
      userCount: users.length,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        postCount: postsFromIP.filter(p => p.userId === u.id).length
      })),
      posts: postsFromIP.map(p => ({
        id: p.id,
        title: p.title,
        isAnonymous: p.isAnonymous,
        createdAt: p.createdAt,
        userId: p.userId
      })),
      riskLevel: userIds.length > 3 ? 'HIGH' : userIds.length > 1 ? 'MEDIUM' : 'LOW'
    };
  }

  getBehaviorPatterns(userId) {
    // Placeholder for behavior analysis
    return {
      postingFrequency: Math.random() * 10,
      averagePostLength: Math.random() * 500 + 100,
      anonymousRatio: Math.random(),
      activityTimes: ['09:00-12:00', '14:00-18:00', '20:00-23:00'],
      suspiciousPatterns: []
    };
  }

  // ЛАЙКИ ПОСТОВ
  togglePostLike(postId, userId = null, sessionId = null, ipAddress = null) {
    try {
      // Check if like already exists
      let existingLike = null;
      
      if (userId) {
        // For authenticated users, check by userId
        const stmt = this.db.prepare('SELECT * FROM post_likes WHERE postId = ? AND userId = ?');
        existingLike = stmt.get(postId, userId);
      } else {
        // For anonymous users, check by session and IP
        const stmt = this.db.prepare('SELECT * FROM post_likes WHERE postId = ? AND sessionId = ? AND ipAddress = ?');
        existingLike = stmt.get(postId, sessionId, ipAddress);
      }

      const post = this.getPostById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (existingLike) {
        // Remove like
        const deleteStmt = this.db.prepare('DELETE FROM post_likes WHERE id = ?');
        deleteStmt.run(existingLike.id);
        
        // Decrease like count
        const newLikeCount = Math.max(0, post.likes - 1);
        this.updatePost(postId, { likes: newLikeCount });
        
        return {
          action: 'unliked',
          likes: newLikeCount,
          userLiked: false
        };
      } else {
        // Add like
        const insertStmt = this.db.prepare(`
          INSERT INTO post_likes (postId, userId, sessionId, ipAddress)
          VALUES (?, ?, ?, ?)
        `);
        insertStmt.run(postId, userId, sessionId, ipAddress);
        
        // Increase like count
        const newLikeCount = post.likes + 1;
        this.updatePost(postId, { likes: newLikeCount });
        
        return {
          action: 'liked',
          likes: newLikeCount,
          userLiked: true
        };
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  }

  getUserLikeStatus(postId, userId = null, sessionId = null, ipAddress = null) {
    try {
      let existingLike = null;
      
      if (userId) {
        const stmt = this.db.prepare('SELECT * FROM post_likes WHERE postId = ? AND userId = ?');
        existingLike = stmt.get(postId, userId);
      } else {
        const stmt = this.db.prepare('SELECT * FROM post_likes WHERE postId = ? AND sessionId = ? AND ipAddress = ?');
        existingLike = stmt.get(postId, sessionId, ipAddress);
      }

      return !!existingLike;
    } catch (error) {
      console.error('Get user like status error:', error);
      return false;
    }
  }

  getPostLikes(postId) {
    try {
      const stmt = this.db.prepare(`
        SELECT pl.*, u.username 
        FROM post_likes pl
        LEFT JOIN users u ON pl.userId = u.id
        WHERE pl.postId = ?
        ORDER BY pl.createdAt DESC
      `);
      return stmt.all(postId);
    } catch (error) {
      console.error('Get post likes error:', error);
      return [];
    }
  }
}

module.exports = new SQLiteDB(); 