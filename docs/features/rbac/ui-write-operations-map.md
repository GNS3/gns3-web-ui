# UI Write Operations → API Field Map

> Field-level permission pre-survey for the server-side **operation** RBAC layer.
> An *operation* = a named bundle of payload fields (e.g. `Compute.Credentials` = `{user, password}`).
> This table maps every web UI write surface (forms, dialogs, inline edits, drag commits) to the
> exact payload field paths it sets, grouped into candidate operations.
>
> Companion file: [`api-privilege-map.csv`](./api-privilege-map.csv) — endpoint-level privileges
> (incl. the 41 action operations). Endpoint paths here use the same placeholder style
> (`/computes/{compute_id}`) so the two documents stay aligned.

**Scope**: computes, projects, templates, nodes, links, drawings — write operations only
(POST/PUT whose payload carries meaningful fields). Action operations (start/stop/suspend node,
reload, duplicate, delete, capture, connect/disconnect, import/export flows without editable
fields…) are already covered by `api-privilege-map.csv` and are excluded here, except where the
action payload itself carries permission-worthy fields (e.g. link suspend writes the `suspend`
field via a plain PUT).

**Operation naming**: `Resource.Intent`, PascalCase, aligned with existing privilege names
(`Compute.Connectivity`, `Compute.Credentials`, `Node.ConsoleSettings`…).

---

## 1. Computes (first server-side vertical slice)

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Add compute | Computes page → *Add Compute* dialog (`add-compute-dialog.component`) | `POST /computes` | `name`, `protocol`, `host`, `port`, `user`, `password`, `auto_connect` | `Compute.Metadata` (name) + `Compute.Connectivity` (protocol/host/port) + `Compute.Credentials` (user/password) + `Compute.AutoConnect` | `user`/`password` prefilled `gns3`/`gns3`; `name` sent as `undefined` when blank; `password` omitted from payload when blank |
| Edit compute | Computes page → *Edit Compute* dialog (same component, edit mode) | `PUT /computes/{compute_id}` | `name`, `protocol`, `host`, `port`, `user`, `auto_connect` (+ `password` only when the user typed one) | same four operations as add | **Full PUT**: always re-sends every field with current values, changed or not. Password field opens empty; omitting it = keep stored password (write-only semantics) |
| Toggle auto-connect | Computes table inline slide toggle | `PUT /computes/{compute_id}` | `auto_connect` | `Compute.AutoConnect` | **Single-field partial PUT** — same endpoint as the dialog but a minimal payload; optimistic update, rollback on error |

### Computes findings

1. **Two payload shapes on one PUT endpoint**: the edit dialog sends the full field set; the
   auto-connect toggle sends `{auto_connect}` only. Field-level enforcement must treat *absent*
   keys as "not touched" (partial-update semantics), not reject unknown/missing keys.
2. **Full-PUT rewrites unchanged fields** (edit dialog). If the server maps "fields present in
   payload → operations touched", a user editing only the name would also *touch* credentials
   and connectivity. Either the server diffs payload vs. current compute state, or the UI must
   switch to partial payloads (the toggle already proves the server accepts them — see the
   auto-connect partial-update contract).
3. `password` is write-only from the UI: the edit dialog never displays or re-sends the stored
   value; it is included only when non-empty (empty string historically caused a server 500).
4. `user` defaults to `gns3` and is always sent (may be `undefined` when the field is cleared).

---

## 2. Projects

All project settings writes funnel through `ProjectService.update()` which PUTs a **fixed
14-field set** no matter which UI surface triggered it:
`auto_close, auto_open, auto_start, drawing_grid_size, grid_size, name, scene_width,
scene_height, snap_to_grid, show_grid, show_interface_labels, show_layers, variables, zoom`
(`project.service.ts:101-118`).

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Create blank project | Projects page → *Add blank project* dialog | `POST /projects` | `name`, `project_id` | `Project.Allocate` (create) | `project_id` is a UUID **generated client-side** and sent as a hint |
| Edit project (General tab) | Project map → *Edit project* dialog | `PUT /projects/{project_id}` | `name` | `Project.Metadata` | always accompanied by the full 14-field PUT (see finding 1) |
| Edit project (Scene tab: scene size, grids) | same dialog | `PUT /projects/{project_id}` | `scene_width`, `scene_height`, `grid_size`, `drawing_grid_size` | `Project.Scene` (scene size) + `Project.Grid` (grid sizes) | one save button → one PUT covering the whole dialog |
| Edit project (Behavior checkboxes) | same dialog | `PUT /projects/{project_id}` | `auto_open`, `auto_start`, `auto_close` | `Project.Behavior` | `auto_close` checkbox is **inverted** in the UI ("keep project open") |
| Edit project (Display checkbox) | same dialog | `PUT /projects/{project_id}` | `show_interface_labels` | `Project.Display` | |
| Edit project (Global variables tab) | same dialog | `PUT /projects/{project_id}` | `variables` (array of `{name, value}`) | `Project.Variables` | warning shown: changing variables rebuilds Docker containers |
| Edit README | same dialog, README tab | `POST /projects/{project_id}/files/README.txt` | request body = raw README text | `Project.Readme` | re-POSTed **unconditionally after every dialog save**, even when untouched |
| Toggle interface labels | Project map menu toggle | `PUT /projects/{project_id}` | intent: `show_interface_labels` | `Project.Display` | wire payload = full 14-field set |
| Toggle layers | Project map menu toggle | `PUT /projects/{project_id}` | intent: `show_layers` | `Project.Display` | wire payload = full 14-field set |
| Toggle grid | Project map menu toggle | `PUT /projects/{project_id}` | intent: `show_grid` | `Project.Display` | wire payload = full 14-field set |
| Toggle snap to grid | Project map menu toggle | `PUT /projects/{project_id}` | intent: `snap_to_grid` | `Project.Grid` | wire payload = full 14-field set |
| Import project (.gns3 file) | Projects page → *Import project* dialog | `POST /projects/{project_id}/import?name={name}` | multipart file; `name` query param; `project_id` = client-side UUID path | `Project.Allocate` (import) | closes an already-open project with the same name first |
| Save as / duplicate project | Project map → *Save project* dialog; also *Duplicate* on projects page | `POST /projects/{project_id}/duplicate` | `name` | `Project.Allocate` (duplicate) | only editable field is the new name |
| Create snapshot | Snapshots dialog | `POST /projects/{project_id}/snapshots` | `name` | `Snapshot.Allocate` | borderline action, listed because the payload carries a user-chosen field |
| Distribute project | Projects page → *Distribute Project* dialog | `POST /projects/{project_id}/distribute` | `name` (project name, re-sent), `target_user` / `target_users` / `target_group` (exactly one), `reset_mac_addresses`, `lock_topology` | `Project.Distribute` | 202 + background job; copies are per-recipient (`{name}-{username}`); `lock_topology` locks every node/drawing in each copy (advisory: UI hides actions, owner role enforces); the caller cannot be a user target (409) and `owner_role` may not be wider than the caller's own privileges (403); `owner_role` exists in the service signature but is **not exposed** by the dialog; the recipient picker lists the caller's own group members (`GET /access/users/me/group-members`, `User.GroupMembers`) and also offers a hand-typed username (cross-group collaboration); the caller is excluded from both |
| Share project | Projects page → *Share Project* dialog | `POST /projects/{project_id}/share` | `target_user` / `target_users` / `target_group` (exactly one), `role` | `Project.Share` | no copies — one live ACE; re-sharing with the same target updates its role; `role` defaults server-side to the built-in *Lab member* role; the project owner cannot be a target (409 — it would replace the owner ACE) and is excluded from the recipient picker, which otherwise lists the caller's own group members (`User.GroupMembers`) plus a hand-typed username |

