# ConnectionManagerService

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

## Service Overview

`ConnectionManagerService` is a lightweight service that manages controller connections at the application level. It prevents duplicate connections to the same controller and handles controller switching.

**Key Characteristics:**
- Simple: Only 62 lines of code
- Single Responsibility: Track current controller
- Delegate: Actual WebSocket managed by `NotificationService`
- Duplicate Prevention: Avoids redundant connections

---

## Architecture

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
│  • Compute caching                                      │
│  • Project-level notification path                      │
└─────────────────────────────────────────────────────────┘
```

### Connection Flow

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

---

## API Reference

### Methods

#### establishConnection(controller)

Establishes a connection to the specified controller.

**Behavior:**

| Condition                      | Action                              |
|-------------------------------|-------------------------------------|
| Already connected to same controller | Skip (no-op)                     |
| Switching to different controller    | Disconnect old, establish new    |
| First connection                     | Establish new connection         |

**Delegates to:** `NotificationService.connectToComputeNotifications(controller)`

#### disconnect()

Disconnects from the current controller.

**Behavior:**

| Step | Performed by                | Action                        |
|------|-----------------------------|-------------------------------|
| 1    | ConnectionManagerService    | Call `NotificationService.disconnect()` |
| 2    | NotificationService         | Close WebSocket connection    |
| 3    | NotificationService         | Clear compute cache           |
| 4    | ConnectionManagerService    | Clear controller reference    |

If not connected, this is a no-op.

#### getCurrentController()

Returns the currently connected controller. Returns `null` when not connected.

> **Note:** The actual return type annotation is `Controller`, but the value can be `null`. Consumers should handle the null case.

#### isConnectedTo(controller)

Checks if currently connected to the specified controller by comparing controller IDs.

**Returns:** `true` if connected to the given controller, `false` otherwise.

---

## Component Integration

### Integration Points

The service is used by three components in the application:

```
┌──────────────────────────────────────────────────────────────┐
│                     Integration Points                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐   Trigger: Login success                 │
│  │  LoginComponent  │─────────────────────────────────────┐   │
│  └─────────────────┘                                      │   │
│                                                            │   │
│  ┌─────────────────┐   Trigger: Auto-login via URL         │   │
│  │  AppComponent    │──────────────────────────────────┐   │   │
│  └─────────────────┘                                   │   │   │
│                                                         ▼  ▼   │
│                                            establishConnection()│
│                                              (with controller) │
│                                                         ▲  ▲   │
│  ┌─────────────────┐   Trigger: Logout                  │   │   │
│  │ DefaultLayout    │───────────────────────────────────┘   │   │
│  │  Component       │   calls disconnect()                    │   │
│  └─────────────────┘                                         │   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
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

This handles the case where a user has previously authenticated and revisits the application via a bookmarked URL.

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

---

## Design Decisions

### Why Simple State Management?

**Rationale:**
- Application only connects to one controller at a time
- No need for complex connection pooling
- Single source of truth for current controller
- Easy to understand and maintain

### Why Delegate to NotificationService?

**Rationale:**
- `NotificationService` already manages WebSocket connections
- Clear separation of concerns:
  - `ConnectionManagerService` — Controller lifecycle
  - `NotificationService` — WebSocket and notifications
- Avoids code duplication
- NotificationService owns compute caching logic

### No Automatic Reconnection

**Decision:** ConnectionManagerService does NOT implement auto-reconnection.

**Rationale:**
- Controller connections are user-initiated (login/switch)
- Reconnection should be explicit user action
- NotificationService handles WebSocket-level close/error events
- Application can show "disconnected" state and prompt user

> **Note:** When the WebSocket closes unexpectedly, `NotificationService` keeps the controller reference internally (does not clear it). This preserves state in case a future reconnection feature is added, but currently no automatic reconnection occurs.

---

## NotificationService Detail

`NotificationService` is the actual WebSocket manager. Below is a summary of its responsibilities beyond what `ConnectionManagerService` delegates to.

### WebSocket Connection Management

