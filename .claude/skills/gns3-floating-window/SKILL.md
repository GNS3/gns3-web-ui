---
name: floating-window
description: >
  The GNS3 Web UI standard for floating windows — any draggable, resizable,
  fixed-position window or panel (marker manager, console wrapper, web
  console / wireshark / node file manager inline windows, AI chat panel,
  topology summary, marker replay windows, and any NEW floating window).
  Use this skill whenever creating a new floating window or touching the
  drag / resize / z-order / persistence / chrome of an existing one. It
  defines the ONE approved interaction pattern (live resize, silent gestures,
  banded z-order, synced geometry) and the known anti-patterns. Always load
  it before writing window code — do not re-derive per-window behavior.
---

# Floating Window Standard

One interaction contract for every floating window in the project. The
reference implementation lives in `src/app/components/project-map/marker-replay/`
(extracted there first); older windows predate it and migrate incrementally.

---

## The contract (all windows)

### Resize

```html
<div
  mwlResizable
  [validateResize]="validate"
  [enableGhostResize]="false"
  (resizeStart)="onResizeStart()"
  (resizing)="onResizing($event)"
  (resizeEnd)="onResizeEnd($event)"
>
```

- **`enableGhostResize` is ALWAYS `false`.** Ghost mode deep-clones the whole
  window DOM on every gesture and produces a ghost-follows / window-jumps UX.
  It is banned.
- **`[enableGhostResize]="false"` applies NOTHING by itself** — the library
  only *reports* rectangles. Without a `(resizing)` handler the window is
  dead during the gesture and teleports on release. Mirror the validated
  rectangle into the state signals on every move:

```ts
onResizing(event: ResizeEvent): void {
  const r = event.rectangle;
  // set left/top/width/height state from r (each `r.x ?? currentValue`)
}
```

- **`onResizeEnd` consumes the FULL rectangle — `left` and `top` included.**
  Dropping them makes a left/top-edge resize re-anchor at the OLD edge on
  release and grow the window toward the opposite side (the jump bug).
- `validate` rejects rects below the window's OWN minimums (see Geometry).

### Gesture visuals — SILENT

- Hit zones are **functional but invisible**: no colored boundary ever — not
  at rest, not on hover, not mid-gesture. The cursor morph is the only
  feedback. This is a settled user decision, not a style choice.
- Why hover tints are banned too: during a live resize the cursor rides the
  grabbed edge, so a `:hover` tint stays lit through the whole gesture.
- No `--resizing`/`--dragging` box-shadow rings. Gesture states may carry
  `user-select: none` only. The window keeps its normal drop shadow always.
- Allowed transient feedback: the snap guide lines (see Magnetic snap).

### Handles

- 8 handles, invisible but functional. **Edge strips** are 10px deep and span
  the FULL side, entirely OUTSIDE the border box — zero inward reach: an
  inside-reaching edge handle covers the content scrollbar's thumb zone
  (cursor flips to resize, drags resize instead of scroll). No corner inset:
  the strips run to the corners so the cursor never vanishes near one.
- **Corners** are 16×16 and straddle the corner (~6px inside the padding box,
  the rest outside) — the ONLY allowed inward reach. No scrollbar thumb lives
  at a corner, and an outside-only corner box reads as "far from the corner":
  the edge strips stop and aiming near the visible corner hits nothing.
- Accepted trade-offs: a window clamped flush to a viewport edge loses that
  side's handle (grab another edge); snapped neighbours share the seam gap.
- Render the shared
  `FloatingWindowResizeHandlesComponent`
  (`src/app/components/floating-window/floating-window-resize-handles.component.ts`)
  inside the `mwlResizable` element — `prefix="gns3-replay"` for the replay
  fleet, the default `gns3-window` for kit windows. It carries the hit-zone
  styles for both prefixes, including the trailing "silent gesture"
  defense-in-depth rule that pins handles transparent while `--resizing`
  (equal specificity, later-wins — kept AFTER any future tint rule). Do not
  copy the eight handle divs into a window template.
- **The window ROOT must never clip.** `overflow: hidden` on the root
  deletes every handle (they live outside the border box) and resize dies
  silently. Put `overflow: hidden` + the corner radius on the INNER content
  wrapper instead — full-chrome windows already do this via `__content`;
  kit-only hosts must do the same (this is exactly what broke ai-chat,
  console-wrapper and topology-summary during the migration).

### Header — two zones

- **Drag zone** (left, `flex: 1`): icon + title + identity chips. The ONLY
  surface whose `mousedown` drags the window. `cursor: grab` → `grabbing`.
- **Action zone** (right, fixed): buttons cluster — NEVER drags, not even in
  the gaps between buttons. Hairline separator (`--mat-sys-outline-variant`)
  marks the boundary.
- Keep the `closest('button, input')` guard in the drag handler as defense.
- Reference styles: `_replay-window-header.scss`.
- Kit-only windows keep their own drag mechanics but obey the split: ai-chat
  drags from the title strip only (action zone carries the separator),
  console-wrapper's header handler skips `.console-header-actions` whole,
  topology-summary drags from the tab strip (grab cursor lives in
  `src/styles.scss` because Material owns the nested tab DOM).

