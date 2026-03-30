#!/usr/bin/env bash
# Local CI Standards Check
# Simulates the CI workflow checks on all files

set -e

echo "🔍 Running Standards check (All Files)..."
echo ""

FAILED=0

# Check for ::ng-deep in SCSS
echo "Checking for ::ng-deep in SCSS..."
FOUND=$(grep -r "::ng-deep" --include="*.scss" src/ 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: ::ng-deep found in SCSS files"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No ::ng-deep found"
fi
echo ""

# Check for !important in SCSS
echo "Checking for !important in SCSS..."
FOUND=$(grep -rn "!important" --include="*.scss" src/ 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: !important found in SCSS files"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No !important found"
fi
echo ""

# Check for ViewEncapsulation.None
echo "Checking for ViewEncapsulation.None..."
FOUND=$(grep -rn "ViewEncapsulation.None" --include="*.ts" src/ 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: ViewEncapsulation.None found"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No ViewEncapsulation.None found"
fi
echo ""

# Check for zone.js imports (exclude test.ts)
echo "Checking for zone.js imports..."
FOUND=$(grep -rn "zone.js" --include="*.ts" src/ 2>/dev/null | grep -v "test.ts" || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: zone.js import found"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No zone.js imports found"
fi
echo ""

# Check for NgZone usage
echo "Checking for NgZone usage..."
FOUND=$(grep -rn "NgZone" --include="*.ts" src/ 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: NgZone found"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No NgZone found"
fi
echo ""

# Check for Zone.run usage (exclude comments)
echo "Checking for Zone.run usage..."
FOUND=$(grep -rn "Zone.run" --include="*.ts" src/ 2>/dev/null | grep -v "//" | grep -v "/\*" || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: Zone.run found"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No Zone.run found"
fi
echo ""

# Check for ApplicationRef.tick usage
echo "Checking for ApplicationRef.tick usage..."
FOUND=$(grep -rn "ApplicationRef.tick" --include="*.ts" src/ 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  echo "❌ FAIL: ApplicationRef.tick found"
  echo "$FOUND"
  FAILED=1
else
  echo "✅ PASS: No ApplicationRef.tick found"
fi
echo ""

# Check for hardcoded colors (WARNING only)
echo "Checking for hardcoded colors..."
FOUND=$(grep -rnE "#[0-9A-Fa-f]{3,6};" --include="*.scss" src/ 2>/dev/null | grep -v "// " | grep -v "/\*" | grep -v "http" || true)
if [ -n "$FOUND" ]; then
  echo "⚠️  WARNING: Potential hardcoded colors found (use --mat-sys-* variables)"
  echo "$FOUND"
else
  echo "✅ PASS: No hardcoded colors found"
fi
echo ""

# Check Angular lint
echo "Running Angular lint..."
if yarn ng lint 2>&1; then
  echo "✅ PASS: Angular lint passed"
else
  echo "⚠️  WARNING: Angular lint failed (may need ESLint migration)"
fi
echo ""

if [ $FAILED -eq 1 ]; then
  echo "❌ Standards Check FAILED"
  exit 1
else
  echo "✅ All Standards Checks PASSED"
  exit 0
fi
