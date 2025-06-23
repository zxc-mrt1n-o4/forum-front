# 🔒 Настройка двухсерверной системы форума

## 🏗️ Архитектура системы

### 📱 **Основной сервер (порт 3000)** - Публичный форум
- **Назначение**: Регистрация/авторизация обычных пользователей, создание постов, чтение контента
- **База данных**: `cms-blog` (публичная)
- **Функции**:
  - Регистрация и авторизация пользователей
  - Создание постов (анонимно и с именем)
  - Чтение и комментирование постов
  - Пользовательские профили

### 🔒 **Админ-сервер (порт 3001)** - Управление и шпионаж
- **Назначение**: Модерация, управление пользователями, деанонимизация
- **База данных**: `cms-blog-admin` (защищенная)
- **Функции**:
  - Модерация постов и комментариев
  - Управление аккаунтами пользователей
  - **🕵️ Деанонимизация** - раскрытие создателей анонимных постов
  - Инструменты слежения и аналитики
  - Бан/разбан пользователей

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Основной сервер
npm install

# Админ-сервер
cd admin-server
npm install
```

### 2. Настройка переменных окружения

#### Основной сервер (.env в корне)
```env
MONGODB_URI=mongodb://localhost:27017/cms-blog
JWT_SECRET=your-main-jwt-secret-here
NODE_ENV=development
```

#### Админ-сервер (admin-server/.env)
```env
# Основные настройки
NODE_ENV=development
PORT=3001
HOST=127.0.0.1

# База данных админа (отдельная!)
ADMIN_MONGODB_URI=mongodb://localhost:27017/cms-blog-admin

# База данных основного сервера (для синхронизации)
PUBLIC_MONGODB_URI=mongodb://localhost:27017/cms-blog

# Безопасность
JWT_SECRET=your-super-secure-admin-jwt-secret
ENCRYPTION_KEY=32-character-encryption-key-here
HASH_SALT_ROUNDS=12

# IP фильтрация (через запятую)
ALLOWED_IPS=127.0.0.1,::1,192.168.1.0/24

# Аварийные коды
EMERGENCY_LOCKDOWN_CODE=LOCKDOWN123
EMERGENCY_ACCESS_CODE=EMERGENCY456

# Логирование
LOG_LEVEL=info
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Сессии
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=3600000
```

### 3. Создание первого админ-пользователя

```bash
cd admin-server
npm run create-admin
```

Выберите:
- **Имя пользователя**: admin
- **Email**: admin@localhost.com
- **Пароль**: минимум 8 символов
- **Роль**: 1 (superadmin) для полного доступа

### 4. Запуск серверов

#### Терминал 1 - Основной сервер
```bash
npm run dev
# Сервер запустится на http://localhost:3000
```

#### Терминал 2 - Админ-сервер
```bash
cd admin-server
npm run dev
# Админ-сервер запустится на http://localhost:3001
```

## 🔐 Первый вход в админ-панель

### 1. Авторизация
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

Ответ:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "username": "admin",
      "role": "superadmin",
      "permissions": ["VIEW_POSTS", "MODERATE_POSTS", ...]
    },
    "expiresIn": "1h"
  }
}
```

### 2. Использование токена
Добавляйте заголовок во все запросы:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🕵️ Основные возможности админ-панели

### 📊 Дашборд
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/dashboard
```

### 👥 Управление пользователями
```bash
# Список пользователей
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/admin/users?page=1&limit=20"

# Детали пользователя
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/users/USER_ID

# Бан пользователя
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "banned", "reason": "Spam"}' \
  http://localhost:3001/api/admin/users/USER_ID/moderation
```

### 🕵️ Деанонимизация постов
```bash
# Список анонимных постов
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/admin/anonymous-posts?onlyUnresolved=true"

# Попытка деанонимизации
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/posts/POST_ID/deanonymize

# Подтверждение авторства
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "username": "username"}' \
  http://localhost:3001/api/admin/posts/POST_ID/confirm-author
```

### 🔄 Синхронизация данных
```bash
# Статус синхронизации
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/sync/sync-status

# Синхронизация пользователей
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}' \
  http://localhost:3001/api/sync/sync-users

# Синхронизация постов
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "includeMetadata": true}' \
  http://localhost:3001/api/sync/sync-posts
