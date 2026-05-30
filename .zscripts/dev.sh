#!/bin/bash
# GWS Platform V2 — Custom Dev Script
# Used by /start.sh to initialize and start the platform
# This replaces the default `bun run dev` which uses too many PIDs

set -e
cd /home/z/my-project

echo "[DEV] Installing dependencies..."
bun install

echo "[DEV] Setting up database..."
bun run db:push 2>/dev/null || true

echo "[DEV] Building Next.js application..."
bun run build

echo "[DEV] Fetching API data from Prisma..."
mkdir -p api-data

# Start the Next.js server temporarily to fetch data
UV_THREADPOOL_SIZE=1 NODE_ENV=production timeout 15 node node_modules/.bin/next start -p 3099 -H 127.0.0.1 > /dev/null 2>&1 &
TEMP_PID=$!
sleep 5

# Fetch all API endpoints
for ep in dashboard clients projects workflows spatial field-sync ai finance documents communications approvals events organizations reports users roles permissions; do
    curl -s --max-time 5 http://127.0.0.1:3099/api/$ep > api-data/$ep.json 2>/dev/null || echo "{}" > api-data/$ep.json
done

# Kill the temporary server
kill $TEMP_PID 2>/dev/null || true
wait $TEMP_PID 2>/dev/null || true

echo "[DEV] Starting lightweight Python server..."
exec python3 micro-server.py
