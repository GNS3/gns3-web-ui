#!/bin/bash

# Performance Benchmark Script for Angular Migration
# Usage: ./benchmark.sh [output-file]

OUTPUT_FILE="${1:-benchmark-results.txt}"

echo "========================================="
echo "  Angular Performance Benchmark"
echo "  Date: $(date)"
echo "========================================="
echo ""

# Clean build
echo "Running clean build..."
npm run build 2>&1 | tee /tmp/build-output.txt

echo ""
echo "========================================="
echo "  Build Results"
echo "========================================="

# Extract bundle sizes
echo ""
echo "Bundle Sizes:"
grep -E "^\s+\w+\.js" /tmp/build-output.txt | head -10

# Extract build time
echo ""
echo "Build Time:"
grep -E "Build at:|Time:" /tmp/build-output.txt | tail -1

# Extract total size
echo ""
echo "Total Bundle Size:"
grep -E "Initial total" /tmp/build-output.txt

# Save results
echo ""
echo "Saving results to $OUTPUT_FILE..."
{
  echo "========================================="
  echo "  Performance Benchmark Results"
  echo "  Date: $(date)"
  echo "========================================="
  echo ""
  echo "Bundle Sizes:"
  grep -E "^\s+\w+\.js" /tmp/build-output.txt | head -10
  echo ""
  echo "Build Time:"
  grep -E "Build at:|Time:" /tmp/build-output.txt | tail -1
  echo ""
  echo "Total Bundle Size:"
  grep -E "Initial total" /tmp/build-output.txt
} > "$OUTPUT_FILE"

echo ""
echo "Benchmark complete! Results saved to $OUTPUT_FILE"
