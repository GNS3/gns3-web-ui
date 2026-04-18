<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# Custom Adapters Implementation

**Last Updated**: 2026-04-18

## Overview

This document describes the implementation of the Custom Adapters feature in GNS3 Web UI, which aligns with the Desktop GUI behavior using an **incremental save** approach.

Custom adapters are supported in two contexts:

1. **Template Configuration** - Configure default adapter settings for templates (QEMU, VMware, VirtualBox)
2. **Node Configuration** - Modify adapter settings for individual running nodes (QEMU, VMware, VirtualBox, Docker)

QEMU, VMware, and VirtualBox use the same `CustomAdaptersComponent` dialog with incremental save logic. Docker nodes use a separate `ConfigureCustomAdaptersDialogComponent` with a simplified adapter model (see [Docker Node Support](#docker-node-support)).

## Architecture

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Custom Adapters Dialog** | `src/app/components/preferences/common/custom-adapters/` | Reusable dialog for configuring adapters (QEMU/VMware/VirtualBox) |
| **Custom Adapters Table** | `src/app/components/preferences/common/custom-adapters-table/` | MatTable-based adapter editor (currently unused, alternative to dialog) |
| **QEMU Template Details** | `src/app/components/preferences/qemu/qemu-vm-template-details/` | QEMU template management |
| **VMware Template Details** | `src/app/components/preferences/vmware/vmware-template-details/` | VMware template management |
| **VirtualBox Template Details** | `src/app/components/preferences/virtual-box/virtual-box-template-details/` | VirtualBox template management |
| **QEMU Node Configurator** | `src/app/components/project-map/node-editors/configurator/qemu/` | QEMU node configuration |
| **VMware Node Configurator** | `src/app/components/project-map/node-editors/configurator/vmware/` | VMware node configuration |
| **VirtualBox Node Configurator** | `src/app/components/project-map/node-editors/configurator/virtualbox/` | VirtualBox node configuration |
| **Docker Node Custom Adapters** | `src/app/components/project-map/node-editors/configurator/docker/configure-custom-adapters/` | Simplified Docker node adapter configuration |

### Data Model

**File:** `src/app/models/qemu/qemu-custom-adapter.ts`

```typescript
class CustomAdapter {
  adapter_number: number;
  adapter_type: string;
  port_name?: string;           // Custom port name (e.g., "Gi0/0")
  mac_address?: string;         // MAC address (optional)
}
```

**File:** `src/app/components/preferences/common/custom-adapters/custom-adapters.component.ts`

```typescript
interface NetworkType {
  value: string;
  name: string;
}

interface CustomAdaptersDialogData {
  adapters: CustomAdapter[];
  networkTypes: NetworkType[];
  portNameFormat?: string;              // Port name format (e.g., "Ethernet{0}"), defaults to "Ethernet{0}"
  portSegmentSize?: number;             // Port segment size for naming, defaults to 0
  defaultAdapterType?: string;          // Default adapter type for incremental save, defaults to "e1000"
  currentAdapters?: number;             // Total adapter count
}

interface CustomAdaptersDialogResult {
  adapters: CustomAdapter[];      // Only non-default adapters (incremental save)
  requiredAdapters?: number;      // Minimum adapter count required
}
```

## Incremental Save Strategy

### Key Principle

**Only save adapters that differ from default values.**

This approach:
- Reduces server storage by not storing redundant default configurations
- Allows default values to be changed globally without affecting custom configurations
- Matches Desktop GUI behavior

### Default Value Calculation

| Field | Default Value | Calculation |
|-------|--------------|-------------|
| **port_name** | Based on format | `portNameFormat.replace('{0}', adapter_number)` (with segment logic if `portSegmentSize > 0`) |
| **adapter_type** | From template | `defaultAdapterType` (form's networkType field, defaults to `"e1000"`) |
| **mac_address** | Empty | `null` or empty string |

#### Port Name Generation (Segment-Based)

When `portSegmentSize > 0`, port names use a segment-based calculation:

```typescript
const segment = Math.floor(adapter_number / portSegmentSize);
const portInSegment = adapter_number % portSegmentSize;
const portName = portNameFormat.replace('{0}', String(segment * portSegmentSize + portInSegment));
```

When `portSegmentSize` is 0 (default), port names use simple replacement:

```typescript
const portName = portNameFormat.replace('{0}', String(adapter_number));
```

### Example Scenario

Given a template with 6 adapters where only adapter 5 uses a custom type:

**Initial State (Server):**
```json
{
  "adapters": 6,
  "adapter_type": "e1000",
  "port_name_format": "Gi0/{0}",
  "custom_adapters": [
    {
      "adapter_number": 5,
      "port_name": "Gi0/5",
      "adapter_type": "virtio",
      "mac_address": null
    }
  ]
}
```

**Dialog Display:**
```
Adapter 0: Gi0/0, e1000   (default)
Adapter 1: Gi0/1, e1000   (default)
Adapter 2: Gi0/2, e1000   (default)
Adapter 3: Gi0/3, e1000   (default)
Adapter 4: Gi0/4, e1000   (default)
Adapter 5: Gi0/5, virtio  (custom)
```

**After Save (Server):**
```json
{
  "adapters": 6,
  "custom_adapters": [
    {
      "adapter_number": 5,
      "port_name": "Gi0/5",
      "adapter_type": "virtio",
      "mac_address": null
    }
  ]
}
```

**Result:** Only adapter 5 is saved because it's the only one with non-default values.

## Implementation Flow

### 1. Page Load (ngOnInit)

```typescript
this.qemuService.getTemplate(this.controller, template_id).subscribe((template) => {
  this.template = template;
  // Do NOT call fillCustomAdapters() - preserve server data
  this.initFormFromTemplate();
});
```

**Key Point:** Server data is preserved as-is. No pre-filling of adapters.

### 2. Open Dialog

```typescript
openCustomAdaptersDialog() {
  // Get configuration values
  const portNameFormat = this.portNameFormat() || 'Ethernet{0}';
  const segmentSize = this.portSegmentSize() || 0;
  const defaultAdapterType = this.networkType() || 'e1000';
  const adapterCount = this.adapters();

  // Get server's custom adapters (may be sparse)
  const serverCustomAdapters = this.qemuTemplate.custom_adapters || [];

  // Build complete adapter list for display
  const adaptersForDialog: CustomAdapter[] = [];

  for (let i = 0; i < adapterCount; i++) {
    const customAdapter = serverCustomAdapters.find(a => a.adapter_number === i);

    if (customAdapter) {
      // Use server's custom configuration
      adaptersForDialog.push({
        adapter_number: customAdapter.adapter_number,
        adapter_type: customAdapter.adapter_type,
        port_name: customAdapter.port_name,
        mac_address: customAdapter.mac_address || '',
      });
    } else {
      // Generate default port name
      let portName: string;
      if (segmentSize > 0) {
        const segment = Math.floor(i / segmentSize);
        const portInSegment = i % segmentSize;
        portName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
      } else {
        portName = portNameFormat.replace('{0}', String(i));
      }

      // Use default configuration
      adaptersForDialog.push({
        adapter_number: i,
        adapter_type: defaultAdapterType,
        port_name: portName,
        mac_address: '',
      });
    }
  }

  // Open dialog with complete list
  this.dialog.open(CustomAdaptersComponent, {
    panelClass: 'custom-adapters-dialog-panel',
    data: {
      adapters: adaptersForDialog,
      networkTypes: this.networkTypes,
      portNameFormat: portNameFormat,
      portSegmentSize: segmentSize,
      defaultAdapterType: defaultAdapterType,
      currentAdapters: adapterCount,
    } as CustomAdaptersDialogData,
  });
}
```

**Key Points:**
- Generate complete adapter list (0 to adapters-1)
- Merge server custom adapters with default adapters
- Port name generation supports segment-based naming via `portSegmentSize`
- User sees all adapters, can edit any of them
- Dialog uses `panelClass: 'custom-adapters-dialog-panel'` for styling isolation

### 3. Save (Incremental)

```typescript
configureCustomAdapters() {
  // Check for invalid MAC addresses before submitting
  if (this.hasInvalidMacAddresses()) {
    // Show error toast and abort
    return;
  }

  const portNameFormat = this.data.portNameFormat || 'Ethernet{0}';
  const segmentSize = this.data.portSegmentSize || 0;
  const defaultAdapterType = this.data.defaultAdapterType || 'e1000';

  // Incremental save: only keep adapters with non-default values
  const customAdapters: CustomAdapter[] = [];

  for (const adapter of this.adapters()) {
    // Calculate default port name for this adapter_number
    let defaultPortName: string;
    if (segmentSize > 0) {
      const segment = Math.floor(adapter.adapter_number / segmentSize);
      const portInSegment = adapter.adapter_number % segmentSize;
      defaultPortName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
    } else {
      defaultPortName = portNameFormat.replace('{0}', String(adapter.adapter_number));
    }

    // Check if this adapter has any custom (non-default) values
    const hasCustomPortName = adapter.port_name !== defaultPortName;
    const hasCustomType = adapter.adapter_type !== defaultAdapterType;
    const hasCustomMac = adapter.mac_address && adapter.mac_address.length > 0;

    // Only save if at least one field is custom
    if (hasCustomPortName || hasCustomType || hasCustomMac) {
      customAdapters.push({
        adapter_number: adapter.adapter_number,
        port_name: hasCustomPortName ? adapter.port_name : defaultPortName,
        adapter_type: adapter.adapter_type,
        mac_address: adapter.mac_address || null,
      });
    }
  }

  // Return only non-default adapters
  this.dialogRef.close({
    adapters: customAdapters,
    requiredAdapters: this.adapters().length,
  });
}
```

**Key Points:**
- MAC address validation runs before save; invalid MACs abort the operation
- Port name calculation matches the segment-based logic used in `onAdd()` and `openCustomAdaptersDialog()`
- Filter out adapters that match default values
- Only save adapters with at least one custom field
- When `hasCustomPortName` is false, the default port name is still included in the saved adapter (ensures consistency)

## User Interaction Scenarios

### Scenario 1: Delete Default Adapter

**Action:** User deletes Adapter 2 (which has default values)

**Result:** No change to server data

**Reason:** Adapter 2 was using default values, so it wasn't saved. Deleting it from the dialog doesn't change the server state.

**Next Open:** Adapter 2 still appears (regenerated from defaults)

### Scenario 2: Delete Custom Adapter

**Action:** User deletes Adapter 5 (which has custom `virtio` type)

**Result:** Server's `custom_adapters` becomes empty (or Adapter 5 is removed)

**Reason:** Adapter 5 had custom values, so it was saved. Deleting it removes it from server storage.

**Next Open:** Adapter 5 appears with default `e1000` type

### Scenario 3: Modify Adapter Type

**Action:** User changes Adapter 3 from `e1000` to `virtio`

**Result:** Adapter 3 added to server's `custom_adapters`

**Reason:** Adapter 3 now differs from default, so it's saved.

**Next Open:** Adapter 3 displays `virtio` type

### Scenario 4: Increase Adapter Count

**Action:** User changes adapters from 6 to 8

**Result:** Server `adapters` field updated to 8

**Next Open:** Adapters 0-7 displayed (0-5 from before, 6-7 as defaults)

## Best Practices

### DO ✅

- **Preserve server data** - Don't modify `template.custom_adapters` on page load
- **Use incremental save** - Only save non-default configurations
- **Generate defaults on demand** - Create default adapters when opening dialog
- **Use adapter_number for lookup** - Match adapters by number, not array index
- **Filter before save** - Check each adapter against default values

### DON'T ❌

- **Don't pre-fill on init** - Avoid calling fill functions in `ngOnInit`
- **Don't save all adapters** - Don't save adapters with default values
- **Don't hardcode defaults** - Use form's `networkType` as default adapter type
- **Don't clear server data** - Avoid reassigning `template.custom_adapters = []`
- **Don't use array index** - Always use `adapter_number` for identification

## Code Reference

### Dialog Component

**File:** `src/app/components/preferences/common/custom-adapters/custom-adapters.component.ts`

**Key Methods:**
- `constructor()` - Receives `CustomAdaptersDialogData` via `MAT_DIALOG_DATA`, copies adapter list via `model()` signal
- `onAdd()` - Adds new adapter with `adapter_number = max(existing) + 1`, generates default port name (supports `portSegmentSize`), defaults adapter type to first available `networkType`
- `delete()` - Removes adapter from display list
- `configureCustomAdapters()` - Validates MAC addresses, implements incremental save logic
- `onPortNameChange()` / `onAdapterTypeChange()` / `onMacAddressChange()` - Update individual adapter fields immutably via `model().update()`
- `formatMacAddress()` - Auto-formats MAC input (strips non-hex, formats as `XX:XX:XX:XX:XX:XX`)
- `isValidMacAddress()` - Validates MAC regex (`^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$`); empty string is valid
- `hasInvalidMacAddresses()` - Checks if any adapter has an invalid MAC
- `getMacErrorMessage()` - Returns specific error: "Too short (N/12)", "Too long (N/12)", or "Invalid format"

### Template Details Components

**Files:**
- `src/app/components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component.ts`
- `src/app/components/preferences/vmware/vmware-template-details/vmware-template-details.component.ts`
- `src/app/components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component.ts`

**Key Methods:**
- `ngOnInit()` - Loads template without modifying custom_adapters
- `openCustomAdaptersDialog()` - Generates complete adapter list for display
- `onSave()` - Saves template without pre-filling custom_adapters

### Custom Adapters Table Component

**File:** `src/app/components/preferences/common/custom-adapters-table/custom-adapters-table.component.ts`

A MatTable-based alternative adapter editor. Uses `input()` and `model()` signals for `networkTypes`, `displayedColumns`, and `adapters`. Provides the same core methods as the dialog (`onAdd`, `delete`, `onPortNameChange`, `onAdapterTypeChange`, `onMacAddressChange`) but renders as an inline table instead of a dialog.

**Note:** This component is currently **not used** by any template details or node configurator component. The dialog-based `CustomAdaptersComponent` is the active implementation.

### Node Configurator Components

**Files:**
- `src/app/components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts`
- `src/app/components/project-map/node-editors/configurator/vmware/configurator-vmware.component.ts`
- `src/app/components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component.ts`

**Key Methods:**
- `ngOnInit()` - Loads node data from server
- `openCustomAdaptersDialog()` - Generates complete adapter list for display
- `onSaveClick()` - Calls `updateNodeWithCustomAdapters()` to save changes

**Implementation Details:**

Node configuration uses the same `CustomAdaptersComponent` and incremental save logic as template configuration:

```typescript
openCustomAdaptersDialog() {
  // Get server's custom adapters (may be sparse)
  const serverCustomAdapters = this.node.custom_adapters || [];

  // Build complete adapter list for display
  const adaptersForDialog: CustomAdapter[] = [];

  for (let i = 0; i < this.node.properties.adapters; i++) {
    const customAdapter = serverCustomAdapters.find(a => a.adapter_number === i);

    if (customAdapter) {
      // Use server's custom configuration
      adaptersForDialog.push({
        adapter_number: customAdapter.adapter_number,
        adapter_type: customAdapter.adapter_type,
        port_name: customAdapter.port_name,
        mac_address: customAdapter.mac_address || '',
      });
    } else {
      // Generate default configuration
      let portName: string;
      if (segmentSize > 0) {
        const segment = Math.floor(i / segmentSize);
        const portInSegment = i % segmentSize;
        portName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
      } else {
        portName = portNameFormat.replace('{0}', String(i));
      }

      adaptersForDialog.push({
        adapter_number: i,
        adapter_type: defaultAdapterType,
        port_name: portName,
        mac_address: '',
      });
    }
  }

  // Open dialog with complete list
  const dialogRef = this.dialog.open(CustomAdaptersComponent, {
    panelClass: 'custom-adapters-dialog-panel',
    data: {
      adapters: adaptersForDialog,
      networkTypes: this.networkTypes,
      portNameFormat: portNameFormat,
      portSegmentSize: segmentSize,
      defaultAdapterType: defaultAdapterType,
      currentAdapters: this.node.properties.adapters,
    } as CustomAdaptersDialogData,
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      // Incremental save: only non-default adapters
      this.node.custom_adapters = result.adapters;
      this.node.properties.adapters = result.requiredAdapters;
    }
  });
}
```

### Node Service

**File:** `src/app/services/node.service.ts`

The `updateNodeWithCustomAdapters()` method filters null values from custom adapters before sending to the server:

```typescript
updateNodeWithCustomAdapters(controller: Controller, node: Node): Observable<Node> {
  const filtered_custom_adapters = node.custom_adapters
    ? node.custom_adapters.map((adapter) => {
        const filteredAdapter: any = {
          adapter_number: adapter.adapter_number,
          adapter_type: adapter.adapter_type,
        };
        if (adapter.port_name !== null && adapter.port_name !== undefined) {
          filteredAdapter.port_name = adapter.port_name;
        }
        if (adapter.mac_address !== null && adapter.mac_address !== undefined) {
          filteredAdapter.mac_address = adapter.mac_address;
        }
        return filteredAdapter;
      })
    : [];

  return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
    console_type: node.console_type,
    console_auto_start: node.console_auto_start,
    custom_adapters: filtered_custom_adapters,
    name: node.name,
    properties: node.properties,
    tags: node.tags,
  });
}
```

**Key Differences from Template Configuration:**

| Aspect | Template Configuration | Node Configuration |
|--------|----------------------|-------------------|
| **Data Source** | `template.custom_adapters` | `node.custom_adapters` |
| **Adapter Count** | `template.adapters` | `node.properties.adapters` |
| **Save Method** | `saveTemplate()` | `updateNodeWithCustomAdapters()` |
| **Impact** | Affects new nodes from template | Affects running node immediately |
| **Incremental Save** | Yes | Yes |
| **Null Filtering** | N/A | Service filters null `port_name`/`mac_address` before PUT |

**Similarities:**
- Both use the same `CustomAdaptersComponent` dialog
- Both implement incremental save strategy
- Both generate complete adapter list for display
- Both preserve server data on load

### Docker Node Support

Docker nodes use a **different component** from QEMU/VMware/VirtualBox:

**File:** `src/app/components/project-map/node-editors/configurator/docker/configure-custom-adapters/configure-custom-adapters.component.ts`

| Aspect | QEMU/VMware/VirtualBox | Docker |
|--------|----------------------|--------|
| **Component** | `CustomAdaptersComponent` | `ConfigureCustomAdaptersDialogComponent` |
| **Adapter Fields** | `adapter_number`, `adapter_type`, `port_name`, `mac_address` | `adapter_number`, `port_name` only |
| **Adapter Type Selection** | Yes (network types dropdown) | No |
| **MAC Address** | Yes (with validation) | No |
| **Incremental Save** | Yes | No (saves all adapters) |
| **Data Source** | `node.custom_adapters` or `template.custom_adapters` | `node.ports` |
| **Port Name Generation** | Based on `portNameFormat` + `portSegmentSize` | N/A |

Docker adapters are simpler because Docker containers only support port name customization, not adapter type or MAC address changes.

## Migration Notes

### Changes from Previous Implementation

| Aspect | Before | After |
|--------|--------|-------|
| **Initialization** | `fillCustomAdapters()` in `ngOnInit` | No pre-filling, preserve server data |
| **Dialog Data** | Pre-filled with all adapters | Merge server custom + default adapters |
| **Save Strategy** | Save all adapters | Save only non-default adapters |
| **Default Type** | Hardcoded `'e1000'` | Use form's `networkType` value |
| **Storage** | Redundant default values stored | Only custom configurations stored |

### Benefits of New Implementation

1. **Reduced Storage** - Server only stores custom configurations
2. **Consistency** - Matches Desktop GUI behavior exactly
3. **Flexibility** - Default values can be changed globally
4. **Clarity** - Custom adapters are truly "custom" (non-default)
5. **Maintainability** - Clearer separation between default and custom

## MAC Address Validation

The dialog validates MAC addresses before saving. The validation flow:

1. **Auto-formatting** (`formatMacAddress`): As the user types, non-hex characters are stripped. Once 12 hex digits are entered, the value is formatted as `XX:XX:XX:XX:XX:XX`.

2. **Per-field validation** (`isValidMacAddress`): Each adapter's MAC is checked against regex `^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$`. Empty values are valid (optional field). Invalid MACs show inline errors in the template via `mat-error`.

3. **Pre-save check** (`hasInvalidMacAddresses`): Before closing the dialog, `configureCustomAdapters()` checks all adapters. If any have invalid MACs, an error toast is shown with adapter-specific messages and the save is aborted.

**Error Messages:**
| Condition | Message |
|-----------|---------|
| Too few hex digits | `Too short (N/12 hex digits)` |
| Too many hex digits | `Too long (N/12 hex digits)` |
| Invalid format | `Invalid MAC address format (12 hex digits required)` |

## Testing

### Test Cases

1. **Default Adapter Deletion**
   - Create template with 6 adapters
   - Delete adapter 2 (default values)
   - Save and reopen
   - **Expected:** Adapter 2 still present with defaults

2. **Custom Adapter Deletion**
   - Create template with adapter 5 as `virtio`
   - Delete adapter 5
   - Save and reopen
   - **Expected:** Adapter 5 present with `e1000` (default)

3. **Mixed Configuration**
   - Set adapters 2 and 5 as custom
   - Modify adapter 3 to custom
   - Delete adapter 2
   - Save and reopen
   - **Expected:** Adapters 3 and 5 as custom, others as defaults

4. **Adapter Count Change**
   - Start with 6 adapters (5 custom)
   - Increase to 8 adapters
   - Save and reopen
   - **Expected:** Adapters 0-7 displayed, 0-5 as configured, 6-7 as defaults

### Node Configuration Test Cases

1. **Edit Running Node**
   - Right-click on running node → Configure
   - Open Custom Adapters dialog
   - Change adapter 3 type from `e1000` to `virtio`
   - Apply changes
   - **Expected:** Node configuration updated immediately, ports reflect new type

2. **Node with No Custom Adapters**
   - Create node from template with default adapters
   - Right-click → Configure → Custom Adapters
   - **Expected:** All adapters displayed with default values, empty `custom_adapters` array

3. **Partial Custom Configuration**
   - Node has custom adapter 5 only
   - Open Custom Adapters dialog
   - **Expected:** Adapter 5 shows custom value, adapters 0-4 show defaults

4. **Delete Custom Adapter from Node**
   - Node has custom adapter 3
   - Open Custom Adapters dialog, delete adapter 3
   - Apply changes
   - **Expected:** `node.custom_adapters` becomes empty or adapter 3 removed

### MAC Address Validation Test Cases

1. **Valid MAC Address**
   - Enter `00:11:22:33:44:55`
   - **Expected:** No error, accepted on save

2. **Auto-Formatted MAC**
   - Paste `001122334455`
   - **Expected:** Auto-formatted to `00:11:22:33:44:55`

3. **Too Short MAC**
   - Enter `00:11:22`
   - **Expected:** Inline error `Too short (6/12 hex digits)`, save blocked

4. **Empty MAC**
   - Leave MAC field empty
   - **Expected:** Valid (optional field), no error

5. **Invalid MAC on Save**
   - Set one adapter with invalid MAC, another valid
   - Click Apply
   - **Expected:** Error toast listing the invalid adapter, dialog stays open

### Docker Node Test Cases

1. **Docker Node Adapter Configuration**
   - Right-click Docker node → Configure → Custom Adapters
   - **Expected:** Simplified dialog showing only `adapter_number` and `port_name`

2. **Docker No Type/MAC Fields**
   - Open Docker custom adapters dialog
   - **Expected:** No adapter type dropdown, no MAC address field

3. **Docker Save**
   - Modify port names in Docker dialog
   - Apply changes
   - **Expected:** All adapters saved (no incremental save for Docker)

## Related Documentation

- [Desktop GUI Custom Adapters](https://github.com/GNS3/gns3-gui/blob/master/gns3/dialogs/custom_adapters_configuration_dialog.py)
- [Model Input Signals](./model-input-signals.md)
- [Component Migration Tracker](./component-migration-tracker.md)

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
