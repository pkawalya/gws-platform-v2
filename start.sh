#!/bin/bash
export NODE_ENV=production
export UV_THREADPOOL_SIZE=2
export PORT=3000
export HOSTNAME=0.0.0.0
exec node --max-old-space-size=256 /home/z/my-project/node_modules/.bin/next start -p 3000 -H 0.0.0.0
