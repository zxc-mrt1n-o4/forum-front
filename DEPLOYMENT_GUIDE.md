# 🚀 Railway Deployment Guide

This guide will help you deploy both the frontend (Next.js) and backend (Node.js/Express) to Railway.

## 📋 Prerequisites

1. Railway account: [Sign up at railway.app](https://railway.app)
2. GitHub repository with your code
3. Railway CLI (optional): `npm install -g @railway/cli`

## 🏗️ Project Structure

```
cms-blog/
├── frontend (Next.js) - Root directory
├── backend-server/ (Node.js/Express)
├── Dockerfile (for frontend)
├── backend-server/Dockerfile (for backend)
└── railway.json (Railway config)
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend Server

1. **Create New Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Backend Service**
   - Click "Add Service" → "GitHub Repo"
   - Set **Root Directory**: `backend-server`
   - Railway will auto-detect the Dockerfile

3. **Set Environment Variables for Backend**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FRONTEND_URL=https://your-frontend-domain.railway.app
   DATABASE_PATH=/app/data/forum.db
   BCRYPT_ROUNDS=12
   SESSION_SECRET=your-session-secret-change-this-in-production
   ```

4. **Configure Custom Domain (Optional)**
   - Go to Settings → Domains
   - Generate Railway domain or add custom domain
   - Note down the backend URL (e.g., `https://your-backend.railway.app`)

### Step 2: Deploy Frontend

1. **Add Frontend Service**
   - In the same Railway project, click "Add Service"
   - Select "GitHub Repo" again
   - Set **Root Directory**: `.` (root)
   - Railway will auto-detect the Dockerfile

2. **Set Environment Variables for Frontend**
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
   FRONTEND_URL=https://your-frontend.railway.app
   NODE_ENV=production
   ```

3. **Configure Custom Domain (Optional)**
   - Go to Settings → Domains
   - Generate Railway domain or add custom domain

### Step 3: Update CORS Settings

After deployment, update your backend's CORS settings:

1. Go to your backend service in Railway
2. Update the `FRONTEND_URL` environment variable with your actual frontend URL
3. Redeploy the backend service

## 🔧 Configuration Files

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS base
# ... (already created)
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
# ... (already created)
```

### Railway Configuration (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🔐 Environment Variables Setup

### Backend Environment Variables
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-frontend-domain.railway.app
DATABASE_PATH=/app/data/forum.db
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS_AUTH=200
RATE_LIMIT_MAX_REQUESTS_ANON=30
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.railway.app
FRONTEND_URL=https://your-frontend-domain.railway.app
NODE_ENV=production
```

## 🗄️ Database Setup

The SQLite database will be automatically created when the backend starts. The database file will be stored in `/app/data/forum.db` inside the container.

**Important**: Railway containers are ephemeral, so the database will be reset on each deployment. For production use, consider:
1. Using Railway's PostgreSQL addon
2. Implementing database migrations
3. Using persistent volumes (if available)

## 🔧 Post-Deployment Steps

1. **Create Admin User**
   - SSH into your backend container or use Railway's console
   - Run: `node scripts/create-admin.js`
   - Or use the registration endpoint and manually set `isAdmin = 1` in the database

2. **Test the Application**
   - Visit your frontend URL
   - Test user registration/login
   - Test admin panel access
   - Verify all API endpoints work

3. **Monitor Logs**
   - Check Railway logs for any errors
   - Monitor performance and errors

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend matches your actual frontend domain
   - Check that both services are running

2. **Database Issues**
   - Check if the `/app/data` directory is writable
   - Verify SQLite initialization logs

3. **Environment Variables**
   - Ensure all required environment variables are set
   - Check for typos in variable names

4. **Build Failures**
   - Check Railway build logs
   - Ensure all dependencies are in `package.json`
   - Verify Dockerfile syntax

### Debug Commands

```bash
# Check if backend is running
curl https://your-backend.railway.app/health

# Check environment variables (in Railway console)
env | grep -E "(NODE_ENV|PORT|JWT_SECRET)"

# Check database
ls -la /app/data/
```

## 🔄 Updating Your Deployment

1. Push changes to your GitHub repository
2. Railway will automatically redeploy both services
3. Monitor the deployment logs
4. Test the updated application

## 📊 Monitoring

- Use Railway's built-in metrics
- Monitor application logs
- Set up error tracking (optional)
- Monitor database size and performance

## 🛡️ Security Considerations

1. **Environment Variables**: Never commit real secrets to Git
2. **JWT Secret**: Use a strong, random JWT secret
3. **CORS**: Ensure CORS is properly configured
4. **Rate Limiting**: Monitor for abuse and adjust limits
5. **Database**: Consider data backup strategies

## 💡 Tips

1. **Free Tier**: Railway has usage limits on the free tier
2. **Logs**: Regularly check logs for errors
3. **Performance**: Monitor response times and optimize if needed
4. **Backups**: Implement database backup strategy for production
5. **SSL**: Railway provides SSL certificates automatically

## 🆘 Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub Issues: Create issues in your repository

---

✅ **Your CMS Blog is now ready for Railway deployment!** 