| Capability                         | Description                                           |
|------------------------------------|-------------------------------------------------------|
| Create WebSocket                   | Opens connection to controller notifications endpoint |
| Protocol selection                 | `ws://` for http, `wss://` for https                  |
| Token-based authentication         | Auth token passed as URL query parameter              |
| Error handling                     | Logs errors to console                                |
| Close handling                     | Clears WebSocket reference, preserves controller      |

### Compute Notification Events

The service listens for three types of compute notifications from the server:

| Event               | Cache Action        | Emitted via                      |
|----------------------|---------------------|----------------------------------|
| `compute.created`    | Add to cache        | `computeNotificationEmitter`     |
| `compute.updated`    | Update in cache     | `computeNotificationEmitter`     |
| `compute.deleted`    | Remove from cache   | `computeNotificationEmitter`     |

After each cache mutation, the `computeCacheUpdated` emitter fires with the full updated compute list.

### Compute Caching

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

### Notification Path Builders

The service builds two types of WebSocket URLs:

| Method                          | Purpose                        | URL Pattern                                        |
|---------------------------------|--------------------------------|----------------------------------------------------|
| `notificationsPath`             | Controller-level notifications | `{ws/wss}://{host}:{port}/{version}/notifications/ws?token={token}` |
| `projectNotificationsPath`      | Project-level notifications    | `{ws/wss}://{host}:{port}/{version}/projects/{id}/notifications/ws?token={token}` |

Protocol is determined by `controller.protocol`: `https:` maps to `wss`, otherwise `ws`.

### Key Emitters

| Emitter                       | Type                        | Purpose                                   |
|-------------------------------|-----------------------------|-------------------------------------------|
| `computeNotificationEmitter`  | `EventEmitter<ComputeNotification>` | Emits individual compute events   |
| `computeCacheUpdated`         | `EventEmitter<Compute[]>`   | Emits full compute list after cache change |

**Source file:** `src/app/services/notification.service.ts`

---

## Testing

> **Status:** Unit tests have not been implemented yet.

### Planned Test Scenarios

| Scenario                        | Given                        | When                                | Expected                                    |
|---------------------------------|------------------------------|-------------------------------------|---------------------------------------------|
| Establish new connection        | No current controller        | `establishConnection(controller)`   | Connection established, controller stored   |
| Skip duplicate connection       | Connected to controller A    | `establishConnection(controller A)` | No new connection created                   |
| Switch controllers              | Connected to controller A    | `establishConnection(controller B)` | Old connection closed, new one established  |
| Disconnect                      | Connected to a controller    | `disconnect()`                      | WS closed, controller cleared, cache cleared |
| Get current controller          | Connected to controller A    | `getCurrentController()`            | Returns controller A                        |
| Is connected (matching)         | Connected to controller A    | `isConnectedTo(controller A)`       | Returns `true`                              |
| Is connected (non-matching)     | Connected to controller A    | `isConnectedTo(controller B)`       | Returns `false`                             |

---

## Security Considerations

### WebSocket Protocol Selection

| Controller Protocol | WebSocket Protocol |
|---------------------|--------------------|
| `http:`             | `ws://`            |
| `https:`            | `wss://`           |

### Authentication

WebSocket connections use token-based authentication. The auth token is included as a query parameter in the WebSocket URL. The server validates the token before accepting the connection.

**URL format:** `{ws/wss}://{host}:{port}/{version}/notifications/ws?token={AUTH_TOKEN}`

---

## Related Documentation

| Document                                    | Description                    |
|---------------------------------------------|--------------------------------|
| `src/app/services/notification.service.ts`  | Actual WebSocket implementation|
| `src/app/services/connection-manager.service.ts` | This service's source code |
| `src/app/models/controller.ts`              | Controller data structure      |
| `src/app/models/compute.ts`                 | Compute data structure         |

---

## Summary

**ConnectionManagerService** is a simple, focused service that:
- Tracks the current controller
- Prevents duplicate connections
- Handles controller switching
- Delegates WebSocket management to NotificationService

**Not responsible for:**
- WebSocket connection lifecycle (NotificationService)
- Auto-reconnection logic
- Connection pooling/caching
- Complex state management

**Design Philosophy:** Simple, single-responsibility service that does one thing well.
