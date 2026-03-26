# Template Settings

Documentation for template configuration fields and their mappings.

## IOS Template Fields Mapping

This document tracks the mapping between API response fields and form controls in the IOS template details page.

### General Settings Section

| API Field | Form Control | Description |
|-----------|--------------|-------------|
| `name` | `generalSettingsForm.templateName` | Template name |
| `default_name_format` | `generalSettingsForm.defaultName` | Default name format (e.g., "R{0}") |
| `symbol` | `generalSettingsForm.symbol` | Symbol path (e.g., ":/symbols/affinity/square/blue/router.svg") |
| `image` | `generalSettingsForm.path` | IOS image path/filename |
| `startup_config` | `generalSettingsForm.initialConfig` | Initial startup-config filename |

### Memory Settings Section

| API Field | Form Control | Description |
|-----------|--------------|-------------|
| `ram` | `memoryForm.ram` | RAM size in MB |
| `nvram` | `memoryForm.nvram` | NVRAM size in MB |
| `disk0` | `memoryForm.disk0` | PCMCIA disk0 size |
| `disk1` | `memoryForm.disk1` | PCMCIA disk1 size |
| `iomem` | `memoryForm.iomemory` | I/O memory percentage (platform specific) |

### Advanced Settings Section

| API Field | Form Control | Description |
|-----------|--------------|-------------|
| `system_id` | `advancedForm.systemId` | System ID |
| `idlemax` | `advancedForm.idlemax` | Idle maximum value |
| `idlesleep` | `advancedForm.idlesleep` | Idle sleep value |
| `exec_area` | `advancedForm.execarea` | Exec area value |
| `idlepc` | `advancedForm.idlepc` | Idle-PC value |
| `mac_addr` | `advancedForm.mac_addr` | Base MAC address (format: xxxx.xxxx.xxxx) |

### Slots and Adapters

Network adapters are stored in `slot0` through `slot6` fields, corresponding to adapter indices 0-6.

WIC modules are stored in `wic0` through `wic2` fields, corresponding to WIC indices 0-2.

## Form Population

When loading template data from the API:

1. `fillSlotsData()` - Populates network adapter and WIC arrays from template object
2. `populateForms()` - Uses `patchValue()` to populate reactive forms with template data

## Form Saving

When saving template changes:

1. Extract values from reactive forms using `get('fieldName').value`
2. Update the `iosTemplate` object properties
3. Call `iosService.saveTemplate()` to persist changes

## Unified Usage Section

All template details pages share the same Usage section styling through `preferences.component.scss`:

| CSS Class | Description |
|-----------|-------------|
| `.preferences__usage-form` | Wrapper div with 16px padding |
| `.preferences__usage-field--full` | Full-width form field |

### Components Using Unified Usage

- IOS template details (`ios-template-details`)
- IOU template details (`iou-template-details`)
- QEMU VM template details (`qemu-vm-template-details`)
- VMware template details (`vmware-template-details`)
- Docker template details (`docker-template-details`)
- VirtualBox template details (`virtual-box-template-details`)
- Cloud-Nodes template details (`cloud-nodes-template-details`)

These components import `preferences.component.scss` to share the unified Usage section styling.
