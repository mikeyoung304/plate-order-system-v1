#!/bin/bash

# Deployment script for Plate Order System
# This script prepares and deploys the application to production

set -e

# Configuration
APP_NAME="plate-order-system"
DEPLOY_DIR="/home/ubuntu/projects/plate-order-system-enhanced"
SCRIPTS_DIR="$DEPLOY_DIR/scripts"
NGINX_CONF_DIR="$DEPLOY_DIR/nginx/conf.d"
NGINX_SSL_DIR="$DEPLOY_DIR/nginx/ssl"
NGINX_WWW_DIR="$DEPLOY_DIR/nginx/www"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is installed
check_docker() {
  print_header "Checking Docker installation"
  
  if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_success "Docker and Docker Compose are installed"
    docker --version
    docker-compose --version
  else
    print_error "Docker and/or Docker Compose are not installed"
    exit 1
  fi
}

# Create necessary directories
create_directories() {
  print_header "Creating necessary directories"
  
  mkdir -p "$DEPLOY_DIR/data"
  mkdir -p "$DEPLOY_DIR/logs"
  mkdir -p "$NGINX_CONF_DIR"
  mkdir -p "$NGINX_SSL_DIR"
  mkdir -p "$NGINX_WWW_DIR"
  mkdir -p "$SCRIPTS_DIR"
  
  print_success "Directories created"
}

# Generate Nginx configuration
generate_nginx_config() {
  print_header "Generating Nginx configuration"
  
  cat > "$NGINX_CONF_DIR/app.conf" << EOF
server {
    listen 80;
    server_name _;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
    
    # Root location
    location / {
        proxy_pass http://app:8000;
    }
    
    # WebSocket location
    location /ws/ {
        proxy_pass http://app:8000;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /static/ {
        proxy_pass http://app:8000;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # Health check
    location /health {
        proxy_pass http://app:8000;
        access_log off;
        proxy_cache_bypass 1;
        proxy_no_cache 1;
    }
}
EOF
  
  print_success "Nginx configuration generated"
}

# Generate self-signed SSL certificate
generate_ssl_certificate() {
  print_header "Generating self-signed SSL certificate"
  
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$NGINX_SSL_DIR/key.pem" \
    -out "$NGINX_SSL_DIR/cert.pem" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
  
  print_success "SSL certificate generated"
}

# Generate requirements.txt
generate_requirements() {
  print_header "Generating requirements.txt"
  
  cat > "$DEPLOY_DIR/requirements.txt" << EOF
fastapi==0.95.0
uvicorn==0.21.1
pydantic==1.10.7
sqlalchemy==2.0.9
alembic==1.10.3
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
aiofiles==23.1.0
jinja2==3.1.2
websockets==11.0.2
httpx==0.24.0
deepgram-sdk==2.11.0
python-dotenv==1.0.0
bcrypt==4.0.1
cryptography==40.0.2
pytest==7.3.1
pytest-asyncio==0.21.0
EOF
  
  print_success "requirements.txt generated"
}

# Generate package.json
generate_package_json() {
  print_header "Generating package.json"
  
  cat > "$DEPLOY_DIR/package.json" << EOF
{
  "name": "plate-order-system",
  "version": "2.0.0",
  "description": "Voice-enabled ordering system for assisted living facilities",
  "scripts": {
    "build": "echo 'No build step required'",
    "test": "echo 'No tests specified'"
  },
  "dependencies": {
    "compression": "^1.7.4"
  },
  "devDependencies": {}
}
EOF
  
  print_success "package.json generated"
}

# Generate manifest.json for PWA
generate_manifest_json() {
  print_header "Generating manifest.json for PWA"
  
  mkdir -p "$DEPLOY_DIR/app/static"
  
  cat > "$DEPLOY_DIR/app/static/manifest.json" << EOF
{
  "name": "Plate Order System",
  "short_name": "PlateOrder",
  "description": "Voice-enabled ordering system for assisted living facilities",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0072d6",
  "icons": [
    {
      "src": "/static/img/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/static/img/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF
  
  print_success "manifest.json generated"
}

# Generate offline page
generate_offline_page() {
  print_header "Generating offline page"
  
  mkdir -p "$DEPLOY_DIR/app/templates/pages"
  
  cat > "$DEPLOY_DIR/app/templates/pages/offline.html" << EOF
{% extends "layouts/base.html" %}

{% block title %}Offline - Plate Order System{% endblock %}

{% block meta_description %}You are currently offline{% endblock %}

{% block content %}
<div class="container">
  <div class="card shadow-lg mt-5">
    <div class="card-body text-center p-5">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4 text-neutral-400">
        <path d="M1 1L23 23M9 2H15C16.1046 2 17 2.89543 17 4V15M9 22H15C16.1046 22 17 21.1046 17 20V19M5 19V20C5 21.1046 5.89543 22 7 22M5 5V4C5 2.89543 5.89543 2 7 2M2 12H4M20 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h1 class="text-2xl font-bold mb-2">You're Offline</h1>
      <p class="text-neutral-600 mb-4">Please check your internet connection and try again.</p>
      <button class="btn btn-primary" onclick="window.location.reload()">
        Retry Connection
      </button>
    </div>
  </div>
</div>
{% endblock %}
EOF
  
  print_success "Offline page generated"
}

# Build Docker images
build_docker_images() {
  print_header "Building Docker images"
  
  cd "$DEPLOY_DIR"
  docker-compose build
  
  print_success "Docker images built"
}

# Deploy the application
deploy_application() {
  print_header "Deploying the application"
  
  cd "$DEPLOY_DIR"
  docker-compose up -d
  
  print_success "Application deployed"
}

# Main function
main() {
  print_header "Starting deployment of $APP_NAME"
  
  check_docker
  create_directories
  generate_nginx_config
  generate_ssl_certificate
  generate_requirements
  generate_package_json
  generate_manifest_json
  generate_offline_page
  build_docker_images
  deploy_application
  
  print_header "Deployment completed successfully"
  echo -e "The application is now running at https://localhost"
  echo -e "You can access the API documentation at https://localhost/docs"
}

# Run the main function
main
