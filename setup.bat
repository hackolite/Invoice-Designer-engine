@echo off
setlocal enabledelayedexpansion

:: Colors simulation for Windows (using echo)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo ============================================
echo   Invoice Designer Engine - Setup Script
echo ============================================
echo.

:: Check if Node.js is installed
echo [94mChecking for Node.js...[0m
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [91mNode.js is not installed. Please install Node.js 20 or higher.[0m
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [92mNode.js found: %NODE_VERSION%[0m

:: Check if npm is installed
echo [94mChecking for npm...[0m
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [91mnpm is not installed. Please install npm.[0m
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [92mnpm found: %NPM_VERSION%[0m

:: Check if PostgreSQL is installed
echo [94mChecking for PostgreSQL...[0m
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [93mPostgreSQL command-line tool (psql) not found.[0m
    echo If PostgreSQL is installed but psql is not in PATH, you can continue.
    set /p CONTINUE="Do you want to continue? (y/n): "
    if /i "!CONTINUE!" neq "y" (
        echo [91mSetup aborted. Please install PostgreSQL and try again.[0m
        echo Visit: https://www.postgresql.org/download/
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('psql --version') do set PSQL_VERSION=%%i
    echo [92mPostgreSQL found: !PSQL_VERSION![0m
)

echo.
echo ============================================
echo   Environment Configuration
echo ============================================
echo.

:: Create .env file if it doesn't exist
if exist ".env" (
    echo [93m.env file already exists.[0m
    set /p OVERWRITE="Do you want to overwrite it? (y/n): "
    if /i "!OVERWRITE!"=="y" (
        copy /y .env.example .env >nul
        echo [92m.env file created from template.[0m
    ) else (
        echo [94mKeeping existing .env file.[0m
    )
) else (
    copy .env.example .env >nul
    echo [92m.env file created from template.[0m
)

echo.
echo [93mIMPORTANT: Please configure your database connection in the .env file[0m
echo Edit the DATABASE_URL with your PostgreSQL credentials:
echo   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
echo.
echo Please update the .env file now in another window, then press any key to continue...
pause >nul

echo.
echo ============================================
echo   Database Setup
echo ============================================
echo.

:: Check if .env file exists
if not exist ".env" (
    echo [91m.env file not found. Please create it first.[0m
    pause
    exit /b 1
)

:: Read DATABASE_URL from .env file
set "DATABASE_URL="
for /f "tokens=1,* delims==" %%a in ('findstr /r "^DATABASE_URL=" .env 2^>nul') do set DATABASE_URL=%%b

if "!DATABASE_URL!"=="" (
    echo [91mDATABASE_URL is not set in .env file.[0m
    pause
    exit /b 1
)

echo [94mDatabase configuration loaded from .env[0m
echo [93mPlease ensure your PostgreSQL database exists and is accessible.[0m
echo.

echo ============================================
echo   Installing Dependencies
echo ============================================
echo.

echo [94mInstalling npm packages... This may take a few minutes.[0m
call npm install

if %errorlevel% neq 0 (
    echo [91mFailed to install dependencies.[0m
    pause
    exit /b 1
)

echo [92mDependencies installed successfully.[0m

echo.
echo ============================================
echo   Database Migration
echo ============================================
echo.

echo [94mPushing database schema to PostgreSQL...[0m

REM Capture output to a temporary file and check for errors
set "TEMP_OUTPUT=%TEMP%\db_push_output.txt"
call npm run db:push > "%TEMP_OUTPUT%" 2>&1
set DB_PUSH_EXIT_CODE=%errorlevel%

REM Display the output
type "%TEMP_OUTPUT%"

REM Check for errors in output or non-zero exit code
REM drizzle-kit may return 0 even with errors, so we check the output too
findstr /i /c:"error:" /c:"ERROR:" /c:"permission denied" /c:"must be owner" "%TEMP_OUTPUT%" >nul
if %errorlevel% equ 0 (
    set DB_HAS_ERROR=1
) else (
    set DB_HAS_ERROR=0
)

REM Clean up temp file
del "%TEMP_OUTPUT%" 2>nul

if %DB_PUSH_EXIT_CODE% neq 0 (
    set DB_HAS_ERROR=1
)

if %DB_HAS_ERROR% equ 1 (
    echo.
    echo [91mFailed to create database schema.[0m
    echo [93mDatabase migration encountered errors. Common issues:[0m
    echo   * Permission errors: Ensure your database user has sufficient privileges
    echo   * Connection errors: Verify DATABASE_URL in .env is correct
    echo   * Existing tables: Your database user may not own existing tables
    echo.
    echo [93mYou may need to:[0m
    echo   1. Grant proper permissions to your database user, or
    echo   2. Run 'npm run db:push' as the database owner, or
    echo   3. Drop and recreate the database with your current user
    pause
    exit /b 1
)

echo [92mDatabase schema created successfully.[0m

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo [92mInvoice Designer Engine is ready to use![0m
echo.
echo To start the application:
echo.
echo   Development mode (with hot reload):
echo     npm run dev
echo.
echo   Production build:
echo     npm run build
echo     npm start
echo.
echo The application will be available at:
echo   http://localhost:5000
echo.
echo [94mFor more information, check the documentation files.[0m
echo.
pause
