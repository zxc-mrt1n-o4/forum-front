# Starting Development Servers

This guide shows you different ways to start both the backend and frontend servers simultaneously.

## Method 1: Using npm scripts (Recommended)

### Development Mode
```bash
npm run dev:full
```

### Production Mode
```bash
npm run start:full
```

## Method 2: Platform-specific scripts

### Windows (Batch Script)
Double-click `start-dev.bat` or run:
```cmd
start-dev.bat
```

### Windows (PowerShell)
Right-click `start-dev.ps1` → "Run with PowerShell" or run:
```powershell
.\start-dev.ps1
```

### Linux/macOS (Shell Script)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## Method 3: Manual startup

### Terminal 1 (Backend)
```bash
cd backend-server
npm start
```

### Terminal 2 (Frontend)
```bash
npm run dev
```

## Server URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Stopping Servers

- **npm scripts**: Press `Ctrl+C` in the terminal
- **Windows scripts**: Close the opened terminal windows or press `Ctrl+C`
- **Shell script**: Press `Ctrl+C` in the terminal

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

1. **Kill processes on Windows:**
   ```cmd
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F
   
   netstat -ano | findstr :5000
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Kill processes on Linux/macOS:**
   ```bash
   lsof -ti :3000 | xargs kill -9
   lsof -ti :5000 | xargs kill -9
   ```

### Missing Dependencies
If you get dependency errors:
```bash
npm install
cd backend-server && npm install
```

## Development Workflow

1. Start both servers using any method above
2. Open http://localhost:3000 in your browser
3. Backend API will be available at http://localhost:5000
4. Make changes to your code - both servers support hot reload
5. Stop servers when done developing

## Environment Variables

Make sure you have the correct environment variables set:

### Frontend (.env.local)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Backend (backend-server/.env)
```
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_PATH=./database.db
``` 