### Projects findings

1. **Every project settings write is a full 14-field PUT** — the dialog edits a subset, the map
   toggles edit exactly one field, but `ProjectService.update()` always sends all 14. Same
   consequence as Computes finding 2: "present in payload" ≠ "intentionally changed". This is
   the single most important wire-format fact for the operation layer on this endpoint.
2. Fields the edit dialog **never** exposes (`zoom`, and per-surface `show_grid`, `show_layers`,
   `snap_to_grid`, `drawing_grid_size`…) are still rewritten by every save/toggle.
3. README is a separate endpoint (project *file*), always re-sent on dialog save → two-endpoint
   save with partial-failure states.
4. `project_id` on create/import is client-generated; server must treat it as a request hint,
   not an assignment.
5. **Distribute vs share are two different trust moves** landing on sibling endpoints: distribute
   hands out *copies* (recipients become owners of their copy, role chosen server-side), share
   grants access to *the same project* (one live ACE, `role` field in the payload). A field-level
   operation layer that bundles them under one operation cannot distinguish "give away a copy"
   from "let someone into my project" — keep the target-selection and copy-option fields
   (`lock_topology`, `reset_mac_addresses`, `role`) separate from each other.
6. The share dialog never sends `owner_role`; the distribute dialog never sends `role`. Each
   endpoint therefore sees a disjoint role-ish field, which makes per-endpoint operation
   validation (not a shared payload schema) the right shape.
7. **Share/Distribute buttons on the projects page are gated per project**, not globally: for a
   project the caller did not create (a project shared with them, or a distributed copy) the
   page fetches `GET /projects/{project_id}/me/privileges` and reads `Project.Share` /
   `Project.Distribute` from that path-evaluated list. The flattened global list
   (`GET /access/users/me/privileges`) overestimates there: the project ACE (e.g. Lab member)
   replaces the inherited global role, so every default account would otherwise see the actions
   on a project merely shared with them.

---

## 3. Nodes — map-level writes

Node dialog/configurator writes are in §4; these are the map interactions. All of them are
**partial PUTs** (only the listed keys) — in contrast to the configurator's full PUT.

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Drag node | map drag (`node-dragged` listener) | `PUT /projects/{project_id}/nodes/{node_id}` | `x`, `y` | `Node.Position` | client-side snap-to-grid rounding before send |
| Drag node label | map drag (`node-label-dragged` listener) | `PUT /projects/{project_id}/nodes/{node_id}` | `label` (`{rotation, style, text, x, y}`) | `Node.Label` | |
| Edit node label style/rotation | label double-click → *Text editor* dialog (node branch) | `PUT /projects/{project_id}/nodes/{node_id}` | `label.style` (rebuilt font/fill string), `label.rotation` | `Node.Label` | label **text** is not editable in this dialog for nodes (only style + rotation) |
| Align horizontally / vertically | context menu on multi-selection | `PUT /projects/{project_id}/nodes/{node_id}` | `x`, `y`, `z` | `Node.Position` | one PUT per selected node; `z` always included by `NodeService.update` |
| Bring to front / move z-order | context menu | `PUT /projects/{project_id}/nodes/{node_id}` | `x`, `y`, `z` | `Node.ZOrder` (or fold into `Node.Position`) | `x`/`y` re-sent unchanged alongside `z` |

### Node service payload shapes (shared by dialogs in §4)

`node.service.ts` write methods, for cross-reference with §4:

- `updatePosition` → `{x, y}`
- `updateLabel` → `{label: {rotation, style, text, x, y}}`
- `updateSymbol` → `{symbol}` (from *Change symbol* dialog)
- `update` → `{x, y, z}`
- `updateNode` (configurator save) → `{console_type?, aux_type?, console_auto_start, locked,
  custom_adapters?, name, properties, tags, netmiko_device_type, default_username,
  default_password}` — always sends name/properties/tags/… even when the dialog only edited one
  section; `properties` is the **whole per-type properties dict**, so any single property edit
  rewrites every property key.

---

## 4. Nodes — dialogs & config editors

All configurator saves funnel through `NodeService.updateNode()` / `updateNodeWithCustomAdapters()`
(`node.service.ts:138-166`) → `PUT /projects/{project_id}/nodes/{node_id}` with the fixed base payload:

```ts
{
  console_type?,            // omitted when falsy
  aux_type?,                // omitted when falsy
  console_auto_start,
  locked,
  custom_adapters?,         // only when the caller passes them
  name,
  properties,               // the ENTIRE properties dict (see finding N1)
  tags,
  netmiko_device_type,
  default_username,
  default_password,
}
```

