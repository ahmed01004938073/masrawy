@echo off
echo ==========================================
echo    Starting Dashmkhzny23amzoon Project
echo ==========================================

echo [1/2] Starting Backend Server (Port 3001)...
start "Backend API (Node.js)" cmd /k "cd /d %~dp0\server && node index.cjs"

echo [2/2] Starting Frontend (Vite)...
start "Frontend App (Vite)" cmd /k "cd /d %~dp0 && npm run dev"

echo ==========================================
echo    All services started successfully!
echo ==========================================
pause
