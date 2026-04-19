# ConnectionManagerService

  > AI-assisted documentation. [See disclaimer](../../README.md). 


> **Simple Controller Connection Management**

**Version**: 3.1.0-dev.1
**Last Updated**: 2026-04-18
**Service**: `ConnectionManagerService`
**Status**: ✅ Production Ready

---

## License

<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

---

## Architecture Overview

`ConnectionManagerService` is a lightweight service (~62 lines) that manages controller connections at the application level. It prevents duplicate connections to the same controller and handles controller switching. Actual WebSocket management is delegated to `NotificationService`.

### Service Design

```
┌─────────────────────────────────────────────────────────┐
│           ConnectionManagerService                       │
│             (Simple Controller Tracker)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  State                                          │     │
│  │  • currentController: Controller | null        │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Methods                                        │     │
│  │  • establishConnection(controller)              │     │
│  │  • disconnect()                                 │     │
│  │  • getCurrentController()                       │     │
│  │  • isConnectedTo(controller)                    │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         │
                         │ delegates to
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NotificationService                         │
│           (Actual WebSocket Manager)                     │
│  • WebSocket connection management                      │
│  • Compute notifications handling                       │
│  • Compute caching (Map<compute_id, Compute>)           │
│  • Controller-level & project-level notification paths  │
│  • Token-based authentication in WebSocket URL          │
└─────────────────────────────────────────────────────────┘
```

### Component Integration

`ConnectionManagerService` is used by three components. `NotificationService` is additionally used directly by `ProjectMapComponent` for project-level WebSocket connections.

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Integration Points                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ConnectionManagerService consumers:                                  │
│                                                                       │
│  ┌─────────────────┐   Trigger: Login success                         │
│  │  LoginComponent  │─────────────────────────────────────────────┐   │
│  └─────────────────┘                                              │   │
│                                                                    │   │
│  ┌─────────────────┐   Trigger: Auto-login via URL                 │   │
│  │  AppComponent    │──────────────────────────────────────────┐   │   │
│  └─────────────────┘                                         │   │   │
│                                                               ▼  ▼   │
│                                                  establishConnection() │
│                                                    (with controller)  │
│                                                               ▲  ▲   │
│  ┌─────────────────┐   Trigger: Logout                        │   │   │
│  │ DefaultLayout    │──────────────────────────────────────────┘   │   │
│  │  Component       │   calls disconnect()                          │   │
│  └─────────────────┘                                               │   │
│                                                                     │   │
│  NotificationService consumers (direct):                            │   │
│                                                                     │   │
│  ┌──────────────────┐   Trigger: Open project                       │   │
│  │ ProjectMap        │   uses projectNotificationsPath()            │   │
│  │  Component        │   to create project-level WebSocket          │   │
│  └──────────────────┘                                               │   │
│                                                                     │   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Flow Description

### Connection Lifecycle

```
User Action         ConnectionManagerService      NotificationService
─────────────────    ──────────────────────      ───────────────────
                    │                                │
Login           →   │                                │
                    │   establishConnection()        │
                    │   ──────────────────→          │
                    │                                │   connectToComputeNotifications()
                    │                                │   ─────────────────────→
                    │                                │
                    │                                │   WebSocket created
                    │                                │
Switch Controller→  │                                │
                    │   establishConnection(new)     │
                    │   ├─ Check: same controller?   │
                    │   │   └─ No → continue         │
                    │   ├─ disconnect()              │
                    │   │   └─ closes old WS         │
                    │   └─ establish new connection  │
                    │                                │
Logout          →   │                                │
                    │   disconnect()                 │
                    │   └─ delegates to NS.disconnect()
                    │      which closes WS,          │
                    │      clears controller + cache │
                    │                                │
```

### Flow: Login (LoginComponent)

```
User enters credentials
    │
    ▼
Authentication request
    │
    ▼
Receive access token
    │
    ▼
Store token on controller object
    │
    ▼
connectionManager.establishConnection(controller)
    │
    ▼
Navigate to projects page
```

### Flow: Auto-login (AppComponent)

When the application loads or the URL changes, `AppComponent` checks for auto-login:

```
Route navigation ends
    │
    ▼
Extract controller_id from URL  ─── No match → Stop
    │
    ▼ (has controller_id)
Fetch controller from database
    │
    ▼
Controller has auth token?  ─── No → Stop
    │
    ▼ (yes)
connectionManager.establishConnection(controller)
```

### Flow: Logout (DefaultLayoutComponent)

