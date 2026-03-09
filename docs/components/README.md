# Components Directory - Code Review Index

This document indexes all component code review documents in the `src/app/components/` directory of the GNS3 Web UI project.

## Document Index

### Authentication & User Management

| Component Directory | Document | Main Issues |
|--------------------|----------|--------------|
| [login](./login/CODE_REVIEW.md) | [View Details](./login/CODE_REVIEW.md) | Password stored in plain text in localStorage |
| [user-management](./user-management/CODE_REVIEW.md) | [View Details](./user-management/CODE_REVIEW.md) | Async validator performance issues, API keys displayed in plain text |
| [group-management](./group-management/CODE_REVIEW.md) | [View Details](./group-management/CODE_REVIEW.md) | Missing subscription management, missing permission validation |
| [role-management](./role-management/CODE_REVIEW.md) | [View Details](./role-management/CODE_REVIEW.md) | Using UntypedFormControl, privilege escalation risk |

### Project Management

| Component Directory | Document | Main Issues |
|--------------------|----------|--------------|
| [projects](./projects/CODE_REVIEW.md) | [View Details](./projects/CODE_REVIEW.md) | Memory leaks, insufficient XSS protection |
| [project-map](./project-map/CODE_REVIEW.md) | [View Details](./project-map/CODE_REVIEW.md) | XSS vulnerability (AI Chat), performance issues |
| [snapshots](./REMAINING_COMPONENTS.md#snapshots-component) | [View Details](./REMAINING_COMPONENTS.md) | Missing snapshot recovery validation |
| [template](./template/CODE_REVIEW.md) | [View Details](./template/CODE_REVIEW.md) | SVG injection risk, insufficient drag coordinate validation |

### System Management

| Component Directory | Document | Main Issues |
|--------------------|----------|--------------|
| [settings](./REMAINING_COMPONENTS.md#settings-component) | [View Details](./REMAINING_COMPONENTS.md) | External link validation, settings validation |
| [help](./REMAINING_COMPONENTS.md#help-component) | [View Details](./REMAINING_COMPONENTS.md) | File read security |
| [system-status](./REMAINING_COMPONENTS.md#system-status-component) | [View Details](./REMAINING_COMPONENTS.md) | Route parameter validation |
| [preferences](./CODE_REVIEW.md) | [Main Document](../CODE_REVIEW.md) | Code duplication, missing lazy loading |

### Resource Management

| Component Directory | Document | Main Issues |
|--------------------|----------|--------------|
| [image-manager](./REMAINING_COMPONENTS.md#image-manager-component) | [View Details](./REMAINING_COMPONENTS.md) | Missing file upload validation |
| [resource-pools-management](./REMAINING_COMPONENTS.md#resource-pools-management-component) | [View Details](./REMAINING_COMPONENTS.md) | Code duplication, concurrency control |
| [controllers](./REMAINING_COMPONENTS.md#controllers-component) | [View Details](./REMAINING_COMPONENTS.md) | Command injection risk |
| [acl-management](./REMAINING_COMPONENTS.md#acl-management-component) | [View Details](./REMAINING_COMPONENTS.md) | Missing permission validation |

---

## Critical Issues Summary

### Immediate Fixes (This Week)

| Issue | Location | Risk Level |
|-------|----------|------------|
| Password stored in plain text | `login/login.component.ts:105-111` | Critical |
| XSS vulnerability (AI Chat) | `project-map/ai-chat/chat-message-list.component.ts:240-241` | Critical |
| Insufficient XSS protection | `projects/edit-project-dialog/readme-editor/readme-editor.component.ts:34-35` | Critical |
| SVG injection risk | `template/template.component.ts` | High |
| Command injection risk | `controllers/controllers.component.ts` | High |

### Short-term Fixes (This Month)

| Issue Category | Affected Components | Count |
|----------------|---------------------|-------|
| Memory leaks | projects, project-map, etc. | 15+ |
| Uncleaned subscriptions | Most components | 20+ |
| Missing permission validation | Multiple management components | 10+ |
| Insufficient input validation | Form components | 15+ |

---

## Issue Statistics

### By Severity

| Severity | Count | Percentage |
|----------|-------|------------|
| Critical | 5 | 10% |
| High | 12 | 24% |
| Medium | 25 | 50% |
| Low | 8 | 16% |

### By Issue Type

| Issue Type | Count |
|------------|-------|
| Security vulnerabilities | 15 |
| Memory leaks | 18 |
| Performance issues | 8 |
| Code quality | 22 |
| Best practice violations | 12 |

---

## Fix Priorities

### Priority 1 - Security Vulnerabilities (Immediate)

```bash
# 1. Remove plain text password storage
# 2. Fix XSS vulnerabilities
npm install dompurify @types/dompurify

# 3. Add input validation
# 4. Implement SVG sanitization
```

### Priority 2 - Memory Leaks (This Week)

```typescript
// Unified takeUntil pattern
export class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Priority 3 - Code Quality (This Month)

```typescript
// Unified error handling
// Add type safety
// Improve subscription management
```

---

## Document Structure

Each component document contains the following sections:

1. **Overview** - Component functionality description
2. **Module Functions** - Sub-component list
3. **Issues Found** - Categorized by severity
4. **Recommendations** - Prioritized fix solutions
5. **Testing Suggestions** - Unit and integration tests

---

## Related Documents

- [Project Overview](../../CODE_REVIEW_SUMMARY.md)
- [Services Directory](../services/CODE_REVIEW.md)
- [Models Directory](../models/CODE_REVIEW.md)
- [Cartography Directory](../cartography/CODE_REVIEW.md)
