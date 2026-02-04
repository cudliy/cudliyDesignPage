@echo off
REM Cudliy Development Startup Script for Windows
REM This script starts both frontend and backend in development mode

echo 🚀 Starting Cudliy Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 🔧 Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo 🎨 Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo ✅ Development environment started!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
echo 🏥 Health Check: http://localhost:3001/api/health
echo.
echo Both servers are running in separate windows.
echo Close the command windows to stop the servers.
pause