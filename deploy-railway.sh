#!/bin/bash

echo "🚀 Preparing for Railway Deployment..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway:"
    railway login
fi

echo "📋 Pre-deployment checklist:"
echo ""

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ Frontend package.json found"
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Check if backend package.json exists
if [ -f "backend-server/package.json" ]; then
    echo "✅ Backend package.json found"
else
    echo "❌ Backend package.json not found"
    exit 1
fi

# Check if railway.json exists
if [ -f "railway.json" ]; then
    echo "✅ Railway configuration found"
else
    echo "❌ Railway configuration not found"
    exit 1
fi

# Check if Dockerfile exists for frontend
if [ -f "Dockerfile" ]; then
    echo "✅ Frontend Dockerfile found"
else
    echo "⚠️  Frontend Dockerfile not found (will use Nixpacks)"
fi

# Check if Dockerfile exists for backend
if [ -f "backend-server/Dockerfile" ]; then
    echo "✅ Backend Dockerfile found"
else
    echo "⚠️  Backend Dockerfile not found (will use Nixpacks)"
fi

echo ""
echo "🔧 Setting up environment variables..."

# Generate a random JWT secret if not provided
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-super-secret-jwt-key-$(date +%s)")

echo "Setting JWT_SECRET..."
railway variables set JWT_SECRET="$JWT_SECRET"

echo ""
echo "📦 Installing dependencies..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend-server
npm install
cd ..

echo ""
echo "🏗️  Building frontend..."
npm run build

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "🚀 To deploy, run:"
echo "   railway up"
echo ""
echo "📊 To monitor deployment:"
echo "   railway logs --service frontend"
echo "   railway logs --service backend"
echo ""
echo "🌐 Your services will be available at:"
echo "   Frontend: https://<your-frontend-domain>.railway.app"
echo "   Backend:  https://<your-backend-domain>.railway.app"
echo ""
echo "⚙️  Remember to:"
echo "   1. Set up custom domains if needed"
echo "   2. Create admin user after deployment"
echo "   3. Test all functionality"
echo "" 