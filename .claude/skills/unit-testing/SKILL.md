---
name: unit-testing
description: This skill should be used when the user asks to "write tests", "create unit tests", "add test coverage", mentions "vitest", "jasmine", "karma", "testing", or discusses unit testing patterns, mocking strategies, or test quality. Provides comprehensive guidance on writing effective unit tests for Angular components and services using Vitest.
version: 1.0.0
---

# Unit Testing Skills

## When This Skill Applies

This skill activates when the user's request involves:
- Writing or creating unit tests for Angular components or services
- Improving test coverage or test quality
- Mocking strategies and dependency injection
- Testing with Vitest, Jasmine, or Karma
- Test refactoring or best practices

## Running Tests in GNS3 Web UI

The project uses **Vitest** as the test runner (not Karma). Use the following commands:

```bash
# Run all tests
yarn test

# Run tests for a specific file
yarn test --include='**/my-component.spec.ts'

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

## Test Focus Cheat Sheet

When facing a component and not sure what to test, refer to this table:

| Test Target | What to Test |
|-------------|--------------|
| **Properties** | After changing property A, does property B update accordingly? |
| **Methods** | After calling this method, are expected side effects triggered (e.g., API calls)? |
| **Outputs/@Output** | When a button is clicked, does it correctly emit events to the parent component? |
| **Inputs/@Input** | When the parent component passes different values, does the component render differently? |
| **Edge Cases** | What if the array is empty? What if the API returns a 500 error? |

## 1. The "AAA" Pattern (The Structural Skill)

This is the fundamental skill of writing readable tests. Every test should be visually divided into three parts:

- **Arrange**: Set up the mocks, data, and environment (e.g., `mockHttpController.get.mockReturnValue(...)`).
- **Act**: Execute the specific method being tested (e.g., `service.getNodeById(...)`).
- **Assert**: Verify the outcome (e.g., `expect(...).toHaveBeenCalledWith(...)`).

## 2. Advanced Mocking & Spying

Being a "Mock Master" means knowing how to isolate your code from external dependencies:

- **Functional Mocking**: Using `vi.fn()` to track calls, arguments, and return values.
- **Dependency Injection Isolation**: Understanding how to provide mock versions of services (like your HttpController) so you don't make real network calls.
- **Partial Object Matching**: Using `expect.objectContaining({...})` to verify only the relevant parts of a large object, making tests less "brittle."

## 3. Logical Branch Coverage

A great tester looks for every `if`, `else`, and `switch` statement:

- **Boundary Testing**: Testing values like `0`, `-1`, `null`, or empty strings `""`.
- **State-Dependent Logic**: Testing how a function behaves when a flag is toggled (e.g., your `snap_to_grid` logic).
- **Data Transformation**: Verifying that "Raw Input A" correctly becomes "Processed Output B" (e.g., your coordinate rounding logic).

## 4. RxJS & Asynchronicity

Since you are using Observables, you need these specific skills:

- **Stream Mocking**: Using `of(value)` for successful streams and `throwError(() => new Error())` for failure paths.
- **Subscription Management**: Ensuring that your service handles subscriptions correctly or returns an Observable that can be piped.
- **Async/Await**: Handling `firstValueFrom` or `lastValueFrom` when you want to treat an Observable like a Promise in a test.

## 5. Clean Code & Maintenance (The "Senior" Skills)

- **Parameterized Testing**: Using `it.each([])` to run the same test logic with different inputs, reducing code duplication.
- **Test Descriptive Naming**: Writing `it` blocks that read like a requirements document (e.g., "should round coordinates to the nearest integer when updating position").
- **Avoid Implementation Leaks**: Testing **what** the service does (behavior), not **how** it does it (private variables). This prevents tests from breaking during a refactor.

## Writing Effective Tests

1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **Use descriptive test names**: Test names should read like requirements
3. **One assertion per test**: Keep tests focused and simple
4. **Arrange-Act-Assert structure**: Make tests readable and maintainable
5. **Test edge cases**: Don't just test the happy path
6. **Mock external dependencies**: Isolate the code under test
7. **Avoid test interdependence**: Each test should be independent

## Common Pitfalls to Avoid

- Testing private methods directly
- Writing tests that are too tightly coupled to implementation details
- Not testing edge cases and error conditions
- Creating brittle tests that break on refactoring
- Testing multiple things in one test
- Not mocking external dependencies properly
- Writing tests that are hard to understand
