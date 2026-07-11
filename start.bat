 .
 @echo off
echo ============================================
echo   SIEM System - Starting All Services
echo ============================================
echo.

echo [1/2] Starting Backend (FastAPI)...
start "SIEM Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt -q && python -m uvicorn main:app --reload --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend (React)...
start "SIEM Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm start"

echo.
echo ============================================
echo   Services Starting...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Default Login: admin / admin123
echo ============================================
pause