Per-type rows below only list the fields their forms actually edit — remember the base payload
echoes everything else (N1).

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Create node from template | drag from node palette / template browser (`project-map.component.ts` `onNodeCreation`) | `POST /projects/{project_id}/templates/{template_id}` | `x`, `y`, `compute_id` (default `local`) | `Node.Create` | **name is not sent** — server names from template; rename-after-create is commented out |
| Post-creation label style fix | automatic after creation (`NodeCreatedLabelStylesFixer`) | `PUT /projects/{project_id}/nodes/{node_id}` | `label.rotation`, `label.style`, `label.text`, `label.x`, `label.y` | `Node.Label` | fires only when the created node's `label.style` is null |
| QEMU configurator — General tab | context menu *Configure* → qemu dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `aux_type`; `console_auto_start`; `properties.ram`; `properties.platform`; `properties.cpus`; `properties.boot_priority`; `properties.on_close`; `properties.linked_clone`; `properties.maxcpus`; `properties.create_config_disk`; `netmiko_device_type`; `default_username`; `default_password`; `tags[]`; `locked` | `Node.Resources` / `Node.ConsoleSettings` / `Node.Hostname` / `Node.Tags` | numeric fields parsed `parseInt/Float \|\| 0` |
| QEMU — HDD tab | same dialog | same PUT | `properties.hda_disk_image`, `properties.hda_disk_interface`, `properties.hdb_disk_image`, `properties.hdb_disk_interface`, `properties.hdc_disk_image`, `properties.hdc_disk_interface`, `properties.hdd_disk_image`, `properties.hdd_disk_interface` | `Node.Storage` | form prefills from `*_backing_file` when present |
| QEMU — CD/DVD tab | same dialog | same PUT | `properties.cdrom_image`, `properties.cdrom2_image`, `properties.cdrom_interface`, `properties.cdrom2_interface` | `Node.Storage` | post-save the client verifies the server persisted `cdrom_interface` and warns when the compute is stale (older computes drop it) |
| QEMU — Network tab | same dialog | same PUT | `properties.adapters`; `properties.mac_address`; `properties.adapter_type`; `properties.replicate_network_connection_state`; `custom_adapters[n].{adapter_number, adapter_type, port_name?, mac_address?}` | `Node.NetworkAdapters` | shared `CustomAdaptersComponent` (with adapter_type column) |
| QEMU — Advanced tab | same dialog | same PUT | `properties.initrd`; `properties.kernel_image`; `properties.kernel_command_line`; `properties.bios_image`; `properties.cpu_throttling`; `properties.process_priority`; `properties.qemu_path`; `properties.options`; `properties.tpm`; `properties.uefi` | `Node.HypervisorSettings` | `qemu_path`/`options` are arbitrary command-line influence — high RBAC value |
| QEMU — Usage tab | same dialog | same PUT | `properties.usage` | `Node.Metadata` | free text |
| QEMU disk image creator | qemu configurator → *QEMU image creator* | `POST /projects/{project_id}/nodes/{node_id}/qemu/disk_image/{diskName}` | `format`, `size`, `preallocation?`, `lazy_refcounts?`, `cluster_size?`, `refcount_bits?`, `subformat?`, `static?`, `adapter_type?`, `zeroed_grain?` | `Node.DiskImageCreation` | runs qemu-img server-side in the node directory |
| QEMU file upload buttons (cdrom/initrd/kernel/bios) | qemu configurator upload inputs | `POST /projects/{project_id}/nodes/{node_id}/files/{filename}` | raw file body | `Node.FileUpload` | on success also sets the matching `properties.*_image` locally for the subsequent PUT |
| Docker configurator — General tab | context menu *Configure* → docker dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `aux_type`; `console_auto_start`; `properties.image`; `properties.start_command`; `properties.adapters`; `properties.mac_address`; **`properties.memory`**; `properties.cpus`; `netmiko_device_type`; `default_username`; `default_password`; `tags[]`; `locked` | `Node.Resources` / `Node.ConsoleSettings` / `Node.Hostname` / `Node.Tags` | **docker memory key is `properties.memory`, NOT `mem_limit`** — the UI model uses `memory`; the server normalizes (see finding N2) |
| Docker — Network tab | same dialog → *Edit network configuration* | `POST /projects/{project_id}/nodes/{node_id}/files/etc/network/interfaces` | whole-file body (Debian ifupdown syntax: `auto/allow-hotplug`, `iface … dhcp\|static\|manual`, `address`, `netmask`, `gateway`, `dns-nameservers`, IPv6 stanzas, preserved arbitrary lines) | `Node.NetworkConfigFile` | serializer preserves unknown stanzas — structured edit round-trips arbitrary directives |
| Docker — Custom adapters sub-dialog | same dialog → *Custom adapters* | `PUT /projects/{project_id}/nodes/{node_id}` | `properties.adapters`; `custom_adapters[n].{adapter_number, port_name?, mac_address?}` + base payload | `Node.NetworkAdapters` | docker variant has **no `adapter_type` column** (unlike qemu/VBox/VMware); direct-save path does its own PUT |
| Docker — Advanced tab | same dialog | same PUT | `properties.environment`; `properties.extra_hosts`; `properties.console_resolution`; `properties.console_http_port`; `properties.console_http_path` | `Node.Environment` / `Node.ConsoleSettings` | `console_http_port` string in form → int-or-`undefined` in payload |
| Docker — Extra files tab | same dialog | same PUT | `properties.extra_configs[n].{target (absolute path), content}`; `properties.extra_volumes[]` | `Node.ExtraFiles` | writes arbitrary files into the container at user-typed absolute paths — security sensitive |
| Docker — Usage tab | same dialog | same PUT | `properties.usage` | `Node.Metadata` | |
| IOS/Dynamips — General tab | context menu *Configure* → ios dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `aux_type`; `console_auto_start`; `properties.image`; `properties.midplane`; `properties.npe`; `netmiko_device_type`; `default_username`; `default_password`; `tags[]` | `Node.Resources` / `Node.ConsoleSettings` / `Node.Hostname` | `midplane`/`npe` keys **deleted** unless platform is c7200 |
| IOS — Memory & disks tab | same dialog | same PUT | `properties.ram`; `properties.nvram`; `properties.iomem` (platform-gated, else deleted); `properties.disk0`; `properties.disk1`; `properties.auto_delete_disks` | `Node.Resources` | |
| IOS — Slots tab | same dialog | same PUT | `properties.slot0`…`slot6` (platform/chassis-valid only, others deleted); `properties.wic0`…`wic2` (wicMatrix-valid only) | `Node.NetworkAdapters` | values are adapter model strings (`C7200-IO-FE`, `NM-1E`, `WIC-1T`…) |
| IOS — Advanced tab | same dialog | same PUT | `properties.system_id`; `properties.mac_addr`; `properties.idlepc`; `properties.idlemax`; `properties.idlesleep`; `properties.exec_area`; `properties.mmap`; `properties.sparsemem` | `Node.Resources` | key is `mac_addr` (not `mac_address`) on dynamips |
| IOS — Usage tab | same dialog | same PUT | `properties.usage` | `Node.Metadata` | |
| IOU configurator | context menu *Configure* → iou dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `console_auto_start`; `properties.l1_keepalives`; `properties.use_default_iou_values`; `properties.ram`; `properties.nvram`; `properties.ethernet_adapters`; `properties.serial_adapters`; `properties.usage`; `netmiko_device_type`; `default_username`; `default_password`; `tags[]` | `Node.Resources` / `Node.NetworkAdapters` / `Node.ConsoleSettings` | no aux control in form but `aux_type` echoed when present; ethernet/serial counts shift serial port addressing |
| VPCS configurator | context menu *Configure* → vpcs dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `console_auto_start`; `netmiko_device_type`; `default_username`; `default_password`; `tags[]` (properties untouched — pure echo) | `Node.ConsoleSettings` / `Node.Hostname` / `Node.Tags` | smallest form |
| VirtualBox configurator (deprecated 3.1) | context menu *Configure* → virtualbox dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `console_auto_start`; `properties.ram`; `properties.on_close`; `properties.headless`; `properties.use_any_adapter`; `properties.usage`; `tags[]`; custom adapters (`properties.adapters`, `custom_adapters[n].{adapter_number, adapter_type, port_name?, mac_address?}`) | `Node.Resources` / `Node.ConsoleSettings` / `Node.NetworkAdapters` | |
| VMware configurator (deprecated 3.1) | context menu *Configure* → vmware dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `console_auto_start`; `properties.on_close`; `properties.headless`; `properties.linked_clone`; `properties.use_any_adapter`; `properties.usage`; `tags[]`; custom adapters as above | `Node.ConsoleSettings` / `Node.NetworkAdapters` | no RAM field in form (echo only) |
| Cloud configurator — General / remote console | context menu *Configure* → cloud dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type` (defaulted `none`); `properties.remote_console_host`; `properties.remote_console_port`; `properties.remote_console_http_path`; `properties.usage`; `tags[]`; `properties.ports_mapping` (whole list); echo incl. server-computed `properties.interfaces` | `Node.CloudPorts` / `Node.ConsoleSettings` / `Node.Hostname` | |
| Cloud — Ethernet/TAP/UDP port maps | same dialog, port tables + UDP tunnels | same PUT | `properties.ports_mapping` = ethernet `{interface, name, port_number: 0, type: "ethernet"}` + tap `{interface, name, port_number: 0, type: "tap", bridge?}` + udp `{name, lport, rhost, rport, port_number: 0, type: "udp"}` (concatenated, whole list replaced) | `Node.CloudPorts` | `port_number` hardcoded 0 for added entries — server addresses mappings by **list position**; `lport`/`rport` 1–65535 |
| NAT configurator | context menu *Configure* → nat dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `tags[]`; `properties.ports_mapping` (reassigned to ethernet-filtered list) | `Node.Hostname` / `Node.Tags` | port table read-only; reassignment silently drops non-ethernet entries |
| Ethernet hub configurator | context menu *Configure* → hub dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `tags[]`; `properties.ports_mapping` regenerated as `[{name: "Ethernet{i}", port_number: i}]` | `Node.NetworkAdapters` | one "number of ports" input regenerates the whole array |
| Ethernet switch configurator | context menu *Configure* → switch dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name`; `console_type`; `tags[]`; `properties.ports_mapping[n]` = `{name, port_number, vlan, type, ethertype}` (`type` ∈ access/trunk/qinq…; `ethertype` `0x8100`/`0x88A8`…) | `Node.NetworkAdapters` | shared `PortsComponent` bulk edit |
| Frame Relay switch configurator | context menu *Configure* | same PUT | `name`; `properties.mappings` object rebuilt, keys/values `"{port}:{dlci}"`; `tags[]` | `Node.NetworkAdapters` | whole map replaced each save |
| ATM switch configurator | context menu *Configure* | same PUT | `name`; `properties.mappings` object rebuilt, keys/values `"{port}:{vpi}:{vci}"` (VC) or `"{port}:{vci}"` (VP); `tags[]` | `Node.NetworkAdapters` | separate inputs joined into map keys |
| Startup/private config editor | context menu *Edit config* | `POST /projects/{project_id}/nodes/{node_id}/files/{file}` — vpcs `startup.vpc`; iou `startup-config.cfg` / `private-config.cfg`; dynamips `configs/i{dynamips_id}_startup-config.cfg` / `configs/i{dynamips_id}_private-config.cfg` | raw text = entire body | `Node.ConfigFiles` | one click = up to 2 requests (startup then private); path embeds `properties.dynamips_id` |
| Import config from file | context menu *Import config* | same endpoints (vpcs forced startup) | raw file text = entire body | `Node.ConfigFiles` | |
| File manager — save edited text file | *Show in file manager* (inline window or page) | `POST /projects/{project_id}/nodes/{node_id}/files/{path}` | raw text = entire body; **path = any file in the node directory** | `Node.FileWrite` | read side is gated on `Node.Audit`; the write is arbitrary-path arbitrary-content |
| File manager — upload file | same | `POST /projects/{project_id}/nodes/{node_id}/files/{dir}/{filename}` | raw file body | `Node.FileUpload` | user-chosen directory + original filename |
| Change hostname | context menu *Change hostname* → dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `name` + **full base payload echo** | `Node.Hostname` | NOT a minimal `{name}` PUT — echoes possibly stale in-memory node |
| Change symbol | context menu *Change symbol* → dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `symbol` | `Node.Symbol` | minimal PUT |
| Idle-PC picker (dynamips) | context menu *Idle-PC* → dialog | `PUT /projects/{project_id}/nodes/{node_id}` | `properties.idlepc` + full base echo | `Node.Resources` | |
| Auto Idle-PC (dynamips) | context menu *Auto Idle-PC* | `GET /projects/{project_id}/nodes/{node_id}/dynamips/auto_idlepc` | *(no body — server mutates `properties.idlepc`)* | `Node.IdlePC` | **a GET that mutates state** — verb-based mapping misses it |
| Lock/unlock node | context menu *Lock item* | `PUT /projects/{project_id}/nodes/{node_id}` | `locked` (toggled) + full base echo | `Node.Lock` | batch over selection; stale `locked` can silently flip during unrelated edits |
| Fault injection | toolbar → *Fault injection* dialog | `POST /copilot/projects/{project_id}/chat/inject` (SSE) | free-text `message` | `Copilot.InjectFault` | actual node writes are performed by server-side AI tools — **bypasses any field catalog unless cataloged separately** |
| Duplicate node | context menu *Duplicate* | `POST /projects/{project_id}/nodes/{node_id}/duplicate` | `x`, `y`, `z` | action-type, listed for payload completeness | |

