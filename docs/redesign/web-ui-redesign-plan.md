# GNS3 Web UI 3.1.0 — Modern Material 3 Redesign Plan

Status: **Proposal** — Target: GNS3 Web UI `3.1.0-dev5` (Angular 21, Material 21, Zoneless, Signals).

This document is a full implementation plan to refresh the GNS3 Web UI with a
modern **Angular Material Design 3 (Material You)** experience, taking
inspiration from **EVE-NG** (topology-first canvas, lab tree, right-side
properties rail) and **Cisco CML** (dashboard telemetry, hierarchical nav,
node/configuration management module).

A self-contained, theme-aware visual mockup lives next to this file:
[`./web-ui-mockup.html`](./web-ui-mockup.html). Open it directly in a browser
(`file://` URL); no build step required.

---

## Recommendation at a glance

Use a **single responsive application shell** for administration and project
work, but let the topology route become a purpose-built **workbench**:

- navigation rail on the left;
- contextual project toolbar above the canvas;
- selection-driven inspector on the right;
- persistent console, capture, configuration, and AI work areas;
- a narrow status bar for compute and project health.

The first release should modernize the shell and workbench without changing
the D3 map or service contracts. The second release should consolidate the
configuration features that already exist in context-menu dialogs into a
first-class configuration workspace. Bulk deployment, running-config
collection, and configuration history require explicit server-side contracts
and should ship behind a feature flag until those contracts are available.

### Evidence used

- The repository already uses Angular 21, Material 21, signals, zoneless
  change detection, and Material 3 system variables.
