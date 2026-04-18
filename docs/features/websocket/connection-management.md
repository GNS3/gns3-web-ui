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
- 📋 **Simple**: Only 63 lines of code
- 🎯 **Single Responsibility**: Track current controller
- 🔄 **Delegate**: Actual WebSocket managed by `NotificationService`
- 🛡️ **Duplicate Prevention**: Avoids redundant connections

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
│  • Cache management                                     │
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
Switch Controller→   │                                │
                    │   establishConnection(new)     │
                    │   ├─ Check: same controller?   │
                    │   │   └─ No → continue         │
                    │   ├─ disconnect()              │
                    │   │   └─ closes old WS         │
                    │   └─ establish new connection  │
                    │                                │
Logout          →   │                                │
                    │   disconnect()                 │
                    │   └─ clears controller         │
                    │                                │
```

---

## API Reference

### Methods

#### establishConnection(controller: Controller): void

Establishes a connection to the specified controller.

**Behavior:**
```
If already connected to same controller:
    └─ Skip (no-op)

If switching to different controller:
    ├─ Disconnect from current controller
    └─ Establish new connection

If first connection:
    └─ Establish new connection
```

**Implementation:**
- Checks if already connected to the same controller (prevents duplicates)
- Disconnects existing connection if switching controllers
- Delegates to `NotificationService.connectToComputeNotifications()`
- Stores controller reference

#### disconnect(): void

Disconnects from the current controller.

**Behavior:**
```
If connected:
    ├─ Call NotificationService.disconnect()
    ├─ Clear controller reference
    └─ Clear compute cache

If not connected:
    └─ No-op
```

#### getCurrentController(): Controller

Returns the currently connected controller.

**Returns:** `Controller | null`

#### isConnectedTo(controller: Controller): boolean

Checks if connected to a specific controller.

**Returns:** `boolean`

---

## Component Integration

### Usage Pattern

```
Component Initialization
    │
    ├→ Inject ConnectionManagerService
    │
    ├→ On successful login:
    │   └─ connectionManager.establishConnection(controller)
    │
    ├→ On controller switch:
    │   └─ connectionManager.establishConnection(newController)
    │
    └→ On logout:
        └─ connectionManager.disconnect()
```

### Example: LoginComponent

```
Login Flow:
    │
    ├→ User enters credentials
    ├→ Authentication successful
    ├→ Receive controller object
    └→ connectionManager.establishConnection(controller)
```

### Example: ComputesComponent

```
Controller Switch Flow:
    │
    ├→ User selects different controller
    ├→ Confirm switch
    └→ connectionManager.establishConnection(newController)
        ├─ Automatically disconnects old controller
        └─ Connects to new controller
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
- Separation of concerns:
  - `ConnectionManagerService` → Controller lifecycle
  - `NotificationService` → WebSocket and notifications
- Avoids code duplication
- NotificationService has compute caching logic

### No Automatic Reconnection

**Decision:** ConnectionManagerService does NOT implement auto-reconnection.

**Rationale:**
- Controller connections are user-initiated (login/switch)
- Reconnection should be explicit user action
- NotificationService handles WebSocket-level events
- Application can show "disconnected" state and prompt user

---

## Actual WebSocket Management

### NotificationService Responsibilities

The actual WebSocket connection is managed by `NotificationService`:

```
NotificationService Features:
    │
    ├── WebSocket connection management
    │     ├─ Create WebSocket
    │     ├─ Handle connection events
    │     └─ Close connection
    │
    ├── Compute notifications
    │     ├─ Listen for compute updates
    │     ├─ Emit events to subscribers
    │     └─ Update compute cache
    │
    └── Compute caching
          ├─ Store latest compute states
          ├─ Provide cached data
          └─ Clear cache on disconnect
```

**See Also:** `src/app/services/notification.service.ts`

---

## Testing

### Unit Test Coverage

**Test Scenarios:**

