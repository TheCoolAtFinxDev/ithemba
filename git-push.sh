#!/bin/bash
MESSAGE=${1:-"chore: update"}
cd ~/ithemba
git add -A
git commit -m "$MESSAGE"
GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="" git push
echo "✅ Pushed: $MESSAGE"
