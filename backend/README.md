# Forum Backend API

Backend server for the Anonymous Russian Forum built with Node.js, Express.js, and SQLite.

## 🚀 Features

- **User Authentication** - JWT-based authentication with registration and login
- **User Verification System** - Admin approval required for new accounts
- **Anonymous Posting** - Support for anonymous posts with deanonymization tracking
- **Like System** - Toggle likes on posts with proper authentication
- **Admin Panel API** - Complete admin management endpoints
- **Rate Limiting** - Sophisticated rate limiting for different user types
- **SQLite Database** - Lightweight database with better-sqlite3
- **Security** - CORS, helmet, compression, and security middleware

## 🛠️ Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT, bcrypt
- **Security**: helmet, cors, express-rate-limit
- **Validation**: express-validator

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/zxc-mrt1n-o4/forum-back.git
cd forum-back
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required environment variables:
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

4. **Initialize database**
```bash
npm run init-db
```

5. **Create admin user**
```bash
npm run create-admin
```

6. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user info

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts/:id/like` - Toggle like on post

### Admin (Protected)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/pending` - Get unverified users
- `POST /api/admin/users/:id/verify` - Verify user
- `POST /api/admin/users/:id/unverify` - Unverify user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics

## 🚀 Railway Deployment

This backend is configured for Railway deployment with:

1. **Dockerfile** - Multi-stage build for production
2. **Environment Variables** - Automatic configuration
3. **Database** - SQLite with persistent volume
4. **CORS** - Configured for Railway domains

### Deploy to Railway

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select this backend repository

2. **Environment Variables**
   Railway will auto-generate most variables. Only set:
   - `JWT_SECRET` - Your secure JWT secret

3. **Deploy**
   - Railway will automatically build and deploy
   - Database will be initialized on first run
   - Admin user will be created automatically

## 📁 Project Structure

```
├── database/
│   ├── sqlite.js          # Database connection and methods
│   └── blog.db            # SQLite database file
├── middleware/
│   └── auth.js            # Authentication middleware
├── models/
│   ├── Post.js            # Post model
│   └── User.js            # User model
├── routes/
│   ├── admin.js           # Admin API routes
│   ├── auth.js            # Authentication routes
│   └── posts.js           # Posts API routes
├── .env.example           # Environment variables template
├── Dockerfile             # Docker configuration
├── package.json           # Dependencies and scripts
└── server.js              # Main server file
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Different limits for auth/unauth users
- **CORS Protection** - Configured for specific origins
- **Input Validation** - express-validator for all inputs
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - helmet middleware

## 🎯 Admin Features

- **User Management** - View, verify, delete users
- **Post Moderation** - View all posts with metadata
- **Deanonymization** - Track real authors of anonymous posts
- **System Statistics** - User and post analytics
- **Security Logging** - Track authentication attempts

## ⚙️ Configuration

### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-jwt-key-here

# Database
DATABASE_PATH=./database/blog.db

# CORS
FRONTEND_URL=https://your-frontend-domain.railway.app
```

### Rate Limiting
- Anonymous users: 30 requests/minute
- Authenticated users: 200 requests/minute
- Authentication endpoints: 10 requests/minute

## 🚨 Important Notes

- **Database**: SQLite file persists in Railway volumes
- **Admin Creation**: First admin created automatically
- **Security**: Change JWT_SECRET in production
- **CORS**: Update frontend URL for production
- **Logs**: Check Railway logs for debugging

## 📞 Support

For technical support or questions about the API, refer to the main project documentation or contact the development team.

---

**Security Notice**: This API handles user authentication and personal data. Ensure all security best practices are followed in production environments. 