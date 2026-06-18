#!/bin/sh

export DATABASE_URL_DIRECT="${DATABASE_URL_DIRECT:-$DATABASE_URL}"
API_PORT="${API_PORT:-3001}"

# Railway sets $PORT dynamically for the outward-facing port
if [ -n "$PORT" ]; then
  sed -i "s/listen  *3000;/listen ${PORT};/" /etc/nginx/http.d/default.conf
fi

echo "Syncing database schema..."
npx prisma db push --accept-data-loss || echo "DB push skipped (will retry at next deploy)"

echo "Seeding initial data..."
npx tsx prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo "Starting API server on port ${API_PORT}..."
node dist/server.js &

echo "Waiting for API to be ready..."
for i in $(seq 1 15); do
  if wget -q --spider "http://localhost:${API_PORT}/api/health" 2>/dev/null; then
    echo "API is ready on port ${API_PORT}"
    break
  fi
  sleep 1
done

echo "Starting nginx..."
nginx -g "daemon off;"