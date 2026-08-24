#!/bin/bash
echo "Running smoke tests..."
sleep 2

failed=0

check() {
  local name="$1" url="$2"
  if curl -sf "$url" > /dev/null; then
    echo "✅ $name alive"
  else
    echo "❌ $name down"
    failed=1
  fi
}

check "API"     http://localhost:3000/api
check "Health"  http://localhost:3000/api/health
check "Swagger" http://localhost:3000/api/docs

echo "Smoke tests complete"
exit $failed
