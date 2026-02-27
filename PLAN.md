# Angular Upgrade Plan: 14 → 19/20

## Current Status

- **Current Version**: Angular 14.3.0
- **Target Version**: Angular 19 or 20
- **Upgrade Strategy**: Incremental major version upgrades
- **Branch**: `feat/remove-electron-and-upgrade-angular`

## Overview

This document outlines the step-by-step plan to upgrade GNS3 Web UI from Angular 14 to Angular 19/20. We will upgrade one major version at a time to ensure stability and catch issues early.

---

## Phase 1: Angular 14 → 15

### Prerequisites
- Node.js 14.15.x or later (recommended: 16.x or 18.x)

### Package Updates

#### Core Angular Packages
```json
"@angular/animations": "^15.2.0",
"@angular/common": "^15.2.0",
"@angular/compiler": "^15.2.0",
"@angular/core": "^15.2.0",
"@angular/forms": "^15.2.0",
"@angular/platform-browser": "^15.2.0",
"@angular/platform-browser-dynamic": "^15.2.0",
"@angular/router": "^15.2.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^15.2.0",
"@angular/material": "^15.2.0"
```

#### Dev Dependencies
```json
"@angular-devkit/build-angular": "^15.2.0",
"@angular/cli": "^15.2.0",
"@angular/compiler-cli": "^15.2.0",
"@angular/language-service": "^15.2.0",
"typescript": "~4.8.4"
```

#### Other Dependencies
```json
"rxjs": "^7.5.0",
"zone.js": "^0.12.0"
```

### Breaking Changes to Address

1. **TypeScript 4.8+ Required** - Update type definitions
2. **RxJS 7 Required** - Remove `rxjs-compat`, update RxJS operators
3. **Zone.js 0.12.x** - Update zone.js configuration
4. **Angular Material Changes** - Check for deprecated component APIs
5. **Standalone Components** - New feature (optional to adopt)
6. **Router migrations** - Check for router configuration changes

### Upgrade Method Assessment

#### Current Project Status
- **Current Angular Version**: 14.3.0
- **Current TypeScript**: 4.6.4
- **Current RxJS**: 6.6.7 (with rxjs-compat)
- **Current Zone.js**: 0.11.5
- **Current Node.js**: v24.13.0 ✅ (Meets Angular 15 requirements)

#### Angular 15 Requirements
- **Node.js**: ^14.20.0 || ^16.13.0 || ^18.10.0
- **TypeScript**: ~4.8.2
- **RxJS**: ^6.5.3 || ^7.4.0

#### ✅ Recommended: Use `ng update` for Migration

**Why use `ng update`:**
1. **Automated Migration Scripts** - Angular 15 provides built-in migration schematics that handle many breaking changes automatically
2. **Lower Risk** - Official tool that has been thoroughly tested
3. **Time Saving** - Automates most of the tedious update work
4. **Version Consistency** - Ensures all related packages are coordinated

**Two-Step Upgrade Process:**

**Step 1: Update Angular Core**
```bash
ng update @angular/core @angular/cli --from 14 --to 15
```
This will automatically:
- Update dependencies in package.json
- Run migration schematics
- Update TypeScript to 4.8.x
- Handle most breaking changes

**Step 2: Update Angular Material**
```bash
ng update @angular/material @angular/cdk --from 14 --to 15
```
This will run Material-specific migrations

#### ⚠️ Manual Changes Required

Even with `ng update`, these items need manual attention:

**1. RxJS 6 → 7 Upgrade (Critical)**
```json
// Remove from package.json
"rxjs-compat": "^6.6.7"  // ❌ Delete this

// Update rxjs
"rxjs": "^7.5.0"  // ✅ Upgrade to 7.x
```
RxJS 7 removed many deprecated APIs. The `rxjs-compat` package is for backward compatibility and is no longer needed in RxJS 7.

**2. Zone.js Upgrade**
```json
"zone.js": "^0.12.0"  // Update from 0.11.5
```

