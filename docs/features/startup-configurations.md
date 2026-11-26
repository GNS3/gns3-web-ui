<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

> AI-assisted documentation. [See disclaimer](../README.md).

# Startup Configurations, Import and Export

> Save a configuration for each node, keep them in sets, export and import them, and have a node boot with its saved configuration after a wipe.

**Updated**: 2026-11-26
**Status**: Implemented

---

## What it does

This feature lets you keep and reuse configurations for supported devices in a project.

- **Save** a configuration for each node, grouped in named _configuration sets_ (for example "Lab start", "Solution").
- **Load it at boot**: after a _wipe_, a node starts with the configuration you saved for it instead of its image defaults.
- **Export** configurations from running devices, and **download** or **upload** them as files.
- **Import and export whole sets** as ZIP archives to move them between projects.
- **Wipe** nodes to bring them back to a clean state.

Supported nodes: VPCS, IOU, Dynamips, QEMU and Docker (Linux network file, FRR and IOL only).

## How it works

### Key terms

- **Configuration set** is a named group of saved configurations, with one entry per node. A project holds up to 32 sets. The built-in **Default** set is protected from renaming and deletion.
- **Startup toggle** assigns the viewed set to a node when turned ON and clears its startup assignment when turned OFF. ON requires a saved configuration the node can use. A disabled switch shows the reason.
- **Wipe** resets the node's runtime state and keeps its GNS3 sets and assignments. The affected files depend on the engine. Wipe is irreversible.
- **Clean boot selection** is the saved set, if any, shown in the node's Configuration tab for the next clean boot.

### Where the actions live

| Place                                     | Actions                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project toolbar, _Startup configurations_ | Opens the dialog: sets, per-node text, toggles, upload, download, fetch, import and export of sets                                                                                                                                                                                                                                                                                               |
| Nodes menu (toolbar)                      | _Export all configurations_, _Wipe all nodes_ (hidden in a read-only project, without `Project.Modify`, `Node.Modify` and `Node.Console`; disabled while an operation is running)                                                                                                                                                                                                                |
| Node context menu                         | _Export config_ requires `Node.Audit` and also `Node.Console` when the export reads the live device. _Export running config_ is offered on started IOU and Dynamips routers. _Wipe node_ or _Wipe nodes_ requires `Project.Modify`, `Node.Modify` and `Node.Console` and is hidden on a frozen distributed template. _Import config_ is available for VPCS, IOU and Dynamips with `Node.Modify`. |
| Node context menu                         | _Configuration sets_ for two or more selected nodes (needs `Project.Modify` and `Node.Modify`; capture and assigning a set also need `Node.Console`; hidden in a read-only project and on a frozen distributed template): capture into a set, start from a set, or clear                                                                                                                         |
| Node editor, _Configuration_ tab          | Assign a set, startup toggle, startup configuration profile (QEMU), edit, save, fetch, apply to running node, download, discard, reload                                                                                                                                                                                                                                                          |

### Typical workflow

1. Open _Startup configurations_, pick or create a set and select a node.
2. Type or paste the configuration and click _Save_. You can also use _Upload configuration_ or _Fetch from device_ to fill the entry. A successful upload saves the text and enables startup if the node can use it. A fetch saves the entry and preserves its startup setting.
3. Turn the node's startup switch ON. To use the viewed set across the project, click _Apply Config Set_. This replaces individual assignments, enables eligible entries in the viewed set, and clears startup for nodes without an eligible entry.
4. Choose _Wipe node_, confirm the reset, and then start the node. Check its startup status or guest console for the result.
5. After changing the saved text or assignment for a node that has already booted, wipe and start it to load the new configuration. An ordinary restart keeps the device's saved state. A fresh QEMU node with a startup media profile can receive its configuration on its first launch.

For a clean boot from the base image, turn startup OFF or clear the assignment, then wipe and start the node. The project dialog's _Disable all saved configurations_ action clears startup assignments across the project.

