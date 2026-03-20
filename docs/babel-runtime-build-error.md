# Babel Runtime Build Error - Troubleshooting Guide

## Problem Description

When building the GNS3 Web UI project, you may encounter the following error:

```
Error: /path/to/project/node_modules/d3/node_modules/d3-array/src/merge.js: Cannot find module
'/path/to/project/node_modules/@angular-devkit/build-angular/node_modules/@babel/runtime/helpers/esm/regeneratorValues'
```

This error occurs during the Angular build process when Webpack's Babel loader attempts to compile certain dependencies.

## Root Cause

The issue stems from a dependency chain involving security patches:

```
ngx-markdown
  └─ mermaid
     └─ dagre-d3-es@7.0.13 (security patch version)
        └─ d3@^7.9.0
           └─ node_modules/d3-array/src/merge.js
              └─ Requires Babel compilation
                 └─ Needs @babel/runtime/helpers/esm/regeneratorValues
```

### Why This Happens

1. **Security Patch**: The project uses `dagre-d3-es@7.0.13` (upgraded from 7.0.9) to fix **CVE-2025-57347**

2. **Nested Dependencies**: `dagre-d3-es@7.0.13` depends on `d3@7.9.0`, which contains nested `d3-array` and other D3 sub-packages in its internal `node_modules/`

3. **Source Compilation**: These nested D3 packages include source files (`.js` in `src/` directories) that need to be compiled by Babel

4. **Missing Helpers**: Angular Devkit's Babel configuration expects `@babel/runtime` helpers to be available in a specific location (`@angular-devkit/build-angular/node_modules/@babel/runtime`)

5. **Version Mismatch**: The default `@babel/runtime` version (7.18.9) doesn't include `regeneratorValues.js`, which was added in later versions (7.21.0+)

### Why the Problem Was Hidden Initially

You might wonder: "Why did the build work before I deleted `node_modules`?"

This is due to **Yarn's caching mechanism** and the **security patch timeline**:

| Timeline | Event |
|----------|-------|
| Before March 14 | Project used `dagre-d3-es@7.0.9` with `d3@^7.8.2` - everything worked |
| March 14 | Security patch applied: `dagre-d3-es` upgraded to `7.0.13` (fixes CVE-2025-57347) |
| After patch | `package.json` was updated, but `node_modules` still contained old packages |
| Initial builds | Used cached/old dependencies - build appeared to work (false sense of security) |
| Deleted node_modules | Forced fresh dependency resolution → new `d3@7.9.0` installed → Babel compilation triggered → error revealed |

**Key insights:**

1. **Fast install times** (e.g., 9.33 seconds) indicate Yarn is using cached dependencies, not re-downloading

2. **Stale dependencies**: After updating `package.json`'s `resolutions`, the existing `node_modules` may still contain old package versions

3. **Version differences**:
   - `dagre-d3-es@7.0.9` → `d3@^7.8.2` (may have precompiled files)
   - `dagre-d3-es@7.0.13` → `d3@^7.9.0` (includes source files requiring compilation)

4. **The "hidden bomb"**: Security patches can introduce build-breaking changes that don't manifest immediately

**Best Practice:**
After applying security patches or modifying `package.json`'s `resolutions`, always run:
```bash
rm -rf node_modules yarn.lock
yarn install
```

This ensures dependencies are properly updated and any build issues are revealed immediately, not later when a team member does a fresh install.

## Solution

### Step 1: Upgrade @babel/runtime

Add the latest version of `@babel/runtime` to your devDependencies:

```bash
yarn add @babel/runtime@latest --dev
```

This installs version 7.29.2, which includes the required `regeneratorValues.js` helper.

### Step 2: Add Resolution to package.json

Add `@babel/runtime` to the `resolutions` field in `package.json` to ensure version consistency:

```json
{
  "resolutions": {
    "dompurify": "3.3.3",
    "dagre-d3-es": "7.0.13",
    "@babel/runtime": "^7.29.2"
  }
}
```

### Step 3: Create Symbolic Link

Create a symbolic link so Angular Devkit can find the `@babel/runtime` helpers:

```bash
mkdir -p node_modules/@angular-devkit/build-angular/node_modules/@babel
ln -sf ../../../../@babel/runtime node_modules/@angular-devkit/build-angular/node_modules/@babel/runtime
```

**Important**: This symbolic link needs to be recreated **every time** you run `rm -rf node_modules` and reinstall dependencies.

### Step 4: Automate Symlink Creation (Recommended)

To avoid manually recreating the symlink after every `node_modules` cleanup, use the provided cross-platform Node.js script.