```
Test: Establish Connection to New Controller
    ├─ Given: No current controller
    ├─ When: establishConnection(controller)
    └─ Then: Connection established, controller stored

Test: Skip Duplicate Connection
    ├─ Given: Connected to controller A
    ├─ When: establishConnection(controller A)
    └─ Then: No new connection created

Test: Switch Controllers
    ├─ Given: Connected to controller A
    ├─ When: establishConnection(controller B)
    └─ Then:
        ├─ Old connection disconnected
        └─ New connection established

Test: Disconnect
    ├─ Given: Connected to controller
    ├─ When: disconnect()
    └─ Then:
        ├─ Connection closed
        ├─ Controller cleared
        └─ Compute cache cleared

Test: Get Current Controller
    ├─ Given: Connected to controller A
    ├─ When: getCurrentController()
    └─ Then: Returns controller A

Test: Is Connected To
    ├─ Given: Connected to controller A
    ├─ When: isConnectedTo(controller A)
    └─ Then: Returns true
    ├─ When: isConnectedTo(controller B)
    └─ Then: Returns false
```

---

## Code Examples

### Basic Usage

```typescript
export class MyComponent {
  constructor(
    private connectionManager: ConnectionManagerService,
    private controllerService: ControllerService
  ) {}

  async onLogin(credentials: Credentials) {
    const controller = await this.controllerService.login(credentials);
    this.connectionManager.establishConnection(controller);
  }

  onLogout() {
    this.connectionManager.disconnect();
  }
}
```

### Controller Switch

```typescript
export class ControllerSelectorComponent {
  onControllerSwitch(newController: Controller) {
    // Automatically handles disconnect and reconnect
    this.connectionManager.establishConnection(newController);
  }
}
```

### Check Connection Status

```typescript
export class StatusComponent {
  constructor(private connectionManager: ConnectionManagerService) {}

  getConnectionStatus(): string {
    const controller = this.connectionManager.getCurrentController();
    return controller ? `Connected to ${controller.name}` : 'Not connected';
  }
}
```

---

## Security Considerations

### WebSocket Protocol Selection

**Protocol Logic:**

```
Controller Protocol    WebSocket Protocol
─────────────────      ───────────────────
http:                  ws://
https:                 wss://

Decision based on controller.protocol property
```

**Implementation:** (in NotificationService)

```
notificationsPath(controller: Controller): string {
  const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${controller.host}:${controller.port}/...`;
}
```

### Authentication

**Token-based Authentication:**

```
WebSocket URL includes auth token:
    ws://host:port/version/notifications/ws?token=AUTH_TOKEN

Benefits:
    ├─ Secure connection
    ├─ No additional auth step
    └─ Token validated by server
```

---

## Migration Guide

### Before: Direct NotificationService Calls

**Old Pattern:**

```
Components directly called NotificationService:
    │
    ├→ Multiple components could create duplicate connections
    ├→ No central tracking of current controller
    └→ Hard to manage controller lifecycle
```

### After: ConnectionManagerService

**New Pattern:**

```
Components use ConnectionManagerService:
    │
    ├→ Single point of connection management
    ├→ Automatic duplicate prevention
    ├→ Centralized controller tracking
    └→ Cleaner component code
```

**Migration Steps:**

```
Step 1: Inject ConnectionManagerService
    │
    └─ constructor(private connectionManager: ConnectionManagerService)

Step 2: Replace direct connection calls
    │
    ├─ OLD: this.notificationService.connectToComputeNotifications(controller)
    └─ NEW: this.connectionManager.establishConnection(controller)

Step 3: Update disconnect logic
    │
    ├─ OLD: this.notificationService.disconnect()
    └─ NEW: this.connectionManager.disconnect()
```

---

## Related Documentation

- [NotificationService](../../services/notification/) - Actual WebSocket implementation
- [Controller Model](../../models/controller/) - Controller data structure
- [Compute Service](../../services/compute/) - Compute management

---

## Summary

**ConnectionManagerService** is a simple, focused service that:
- ✅ Tracks the current controller
- ✅ Prevents duplicate connections
- ✅ Handles controller switching
- ✅ Delegates WebSocket management to NotificationService

**Not responsible for:**
- ❌ WebSocket connection lifecycle (NotificationService)
- ❌ Auto-reconnection logic
- ❌ Connection pooling/caching
- ❌ Complex state management

**Design Philosophy:** Simple, single-responsibility service that does one thing well.
