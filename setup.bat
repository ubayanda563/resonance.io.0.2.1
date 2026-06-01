@echo off
REM 🎵 Resonance Music Player - Automated Setup Script (Windows)
REM This script sets up and starts both backend and frontend

echo.
echo 🎵 Resonance Music Player Setup
echo ==================================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python 3 is not installed
    echo Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION% found

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% found

REM Backend setup
echo.
echo 🔧 Setting up Backend...

if not exist "backend" (
    echo ❌ backend directory not found
    pause
    exit /b 1
)

cd backend

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate venv and install dependencies
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install -q -r requirements.txt
echo ✓ Python dependencies installed

if not exist ".env" (
    echo Creating backend .env file...
    (
        echo MONGO_URL=
        echo DB_NAME=resonance
        echo ALLOWED_ORIGINS=http://localhost:3000
        echo LASTFM_API_KEY=
        echo ACOUSTID_API_KEY=
        echo RAPIDAPI_KEY=
    ) > .env
    echo ✓ Backend .env created
)

cd ..

REM Frontend setup
echo.
echo 🎨 Setting up Frontend...

if not exist "frontend" (
    echo ❌ frontend directory not found
    pause
    exit /b 1
)

cd frontend

if not exist ".env" (
    echo Creating frontend .env file...
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > .env
    echo ✓ Frontend .env created
)

echo Installing Node dependencies...
call npm install --legacy-peer-deps
echo ✓ Node dependencies installed

cd ..

REM Display next steps
echo.
echo ==================================
echo ✅ Setup Complete!
echo ==================================
echo.
echo To start the app:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python server.py
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm start
echo.
echo The app will open at: http://localhost:3000
echo Backend API runs at: http://localhost:8001
echo.

pause