The project includes `scripts/ensure-babel-runtime-link.js` which:
- Works on Linux, macOS, and Windows
- Automatically removes old symlinks/directories before creating new ones
- Verifies the symlink is working correctly

Update the `postinstall` script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "ngcc --properties es2020 browser module main --first-only --create-ivy-entry-points --tsconfig \"./src/tsconfig.app.json\" && ngcc --properties es2020 browser module main --first-only --create-ivy-entry-points --tsconfig \"./src/tsconfig.app.json\" && node scripts/ensure-babel-runtime-link.js"
  }
}
```

**Note for Windows Users:**
- On Windows, creating symbolic links requires Administrator privileges or Developer Mode
- If you see "Access Denied" errors, either:
  - Run Terminal/Command Prompt as Administrator, or
  - Enable Developer Mode (Settings → Update & Security → For developers → Use developer features)
- Alternatively, you can run the script manually after each `yarn install`:
  ```bash
  node scripts/ensure-babel-runtime-link.js
  ```

## Verification

After applying the fix, verify the build works:

```bash
yarn build
```

You should see a successful build output similar to:

```
✔ Browser application bundle generation complete.
✔ Copying assets complete.
✔ Index html generation complete.

Initial Chunk Files | Names         |  Raw Size
vendor.js           | vendor        |  11.00 MB |
main.js             | main          |   5.84 MB |
styles.css          | styles        | 562.38 kB |
polyfills.js        | polyfills     | 125.39 kB |
runtime.js          | runtime       |   6.63 kB |

Build at: 2026-03-18T15:11:53.005Z - Hash: 16680b9e191b0da7 - Time: 10219ms

Done in 11.45s.
```

## Related Security Patches

This build error is related to security patches applied to the project. See commit `272bf48d` for details:

- **dompurify**: 2.4.3 → 3.3.3 (fixes CVE-2024-47875, CVE-2024-45801, WS-2024-0017, CVE-2025-26791)
- **dagre-d3-es**: 7.0.9 → 7.0.13 (addresses CVE-2025-57347)

These packages are indirect dependencies via `ngx-markdown` → `mermaid`.

## Common Warnings

You may see these warnings during installation. They are **normal and can be ignored**:

```
warning Resolution field "dagre-d3-es@7.0.13" is incompatible with requested version "dagre-d3-es@7.0.9"
warning Resolution field "dompurify@3.3.3" is incompatible with requested version "dompurify@2.4.3"
```

These warnings appear because we're intentionally overriding versions to use secure packages.

## Additional Notes

### Why d3-ng2-service is Kept

The project includes `d3-ng2-service@2.2.0` in dependencies, which provides D3 v5 sub-packages. This is necessary because:

1. The `cartography` module uses D3 v5 APIs (e.g., `d3.event`, `d3.mouse`)
2. These APIs were removed in D3 v6+
3. `d3-ng2-service` ensures D3 v5 packages are available, even though the service itself is not directly used

### Why Not Upgrade D3?

Upgrading the cartography module to use D3 v7 APIs would require:
- Migrating from `d3.event` to event parameters
- Replacing `d3.mouse()` with `d3.pointer()`
- Updating 10+ files in the cartography module

This is a significant refactoring effort that can be deferred by keeping `d3-ng2-service`.

## Troubleshooting

### Error persists after symlink creation

1. Verify the symlink exists:
   ```bash
   ls -la node_modules/@angular-devkit/build-angular/node_modules/@babel/runtime
   ```

2. Check that `regeneratorValues.js` exists:
   ```bash
   ls node_modules/@angular-devkit/build-angular/node_modules/@babel/runtime/helpers/esm/regeneratorValues.js
   ```

3. Verify the symlink points to the correct location:
   ```bash
   readlink -f node_modules/@angular-devkit/build-angular/node_modules/@babel/runtime
   ```
   Should output: `/path/to/project/node_modules/@babel/runtime`

### Error returns after cleaning node_modules

This is expected behavior. The symlink is removed when you delete `node_modules`. Reinstall dependencies and recreate the symlink, or use the automated postinstall script (recommended).

### Version conflict errors

If you see errors about version conflicts, ensure `@babel/runtime` is added to both:
- `devDependencies` in package.json
- `resolutions` field in package.json

Then run:
```bash
rm -rf node_modules yarn.lock
yarn install
```

## References

- Original security fix commit: `272bf48d`
- Babel plugin-transform-runtime: https://babel.dev/docs/babel-plugin-transform-runtime
- D3 v6 changelog (API changes): https://github.com/d3/d3/blob/main/CHANGES.md#changes-in-d3-60

---

**Last Updated**: 2026-03-18
**Maintained By**: GNS3 Development Team
