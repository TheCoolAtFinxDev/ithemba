#!/bin/bash
set -e
cd ~/ithemba
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)

echo "🚀 Building API..."
npx nx build api --skip-nx-cache

echo "🗄️  Applying database migrations..."
npx prisma migrate deploy

echo "🔄 Restarting API..."
pm2 restart ithemba-api --update-env
sleep 3

echo "🧪 Running smoke tests..."
bash smoke-test.sh
echo "✅ Deploy complete"