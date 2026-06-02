#!/bin/bash
# GWS Platform V2 - GitHub Push Script
# 
# This script pushes the latest changes to GitHub.
# You need a GitHub Personal Access Token with "repo" scope.
#
# HOW TO GET A TOKEN:
# 1. Go to https://github.com/settings/tokens
# 2. Click "Generate new token (classic)"
# 3. Select "repo" scope
# 4. Copy the token
#
# USAGE:
#   ./push-to-github.sh YOUR_TOKEN
#

TOKEN=${1:-}
if [ -z "$TOKEN" ]; then
  echo "❌ Error: GitHub token required"
  echo "Usage: ./push-to-github.sh ghp_your_token_here"
  echo ""
  echo "Get a token from: https://github.com/settings/tokens"
  exit 1
fi

cd /home/z/my-project || exit 1

# Set remote with token
git remote set-url origin "https://${TOKEN}@github.com/pkawalya/gws-platform-v2.git"

# Push
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed to GitHub!"
  # Remove token from remote URL for security
  git remote set-url origin https://github.com/pkawalya/gws-platform-v2.git
else
  echo "❌ Push failed. Check your token and try again."
  git remote set-url origin https://github.com/pkawalya/gws-platform-v2.git
fi
