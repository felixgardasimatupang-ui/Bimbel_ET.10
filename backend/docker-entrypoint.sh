#!/bin/sh
set -e

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

echo "Seeding initial data..."
npx tsx prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo "Starting server..."
node dist/server.js