### Node findings

- **N1. Full-properties echo on every save**: `properties: node.properties` sends the *entire*
  GET-response object back, including fields no form ever shows: `*_md5sum`, cloud
  `interfaces`, `dynamips_id`, `chassis`, `vmname`, `ports_mapping`… Field-level RBAC must
  treat every configurator PUT as potentially writing every property key, or the UI must
  learn partial property payloads (`node.service.ts:138-156`).
- **N2. Docker memory key is `properties.memory`** in the UI model (not `mem_limit` as
  sometimes assumed from the server side) — confirmed in
  `configurator-docker.component.ts:132`.
- **N3. Conditional key deletion**: IOS deletes `slot0-6`/`wic0-2` invalid for the platform,
  `midplane`/`npe` unless c7200, `iomem` on unsupported platforms — key *absence* is a distinct
  payload outcome from an empty value.
- **N4. One action → many requests**: config editor save = startup + private POSTs; node
  creation = template POST + label-fix PUT; docker save = node PUT + (separately) interfaces
  file POST.
- **N5. Same field, many entries**: `name` (every configurator + hostname dialog);
  `console_type`; `properties.idlepc` (Advanced tab, Idle-PC dialog, auto-idle-PC GET);
  `custom_adapters` (per-type sub-dialogs, with/without `adapter_type` depending on type).
- **N6. `default_username`/`default_password`** are controller-only credentials (never sent to
  the compute) but are re-sent on **every** configurator save.
- **N7. Client-side-only guard**: `validateConnectedPorts` blocks removing in-use adapters
  before the PUT — the server must re-validate; the PUT itself is unrestricted.
- **N8. Arbitrary-path file writes**: file manager save/upload accept any path under the node
  directory; docker `extra_configs[].target` is a user-typed absolute container path; the
  docker network editor round-trips preserved arbitrary lines.

---

## 5. Links