### Actions on selected nodes

Select two or more nodes on the map and choose _Configuration sets_ in the context menu (node types without a configuration engine are left out). A single node has these actions in its _Configuration_ tab.

- **Capture selected nodes running configuration into a set** reads the selected nodes into an existing or new set. Console-based captures require a running node. VPCS, Docker network files, and FRR can also be read while stopped. The result reports per-node failures. Existing entries keep their startup setting, and new entries start OFF.
- **Start selected nodes from a configuration set** assigns a set to those nodes. The dialog lists nodes without an enabled entry. Those nodes use their image defaults after a wipe and start.
- **Clear startup configuration of selected nodes** clears their assignments and keeps the saved texts in their sets.

Assigning and clearing take effect at the next wipe and start, like every change of set. Both are one write (`PUT /v3/projects/{project_id}/startup-configurations/selections` with `node_ids`, `selection` and the assignment `revision`), refused as a whole when one node cannot take it or when the assignments changed in the meantime.

### Export, import and download

- **Fetch from device / Fetch from node** saves the device's captured configuration into the set open in the project dialog or node tab. VPCS reads its saved script. Docker can read saved network files, and FRR reads running configuration or its saved file according to node state.
- **Export all configurations** finds the currently eligible project nodes and captures them into the project's selected startup set. The notification separately counts nodes with no saved configuration, nodes to start or resume for a console export, and other failures. Open _Startup configurations_ to see results for nodes the server tried to capture.
- **Export config** in the context menu downloads a file and leaves the project's sets unchanged. IOU and Dynamips let you choose the saved startup or private file. Use _Export running config_ for their live configuration. QEMU exports through its configured console recipe. A standard download is named `<node>_configuration.<ext>`. Common extensions are `.vpc` for VPCS, `.rsc` for MikroTik, `.xml` for PAN-OS, `.zip` for multi-file exports, and `.cfg` for other configurations.
- **Download** saves the entry text as a file. The node tab downloads the saved copy after pending edits have been saved or discarded.
- **Upload configuration** in the dialog saves a text file into the viewed set for the selected node and enables startup when the configuration is supported. Binary files are refused.
- **Set export / import**: _Export set_ downloads a ZIP with one readable file per node under `nodes/` and a `manifest.json` (it may contain secrets); the files can be edited and zipped again. _Import set from archive_ adds it as a new set; nodes are matched by id, then by unique name, and the result message lists nodes matched by name and nodes skipped with the reason. Both buttons are disabled while there are unsaved edits.
- **Import config** (context menu, VPCS/IOU/Dynamips): writes a file straight into the node's own startup file. It is independent of the sets: a later wipe discards it and the assigned set takes over.
- **Portable project exports and snapshots** include the project's saved sets and assignments. Use a set ZIP to share one set, or the project export or snapshot controls to carry the configuration sets with the topology.

### Apply to a running node

In the node's _Configuration_ tab, save the entry, choose _Apply to node_, and confirm.
On a supported running device, this merges the saved commands into the live configuration
and saves or commits the changes. Settings absent from the file remain. To confirm
which settings took effect, check the guest's running configuration.

### What can be wiped or started from a set

- VPCS, IOU (including Docker IOL), Dynamips, QEMU, FRR containers and the Linux network file of Docker nodes. Other Docker nodes get no startup or wipe actions.
- Wiping a QEMU linked clone can erase its local disk changes, UEFI variables, TPM state, and config disk. For a generic Linux container it clears the saved network configuration file. The shared base image and GNS3 configuration sets are kept.
- **FRR containers** (an image named `frr`, or one with `FRR_PROFILE` set, and no Netmiko device type): the saved configuration is `/etc/frr/frr.conf`. _Export_ gives the running configuration while the node runs and the saved file while it is stopped.
- QEMU nodes use one of two delivery modes (below). The Configuration tab explains in a short note when a node cannot use a set (missing Netmiko device type, unsupported console, profile mismatch).
- **Wipe all nodes** refreshes the project's node list before confirmation. A context-menu wipe uses the chosen node or selection. The server checks each node, stops running nodes when it can reset them safely, and leaves them stopped. Results report each failure and indicate which nodes were stopped first. A node with unsupported storage or a conflicting capture or live-apply job is skipped.

