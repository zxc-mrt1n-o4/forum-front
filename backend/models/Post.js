const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  author: {
    type: String,
    required: function() {
      return !this.isAnonymous;
    }
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isAnonymous;
    }
  },
  // КРИТИЧЕСКИ ВАЖНО: Реальный автор анонимного поста (скрытое поле)
  realAuthorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false // Не показывать в обычных запросах
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Метаданные для деанонимизации
  metadata: {
    ipAddress: {
      type: String,
      select: false // Скрыто от публичных запросов
    },
    userAgent: {
      type: String,
      select: false
    },
    browserFingerprint: {
      type: String,
      select: false
    },
    sessionId: {
      type: String,
      select: false
    },
    timestamp: {
      type: Date,
      default: Date.now,
      select: false
    }
  },
  // Анализ подозрительности
  suspiciousScore: {
    type: Number,
    default: 0,
    select: false
  },
  tags: [String],
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Middleware для автоматического сохранения realAuthorId
postSchema.pre('save', function(next) {
  // Если пост анонимный, но realAuthorId не установлен, устанавливаем его
  if (this.isAnonymous && this.authorId && !this.realAuthorId) {
    this.realAuthorId = this.authorId;
  }
  
  // Если пост анонимный, убираем authorId из публичных данных
  if (this.isAnonymous) {
    this.authorId = undefined;
    this.author = 'Аноним';
  }
  
  next();
});

// Метод для деанонимизации (только для админов)
postSchema.methods.deanonymize = function() {
  return this.populate('realAuthorId', 'username email');
};

// Статический метод для поиска постов с возможностью деанонимизации
postSchema.statics.findWithDeanonymization = function(query = {}) {
  return this.find(query).select('+realAuthorId +metadata +suspiciousScore');
};

// Метод для анализа подозрительности
postSchema.methods.analyzeSuspiciousness = function() {
  let score = 0;
  
  // Проверка на спам-слова
  const spamWords = ['спам', 'реклама', 'купить', 'продать', 'заработок'];
  const content = (this.title + ' ' + this.content).toLowerCase();
  spamWords.forEach(word => {
    if (content.includes(word)) score += 10;
  });
  
  // Проверка длины контента
  if (this.content.length < 50) score += 5;
  if (this.content.length > 3000) score += 15;
  
  // Проверка на анонимность
  if (this.isAnonymous) score += 5;
  
  this.suspiciousScore = score;
  return score;
};

module.exports = mongoose.model('Post', postSchema); 