`LinkService.updateLink()` builds a **partial payload**: only `nodes`, `filters`, `suspend`,
`show_filters_icon` are included, and only when defined on the link object. The style editor and
label drags go through dedicated methods. Link creation is a full POST.

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Create link | *Draw link* tool → drag between interfaces (`link-created` listener) | `POST /projects/{project_id}/links` | `nodes[0..1]` (`{node_id, port_number, adapter_number, label{rotation, style, text, x, y}}`), `link_style` | `Link.Create` (endpoints + embedded labels) | `link_style` included **only** when the user configured a default link style in map settings |
| Edit link style | context menu → *Link style editor* dialog | `PUT /projects/{project_id}/links/{link_id}` | `link_style` (`{color, width, type, link_type, bezier_curviness, flowchart_roundness, control_offset?}`) | `Link.Style` | `control_offset` preserved only for freeform links, cleared otherwise |
| Edit packet filters | context menu → *Packet filters* dialog | `PUT /projects/{project_id}/links/{link_id}` | `filters` (dict of filter name → value; `bpf` is a single-element multiline string) | `Link.Filters` | PUT **replaces** the whole filter set; server strips zero values; available_filters is authoritative (no client gating) |
| Suspend link | context menu → *Suspend* | `PUT /projects/{project_id}/links/{link_id}` | `suspend: true` | `Link.Suspend` | action-flavored but a plain field write via updateLink |
| Resume link | context menu → *Resume* | `PUT /projects/{project_id}/links/{link_id}` | `suspend: false` | `Link.Suspend` | |
| Toggle filters icon | context menu | `PUT /projects/{project_id}/links/{link_id}` | `show_filters_icon` | `Link.Display` | |
| Drag interface label | map drag on link endpoint label (`interface-label-dragged`) | `PUT /projects/{project_id}/links/{link_id}` | `nodes[0..1]` (both endpoints, full `{node_id, port_number, adapter_number, label{...}}`) | `Link.Labels` | **both** endpoints re-sent even though only one label moved |
| Edit link label text | inline map text editor / *Text editor* dialog (link branch) | `PUT /projects/{project_id}/links/{link_id}` | `nodes[0..1]` (label text/style/rotation updated) | `Link.Labels` | |

### Links findings

1. `updateLink` is the good citizen: partial payload, only defined keys. Link style/labels have
   dedicated methods — the operation mapping on this endpoint is clean.
2. Label writes cannot target a single endpoint: `updateNodes`/label edits always serialize the
   full `nodes` array (both sides). Field-level mapping must treat `nodes[*].label` as one
   operation even when only one side changed.
3. Link creation embeds per-endpoint label geometry (`label.x/y` offsets, port `short_name`
   text) — creation payload is not just endpoints.
4. `suspend` is an action in the UI but a field on the wire (`PUT {suspend}`), unlike node
   start/stop which use dedicated action endpoints. If action operations and field operations
   are separate catalogs, `Link.Suspend` belongs to both discussions.

## 6. Link markers & marker definitions (traffic-insight markers)

Entry point: *Marker manager* dialog from the project map (`marker-manager.component`).

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Create / edit private marker (per link) | Marker manager → per-link marker form | `POST /projects/{project_id}/links/{link_id}/markers` / `PUT .../markers/{name}` | `bpf` (single expression string), `name?`, `tag?`, `color?`, `highlight_duration?`, `enabled?`, `direction?` (`tx`/`rx`/`both`), `data_link_type?` (uBridge DLT) | `Link.Marker` | server implements marker update as delete + re-add |
| Toggle marker on/off (per row) | Marker manager row switch | `PUT /projects/{project_id}/links/{link_id}/markers/{name}` | `enabled` | `Link.Marker` | fast path — signal + pcap stop/start without NIO rebuild |
| Create / edit marker definition (global, fans out to all capable links) | Marker manager → definitions tab | `POST /projects/{project_id}/marker-definitions` / `PUT .../marker-definitions/{name}` | `name?`, `bpf`, `tag?`, `color?`, `highlight_duration?`, `direction?`, `data_link_type?` | `Project.Marker` | editing syncs every inherited copy; new links inherit automatically |
| Pause / resume definition | Marker manager definitions tab | `POST /projects/{project_id}/marker-definitions/{name}/pause` (`/resume`) | *(no fields)* | `Project.Marker` | pauses all fanned-out copies |

Marker findings: `bpf` on markers is a **single string** (unlike link filters where `bpf` is a
multiline string inside the `filters` dict) — two different BPF shapes on link-scoped surfaces.

---

## 7. Drawings

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Insert drawing (shape/image) | context menu → *Add drawing* (`drawing-added` listener) | `POST /projects/{project_id}/drawings` | `svg`, `x`, `y`, `z` (fixed `1`) | `Drawing.Create` | content (shape/image) is inside the `svg` blob |
| Insert text | context menu → *Add text* (`text-added` listener) | `POST /projects/{project_id}/drawings` | `svg` (text wrapped in SVG), `x`, `y`, `z` | `Drawing.Create` | |
| Duplicate drawing | context menu → *Duplicate* | `POST /projects/{project_id}/drawings` | `svg`, `rotation`, `x`, `y`, `z` | `Drawing.Create` | offset +10/+10 from source |
| Drag drawing | map drag (`drawing-dragged` listener) | `PUT /projects/{project_id}/drawings/{drawing_id}` | `x`, `y` | `Drawing.Position` | partial PUT; client-side snap-to-grid |
| Resize drawing | map resize handle (`drawing-resized` listener) | `PUT /projects/{project_id}/drawings/{drawing_id}` | `svg` (new dimensions), `x`, `y` | `Drawing.Content` | size lives **inside** the svg blob → resize = content rewrite |
| Rotate drawing | map rotate handle (same listener, rotation branch) | `PUT /projects/{project_id}/drawings/{drawing_id}` | `locked`, `svg`, `rotation`, `x`, `y`, `z` | `Drawing.Rotation` (+ position/content re-sent) | **full 6-field PUT** via `DrawingService.update` even though only rotation changed |
| Edit drawing style / lock / rotation | context menu → *Style editor* dialog | `PUT /projects/{project_id}/drawings/{drawing_id}` | `locked`, `svg`, `rotation`, `x`, `y`, `z` | `Drawing.Style` (fill/stroke live in svg) | full PUT; style changes are svg-blob rewrites |
| Edit text drawing | *Text editor* dialog (drawing branch) | `PUT /projects/{project_id}/drawings/{drawing_id}` | `svg`, `x`, `y`, `z` | `Drawing.Text` | text content is inside the svg blob |

### Drawings findings

1. **`svg` is an opaque blob**: style (fill/stroke), text content, and dimensions are all
   encoded inside it. Field-level control below `svg` granularity is impossible server-side
   without parsing SVG; operations like `Drawing.Style` vs `Drawing.Text` are indistinguishable
   on the wire (both = `svg` changed).
2. Mixed payload discipline: drag = partial `{x, y}`, resize = `{svg, x, y}`, but rotate and the
   style dialog = full 6-field PUT (rewriting `locked`/`z`/… unchanged).

---

## 8. Templates

**Structural note**: GNS3 v3 template payloads are **flat, top-level keys** — there is no
`properties.` nesting anywhere in template writes (unlike node configurators). Every create is
`POST /templates`; every edit is `PUT /templates/{template_id}` with the **entire template
object** (read-modify-write). Wizards POST a full default "mock" object
(`template-mocks.service.ts`) with user fields overlaid — so creates carry ~20–40 silent default
fields too.

