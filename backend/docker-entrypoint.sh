#!/bin/sh

log() { echo "[entrypoint] $*"; }

export DATABASE_URL_DIRECT="${DATABASE_URL_DIRECT:-$DATABASE_URL}"
API_PORT="${API_PORT:-3001}"

log "API_PORT=${API_PORT}"

if [ -n "$PORT" ]; then
  log "Updating nginx listen to PORT=${PORT}"
  sed -i "s/listen  *3000;/listen ${PORT};/" /etc/nginx/http.d/default.conf
fi

log "Updating nginx proxy_pass to API_PORT=${API_PORT}"
sed -i "s/__API_PORT__/${API_PORT}/g" /etc/nginx/http.d/default.conf

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
  log "ERROR: API failed all ${MAX_RETRIES} attempts. Starting nginx anyway..."
fi

log "Starting nginx..."
nginx -g "daemon off;"
