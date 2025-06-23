# CMS Blog Setup Guide

## Current Architecture

This project uses a **two-server architecture**:

1. **Frontend Server** (Next.js) - Port 3000
2. **Backend Server** (Express.js + SQLite) - Port 5000

## Starting the Application

### 1. Start Backend Server
```bash
cd backend-server
npm start
```
The backend will run on `http://localhost:5000`

### 2. Start Frontend Server
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`

## Features

### ✅ Working Features
- **User Authentication** (Register/Login)
- **Post Creation** (Anonymous & Named posts)
- **Post Viewing** with search and pagination
- **Like System** for posts
- **Dark Theme UI** with Russian interface
- **Admin Panel** (for admin users)

### 🔄 In Development
- **Comments System** (UI ready, backend needs implementation)
- **Admin Surveillance Tools** (deanonymization features)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like a post

### Admin (Future)
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/posts/:id` - Delete post
- `GET /api/admin/posts/:id/deanonymize` - Reveal anonymous post author

## Database

Uses **SQLite** database with the following tables:
- `users` - User accounts
- `posts` - Forum posts with deanonymization support
- `sessions` - User sessions

### Key Features:
- **Real Author Tracking**: Anonymous posts still save the real author ID
- **Metadata Collection**: IP, User Agent, Browser Fingerprint, Session ID
- **Admin Surveillance**: Ability to reveal anonymous post creators

## Security Features

- JWT authentication with 1-hour expiration
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Request logging
- IP tracking for deanonymization

## File Structure

```
cms blog/
├── app/                    # Next.js pages
├── components/             # React components
├── lib/                    # API client and utilities
├── backend-server/         # Express.js backend
│   ├── database/          # SQLite database setup
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── models/            # Database models
│   └── server.js          # Main server file
└── README.md
```

## Environment Variables

Backend (`.env` in `backend-server/`):
```
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Backend Not Starting
1. Check if port 5000 is available
2. Ensure all dependencies are installed: `cd backend-server && npm install`
3. Check `.env` file exists in `backend-server/`

### Frontend API Errors
1. Ensure backend server is running on port 5000
2. Check browser console for detailed error messages
3. Verify API endpoints are responding: `curl http://localhost:5000/health`

### Database Issues
1. Database is created automatically on first run
2. Check `backend-server/database/cms_blog.db` exists
3. Run `node backend-server/test-db.js` to test database connection

## Development Notes

- The system is designed for **full data control** and **user surveillance**
- Anonymous posts are **not truly anonymous** - real authors are always tracked
- Admin users can **deanonymize** any post to reveal the real author
- All user activity is logged for analysis 