**3. Third-Party Dependency Compatibility**
Verify these packages for Angular 15 compatibility:
- `angular-draggable-droppable` (6.1.0) - Check for updates
- `angular-resizable-element` (3.4.0) - Verify compatibility
- `ng-circle-progress` (1.6.0) - May need replacement
- `ng2-file-upload` (3.0.0) - Check Angular 15+ support
- `ngx-device-detector` (4.0.1) - Verify compatibility
- `d3-ng2-service` (2.2.0) - Check for updates

**4. Expected Common Issues**
- RxJS operator import errors (mostly auto-fixed by ng update)
- Angular Material component API changes
- TypeScript type errors (TypeScript 4.8 has stricter typing)

#### Complete Upgrade Workflow

```bash
# 1. Create backup branch
git checkout -b upgrade/angular-14-to-15

# 2. Clean dependencies
rm -rf node_modules yarn.lock

# 3. Update Angular core
ng update @angular/core @angular/cli --from 14 --to 15

# 4. Manually edit package.json: remove rxjs-compat, update rxjs to ^7.5.0

# 5. Update Angular Material
ng update @angular/material @angular/cdk --from 14 --to 15

# 6. Reinstall dependencies
yarn install

# 7. Build and check for errors
ng build

# 8. Run tests
ng test

# 9. Fix linting
ng lint --fix

# 10. Format code
yarn prettier:write
```

#### Risk Assessment
**Risk Level: Medium**
- Angular 14→15 is a relatively smooth upgrade
- Most changes can be handled automatically by ng update
- Main effort is in RxJS upgrade and third-party dependency verification

### Migration Steps

1. Update all Angular packages to 15.2.x
2. Run `ng update @angular/core @angular/cli --from 14 --to 15 --migrate-only`
3. Update TypeScript to 4.8.4
4. Update RxJS to 7.x and remove rxjs-compat
5. Update zone.js to 0.12.x
6. Update Angular Material/CDK to 15.2.x
7. Run `ng update @angular/material --from 14 --to 15 --migrate-only`
8. Fix compilation errors
9. Run tests and fix failures
10. Build and verify

### Estimated Effort
- Time: 2-4 hours
- Risk: Medium

---

## Phase 2: Angular 15 → 16

### Prerequisites
- Node.js 16.14.x or later (recommended: 18.x)

### Package Updates

#### Core Angular Packages
```json
"@angular/animations": "^16.2.0",
"@angular/common": "^16.2.0",
"@angular/compiler": "^16.2.0",
"@angular/core": "^16.2.0",
"@angular/forms": "^16.2.0",
"@angular/platform-browser": "^16.2.0",
"@angular/platform-browser-dynamic": "^16.2.0",
"@angular/router": "^16.2.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^16.2.0",
"@angular/material": "^16.2.0"
```

#### Dev Dependencies
```json
"@angular-devkit/build-angular": "^16.2.0",
"@angular/cli": "^16.2.0",
"@angular/compiler-cli": "^16.2.0",
"typescript": "~5.1.3"
```

### Breaking Changes to Address

1. **TypeScript 5.1+ Required** - Significant type system changes
2. **Required Inputs** - New syntax for required component inputs
3. **Router** - New router configuration options
4. **Forms** - Typed forms feature (optional migration)
5. **Angular Material** - MDC-based components replaced
6. **Build system** - esbuild-based builder (optional)

### Migration Steps

1. Update all Angular packages to 16.2.x
2. Run `ng update @angular/core @angular/cli --from 15 --to 16 --migrate-only`
3. Update TypeScript to 5.1.x
4. Update Angular Material/CDK to 16.2.x
5. Run Material migrations
6. Fix compilation errors (especially type errors)
7. Run tests and fix failures
8. Build and verify

### Estimated Effort
- Time: 3-5 hours
- Risk: Medium-High

---

## Phase 3: Angular 16 → 17

### Prerequisites
- Node.js 18.13.x or later
- Angular 17 requires newer build system

### Package Updates

#### Core Angular Packages
```json
"@angular/animations": "^17.3.0",
"@angular/common": "^17.3.0",
"@angular/compiler": "^17.3.0",
"@angular/core": "^17.3.0",
"@angular/forms": "^17.3.0",
"@angular/platform-browser": "^17.3.0",
"@angular/platform-browser-dynamic": "^17.3.0",
"@angular/router": "^17.3.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^17.3.0",
"@angular/material": "^17.3.0"
```

