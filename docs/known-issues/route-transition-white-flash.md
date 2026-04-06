# White Flash During Route Transition

## Problem Description

A very brief white screen flash occurs in the following scenario:

- **Route**: `/controller/:controller_id/projects` → `/controller/:controller_id/project/:project_id`
- **Action**: Click project name in projects list to navigate to project detail page
- **Symptom**: Extremely short white flash during route transition (approximately 50-100ms)

## Root Cause

### Architecture Level

```
Projects Page:  [DefaultLayout (top toolbar) [Projects]]
                                             ↑ Route transition
ProjectMap Page: [ProjectMap (fullscreen, independent project-titlebar)]
                                             ↑ Layout switch causes flash
```

**Core Issue**:
- Projects page is inside `DefaultLayout` (has top toolbar)
- ProjectMap page is independent of `DefaultLayout` (fullscreen, has its own project-titlebar)
- During route transition, `DefaultLayout` is destroyed and `ProjectMap` is rendered directly
- In the gap between component destruction/creation, body background color defaults to white

### Technical Details

1. **CSS Background Issue**: `body` element has no `background-color` set
2. **Layout Discontinuity**: Two pages use different layout containers
3. **Component Destruction/Creation**: DefaultLayout → ProjectMap

## Attempted Solutions

### Solution 1: Add Background Color (Partially Effective)

```scss
// src/styles.scss
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--mat-sys-background); // Add background color
}
```

**Effect**: Can mitigate but not completely eliminate the flash

### Solution 2: Unified Layout (Not Implemented)

**Approach**: Delete `DefaultLayout`, extract `ProjectMap`'s `project-titlebar` as global component

**Architecture Change**:
```
Current:
├── DefaultLayout
│   ├── Projects Page
│   └── Other Pages
└── ProjectMap (independent)

Target:
├── ProjectTitlebar (global)
└── <router-outlet>
    ├── Projects Page
    ├── ProjectMap Page
    └── Other Pages
```

**Why Not Implemented**:
1. **High Effort**: Requires large-scale route architecture refactoring
2. **High Risk**: May introduce new bugs affecting all pages using DefaultLayout
3. **Low Benefit**: Flash is extremely short (50-100ms), minimal user experience impact
4. **Tech Debt**: Would require additional services to manage global state

## Assessment

### Severity
- **Low**: Flash duration is minimal, does not affect functionality
- **No Impact**: User workflow and business logic remain intact

### Resolution Cost
- **High**: Requires large-scale architecture refactoring
- **Risk**: High probability of introducing new bugs
- **Time**: Estimated 2-3 days development and testing

### Benefit Assessment
- **Low**: Minimal user experience improvement
- **Cost-Benefit**: Not worth investing significant resources

## Recommendation

**Status**: 🟡 **Known Issue - Won't Fix**

**Rationale**:
1. Flash is extremely short (50-100ms), most users may not notice
2. Resolution cost far outweighs benefits
3. Current architecture is stable, large-scale refactoring is high-risk
4. Other higher-priority tasks require attention

**Alternative Approaches**:
- Add route transition animations to smooth the switch (simple but limited effect)
- Accept current behavior, document as known issue

## Related Files

- `src/app/app-routing.module.ts` - Route configuration
- `src/app/layouts/default-layout/` - Current layout component
- `src/app/components/project-map/` - Project map component
- `src/styles.scss` - Global styles

## Record Information

- **Created**: 2026-04-06
- **Last Updated**: 2026-04-06
- **Status**: Known issue, no fix planned
