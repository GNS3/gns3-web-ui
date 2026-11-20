<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../README.md).

# Postmortem: Marquee Selection Visual Regressions

> A small marquee drag painted "selected" highlights across nearly every canvas text — while the selection data stayed correct. Two stacked regressions from different refactors, plus the debugging playbook that found them.

**Date**: 2026-11-20
**Components**: `project-map.component.scss`, `styles/_map.scss`, `SelectionTool`, `GraphLayout`
**Type**: Regression (Angular 21 migration + render-perf refactor)
**Severity**: Medium (misleading UI, no data corruption)
**Status**: ✅ Fixed (`e12773d99`, `57a468ee0`)

---

## Bug 1: Marquee drag highlighted almost every text on the canvas

### Symptoms

- Drag a small rubber-band rectangle (no zoom, no pan) that includes a node
- Nearly all drawing texts and interface labels gain a "selected" look: **solid blue fill with white text**
- The effect **persists after mouse release**; it clears on the next click
- The actual selection data is correct — only the display is wrong
- Reproduces strongly in Chrome; barely visible in Firefox
- Nothing looks wrong when the project first opens

### Root cause chain

1. The **Angular 21 migration** removed `ViewEncapsulation.None` from `ProjectMapComponent` (correctly, per the style conventions — it leaks rules globally).
2. Every rule in `project-map.component.scss` became Angular-emulated: compiled to `selector[_ngcontent-x]`. **D3-created SVG elements carry no `_ngcontent` attribute, so those rules stopped matching them.** Most canvas rules were re-homed to the global `_map.scss`; the `.noselect { user-select: none }` rule was missed.
3. Canvas texts became **natively browser-selectable**.
4. `SelectionTool`'s `mousedown` handler never called `preventDefault()`, so the rubber-band gesture **also anchored a native browser text selection**.
5. Native selection extends through the DOM in **document order, not visual geometry** — a small drag sweeps a huge DOM range of text nodes.
6. Chrome paints SVG text selection as a strong blue fill; Firefox renders it faintly — hence the browser difference.

### Why it was hard to find

Everything we could verify was correct: rubber-band geometry, zoom transforms, hit-test math, selection data, per-item class application (DOM snapshots showed exactly 1 selected node, 3 selected drawings, correct class counts). The artifact was never ours — it was the browser's own selection painting layered on top.

## Bug 2: Selected serial links stopped turning red (found during the fix)

Re-homing `path.serial_link.selected` to `_map.scss` was not enough — the restored rule still never fired. Two independent breaks were stacked:

1. **Same CSS encapsulation death** as Bug 1 (the rule had been inert since the migration).
2. **Class lifecycle changed under the incremental-render refactor**: the `selected` class on the link *path* is only applied inside `link.ts` full redraws. With signature-gated incremental rendering, selection changes no longer re-render links, so the class is never applied at selection time. `GraphLayout.updateSelectionHighlights` — which *does* run on every selection change — maintains `g.link_body.selected` but not the path-level class.

Fix: key the CSS off the class that is actually maintained (`g.link_body.selected path.serial_link`). Curve drawings were unaffected because `updateSelectionHighlights` explicitly maintains `path.curve_element.selected`.

## Systemic traps (what to watch for next time)

1. **Component SCSS can never style D3-created canvas elements.** Runtime-created nodes have no encapsulation attribute. Any rule meant for the map must live in `styles/_map.scss` (scoped with `svg#map`). When removing `ViewEncapsulation.None` from a component, inventory *every* rule against "does this target runtime-created elements?" — the losses are silent.
2. **A visual feature = CSS rule + class lifecycle.** Both ends must stay alive. Classes applied inside widget `draw()` are frozen between redraws; after the incremental-render refactor, anything that must react *at selection time* has to be maintained by `updateSelectionHighlights` (or key off a class it maintains).
3. **Dead-rule cleanup triage**: before deleting an inert rule, grep who *produces* its target class/element. Producers still alive → re-home the rule (a feature is being lost); nothing produces it → delete.
4. **"It already works" may be a different mechanism.** Selected-link red was confused with hover-red (`.serial_link:hover`, global `styles.scss`) — same color, different trigger. The mouse-away test distinguishes them: hover fades, selection persists.

## Debugging playbook for canvas visual artifacts

1. **Classify the artifact first: ours or the browser's?** Our selection visuals are dashed black boxes set via SVG attributes/classes. Solid blue fill + white text is the native `::selection` highlight signature.
2. **DOM state vs pixels.** If DOM snapshots (classes, visibility attrs, counts) are clean but pixels are wrong, the painting isn't coming from our code — suspect native selection, focus rings, IME composition, stale rasters.
3. **Use cross-browser differences as a discriminator.** "Chrome strong, Firefox faint" pointed at browser-level selection rendering, not app logic.
4. **Match the precise visual to the mechanism.** Fill vs outline, solid vs dashed, tight vs loose — each combination maps to a different producer. Re-examining the screenshot with one specific question ("is this native text selection?") cracked the case faster than all the geometry forensics.
5. **Lifecycle tells.** An effect that persists after mouseup follows the browser's selection lifecycle, not the app's drag lifecycle.

## Fixes

| Commit | Change |
|--------|--------|
| `e12773d99` | Global `svg#map text { user-select: none }` in `_map.scss`; selected serial/curve stroke re-homed onto `g.link_body.selected`; dead encapsulated rules removed from `project-map.component.scss` |
| `57a468ee0` | `preventDefault()` on marquee mousedown in `SelectionTool` + regression specs |
