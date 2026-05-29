#!/bin/bash
# This script starts the micro server and exits
# The server runs as a daemon process
cd /home/z/my-project
nohup python3 micro-server.py > micro-server.log 2>&1 &
echo $! > server.pid
echo "Server started with PID $(cat server.pid)"
# Exit immediately to free up shell PID
exit 0
