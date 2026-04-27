<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md).


# Hardcoded Color Protection Mechanism

**Version**: 2.0.0
**Last Updated**: 2026-04-26
**Status**: Enforced

## Overview

The hardcoded color protection system prevents code quality degradation by enforcing strict standards on color usage across the codebase. It combines automated pre-commit checks with CI validation to ensure quality standards cannot be bypassed.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Protection Layers                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐              ┌─────────────────┐             │
│  │  Pre-commit  │─────────────▶│       CI        │             │
│  │   Warning    │              │  Label Check   │             │
│  └──────────────┘              └─────────────────┘             │
│         │                              │                        │
│         ▼                              ▼                        │
│  ┌──────────────┐              ┌─────────────────┐             │
│  │  Interactive │              │  hooks-update   │             │
│  │ Confirmation │              │     Label       │             │
│  └──────────────┘              └─────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Configuration File    │
              │  (allowed-hardcoded-     │
              │   colors.json)          │
              └─────────────────────────┘
```

## Protection Layers

### Layer 1: Pre-commit Interactive Warning

**Purpose**: Prevents accidental hook modifications
**Mechanism**: Detects `.husky/` changes in staged files
**Behavior**: Requires explicit confirmation before proceeding

**User Experience**:
```
Developer: git commit
           ↓
Pre-commit: ⚠️  WARNING: Modifying git hooks!
           These files protect code quality standards:
             - .husky/pre-commit
             - .husky/check-hardcoded-colors.sh
           These changes require:
             1. Team lead approval
             2. Update allowed-hardcoded-colors.json if needed
           If this is intentional, press Enter to continue.
           Press Ctrl+C to cancel.
           ↓
Developer: [Presses Enter]
           ↓
Commit proceeds
```

**Implementation**: `.husky/pre-commit` (lines 6-24)

### Layer 2: CI Label Requirement

**Purpose**: Prevents unauthorized hook changes via PR
**Mechanism**: Checks for `hooks-update` label on PRs
**Behavior**: CI fails if label missing when `.husky/` files changed

**Pull Request Flow**:
```
┌──────────────────┐
│  Create PR with  │
│  .husky/ changes │
└────────┬─────────┘
         │
         ▼
    ┌─────────┐
    │   CI    │
    │  Check  │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
 Has Label  No Label
    │         │
    ▼         ▼
  Pass      Fail ✗
```

**Implementation**: `.github/workflows/main.yml` (lines 121-149)

## Configuration Structure

The allowed hardcoded colors are stored in a structured JSON file:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-03-31",
  "description": "Allowed hardcoded colors in legacy graphics rendering code. DO NOT modify without proper review.",
  "allowed_colors": [
    {
      "file": "path/to/file.ts",
      "patterns": ["code pattern 1", "code pattern 2"],
      "reason": "Why this is allowed"
    }
  ]
}
```

**Key Attributes**:
- **file**: Path to the source file
- **patterns**: Array of code snippets containing hardcoded colors
- **reason**: Documentation explaining why the exception exists

## What Gets Checked

### File Types
- ✓ SCSS stylesheets
- ✓ TypeScript files
- ✓ HTML templates

### Color Formats Detected
- Hex colors: `#RGB`, `#RRGGBB`, `#RRGGBBAA`
- RGB/RGBA: `rgb(r, g, b)`, `rgba(r, g, b, a)`

### Allowed Exceptions

**1. Material Design 3 Variables (SCSS only)**
```scss
--gns3-map-bg-auto: #ffffff;
```

**2. Graphics Rendering Code (Legacy)**
- Cartography D3.js components
- Drawing element factories
- Interface status widgets
- Drawing editors

**3. False Positives**
- HTML IDs: `#acesSort`, `#acesPaginator`
- Comments: `// #000000`
- Color-mix functions: `color-mix(in srgb, ...)`

## Update Workflow

> 📖 **Quick Guide**: For step-by-step instructions, see [How to Add Hardcoded Colors](how-to-add-hardcoded-colors.md)

### Scenario 1: Adding New Allowed Color

```
1. Edit .husky/allowed-hardcoded-colors.json
   ↓
2. Add entry with file, patterns, and reason
   ↓
3. Test: .husky/check-hardcoded-colors.sh --ci
   ↓
4. Commit (triggers warning, confirm)
   ↓
5. Push and create PR
   ↓
6. Add 'hooks-update' label
   ↓
7. Get approval and merge
```

### Scenario 2: Modifying Check Script or Hooks

```
1. Edit .husky/check-hardcoded-colors.sh or other hook files
   ↓
2. Test: .husky/check-hardcoded-colors.sh --ci
   ↓
3. Commit (triggers warning, confirm)
   ↓
4. Push and create PR
   ↓
5. Add 'hooks-update' label
   ↓
6. Get approval and merge
```

## Security Benefits

| Protection | Against | Mechanism |
|------------|---------|-----------|
| Pre-commit warning | Accidental changes | Interactive confirmation |
| CI label check | Unauthorized PRs | Required approval label |
| Config separation | Direct script editing | JSON file |
| Git version control | Script tampering | Version history and diff |

## Error Messages

### Pre-commit Warning
```
⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️
You are modifying git hooks and quality check scripts!

These files protect code quality standards:
  - .husky/pre-commit
  - .husky/check-hardcoded-colors.sh

These changes require:
  1. Team lead approval
  2. Update allowed-hardcoded-colors.json if needed

If this is intentional, press Enter to continue.
Press Ctrl+C to cancel.
```

### CI Label Missing
```
❌ ERROR: Modifying git hooks requires the 'hooks-update' label

To proceed:
  1. Add the 'hooks-update' label to this PR
  2. Get approval from maintainers
```

### Hardcoded Color Check Failed
```
❌ FAIL: New hardcoded colors found (use --mat-sys-* or var(--gns3-*) variables)

src/app/components/my-component/my.component.scss:15: #ff0000
  Line: color: #ff0000;

💡 Allowed:
   - Material theme variables: --mat-sys-primary, --mat-sys-surface, etc.
   - GNS3 map variables: var(--gns3-map-bg-*)
   - Canvas variables: var(--gns3-canvas-*)

📝 Styles should be in .scss files, NOT in .ts or .html files!
⚠️  Existing legacy hardcoded colors are defined in:
   .husky/allowed-hardcoded-colors.json
```

## Maintenance

### Regular Tasks
- Review `allowed-hardcoded-colors.json` quarterly
- Remove obsolete entries as code is refactored
- Document new exceptions with clear reasons
- Monitor CI for failed hooks-update checks

### Emergency Override
For urgent fixes requiring bypass:
```bash
git commit --no-verify
```
Use sparingly and document the reason.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-04-26 | Removed inaccurate SHA256 description, updated to reflect actual two-layer protection mechanism |
| 1.0.0 | 2026-03-31 | Initial version (included inaccurate SHA256 description) |

## Related Documentation

- [Hardcoded Color Inventory](hardcoded-colors-inventory.md) - List of all current violations
- [Protection Investigation Report](hardcoded-color-protection-investigation-2026-04-26.md) - Detailed verification of protection mechanism
- [Material 3 Variables](02-material3-variables.md) - Theme system reference
- [CSS Standards](../README.md) - Overall coding standards

## Summary

This protection system ensures code quality standards remain effective even with:
- AI-assisted development
- Multiple contributors
- Large codebase evolution

The two-layer approach (Pre-commit + CI) makes it difficult to bypass checks accidentally or intentionally, while still allowing authorized updates through a clear process. Git's version control provides additional protection against script tampering.

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
