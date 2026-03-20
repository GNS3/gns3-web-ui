#!/usr/bin/env node

/**
 * Cross-platform script to create symlink for @babel/runtime
 * This script runs after yarn install to ensure the build process works correctly.
 *
 * See: docs/babel-runtime-build-error.md
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'node_modules', '@angular-devkit', 'build-angular', 'node_modules', '@babel');
const targetPath = path.join(targetDir, 'runtime');
const sourcePath = path.join(__dirname, '..', 'node_modules', '@babel', 'runtime');

console.log('Ensuring @babel/runtime symlink exists...');

try {
  // Create the @babel directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✓ Created directory: ${targetDir}`);
  }

  // Remove existing symlink or directory
  if (fs.existsSync(targetPath)) {
    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink() || stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`✓ Removed existing: ${targetPath}`);
    }
  }

  // Create the symlink
  fs.symlinkSync(sourcePath, targetPath, 'dir');
  console.log(`✓ Created symlink: ${targetPath} → ${sourcePath}`);

  // Verify the symlink works
  const regeneratorValues = path.join(targetPath, 'helpers', 'esm', 'regeneratorValues.js');
  if (fs.existsSync(regeneratorValues)) {
    console.log('✓ Symlink verified: regeneratorValues.js is accessible');
    console.log('✓ Build process should work correctly');
  } else {
    console.warn('⚠ Warning: regeneratorValues.js not found. Build may fail.');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Error creating symlink:', error.message);
  console.error('Note: On Windows, you may need to run Terminal as Administrator');
  console.error('      or enable Developer Mode to create symlinks.');
  process.exit(1);
}
