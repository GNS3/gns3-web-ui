# Vitest Testing Environment Configuration

> Documentation of Vitest setup for Angular 21 Zoneless testing in GNS3 Web UI.

**Last Updated**: 2026-04-02
**Angular Version**: 21.0.0
**Testing Framework**: Vitest 4.1.2
**Change Detection**: Zoneless

---

## Overview

This document describes the Vitest testing environment configuration for the GNS3 Web UI project. The project uses **Angular 21 Zoneless** architecture with **Vitest** as the default test runner, replacing the legacy Karma + Jasmine setup.

---

## Architecture

### Testing Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **Vitest** | 4.1.2 | Test runner |
| **jsdom** | 29.0.1 | DOM emulation |
| **@angular/build:unit-test** | 21.2.5 | Angular test builder |
| **Angular** | 21.0.0 | Framework (Zoneless) |

### Key Design Decisions

1. **No Custom Vitest Config**: The `@angular/build:unit-test` builder handles all Angular-specific configuration
2. **Minimal Dependencies**: Only `vitest` and `jsdom` are required
3. **Zoneless by Default**: All tests run with Zoneless change detection
4. **Native Integration**: Uses Angular CLI's `ng test` command instead of direct Vitest execution

---

## Installation

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^4.1.2",
    "jsdom": "^29.0.1"
  }
}
```

### Installation Commands

```bash
# Install Vitest and jsdom
yarn add -D vitest jsdom

# Or if migrating from Karma
yarn remove karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core
```

---

## Configuration Files

### 1. angular.json

The test builder configuration in `angular.json`:

```json
{
  "projects": {
    "gns3-web-ui": {
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "buildTarget": "gns3-web-ui:build:development",
            "tsConfig": "src/tsconfig.spec.json",
            "setupFiles": ["src/test-setup.ts"]
          }
        }
      }
    }
  }
}
```

**Key Points**:
- Uses `@angular/build:unit-test` builder
- Specifies `buildTarget` to use development build configuration
- `setupFiles` points to global test setup file
- No custom `vitest.config.ts` needed (Angular CLI handles it)

### 2. src/test-setup.ts

Global test setup for Zoneless change detection:

```typescript
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

// Configure global Zoneless providers
TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
});

console.log('✓ Test setup loaded for Angular 21 Zoneless testing');
```

**Important Notes**:
- Do NOT call `TestBed.initTestEnvironment()` - Angular CLI does this automatically
- Only configure global providers here
- Zoneless provider is essential for Angular 21 Zoneless applications

### 3. package.json Scripts

Test scripts in `package.json`:

```json
{
  "scripts": {
    "test": "ng test",
    "test:run": "ng test --watch=false"
  }
}
```

**Usage**:
- `yarn test` - Run tests in watch mode
- `yarn test:run` - Run tests once (CI mode)

### 4. tsconfig.base.json

Clean TypeScript configuration for testing:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

**Removed** (no longer needed):
- `jasmine`, `jest`, `mocha` types - Legacy test framework types

### 5. src/tsconfig.spec.json

Test-specific TypeScript configuration:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../out-tsc/spec",
    "baseUrl": "./",
    "paths": {
      "@components/*": ["app/components/*"],
      "@services/*": ["app/services/*"],
      "@resolvers/*": ["app/resolvers/*"],
      "@filters/*": ["app/filters/*"],
      "@models/*": ["app/models/*"],
      "@utils/*": ["app/utils/*"]
    },
    "types": ["node"]
  },
  "include": [
    "**/*.spec.ts",
    "**/*.d.ts",
    "test-setup.ts"
  ]
}
```

---

## Path Aliases

The project uses path aliases configured in both `tsconfig.spec.json` and Vitest:

| Alias | Resolves to |
|-------|-------------|
| `@components/*` | `src/app/components/*` |
| `@services/*` | `src/app/services/*` |
| `@resolvers/*` | `src/app/resolvers/*` |
| `@filters/*` | `src/app/filters/*` |
| `@models/*` | `src/app/models/*` |
| `@utils/*` | `src/app/utils/*` |
| `environments` | `src/environments` |

---

## Migration from Karma

### Removed Dependencies

The following packages were removed during migration:

```bash
# Test runners
karma
karma-chrome-launcher
karma-coverage
karma-jasmine
karma-jasmine-html-reporter

# Testing frameworks
jasmine-core

# Alternative DOM libraries
happy-dom

# Mocking libraries
ts-mockito

# Vitest extras (not needed for minimal setup)
@vitest/coverage-v8
@vitest/ui
```

### Key Changes from Karma

| Karma | Vitest |
|--------|--------|
| `karma.conf.js` | No config file needed |
| `src/test.ts` | `src/test-setup.ts` |
| `ng test` (Karma) | `ng test` (Vitest) |
| Browser-based | Node.js + jsdom |
| Zone.js patches | Zoneless (no patches) |

---

## Testing Patterns

### Zoneless Testing

All tests run with Zoneless change detection. Key patterns:

#### ✅ DO: Use Signals and Native Async

```typescript
// Component signal input
readonly myValue = input<string>('');

// Model signal for two-way binding
name = model('');

// Native async operations
await fixture.whenStable();
```

#### ❌ DON'T: Zone.js APIs

