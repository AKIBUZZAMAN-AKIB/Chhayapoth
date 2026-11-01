#!/usr/bin/env bash
# Run on the owner's machine after `gh auth login`; never paste a token into this file.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v gh >/dev/null || { echo 'Install GitHub CLI first: https://cli.github.com'; exit 1; }
gh auth status >/dev/null
repo='AKIBUZZAMAN-AKIB/Chhayapoth'
# Differentiate missing repository from permission/network failures before creating anything.
status="$(gh api -i "repos/$repo" 2>/dev/null | head -1 || true)"
if [[ "$status" == *'404'* ]]; then
  gh repo create "$repo" --public --description 'Bangla-first agentic workspace for learning and everyday organisation'
elif [[ "$status" != *'200'* ]]; then
  echo "Repository check failed. Verify account access before continuing." >&2; exit 1
fi
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -b main
  git add .
  git commit -m 'Implement Chhayapoth alpha workspace and validated domain tools'
fi
url="https://github.com/$repo.git"
if git remote get-url origin >/dev/null 2>&1; then
  [[ "$(git remote get-url origin)" == "$url" ]] || { echo 'Origin differs; refusing to overwrite it.'; exit 1; }
else git remote add origin "$url"; fi
git push -u origin main
printf '\nSource pushed. Configure signing secrets before tagging a stable signed release.\n'
