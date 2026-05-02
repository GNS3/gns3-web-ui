<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md).


# How to Add Hardcoded Colors

**Last Updated**: 2026-04-27

> 📖 **Background**: For protection mechanism details, see [Hardcoded Color Protection Mechanism](hardcoded-color-protection.md)

---

## Quick Steps

```bash
# 1. Verify detection
.husky/check-hardcoded-colors.sh --ci

# 2. Edit config
nano .husky/allowed-hardcoded-colors.json

# 3. Verify pass
.husky/check-hardcoded-colors.sh --ci

# 4. Commit (confirm warning)
git add .husky/allowed-hardcoded-colors.json
git commit -m "docs: add hardcoded color exception"

# 5. Push and create PR with hooks-update label
git push
```

---

## Config Format

All hardcoded color exceptions are configured in `.husky/allowed-hardcoded-colors.json`

### Format 1: SCSS CSS Variables
For defining new CSS variables with hardcoded colors in SCSS files:

```json
{
  "file": "src/styles/_map.scss",
  "variables": [
    "--gns3-my-new-variable",
    "--gns3-another-variable"
  ],
  "reason": "Brief explanation of why these variables need hardcoded colors"
}
```

Add to the `allowed_scss_variables` array in the config file.

### Format 2: TS/HTML Hardcoded Colors
For hardcoded colors directly used in TypeScript or HTML:

```json
{
  "file": "src/app/path/to/file.ts",
  "patterns": [".attr('fill', '#ff0000')"],
  "reason": "Brief explanation"
}
```

Add to the `allowed_colors` array in the config file.

**Important**: `patterns` must match code exactly (including quotes, spaces)

**Supports**: `.ts`, `.html`, `.scss` files (SCSS CSS variable definitions use Format 1)

---

## File Type Rules

### TypeScript (.ts)
All hardcoded colors require exceptions in config file.

| Code | Pattern |
|------|---------|
| `.attr('fill', '#fff')` | `.attr('fill', '#fff')` |
| `color = '#000000'` | `color = '#000000'` |
| `STATUS = '#2ecc71'` | `STATUS = '#2ecc71'` |

### SCSS (.scss)

#### Defining CSS Variables with Hardcoded Colors

**✅ Allowed** (19 predefined variables in `src/styles/_map.scss`):
```scss
--gns3-map-bg-auto: #ffffff;
--gns3-canvas-label-color: #000000;
--gns3-lock-badge-locked-color: #ff1744;
```

**Full allowed variable list**:
- `--gns3-map-bg-auto`
- `--gns3-map-bg-light`
- `--gns3-map-bg-dark`
- `--gns3-map-bg-light-1/2/3/4`
- `--gns3-map-bg-dark-1/2/3/4`
- `--gns3-map-bg`
- `--gns3-canvas-label-color`
- `--gns3-canvas-link-color`
- `--gns3-grid-drawing-color`
- `--gns3-grid-node-color`
- `--gns3-lock-badge-locked-color`
- `--gns3-lock-badge-unlocked-color`
- `--gns3-lock-badge-outline-color`

**To add new CSS variables**:
```bash
# 1. Define in SCSS
echo "  --gns3-my-variable: #ff0000;" >> src/styles/_map.scss

# 2. Add to config
nano .husky/allowed-hardcoded-colors.json
```

```json
{
  "file": "src/styles/_map.scss",
  "variables": ["--gns3-my-variable"],
  "reason": "My specific use case"
}
```

Add this object to the `allowed_scss_variables` array.

#### Direct Hardcoded Colors in SCSS (Not Recommended)

**❌ Detected** (requires config exception):
```scss
.test { color: #ff0000; }        // Detected
--my-var: #00ff00;               // Detected (unless in allowed_scss_variables)
```

**To add exception** (rare, prefer CSS variables):
```json
{
  "file": "src/app/styles/_custom.scss",
  "patterns": [".custom { color: #ff0000; }"],
  "reason": "Specific reason why CSS variable cannot be used"
}
```

Add this object to the `allowed_colors` array.

### HTML (.html)
All hardcoded colors require exceptions in config file.

**❌ Detected**:
```html
<div style="color: #ff0000;">...</div>
```

**✅ Allowed**:
```html
<div [style.color]="'var(--mat-sys-primary)'">...</div>
<div id="acesSort">...</div>  <!-- HTML IDs excluded -->
```

**To add exception** (if absolutely necessary):
```json
{
  "file": "src/app/components/my-component/my-component.component.html",
  "patterns": ["<div style=\"color: #ff0000;\">"],
  "reason": "Specific reason why CSS variable cannot be used"
}
```

**Auto-excluded patterns**:
- HTML IDs: `#acesSort`, `#acesPaginator`
- Comments: `// #000000`
- `color-mix()` functions

---

## Detection Summary

| Format | Detected |
|--------|----------|
| `#RGB`, `#RRGGBB`, `#RRGGBBAA` | ✅ Yes |
| `rgb(r, g, b)`, `rgba(r, g, b, a)` | ✅ Yes |
| SCSS predefined variables | ❌ No (allowed) |
| HTML IDs | ❌ No (excluded) |

---

## Related Docs

- [Hardcoded Color Protection Mechanism](hardcoded-color-protection.md)
- [Hardcoded Colors Inventory](hardcoded-colors-inventory.md)

---

## License

CC BY-SA 4.0