| UI operation | Entry point | API | Payload field paths | Suggested operation | Notes |
|---|---|---|---|---|---|
| Create QEMU template (wizard) | Preferences → *Add QEMU VM template* (server → name → RAM/platform → console → disk) | `POST /templates` | user fields: `name`, `usage`, `symbol`, `ram`, `platform`, `hda_disk_image`, `console_type`, `aux_type`, `netmiko_device_type`, `compute_id` + full mock defaults: `adapter_type`, `adapters`, `bios_image`, `boot_priority`, `builtin`, `category`, `cdrom_image`, `console_auto_start`, `cpu_throttling`, `cpus`, `maxcpus`, `create_config_disk`, `custom_adapters[]`, `default_name_format`, `first_port_name`, `hda_disk_interface`, `hdb_*`, `hdc_*`, `hdd_*`, `initrd`, `kernel_*`, `linked_clone`, `mac_address`, `on_close`, `options`, `port_name_format`, `port_segment_size`, `process_priority`, `qemu_path`, `replicate_network_connection_state`, `template_type`, `tpm`, `uefi`, `tags[]` | `Template.Create` | disk image upload itself is a separate write to `/images/upload/{filename}` |
| Edit QEMU — General settings | Preferences → QEMU template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `category`, `platform`, `ram`, `cpus`, `boot_priority`, `on_close` | `Template.Identity` + `Template.Resources` | full-object PUT |
| Edit QEMU — console fields | same section | same PUT | `console_type`, `aux_type`, `console_auto_start` | `Template.ConsoleSettings` | |
| Edit QEMU — HDD section | same editor | same PUT | `hda_disk_image`, `hda_disk_interface`, `hdb_disk_image`, `hdb_disk_interface`, `hdc_disk_image`, `hdc_disk_interface`, `hdd_disk_image`, `hdd_disk_interface` | `Template.DiskImages` | |
| Edit QEMU — CD/DVD section | same editor | same PUT | `cdrom_image`, `cdrom2_image`, `cdrom_interface`, `cdrom2_interface` | `Template.DiskImages` | |
| Edit QEMU — Network section | same editor | same PUT | `adapters`, `first_port_name`, `port_name_format`, `port_segment_size`, `mac_address`, `adapter_type`, `replicate_network_connection_state`, `custom_adapters[]` (`{adapter_number, adapter_type, port_name, mac_address}`) | `Template.NetworkAdapters` | custom-adapters dialog only **stages** values — they ride the next full PUT |
| Edit QEMU — Advanced section | same editor | same PUT | `initrd`, `kernel_image`, `kernel_command_line`, `bios_image`, `cpu_throttling`, `maxcpus`, `create_config_disk`, `process_priority`, `qemu_path`, `options`, `linked_clone`, `tpm`, `uefi` | `Template.HypervisorExecution` | `qemu_path`/`options` = arbitrary host command line — highest-risk fields |
| Edit QEMU — Usage & tags | same editor | same PUT | `usage`, `netmiko_device_type` (null when empty), `tags[]` | `Template.Metadata` | |
| Edit QEMU — credentials | credential inputs in General | same PUT | `appliance_metadata.default_username`, `appliance_metadata.default_password` | `Template.Credentials` | empty value deletes the key |
| Edit QEMU — Appliance metadata tab | `template-metadata-section` | same PUT | `appliance_metadata.description/.vendor_name/.vendor_url/.vendor_logo_url/.documentation_url/.product_name/.product_url/.status/.availability/.maintainer/.maintainer_email/.installation_instructions` (+ preserved unknown keys, read-only `appliance_id`) | `Template.Metadata` | read-modify-write of the whole metadata object |
| Create Docker template (wizard) | Preferences → *Add Docker template* | `POST /templates` | user fields: `image`, `name`, `adapters`, `start_command`, `console_type`, `aux_type`, `environment`, `netmiko_device_type`, `usage`, `symbol`, `compute_id` + mock defaults: `builtin`, `category`, `console_auto_start`, `console_http_path`, `console_http_port`, `console_resolution`, `mac_address`, `custom_adapters[]`, `default_name_format`, `extra_hosts`, `extra_volumes[]`, `extra_configs[]`, `memory`, `cpus`, `template_type`, `tags[]` | `Template.Create` | image pull = separate POST `/computes/{id}/docker/images/pull` |
| Edit Docker — General settings | Preferences → Docker template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `image`, `category`, `symbol`, `tags[]`, `adapters`, `mac_address`, `memory`, `cpus`, `console_type`, `aux_type`, `console_auto_start`, `console_resolution`, `console_http_port`, `console_http_path`, `environment`, `extra_hosts`, `extra_volumes[]`, `extra_configs[]`, `usage`, `netmiko_device_type`, `appliance_metadata` | `Template.Identity` / `Template.Resources` (`memory`,`cpus`) / `Template.ConsoleSettings` / `Template.ContainerConfig` | docker memory key is **`memory`** (not `mem_limit`) |
| Edit Docker — custom adapters | sub-dialog from editor | staged; sent by editor PUT | `custom_adapters[].adapter_number/.adapter_type/.port_name?/.mac_address?` + `adapters` count | `Template.NetworkAdapters` | blank `port_name` → key dropped; blank `mac_address` → null |
| Create IOS/Dynamips template (wizard) | Preferences → *Add IOS template* | `POST /templates` | user fields: `image`, `name`, `platform`, `usage`, `symbol`, `chassis?` (platform-gated), `ram`, `idlepc?` (non-empty only), `slot0..6`/`wic0..3` (matrix-gated), `netmiko_device_type`, `compute_id` + mock defaults (`auto_delete_disks`, `console_type`, `aux_type`, `console_auto_start`, `default_name_format`, `disk0/1`, `exec_area`, `idlemax`, `idlesleep`, `mac_addr`, `mmap`, `nvram`, `private_config`, `sparsemem`, `startup_config`, `system_id`, `builtin`, `template_type`, `tags[]`) | `Template.Create` | |
| Edit IOS — General | Preferences → IOS template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `image`, `startup_config`, `usage`, `netmiko_device_type`, `tags[]` | `Template.Identity` | |
| Edit IOS — Memory & disks | same editor | same PUT | `ram`, `nvram`, `iomem` (**key omitted when empty**), `disk0`, `disk1`, `sparsemem`, `mmap` | `Template.Resources` | |
| Edit IOS — Slots | same editor | same PUT | `slot0..6`, `wic0..3` (keys deleted when not applicable to platform/chassis) | `Template.NetworkAdapters` | conditional key deletion |
| Edit IOS — Advanced | same editor | same PUT | `system_id`, `idlemax`, `idlesleep`, `exec_area`, `idlepc`, `mac_addr` (+ generate-MAC button) | `Template.HypervisorExecution` | |
| Edit IOS — credentials/metadata | same editor | same PUT | `appliance_metadata.default_username/.default_password` + descriptive `appliance_metadata.*` | `Template.Credentials` / `Template.Metadata` | |
| Create IOU template (wizard) | Preferences → *Add IOU template* | `POST /templates` | user fields: `name`, `usage`, `symbol`, `path?`, `compute_id`, `ethernet_adapters`+`serial_adapters` (hard-coded 4/0 L2, 2/2 L3), `netmiko_device_type` + mock defaults (`builtin`, `category`, `console_type`, `console_auto_start`, `default_name_format`, `nvram`, `private_config`, `ram`, `startup_config`, `l1_keepalives`, `use_default_iou_values`, `template_type`, `tags[]`) | `Template.Create` | |
| Edit IOU — all sections | Preferences → IOU template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `path`, `startup_config`, `private_config`, `category`, `console_type`, `console_auto_start`, `l1_keepalives`, `use_default_iou_values`, `ram`, `nvram`, `ethernet_adapters`, `serial_adapters`, `usage`, `netmiko_device_type`, `tags[]`, `appliance_metadata.*` | `Template.Identity` / `Template.Resources` / `Template.ConsoleSettings` / `Template.NetworkAdapters` | |
| Create VPCS template (wizard) | Preferences → *Add VPCS template* | `POST /templates` | user fields: `name`, `compute_id`, `netmiko_device_type`, `usage`, `symbol` + defaults (`base_script_file: 'vpcs_base_config.txt'`, `builtin`, `category`, `console_type: 'telnet'`, `console_auto_start`, `default_name_format: 'PC{0}'`, `template_type`, `tags[]`) | `Template.Create` | |
| Edit VPCS — all sections | Preferences → VPCS template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `base_script_file`, `symbol`, `category`, `console_type`, `console_auto_start`, `tags[]`, `usage`, `netmiko_device_type`, `appliance_metadata.*` | `Template.Identity` / `Template.ConsoleSettings` | |
| Create VirtualBox template (wizard) | Preferences → *Add VirtualBox template* | `POST /templates` | `name`, `vmname`, `ram`, `linked_clone` + mock defaults (`adapter_type`, `adapters`, `console_type: 'none'`, `custom_adapters[]`, `headless`, `on_close`, `use_any_adapter`, …) | `Template.Create` | `vmname` = host hypervisor VM — security-relevant |
| Edit VirtualBox | Preferences → VBox template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `category`, `console_type`, `console_auto_start`, `ram`, `on_close`, `headless`, `linked_clone`, `adapters`, `first_port_name`, `port_name_format`, `port_segment_size`, `adapter_type`, `use_any_adapter`, `usage`, `tags[]`, `custom_adapters[]` | `Template.Identity` / `Template.Resources` / `Template.ConsoleSettings` / `Template.NetworkAdapters` | deprecated in 3.1 |
| Create VMware template (wizard) | Preferences → *Add VMware template* | `POST /templates` | `name`, `vmx_path`, `linked_clone` + mock defaults (as VBox) | `Template.Create` | `vmx_path` = server filesystem path — security-relevant |
| Edit VMware | Preferences → VMware template details | `PUT /templates/{template_id}` | same shape as VBox minus `ram` | `Template.Identity` / `Template.ConsoleSettings` / `Template.NetworkAdapters` | deprecated in 3.1 |
| Create Cloud template (wizard) | Preferences → *Add Cloud template* | `POST /templates` | `name`, `compute_id`, `usage`, `symbol` + defaults (`ports_mapping: []`, `remote_console_type: 'none'`, `default_name_format: 'Cloud{0}'`, `template_type: 'cloud'`, `tags[]`) | `Template.Create` | |
| Edit Cloud — General | Preferences → Cloud template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `category`, `remote_console_type`, `remote_console_host`, `remote_console_port`, `remote_console_http_path`, `usage`, `tags[]` | `Template.Identity` + `Template.RemoteConsole` | remote console host/port = network reachability |
| Edit Cloud — Ethernet/TAP/UDP sections | same editor | same PUT | `ports_mapping[]` full rewrite: ethernet `{interface, name, port_number, type:'ethernet'}`, tap `{interface, name, port_number, type:'tap'}`, udp `{name, lport, rhost, rport, port_number, type:'udp'}` | `Template.HostInterfaces` / `Template.UdpTunnels` | `interface` binds **host NICs**; security-relevant |
| Create Ethernet hub template (wizard) | Preferences → *Add Ethernet hub* | `POST /templates` | `name`, `compute_id`, `usage`, `symbol`, `ports_mapping[]` (`{name:'Ethernet{i}', port_number:i}` × count) + defaults | `Template.Create` + `Template.Ports` | |
| Edit Ethernet hub | Preferences → hub template details | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `category`, `tags[]`, `usage`, `ports_mapping[]` **regenerated** from port count | `Template.Identity` + `Template.Ports` | regeneration silently discards per-port customization |
| Create Ethernet switch template (wizard) | Preferences → *Add Ethernet switch* | `POST /templates` | `name`, `compute_id`, `ports_mapping[]` (`{name, port_number, ethertype:'0x8100', type:'access', vlan:1}` × count) + defaults | `Template.Create` + `Template.Ports` | |
| Edit Ethernet switch | Preferences → switch template details (+ shared Ports component) | `PUT /templates/{template_id}` | `name`, `default_name_format`, `symbol`, `category`, `console_type`, `tags[]`, `usage`, `ports_mapping[].name/.port_number/.vlan/.type/.ethertype` | `Template.Identity` / `Template.ConsoleSettings` / `Template.Ports` | |
| Install appliance → QEMU template | Project map → *New template* dialog (registry or .gns3a import) → Review → Create | `POST /templates` | **appliance-driven passthrough** — every qemu key from the appliance file (`ram`, `cpus`, `adapters`, `options`, `qemu_path`, `boot_priority`, `console_type`, disk images, kernel fields, …) + `appliance_metadata` (14 fields incl. `default_username`/`default_password`), `compute_id`, `template_id`, `name` | `Template.Create` (appliance path) | `Object.assign` over appliance props — the operation must allow writing **the union of all qemu fields**; `.gns3a` is parsed in-browser, so keys are file-influenced |
| Install appliance → IOS/Dynamips template | same wizard | `POST /templates` | `chassis`, `nvram`, `platform`, `ram`, `startup_config`, `slot0..7`, `image`, `appliance_metadata.*`, `name`, … | `Template.Create` | writes `slot7`, which no editor manages |
| Install appliance → IOU template | same wizard | `POST /templates` | `nvram`, `ram`, `ethernet_adapters`, `serial_adapters`, `startup_config`, `path`, `appliance_metadata.*`, `name`, … | `Template.Create` | |
| Install appliance → Docker template | same wizard | `POST /templates` | `adapters`, `image`, `console_type`, `start_command`, `environment`, `extra_hosts`, `extra_volumes[]`, `extra_configs[]`, `custom_adapters[]`, `mac_address`, `cpus`, `memory` (mapped from appliance `mem_limit`), `console_http_*`, `console_resolution`, `appliance_metadata.*`, `name`, … | `Template.Create` | appliance `mem_limit` → template `memory` rename |
| Choose symbol | symbol dialog from every editor | staged → editor PUT `symbol` | `symbol` | `Template.Identity` | symbols manager also does adjacent asset writes: symbol upload `POST /symbols/{name}/raw`, delete |
| Duplicate template | Preferences → *Copy template* dialog (name only) | `POST /templates` | full source template object + new `template_id`, `name` | `Template.Duplicate` (action-type) | listed for completeness — payload is every field |

