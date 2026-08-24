# Static Topology Preview — Implementation Pitfalls

The static `.gns3` topology preview (projects list detail panel + 70vw×70vh enlarge
dialog; commits through `bb5be9f0d`). The non-obvious traps hit during implementation,
recorded so they don't have to be re-derived.

## Render pipeline timing (the expensive one)

`redraw()` runs `setNodes/setLinks/setDrawings` → `getSize()` → `graphLayout.draw()`.
`MapDrawing.element` (width/height parsed from the drawing's svg root) used to be
assigned lazily inside `DrawingsWidget.draw()`'s data-join accessor — i.e. AFTER
`getSize()`. Any fix that feeds `getSize()` must convert eagerly in
`DrawingToMapDrawingConverter` (the setDrawings path), not in the widget. Symptom of
getting it wrong: the fix compiles, looks correct, and is a silent no-op.

## Drawing bbox semantics

Drawing `(x, y)` is the TOP-LEFT of its box; the box size is the svg root
`width`/`height` persisted by the GUI (often 100×100 regardless of glyph size — an
18pt text can render ~190px wide). `getSize()` counted nodes as boxes but drawings as
points → the canvas edge clipped bottom/right overhang. Fix:
`maxX = max(maxX, x + element.width)` with `element?.width ?? 0` (an unsupported svg
leaves `element` undefined and renders nothing; both `getSize()` and the
DrawingWidget's instanceof guards tolerate that).

## Canvas ≠ content bbox

`getSize()` pads each side to `max(browserViewport/2, content + 30)` — measured
against `document.documentElement`, NOT the host container — so the canvas is
asymmetric and viewport-floored. Fitting the svg element shrinks small topologies
into padding and leaves content off-center. The preview instead fits
`g.canvas.getBBox()` (grid rects and tool overlays live on the svg ROOT, so this is
pure content, in scene coords), maps it to svg coordinates via
`canvas.transform.baseVal` (translate+scale, see `GraphLayout.canvasTransform`), and
re-centers with `translate(calc(-50% + Xpx), calc(-50% + Ypx)) scale(s)` where
`X = (svgW/2 − bboxCenterX)·s`.

## Canvas color var scope

`--gns3-canvas-link-color` / `--gns3-canvas-label-color` are defined only on
`.project-map--light-bg/--dark-bg` (now also `.topology-preview__viewport--*`).
Outside that scope a `var()` in an SVG stroke attribute resolves to nothing → links
render invisible. The screenshot pipeline's `applyCanvasColors` inlines computed
colors for the same reason.

## gns3file browser cache

The server's FileResponse carries ETag/Last-Modified but no Cache-Control → Chrome
heuristically caches it for ~hours, and F5 revalidates only the main document, NOT
XHR subresources → a stale `.gns3` preview survives reloads and mimics an app bug.
Fix: send a `Cache-Control: no-cache` request header (revalidates via ETag, 304 when
unchanged). An incognito window is the fastest differential diagnosis.

## Singleton map

Context / GraphDataManager / LayersManager are app singletons — only ONE
`<app-d3-map>` may be mounted at a time (panel ↔ dialog swap via `@if`). The loader
must emit asynchronously (`subscribeOn(asyncScheduler, 1)` — delay-0 actions run
synchronously) so the loading frame renders and the remount resets the canvas origin.
See also `canvas-coordinate-system.md` in this directory.
