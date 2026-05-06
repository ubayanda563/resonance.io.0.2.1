#!/bin/bash
set -e

echo "Cleaning up .venv-1 from git index..."
git rm -r --cached .venv-1

echo "Staging .gitignore update..."
git add .gitignore

echo "Creating commit..."
git commit -m "Remove .venv-1 from repo index and add to gitignore"

echo "Done! Your push should now succeed."
echo "To push: git push origin main"
