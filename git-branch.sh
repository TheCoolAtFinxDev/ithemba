#!/bin/bash
BRANCH=${1:-"feature/new"}
cd ~/ithemba
git checkout -b "$BRANCH"
echo "✅ On branch: $BRANCH"
