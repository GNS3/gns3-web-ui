---
name: add-user-dialog-fixes
description: Add User Dialog improvements and fixes
metadata:
  type: reference
---

# Add User Dialog Fixes

## Layout Changes
- Reordered form to 2-column layout: Username+Fullname, Email, Password+Confirm
- Dialog width increased from 400px to 600px (in `_dialogs.scss`)
- Group delete icon fixed: wrapped in `mat-icon-button` (was plain text)
- Selected groups changed from div list to `mat-chip-set` with remove button

## Autocomplete UX Fixes
- After selecting a group, input clears to allow selecting another group
- `_filter` returns all groups (not filtering out selected ones)
- Click on input triggers `openGroupPanel()` to show dropdown
- `MatAutocompleteTrigger` + `setValue('')` to refresh filtered options

## Scrollbar Fix
- `mat-dialog-content` default `overflow: auto` creates internal scrollbar when chips appear
- Fix: `.mat-mdc-dialog-content { overflow: visible; flex: none; }` in `add-user-dialog-panel`
- This prevents the content area from showing an internal scrollbar

## Files Modified
- `src/app/components/user-management/add-user-dialog/add-user-dialog.component.html`
- `src/app/components/user-management/add-user-dialog/add-user-dialog.component.scss`
- `src/app/components/user-management/add-user-dialog/add-user-dialog.component.ts`
- `src/styles/_dialogs.scss`