```typescript
// ❌ NOT SUPPORTED
fakeAsync(() => {
  fixture.detectChanges();
  flush();
  tick(1000);
});

// ❌ NOT SUPPORTED
NgZone.run(() => {});
```

### Test File Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        provideZonelessChangeDetection(),
        // ... other providers
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

---

## Common Issues and Solutions

### Issue 1: Platform Already Created

**Error**:
```
NG0400: A platform with a different configuration has been created
```

**Cause**: Calling `TestBed.initTestEnvironment()` manually when Angular CLI already does it.

**Solution**: Remove `initTestEnvironment()` call from `test-setup.ts`.

### Issue 2: Component Not Resolved

**Error**:
```
Component 'MyComponent' is not resolved
```

**Cause**: Missing `await TestBed.configureTestingModule().compileComponents()`.

**Solution**: Always await `compileComponents()` in `beforeEach`.

### Issue 3: Vitest Config Interference

**Error**: Tests not running with Angular CLI

**Cause**: `vitest.config.ts` file exists and interferes with Angular CLI.

**Solution**: Delete or rename `vitest.config.ts` (Angular CLI handles config).

### Issue 4: Unknown Elements/Properties

**Error**: Tests fail with unknown elements/properties

**Cause**: Missing mock providers or schemas

**Solution**: Add `NO_ERRORS_SCHEMA` or provide proper mocks:

```typescript
TestBed.configureTestingModule({
  imports: [MyComponent],
  schemas: [NO_ERRORS_SCHEMA],
});
```

---

## Running Tests

### Development Mode

```bash
yarn test
```

Features:
- Watch mode: Auto-rerun on file changes
- Interactive UI
- Fast feedback

### CI/Single Run Mode

```bash
yarn test:run
```

Features:
- Single execution
- No watch mode
- Suitable for CI/CD pipelines

### Manual Vitest Execution

```bash
# Not recommended (bypasses Angular CLI)
vitest --run
```

**Note**: Always use `ng test` to ensure Angular CLI handles the build.

---

## Build Output

When tests run, Angular CLI generates the following chunks:

```
Initial chunk files                               | Names                                              | Raw size
-----------------------------------------------------|---------------------------------------------------|----------
spec-app-components-computes-computes.component.js | spec-app-components-computes-computes.component | 77.76 kB
chunk-EYVVC2XH.js                                 | -                                                   |   5.13 kB
init-testbed.js                                     | init-testbed                                         |   1.21 kB
vitest-mock-patch.js                                | vitest-mock-patch                                    | 939 bytes
setup-test-setup.js                                | setup-test-setup                                     | 365 bytes
```

---

## Performance

### Startup Time
- **Build**: ~4 seconds
- **Test Execution**: ~1.4 seconds (for 17 tests)

### Memory Usage
- **Node.js**: Standard for Vitest
- **jsdom**: Lightweight DOM emulation

### Advantages over Karma

| Aspect | Karma | Vitest |
|--------|--------|--------|
| Startup Time | ~10-15s | ~4s |
| Test Execution | Slower (browser) | Faster (Node.js) |
| Watch Mode | Full browser rebuild | Incremental compilation |
| Debugging | Browser DevTools | VS Code debugger |
| CI/CD | Requires browser setup | No browser needed |

---

## Troubleshooting

### Check Installation

```bash
# Verify Vitest is installed
yarn why vitest

# Verify jsdom is installed
yarn why jsdom
```

### Verify Configuration

```bash
# Check Angular CLI configuration
ng test --help

# Run tests with verbose output
ng test --watch=false
```

### Clean Build Artifacts

```bash
# Clean test build artifacts
rm -rf dist out-tsc node_modules/.vite
```

---

## References

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Angular Zoneless Guide](https://angular.dev/guide/zoneless)
- [Vitest Documentation](https://vitest.dev/)
- [Migrating from Karma to Vitest](https://angular.dev/guide/testing/migrating-to-vitest)

---

## Changelog

### 2026-04-02
- ✅ Initial Vitest environment setup
- ✅ Configure Zoneless change detection
- ✅ Remove Karma and Jasmine dependencies
- ✅ Fix xterm CSS path for `@xterm/xterm` package
- ✅ Clean up TypeScript configuration
- ✅ Setup minimal dependencies (vitest + jsdom only)
- ✅ Configure `@angular/build:unit-test` builder
- ✅ Test environment verified and working

---

## Maintenance Notes

### When Updating Angular

1. Check if `@angular/build:unit-test` API changed
2. Verify `test-setup.ts` still compatible
3. Update this document if new patterns emerge

### When Updating Vitest

1. Check Vitest changelog for breaking changes
2. Test with `yarn test:run` before relying on watch mode
3. No changes to Angular configuration typically needed

### When Adding New Tests

1. Follow Zoneless testing patterns (signals, native async)
2. Use `vi.fn()` for mocks instead of Jasmine spies
3. Import from 'vitest' for test utilities

---

## Support

For issues or questions about the testing setup:

1. Check this document first
2. Review [Angular Zoneless Guide](../../framework/angular-21/zoneless-guide.md)
3. Consult [Angular Testing Documentation](https://angular.dev/guide/testing)
4. Check [Vitest Documentation](https://vitest.dev/)

---

**Document Status**: ✅ Active
**Last Reviewed**: 2026-04-02
**Angular Version**: 21.0.0
