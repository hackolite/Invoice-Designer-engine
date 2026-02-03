#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Script header
echo "============================================"
echo "  Invoice Designer Engine - Setup Script"
echo "============================================"
echo ""

# Check if Node.js is installed
print_info "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js found: $NODE_VERSION"

# Check if npm is installed
print_info "Checking for npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm found: $NPM_VERSION"

# Check if PostgreSQL is installed
print_info "Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL command-line tool (psql) not found."
    print_info "If PostgreSQL is installed but psql is not in PATH, you can continue."
    read -p "Do you want to continue? (y/n): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        print_error "Setup aborted. Please install PostgreSQL and try again."
        echo "Visit: https://www.postgresql.org/download/"
        exit 1
    fi
else
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL found: $PSQL_VERSION"
fi

echo ""
echo "============================================"
echo "  Environment Configuration"
echo "============================================"
echo ""

# Create .env file if it doesn't exist
if [ -f ".env" ]; then
    print_warning ".env file already exists."
    read -p "Do you want to overwrite it? (y/n): " OVERWRITE
    if [[ $OVERWRITE =~ ^[Yy]$ ]]; then
        cp .env.example .env
        print_success ".env file created from template."
    else
        print_info "Keeping existing .env file."
    fi
else
    cp .env.example .env
    print_success ".env file created from template."
fi

echo ""
print_warning "IMPORTANT: Please configure your database connection in the .env file"
echo "Edit the DATABASE_URL with your PostgreSQL credentials:"
echo "  DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
echo ""

read -p "Press Enter to continue after updating .env, or Ctrl+C to exit..."

# Source the .env file safely
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

echo ""
echo "============================================"
echo "  Database Setup"
echo "============================================"
echo ""

# Extract database details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is not set in .env file."
    exit 1
fi

print_info "Attempting to create database if it doesn't exist..."

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/dbname
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    print_info "Database details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Try to create the database (will fail silently if it exists)
    print_info "Creating database '$DB_NAME' if it doesn't exist..."
    
    # Try to create database using psql
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '\"$DB_NAME\"'" | grep -q 1 || \
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\"" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            print_success "Database is ready."
        else
            print_warning "Could not automatically create database. Please create it manually if needed."
            print_info "Run: CREATE DATABASE $DB_NAME;"
        fi
    else
        print_warning "psql not available. Please ensure the database exists manually."
    fi
else
    print_warning "Could not parse DATABASE_URL. Please ensure the database exists."
fi

echo ""
echo "============================================"
echo "  Installing Dependencies"
echo "============================================"
echo ""

print_info "Installing npm packages... This may take a few minutes."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully."
else
    print_error "Failed to install dependencies."
    exit 1
fi

echo ""
echo "============================================"
echo "  Database Migration"
echo "============================================"
echo ""

print_info "Pushing database schema to PostgreSQL..."
npm run db:push

if [ $? -eq 0 ]; then
    print_success "Database schema created successfully."
else
    print_error "Failed to create database schema."
    print_warning "You may need to run 'npm run db:push' manually after fixing database connection."
    exit 1
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
print_success "Invoice Designer Engine is ready to use!"
echo ""
echo "To start the application:"
echo ""
echo "  Development mode (with hot reload):"
echo "    npm run dev"
echo ""
echo "  Production build:"
echo "    npm run build"
echo "    npm start"
echo ""
echo "The application will be available at:"
echo "  http://localhost:5000"
echo ""
print_info "For more information, check the documentation files."
echo ""
