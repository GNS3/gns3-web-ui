<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# Angular Zoneless Development Guide

> This project uses Angular 21 Zoneless architecture. Zone.js is disabled, and all change detection is explicit.

---

## Architecture Overview

```mermaid
graph TB
    subgraph Bootstrap["Bootstrap Layer (main.ts)"]
        PZCD["provideZonelessChangeDetection()"]
    end

    subgraph Component["Component Layer"]
        ONP["ChangeDetectionStrategy.OnPush<br/>(249/249 components)"]
        STANDALONE["Standalone Components"]
    end

    subgraph StateMgmt["State Management"]
        SIGNAL["Signals<br/>WritableSignal / ComputedSignal"]
        RXJS["RxJS + markForCheck()<br/>(125 files, 383 calls)"]
        RFORMS["Reactive Forms<br/>(81 files)"]
    end

    subgraph Binding["Data Binding"]
        SINPUT["Signal Input<br/>input()"]
        MINPUT["Model Signal<br/>model()"]
        AINPUT["@Input() + Signal<br/>(18 files, legacy)"]
    end

    subgraph Forbidden["Forbidden APIs (Zero Usage)"]
        F1["Zone.run()"]
        F2["NgZone"]
        F3["[(ngModel)]"]
        F4["ApplicationRef.tick()"]
    end

    PZCD --> ONP
    ONP --> STANDALONE

    SIGNAL --> SINPUT
    SIGNAL --> MINPUT
    RXJS --> AINPUT
    RFORMS -.->|replaces ngModel| Forbidden

    style Forbidden fill:#ffebee,stroke:#c62828,color:#c62828
    style PZCD fill:#e8f5e9,stroke:#2e7d32,color:#2e7d32
    style ONP fill:#e8f5e9,stroke:#2e7d32,color:#2e7d32
```

### Component Responsibilities

| Layer | Responsibility | Current Status |
|-------|---------------|----------------|
| **Bootstrap** | Zoneless provider registration | `provideZonelessChangeDetection()` in `main.ts` |
| **Component** | All components standalone + OnPush | 249/249 (100%) |
| **State Management** | Explicit change notification | `markForCheck()` as primary mechanism |
| **Data Binding** | Input/Output signal-based | Legacy `@Input()` migration in progress |

---

## Flow Description

### Change Detection Trigger Flow

```mermaid
flowchart TD
    START([Async Event Occurs]) --> TYPE{Event Type}

    TYPE -->|HTTP Response| HTTP["Observable subscribe()"]
    TYPE -->|Timer| TIMER["setTimeout / setInterval"]
    TYPE -->|User Input| INPUT["DOM Event"]

    HTTP --> UPDATE["Update Signal State"]
    TIMER --> UPDATE
    INPUT --> SIGNAL_CHECK{Signal Bound?}

    SIGNAL_CHECK -->|Yes| AUTO["Angular auto-detects<br/>signal change"]
    SIGNAL_CHECK -->|No| MANUAL["Call markForCheck()"]

    UPDATE --> MFC["Call markForCheck()"]
    MFC --> DETECT["Angular schedules<br/>change detection"]
    MANUAL --> DETECT
    AUTO --> DETECT

    DETECT --> RENDER([View Updated])

    style START fill:#e3f2fd,stroke:#1565c0
    style RENDER fill:#e8f5e9,stroke:#2e7d32
    style MFC fill:#fff3e0,stroke:#e65100
    style MANUAL fill:#fff3e0,stroke:#e65100
```

### Dynamic Component Loading Flow

```mermaid
flowchart LR
    CREATE["createComponent()"] --> INSTANCE["Component Instance"]
    INSTANCE --> PROPS["Set @Input properties"]
    PROPS --> DETECT["detectChanges()"]
    DETECT --> READY([Component Rendered])

    style DETECT fill:#fff3e0,stroke:#e65100
    style READY fill:#e8f5e9,stroke:#2e7d32
```

---

## Implementation Logic

### Zoneless Architecture Principle

The application bootstraps with `provideZonelessChangeDetection()` which removes Zone.js monkey-patching entirely. Angular no longer auto-detects changes from async operations (HTTP, timers, events). Every state change must explicitly notify Angular's change detector.

### Forbidden APIs and Alternatives

Four APIs are strictly prohibited because they rely on Zone.js infrastructure:

| Forbidden API | Reason | Replacement |
|---------------|--------|-------------|
| `Zone.run()` | Requires Zone.js runtime | `effect()` or direct signal updates |
| `NgZone` | Zone.js dependency | `ChangeDetectorRef.markForCheck()` |
| `[(ngModel)]` | Depends on FormsModule + Zone.js | `model()` signals or Reactive Forms |
| `ApplicationRef.tick()` | Manual full-tree check | `cd.markForCheck()` per component |

### Current Codebase Patterns

The codebase uses three primary patterns for zoneless compatibility:

**Pattern 1: markForCheck() after async operations** — The dominant pattern (383 calls across 125 files). After any Observable subscription callback or timer callback, the component calls `cd.markForCheck()` to notify Angular. This is the most widely adopted mechanism because it integrates naturally with existing RxJS-based services (137 service files).

**Pattern 2: Reactive Forms** — Used in 81 files as the replacement for `ngModel`. Reactive Forms are inherently zoneless-compatible because form control value changes can be subscribed to explicitly, and `markForCheck()` can be called in the subscription.

**Pattern 3: Signal-based inputs** — Adopted in 4 files using `input()` and `model()`. This is the Angular-recommended modern approach. Signal input changes automatically trigger change detection without manual notification. Adoption is limited but growing.

### Known Issues

**Dynamic Component Loading**: `ViewContainerRef.createComponent()` does not automatically trigger change detection in zoneless mode. After creating a component and setting its inputs, `detectChanges()` must be called explicitly on the component's `changeDetectorRef`.

**mat-checkbox Binding**: In zoneless mode, prefer `[checked]` property binding with `(change)` event over `ngModel` for checkboxes. This avoids FormsModule dependency entirely.

---

## References

- [Angular Zoneless Official Docs](https://angular.dev/guide/zoneless)
- [Model Input Signals](https://angular.dev/tutorials/signals/6-two-way-binding-with-model-signals)
- [ChangeDetectorRef](https://angular.dev/api/core/ChangeDetectorRef)

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
