@echo off
echo Starting development server...
cd /d "%~dp0"
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo Failed to start development server.
    echo Try running the following commands manually:
    echo cd "%~dp0"
    echo npm run dev
    pause
) else (
    echo Development server started successfully.
    pause
)