#### Dev Dependencies
```json
"@angular-devkit/build-angular": "^17.3.0",
"@angular/cli": "^17.3.0",
"@angular/compiler-cli": "^17.3.0",
"typescript": "~5.2.2"
```

### Breaking Changes to Address

1. **TypeScript 5.2+ Required**
2. **New Control Flow Syntax** - `@if`, `@for`, `@switch` replacing `*ngIf`, `*ngFor`
3. **Standalone Components** - Now the default approach
4. **Signals** - New reactive primitive (optional migration)
5. **Build system** - esbuild becomes default
6. **Angular Material** - CDK changes and deprecations

### Migration Steps

1. Update all Angular packages to 17.3.x
2. Run `ng update @angular/core @angular/cli --from 16 --to 17 --migrate-only`
3. Update TypeScript to 5.2.x
4. Update Angular Material/CDK to 17.3.x
5. Run Material migrations
6. **Critical**: Migrate to new control flow syntax (automated migration available)
7. Consider migrating to standalone components
8. Fix compilation errors
9. Run tests and fix failures
10. Build and verify

### Estimated Effort
- Time: 5-8 hours
- Risk: High (control flow syntax changes)

---

## Phase 4: Angular 17 → 18

### Prerequisites
- Node.js 18.19.1 or later (recommended: 20.x)

### Package Updates

#### Core Angular Packages
```json
"@angular/animations": "^18.2.0",
"@angular/common": "^18.2.0",
"@angular/compiler": "^18.2.0",
"@angular/core": "^18.2.0",
"@angular/forms": "^18.2.0",
"@angular/platform-browser": "^18.2.0",
"@angular/platform-browser-dynamic": "^18.2.0",
"@angular/router": "^18.2.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^18.2.0",
"@angular/material": "^18.2.0"
```

#### Dev Dependencies
```json
"@angular-devkit/build-angular": "^18.2.0",
"@angular/cli": "^18.2.0",
"@angular/compiler-cli": "^18.2.0",
"typescript": "~5.4.2"
```

### Breaking Changes to Address

1. **TypeScript 5.4+ Required**
2. **Zone.js optimization** - Zoneless experimental feature available
3. **Signals enhancements** - More mature signals API
4. **Deferred loading** - New block syntax
5. **Angular Material** - Component updates and deprecations
6. **Build optimizations** - esbuild improvements

### Migration Steps

1. Update all Angular packages to 18.2.x
2. Run `ng update @angular/core @angular/cli --from 17 --to 18 --migrate-only`
3. Update TypeScript to 5.4.x
4. Update Angular Material/CDK to 18.2.x
5. Run Material migrations
6. Fix compilation errors
7. Run tests and fix failures
8. Build and verify

### Estimated Effort
- Time: 2-4 hours
- Risk: Medium

---

## Phase 5: Angular 18 → 19

### Prerequisites
- Node.js 20.11.1 or later

### Package Updates

#### Core Angular Packages
```json
"@angular/animations": "^19.0.0",
"@angular/common": "^19.0.0",
"@angular/compiler": "^19.0.0",
"@angular/core": "^19.0.0",
"@angular/forms": "^19.0.0",
"@angular/platform-browser": "^19.0.0",
"@angular/platform-browser-dynamic": "^19.0.0",
"@angular/router": "^19.0.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^19.0.0",
"@angular/material": "^19.0.0"
```

#### Dev Dependencies
```json
"@angular-devkit/build-angular": "^19.0.0",
"@angular/cli": "^19.0.0",
"@angular/compiler-cli": "^19.0.0",
"typescript": "~5.5.x"
```

### Breaking Changes to Address

1. **TypeScript 5.5+ Required**
2. **Enhanced Signals** - More features and stability
3. **Standalone by default** - Modules fully deprecated
4. **Angular Material** - Major component updates
5. **Performance improvements** - Build and runtime optimizations

### Migration Steps

1. Update all Angular packages to 19.0.x
2. Run `ng update @angular/core @angular/cli --from 18 --to 19 --migrate-only`
3. Update TypeScript to 5.5.x
4. Update Angular Material/CDK to 19.0.x
5. Run Material migrations
6. Migrate remaining modules to standalone (if any)
7. Fix compilation errors
8. Run tests and fix failures
9. Build and verify

