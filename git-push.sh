#!/bin/bash
MESSAGE=${1:-"chore: update"}
cd ~/ithemba
git add -A
git commit -m "$MESSAGE"
GIT_ASKPASS="" SSH_ASKPASS="" git push
echo "✅ Pushed: $MESSAGE"