- Angular Material theming supports color, typography, density, and strong
  focus indicators; component internals should not be styled through private
  DOM selectors:
  [Angular Material theming](https://material.angular.dev/guide/theming).
- Cisco CML separates lab discovery (tile/list dashboard) from a topology
  workbench, and uses contextual panes for element details and sessions:
  [CML dashboard](https://developer.cisco.com/docs/modeling-labs/the-dashboard/),
  [CML workbench](https://developer.cisco.com/docs/modeling-labs/2-3/workbench/),
  [CML panes](https://developer.cisco.com/docs/modeling-labs/panes/).
- EVE-NG reinforces topology-first navigation, compact lab controls, inline
  console access, and interface-label visibility:
  [EVE-NG cookbook](https://www.eve-ng.net/index.php/documentation/community-cookbook/).

These products are interaction references, not visual templates. GNS3 should
retain its own terminology, multi-controller model, Material 3 token system,
and existing project actions.

---

## 1. Goals & Non-Goals

### Goals
1. **Modernize the look** without rewriting business logic — leverage the
   existing Angular Material 21 stack and the `--mat-sys-*` token system that
   is already wired throughout the codebase.
2. **Topology-first workspace** (EVE-NG-like) — make the project map the
   primary surface; everything else is a side panel, drawer, or dialog.
3. **Consistent navigation shell** — replace dual brand locations
   (`default-layout` toolbar + `project-map` titlebar) with a single app
   shell: **rail navigation + contextual toolbar**.
4. **Telemetry & management parity with CML** — system status, compute
   health, node inventory, configuration diffing as first-class surfaces.
5. **Density & responsiveness** — collapsible rail, density toggle
   (comfortable / compact), mobile-friendly drawers.
6. **Configuration management** — make existing startup/private configuration
   editing, import, and export discoverable; add safe preview, diff, validation,
   and auditable multi-node workflows as server capabilities permit.

### Non-Goals
- Do **not** replace the D3 cartography engine (`src/app/cartography`).
- Do **not** replace xterm-based console / Wireshark integrations.
- Do **not** rewrite services / stores — only templates and styles change
  in the first two phases.
- Do **not** introduce new state-management libraries; signals are the
  standard.
- Do **not** claim running-config or configuration-history support until the
  server exposes an authoritative API. Browser-only history is not an
  acceptable source of truth.

### Current-state audit

| Area | What exists today | Redesign implication |
|---|---|---|
| Framework | Angular 21, Material 21, zoneless, signals | No framework migration; use standalone/OnPush components and existing tokens. |
| Shell | `default-layout` has a 240px drawer and primary-color toolbar | Split into rail, contextual top bar, routed content, and status bar. |
| Dashboard | New signal-based dashboard with controller/stat cards | Preserve its data flow; extract reusable cards and improve hierarchy. |
| Projects | Searchable virtual-scroll Material table | Add tile/list choice and saved filters without removing the scalable list. |
| Topology | D3 canvas, fixed title bar, vertical tool strip, multiple floating windows | Keep D3; reorganize surrounding chrome and dock task panels. |
| Configurations | `NodeService` reads/writes network, startup, and private configuration; context menu supports edit/import/export | Consolidate those actions in a configuration panel before adding new backend capability. |
| Consoles/capture | xterm tabs, device panel, VNC and inline web Wireshark | Host existing components in a persistent work-area contract. |
| Styling | `--mat-sys-*` variables and hard-coded-color guardrails | Add semantic GNS3 layout/status tokens; avoid private MDC selectors. |

---

## 2. Design Principles (Material 3)

| Principle | Application |
|---|---|
| **Tokens over pixels** | Every color comes from `--mat-sys-*` (no hard-coded hex). Spacing via `--mat-sys-*`-derived `--gns3-space-*` scale. |
| **Elevation by surface-container** | Use `--mat-sys-surface-container-low/medium/high` instead of shadows where possible. |
| **Shape scale** | Cards 16px, sheets 28px, chips 8px, FABs `--mat-sys-corner-large`. |
| **Color roles > brand color** | Status uses `primary` / `tertiary` / `error` containers, never bespoke greens. |
| **Motion** | `standard` / `emphasized` easing tokens; 200–300ms; respect `prefers-reduced-motion`. |
| **Typography** | Roboto (already loaded via `typeface-roboto`); use `--mat-sys-*` type scale, no custom font. |
| **Density** | Material density `-1` / `-2`; opt-in via user setting. |

All rules from `CLAUDE.md` (no `!important`, no `::ng-deep`, no
`ViewEncapsulation.None`, no fallback colors, dialogs centralized in
`src/styles/_dialogs.scss`) remain in force.

---

## 3. Information Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Top app bar  (project breadcrumb · search · status · profile)   │
├────┬─────────────────────────────────────────────────────────────┤
│ R  │                                                              │
│ A  │                  MAIN CANVAS / VIEW                          │
│ I  │                                                              │
│ L  │   • Dashboard       • Topology (project-map)                 │
│    │   • Projects        • Computes                               │
│    │   • Templates       • Images                                 │
│    │   • Inventory       • System status                          │
│    │   • Management      • Preferences                            │
├────┤                                                              │
│    │  ┌───────────── Right side panel (contextual) ───────────┐  │
│    │  │ Topology summary · Node inspector · Link inspector     │  │
│    │  │ Console tabs · Configurations · Wireshark · AI Chat     │  │
│    │  └────────────────────────────────────────────────────────┘  │
├────┴─────────────────────────────────────────────────────────────┤
│  Status bar  (compute health · CPU · mem · nodes · version)     │
└──────────────────────────────────────────────────────────────────┘
```

### Route → Shell mapping
| Existing route | New shell slot |
|---|---|
| `/controller/:id/dashboard` | Main view (Dashboard) |
| `/controller/:id/projects` | Main view (Projects grid) |
| `/controller/:id/project/:projectId` | **Full topology workspace** — rail + top bar + canvas + right panel + status bar |
| `/controller/:id/preferences` | Main view (Templates) |
| `/controller/:id/settings` | Main view (Settings tabs) |
| `/controller/:id/management/*` | Main view (Management tabs) |
| `/controller/:id/systemstatus` | Main view (System status) |
| `/controllers` | Main view (Controllers grid) — folded into Dashboard |

---

## 4. Component Inventory (what changes, what stays)

### New components
| Selector | Purpose |
|---|---|
| `app-shell` (replaces `default-layout`) | Rail + top bar + outlet + status bar |
| `app-nav-rail` | Collapsible Material 3 navigation rail |
| `app-top-bar` | Breadcrumb + global search + status chip + profile menu |
| `app-status-bar` | Bottom telemetry strip |
| `app-command-palette` | `Ctrl/Cmd+K` quick actions (inspired by EVE-NG's lab search) |
| `app-inventory` | CML-like tree of nodes / links with filter |
| `app-right-panel` | Hosts topology-summary, inspector, consoles, AI chat |
| `app-config-workspace` | Node selector, startup/private editor, diff, validation, and deploy review |
| `app-config-diff` | Accessible unified/split diff with line-level status, no color-only meaning |
| `app-stat-card` | Reusable Material 3 stat card |
| `app-health-chip` | Status pill using `error-container` / `primary-container` |

### Refactored components
- `default-layout` → migrated into `app-shell`. Its HTML (202 lines) splits
  across the new top bar + rail.
- `dashboard` HTML (224 lines) → split into `app-stat-card` instances plus
  a `app-controller-card` directive; restyles via tokens.
- `project-map` toolbar (`project-map.component.html` lines 1–55) → moves
  canvas-only actions into a **floating canvas toolbar** (FAB-like cluster),
  and pulls the project menu up into the top app bar breadcrumb.
- `topology-summary` → becomes a right-panel section, alongside
  `node-inspector` and `link-inspector`.
- `management` (21-line shell) → upgraded to Material 3 tabs with badges.

### Untouched (logic) — only re-styled
- `cartography/*` (D3 engine)
- `web-console`, `web-wireshark`, `packet-capturing`
- All `services/*` and `stores/*`
- `material.imports.ts` (add new Material modules here as needed)

---

## 5. Phased Plan

> Each phase is independently shippable. Lint (`yarn ng lint`) and unit
> tests (`yarn ng test --watch=false`) must pass at the end of every phase.
> No commit is made without explicit user instruction (per `CLAUDE.md`).

---

### Phase 0 — Foundations (≈ 1 day)

**Goal:** establish tokens, density, and shared style primitives.

0.1. Add `src/styles/_tokens.scss` defining derived scales:
```scss
:root {
  --gns3-space-1: 4px;
  --gns3-space-2: 8px;
  --gns3-space-3: 12px;
  --gns3-space-4: 16px;
  --gns3-space-6: 24px;
  --gns3-space-8: 32px;
  --gns3-radius-sm: 8px;
  --gns3-radius-md: 12px;
  --gns3-radius-lg: 16px;
  --gns3-radius-xl: 28px;
  --gns3-elevation-1: 0 1px 2px rgb(0 0 0 / var(--gns3-shadow-opacity-light));
  --gns3-elevation-2: 0 2px 6px rgb(0 0 0 / var(--gns3-shadow-opacity-normal));
}
[data-density='compact'] { --gns3-space-3: 8px; --gns3-space-4: 12px; }
```
0.2. Extend `ThemeService` to expose **density** signal (`comfortable` |
`compact`) and set `data-density` on `<html>`.
0.3. Add `app-stat-card` and `app-health-chip` standalone components with
OnPush + signal inputs, in `src/app/components/common/`.
0.4. Add `app-command-palette` skeleton (Angular Material `cdk-menu` +
`cdk-dialog`) — wired to a static action list for now; full keybindings in
Phase 3.
0.5. Update `docs/guides/css/02-material3-variables.md` with the new
`--gns3-*` scale and density contract.
0.6. Document this plan + mockup in `docs/redesign/`.

**Exit criteria:** `yarn ng lint` clean, mockup renders, no visual change
yet on routes.

---

### Phase 1 — App Shell (≈ 2 days)

**Goal:** a single app shell replaces `default-layout`. Old routes render
unchanged inside it; visual upgrade only at the chrome level.

1.1. Generate `app-shell` (standalone, OnPush, signals).
1.2. Implement `app-nav-rail` (collapsed → icon-only FAB rail; expanded → 240px
drawer pinned to top bar). Reuse the existing nav-list items from
`default-layout.component.html` lines 19–94, but restyle per M3 nav rail spec.
1.3. Implement `app-top-bar`:
- Breadcrumb from router data (project / controller / section).
- Global search trigger → opens `app-command-palette`.
- Right cluster: status chip (live/echo WebSocket status), profile menu
  (user info, API keys, AI profile, docs, logout — moved verbatim from
  `default-layout.component.html` lines 151–192).
1.4. Implement `app-status-bar` — fixed bottom strip showing compute name,
version, health dots, current node count (subscribes to project / compute
status signals).
1.5. Register ShellLayout per child routes. Replace `default-layout` in
`app-routing.module.ts`.
1.6. Deprecate `default-layout` after parity verification, but retain it
behind the shell feature flag through the staged rollout. Delete it only after
the rollback window closes; do not maintain both beyond that release.

**Exit criteria:** every existing route loads inside the new shell, no
horizontal scrollbars at 1280px / 768px, mobile rail collapses.

---

### Phase 2 — Topology Workspace (≈ 3 days) ⭐

**Goal:** EVE-NG-like topology-first experience.

2.1. Move the existing `/controller/:controller_id/project/:project_id`
route under the new shell and mark it as a full-bleed route through route
data. Keep the public URL stable; do not add a `/topology` suffix unless a
redirect and bookmarked-link migration are also provided.
2.2. Convert the titlebar (`project-map.component.html` lines 1–55) into a
**floating canvas toolbar**: rounded Material 3 surface-container-high pill,
top-center, contains node-add / link-draw / nodes-menu / context-menu /
marker legend / summary toggle.
2.3. Move project-level actions (save, import, export, snapshot, settings)
up into the breadcrumb overflow menu in `app-top-bar`.
2.4. Implement `app-right-panel` (28px corner radius, dismissible, persists
per project) with tabbed sections:
- Topology summary (existing `topology-summary` moved here).
- Node Inspector (new selection-driven panel).
- Link Inspector (new selection-driven panel).
- Console tabs (existing `web-console-full-window` moved into panel).
- Configuration workspace (existing startup/private configuration actions
  are surfaced here; Phase 4 adds diff and deployment review).
- Wireshark capture (existing `web-wireshark-inline` moved here).
- AI Chat (existing `ai-chat` moved here as a panel option).
2.5. Implement `app-inventory` (CML-style): tree of groups → nodes with
search/filter, click → center map + select. Lives in right panel as a
second tab surface.
2.6. Implement `app-marker-legend` rail (top-right of canvas) — port
existing marker logic in `docs/features/symbols`.

**Exit criteria:** topology loads via the new route, right panel docks all
information panels without overlapping the canvas, floating toolbar does
not collide with nodes.

---

### Phase 3 — Dashboard & Telemetry (≈ 2 days)

**Goal:** CML-like data-rich landing page.

3.1. Refactor `dashboard.component.html` to use `app-stat-card` and a Material 3 grid (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`).
3.2. Add **telemetry widgets**:
- Compute health (CPU / mem / disk as `mat-progress-bar` with M3 track).
- Active projects table (`mat-table`), columns: name, nodes, status, owner, modified.
- Recent activity timeline (`mat-list` with leading `mat-icon`).
3.3. Move **Controllers grid** into the Dashboard as a "compute portfolio"
section; `/controllers` becomes a redirect.
3.4. Wire quick actions into `app-command-palette` (open last project,
new project, import appliance, jump to templates, open AI chat).
3.5. Add `prefers-reduced-motion` guards around new transitions.

**Exit criteria:** dashboard signals refresh on interval, telemetry leads
the page, quick stats accessible.

---

### Phase 4 — Configuration Management (≈ 3–5 days)

**Goal:** turn scattered node configuration actions into a safe, focused
workflow without overstating backend capabilities.

4.1. Build `app-config-workspace` as a right-panel tab with:

- current selection and multi-select node list;
- configuration type selector (`network`, `startup`, `private`, only when
  supported by the selected node type);
- editor with dirty-state indicator, reload, import, export, and save;
- a read-only diff between the last fetched value and the edited value;
- explicit validation and deploy-review steps before writing.

4.2. Reuse existing methods in `src/app/services/node.service.ts`:
`getNetworkConfiguration`, `saveNetworkConfiguration`,
`getStartupConfiguration`, `getPrivateConfiguration`, `saveConfiguration`,
and `savePrivateConfiguration`. Move orchestration into a facade rather than
duplicating HTTP calls in the new component.

4.3. Add `ConfigurationWorkspaceStore` using signals:
`selectedNodes`, `configType`, `baseline`, `draft`, `dirty`, `validation`,
`saveState`, and `conflict`. Key drafts by controller/project/node/config
type so switching selection does not discard edits.

4.4. Add optimistic-concurrency protection. Preferred server contract is an
ETag/revision returned with a configuration read and required by a write.
Until available, re-fetch before save and show a three-way conflict dialog
when the baseline changed.

4.5. Add safe multi-node workflow:

1. choose nodes;
2. preview generated per-node configuration;
3. validate node support and permissions;
4. review diff and affected-node count;
5. confirm;
6. apply sequentially with per-node progress;
7. show success/failure summary and offer export.

Do not silently retry writes and do not present bulk save as transactional
unless the server guarantees rollback.

4.6. Add server contracts for capabilities not currently authoritative:

| Capability | Suggested API contract | UI fallback |
|---|---|---|
| Running configuration | `GET /projects/{pid}/nodes/{nid}/config/running` with timestamp/source | Show “Unavailable for this node”; never substitute startup config. |
| Validation | `POST .../config/validate` returning warnings/errors with line numbers | Client checks only syntax shape and empty/oversize input. |
| Revision history | `GET/POST .../config/revisions` with actor, hash, timestamp, and source | Hide History tab. Do not use local storage as audit history. |
| Deployment job | `POST /projects/{pid}/configuration-jobs` plus progress stream | Sequential existing API writes with an explicit non-atomic warning. |
| Rollback | `POST .../configuration-jobs/{job}/rollback` | Restore only a user-exported baseline with confirmation. |

4.7. Permission and audit requirements:

- read, edit, deploy, and history are separate capabilities;
- secrets are redacted before logs, telemetry, AI context, or error reports;
- every write records controller, project, node, config type, actor, revision,
  result, and timestamp on the server;
- AI-proposed changes always land as a reviewable draft and never auto-apply.

**Exit criteria:** single-node startup/private configuration edit, import,
export, diff, conflict handling, and save work through existing APIs; missing
running/history capabilities are honestly represented; bulk writes show
per-node outcomes.

---

### Phase 5 — Management, Preferences, Settings (≈ 2 days)

**Goal:** unify the three "admin" surfaces.

5.1. Convert `management` component (21-line shell) to Material 3 tab bar
with leading icons + count badges (users, roles, groups, ACLs, API keys).
5.2. Reorganize `preferences` into a **grouped Material 3 settings page**
(QEMU, IOS-on-UNIX, Dynamips, Docker, VMware, VirtualBox, VPCS, built-in,
general) using `mat-expansion-panel` already styled in
`styles.scss` lines 428–483 — keep that override.
5.3. Settings (top-level): turn into three tabs — *General*, *Appearance*
(theme + density + map background), *Server / Default compute*. Add a live
    preview block for the *Appearance* tab.
5.4. System status page: replace ad-hoc layout with Material 3 cards +
`mat-grid-list` and live WebSocket updates (already present via services).
5.5. Image manager, computes, resource pools: visually equalize spacing,
introduce `app-stat-card`-like header pattern.

**Exit criteria:** all admin pages share a consistent page-header pattern
and density behaviour.

---

### Phase 6 — Visual Polish & Micro-interactions (≈ 1 day)

6.1. Ripple/hover state tokens; replace bootstrap leftovers (the project
still pulls BS 5.3.8) by scoping remaining uses to legacy `$ dialogs.
6.2. Replace project-map tooltip styling, ensure focus-visible rings use
`--mat-sys-primary` token.
6.3. Build a single **`prefers-reduced-motion` shim** in
`styles/_motion.scss` and import from `styles.scss`.
6.4. Audit `dist` build for CSS size regression.

---

### Phase 7 — Tests, Rollout & Docs (≈ 2 days)

7.1. Update component specs affected by template split (`default-layout`,
`management`, `dashboard`).
7.2. Add Playwright visual smoke tests at 1440×900, 1024×768, 768×1024, and
390×844 in both light/dark themes and comfortable/compact density.
against the new shell.
7.3. Update `CLAUDE.md` references pointing to new layout, and create
`docs/redesign/changeset.md` summarizing migration steps for users.
7.4. Add `docs/guides/css/density-tokens.md`.
7.5. Ship behind `modernShell` and `configurationWorkspace` feature flags.
Start with maintainers, then opt-in users, then default-on after telemetry and
support review. Keep the old shell for one release only; define removal date.

**Exit criteria:** automated checks pass, visual/accessibility baselines are
accepted, feature flags can independently disable the shell and configuration
workspace, and rollback has been rehearsed.

---

### Delivery sequence

The estimate is **14–16 engineering days** for one experienced Angular
developer, plus product/design review and any server work needed for advanced
configuration capabilities.

| Increment | Phases | Demonstrable outcome | Dependency |
|---|---|---|---|
| Sprint A | 0–1 | Token foundation and modern shell around unchanged routes | None |
| Sprint B | 2 | Full-bleed topology workbench with contextual panels | Shell |
| Sprint C | 3 | Data-rich dashboard and command palette | Shared cards, shell |
| Sprint D | 4 | Supported config editor/diff/save; backend capability contracts | Workbench, existing `NodeService` |
| Sprint E | 5–6 | Unified admin surfaces and polish | Shared page patterns |
| Release candidate | 7 | Responsive/a11y evidence, flags, rollout and rollback | All prior phases |

Do not block the shell release on server-side history or bulk-job APIs. Ship
the configuration workspace with supported single-node operations, capability
flags, and honest disabled states, then progressively enable server-backed
features.

### Responsive behavior contract

| Width | Navigation | Workbench | Context panel |
|---|---|---|---|
| ≥ 1440px | Expanded 240px rail | Canvas, toolbar, status bar | 360–420px docked right |
| 1024–1439px | 72px icon rail | Full canvas, compact toolbar | 320–360px docked right |
| 768–1023px | Icon rail or temporary drawer | Canvas remains primary | Resizable bottom sheet |
| < 768px | Modal navigation drawer | Touch toolbar, no hover-only actions | Bottom sheet with snap points |

At every width, project save state and controller health remain visible.
Critical node actions must not depend on right-click, hover, or precise pointer
input.

### Verification matrix

| Layer | Required coverage |
|---|---|
| Unit | Shell state, route breadcrumb mapping, panel persistence, config dirty/conflict state, permissions, redaction |
| Component | Keyboard rail navigation, command palette, node selection → inspector/config, save review, partial bulk failure |
| API contract | Supported config types per node, revision/ETag behavior, 401/403/409/422/5xx handling |
| Accessibility | Automated axe scan plus manual keyboard, screen reader, 200% zoom, high contrast, reduced motion |
| Visual | Four target viewports × two themes × two densities; canvas and every docked panel |
| Performance | Route lazy loading, canvas FPS with panel open, bundle size, dashboard update frequency, memory after console churn |
| Security | Config redaction, HTML escaping, permission bypass attempts, audit events, AI-context opt-in |

---

## 6. TASK FILE – Atomic TODO Checklist

Copy into `docs/todo/redesign-todos.md` for tracking.

- [ ] P0  Create `src/styles/_tokens.scss` with `--gns3-space-*`, `--gns3-radius-*`, `--gns3-elevation-*`.
- [ ] P0  Extend `ThemeService` with `density` signal + `data-density` attribute.
- [ ] P0  Add `app-stat-card` standalone component.
- [ ] P0  Add `app-health-chip` standalone component.
- [ ] P0  Add `app-command-palette` skeleton (Ctrl/Cmd+K).
- [ ] P0  Document tokens in `docs/guides/css/02-material3-variables.md`.
- [ ] P0  Commit this plan + mockup (`docs/redesign/`).
- [ ] P1  Create `app-shell` component.
- [ ] P1  Create `app-nav-rail` component.
- [ ] P1  Create `app-top-bar` component (breadcrumb, search, status, profile).
- [ ] P1  Create `app-status-bar` component.
- [ ] P1  Switch `app-routing.module.ts` to use `app-shell`.
- [ ] P1  Retain `default-layout` only as a feature-flag rollback path.
- [ ] P2  Move the stable project-map route under the shell as full-bleed.
- [ ] P2  Build floating canvas toolbar (replace `#project-titlebar`).
- [ ] P2  Move project-menu items into top-bar breadcrumb overflow.
- [ ] P2  Build `app-right-panel` with tabbed sections.
- [ ] P2  Migrate `topology-summary`, `console-wrapper`, `ai-chat` into right panel.
- [ ] P2  Build `app-inventory` tree (groups → nodes).
- [ ] P2  Build `app-marker-legend` rail.
- [ ] P2  Add `node-inspector` and `link-inspector`.
- [ ] P3  Refactor `dashboard` to stat-card grid + telemetry widgets.
- [ ] P3  Add compute health widget (CPU/mem/disk).
- [ ] P3  Add active projects `mat-table`.
- [ ] P3  Add recent-activity `mat-list`.
- [ ] P3  Fold `/controllers` into Dashboard; redirect.
- [ ] P3  Populate command palette actions.
- [ ] P3  Add `prefers-reduced-motion` guards.
- [ ] P4  Build configuration workspace and signal store.
- [ ] P4  Reuse `NodeService` read/write APIs through a facade.
- [ ] P4  Add baseline-versus-draft diff and dirty-state protection.
- [ ] P4  Add re-fetch conflict detection and three-way conflict dialog.
- [ ] P4  Add capability-aware config type selector and permission gates.
- [ ] P4  Add reviewed, per-node bulk workflow with non-atomic warning.
- [ ] P4  Specify running-config, validation, revision, job, and rollback APIs.
- [ ] P4  Add audit/redaction tests, including AI draft behavior.
- [ ] P5  Upgrade `management` to Material 3 tabs + badges.
- [ ] P5  Refactor `preferences` into grouped expansion panels.
- [ ] P5  Reorganize `settings` into 3 tabs + live appearance preview.
- [ ] P5  Rebuild `system-status` with `mat-grid-list`.
- [ ] P5  Equalize `image-manager`, `computes`, `resource-pools` headers.
- [ ] P6  Audit bootstrap leftovers; isolate legacy dialog uses.
- [ ] P6  Unify focus-visible ring tokens.
- [ ] P6  Create `styles/_motion.scss` reduced-motion shim.
- [ ] P6  Verify `yarn ng build` bundle size regression < 5%.
- [ ] P7  Update specs for refactored components.
- [ ] P7  Add responsive visual and accessibility smoke tests.
- [ ] P7  Add independent feature flags and rehearse rollback.
- [ ] P7  Update `CLAUDE.md` + add `docs/redesign/changeset.md`.

---

## 7. Risk Register

| Risk | Mitigation |
|---|---|
| Zoneless regression from new signals in shell | Use `effect()` for router breadcrumbs; `cd.markForCheck()` only where async subscribe updates viewmodel. |
| Bootstrap × Material conflicts | Audit `dist` CSS for `.bs-*` bleed; Phase 6 contains removal. |
| Right-panel drag layout interferes with D3 viewport | Panel uses `cdk-drop-list` outside the SVG element; map still receives pointer events. |
| Configuration write overwrites a newer server value | Require revision/ETag when available; otherwise re-fetch and present a conflict before save. |
| Bulk configuration partially succeeds | Treat operation as a job with per-node results; never label it transactional without server rollback. |
| Secrets leak through logs, AI, or analytics | Redact configuration content by default and test every outbound telemetry/AI boundary. |
| Performance hit from many stat cards | `trackBy` for `@for`, `OnPush` everywhere, lazy-load AI chat panel. |
| Existing routes break on shell swap | Phase 1 enables both old/new routing during migration; remove only after parity verified by spec. |
| Hard-coded color protection husky hook | Verify SCSS uses `var(--mat-sys-*)` only — no fallback values permitted per `CLAUDE.md`. |

---

## 8. Acceptance Criteria (Definition of Done)

1. All routes render inside the new `app-shell` with no console errors.
2. Topology page exposes canvas, floating toolbar, right panel, status bar.
3. Dashboard surfaces compute health, project table, recent activity.
4. Density toggle visually shifts spacing globally.
5. Configuration workspace edits supported startup/private configs with
   baseline diff, conflict protection, permission checks, and explicit save.
6. Unsupported running/history operations are disabled with a useful reason.
7. `yarn ng lint`, `yarn ng test --watch=false`, `yarn ng build` all green.
8. Visual diff screenshots show no broken dialogs (centralized in
   `src/styles/_dialogs.scss`).
9. Documentation updated: `CLAUDE.md`, `docs/guides/css/*`,
   `docs/redesign/changeset.md`.
10. No new hard-coded colors (husky pre-commit acceptance).
11. Keyboard-only navigation, 200% zoom, reduced motion, and screen-reader
    names pass the test matrix; state is never communicated by color alone.

### Outcome metrics

Capture a baseline before Phase 1, then compare after the opt-in rollout:

| Metric | Target |
|---|---|
| Time from project open to first node console | 25% faster in moderated task test |
| Time to edit and save a startup config | 30% faster; zero lost-draft incidents |
| Users finding compute health without help | At least 90% |
| Keyboard completion of core topology tasks | 100% of defined critical-path test cases |
| Layout shift during shell load | CLS below 0.1 |
| Shell bundle-size regression | Less than 5% after lazy loading |
| Configuration conflicts silently overwritten | Zero |

---

## 9. Out-of-scope Follow-ups

- Role-based field visibility (RBAC) beyond existing `acl-management`.
- Lab topology diff viewer.
- Multi-controller federated dashboard.
- Per-project dark/light theme override.
- Stellar / satellite map background presets (kept as a post-Phase-6 cosmetic follow-up).
