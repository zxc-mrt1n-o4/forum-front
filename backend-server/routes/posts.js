const express = require('express');
const db = require('../database/sqlite');
const auth = require('../middleware/auth');

const router = express.Router();

// Получить все одобренные посты
router.get('/', auth.optionalAuth, async (req, res) => {
  try {
    const posts = db.getApprovedPosts();
    
    // Add user like status for each post
    const userId = req.user ? req.user.id : null;
    const sessionId = req.get('X-Session-ID') || req.sessionID || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      userLiked: db.getUserLikeStatus(post.id, userId, sessionId, ipAddress)
    }));
    
    res.json({
      success: true,
      posts: postsWithLikeStatus
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения постов'
    });
  }
});

// Получить пост по ID
router.get('/:id', auth.optionalAuth, async (req, res) => {
  try {
    const post = db.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    // Проверяем, нужно ли увеличивать счетчик просмотров
    const sessionId = req.get('X-Session-ID') || req.sessionID || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const viewKey = `${post.id}_${sessionId}_${ipAddress}`;
    
    // Инициализируем хранилище просмотров в памяти (для простоты)
    if (!global.viewTracker) {
      global.viewTracker = new Map();
    }
    
    // Проверяем, не просматривал ли уже этот пост в течение последних 30 минут
    const lastView = global.viewTracker.get(viewKey);
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    let shouldIncrementView = false;
    if (!lastView || (now - lastView) > thirtyMinutes) {
      shouldIncrementView = true;
      global.viewTracker.set(viewKey, now);
      
      // Очищаем старые записи (старше 2 часов)
      const twoHours = 2 * 60 * 60 * 1000;
      for (const [key, timestamp] of global.viewTracker.entries()) {
        if ((now - timestamp) > twoHours) {
          global.viewTracker.delete(key);
        }
      }
    }

    let updatedViews = post.views;
    if (shouldIncrementView) {
      db.updatePost(post.id, { views: post.views + 1 });
      updatedViews = post.views + 1;
    }

    // Check if user liked this post
    const userId = req.user ? req.user.id : null;
    const userLiked = db.getUserLikeStatus(post.id, userId, sessionId, ipAddress);

    // Получаем комментарии к посту
    const comments = db.getCommentsByPostId(post.id);

    // Убираем секретные поля из поста для публичного просмотра
    const publicPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author,
      authorId: post.authorId,
      isAnonymous: post.isAnonymous,
      likes: post.likes,
      views: updatedViews,
      userLiked: userLiked,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };

    res.json({
      success: true,
      post: publicPost,
      comments
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения поста'
    });
  }
});

// Лайк поста
router.post('/:id/like', auth.optionalAuth, async (req, res) => {
  try {
    const post = db.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    // Get user info and session data
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID || req.get('X-Session-ID') || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Toggle like
    const result = db.togglePostLike(post.id, userId, sessionId, ipAddress);

    res.json({
      success: true,
      message: result.action === 'liked' ? 'Лайк добавлен' : 'Лайк убран',
      likes: result.likes,
      userLiked: result.userLiked,
      action: result.action
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обработки лайка'
    });
  }
});

// Создать новый пост - ТРЕБУЕТ ВЕРИФИКАЦИИ
router.post('/', auth, auth.requireVerified, async (req, res) => {
  try {
    const { title, content, isAnonymous } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Заголовок и содержание обязательны'
      });
    }

    // req.user уже содержит полный объект пользователя из middleware
    const user = req.user;

    // Получаем метаданные для деанонимизации
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const sessionId = req.sessionID || req.get('X-Session-ID') || 'unknown';

    // Создаем браузерный отпечаток
    const browserFingerprint = Buffer.from(
      userAgent + ipAddress + (req.get('Accept-Language') || '')
    ).toString('base64').slice(0, 32);

    // Создаем пост
    const postData = {
      title,
      content,
      author: isAnonymous ? 'Аноним' : user.username,
      authorId: isAnonymous ? null : user.id,
      realAuthorId: user.id, // ВСЕГДА сохраняем реального автора!
      isAnonymous: Boolean(isAnonymous),
      status: 'approved', // Автоматическое одобрение
      ipAddress,
      userAgent,
      browserFingerprint,
      sessionId
    };

    const post = db.createPost(postData);

    res.status(201).json({
      success: true,
      message: 'Пост успешно создан',
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author,
        isAnonymous: post.isAnonymous,
        status: post.status,
        createdAt: post.createdAt
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания поста'
    });
  }
});

// Добавить комментарий к посту - ТРЕБУЕТ ВЕРИФИКАЦИИ
router.post('/:id/comments', auth, auth.requireVerified, async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Содержание комментария обязательно'
      });
    }

    // Проверяем, что пост существует
    const post = db.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }

    // req.user уже содержит полный объект пользователя из middleware
    const user = req.user;

    // Получаем метаданные для деанонимизации
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const sessionId = req.sessionID || req.get('X-Session-ID') || 'unknown';

    // Создаем браузерный отпечаток
    const browserFingerprint = Buffer.from(
      userAgent + ipAddress + (req.get('Accept-Language') || '')
    ).toString('base64').slice(0, 32);

    // Создаем комментарий
    const commentData = {
      postId: req.params.id,
      content: content.trim(),
      author: isAnonymous ? 'Аноним' : user.username,
      authorId: isAnonymous ? null : user.id,
      realAuthorId: user.id, // ВСЕГДА сохраняем реального автора!
      isAnonymous: Boolean(isAnonymous),
      ipAddress,
      userAgent,
      browserFingerprint,
      sessionId
    };

    const comment = db.createComment(commentData);

    // Возвращаем публичную версию комментария
    const publicComment = {
      id: comment.id,
      content: comment.content,
      author: comment.author,
      authorId: comment.authorId,
      isAnonymous: comment.isAnonymous,
      createdAt: comment.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Комментарий успешно добавлен',
      comment: publicComment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания комментария'
    });
  }
});

module.exports = router; 