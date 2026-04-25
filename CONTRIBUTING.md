# Contributing to GNS3 Web UI

Thank you for your interest in contributing to GNS3 Web UI! We're excited to have you onboard.

This document provides essential guidelines to help you contribute effectively. Don't worry if everything feels new - we're here to help!

---

## 🚀 Quick Start

New to contributing? Welcome! Here's how to get started:

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/gns3-web-ui.git
cd gns3-web-ui

# Install dependencies
yarn install

# Create a feature branch
git checkout -b my-feature

# Make your changes following the guidelines below
# Don't worry about getting everything perfect - we're here to help!

# Test your changes
yarn test

# Commit and push
git commit -m "feat: add my feature"
git push origin my-feature

# Open a Pull Request - we'll review it together!
```

**💡 First-time contributor?** Check out our documentation in `CLAUDE.md` for detailed project information.

---

## 🎨 CSS & Style Guidelines

### 💡 Using Material Design 3 Variables

This project uses **Material Design 3 CSS variables** to ensure consistent theming across the application.

**Why use MD3 variables?**
- ✅ **Automatic dark mode support** - your code works perfectly in both light and dark themes
- ✅ **Consistent design language** - matches Material Design 3 standards
- ✅ **Future-proof theming** - easy to adapt to new design systems
- ✅ **Faster development** - no need to manually handle theme switching

#### ❌ Avoid: Hardcoded Colors

```scss
/* DON'T - Hardcoded colors */
.my-class {
  background-color: #ff1744;
  color: #ffffff;
  border: 1px solid #00c853;
}

/* DON'T - Fallback colors */
.my-class {
  background-color: var(--mat-sys-primary, #6750A4);
}
```

**Why we follow this standard:**
During the AI Copilot module integration, we found that using MD3 variables significantly improves UI predictability and makes the codebase easier to maintain. By avoiding hardcoded colors, we ensure the project remains lightweight and maintainable even during rapid iteration.

#### ✅ REQUIRED

```scss
/* DO - Use Material Design 3 variables */
.my-class {
  background-color: var(--mat-sys-error);
  color: var(--mat-sys-on-error);
  border: 1px solid var(--mat-sys-outline);
}
```

**Reference:**
- Material Design 3 Variables: `docs/guides/css/02-material3-variables.md`
- Hardcoded Color Protection: `docs/guides/css/hardcoded-color-protection.md`

#### Custom Colors

When you need colors beyond Material Design 3 variables, use `--gns3-*` custom variables:

```scss
:root {
  --gns3-my-feature-color: var(--mat-sys-primary);
}

.my-class {
  color: var(--gns3-my-feature-color);
}
```

**💡 Not sure which variable to use?** Feel free to ask in your PR! We're happy to help you choose the most appropriate Material Design 3 variable for your use case.

See `src/styles/_map.scss` for more examples.

---

### Other CSS Rules

| Rule | Description |
|------|-------------|
| **No `!important`** | Use selector specificity |
| **No `::ng-deep`** | Use ViewEncapsulation or global styles |
| **No `:deep()`** | Style penetration forbidden |
| **No `ViewEncapsulation.None`** | Causes style pollution |
| **Dialog styles centralized** | All in `src/styles/_dialogs.scss` |
| **Use `panelClass`** | For dialog style scoping |

---

## ⚡ Angular 21 Zoneless Framework

This project uses **Zoneless Angular 21** for better performance and explicit change detection.

**Benefits of Zoneless:**
- ✅ **Smaller bundle size** - no Zone.js overhead
- ✅ **Faster execution** - explicit change detection
- ✅ **Better debugging** - clear data flow

### Zoneless Best Practices

| API | Use Instead | Benefit |
|-----|-------------|---------|
| `Zone.run()` | `effect()` or direct state updates | Explicit reactivity |
| `NgZone` | `ChangeDetectorRef.markForCheck()` | Clear change detection |
| `[(ngModel)]` | `model()` signals or Reactive Forms | Modern signal-based binding |
| `ApplicationRef.tick()` | `cd.markForCheck()` | Predictable updates |

### Recommended Patterns

```typescript
// Signal input
readonly myValue = input<string>('');

// Model signals (two-way binding)
name = model('');
<input [value]="name()" (input)="name.set($event.target.value)" />

// Async operations
constructor(private cd: ChangeDetectorRef) {}

loadData() {
  this.http.get('/api/data').subscribe(data => {
    this.data.set(data);
    this.cd.markForCheck(); // Required after async
  });
}
```

### Standalone Components

All components must be standalone with `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent { }
```

**Reference:** `docs/framework/angular-21/zoneless-guide.md`

---

## 🧪 Testing

- Run tests: `yarn test`
- Testing framework: Vitest 4.1.2
- All new features must include unit tests
- Test coverage is tracked

**Reference:** `docs/testing/unit-testing-best-practices.md`

---

## 📝 Pre-commit Checks

The project has automated pre-commit hooks:

- **Hardcoded color check**: `.husky/check-hardcoded-colors.sh`
- **Linting**: ESLint rules
- **Format checking**: Prettier configuration

If your commit fails, fix the issues before pushing.

---

## 📚 Documentation

- **Main Guide**: `CLAUDE.md` (comprehensive project guide)
- **CSS Guidelines**: `docs/guides/css/`
- **Framework Migration**: `docs/framework/angular-21/`
- **Feature Documentation**: `docs/features/`
- **Service Inventory**: `docs/inventory/services-by-domain.md`

---

## 🔄 Pull Request Guidelines

### Before Submitting

1. **Test your changes**: `yarn test`
2. **Check for hardcoded colors**: Pre-commit hook will catch this
3. **Follow existing patterns**: Check similar components
4. **Update documentation**: If needed

### PR Description

```markdown
## Summary
Brief description of changes

## Changes
- List main changes

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass: `yarn test`

## Standards Compliance
- [ ] No hardcoded colors (checked by pre-commit)
- [ ] No `::ng-deep` or `:deep()`
- [ ] Uses Material Design 3 variables
- [ ] Standalone component with OnPush
- [ ] Zoneless compliant (no Zone.js APIs)
```

---

## 🏗️ Project Structure

```
gns3-web-ui/
├── src/app/
│   ├── components/         # 32 component directories
│   ├── services/           # 137 service files
│   ├── stores/             # State management
│   ├── models/             # TypeScript interfaces
│   ├── cartography/        # D3.js map rendering
│   └── material.imports.ts # Centralized Material imports
├── src/styles/             # SCSS style files
├── docs/                   # Project documentation
└── CLAUDE.md              # AI assistant guide
```

---

## 🆘 Getting Help

- **Documentation**: Start with `CLAUDE.md` and `docs/` directory
- **Issues**: Search existing issues before creating new ones
- **Questions?** Don't hesitate to ask in your PR or issue - we're a friendly community!

---

## 🌟 We Value Your Contribution

Every contribution matters, whether it's fixing a typo, adding a feature, or improving documentation. We appreciate you taking the time to make GNS3 Web UI better!

**Remember**: We're all learning together. If you're unsure about anything, just ask - we're happy to help.

---

**Last Updated**: 2026-04-25

**Ready to contribute?** We look forward to working with you! 🚀
