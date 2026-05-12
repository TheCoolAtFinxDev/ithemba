#!/bin/bash
echo "Running smoke tests..."
sleep 2
curl -sf http://localhost:3000/api > /dev/null && echo "✅ API alive" || echo "❌ API down"
curl -sf http://localhost:3000/api/docs > /dev/null && echo "✅ Swagger alive" || echo "❌ Swagger down"
echo "Smoke tests complete"