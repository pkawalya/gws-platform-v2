#!/bin/bash
# GWS Platform V2 — Server Startup Script
# Starts the lightweight Python micro-server
cd /home/z/my-project

# Kill any existing server
pkill -f "micro-server.py" 2>/dev/null
sleep 1

# Start the server
nohup python3 micro-server.py > micro-server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > server.pid

# Wait and verify
sleep 2
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ GWS Platform V2 server started (PID: $SERVER_PID)"
else
    echo "❌ Server failed to start"
fi
