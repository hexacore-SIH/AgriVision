@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        AgriVision Windows Setup Assistant
echo ========================================================
echo.

REM 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js: %%v

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not found in PATH.
    pause
    exit /b 1
)

REM 2. Check Python
set PYTHON_CMD=
where py >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    for /f "tokens=*" %%v in ('py --version') do echo [OK] Python Launcher: %%v
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
        for /f "tokens=*" %%v in ('python --version') do echo [OK] Python: %%v
    ) else (
        echo [ERROR] Python is not installed. Please install Python 3.10+ from https://www.python.org/
        pause
        exit /b 1
    )
)

REM 3. Check Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker is not installed or not found in PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
) else (
    for /f "tokens=*" %%v in ('docker --version') do echo [OK] Docker: %%v
)

echo.
echo ========================================================
echo [STEP 1/5] Setting up environment files
echo ========================================================

REM backend/.env
if not exist "backend\.env" (
    if exist ".env.example" (
        copy /y ".env.example" "backend\.env" >nul
        echo [OK] Created backend\.env from .env.example
    ) else (
        (
            echo DATABASE_URL="postgresql://agrivision:agrivision@localhost:5432/agrivision"
            echo JWT_ACCESS_SECRET="change-me-access-secret"
            echo JWT_REFRESH_SECRET="change-me-refresh-secret"
            echo INTERNAL_API_KEY="change-me-shared-secret"
            echo LLM_SERVICE_URL="http://localhost:8000"
            echo PORT=4000
            echo FRONTEND_ORIGIN="http://localhost:3000"
            echo NODE_ENV=development
        ) > "backend\.env"
        echo [OK] Created backend\.env
    )
) else (
    echo [INFO] backend\.env already exists.
)

REM frontend/.env.local
if not exist "frontend\.env.local" (
    echo NEXT_PUBLIC_API_URL="http://localhost:4000" > "frontend\.env.local"
    echo [OK] Created frontend\.env.local
) else (
    echo [INFO] frontend\.env.local already exists.
)

REM llm-service/.env
if not exist "llm-service\.env" (
    (
        echo SARVAM_API_KEY="your-sarvam-api-key"
        echo INTERNAL_API_KEY="change-me-shared-secret"
    ) > "llm-service\.env"
    echo [OK] Created llm-service\.env
) else (
    echo [INFO] llm-service\.env already exists.
)

echo.
echo ========================================================
echo [STEP 2/5] Installing Node dependencies
echo ========================================================
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [STEP 3/5] Setting up Python virtual environment
echo ========================================================
cd llm-service
if not exist ".venv" (
    echo Creating virtual environment...
    %PYTHON_CMD% -m venv .venv
)
if exist ".venv\Scripts\pip.exe" (
    echo Installing Python dependencies...
    .venv\Scripts\pip.exe install -r requirements.txt
) else (
    echo [ERROR] Could not find .venv\Scripts\pip.exe
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================================
echo [STEP 4/5] Starting Docker PostgreSQL
echo ========================================================
call npm run db:up
if %errorlevel% neq 0 (
    echo [WARNING] Failed to start Docker Postgres container.
    echo Please make sure Docker Desktop is started and running.
) else (
    echo Waiting for PostgreSQL to be ready...
    call npm run db:wait
    
    echo.
    echo ========================================================
    echo [STEP 5/5] Running database migrations and seeds
    echo ========================================================
    cd backend
    call npx prisma generate
    call npx prisma migrate deploy
    call npm run prisma:seed
    cd ..
)

echo.
echo ========================================================
echo               AgriVision Setup Complete!
echo ========================================================
echo.
echo To start all services, run:
echo   npm run all
echo.
echo Frontend:    http://localhost:3000
echo Backend API: http://localhost:4000
echo LLM Service: http://localhost:8000
echo.
echo Demo Accounts:
echo   9999900000 -> ADMIN
echo   9999900001 -> MANDI_HEAD (Pune APMC)
echo   9999900002 -> FARMER
echo.
pause

