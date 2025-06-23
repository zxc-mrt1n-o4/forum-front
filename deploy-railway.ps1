Write-Host "🚀 Preparing for Railway Deployment..." -ForegroundColor Green
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Check if user is logged in
try {
    railway whoami | Out-Null
    Write-Host "✅ Logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please log in to Railway:" -ForegroundColor Yellow
    railway login
}

Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Cyan
Write-Host ""

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "✅ Frontend package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend package.json not found" -ForegroundColor Red
    exit 1
}

# Check if backend package.json exists
if (Test-Path "backend-server/package.json") {
    Write-Host "✅ Backend package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ Backend package.json not found" -ForegroundColor Red
    exit 1
}

# Check if railway.json exists
if (Test-Path "railway.json") {
    Write-Host "✅ Railway configuration found" -ForegroundColor Green
} else {
    Write-Host "❌ Railway configuration not found" -ForegroundColor Red
    exit 1
}

# Check if Dockerfile exists for frontend
if (Test-Path "Dockerfile") {
    Write-Host "✅ Frontend Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend Dockerfile not found (will use Nixpacks)" -ForegroundColor Yellow
}

# Check if Dockerfile exists for backend
if (Test-Path "backend-server/Dockerfile") {
    Write-Host "✅ Backend Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend Dockerfile not found (will use Nixpacks)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan

# Generate a random JWT secret
$JWT_SECRET = "your-super-secret-jwt-key-$(Get-Date -Format 'yyyyMMddHHmmss')-$(Get-Random)"

Write-Host "Setting JWT_SECRET..." -ForegroundColor Yellow
railway variables set JWT_SECRET="$JWT_SECRET"

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend-server
npm install
Set-Location ..

Write-Host ""
Write-Host "🏗️  Building frontend..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To deploy, run:" -ForegroundColor Cyan
Write-Host "   railway up" -ForegroundColor White
Write-Host ""
Write-Host "📊 To monitor deployment:" -ForegroundColor Cyan
Write-Host "   railway logs --service frontend" -ForegroundColor White
Write-Host "   railway logs --service backend" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your services will be available at:" -ForegroundColor Cyan
Write-Host "   Frontend: https://<your-frontend-domain>.railway.app" -ForegroundColor White
Write-Host "   Backend:  https://<your-backend-domain>.railway.app" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Remember to:" -ForegroundColor Cyan
Write-Host "   1. Set up custom domains if needed" -ForegroundColor White
Write-Host "   2. Create admin user after deployment" -ForegroundColor White
Write-Host "   3. Test all functionality" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 