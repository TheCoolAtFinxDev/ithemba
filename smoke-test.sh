#!/bin/bash
echo "Running smoke tests..."
curl -sf http://localhost:3000/api > /dev/null && echo "✅ API alive" || echo "❌ API down"
echo "Smoke tests complete"