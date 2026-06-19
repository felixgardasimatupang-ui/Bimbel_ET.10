#!/bin/sh

log() { echo "[entrypoint] $*"; }

export DATABASE_URL_DIRECT="${DATABASE_URL_DIRECT:-$DATABASE_URL}"
API_PORT="${API_PORT:-3001}"

log "API_PORT=${API_PORT}"

# Check if we can use nginx (root only, nginx must be installed)
USE_NGINX=false
if [ "$(id -u)" -eq 0 ] && command -v nginx >/dev/null 2>&1; then
  USE_NGINX=true
elif [ "$(id -u)" -eq 0 ] && apk add --no-cache nginx wget >/dev/null 2>&1; then
  log "nginx installed at runtime"
  USE_NGINX=true
else
  log "nginx not available — running API directly"
fi

if [ "$USE_NGINX" = true ]; then
  NGINX_CONF="/etc/nginx/conf.d/default.conf"

  if [ ! -f "$NGINX_CONF" ]; then
    log "nginx config not found, creating fallback..."
    mkdir -p "$(dirname "$NGINX_CONF")" 2>/dev/null
    cat > "$NGINX_CONF" <<'NGINX_EOF'
server {
    listen       3000;
    server_name  localhost;
    root   /usr/share/nginx/html;
    index  index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
    gzip_vary on;
    gzip_proxied any;
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location /api/ {
        proxy_pass http://localhost:__API_PORT__;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
NGINX_EOF
  fi

  if [ -n "$PORT" ]; then
    log "Updating nginx listen to PORT=${PORT}"
    sed -i "s/listen  *3000;/listen ${PORT};/" "$NGINX_CONF"
  fi

  sed -i "s/__API_PORT__/${API_PORT}/g" "$NGINX_CONF"
fi

log "Syncing database schema..."
npx prisma db push --accept-data-loss 2>&1 || log "WARN: DB push failed (will retry at next deploy)"

log "Seeding initial data..."
npx tsx prisma/seed.ts 2>&1 || log "Seed skipped (data may already exist)"

MAX_RETRIES=3
retry=0
ready=0

while [ $retry -lt $MAX_RETRIES ] && [ $ready -eq 0 ]; do
  retry=$((retry + 1))
  log "Starting API server (attempt ${retry}/${MAX_RETRIES}) on port ${API_PORT}..."
  node dist/server.js &
  SERVER_PID=$!

  for i in $(seq 1 60); do
    if wget -q --timeout=2 --spider "http://localhost:${API_PORT}/api/health" 2>/dev/null; then
      log "API is ready on port ${API_PORT}"
      ready=1
      break
    fi
    sleep 1
  done

  if [ $ready -eq 0 ]; then
    log "WARN: API not ready within 60s, restarting..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
done

if [ $ready -eq 0 ]; then
  log "ERROR: API failed all ${MAX_RETRIES} attempts."
fi

if [ "$USE_NGINX" = true ]; then
  log "Starting nginx..."
  nginx -g "daemon off;"
else
  log "Serving API directly on PORT=${PORT:-3000}..."
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  API_PORT="${PORT:-3000}"
  exec node dist/server.js
fi
