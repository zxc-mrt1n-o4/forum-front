require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware для безопасности
app.use(helmet());

// CORS настройки
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'https://localhost:3000'
].filter(Boolean); // Remove undefined values

// Add Railway domains if they exist
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Railway pattern
    if (allowedOrigins.includes(origin) || 
        origin.includes('.railway.app') || 
        origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));

// Advanced Rate limiting with different rules for authenticated/anonymous users
const createRateLimiter = () => {
  const anonymousStore = new Map();
  
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: (req) => {
      // Check if user is authenticated
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      
      if (token) {
        // Authenticated users get higher limits
        return 200; // 200 requests per minute for authenticated users
      } else {
        // Anonymous users get lower limits
        return 30; // 30 requests per minute for anonymous users
      }
    },
    message: (req) => {
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      
      if (token) {
        return {
          success: false,
          message: 'Слишком много запросов, попробуйте через минуту',
          isAuthenticated: true,
          cooldownMinutes: 1
        };
      } else {
        return {
          success: false,
          message: 'Слишком много запросов с этого IP, попробуйте позже',
          isAuthenticated: false,
          cooldownMinutes: 1,
          hint: 'Войдите в аккаунт для увеличения лимита запросов'
        };
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator to separate authenticated and anonymous users
    keyGenerator: (req) => {
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      const ip = req.ip || req.connection.remoteAddress;
      
      if (token) {
        return `auth_${token.substring(0, 10)}`; // Use part of token for authenticated users
      } else {
        return `anon_${ip}`; // Use IP for anonymous users
      }
    },
    // Skip successful requests for certain endpoints to reduce counting
    skip: (req) => {
      // Don't count health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

app.use(createRateLimiter());

// Логирование
app.use(morgan('tiny'));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy для получения реального IP
app.set('trust proxy', 1);

// Инициализация SQLite базы данных
const db = require('./database/sqlite');

// Подключение роутов
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoints (both paths for compatibility)
const healthResponse = {
  success: true,
  message: 'Backend server is running',
  database: 'SQLite',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
};

app.get('/health', (req, res) => {
  res.json({
    ...healthResponse,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ...healthResponse,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Database: SQLite`);
  console.log('🔒 Deanonymization system active');
  console.log('⚡ Smart rate limiting active (1min cooldown for anonymous users)');
  console.log(`💻 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  db.close();
  process.exit(0);
}); 