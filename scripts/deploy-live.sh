#!/bin/bash
# Publish NEXX Oracle → GitHub Pages (free, custom domain later)
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "=== NEXX Oracle deploy ==="

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub not logged in. Run: gh auth login"
  echo "Then re-run: $0"
  exit 1
fi

git add -A
if ! git diff --cached --quiet 2>/dev/null || [[ -n "$(git status -s)" ]]; then
  git commit -m "Deploy NEXX Oracle site" || true
fi

git branch -M main
git push -u origin main --force-with-lease

echo "Enabling GitHub Pages…"
gh api -X POST "repos/JoshNexx9/nexx-oracle/pages" \
  -f build_type=legacy \
  -f 'source[branch]=main' \
  -f 'source[path]=/' 2>/dev/null || \
gh api -X PUT "repos/JoshNexx9/nexx-oracle/pages" \
  -f build_type=legacy \
  -f 'source[branch]=main' \
  -f 'source[path]=/' 2>/dev/null || true

SITE="https://joshnexx9.github.io/nexx-oracle/"
echo ""
echo "Published (may take 1–3 min to build):"
echo "  $SITE"
echo ""
echo "Custom domain later: GitHub repo → Settings → Pages → Custom domain"
echo "Or use Netlify/Cloudflare — point DNS CNAME to your host."