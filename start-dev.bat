@echo off
echo Starting CMS Blog Development Servers...
echo.
echo Backend Server: http://localhost:5000
echo Frontend Server: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Backend Server" cmd /k "cd backend-server && npm start"
start "Frontend Server" cmd /k "npm run dev"

echo Both servers are starting...
echo Check the opened terminal windows for server status.
pause 