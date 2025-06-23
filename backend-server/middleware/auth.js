const jwt = require('jsonwebtoken');
const db = require('../database/sqlite');

// Middleware для проверки JWT токена
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Токен доступа отсутствует' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.getUserById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Недействительный токен' 
      });
    }

    // Check if user is banned
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: 'Ваш аккаунт временно заблокирован',
        banned: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Недействительный токен' 
    });
  }
};

// Middleware для проверки роли администратора
const requireAdmin = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Требуются права администратора' 
    });
  }
};

// Middleware для проверки верификации пользователя
const requireVerified = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Требуется аутентификация' 
    });
  }

  if (req.user && req.user.isVerified) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Ваш аккаунт ожидает подтверждения администратора. Вы можете читать посты, но не можете создавать посты или комментарии.',
      needsVerification: true
    });
  }
};

// Опциональная аутентификация (для анонимных постов)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.getUserById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Игнорируем ошибки токена для опциональной аутентификации
    next();
  }
};

// Простая функция аутентификации для экспорта по умолчанию
const auth = authenticate;

module.exports = auth;
module.exports.authenticate = authenticate;
module.exports.requireAdmin = requireAdmin;
module.exports.requireVerified = requireVerified;
module.exports.optionalAuth = optionalAuth; 