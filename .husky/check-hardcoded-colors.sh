#!/usr/bin/env bash
# Check for hardcoded colors in SCSS, TS, and HTML files
# Only allows hardcoded colors in specific whitelisted variable names from _map.scss
# and in existing legacy code lines (to prevent new violations)

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

# Existing legacy code lines that are allowed to have hardcoded colors
# Format: "file_path|exact_line_content_with_color"
# These are graphics rendering code (D3.js, factories) that use hardcoded colors
EXISTING_VIOLATIONS=(
  "src/app/cartography/components/text-editor/text-editor.component.ts|: '#000000'"
  "src/app/cartography/components/text-editor/text-editor.component.ts|this.renderer.setStyle(temporaryTextElement.nativeElement, 'color', '#000000');"
  "src/app/cartography/helpers/drawings-factory/ellipse-element-factory.ts|ellipseElement.fill = '#ffffff';"
  "src/app/cartography/helpers/drawings-factory/ellipse-element-factory.ts|ellipseElement.stroke = '#000000';"
  "src/app/cartography/helpers/drawings-factory/line-element-factory.ts|lineElement.stroke = '#000000';"
  "src/app/cartography/helpers/drawings-factory/rectangle-element-factory.ts|rectElement.fill = '#ffffff';"
  "src/app/cartography/helpers/drawings-factory/rectangle-element-factory.ts|rectElement.stroke = '#000000';"
  "src/app/cartography/helpers/drawings-factory/text-element-factory.ts|textElement.fill = '#000000';"
  "src/app/cartography/helpers/font-bbox-calculator.ts|element.setAttribute('fill', '#00000');"
  "src/app/cartography/widgets/links/ethernet-link.ts|color: '#000000',"
  "src/app/cartography/widgets/links/serial-link.ts|color: '#800000',"
  "src/app/cartography/widgets/interface-status.ts|LABEL_BACKGROUND_COLOR = '#E2E8FF'"
  "src/app/cartography/widgets/interface-status.ts|.attr('fill', '#111111')"
  "src/app/cartography/widgets/interface-status.ts|.attr('fill', '#2ecc71')"
  "src/app/cartography/widgets/interface-status.ts|.attr('fill', '#FFFF00')"
  "src/app/cartography/widgets/interface-status.ts|return '#2ecc71'"
  "src/app/cartography/widgets/interface-status.ts|return '#FFFF00'"
  "src/app/cartography/widgets/drawing-line.ts|.attr('stroke', '#000')"
  "src/app/cartography/widgets/drawing.ts|.attr('fill', \`#ffffff\`)"
  "src/app/cartography/widgets/node.ts|.attr('fill', \`#ffffff\`)"
  "src/app/components/project-map/drawings-editors/style-editor/style-editor.component.ts|stroke = this.element.stroke ?? '#000000'"
  "src/app/components/project-map/drawings-editors/text-editor/text-editor.component.ts|: '#000000'"
  "src/app/components/project-map/drawings-editors/link-style-editor/link-style-editor.component.ts|link.link_type === 'serial' ? '#800000' : '#000000'"
)

# Patterns to always exclude (comments, color-mix function, false positives)
EXCLUDE_PATTERNS=(
  "// "
  "/\*"
  "in srgb"
  "#acesSort"      # HTML template ID, not a color
  "#acesPaginator" # HTML template ID, not a color
)

# Check if a violation is in the existing legacy list
is_existing_violation() {
  local file="$1"
  local content="$2"

  for existing in "${EXISTING_VIOLATIONS[@]}"; do
    IFS='|' read -r ex_file ex_content <<< "$existing"
    if [ "$file" = "$ex_file" ]; then
      # Check if the existing content pattern is in the current line
      if echo "$content" | grep -qF "$ex_content"; then
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

    # If not an allowed variable, check if it's an existing violation
    if [ "$is_allowed_var" = false ]; then
      # Extract colors from the line
      local colors=$(echo "$content" | grep -oE '#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\)' | sort -u)
      while IFS= read -r color; do
        # Check if this file + line content is in the existing violations list
        if ! is_existing_violation "$file" "$content"; then
          violations="$violations$file:$line_num: $color\n"
          violations="$violations  Line: $content\n"
        fi
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
    echo "⚠️  Existing legacy hardcoded colors are allowed, but new ones are not."
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
    echo "⚠️  Existing legacy hardcoded colors are allowed, but new ones are not."
    echo "💡 If intentional, use 'git commit --no-verify' to bypass"
  fi
  exit 0
fi
