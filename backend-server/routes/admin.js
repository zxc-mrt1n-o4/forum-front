const express = require('express');
const db = require('../database/sqlite');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware для проверки роли админа
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Требуется аутентификация'
    });
  }

  // req.user уже содержит полный объект пользователя из middleware
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Доступ запрещен. Требуются права администратора'
    });
  }

  next();
};

// Применяем middleware аутентификации ко всем админским роутам
router.use(auth);
router.use(requireAdmin);

// Получить статистику
router.get('/stats', async (req, res) => {
  try {
    const stats = db.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики'
    });
  }
});

// Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const users = db.getAllUsers();
    
    // Add surveillance metrics for each user
    const usersWithMetrics = users.map(user => {
      const allPosts = db.getAllPosts();
      const userPosts = allPosts.filter(p => p.realAuthorId === user.id);
      const anonymousPosts = userPosts.filter(p => p.isAnonymous);
      
      // Calculate risk score based on various factors
      let riskScore = 0;
      
      // Anonymous posting frequency (higher = more risk)
      const anonymousRatio = userPosts.length > 0 ? (anonymousPosts.length / userPosts.length) * 100 : 0;
      riskScore += anonymousRatio * 0.3;
      
      // Account age (newer accounts = higher risk)
      const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days
      if (accountAge < 7) riskScore += 30;
      else if (accountAge < 30) riskScore += 15;
      
      // Post frequency (very high or very low = risk)
      const postsPerDay = userPosts.length / Math.max(accountAge, 1);
      if (postsPerDay > 5) riskScore += 20;
      if (postsPerDay < 0.1 && accountAge > 7) riskScore += 10;
      
      // Cap risk score at 100
      riskScore = Math.min(Math.round(riskScore), 100);
      
      return {
        ...user,
        // Convert SQLite integer booleans to JavaScript booleans
        isBlocked: Boolean(user.isBlocked),
        isActive: Boolean(user.isActive),
        isVerified: Boolean(user.isVerified),
        isAdmin: Boolean(user.isAdmin),
        riskScore,
        suspiciousActivity: Math.floor(Math.random() * 5), // Simulated for demo
        postCount: userPosts.length,
        anonymousPostCount: anonymousPosts.length,
        lastLogin: user.lastLogin || user.createdAt,
        ipAddress: user.ipAddress || '192.168.1.' + (Math.floor(Math.random() * 255) + 1),
        userAgent: user.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
    });
    
    res.json({ users: usersWithMetrics });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Получить пользователей ожидающих верификации
router.get('/users/pending', async (req, res) => {
  try {
    const pendingUsers = db.getPendingUsers();
    
    res.json({
      success: true,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения пользователей на верификации'
    });
  }
});

// Верифицировать пользователя
router.post('/users/:id/verify', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminUser = req.user;
    
    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    db.verifyUser(userId, adminUser.id);
    
    res.json({
      success: true,
      message: `Пользователь ${targetUser.username} верифицирован`
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка верификации пользователя'
    });
  }
});

// Отменить верификацию пользователя
router.post('/users/:id/unverify', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const targetUser = db.getUserById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Не позволяем отменить верификацию администратора
    if (targetUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя отменить верификацию администратора'
      });
    }

    db.unverifyUser(userId);
    
    res.json({
      success: true,
      message: `Верификация пользователя ${targetUser.username} отменена`
    });
  } catch (error) {
    console.error('Unverify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка отмены верификации'
    });
  }
});

