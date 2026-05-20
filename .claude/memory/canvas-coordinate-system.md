---
name: canvas-coordinate-system
description: GNS3 uses left-handed Cartesian coordinate system with origin at canvas center
metadata:
  type: project
---

# GNS3 Canvas Coordinate System

GNS3 map canvas uses a **left-handed Cartesian coordinate system** with the origin positioned at the **center of the canvas** (not top-left corner).

## Coordinate Axes

| Axis | Direction | Description |
|------|-----------|-------------|
| **Origin (0,0)** | Canvas center | Set by `centerZeroZeroPoint=true` in Context model |
| **X axis** | → Right | Positive direction: right |
| **Y axis** | ↓ Down | Positive direction: down (⚠️ opposite of mathematical coordinate systems) |
| **Z axis** | 👆 Out of screen | Points toward viewer (perpendicular to screen) |

## Left-Handed vs Right-Handed Systems

| Coordinate System | X Axis | Y Axis | Z Axis | Used In |
|--------------------|--------|--------|--------|---------|
| **Right-Handed** (Mathematics) | → Right | ↑ Up | 👆 Into screen | Math, physics, engineering |
| **Left-Handed** (Screen) | → Right | ↓ Down | 👆 Out of screen | Computer graphics, D3.js, SVG |
| **GNS3 Canvas** | → Right | ↓ Down | 👆 Out of screen | Network topology maps |

## Left-Hand Rule

Using the left hand to determine coordinate directions:
- **Thumb** points to X axis positive direction (right →)
- **Index finger** points to Y axis positive direction (down ⬇️)
- **Middle finger** points to Z axis positive direction (outward 👆)

## Critical Implications for Angle Calculations

In this left-handed coordinate system, `Math.atan2(dy, dx)` returns **clockwise-positive** angles:
- 0° = East (right)
- 90° = South (down)
- 180° = West (left)
- -90° = North (up)

**This is opposite** of right-handed (mathematical) coordinate systems where counter-clockwise is positive.

## Impact on Rotation Feature Implementation

When implementing rotation drag behavior:
- Mouse moving down (dy > 0) increases angle → **clockwise rotation**
- Angle calculations must be normalized to server validation range [-359, 360]
- Crossing atan2 boundary (-180°/180°) requires special delta handling

**Why:** The screen-based coordinate system affects how `Math.atan2()` interprets mouse positions, causing rotation direction to be clockwise-positive rather than counter-clockwise-positive as in mathematics.

**How to apply:** Always remember that GNS3 canvas coordinates are Y-down, so:
1. Test rotation behavior to verify direction matches user expectations
2. Use angle normalization when persisting to server (while loops to keep within [-359, 360])
3. Handle atan2 boundary crossing correctly when calculating delta angles (if delta > 180°, subtract 360°; if delta < -180°, add 360°)

## Reference Code

- **Context definition**: `src/app/cartography/models/context.ts` — `centerZeroZeroPoint`, `getZeroZeroTransformationPoint()`, `transformation` properties
- **Rotation drag implementation**: `src/app/cartography/widgets/drawings.ts` — d3-drag rotation behavior
