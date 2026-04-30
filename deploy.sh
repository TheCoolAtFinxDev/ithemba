#!/bin/bash
set -e
echo "🚀 Building API..."
cd ~/ithemba
npx nx build api --skip-nx-cache
echo "🔄 Restarting API..."
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
pm2 restart ithemba-api --update-env
sleep 3
echo "🧪 Running smoke tests..."
bash smoke-test.sh
echo "✅ Deploy complete"