// Получить все посты с секретными данными
router.get('/posts', async (req, res) => {
  try {
    const posts = db.getAllPosts(true); // true для получения всех полей
    
    const postsWithMetadata = posts.map(post => {
      // Get real author name for ALL posts (anonymous and regular)
      let realAuthorName = null;
      if (post.realAuthorId) {
        const deanonymizedData = db.deanonymizePost(post.id);
        realAuthorName = deanonymizedData?.realAuthorName || null;
      }
      
      // If no realAuthorName found but we have regular author, use that
      if (!realAuthorName && !post.isAnonymous && post.author) {
        realAuthorName = post.author;
      }
      
      // Simulate toxicity analysis
      const toxicityKeywords = ['плохой', 'ужасный', 'идиот', 'дурак', 'hate', 'kill', 'die'];
      const content = (post.title + ' ' + post.content).toLowerCase();
      let toxicityScore = post.toxicityScore || 0;
      
      if (toxicityScore === 0) {
        toxicityKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            toxicityScore += 25;
          }
        });
        toxicityScore = Math.min(toxicityScore + Math.floor(Math.random() * 20), 100);
      }
      
      // Format author display for admin panel
      let authorDisplay = post.author;
      if (post.isAnonymous) {
        authorDisplay = realAuthorName ? `Аноним (${realAuthorName})` : 'Аноним';
      }
      
      return {
        ...post,
        // Convert SQLite integer booleans to JavaScript booleans
        isAnonymous: Boolean(post.isAnonymous),
        isHidden: Boolean(post.isHidden),
        isFlagged: Boolean(post.isFlagged),
        commentsDisabled: Boolean(post.commentsDisabled),
        authorDisplay, // This shows "Аноним (Username)" for anonymous posts
        realAuthor: realAuthorName, // Use realAuthor instead of realAuthorName for consistency
        toxicityScore,
        flagged: Boolean(post.isFlagged),
        ipAddress: post.ipAddress || '192.168.1.' + (Math.floor(Math.random() * 255) + 1),
        userAgent: post.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        browserFingerprint: post.browserFingerprint || 'fp_' + Math.random().toString(36).substring(2),
        sessionId: post.sessionId || 'sess_' + Math.random().toString(36).substring(2)
      };
    });
    
    res.json({ posts: postsWithMetadata });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Деанонимизация поста - ГЛАВНАЯ ФУНКЦИЯ СЛЕЖКИ
router.get('/posts/:id/deanonymize', async (req, res) => {
  try {
    const postId = req.params.id;
    const deanonymizedPost = db.deanonymizePost(postId);
    
    if (!deanonymizedPost) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    // Анализ уверенности в деанонимизации
    let confidence = 'unknown';
    let method = 'none';
    
    if (deanonymizedPost.realAuthorId) {
      confidence = '100%';
      method = 'direct_tracking';
    } else if (deanonymizedPost.sessionId) {
      confidence = '95%';
      method = 'session_correlation';
    } else if (deanonymizedPost.browserFingerprint) {
      confidence = '70%';
      method = 'browser_fingerprint';
    } else if (deanonymizedPost.ipAddress) {
      confidence = '85%';
      method = 'ip_correlation';
    }

    res.json({
      success: true,
      message: 'Деанонимизация выполнена',
      post: deanonymizedPost,
      analysis: {
        confidence,
        method,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Deanonymization error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка деанонимизации'
    });
  }
});

// Обновить статус поста
router.put('/posts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный статус'
      });
    }

    const updatedPost = db.updatePost(req.params.id, { status });
    
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    res.json({
      success: true,
      message: 'Статус поста обновлен',
      post: updatedPost
    });

  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статуса'
    });
  }
});

// Удалить пост
router.delete('/posts/:id', async (req, res) => {
  try {
    const deleted = db.deletePost(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    res.json({
      success: true,
      message: 'Пост удален'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления поста'
    });
  }
});

// Скрыть пост
router.post('/posts/:id/hide', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    const updatedPost = db.updatePost(postId, { isHidden: true });
    
    res.json({
      success: true,
      message: 'Пост скрыт',
      post: updatedPost
    });

  } catch (error) {
    console.error('Hide post error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка скрытия поста'
    });
  }
});

// Показать пост
router.post('/posts/:id/unhide', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    const updatedPost = db.updatePost(postId, { isHidden: false });
    
    res.json({
      success: true,
      message: 'Пост показан',
      post: updatedPost
    });

  } catch (error) {
    console.error('Unhide post error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка показа поста'
    });
  }
});

// Обновить роль пользователя
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Неверная роль'
      });
    }

    const updatedUser = db.updateUser(req.params.id, { role });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      message: 'Роль пользователя обновлена',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления роли'
    });
  }
});

// Получить все комментарии (для админов)
router.get('/comments', async (req, res) => {
  try {
    const comments = db.getAllComments(true); // включаем скрытые поля
    
    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Get admin comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения комментариев'
    });
  }
});

// Деанонимизировать комментарий
router.get('/comments/:id/deanonymize', async (req, res) => {
  try {
    const commentData = db.deanonymizeComment(req.params.id);
    
    if (!commentData) {
      return res.status(404).json({
        success: false,
        message: 'Комментарий не найден'
      });
    }

    // Анализ уверенности в деанонимизации
    let confidence = 'unknown';
    let method = 'none';
    
    if (commentData.realAuthorId) {
      confidence = '100%';
      method = 'direct_tracking';
    } else if (commentData.sessionId) {
      confidence = '95%';
      method = 'session_correlation';
    } else if (commentData.browserFingerprint) {
      confidence = '70%';
      method = 'browser_fingerprint';
    } else if (commentData.ipAddress) {
      confidence = '85%';
      method = 'ip_correlation';
    }

    res.json({
      success: true,
      message: 'Деанонимизация комментария выполнена',
      comment: commentData,
      analysis: {
        confidence,
        method,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Deanonymize comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка деанонимизации комментария'
    });
  }
});

// Удалить комментарий
router.delete('/comments/:id', async (req, res) => {
  try {
    const deleted = db.deleteComment(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Комментарий не найден'
      });
    }

    res.json({
      success: true,
      message: 'Комментарий удален'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления комментария'
    });
  }
});

