# Railway Deployment Guide

This guide will help you deploy both the frontend and backend to Railway.

## 📋 Prerequisites

- Railway account (https://railway.app)
- GitHub account with both repositories
- Basic knowledge of environment variables

## 🚀 Deployment Steps

### Step 1: Deploy Backend First

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Connect Backend Repository**
   - Select `zxc-mrt1n-o4/forum-back`
   - Railway will automatically detect the Dockerfile
   - Click "Deploy"

3. **Set Environment Variables**
   - Go to your backend service settings
   - Add the following variable:
     - `JWT_SECRET` = `cms-blog-super-secret-jwt-key-2025-production-railway-deployment-secure`
   - Railway will auto-generate:
     - `PORT` (automatically set)
     - `RAILWAY_PUBLIC_DOMAIN` (your backend URL)

4. **Wait for Deployment**
   - Backend will build and deploy automatically
   - Note your backend URL (e.g., `https://forum-back-production-xxxx.up.railway.app`)

### Step 2: Deploy Frontend

1. **Create New Service**
   - In Railway dashboard, click "New Service"
   - Select "GitHub Repo"
   - Choose `zxc-mrt1n-o4/forum-front`

2. **Set Environment Variables**
   - Go to frontend service settings
   - Add the following variable:
     - `NEXT_PUBLIC_BACKEND_URL` = `https://your-backend-domain.railway.app`
     - Replace with your actual backend URL from Step 1

3. **Deploy**
   - Railway will automatically build and deploy
   - Frontend will be available at your generated Railway URL

## 🔧 Configuration Details

### Backend Configuration
```env
# Required (set manually)
JWT_SECRET=cms-blog-super-secret-jwt-key-2025-production-railway-deployment-secure

# Auto-generated by Railway
PORT=5000
RAILWAY_PUBLIC_DOMAIN=your-backend-domain.railway.app
NODE_ENV=production
```

### Frontend Configuration
```env
# Required (set manually)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.railway.app

# Auto-generated by Railway
RAILWAY_PUBLIC_DOMAIN=your-frontend-domain.railway.app
NODE_ENV=production
```

## ✅ Verification

### Backend Health Check
Visit: `https://your-backend-domain.railway.app/health`

Expected response:
```json
{
  "success": true,
  "message": "Backend server is running",
  "database": "SQLite",
  "timestamp": "2025-01-23T...",
  "uptime": 123.456
}
```

### Frontend Check
Visit: `https://your-frontend-domain.railway.app`

You should see the forum homepage with:
- Dark gray theme
- Russian interface
- "Регистрация" and "Вход" buttons
- Post list (may be empty initially)

## 🔐 Admin Setup

1. **Access Admin Panel**
   - Go to `https://your-frontend-domain.railway.app/admin-access`
   - Default admin credentials are created automatically

2. **Create Admin User**
   - The backend automatically creates an admin user on first run
   - Check Railway logs for admin credentials
   - Or create manually via the admin creation script

## 🚨 Important Notes

### Database
- SQLite database is automatically created
- Data persists in Railway volumes
- No external database setup required

### CORS Configuration
- Backend is configured to accept requests from Railway domains
- CORS automatically allows `*.railway.app` domains
- No additional CORS setup needed

### Security
- JWT tokens are properly configured
- Rate limiting is active (30 req/min for anonymous, 200 req/min for authenticated)
- All passwords are hashed with bcrypt

### Environment Variables
- Only `JWT_SECRET` and `NEXT_PUBLIC_BACKEND_URL` need manual setup
- All other variables are auto-generated by Railway
- Never commit `.env` files to git

## 🔧 Troubleshooting

### Backend Issues
- Check Railway logs for database initialization
- Verify JWT_SECRET is set correctly
- Ensure health endpoint returns 200 status

### Frontend Issues
- Verify NEXT_PUBLIC_BACKEND_URL points to correct backend
- Check browser console for CORS errors
- Ensure backend is running before testing frontend

### Connection Issues
- Backend must be deployed first
- Frontend needs correct backend URL
- Both services should be in same Railway project for easier management

## 📞 Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify environment variables
3. Test backend health endpoint
4. Check browser console for errors

---

**Success!** Your forum should now be fully deployed and functional on Railway! 🎉 