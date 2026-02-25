@echo off
cd /d "%~dp0"
echo Starting stable development server without auto-reload...
call npm run dev:stable
pause