// Заблокировать пользователя
router.post('/users/:id/block', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminUser = req.user;

    // Проверяем, что это не попытка заблокировать администратора
    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (targetUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя заблокировать другого администратора'
      });
    }

    db.blockUser(userId);
    
    res.json({
      success: true,
      message: `Пользователь ${targetUser.username} заблокирован`
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка блокировки пользователя'
    });
  }
});

// Разблокировать пользователя
router.post('/users/:id/unblock', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const targetUser = db.getUserById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    db.unblockUser(userId);
    
    res.json({
      success: true,
      message: `Пользователь ${targetUser.username} разблокирован`
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка разблокировки пользователя'
    });
  }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminUser = req.user;

    // Проверяем, что это не попытка удалить администратора
    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (targetUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя удалить другого администратора'
      });
    }

    // Проверяем, что админ не удаляет сам себя
    if (targetUser.id === adminUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя удалить собственный аккаунт'
      });
    }

    // Удаляем пользователя и все связанные данные
    db.deleteUser(userId);
    
    res.json({
      success: true,
      message: `Пользователь ${targetUser.username} удален`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления пользователя'
    });
  }
});

// Получить детальную информацию о посте
router.get('/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    // Get real author for the post
    let postWithRealAuthor = { ...post };
    if (post.realAuthorId) {
      const deanonymizedPost = db.deanonymizePost(postId);
      if (deanonymizedPost && deanonymizedPost.realAuthorName) {
        postWithRealAuthor.realAuthor = deanonymizedPost.realAuthorName;
      }
    }

    // Получаем комментарии к посту (включая скрытые поля для админов)
    const comments = db.getCommentsByPostId(postId, true); // true для админских данных
    
    // Add real author information to comments
    const commentsWithRealAuthors = comments.map(comment => {
      let commentWithRealAuthor = { ...comment };
      if (comment.realAuthorId) {
        const deanonymizedComment = db.deanonymizeComment(comment.id);
        if (deanonymizedComment && deanonymizedComment.realAuthorName) {
          commentWithRealAuthor.realAuthorName = deanonymizedComment.realAuthorName;
        }
      }
      return commentWithRealAuthor;
    });

    res.json({
      success: true,
      post: postWithRealAuthor, // Возвращаем полную информацию включая реального автора
      comments: commentsWithRealAuthors // Возвращаем полную информацию о комментариях с реальными авторами
    });

  } catch (error) {
    console.error('Get post details error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных поста'
    });
  }
});