### Template findings

- **T1. All edits are full-object PUTs** (read-modify-write): every editor assigns section values
  back onto the fetched template object and PUTs the whole thing. "Field present" ≠ "user meant
  to change it".
- **T2. Creates POST ~20–40 silent mock defaults** (`template-mocks.service.ts`): e.g. QEMU
  create sends `options: '-nographic'`, `linked_clone: true`, all disk interfaces… though the
  wizard shows ~9 fields.
- **T3. Flat payloads** — no `properties.` nesting; per-type keys live at top level (`ram`
  everywhere; `memory` for docker).
- **T4. Credentials ride the template payload** (`appliance_metadata.default_username` /
  `default_password`) — written by every editor's General section and by appliance installs;
  worth their own `Template.Credentials` operation.
- **T5. Conditional inclusion**: `iomem` omitted when empty; `slot0..6`/`wic0..3` deleted when
  not applicable; `netmiko_device_type` null-when-empty; `chassis`/`idlepc` only when set;
  blank-target `extra_configs` rows dropped; default-valued custom-adapter rows filtered out.
- **T6. Server-owned fields echoed on every PUT**: `template_id`, `template_type`, `builtin`,
  `compute_id` are re-sent because the whole object goes.
- **T7. Appliance install = arbitrary-field passthrough** for QEMU (Object.assign of every
  appliance qemu key) — the `Template.Create` field catalog must cover the union of all qemu
  template fields, not just wizard/form fields. `.gns3a` import parses in-browser.
