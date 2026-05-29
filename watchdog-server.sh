#!/bin/bash
# GWS Platform V2 — Server Watchdog
# Restarts the micro server if it dies
while true; do
    if ! pgrep -f "micro-server.py" > /dev/null; then
        cd /home/z/my-project
        python3 micro-server.py >> micro-server.log 2>&1 &
        echo "$(date): Server restarted with PID $!" >> watchdog.log
    fi
    sleep 30
done
