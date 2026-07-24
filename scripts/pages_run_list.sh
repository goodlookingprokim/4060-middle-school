#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LIMIT="${1:-5}"

WORKFLOW_FILE=""
while IFS= read -r file; do
  if rg -q "actions/deploy-pages@|pages:[[:space:]]*write" "$file"; then
    WORKFLOW_FILE="$(basename "$file")"
    break
  fi
done < <(find "$SITE_ROOT/.github/workflows" -maxdepth 1 -type f \( -name "*.yml" -o -name "*.yaml" \) | sort)

if [[ -z "$WORKFLOW_FILE" ]]; then
  echo "No GitHub Pages workflow file found under .github/workflows" >&2
  exit 1
fi

echo "Using workflow: $WORKFLOW_FILE" >&2
cd "$SITE_ROOT"
exec gh run list --workflow "$WORKFLOW_FILE" --limit "$LIMIT"
