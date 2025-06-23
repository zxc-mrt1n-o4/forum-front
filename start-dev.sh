#!/bin/bash

echo "Starting CMS Blog Development Servers..."
echo ""
echo "Backend Server: http://localhost:5000"
echo "Frontend Server: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server in background
echo "Starting backend server..."
cd backend-server
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend server in background
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 