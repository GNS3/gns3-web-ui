#!/usr/bin/env bash
# Check for hardcoded colors in SCSS, TS, and HTML files
# Only allows hardcoded colors in specific whitelisted variable names from _map.scss

# Whitelist of variable names that are allowed to use hardcoded colors
# (extracted from src/styles/_map.scss)
ALLOWED_VARIABLES=(
  "--gns3-map-bg-auto"
  "--gns3-map-bg-light"
  "--gns3-map-bg-dark"
  "--gns3-map-bg-light-1"
  "--gns3-map-bg-light-2"
  "--gns3-map-bg-light-3"
  "--gns3-map-bg-light-4"
  "--gns3-map-bg-dark-1"
  "--gns3-map-bg-dark-2"
  "--gns3-map-bg-dark-3"
  "--gns3-map-bg-dark-4"
  "--gns3-map-bg"
  "--gns3-canvas-label-color"
  "--gns3-canvas-link-color"
  "--gns3-grid-drawing-color"
  "--gns3-grid-node-color"
)

# Patterns to always exclude (comments, color-mix function)
EXCLUDE_PATTERNS=(
  "// "
  "/\*"
  "in srgb"
)

check_file() {
  local file="$1"
  local violations=""

  # Find all lines with hex colors
  while IFS= read -r line; do
    local line_num=$(echo "$line" | cut -d: -f1)
    local content=$(echo "$line" | cut -d: -f2-)

    # Check if line matches any general exclude pattern
    local should_exclude=false
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
      if echo "$content" | grep -qF "$pattern"; then
        should_exclude=true
        break
      fi
    done
    [ "$should_exclude" = true ] && continue

    # Check if line contains an allowed variable definition (SCSS only)
    local is_allowed_var=false
    if [[ "$file" == *.scss ]]; then
      for var in "${ALLOWED_VARIABLES[@]}"; do
        # Match: --gns3-xxx: (any content including colors)
        if echo "$content" | grep -qE -- "${var}:"; then
          is_allowed_var=true
          break
        fi
      done
    fi

    # If not an allowed variable, extract and report colors
    if [ "$is_allowed_var" = false ]; then
      local colors=$(echo "$content" | grep -oE '#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\)' | sort -u)
      while IFS= read -r color; do
        violations="$violations$file:$line_num: $color\n"
      done <<< "$colors"
    fi
  done < <(grep -rnE '(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))' "$file" 2>/dev/null)

  echo -e "$violations"
}

# Main
if [ "$1" = "--ci" ]; then
  # CI mode: check all files, fail on violations
  echo "🔍 Checking for hardcoded colors..."
  all_violations=""
  for file in $(find src -name "*.scss" -o -name "*.ts" -o -name "*.html" | grep -v node_modules | grep -v ".spec.ts" | grep -v "index.html" | grep -v "theme.service.ts"); do
    all_violations="$all_violations$(check_file "$file")"
  done

  if [ -n "$all_violations" ]; then
    echo "❌ FAIL: Hardcoded colors found (use --mat-sys-* or var(--gns3-*) variables)"
    echo -e "$all_violations"
    echo ""
    echo "💡 Allowed:"
    echo "   - Material theme variables: --mat-sys-primary, --mat-sys-surface, etc."
    echo "   - GNS3 map variables: var(--gns3-map-bg-*)"
    echo "   - Canvas variables: var(--gns3-canvas-*)"
    echo ""
    echo "   Only these specific variables can use hardcoded colors:"
    for var in "${ALLOWED_VARIABLES[@]}"; do
      echo "   - $var"
    done
    echo ""
    echo "📝 Styles should be in .scss files, NOT in .ts or .html files!"
    exit 1
  else
    echo "✅ No hardcoded colors found"
    exit 0
  fi
else
  # Pre-commit mode: check staged files, warn only
  STAGED_SCSS=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep "^src/.*\.scss$" || true)
  STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep "^src/.*\.ts$" || true)
  STAGED_HTML=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep "^src/.*\.html$" || true)

  if [ -z "$STAGED_SCSS" ] && [ -z "$STAGED_TS" ] && [ -z "$STAGED_HTML" ]; then
    exit 0
  fi

  all_violations=""
  for file in $STAGED_SCSS $STAGED_TS $STAGED_HTML; do
    all_violations="$all_violations$(check_file "$file")"
  done

  if [ -n "$all_violations" ]; then
    echo "⚠️  WARNING: Hardcoded colors found in staged files"
    echo "   Please use --mat-sys-* or var(--gns3-*) CSS variables instead"
    echo -e "$all_violations"
    echo "💡 Styles should be in .scss files, NOT in .ts or .html files!"
    echo "💡 If intentional, use 'git commit --no-verify' to bypass"
  fi
  exit 0
fi
