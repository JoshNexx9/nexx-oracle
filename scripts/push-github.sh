#!/bin/bash
# One-time push to GitHub (run after: gh auth login  OR  git credential setup)
set -e
cd "$(dirname "$0")/.."
git branch -M main 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/JoshNexx9/nexx-oracle.git
git push -u origin main
echo "Done → https://github.com/JoshNexx9/nexx-oracle"