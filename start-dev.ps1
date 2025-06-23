Write-Host "Starting CMS Blog Development Servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend Server: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend-server'; npm start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend server in new window  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Check the opened PowerShell windows for server status." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 