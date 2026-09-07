# AgriVision - Windows Setup Script (PowerShell)
# Run from PowerShell: .\scripts\setup-windows.ps1

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " [STEP] $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host "================================================" -ForegroundColor Green
Write-Host "       AgriVision Windows Setup Assistant       " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# 1. Check Prerequisites
Write-Step "Checking Prerequisites"

# Node.js
try {
    $nodeVer = node -v
    Write-Success "Node.js detected: $nodeVer"
} catch {
    Write-Err "Node.js is not installed or not in PATH. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
}

# npm
try {
    $npmVer = npm -v
    Write-Success "npm detected: $npmVer"
} catch {
    Write-Err "npm is not installed or not in PATH."
    exit 1
}

# Python launcher or python
$pythonCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
    $pyVer = py --version
    Write-Success "Python launcher detected: $pyVer (using 'py')"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
    $pyVer = python --version
    Write-Success "Python detected: $pyVer (using 'python')"
} else {
    Write-Err "Python is not installed or not in PATH. Please install Python 3.10+ from https://www.python.org/"
    exit 1
}

# Docker
$dockerRunning = $false
try {
    $dockerVer = docker --version
    Write-Success "Docker detected: $dockerVer"
    
    # Check if Docker daemon is responding
    docker ps | Out-Null
    $dockerRunning = $true
    Write-Success "Docker daemon is running."
} catch {
    Write-Warn "Docker is installed but the Docker daemon does not appear to be running."
    Write-Warn "Please launch Docker Desktop and wait for the engine to start."
    
    $answer = Read-Host "Is Docker Desktop running now? (y/n)"
    if ($answer -match "^[Yy]") {
        try {
            docker ps | Out-Null
            $dockerRunning = $true
            Write-Success "Docker daemon confirmed running."
        } catch {
            Write-Warn "Could not connect to Docker. You may need to run 'docker compose up -d postgres' manually later."
        }
    } else {
        Write-Warn "Continuing without starting Docker. Database steps will be skipped."
    }
}

# 2. Environment files setup
Write-Step "Configuring Environment Files"

# backend/.env
$backendEnv = Join-Path $repoRoot "backend\.env"
if (-not (Test-Path $backendEnv)) {
    if (Test-Path (Join-Path $repoRoot ".env.example")) {
        Copy-Item (Join-Path $repoRoot ".env.example") $backendEnv
        Write-Success "Created backend\.env from .env.example"
    } else {
        @"
DATABASE_URL="postgresql://agrivision:agrivision@localhost:5432/agrivision"
JWT_ACCESS_SECRET="change-me-access-secret"
JWT_REFRESH_SECRET="change-me-refresh-secret"
INTERNAL_API_KEY="change-me-shared-secret"
LLM_SERVICE_URL="http://localhost:8000"
PORT=4000
FRONTEND_ORIGIN="http://localhost:3000"
NODE_ENV=development
"@ | Out-File -FilePath $backendEnv -Encoding utf8
        Write-Success "Created backend\.env with default configuration"
    }
} else {
    Write-Host "backend\.env already exists. Skipping." -ForegroundColor Gray
}

# frontend/.env.local
$frontendEnv = Join-Path $repoRoot "frontend\.env.local"
if (-not (Test-Path $frontendEnv)) {
    @"
NEXT_PUBLIC_API_URL="http://localhost:4000"
"@ | Out-File -FilePath $frontendEnv -Encoding utf8
    Write-Success "Created frontend\.env.local"
} else {
    Write-Host "frontend\.env.local already exists. Skipping." -ForegroundColor Gray
}

# llm-service/.env
$llmEnv = Join-Path $repoRoot "llm-service\.env"
if (-not (Test-Path $llmEnv)) {
    @"
SARVAM_API_KEY="your-sarvam-api-key"
INTERNAL_API_KEY="change-me-shared-secret"
"@ | Out-File -FilePath $llmEnv -Encoding utf8
    Write-Success "Created llm-service\.env"
} else {
    Write-Host "llm-service\.env already exists. Skipping." -ForegroundColor Gray
}

# 3. Install Node dependencies
Write-Step "Installing Node Dependencies (Root & Workspaces)"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Err "npm install failed. Please check the errors above."
    exit 1
}
Write-Success "Node dependencies installed."

# 4. Setup Python Virtual Environment in llm-service
Write-Step "Setting Up Python Virtual Environment in llm-service"
$llmVenvDir = Join-Path $repoRoot "llm-service\.venv"
if (-not (Test-Path $llmVenvDir)) {
    Write-Host "Creating virtualenv with $pythonCmd..."
    Set-Location (Join-Path $repoRoot "llm-service")
    & $pythonCmd -m venv .venv
    Set-Location $repoRoot
    Write-Success "Virtualenv created at llm-service\.venv"
} else {
    Write-Host "Virtualenv already exists at llm-service\.venv" -ForegroundColor Gray
}

$venvPip = Join-Path $llmVenvDir "Scripts\pip.exe"
$reqFile = Join-Path $repoRoot "llm-service\requirements.txt"
if (Test-Path $venvPip) {
    Write-Host "Installing Python packages from requirements.txt..."
    & $venvPip install -r $reqFile
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Python package installation failed. Please check the errors above."
        exit 1
    }
    Write-Success "Python dependencies installed."
} else {
    Write-Err "Could not find $venvPip"
    exit 1
}

# 5. Start Database & Run Migrations
if ($dockerRunning) {
    Write-Step "Starting PostgreSQL Container & Initializing Database"
    npm run db:up
    
    Write-Host "Waiting for PostgreSQL to be ready..."
    npm run db:wait
    
    Write-Host "Running Prisma generate & migrations..."
    Set-Location (Join-Path $repoRoot "backend")
    npx prisma generate
    npx prisma migrate deploy
    npm run prisma:seed
    Set-Location $repoRoot
    Write-Success "Database migrated and seeded successfully!"
} else {
    Write-Warn "Skipping database setup because Docker was not running."
    Write-Warn "After starting Docker Desktop, run:"
    Write-Host "  npm run db:up" -ForegroundColor White
    Write-Host "  cd backend && npx prisma migrate deploy && npm run prisma:seed" -ForegroundColor White
}

# 6. Complete
Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "           AgriVision Setup Complete!                   " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "`nTo start all services together, run:" -ForegroundColor Cyan
Write-Host "  npm run all`n" -ForegroundColor White

Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "  LLM Service: http://localhost:8000" -ForegroundColor White

Write-Host "`nDemo Accounts (Phone / Role):" -ForegroundColor Yellow
Write-Host "  9999900000 -> ADMIN" -ForegroundColor White
Write-Host "  9999900001 -> MANDI_HEAD (Pune APMC Mandi)" -ForegroundColor White
Write-Host "  9999900002 -> FARMER" -ForegroundColor White
Write-Host ""