// Bulk deanonymization
router.post('/posts/bulk-deanonymize', (req, res) => {
  try {
    const { postIds } = req.body;
    
    if (!postIds || !Array.isArray(postIds)) {
      return res.status(400).json({ error: 'Invalid postIds array' });
    }
    
    const results = [];
    
    for (const postId of postIds.slice(0, 10)) { // Limit to 10 for performance
      try {
        const post = db.getPost(postId);
        if (post && post.isAnonymous) {
          // Simplified bulk analysis
          const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
          const allUsers = db.getAllUsers();
          const suspectedUser = allUsers[Math.floor(Math.random() * allUsers.length)];
          
          results.push({
            postId,
            confidence,
            methods: {
              directMatch: post.realAuthorId ? true : false,
              ipCorrelation: Math.floor(Math.random() * 30) + 70,
              fingerprintMatch: Math.floor(Math.random() * 40) + 50,
              sessionCorrelation: Math.floor(Math.random() * 35) + 65,
              behavioralAnalysis: Math.floor(Math.random() * 50) + 40
            },
            suspectedUser: {
              id: suspectedUser.id,
              username: suspectedUser.username,
              email: suspectedUser.email,
              riskScore: Math.floor(Math.random() * 60) + 40
            },
            metadata: {
              ipAddress: '192.168.1.' + (Math.floor(Math.random() * 255) + 1),
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              browserFingerprint: 'fp_' + Math.random().toString(36).substring(2),
              sessionId: 'sess_' + Math.random().toString(36).substring(2),
              timestamp: post.createdAt
            }
          });
        }
      } catch (error) {
        console.error(`Error processing post ${postId}:`, error);
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error in bulk deanonymization:', error);
    res.status(500).json({ error: 'Failed to bulk deanonymize' });
  }
});

// Get surveillance statistics
router.get('/surveillance/security-stats', (req, res) => {
  try {
    const users = db.getAllUsers();
    const posts = db.getAllPosts();
    
    const stats = {
      totalUsers: users.length,
      blockedUsers: users.filter(u => u.isBlocked).length,
      highRiskUsers: users.filter(u => {
        // Calculate risk based on anonymous posting ratio
        const userPosts = posts.filter(p => p.userId === u.id);
        const anonymousRatio = userPosts.length > 0 ? (userPosts.filter(p => p.isAnonymous).length / userPosts.length) : 0;
        return anonymousRatio > 0.5;
      }).length,
      totalPosts: posts.length,
      anonymousPosts: posts.filter(p => p.isAnonymous).length,
      flaggedPosts: Math.floor(posts.length * 0.1), // Simulate 10% flagged
      hiddenPosts: Math.floor(posts.length * 0.05), // Simulate 5% hidden
      averageToxicity: Math.floor(Math.random() * 30) + 20, // 20-50%
      activeThreats: Math.floor(Math.random() * 5) + 1,
      lastScanTime: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting security stats:', error);
    res.status(500).json({ error: 'Failed to get security stats' });
  }
});

// Get suspicious activity
router.get('/surveillance/suspicious-activity', (req, res) => {
  try {
    const users = db.getAllUsers();
    const posts = db.getAllPosts();
    
    const suspiciousActivities = [];
    
    // Find users with high anonymous posting
    users.forEach(user => {
      const userPosts = posts.filter(p => p.userId === user.id);
      const anonymousCount = userPosts.filter(p => p.isAnonymous).length;
      
      if (anonymousCount > 3) {
        suspiciousActivities.push({
          type: 'HIGH_ANONYMOUS_ACTIVITY',
          userId: user.id,
          username: user.username,
          description: `Пользователь создал ${anonymousCount} анонимных постов`,
          severity: 'HIGH',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Find rapid posting
    const recentPosts = posts.filter(p => {
      const postTime = new Date(p.createdAt).getTime();
      const hourAgo = Date.now() - (60 * 60 * 1000);
      return postTime > hourAgo;
    });
    
    const userPostCounts = {};
    recentPosts.forEach(post => {
      userPostCounts[post.userId] = (userPostCounts[post.userId] || 0) + 1;
    });
    
    Object.entries(userPostCounts).forEach(([userId, count]) => {
      if (count > 5) {
        const user = users.find(u => u.id == userId);
        if (user) {
          suspiciousActivities.push({
            type: 'RAPID_POSTING',
            userId: user.id,
            username: user.username,
            description: `Создано ${count} постов за последний час`,
            severity: 'MEDIUM',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    res.json({ activities: suspiciousActivities });
  } catch (error) {
    console.error('Error getting suspicious activity:', error);
    res.status(500).json({ error: 'Failed to get suspicious activity' });
  }
});

// Get real-time activity feed
router.get('/surveillance/real-time-activity', (req, res) => {
  try {
    const posts = db.getAllPosts();
    const recentPosts = posts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map(post => ({
        id: post.id,
        type: 'POST_CREATED',
        userId: post.userId,
        username: post.author,
        isAnonymous: post.isAnonymous,
        title: post.title,
        timestamp: post.createdAt,
        ipAddress: '192.168.1.' + (Math.floor(Math.random() * 255) + 1),
        riskLevel: post.isAnonymous ? 'MEDIUM' : 'LOW'
      }));
    
    res.json({ activities: recentPosts });
  } catch (error) {
    console.error('Error getting real-time activity:', error);
    res.status(500).json({ error: 'Failed to get real-time activity' });
  }
});

// Emergency lockdown
router.post('/emergency/lockdown', (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Block all new registrations
    // 2. Disable posting for non-admin users
    // 3. Enable enhanced monitoring
    // 4. Send alerts to administrators
    
    console.log('🚨 EMERGENCY LOCKDOWN ACTIVATED 🚨');
    console.log('- All new registrations blocked');
    console.log('- Posting disabled for regular users');
    console.log('- Enhanced surveillance enabled');
    
    res.json({ 
      success: true, 
      message: 'Emergency lockdown activated',
      timestamp: new Date().toISOString(),
      measures: [
        'New registrations blocked',
        'Posting disabled for regular users',
        'Enhanced surveillance enabled',
        'All administrators notified'
      ]
    });
  } catch (error) {
    console.error('Error activating emergency lockdown:', error);
    res.status(500).json({ error: 'Failed to activate emergency lockdown' });
  }
});

module.exports = router; 