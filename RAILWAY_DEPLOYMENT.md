# Railway Deployment Guide

This guide will help you deploy the CMS Blog application to Railway with both frontend and backend services.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Railway CLI** (optional): Install with `npm install -g @railway/cli`

## Deployment Methods

### Method 1: Railway Dashboard (Recommended)

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Services**
   - Railway will automatically detect the `railway.json` configuration
   - Two services will be created: `frontend` and `backend`

3. **Set Environment Variables**
   - Go to your project dashboard
   - Click on the **backend** service
   - Go to "Variables" tab and add:
     ```
     JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
     ```

4. **Deploy**
   - Both services will deploy automatically
   - Wait for both deployments to complete

### Method 2: Railway CLI

1. **Install and Login**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**
   ```bash
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Environment Variables

### Required Variables

| Variable | Service | Description | Example |
|----------|---------|-------------|---------|
| `JWT_SECRET` | Backend | Secret key for JWT tokens | `your-super-secret-jwt-key-here-make-it-long-and-random` |

### Auto-Generated Variables

Railway will automatically set these variables:

| Variable | Service | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | Backend URL (auto-generated) |
| `CORS_ORIGIN` | Backend | Frontend URL (auto-generated) |
| `RAILWAY_PUBLIC_DOMAIN` | Both | Public domain for each service |
| `PORT` | Backend | Port number (5000) |
| `NODE_ENV` | Both | Environment (production) |

## Service Configuration

### Frontend Service
- **Source**: Root directory (`.`)
- **Build**: Next.js build process
- **Start**: `npm start`
- **Port**: Auto-assigned by Railway
- **Domain**: Auto-generated Railway domain

### Backend Service
- **Source**: `./backend-server` directory
- **Build**: Node.js with npm install
- **Start**: `npm start`
- **Port**: 5000 (internal)
- **Domain**: Auto-generated Railway domain

## Database

The SQLite database will be stored in the backend service's filesystem:
- **Path**: `/app/database.db`
- **Persistence**: Data persists across deployments
- **Backup**: Consider setting up periodic backups

## Custom Domains (Optional)

1. **Go to Service Settings**
   - Click on frontend service
   - Go to "Settings" → "Domains"

2. **Add Custom Domain**
   - Click "Add Domain"
   - Enter your domain (e.g., `yourblog.com`)
   - Configure DNS as instructed

3. **SSL Certificate**
   - Railway automatically provides SSL certificates
   - HTTPS will be enabled automatically

## Monitoring and Logs

### View Logs
- **Dashboard**: Click on service → "Logs" tab
- **CLI**: `railway logs --service frontend` or `railway logs --service backend`

### Metrics
- CPU usage, memory usage, and network metrics available in dashboard
- Set up alerts for service health

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Railway dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Environment Variable Issues**
   - Ensure `JWT_SECRET` is set in backend service
   - Check that auto-generated URLs are correct

3. **Database Issues**
   - Database is created automatically on first run
   - Check backend logs for database errors

4. **CORS Issues**
   - Railway automatically configures CORS between services
   - Check that `CORS_ORIGIN` variable is set correctly

### Debug Commands

```bash
# View service status
railway status

# View logs
railway logs --service backend
railway logs --service frontend

# SSH into service (if needed)
railway shell --service backend

# View environment variables
railway variables
```

## Scaling

### Horizontal Scaling
- Increase `numReplicas` in `railway.json`
- Note: SQLite doesn't support multiple replicas well
- Consider migrating to PostgreSQL for scaling

### Vertical Scaling
- Railway automatically handles resource allocation
- Upgrade plan for more resources if needed

## Backup Strategy

### Database Backup
```bash
# Connect to backend service
railway shell --service backend

# Create backup
cp /app/database.db /app/backup-$(date +%Y%m%d).db

# Download backup (from local machine)
railway run --service backend "cat /app/database.db" > local-backup.db
```

### Code Backup
- Code is backed up in your GitHub repository
- Railway deployments are versioned

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to repository
   - Use Railway's environment variable system

2. **Database Security**
   - SQLite file is only accessible within the service
   - Consider encryption for sensitive data

3. **HTTPS**
   - Railway provides automatic HTTPS
   - All traffic is encrypted

## Cost Optimization

1. **Sleep Applications**
   - Set `sleepApplication: true` for development
   - Keep `false` for production

2. **Resource Monitoring**
   - Monitor usage in Railway dashboard
   - Optimize code for better performance

## Post-Deployment Checklist

- [ ] Both services deployed successfully
- [ ] Frontend accessible via Railway domain
- [ ] Backend API responding correctly
- [ ] Database initialized and working
- [ ] Admin user can be created
- [ ] User registration/login working
- [ ] Post creation and likes working
- [ ] Admin panel accessible
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and alerts set up

## Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Status**: [status.railway.app](https://status.railway.app) 