### Geometry

- **Per-window minimum sizes** — never a shared/global config
  (`WindowBoundaryService`'s global 500px minWidth is exactly why).
- Pure helpers from `replay-geometry.ts`: `clampRect` (position into
  viewport, toolbar clearance) and `clampWindowSize` (size caps with
  gutters). Import them; do not re-derive.
- Restore saved geometry **clamped against the CURRENT viewport** — a rect
  saved on a 4K desktop must degrade safely on a laptop.

### Z-order — the band system

- `project-map` raises a window a whole **band**: `baseZIndex(1000) + n ×
  REPLAY_WINDOW_Z_BAND(100)` via `raiseZIndex()`. "Whoever I click is
  frontmost" holds across ALL windows.
- A window hosting SUB-windows (replay's pin/peek fleet) keeps its internal
  boosts inside `[0, REPLAY_WINDOW_Z_BAND)` and **renumbers 1..k preserving
  relative order on exhaustion** (z-array compaction). An uncapped internal
  counter eats the next cross-window band — that is the regression that made
  replay windows cover the marker manager.
- Never re-introduce +1 raises next to sub-window counters.

### Persistence

- All persisted geometry goes through the **`UserPreferencesService` facade**
  (`getItem`/`setItem`) — localStorage working copy + per-user document sync
  on the controller; the key must be added to `SYNCED_PREFERENCE_KEYS`.
- One JSON blob per feature family (see `replay-window-state.ts` for the
  parse/validate/merge pattern — corrupt parts fall back to defaults).
- Store RAW px, clamp at use time. Session-only state (transient windows,
  in-flight layout) stays in signals — do not persist it.

## Optional modules (mount when the window needs them)

- **Magnetic snap** — `snapDraggedWindow` (drag: siblings + viewport rails,
  returns guide coordinates) and `snapResizedWindow` (edge attach) from
  `replay-geometry.ts`. Guides render as fixed-position hairlines
  (`_replay-snap-guides.scss`), only while engaged, cleared on gesture end.
  Only show guides that survived the final clamp — an overridden guide lies.
- **Content zoom** — `ReplayZoomController` (`replay-zoom.ts`): CSS `zoom` on
  the CONTENT region only (chrome stays 1:1 so px geometry math is
  untouched), per-kind persisted level.
- **Fleet registry** — sibling rect reporting for cross-window snapping
  (`MarkerReplayService.reportWindowRect`/`snapSiblingRects` pattern): report
  SETTLED rects only (placement / gesture end), clear on minimize/close.

## Current migration status

All ten windows meet the contract (branch `feat/floating-window-migration`).

| Window | Chrome | Live resize | Full-rect end | Notes |
|---|---|---|---|---|
| marker replay ×3 | own (reference) | ✅ | ✅ | original reference implementation |
| marker-manager | `FloatingWindowChrome` | ✅ | ✅ | fit-empty-definitions latches via `chrome.userResized` |
| web-console-inline | `FloatingWindowChrome` | ✅ | ✅ | iframe pointer events suspended via gesture effect |
| web-wireshark-inline | `FloatingWindowChrome` | ✅ | ✅ | own max 1920×1080 via `maxWidth`/`maxHeight` |
| node-file-manager-inline | `FloatingWindowChrome` | ✅ | ✅ | embedded page pointer events suspended |
| console-wrapper | kit helpers only | ✅ | ✅ | bottom-anchored + maximize; keeps DOM-write CD model; root unclipped, `.console-content` carries rounding |
| ai-chat | kit helpers only | ✅ | ✅ | right-anchored; overlay drag kept; root unclipped, sidebar/main carry rounding |
| topology-summary | kit helpers only | ✅ | ✅ | right-anchored restore; direct style writes kept; root unclipped, tab group carries rounding |

Two adoption levels:

- **`FloatingWindowChrome`** — full controller (signals + drag + resize).
  Use for new windows and for left/top-anchored windows.
- **Kit helpers only** — `clampRect`/`clampWindowSize` + the shared surface
  partials and the resize-handles component,
  when the window owns an unusual placement model (bottom/right anchors,
  maximize modes, pre-existing drag overlays). Do NOT force the controller
  on them: it is left/top semantics and would fight their anchor math.

`WindowBoundaryService` is now unused by these windows (its global config
was the anti-pattern the contract bans); do not wire new windows to it.

## Hard rules recap (the ones that were actual bugs)

1. No ghost resize. 2. `(resizing)` mirror is mandatory. 3. resizeEnd eats
the whole rectangle. 4. No visible gesture color, ever. 5. Handles outside
the border box. 6. Per-window minimums. 7. Banded z-raises; capped fleets.
8. Colors only via `--mat-sys-*` tokens (no hex — the pre-commit color check
also trips on hex-looking tokens in ` * ` JSDoc lines, e.g. `#1234`).
9. Zoneless/OnPush: signals + `markForCheck()` after async — no Zone APIs.
