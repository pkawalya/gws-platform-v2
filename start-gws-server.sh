#!/bin/bash
cd /home/z/my-project
while true; do
    node gws-server.js
    echo "[$(date)] Server crashed, restarting in 2s..." >> gws-server-crash.log
    sleep 2
done
