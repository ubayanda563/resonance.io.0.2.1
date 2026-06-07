#!/usr/bin/env bash
set -euo pipefail

echo "Removing node_modules and package-lock.json (if present)"
rm -rf node_modules package-lock.json

echo "Installing dependencies with npm (using --legacy-peer-deps)"
npm install --legacy-peer-deps

echo "Starting frontend"
npm start