```
User clicks logout
    │
    ▼
Clear auth token on controller
    │
    ▼
Persist updated controller (no token)
    │
    ▼
connectionManager.disconnect()
    │
    ▼
Navigate to login page
```

### Flow: Project WebSocket (ProjectMapComponent)

`ProjectMapComponent` directly injects `NotificationService` to create a separate project-level WebSocket connection, independent of `ConnectionManagerService`.

```
Open project in map
    │
    ▼
Create WebSocket via
notificationService.projectNotificationsPath(controller, project_id)
    │
    ▼
Receive project-level notifications
(node/link/drawing events)
    │
    ▼
Close on component destroy
```

---

## Implementation Logic

### ConnectionManagerService Responsibilities

The service maintains a single `currentController` reference and exposes four methods:

- **establishConnection(controller)**: Skips if already connected to the same controller (compared by ID). Disconnects existing connection before establishing a new one when switching controllers. Delegates to `NotificationService.connectToComputeNotifications()`.
- **disconnect()**: Calls `NotificationService.disconnect()` (which closes WebSocket, clears controller reference and compute cache), then clears its own `currentController` reference. No-op when not connected.
- **getCurrentController()**: Returns the currently connected controller. The return type annotation is `Controller` but the value can be `null` — consumers must handle this.
- **isConnectedTo(controller)**: Compares controller IDs to check connectivity.

### NotificationService Responsibilities

`NotificationService` is the actual WebSocket manager with the following capabilities:

**WebSocket Connection Management:**
- Opens WebSocket connection to controller notifications endpoint
- Protocol selection: `ws://` for `http:`, `wss://` for `https:`
- Token-based authentication via URL query parameter
- Error handling: logs to console
- Close handling: clears WebSocket reference, preserves controller reference for potential future reconnection

**Two Notification Path Builders:**

| Method                          | URL Pattern                                                                              |
|---------------------------------|------------------------------------------------------------------------------------------|
| `notificationsPath`             | `{ws/wss}://{host}:{port}/{version}/notifications/ws?token={token}`                     |
| `projectNotificationsPath`      | `{ws/wss}://{host}:{port}/{version}/projects/{id}/notifications/ws?token={token}`       |

**Compute Notification Events:**

| Event               | Cache Action        | Emitted via                      |
|----------------------|---------------------|----------------------------------|
| `compute.created`    | Add to cache        | `computeNotificationEmitter`     |
| `compute.updated`    | Update in cache     | `computeNotificationEmitter`     |
| `compute.deleted`    | Remove from cache   | `computeNotificationEmitter`     |

After each cache mutation, `computeCacheUpdated` emits the full updated compute list.

**Compute Cache:**

```
┌───────────────────────────────────────────────────┐
│              Compute Cache                         │
│             (Map<compute_id, Compute>)             │
├───────────────────────────────────────────────────┤
│                                                    │
│  setInitialComputes(computes)                      │
│     └─ Initialize cache from HTTP response         │
│                                                    │
│  getCachedComputes()                               │
│     └─ Returns all cached computes as array        │
│                                                    │
│  hasCachedData()                                   │
│     └─ Check if cache contains data                │
│                                                    │
│  computeCacheUpdated                               │
│     └─ EventEmitter, fires on every cache change   │
│                                                    │
│  Cleared on: disconnect()                          │
│                                                    │
└───────────────────────────────────────────────────┘
```

### Design Decisions

**Simple State Management:** The application only connects to one controller at a time, so no complex connection pooling is needed. A single `currentController` reference provides a clear source of truth.

**Delegation to NotificationService:** `NotificationService` already manages WebSocket connections. Separating concerns — `ConnectionManagerService` for controller lifecycle, `NotificationService` for WebSocket and notifications — avoids duplication and keeps each service focused.

**No Automatic Reconnection:** Controller connections are user-initiated (login/switch). `NotificationService` handles WebSocket-level close/error events but does not auto-reconnect. When the WebSocket closes unexpectedly, `NotificationService` preserves the controller reference internally for potential future reconnection support, but currently no automatic reconnection occurs.

### Testing

| Service                    | Status     | Details                                                                      |
|----------------------------|------------|------------------------------------------------------------------------------|
| NotificationService        | ✅ Tested  | `notification.service.spec.ts` — URL building, lifecycle, events, cache      |
| ConnectionManagerService   | ❌ Pending | No spec file exists yet                                                      |

**Source files:**
- `src/app/services/connection-manager.service.ts`
- `src/app/services/notification.service.ts`
- `src/app/services/notification.service.spec.ts`