```

## 🛡️ Система безопасности

### Уровни доступа
1. **superadmin** - Полный доступ ко всему
2. **admin** - Стандартные админские права без системного управления
3. **moderator** - Только модерация контента

### Права доступа
- `VIEW_POSTS` - Просмотр постов
- `MODERATE_POSTS` - Модерация постов
- `DELETE_POSTS` - Удаление постов
- `VIEW_USERS` - Просмотр пользователей
- `MANAGE_USERS` - Управление пользователями
- `BAN_USERS` - Бан пользователей
- `DEANONYMIZE_POSTS` - **🕵️ Деанонимизация постов**
- `VIEW_ANALYTICS` - Просмотр аналитики
- `SYSTEM_ADMIN` - Системное администрирование

### Защитные механизмы
- ✅ JWT токены с коротким временем жизни (1 час)
- ✅ IP фильтрация и автоблокировка
- ✅ Rate limiting (50 запросов/15 минут)
- ✅ AES-256 шифрование чувствительных данных
- ✅ Детальное логирование всех действий
- ✅ 2FA готовность
- ✅ Аварийные процедуры

## 🔍 Как работает деанонимизация

### Алгоритм деанонимизации
1. **IP адрес** - основной идентификатор (85% уверенности)
2. **User Agent** - дополнительный фактор (60% уверенности)
3. **Временные паттерны** - время активности (30% уверенности)
4. **Поведенческие паттерны** - стиль письма, скорость печати

### Пример деанонимизации
```json
{
  "success": true,
  "suspects": [
    {
      "user": {
        "originalUserId": "user123",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "confidence": 85,
      "reason": "IP match"
    }
  ],
  "confidence": 85
}
```

## 📈 Мониторинг и логи

### Просмотр логов
```bash
# Логи админ-действий
tail -f admin-server/logs/admin.log

# Логи безопасности
tail -f admin-server/logs/security.log

# Логи ошибок
tail -f admin-server/logs/error.log
```

### Ключевые метрики
- Количество пользователей и их риск-скоры
- Анонимные посты и процент деанонимизации
- Активность модерации
- Безопасность: заблокированные IP, неудачные попытки входа

## 🚨 Аварийные процедуры

### Экстренная блокировка
```bash
# Через переменную окружения
export EMERGENCY_LOCKDOWN=true

# Или через API с аварийным кодом
curl -X POST -H "Content-Type: application/json" \
  -d '{"emergencyCode": "LOCKDOWN123"}' \
  http://localhost:3001/api/emergency/lockdown
```

### Восстановление доступа
```bash
# Если забыли пароль - создайте нового админа
cd admin-server
npm run create-admin
```

## 🔧 Продвинутые настройки

### Автоматическая синхронизация
Добавьте в cron для автоматической синхронизации каждый час:
```bash
0 * * * * curl -X POST -H "Authorization: Bearer TOKEN" http://localhost:3001/api/sync/auto-sync
```

### Настройка 2FA
```bash
# Включение 2FA
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/enable-2fa
```

### Очистка старых данных
```bash
# Очистка данных старше 90 дней (dry run)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"olderThanDays": 90, "dryRun": true}' \
  http://localhost:3001/api/sync/cleanup
```

## 🎯 Заключение

Теперь у вас есть **полноценная двухсерверная система** с разделением ответственности:

- **Основной сервер** - для обычных пользователей
- **Админ-сервер** - для управления и **шпионажа**

Ключевые возможности:
- ✅ **Деанонимизация постов** по IP, User Agent и поведенческим паттернам
- ✅ **Модерация контента** с автоматическим анализом токсичности
- ✅ **Управление пользователями** с риск-скорингом
- ✅ **Военный уровень безопасности** с шифрованием и логированием
- ✅ **Синхронизация данных** между серверами
- ✅ **Полная независимость** от внешних сервисов

**🕵️ Теперь вы можете раскрывать анонимных авторов постов!**

# 🕵️ Админ-сервер: Полное руководство по установке и использованию

## 🎯 Обзор системы

Этот админ-сервер представляет собой **отдельную защищенную систему** для управления форумом и **точной деанонимизации** анонимных постов. Система работает независимо от основного сервера и имеет собственную базу данных.

### 🔍 Ключевые возможности деанонимизации:

1. **100% точная деанонимизация** - система сохраняет реального автора каждого анонимного поста
2. **Скрытое отслеживание** - пользователи не знают, что их данные сохраняются
3. **Множественные методы анализа** - IP, fingerprint браузера, сессии, поведенческие паттерны
4. **Корреляционный анализ** - для случаев без прямых данных
5. **Массовая деанонимизация** - обработка множества постов одновременно

## 🛡️ Архитектура безопасности

### Двухсерверная архитектура:
- **Основной сервер (порт 3000)** - публичный форум с пользователями
- **Админ-сервер (порт 3001)** - закрытая система управления и слежки

### Базы данных:
- **cms-blog** - основная БД с публичными данными
- **cms-blog-admin** - отдельная БД для админ-данных и деанонимизации

## 📋 Установка

### 1. Клонирование и установка зависимостей

```bash
cd admin-server
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env`:

```env
# 🔐 БЕЗОПАСНОСТЬ
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
ADMIN_IP_WHITELIST=127.0.0.1,192.168.1.0/24
EMERGENCY_CODE=your-emergency-access-code

# 🗄️ БАЗЫ ДАННЫХ
ADMIN_DB_URI=mongodb://localhost:27017/cms-blog-admin
MAIN_DB_URI=mongodb://localhost:27017/cms-blog

# 🌐 СЕРВЕР
PORT=3001
NODE_ENV=production

# 🔒 ДОПОЛНИТЕЛЬНАЯ БЕЗОПАСНОСТЬ
SESSION_SECRET=your-session-secret
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=50
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=1800000

# 📧 2FA (опционально)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Создание первого админа

```bash
node scripts/create-admin.js
```

Следуйте инструкциям для создания первого администратора.

### 4. Запуск сервера

```bash
# Разработка
npm run dev

# Продакшн
npm start
```

## 🕵️ Система деанонимизации

### Как работает точная деанонимизация:

#### 1. **Скрытое сохранение данных**
При создании анонимного поста система автоматически сохраняет:
```javascript
{
  author: "Аноним",           // Публично видимое имя
  authorId: null,             // Скрыто от публики
  realAuthorId: "user123",    // 🕵️ СКРЫТОЕ ПОЛЕ - реальный автор
  ipAddress: "192.168.1.100", // IP адрес
  userAgent: "Chrome/120...", // Браузер
  browserFingerprint: "abc123", // Уникальный отпечаток
  sessionId: "sess_xyz789"    // ID сессии
}
```

#### 2. **Методы деанонимизации**

**A. Точная деанонимизация (100% уверенность):**
- Прямое сохранение `realAuthorId` при создании поста
- Работает для всех пользователей с аккаунтами

**B. Корреляционный анализ (70-95% уверенность):**
- Анализ по IP адресу (85% уверенность)
- Сопоставление fingerprint браузера (70% уверенность)  
- Анализ сессий (95% уверенность)
- Поведенческие паттерны (30-60% уверенность)

#### 3. **API для деанонимизации**

```bash
# Деанонимизация одного поста
GET /api/admin/posts/{postId}/deanonymize

# Массовая деанонимизация
POST /api/admin/posts/bulk-deanonymize
{
  "postIds": ["id1", "id2", "id3"],
  "minConfidence": 70
}

# Поиск по методам
GET /api/admin/posts?anonymous=true&withRealAuthor=true
```

### 🎯 Примеры использования API

#### Деанонимизация поста:
```bash
curl -X GET "http://localhost:3001/api/admin/posts/64a1b2c3d4e5f6789/deanonymize" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ответ:**
```json
{
  "success": true,
  "deanonymization": {
    "postId": "64a1b2c3d4e5f6789",
    "isAnonymous": true,
    "publicAuthor": "Аноним",
    "realAuthor": {
      "id": "64a1b2c3d4e5f6123",
      "username": "student_ivan",
      "email": "ivan@school.ru",
      "accountCreated": "2024-01-15T10:30:00Z"
    },
    "confidence": 100,
    "methods": ["session_tracking"],
    "metadata": {
      "ipAddress": "192.168.1.100",
      "userAgent": "Chrome/120.0.0.0",
      "browserFingerprint": "abc123def456",
      "sessionId": "sess_xyz789",
      "createdAt": "2024-01-20T14:45:00Z"
    }
  }
}
```

#### Массовая деанонимизация:
```bash
curl -X POST "http://localhost:3001/api/admin/posts/bulk-deanonymize" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postIds": ["id1", "id2", "id3"],
    "minConfidence": 80
  }'
