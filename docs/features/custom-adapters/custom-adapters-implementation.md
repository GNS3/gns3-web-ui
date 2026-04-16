<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# Custom Adapters Implementation

**Last Updated**: 2026-03-26

## Overview

This document describes the implementation of the Custom Adapters feature in GNS3 Web UI, which aligns with the Desktop GUI behavior using an **incremental save** approach.

Custom adapters are supported in two contexts:

1. **Template Configuration** - Configure default adapter settings for templates (QEMU, VMware, VirtualBox)
2. **Node Configuration** - Modify adapter settings for individual running nodes

Both contexts use the same `CustomAdaptersComponent` dialog and implement incremental save logic to only store non-default configurations.

## Architecture

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Custom Adapters Dialog** | `src/app/components/preferences/common/custom-adapters/` | Reusable dialog for configuring adapters |
| **QEMU Template Details** | `src/app/components/preferences/qemu/qemu-vm-template-details/` | QEMU template management |
| **VMware Template Details** | `src/app/components/preferences/vmware/vmware-template-details/` | VMware template management |
| **VirtualBox Template Details** | `src/app/components/preferences/virtual-box/virtual-box-template-details/` | VirtualBox template management |
| **QEMU Node Configurator** | `src/app/components/project-map/node-editors/configurator/qemu/` | QEMU node configuration |
| **VMware Node Configurator** | `src/app/components/project-map/node-editors/configurator/vmware/` | VMware node configuration |
| **VirtualBox Node Configurator** | `src/app/components/project-map/node-editors/configurator/virtualbox/` | VirtualBox node configuration |

### Data Model

```typescript
interface CustomAdapter {
  adapter_number: number;      // Adapter index (0-based)
  port_name: string;           // Custom port name (e.g., "Gi0/0")
  adapter_type: string;        // Network adapter type (e.g., "e1000", "virtio")
  mac_address: string | null;  // MAC address (optional)
}

interface CustomAdaptersDialogData {
  adapters: CustomAdapter[];           // Complete adapter list for display
  networkTypes: NetworkType[];         // Available adapter types
  portNameFormat: string;              // Port name format (e.g., "Ethernet{0}")
  portSegmentSize: number;             // Port segment size for naming
  defaultAdapterType: string;          // Default adapter type
  currentAdapters: number;             // Total adapter count
}

interface CustomAdaptersDialogResult {
  adapters: CustomAdapter[];      // Only non-default adapters (incremental save)
  requiredAdapters: number;       // Minimum adapter count required
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
| **port_name** | Based on format | `portNameFormat.replace('{0}', adapter_number)` |
| **adapter_type** | From template | `defaultAdapterType` (form's networkType field) |
| **mac_address** | Empty | `null` or empty string |

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
  // Get server's custom adapters (may be sparse)
  const serverCustomAdapters = this.template.custom_adapters || [];

  // Build complete adapter list for display
  const adaptersForDialog: CustomAdapter[] = [];

  for (let i = 0; i < this.adapters(); i++) {
    const customAdapter = serverCustomAdapters.find(a => a.adapter_number === i);

    if (customAdapter) {
      // Use server's custom configuration
      adaptersForDialog.push(customAdapter);
    } else {
      // Use default configuration
      adaptersForDialog.push({
        adapter_number: i,
        adapter_type: defaultAdapterType,
        port_name: generateDefaultPortName(i),
        mac_address: '',
      });
    }
  }

  // Open dialog with complete list
  this.dialog.open(CustomAdaptersComponent, {
    data: { adapters: adaptersForDialog, ... }
  });
}
```

**Key Points:**
- Generate complete adapter list (0 to adapters-1)
- Merge server custom adapters with default adapters
- User sees all adapters, can edit any of them

### 3. Save (Incremental)

```typescript
configureCustomAdapters() {
  const customAdapters: CustomAdapter[] = [];

  for (const adapter of this.adapters) {
    // Calculate default values for this adapter
    const defaultPortName = generateDefaultPortName(adapter.adapter_number);
    const defaultType = this.data.defaultAdapterType;

    // Check if any field differs from default
    const hasCustomPortName = adapter.port_name !== defaultPortName;
    const hasCustomType = adapter.adapter_type !== defaultType;
    const hasCustomMac = adapter.mac_address && adapter.mac_address.length > 0;

    // Only save if at least one field is custom
    if (hasCustomPortName || hasCustomType || hasCustomMac) {
      customAdapters.push(adapter);
    }
  }

  // Return only non-default adapters
  this.dialogRef.close({
    adapters: customAdapters,
    requiredAdapters: calculateRequiredAdapters()
  });
}
```

**Key Points:**
- Filter out adapters that match default values
- Only save adapters with at least one custom field
- Reduces server storage and maintains consistency

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
- `constructor()` - Receives and copies adapter data
- `onAdd()` - Adds new adapter with next available `adapter_number`
- `delete()` - Removes adapter from display list
- `configureCustomAdapters()` - Implements incremental save logic

### Template Details Components

**Files:**
- `src/app/components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component.ts`
- `src/app/components/preferences/vmware/vmware-template-details/vmware-template-details.component.ts`
- `src/app/components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component.ts`

**Key Methods:**
- `ngOnInit()` - Loads template without modifying custom_adapters
- `openCustomAdaptersDialog()` - Generates complete adapter list for display
- `onSave()` - Saves template without pre-filling custom_adapters

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
      adaptersForDialog.push(customAdapter);
    } else {
      // Use default configuration
      adaptersForDialog.push({
        adapter_number: i,
        adapter_type: defaultAdapterType,
        port_name: generateDefaultPortName(i),
        mac_address: '',
      });
    }
  }

  // Open dialog with complete list
  const dialogRef = this.dialog.open(CustomAdaptersComponent, {
    data: { adapters: adaptersForDialog, ... }
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

**Key Differences from Template Configuration:**

| Aspect | Template Configuration | Node Configuration |
|--------|----------------------|-------------------|
| **Data Source** | `template.custom_adapters` | `node.custom_adapters` |
| **Adapter Count** | `template.adapters` | `node.properties.adapters` |
| **Save Method** | `saveTemplate()` | `updateNodeWithCustomAdapters()` |
| **Impact** | Affects new nodes from template | Affects running node immediately |
| **Incremental Save** | ✅ Yes | ✅ Yes |

**Similarities:**
- Both use the same `CustomAdaptersComponent` dialog
- Both implement incremental save strategy
- Both generate complete adapter list for display
- Both preserve server data on load

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

## Related Documentation

- [Desktop GUI Custom Adapters](https://github.com/GNS3/gns3-gui/blob/master/gns3/dialogs/custom_adapters_configuration_dialog.py)
- [Model Input Signals](./model-input-signals.md)
- [Component Migration Tracker](./component-migration-tracker.md)

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
