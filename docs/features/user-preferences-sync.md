# User Preferences Sync

User-scoped UI preferences are mirrored between localStorage (the working copy) and a per-user preferences document on the controller (`GET`/`PUT /v3/access/users/me/preferences`), so a user's settings follow them across browsers and machines. The endpoint requires only an authenticated session — no additional privilege.

## Architecture Overview

```mermaid
graph TB
  subgraph Consumers["Consumer services & components"]
    THEME["ThemeService"]
    MAP["MapSettingsService"]
    SET["SettingsService"]
    XTERM["XtermService"]
    DENS["InterfaceDensityService"]
    NC["NotificationCenterService"]
    COMP["Template list dialog / Project map"]
  end

  subgraph Sync["UserPreferencesService"]
    FACADE["Storage facade<br/>(allowlist-filtered writes)"]
    MERGE["Merge engine<br/>(per-key last-write-wins)"]
    PUSH["Debounced pusher<br/>(whole-document PUT)"]
  end

  LS[("localStorage<br/>working copy")]
  BASE[("Local baseline snapshot<br/>(last-synced values, local-only key)")]

  GUARD["LoginGuard<br/>(sync trigger after auth)"]
  LAYOUT["DefaultLayout<br/>(invalidate on logout)"]
  HTTP["HttpController"]
  API[("Controller<br/>/v3/access/users/me/preferences")]

  Consumers -->|"setItem / removeItem"| FACADE
  FACADE -->|"immediate write"| LS
  FACADE -->|"mark dirty"| PUSH
  GUARD -->|"sync(controller)"| MERGE
  LAYOUT -->|"invalidate()"| MERGE
  MERGE -->|"apply server values / notify re-read"| LS
  MERGE -->|"callbacks"| Consumers
  MERGE <--> BASE
  PUSH <--> BASE
  PUSH --> HTTP
  HTTP --> API
  MERGE --> HTTP
```

Key responsibilities:

- **UserPreferencesService** — the only component that talks to the endpoint. Acts as a localStorage-compatible facade for consumers, decides what is synced (allowlist), merges the server document on login, and pushes with a debounce. It is a construction-time DI leaf (constructor injects only `Injector`; `HttpController`/`ToasterService` are resolved lazily) because constructor-injecting them would close an instantiation cycle through `NotificationCenterService`.
- **localStorage** — the working copy. Reads are always synchronous and local; the app renders with correct preferences before any server round-trip and keeps working when the controller is unreachable.
- **Local baseline snapshot** — a local-only key recording the value of every synced key as of the last successful push. It is the input for local-edit detection and is deliberately excluded from the allowlist.

## Flow Description

Login-time merge (once per controller per session):

```mermaid
flowchart TD
  A["LoginGuard: session authenticated"] --> B["GET preferences document"]
  B -->|404| X["Legacy controller:<br/>disable sync for session"]
  B --> C["Per-key merge over allowlist"]
  C --> D{"Key modified locally<br/>since last push?<br/>(baseline comparison)"}
  D -->|no| E["Server value wins<br/>→ write localStorage"]
  D -->|yes| F["Local value wins<br/>→ kept for upload"]
  E --> G["Merged union differs from server document?"]
  F --> G
  G -->|yes| H["PUT merged document<br/>(seed / reconcile)"]
  G -->|no| I["Advance baseline only"]
  H -->|push succeeded| J["Advance + persist baseline"]
  E --> K["Fire external-update callbacks:<br/>services re-read their keys"]
```

Write flow (user changes a setting):

```mermaid
flowchart LR
  A["Consumer writes via facade"] --> B["localStorage updated immediately<br/>(UI reflects change at once)"]
  B --> C["Synced key? → mark dirty"]
  C --> D["2 s debounce"]
  D --> E["Whole-document PUT<br/>(allowlist keys present locally)"]
  E -->|success| F["Baseline snapshot persisted"]
  E -->|413 oversize| G["Throttled warning toast;<br/>local value keeps working"]
  E -->|other failure| H["Silent; next write retries,<br/>baseline keeps detecting the edit"]
```

## Implementation Logic

**Allowlist as the boundary.** `SYNCED_PREFERENCE_KEYS` is the single decision point for what leaves the browser. It is both the security boundary (session tokens, the controller registry, remember-me data, notification history and window geometry are never synced) and the size boundary. Values are stored as the exact localStorage strings, so the sync layer needs no per-setting schema and each consumer keeps its existing parsing.

**Document shape.** The server document is `{"version": 1, "webui": {key: value}}`. The whole document is replaced on PUT (server semantics), while merging is done per key on the client.

**Per-key last-write-wins with a baseline.** The server applies whole-document last-write-wins; the client narrows that to per-key resolution by remembering, for each key, the value it last pushed (or merged). A key whose local value differs from that baseline is "locally edited" and beats the server on the next merge; otherwise the server value wins and is applied locally. The baseline advances only on a successful push, so a failed push keeps the edit detectable. The baseline is persisted locally, which extends this protection to edits made in a previous session (e.g. changed while offline, browser closed before a retry).

**Degradation ladder.** A 404 on the first GET (controller predates the endpoint) disables syncing for the session and the facade degrades to plain localStorage. A document exceeding the 256 KiB server cap is rejected locally with a throttled warning toast. All other failures are silent: localStorage remains authoritative, writes retry on the next change and the next login re-fetches.

**Account isolation on shared browsers.** Logout clears the local mirror of all synced keys and the baseline, then fires the external-update callbacks so cached service fields fall back to defaults. The next login rebuilds the mirror purely from that user's server document — a different user on the same browser neither inherits the previous user's values nor seeds them into their own document. Because logging in requires a reachable controller, this clearing has no offline cost. The theme deliberately stays visually unchanged across logout until the next merge.

**Synced keys by configuration surface.**

| Surface | Keys |
|---|---|
| Settings → Appearance | `theme`, `mapTheme`, `gns3_interface_density` |
| Settings → Project workspace | `openReadme`, `openConsolesInWidget`, `defaultShowGrid`, `defaultSnapToGrid`, `defaultSceneWidth`, `defaultSceneHeight`, `defaultGridSize`, `defaultDrawingGridSize`, `defaultLabelStyle`, `defaultNoteStyle`, `defaultLinkStyle` |
| Settings → Console | `console_command` |
| Settings → Privacy | `crash_reports`, `statistics_command` |
| Workspace console window settings panel | `gns3_console_appearance` |
| Project map toggles | `layersVisibility`, `gridVisibility`, `symbolScaling`, `showInterfaceLabels`, `integrateLinkLabelsToLinks`, `consoleContextMenu` |
| Add-nodes dialog | `addNodesViewMode` |
| Notification center | `notificationsVisibility` |

**Explicitly not synced.** Per-project data (e.g. per-link rendering style — persisted by the controller in each link's `link_style` and written to the `.gns3` topology file, not mirrored in localStorage), anything security- or session-scoped, transient caches, and screen-size-dependent window geometry. BPF presets are a planned second phase.