```

## 📊 Мониторинг и статистика

### Тестирование системы деанонимизации:
```bash
node scripts/test-deanonymization.js
```

**Пример вывода:**
```
🔍 Тестирование системы деанонимизации...

📊 СТАТИСТИКА АНОНИМНЫХ ПОСТОВ:
   Всего анонимных постов: 156
   С известным автором: 142 (91%)
   Уже раскрытых: 23

🎯 ПРИМЕРЫ ДЕАНОНИМИЗАЦИИ:
   1. Пост: "Правда о нашем директоре..."
      Публичный автор: Аноним
      Реальный автор: student_alex
      Email: alex@school.ru
      IP: 192.168.1.50
      Уверенность: 100% (точные данные)

📈 ОБЩАЯ ЭФФЕКТИВНОСТЬ СИСТЕМЫ:
   Процент деанонимизации: 91%
   🏆 ОТЛИЧНО! Система работает очень эффективно
```

## 🔒 Безопасность и защита

### Встроенные меры безопасности:

1. **Шифрование данных** - AES-256 для чувствительной информации
2. **JWT токены** - короткое время жизни (1 час)
3. **IP фильтрация** - автоблокировка после неудачных попыток
4. **Rate limiting** - максимум 50 запросов за 15 минут
5. **Детальное логирование** - все действия записываются
6. **2FA готовность** - поддержка двухфакторной аутентификации

### Логи безопасности:
```bash
# Просмотр логов деанонимизации
tail -f logs/security.log | grep deanonymization