### Dialog behaviour

- Unsaved edits ("dirty") block switching sets, importing and exporting; _Save_, _Cancel changes_ and _Close_ follow the usual rules.
- A banner shows "Status updates unavailable" when polling fails; load errors offer _Retry_.
- Read-only projects disable every write action.

## QEMU startup delivery and status

Choose a **Startup configuration profile** in the QEMU template details to set the default for new nodes, or in a node's **Configuration** tab to change that node. The selector shows compatible profiles and keeps the current profile visible when the catalog is unavailable.

| Mode                      | Requirements and behavior                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Console (default)**     | Uses a Telnet or SSH console. Set a supported Netmiko device type that matches the saved entry. Close open console sessions while startup replay is waiting. Viptela, PAN-OS, EOS, and Junos use a startup media profile for restore.                                                                                          |
| **Startup media profile** | Delivers an appliance-specific CD-ROM, FAT disk (IOSv and IOSvL2), or prepared node disk (vEOS). The profile determines the saved entry's device type and can deliver startup without a Telnet or SSH console or a Netmiko type. Console-based **Fetch** and **Apply to node** have their own console and recipe requirements. |

| Startup status                                                               | What it means                                                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `prepared`                                                                   | GNS3 staged the configuration for the next launch.                                                                                         |
| `media_delivered`                                                            | The guest launched with the staged startup media or prepared disk. Check the guest console or running configuration to confirm the import. |
| `applied`                                                                    | Startup delivery succeeded. For the supported console-replay recipes, GNS3 also checked the running configuration after replay.            |
| `configuration_apply_accepted`                                               | The guest accepted the commands. This status covers live apply and startup replay on appliances without comparable read-back.              |
| `configuration_apply_unverified` or `configuration_verification_unavailable` | Read-back differed from the saved configuration or could not be checked. Inspect the guest before retrying.                                |
| `saved_state_kept`                                                           | The guest already booted and kept its saved configuration. Wipe and start it when you want to load the assigned set.                       |

### Troubleshooting

- **Waiting for the console** means the guest is still booting or an open console client is blocking the automated replay. Close browser and desktop console sessions for that node.
- **Boot media build failed** means you should check the selected profile, the tools installed on the compute host, and the compute log. ISO profiles need an ISO builder and FAT profiles need mtools.
- **Controller-mode C8000v needs a username entry** means the assigned CLI configuration needs a valid top-level `username` line for a guest login. The Netmiko fields in **General** are used to sign in to an existing guest account. Add the account to the assigned set, or turn startup OFF before retrying the wipe.
- **QEMU rejects `virtio-gpu-pci` with VNC** when the selected QEMU binary lacks the graphics module GNS3 requests. Check the QEMU installation on the compute host. For IOSv's serial CLI, switch to the appliance's default Telnet console. The error occurs before startup restore begins.
- **Another session changed the set** means your saved revision is stale. Keep a copy of your edits, reload the latest set, and reconcile the changes before saving again.

## Technical reference

- Bulk node assignments use `PUT /v3/projects/{project_id}/startup-configurations/selections` and an assignment revision. The entire request is refused when a node is ineligible or the revision is stale.
- The QEMU profile selector uses `GET /v3/startup-media-profiles`. The node tab evaluates blockers against pending profile settings before saving the node. Choosing **Console (default)** clears the profile. The client sends the profile field when setting or clearing it.
- The project dialog can copy masked failure details. These include the stage and command position when the server can identify them.