- **T8. Model drift**: `wic0..wic3` written vs `wic0..wic2` declared; appliance installer
  writes `slot7`; `appliance_metadata` set on models that don't declare it.
- **T9. Security-sensitive groupings**: `qemu_path`+`options` (host command line), `vmx_path`/
  `vmname` (host paths), `environment`/`extra_hosts`/`extra_configs` (container injection),
  `ports_mapping[].interface` (host NIC bind), `remote_console_host/port`, config file paths
  (`startup_config`, `private_config`, `base_script_file`).
- **T10. Adjacent non-template writes co-occurring in the same flows** (own endpoints, out of
  this table): image uploads `/images/upload/...`, docker image pull/load, symbol upload,
  `findIdlePC`.

---

## 9. Global findings (cross-cutting)

1. **Full-PUT vs partial-PUT is inconsistent across resources** — computes dialog, project
   settings, node configurator, template editors, drawing rotate/style: full rewrite; computes
   toggle, node position/label/symbol, links, drawing drag/resize: minimal partials. The
   operation engine needs a definition of "touched" that works for both: server-side diff
   against current state, or normalizing UI senders to partial payloads first (the auto-connect
   toggle and `LinkService.updateLink` prove the server already accepts partials).
2. **Echo fields**: node saves echo the entire `properties` dict incl. server-computed fields
   (`*_md5sum`, `interfaces`, `dynamips_id`…); template saves echo `template_id`,
   `template_type`, `builtin`, `compute_id`; project saves always include `zoom`,
   `show_layers`… Present-but-unchanged is the norm, not the exception.
3. **Blob fields defeat field granularity**: `drawing.svg`, node `properties` (one dict key),
   link `filters` (one dict key) — inner granularity only by parsing, not by field mapping.
4. **Write-only secrets**: compute `password` (sent only when typed); template
   `appliance_metadata.default_password`; node `default_username`/`default_password`
   (controller-only credentials, re-sent on every configurator save).
5. **Client-generated identifiers**: `project_id` on create/import; `template_id` on template
   create/duplicate.
6. **Per-type key renames to keep separate** (same UI intent, different payload keys):
   memory = `properties.ram` (qemu/IOS/IOU) vs `properties.memory` (docker node) vs `memory`
   (docker template flat) — appliance source `mem_limit` is renamed at install; dynamips MAC
   = `properties.mac_addr` vs `properties.mac_address` elsewhere; adapters = `custom_adapters`
   + `properties.adapters` (qemu/VBox/VMware) vs `properties.ethernet_adapters`/`serial_adapters`
   (IOU) vs regenerated `properties.ports_mapping` (hub/switch/cloud/NAT).
7. **A GET that mutates**: `GET /nodes/{id}/dynamips/auto_idlepc` applies a new idlepc —
   verb-based operation mapping misses it.
8. **AI fault injection bypass**: the fault-injection dialog posts free text to
   `/copilot/projects/{id}/chat/inject`; the actual writes happen in server-side AI tools,
   outside any field catalog — needs a dedicated operation or explicit exclusion.
9. **Arbitrary-path file writes**: node file manager save/upload (any path in the node
   directory), docker `extra_configs[].target` (absolute container paths), the docker network
   editor round-trips preserved arbitrary lines. Consider a coarse `Node.FileWrite` /
   `Node.FileUpload` operation rather than per-path rules.
10. **Client-side-only guards**: `validateConnectedPorts` blocks removing in-use adapters in
    the UI; the PUT itself is unrestricted — the server must re-validate.
11. **Multi-endpoint saves** (partial failure leaves mixed state): project dialog (PUT settings
    + POST README); config editor (startup + private POSTs); node creation (template POST +
    label-fix PUT); qemu configurator (node PUT + disk-image/POST files sub-ops); appliance
    install (image uploads + template POST).
12. **Locked-state side channel**: `locked` is re-sent by every node configurator save — a
    stale in-memory node can silently flip lock state during an unrelated edit.

---

## 10. Explicitly out of scope (follow-up candidates)

Write surfaces that exist in the UI but are **not** covered by this pass (not in the requested
computes/projects/templates/nodes/links/drawings scope). The server-side operation catalog will
need them eventually:

- **Access/admin area**: users (`/access/users`), roles & privileges (`/access/roles`),
  groups (`/access/groups`), ACL (`/access/acl`), API keys (`/access/api-keys`).
- **Server settings**: `PUT /server-settings` (server-settings page).
- **Controller resources**: symbol upload/delete (`/symbols`), image manager
  (`/images/install`, `/images/sync`, uploads), IOU license (`PUT /iou_license` — no UI caller).
- **Resource pools**: create/rename (`/pools`), resource assignments.
- **Copilot**: chat sessions, pin/rename, skills reload, fault injection (see finding 8).

---

## Appendix: files consulted

Services: `compute.service.ts`, `project.service.ts`, `node.service.ts`, `link.service.ts`,
`drawing.service.ts`, `snapshot.service.ts`, `marker.service.ts`, `template.service.ts`,
`template-mocks.service.ts`, `qemu.service.ts`, `docker.service.ts`, `ios.service.ts`,
`iou.service.ts`, `vpcs.service.ts`, `virtual-box.service.ts`, `vmware.service.ts`,
`built-in-templates.service.ts`, `symbol.service.ts` (all under `src/app/services/`).

Components: `components/computes/*`, `components/projects/*` (add-blank / edit / import / save
dialogs), `components/project-map/*` (project-map.component, node-editors/configurator/* per
type, node-editors/config-editor, drawings-editors/{link-style-editor, style-editor,
text-editor}, change-hostname-dialog, change-symbol-dialog, fault-injection-dialog,
node-file-manager-{inline,page}, marker-manager, packet-capturing/packet-filters,
context-menu/actions/*, new-template-dialog), `components/preferences/*` (per-type template
editors + common sections + template-metadata-section), `components/drawings-listeners/*`,
`cartography/components/text-editor`, `cartography/widgets/nodes`.

Models: `models/compute.ts`, `models/project.ts`, `models/link.ts`, `models/link-style.ts`,
`models/marker.ts`, `models/templates/*`, `cartography/models/{node,drawing}.ts`.
