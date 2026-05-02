#!/usr/bin/env bash
# Check for hardcoded colors in SCSS, TS, and HTML files
# Only allows hardcoded colors in specific whitelisted variable names from _map.scss
# and in existing legacy code lines defined in allowed-hardcoded-colors.json
CONFIG_FILE="$(dirname -- "$0")/allowed-hardcoded-colors.json"

# Check config file exists
check_config_exists() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ ERROR: Config file not found: $CONFIG_FILE"
    exit 1
  fi

  # Check if config file is valid JSON
  if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo "❌ ERROR: Config file is not valid JSON: $CONFIG_FILE"
    exit 1
  fi
}

# Load allowed colors from config
load_allowed_colors() {
  ALLOWED_PATTERNS=()

  while IFS='|' read -r file pattern; do
    ALLOWED_PATTERNS+=("$file|$pattern")
  done < <(jq -r '.allowed_colors[] | "\(.file)|\(.patterns[])"' "$CONFIG_FILE")
}

# Load allowed SCSS variables from config
load_allowed_scss_variables() {
  ALLOWED_VARIABLES=()

  while IFS= read -r var; do
    ALLOWED_VARIABLES+=("$var")
  done < <(jq -r '.allowed_scss_variables[].variables[]' "$CONFIG_FILE")
}

# Patterns to always exclude (comments, color-mix function, false positives)
EXCLUDE_PATTERNS=(
  "// "
  "/\*"
  "in srgb"
  "#acesSort"      # HTML template ID, not a color
  "#acesPaginator" # HTML template ID, not a color
)

# Check if a violation is in the allowed list
is_allowed_violation() {
  local file="$1"
  local content="$2"

  for allowed in "${ALLOWED_PATTERNS[@]}"; do
    IFS='|' read -r allowed_file allowed_pattern <<< "$allowed"
    if [ "$file" = "$allowed_file" ]; then
      # Check if the allowed pattern is in the current line
      if echo "$content" | grep -qF "$allowed_pattern"; then
        return 0  # Found match
      fi
    fi
  done
  return 1  # Not found
}

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

    # If not an allowed variable, check if it's in the allowed violations list
    if [ "$is_allowed_var" = false ]; then
      # Extract colors from the line
      local colors=$(echo "$content" | grep -oE '#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\)' | sort -u)
      while IFS= read -r color; do
        # Check if this file + line content is in the allowed list
        if ! is_allowed_violation "$file" "$content"; then
          violations="$violations$file:$line_num: $color\n"
          violations="$violations  Line: $content\n"
        fi
      done <<< "$colors"
    fi
  done < <(grep -rnE '(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))' "$file" 2>/dev/null)

  echo -e "$violations"
}

# Main
check_config_exists
load_allowed_colors
load_allowed_scss_variables

if [ "$1" = "--ci" ]; then
  # CI mode: check all files, fail on violations
  echo "🔍 Checking for hardcoded colors..."
  all_violations=""
  for file in $(find src -name "*.scss" -o -name "*.ts" -o -name "*.html" | grep -v node_modules | grep -v ".spec.ts" | grep -v "index.html" | grep -v "theme.service.ts"); do
    all_violations="$all_violations$(check_file "$file")"
  done

  if [ -n "$all_violations" ]; then
    echo "❌ FAIL: New hardcoded colors found (use --mat-sys-* or var(--gns3-*) variables)"
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
    echo "⚠️  Existing legacy hardcoded colors are defined in:"
    echo "   .husky/allowed-hardcoded-colors.json"
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
    echo "⚠️  WARNING: New hardcoded colors found in staged files"
    echo "   Please use --mat-sys-* or var(--gns3-*) CSS variables instead"
    echo -e "$all_violations"
    echo "💡 Styles should be in .scss files, NOT in .ts or .html files!"
    echo "⚠️  Existing legacy hardcoded colors are defined in:"
    echo "   .husky/allowed-hardcoded-colors.json"
    echo "💡 If intentional, use 'git commit --no-verify' to bypass"
  fi
  exit 0
fi
