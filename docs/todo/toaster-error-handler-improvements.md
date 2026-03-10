# Toaster Error Handler - Issues & Improvements

## Document Information

**Created**: 2026-03-10
**Status**: 🔴 **Pending Fixes**
**Priority**: Medium
**Component**: `src/app/common/error-handlers/toaster-error-handler.ts`

---

## 1. Overview

The `ToasterErrorHandler` is the global error handler for the GNS3 Web UI, registered in `app.module.ts`. It catches all errors and displays them using the Toaster service.

**Current Registration**:
```typescript
// app.module.ts:622
{ provide: ErrorHandler, useClass: ToasterErrorHandler },
```

---

## 2. Issues Found

### 2.1 🐛 Bug: Incorrect Status Code Check

**Location**: Line 50-53

**Current Code**:
```typescript
if (
  err.error &&
  err.error.status &&  // ❌ WRONG: Should be err.status
  !(err.error.status === 400 || err.error.status === 403 || err.error.status === 404 || err.error.status === 409)
) {
  console.error(extractedError);
}
```

**Problem**:
- HTTP response status codes are in `err.status`, not `err.error.status`
- This condition likely never evaluates to `true`
- `console.error()` is never called for filtered status codes

**Fix**:
```typescript
if (
  err.status &&
  !(err.status === 400 || err.status === 403 || err.status === 404 || err.status === 409)
) {
  console.error(extractedError);
}
```

---

### 2.2 🔧 Redundant Error Message Logic

**Location**: Line 60-66

**Current Code**:
```typescript
if (err.error && err.error.message) {
  toasterService.error(err.error.message);
} else if (err.message) {
  toasterService.error(err.message);
} else if (err.error) {
  toasterService.error(err.error);
}
```

**Problem**: Redundant nested if-else checks

**Suggested Fix**:
```typescript
const message = err.error?.message || err.message || err.error || extractedError;
toasterService.error(typeof message === 'string' ? message : JSON.stringify(message));
```

---

### 2.3 📉 Low Test Coverage

**File**: `toaster-error-handler.spec.ts`

**Issues**:
1. Only **1 test case** exists
2. `MockedToasterErrorHandler` completely overrides parent logic - doesn't test actual code
3. No tests for `extractError()` method
4. No tests for HTTP error handling
5. No tests for zone.js unwrapping
6. No tests for different error types (string, Error, HttpErrorResponse)

**Current Test**:
```typescript
it('should call toaster with error message', () => {
  handler.handleError(new Error('message'));
  expect(toasterService.errors).toEqual(['message']);
});
```

**Needed Tests**:
- [ ] Test `extractError()` with string
- [ ] Test `extractError()` with Error object
- [ ] Test `extractError()` with HttpErrorResponse (Error)
- [ ] Test `extractError()` with HttpErrorResponse (ErrorEvent)
- [ ] Test `extractError()` with HttpErrorResponse (string body)
- [ ] Test `extractError()` with zone.js wrapped error
- [ ] Test `handleError()` with 400 status (no console.error)
- [ ] Test `handleError()` with 500 status (console.error)
- [ ] Test `handleError()` with various message formats
- [ ] Test `handleError()` with null/undefined error

---

## 3. Action Items

### Priority 1: Fix Bug
- [ ] Fix line 50-53: Change `err.error.status` to `err.status`
- [ ] Test that console.error is called correctly for non-filtered status codes

### Priority 2: Refactor
- [ ] Simplify error message extraction logic (line 60-66)
- [ ] Improve code readability

### Priority 3: Improve Tests
- [ ] Rewrite tests to test actual implementation, not mock
- [ ] Add comprehensive test coverage for `extractError()`
- [ ] Add tests for HTTP error scenarios
- [ ] Achieve >80% code coverage

---

## 4. Additional Considerations

### 4.1 Error Filtering Logic

**Current filtered codes**: 400, 403, 404, 409

**Question**: Should these really be filtered from console.error?
- 400 (Bad Request) - User error, might not need console
- 403 (Forbidden) - Auth error, might need console
- 404 (Not Found) - Resource missing, might need console
- 409 (Conflict) - State conflict, might need console

**Recommendation**: Review filtering logic with team

### 4.2 ExtractError Return Value

**Line 43**: Returns `null` for unrecognized errors
```typescript
return null;
```

**Usage**:
```typescript
let extractedError = this.extractError(err) || 'Handled unknown error';
```

**Question**: Should this throw an error for truly unrecognized cases?

---

## 5. References

**Files**:
- `src/app/common/error-handlers/toaster-error-handler.ts`
- `src/app/common/error-handlers/toaster-error-handler.spec.ts`
- `src/app/app.module.ts` (line 622)

**Related**:
- Angular ErrorHandler docs: https://angular.io/api/core/ErrorHandler
- Toaster service: `src/app/services/toaster.service.ts`

---

**Document Version**: 1.0
**Last Updated**: 2026-03-10
**Maintainer**: Development Team