# Просмотр попыток входа
tail -f logs/admin.log | grep login_attempt
```

## 🚨 Процедуры экстренного доступа

### В случае компрометации:

1. **Экстренная блокировка:**
```bash
# Заблокировать все сессии
curl -X POST "http://localhost:3001/api/auth/emergency-lockdown" \
  -H "Emergency-Code: YOUR_EMERGENCY_CODE"
```

2. **Смена ключей шифрования:**
```bash
# Генерация новых ключей
node scripts/regenerate-keys.js
```

3. **Аудит безопасности:**
```bash
# Проверка подозрительной активности
node scripts/security-audit.js
```

## 📈 Расширенные возможности

### Поведенческий анализ:
- Временные паттерны постинга
- Стилистический анализ текста
- Корреляция с активностью в других частях форума
- Анализ социальных связей

### Интеграция с другими системами:
- Экспорт данных для внешнего анализа
- API для интеграции с системами мониторинга
- Webhook'и для уведомлений о подозрительной активности

## ⚠️ Важные замечания

1. **Законность**: Убедитесь, что использование системы соответствует местному законодательству
2. **Этика**: Система предназначена для образовательных целей и защиты от злоупотреблений
3. **Конфиденциальность**: Доступ к деанонимизации должен быть строго ограничен
4. **Резервное копирование**: Регулярно создавайте бэкапы базы данных
5. **Обновления безопасности**: Следите за обновлениями зависимостей

## 🔧 Устранение неполадок

### Частые проблемы:

**Проблема**: Не работает деанонимизация
```bash
# Проверка синхронизации
curl -X GET "http://localhost:3001/api/sync/sync-status"

# Принудительная синхронизация
curl -X POST "http://localhost:3001/api/sync/sync-all"
```

**Проблема**: Высокая нагрузка на сервер
```bash
# Проверка активных сессий
curl -X GET "http://localhost:3001/api/admin/active-sessions"

# Очистка старых логов
node scripts/cleanup-logs.js
```

## 📞 Поддержка

Для получения помощи:
1. Проверьте логи в папке `logs/`
2. Запустите диагностические скрипты
3. Проверьте документацию API
4. Создайте issue в репозитории проекта

---

**⚠️ ВНИМАНИЕ**: Эта система предназначена исключительно для образовательных целей и демонстрации технологий. Использование в реальных проектах требует тщательного анализа правовых и этических аспектов. 