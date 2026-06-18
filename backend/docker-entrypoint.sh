#!/bin/sh
set -e

export DATABASE_URL_DIRECT="${DATABASE_URL_DIRECT:-$DATABASE_URL}"

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

echo "Seeding initial data..."
npx tsx prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo "Starting API server..."
node dist/server.js &

echo "Waiting for API to be ready..."
for i in $(seq 1 15); do
  if wget -q --spider http://localhost:3001/api/health 2>/dev/null; then
    echo "API is ready on port 3001"
    break
  fi
  sleep 1
done

echo "Starting nginx..."
nginx -g "daemon off;"