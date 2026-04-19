<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md). 


# Hardcoded Color Protection Mechanism

**Version**: 1.0.0
**Last Updated**: 2026-03-31
**Status**: Enforced

## Overview

The hardcoded color protection system prevents code quality degradation by enforcing strict standards on color usage across the codebase. It combines automated checks with integrity protection to ensure quality standards cannot be bypassed.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Protection Layers                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │   Script    │    │ Pre-commit   │    │       CI        │   │
│  │ Self-Check  │───▶│   Warning    │───▶│  Label Check   │   │
│  └─────────────┘    └──────────────┘    └─────────────────┘   │
│         │                   │                     │             │
│         ▼                   ▼                     ▼             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │   SHA256    │    │  Interactive │    │  hooks-update   │   │
│  │  Verify     │    │  Confirmation │    │     Label       │   │
│  └─────────────┘    └──────────────┘    └─────────────────┘   │
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

### Layer 1: Script Self-Integrity (SHA256)

**Purpose**: Prevents script modification
**Mechanism**: SHA256 checksum verification
**Behavior**: Fails immediately if script is tampered with

**Workflow**:
```
Script runs → Calculates SHA256 → Compares with stored checksum
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
              Match ✓                        Mismatch ✗
                    │                                 │
              Continue                     Exit with error
```

**Files Involved**:
- `.husky/check-hardcoded-colors.sh` (main script)
- `.husky/check-hardcoded-colors.sh.sha256` (checksum)

### Layer 2: Pre-commit Interactive Warning

**Purpose**: Prevents accidental hook modifications
**Mechanism**: Detects `.husky/` changes in staged files
**Behavior**: Requires explicit confirmation before proceeding

**User Experience**:
```
Developer: git commit
           ↓
Pre-commit: ⚠️ WARNING: Modifying git hooks!
           These files protect code quality:
             - .husky/pre-commit
             - .husky/check-hardcoded-colors.sh
           Press Enter to continue, Ctrl+C to cancel
           ↓
Developer: [Presses Enter]
           ↓
Commit proceeds
```

### Layer 3: CI Label Requirement

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

## Configuration Structure

The allowed hardcoded colors are stored in a structured JSON file:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-03-31",
  "description": "Allowed hardcoded colors in legacy graphics rendering code",
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

### Scenario 2: Modifying Check Script

```
1. Edit .husky/check-hardcoded-colors.sh
   ↓
2. Update checksum:
   sha256sum .husky/check-hardcoded-colors.sh > .husky/check-hardcoded-colors.sh.sha256
   ↓
3. Test: .husky/check-hardcoded-colors.sh --ci
   ↓
4. Commit with --no-verify (first time)
   ↓
5. Push and create PR
   ↓
6. Add 'hooks-update' label
   ↓
7. Get approval and merge
```

## Security Benefits

| Protection | Against | Mechanism |
|------------|---------|-----------|
| Script self-check | Tampering, AI modifications | SHA256 verification |
| Pre-commit warning | Accidental changes | Interactive confirmation |
| CI label check | Unauthorized PRs | Required approval label |
| Config separation | Direct script editing | JSON file |

## Error Messages

### Script Integrity Failed
```
❌ ERROR: Script integrity check failed!
   Expected SHA256: abc123...
   Current SHA256:  def456...

   To update this script:
   1. Get approval from maintainers
   2. Run: sha256sum .husky/check-hardcoded-colors.sh > .husky/check-hardcoded-colors.sh.sha256
   3. Update allowed-hardcoded-colors.json if needed
```

### CI Label Missing
```
❌ ERROR: Modifying git hooks requires the 'hooks-update' label

To proceed:
  1. Add the 'hooks-update' label to this PR
  2. Get approval from maintainers
```

## Maintenance

### Regular Tasks
- Review `allowed-hardcoded-colors.json` quarterly
- Remove obsolete entries as code is refactored
- Document new exceptions with clear reasons

### Emergency Override
For urgent fixes requiring bypass:
```bash
git commit --no-verify
```
Use sparingly and document the reason.

## Related Documentation

- [Hardcoded Color Inventory](hardcoded-colors-inventory.md) - List of all current violations
- [Material 3 Variables](02-material3-variables.md) - Theme system reference
- [CSS Standards](../README.md) - Overall coding standards

## Summary

This protection system ensures code quality standards remain effective even with:
- AI-assisted development
- Multiple contributors
- Large codebase evolution

The multi-layer approach makes it difficult to bypass checks accidentally or intentionally, while still allowing authorized updates through a clear process.

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