### Estimated Effort
- Time: 3-5 hours
- Risk: Medium

---

## Phase 6 (Optional): Angular 19 → 20

### Prerequisites
- Node.js 20.11.1 or later

### Package Updates

#### Core Angular Packages
```json
"@angular/animations": "^20.0.0",
"@angular/common": "^20.0.0",
"@angular/compiler": "^20.0.0",
"@angular/core": "^20.0.0",
"@angular/forms": "^20.0.0",
"@angular/platform-browser": "^20.0.0",
"@angular/platform-browser-dynamic": "^20.0.0",
"@angular/router": "^20.0.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^20.0.0",
"@angular/material": "^20.0.0"
```

#### Dev Dependencies
```json
"@angular-devkit/build-angular": "^20.0.0",
"@angular/cli": "^20.0.0",
"@angular/compiler-cli": "^20.0.0",
"typescript": "~5.6.x"
```

### Migration Steps

1. Update all Angular packages to 20.0.x
2. Run `ng update @angular/core @angular/cli --from 19 --to 20 --migrate-only`
3. Update TypeScript to 5.6.x
4. Update Angular Material/CDK to 20.0.x
5. Fix compilation errors
6. Run tests and fix failures
7. Build and verify

### Estimated Effort
- Time: 2-4 hours
- Risk: Low-Medium

---

## Common Migration Commands

### Before Each Upgrade
```bash
# Create a feature branch
git checkout -b upgrade/angular-X-to-Y

# Clean install
rm -rf node_modules package-lock.json yarn.lock
npm install
# or
yarn install
```

### During Upgrade
```bash
# Run Angular migrations
ng update @angular/core @angular/cli --from X --to Y --migrate-only

# Run Material migrations
ng update @angular/material --from X --to Y --migrate-only

# Check for issues
ng build
ng test
```

### After Each Upgrade
```bash
# Fix linting issues
ng lint --fix

# Run prettier
yarn prettier:write

# Commit changes
git add .
git commit -m "feat: upgrade to Angular Y"
```

---

## Testing Checklist After Each Phase

- [ ] Project builds successfully (`ng build`)
- [ ] Production build succeeds (`ng build --configuration=production`)
- [ ] All unit tests pass (`ng test`)
- [ ] No TypeScript compilation errors
- [ ] No ESLint/TSLint warnings
- [ ] Application starts without errors
- [ ] Manual testing of key features
- [ ] Check for console warnings/errors

---

## Third-Party Dependencies to Watch

These packages may need updates during Angular upgrades:

- `angular-draggable-droppable` - Check Angular version compatibility
- `angular-resizable-element` - Check for updates
- `ng-circle-progress` - May need replacement or update
- `ng2-file-upload` - Check for Angular 15+ support
- `ngx-device-detector` - Check for updates
- `d3-ng2-service` - Verify compatibility
- `xterm` - Should be compatible but verify

---

## Rollback Plan

If any upgrade phase fails critically:

1. Revert to previous commit
2. Create issue documenting the failure
3. Research specific breaking change causing issue
4. Attempt upgrade again with fix in place
5. Consider staying on previous version if blocker is critical

---

## Timeline Estimate

- **Phase 1 (14→15)**: 2-4 hours
- **Phase 2 (15→16)**: 3-5 hours
- **Phase 3 (16→17)**: 5-8 hours
- **Phase 4 (17→18)**: 2-4 hours
- **Phase 5 (18→19)**: 3-5 hours
- **Phase 6 (19→20)**: 2-4 hours

**Total Estimated Time**: 17-30 hours

---

## References

- [Angular Update Guide](https://update.angular.io/)
- [Angular Changelog](https://github.com/angular/angular/blob/main/CHANGELOG.md)
- [Angular Material Changelog](https://github.com/angular/components/blob/main/CHANGELOG.md)
- [RxJS Migration Guide](https://rxjs-dev.firebaseapp.com/guide/v6/migration)
- [Angular Blog](https://blog.angular.io/)
