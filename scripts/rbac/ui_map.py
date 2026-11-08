"""Curated Web UI page/action for each controller endpoint.

Key:    "METHOD /canonical/path"
        - path parameters are written as {} (the generator normalizes both
          the server templates and the TypeScript template literals).
        - paths are relative to the controller API root (/v3).
Value:  {"page": "...", "action": "...", "note": "..."}

Only endpoints with a real Web UI surface need an entry. Endpoints the
Web UI never calls stay empty (the generated Service column proves it);
endpoints that ARE called but whose page/button is not described yet show
"(to be filled)" in the generated document.

Keep the descriptions human-readable (no shorthand codes). When the UI
wiring changes, update this file and regenerate the document.
"""

UI_MAP: dict[str, dict[str, str]] = {
    # ------------------------------------------------------------------
    # Login / session / global shell
    # ------------------------------------------------------------------
    "POST /access/users/login": {"page": "Login page", "action": "Sign in"},
    "POST /access/users/authenticate": {"page": "Login page", "action": "Sign in with an existing token"},
    "POST /access/users/refresh": {"page": "Global", "action": "Token refresh (automatic in HttpController)"},
    "POST /access/users/logout": {"page": "App shell", "action": "Sign out"},
    "GET /version": {"page": "App shell", "action": "Show the controller version"},
    "GET /statistics": {"page": "System status page", "action": "Load system statistics"},
    "GET /notifications": {"page": "Global", "action": "Notification stream (SSE)"},
    "WEBSOCKET /notifications/ws": {"page": "Global", "action": "Notification stream (WebSocket)"},
    "GET /access/users/me": {"page": "App shell", "action": "Load the signed-in user"},
    "PUT /access/users/me": {
        "page": "Profile / Change password dialog",
        "action": "Edit own profile or password (self-service, no admin privilege)",
    },
    "GET /access/users/me/privileges": {
        "page": "App shell",
        "action": "Data source for privilege-based rendering of the sidebar and pages",
    },
    "GET /access/privileges": {"page": "Role detail page", "action": "Load the assignable privilege catalog"},

    # ------------------------------------------------------------------
    # Projects list / project view shell
    # ------------------------------------------------------------------
    "GET /projects": {"page": "Projects page", "action": "Load the project list (the server filters by ACE/resource pool)"},
    "POST /projects": {"page": "Projects page", "action": "New project (button = Project.Allocate)"},
    "POST /projects/load": {"page": "Projects page", "action": "Reload the projects on the controller"},
    "POST /projects/{}/import": {"page": "Projects page", "action": "Import project (button = Project.Allocate)"},
    "DELETE /projects/{}": {"page": "Projects page", "action": "Delete project (button = Project.Allocate)"},
    "POST /projects/{}/open": {"page": "Projects page", "action": "Open project (button = Project.Allocate)"},
    "POST /projects/{}/close": {"page": "Project view toolbar", "action": "Close project (menu = Project.Allocate)"},
    "POST /projects/{}/duplicate": {"page": "Projects page", "action": "Duplicate project (button = Project.Audit)"},
    "GET /projects/{}/export": {
        "page": "Projects page / Project view menu",
        "action": "Export project (button = Project.Audit)",
    },
    "GET /projects/{}": {"page": "Project view", "action": "Load the project when it is opened"},
    "PUT /projects/{}": {
        "page": "Project view",
        "action": "Save project settings, Map settings PUT items (= Project.Modify)",
    },
    "GET /projects/{}/gns3file": {"page": "Topology preview", "action": "Read the .gns3 file to render the static preview"},
    "GET /projects/{}/files/{}": {"page": "Project files", "action": "Read a project file"},
    "POST /projects/{}/files/{}": {"page": "Project files", "action": "Write or upload a project file"},
    "GET /projects/{}/locked": {"page": "Project view", "action": "Read the lock state"},
    "POST /projects/{}/lock": {
        "page": "Project view menu / canvas context menu",
        "action": "Lock all (= Project.Modify)",
    },
    "POST /projects/{}/unlock": {
        "page": "Project view menu / canvas context menu",
        "action": "Unlock all (= Project.Modify)",
    },
    "GET /projects/{}/stats": {"page": "Project view", "action": "Project statistics (node/link counts)"},
    "GET /projects/{}/notifications": {"page": "Project view", "action": "Project notifications / events"},
    "WEBSOCKET /projects/{}/notifications/ws": {
        "page": "Project view",
        "action": "Project realtime events (= Project.Audit)",
    },
    "GET /projects/{}/me/privileges": {
        "page": "Project view (global)",
        "action": "Data source for privilege-based rendering inside the project",
    },
    "POST /projects/{}/templates/{}": {
        "page": "Add node palette",
        "action": "Create a node from a template (= Node.Allocate)",
    },

    # ------------------------------------------------------------------
    # Nodes
    # ------------------------------------------------------------------
    "GET /projects/{}/nodes": {"page": "Project view", "action": "Load topology nodes"},
    "POST /projects/{}/nodes": {
        "page": "Add node palette / template drag-and-drop",
        "action": "Create a node (= Node.Allocate)",
    },
    "POST /projects/{}/nodes/batch": {
        "page": "Add node palette",
        "action": "Create several nodes at once (Number of nodes > 1)",
    },
    "GET /projects/{}/nodes/{}": {"page": "Project view / node details", "action": "Read a single node"},
    "PUT /projects/{}/nodes/{}": {
        "page": "Node context menu / properties dialog",
        "action": "Move, rename or reconfigure (= Node.Modify)",
    },
    "DELETE /projects/{}/nodes/{}": {
        "page": "Node context menu / Del key",
        "action": "Delete a node (= Node.Allocate)",
    },
    "POST /projects/{}/nodes/{}/duplicate": {
        "page": "Node context menu",
        "action": "Duplicate (= Node.Allocate)",
    },
    "POST /projects/{}/nodes/{}/start": {"page": "Node context menu / Nodes menu", "action": "Start (= Node.PowerMgmt)"},
    "POST /projects/{}/nodes/{}/stop": {"page": "Node context menu / Nodes menu", "action": "Stop (= Node.PowerMgmt)"},
    "POST /projects/{}/nodes/{}/suspend": {
        "page": "Node context menu / Nodes menu",
        "action": "Suspend (= Node.PowerMgmt)",
    },
    "POST /projects/{}/nodes/{}/reload": {
        "page": "Node context menu / Nodes menu",
        "action": "Reload (= Node.PowerMgmt)",
    },
    "POST /projects/{}/nodes/start": {"page": "Project view menu", "action": "Start all nodes (= Node.PowerMgmt)"},
    "POST /projects/{}/nodes/stop": {"page": "Project view menu", "action": "Stop all nodes (= Node.PowerMgmt)"},
    "POST /projects/{}/nodes/suspend": {"page": "Project view menu", "action": "Suspend all nodes (= Node.PowerMgmt)"},
    "POST /projects/{}/nodes/reload": {"page": "Project view menu", "action": "Reload all nodes (= Node.PowerMgmt)"},
    "POST /projects/{}/nodes/{}/console/reset": {
        "page": "Node context menu",
        "action": "Reset console (= Node.Console)",
    },
    "POST /projects/{}/nodes/console/reset": {
        "page": "Project view menu",
        "action": "Reset all consoles (= Node.Console)",
    },
    "WEBSOCKET /projects/{}/nodes/{}/console/ws": {
        "page": "Console window",
        "action": "Open the node console (= Node.Console)",
    },
    "WEBSOCKET /projects/{}/nodes/{}/console/vnc": {
        "page": "Console window",
        "action": "Open the VNC console (= Node.Console)",
    },
    "POST /projects/{}/nodes/{}/isolate": {"page": "Node context menu", "action": "Isolate (= Link.Modify)"},
    "POST /projects/{}/nodes/{}/unisolate": {
        "page": "Node context menu",
        "action": "Remove isolation (= Link.Modify)",
    },
    "GET /projects/{}/nodes/{}/links": {"page": "Node context menu", "action": "Read the node's links"},
    "GET /projects/{}/nodes/{}/dynamips/auto_idlepc": {
        "page": "Node context menu",
        "action": "Auto Idle-PC (read-only probe)",
    },
    "GET /projects/{}/nodes/{}/dynamips/idlepc_proposals": {
        "page": "Node context menu",
        "action": "Idle-PC candidate values",
    },
    "POST /projects/{}/nodes/{}/qemu/disk_image/{}": {
        "page": "Node context menu",
        "action": "Create a disk image (= Node.Allocate)",
    },
    "PUT /projects/{}/nodes/{}/qemu/disk_image/{}": {
        "page": "Node context menu",
        "action": "Resize a disk image (= Node.Allocate)",
    },
    "DELETE /projects/{}/nodes/{}/qemu/disk_image/{}": {
        "page": "Node context menu",
        "action": "Delete a disk image (= Node.Allocate)",
    },

    # ------------------------------------------------------------------
    # Node file manager
    # ------------------------------------------------------------------
    "GET /projects/{}/nodes/{}/files": {"page": "Node file manager", "action": "Load the file tree"},
    "GET /projects/{}/nodes/{}/files/{}": {
        "page": "Node file manager",
        "action": "Open or read a file (code-gated on Node.Audit)",
    },
    "POST /projects/{}/nodes/{}/files/{}": {
        "page": "Node file manager",
        "action": "Save / Upload (= Node.Modify)",
    },
    "DELETE /projects/{}/nodes/{}/files/{}": {
        "page": "Node file manager",
        "action": "Delete a file (= Node.Modify)",
    },

    # ------------------------------------------------------------------
    # Links
    # ------------------------------------------------------------------
    "GET /projects/{}/links": {"page": "Project view", "action": "Load links"},
    "POST /projects/{}/links": {
        "page": "Project view (canvas link drawing)",
        "action": "Create a link (= Link.Allocate)",
    },
    "POST /projects/{}/links/batch": {
        "page": "Project view (canvas link drawing)",
        "action": "Create several links at once",
    },
    "GET /projects/{}/links/{}": {"page": "Project view / link details", "action": "Read a link"},
    "PUT /projects/{}/links/{}": {
        "page": "Link context menu / link filter",
        "action": "Edit the link, its filters or marker enabled state (= Link.Modify)",
    },
    "DELETE /projects/{}/links/{}": {
        "page": "Link context menu / Del key",
        "action": "Delete a link (= Link.Allocate)",
    },
    "POST /projects/{}/links/{}/reset": {"page": "Link context menu", "action": "Reset (= Link.Modify)"},
    "GET /projects/{}/links/{}/iface": {"page": "Link details", "action": "Read interface information"},
    "GET /projects/{}/links/{}/available_filters": {
        "page": "Link context menu (Filter)",
        "action": "Load the available filters (server is authoritative)",
    },
    "POST /projects/{}/links/{}/capture/start": {
        "page": "Link context menu / capture toolbar",
        "action": "Start capture (= Link.Capture)",
    },
    "POST /projects/{}/links/{}/capture/stop": {
        "page": "Link context menu / capture toolbar",
        "action": "Stop capture (= Link.Capture)",
    },
    "GET /projects/{}/links/{}/capture/file": {
        "page": "Packet capture",
        "action": "Download the pcap file (= Link.Capture)",
    },
    "GET /projects/{}/links/{}/capture/stream": {
        "page": "Packet capture",
        "action": "Stream the pcap data (= Link.Capture)",
    },
    "POST /projects/{}/links/{}/capture/wireshark/restart": {
        "page": "Packet capture",
        "action": "Restart the Wireshark session (= Link.Capture)",
    },
    "WEBSOCKET /projects/{}/links/{}/capture/web-wireshark": {
        "page": "Web Wireshark window",
        "action": "Live packet capture (= Link.Capture)",
    },

    # ------------------------------------------------------------------
    # Markers
    # ------------------------------------------------------------------
    "GET /projects/{}/links/{}/markers": {
        "page": "Marker manager",
        "action": "Read the markers of a single link",
    },
    "POST /projects/{}/links/{}/markers": {
        "page": "Marker manager — Links tab",
        "action": "Add Marker (= Link.Modify)",
    },
    "PUT /projects/{}/links/{}/markers/{}": {
        "page": "Marker manager — Links tab",
        "action": "Enable/disable or Edit (= Link.Modify)",
    },
    "DELETE /projects/{}/links/{}/markers/{}": {
        "page": "Marker manager — Links tab",
        "action": "Delete (= Link.Modify)",
    },
    "GET /projects/{}/marker-definitions": {
        "page": "Marker manager — Definitions tab",
        "action": "Load the definitions",
    },
    "POST /projects/{}/marker-definitions": {
        "page": "Marker manager — Definitions tab",
        "action": "Create a definition (= Project.Modify)",
    },
    "PUT /projects/{}/marker-definitions/{}": {
        "page": "Marker manager — Definitions tab",
        "action": "Edit a definition (= Project.Modify)",
    },
    "DELETE /projects/{}/marker-definitions/{}": {
        "page": "Marker manager — Definitions tab",
        "action": "Delete a definition (= Project.Modify)",
    },
    "POST /projects/{}/marker-definitions/{}/pause": {
        "page": "Marker manager — Definitions tab",
        "action": "Pause (= Project.Modify)",
    },
    "POST /projects/{}/marker-definitions/{}/resume": {
        "page": "Marker manager — Definitions tab",
        "action": "Resume (= Project.Modify)",
    },
    "GET /projects/{}/markers": {
        "page": "Marker manager",
        "action": "Load the aggregate markers when the window opens",
    },
    "GET /projects/{}/markers/tags/{}/replay/range": {
        "page": "Marker replay overlay",
        "action": "Load the replay frame range",
    },
    "GET /projects/{}/markers/tags/{}/replay/frames": {
        "page": "Marker replay overlay",
        "action": "Load the replay frame list",
    },
    "GET /projects/{}/markers/tags/{}/replay/frame/detail": {
        "page": "Marker replay overlay",
        "action": "Load a single frame's detail",
    },
    "WEBSOCKET /projects/{}/notifications/markers/ws": {
        "page": "Marker manager / project view",
        "action": "Realtime marker notifications (= Project.Audit)",
    },

    # ------------------------------------------------------------------
    # Snapshots
    # ------------------------------------------------------------------
    "GET /projects/{}/snapshots": {"page": "Snapshots dialog", "action": "Load the snapshot list"},
    "POST /projects/{}/snapshots": {
        "page": "Snapshots dialog",
        "action": "Create snapshot (= Snapshot.Allocate)",
    },
    "DELETE /projects/{}/snapshots/{}": {
        "page": "Snapshots dialog",
        "action": "Delete snapshot (= Snapshot.Allocate)",
    },
    "POST /projects/{}/snapshots/{}/restore": {
        "page": "Snapshots dialog",
        "action": "Restore snapshot (= Snapshot.Restore)",
    },

    # ------------------------------------------------------------------
    # Drawings
    # ------------------------------------------------------------------
    "GET /projects/{}/drawings": {"page": "Project view", "action": "Load drawing objects"},
    "POST /projects/{}/drawings": {
        "page": "Project view drawing toolbar",
        "action": "Add a shape or text (= Drawing.Allocate)",
    },
    "GET /projects/{}/drawings/{}": {"page": "Project view", "action": "Read a drawing object"},
    "PUT /projects/{}/drawings/{}": {
        "page": "Project view drawing object",
        "action": "Move or edit a drawing (= Drawing.Modify)",
    },
    "DELETE /projects/{}/drawings/{}": {
        "page": "Project view drawing object",
        "action": "Delete a drawing (= Drawing.Allocate)",
    },

    # ------------------------------------------------------------------
    # Symbols
    # ------------------------------------------------------------------
    "GET /symbols": {"page": "Templates page / Add node palette", "action": "Load symbols and icons"},
    "GET /symbols/default_symbols": {"page": "Templates page", "action": "Load the default symbol list"},
    "POST /symbols/{}/raw": {"page": "Template detail page", "action": "Upload a custom symbol (= Symbol.Allocate)"},
    "DELETE /symbols/{}": {"page": "Template detail page", "action": "Delete a symbol (= Symbol.Allocate)"},
    "GET /symbols/{}/dimensions": {
        "page": "Template detail page / Add node palette",
        "action": "Read symbol dimensions",
    },
    "GET /symbols/{}/raw": {
        "page": "Template detail page / Add node palette",
        "action": "Read the symbol image",
    },

    # ------------------------------------------------------------------
    # Templates
    # ------------------------------------------------------------------
    "GET /templates": {
        "page": "Templates page / Add node palette",
        "action": "Load the template list (read-only users only use it through the Add node palette)",
    },
    "POST /templates": {
        "page": "Templates page / install wizard",
        "action": "Create a template, duplicate one, or import an appliance (= Template.Allocate)",
    },
    "GET /templates/{}": {"page": "Template detail page", "action": "Load a single template (route needs Template.Audit)"},
    "PUT /templates/{}": {"page": "Template detail page", "action": "Save the template (= Template.Modify)"},
    "DELETE /templates/{}": {"page": "Templates page", "action": "Delete the template (= Template.Allocate)"},
    "POST /templates/{}/duplicate": {"page": "Templates page", "action": "Duplicate (= Template.Allocate)"},
    "GET /templates/{}/base-configs": {"page": "Template detail page", "action": "List base configs"},
    "GET /templates/{}/base-config/{}": {"page": "Template detail page", "action": "Read a base config"},
    "PUT /templates/{}/base-config/{}": {
        "page": "Template detail page",
        "action": "Save a base config (= Template.Modify)",
    },

    # ------------------------------------------------------------------
    # Appliances (install wizard)
    # ------------------------------------------------------------------
    "GET /appliances": {
        "page": "Install appliance wizard",
        "action": "Load the appliance registry (= Appliance.Audit)",
    },
    "GET /appliances/{}": {"page": "Install appliance wizard", "action": "Read a single appliance"},
    "POST /appliances/{}/install": {
        "page": "Install appliance wizard",
        "action": "Install the selected version (= Appliance.Allocate)",
    },
    "POST /appliances/{}/version": {
        "page": "Install appliance wizard",
        "action": "Add an appliance version (= Appliance.Allocate)",
    },

    # ------------------------------------------------------------------
    # Images
    # ------------------------------------------------------------------
    "GET /images": {
        "page": "Image manager page",
        "action": "Load the image list (page entry needs Image.Audit plus a write privilege)",
    },
    "POST /images/upload/{}": {"page": "Image manager page", "action": "Add Image (= Image.Allocate)"},
    "POST /images/install": {"page": "Image manager page", "action": "Install Images (= Image.Allocate)"},
    "DELETE /images/prune": {"page": "Image manager page", "action": "Prune Images (= Image.Allocate)"},
    "POST /images/sync": {"page": "Image manager page", "action": "Sync Images (= Image.Allocate)"},
    "GET /images/sync/jobs/{}": {"page": "Image manager page", "action": "Poll the sync job progress"},
    "POST /images/compatibility": {
        "page": "Image manager page",
        "action": "Check image checksums (= Image.Allocate)",
    },
    "GET /images/compatibility/catalog": {
        "page": "Image manager page",
        "action": "Load the known image-size catalog (= Image.Allocate)",
    },
    "GET /images/{}": {"page": "Image manager page", "action": "Read a single image"},
    "DELETE /images/{}": {"page": "Image manager page", "action": "Delete Image (= Image.Allocate)"},
    "POST /images/qemu/{}": {"page": "Image manager page", "action": "Create a QEMU disk image (= Image.Allocate)"},

    # ------------------------------------------------------------------
    # Computes
    # ------------------------------------------------------------------
    "GET /computes": {
        "page": "Computes page / Add node palette / Templates page",
        "action": "Load the compute list",
    },
    "GET /computes/{}": {"page": "Computes page", "action": "Read a single compute"},
    "POST /computes": {"page": "Computes page", "action": "Add Compute (= Compute.Allocate)"},
    "PUT /computes/{}": {
        "page": "Computes page",
        "action": "Edit compute / Auto-connect toggle (= Compute.Modify)",
    },
    "DELETE /computes/{}": {"page": "Computes page", "action": "Delete compute (= Compute.Allocate)"},
    "POST /computes/{}/connect": {"page": "Computes page", "action": "Connect (= Compute.Audit)"},
    "POST /computes/{}/disconnect": {"page": "Computes page", "action": "Disconnect (= Compute.Audit)"},
    "GET /computes/{}/docker/images": {
        "page": "Image manager page / install wizard",
        "action": "List Docker images (no privilege gate)",
    },
    "POST /computes/{}/docker/images/pull": {
        "page": "Image manager page",
        "action": "Pull Docker Image (= Compute.Modify)",
    },
    "POST /computes/{}/docker/images/load": {
        "page": "Image manager page",
        "action": "Load a Docker tar (= Compute.Modify)",
    },
    "DELETE /computes/{}/docker/images/{}": {
        "page": "Image manager page",
        "action": "Delete Docker Image (= Compute.Modify)",
    },

    # ------------------------------------------------------------------
    # Server settings
    # ------------------------------------------------------------------
    "GET /settings": {"page": "Server settings page", "action": "Load the server settings"},
    "PUT /settings": {"page": "Server settings page", "action": "Save changes (= Server.Modify)"},

    # ------------------------------------------------------------------
    # Access management: users
    # ------------------------------------------------------------------
    "GET /access/users": {"page": "Management — Users page", "action": "Load the user list"},
    "POST /access/users": {"page": "Management — Users page", "action": "Add user (= User.Allocate)"},
    "GET /access/users/{}": {"page": "Management — Users page / user details dialog", "action": "Read a user"},
    "PUT /access/users/{}": {
        "page": "User details dialog",
        "action": "Save changes / Change Password (= User.Modify)",
    },
    "DELETE /access/users/{}": {
        "page": "Management — Users page",
        "action": "Delete / bulk delete (= User.Allocate)",
    },
    "GET /access/users/{}/groups": {
        "page": "User details dialog",
        "action": "Load the user's groups (the server requires Group.Audit)",
    },

    # ------------------------------------------------------------------
    # Access management: groups
    # ------------------------------------------------------------------
    "GET /access/groups": {"page": "Management — Groups page", "action": "Load the group list"},
    "POST /access/groups": {"page": "Management — Groups page", "action": "Add group (= Group.Allocate)"},
    "GET /access/groups/{}": {"page": "Group details dialog", "action": "Read a group"},
    "PUT /access/groups/{}": {"page": "Group details dialog", "action": "Update Group (= Group.Modify)"},
    "DELETE /access/groups/{}": {
        "page": "Management — Groups page",
        "action": "Delete / bulk delete (= Group.Allocate)",
    },
    "GET /access/groups/{}/members": {"page": "Group details dialog", "action": "Load the member list"},
    "PUT /access/groups/{}/members/{}": {"page": "Group details dialog", "action": "Add user (= Group.Modify)"},
    "DELETE /access/groups/{}/members/{}": {"page": "Group details dialog", "action": "Remove user (= Group.Modify)"},

    # ------------------------------------------------------------------
    # Access management: roles
    # ------------------------------------------------------------------
    "GET /access/roles": {"page": "Management — Roles page", "action": "Load the role list"},
    "POST /access/roles": {"page": "Management — Roles page", "action": "Add role (= Role.Allocate)"},
    "GET /access/roles/{}": {"page": "Role detail page", "action": "Load a role"},
    "PUT /access/roles/{}": {"page": "Role detail page", "action": "Update Role (= Role.Modify)"},
    "DELETE /access/roles/{}": {"page": "Management — Roles page", "action": "Delete roles (= Role.Allocate)"},
    "GET /access/roles/{}/privileges": {"page": "Role detail page", "action": "Load the role's privileges"},
    "PUT /access/roles/{}/privileges/{}": {
        "page": "Role detail page",
        "action": "Grant a privilege (= Role.Modify)",
    },
    "DELETE /access/roles/{}/privileges/{}": {
        "page": "Role detail page",
        "action": "Revoke a privilege (= Role.Modify)",
    },

    # ------------------------------------------------------------------
    # Access management: pools
    # ------------------------------------------------------------------
    "GET /pools": {"page": "Management — Pools page / project dialog", "action": "Load the resource pool list"},
    "POST /pools": {"page": "Management — Pools page", "action": "Add resource pool (= Pool.Allocate)"},
    "GET /pools/{}": {"page": "Resource pool detail page", "action": "Load a resource pool"},
    "PUT /pools/{}": {
        "page": "Resource pool detail page",
        "action": "Update resource pool / Add project (= Pool.Modify)",
    },
    "DELETE /pools/{}": {"page": "Management — Pools page", "action": "Delete selected (= Pool.Allocate)"},
    "GET /pools/{}/resources": {"page": "Resource pool detail page", "action": "Load the pool's resources"},
    "PUT /pools/{}/resources/{}": {
        "page": "Resource pool detail page",
        "action": "Add a project to the pool (= Pool.Modify)",
    },
    "DELETE /pools/{}/resources/{}": {
        "page": "Resource pool detail page",
        "action": "Delete resource (= Pool.Modify)",
    },

    # ------------------------------------------------------------------
    # Access management: ACL
    # ------------------------------------------------------------------
    "GET /access/acl": {"page": "Management — ACL page", "action": "Load the ACE list"},
    "POST /access/acl": {"page": "Management — ACL page", "action": "Add ACE (= ACE.Allocate)"},
    "GET /access/acl/endpoints": {"page": "Management — ACL page", "action": "Load the assignable endpoint catalog"},
    "GET /access/acl/{}": {"page": "Management — ACL page", "action": "Read a single ACE"},
    "PUT /access/acl/{}": {"page": "Management — ACL page", "action": "Edit ACE (= ACE.Modify)"},
    "DELETE /access/acl/{}": {
        "page": "Management — ACL page",
        "action": "Delete ACE / bulk delete (= ACE.Allocate)",
    },

    # ------------------------------------------------------------------
    # LLM model configs (AI profiles)
    # ------------------------------------------------------------------
    "GET /access/users/{}/llm-model-configs": {
        "page": "AI profiles dialog (user)",
        "action": "Load the user's configs (entry = LLMConfig.Modify)",
    },
    "POST /access/users/{}/llm-model-configs": {
        "page": "AI profiles dialog (user)",
        "action": "New profile (= LLMConfig.Modify)",
    },
    "PUT /access/users/{}/llm-model-configs/{}": {
        "page": "AI profiles dialog (user)",
        "action": "Edit profile (= LLMConfig.Modify)",
    },
    "DELETE /access/users/{}/llm-model-configs/{}": {
        "page": "AI profiles dialog (user)",
        "action": "Delete profile (= LLMConfig.Modify)",
    },
    "GET /access/users/{}/llm-model-configs/default": {
        "page": "AI profiles dialog (user)",
        "action": "Read the default profile",
    },
    "PUT /access/users/{}/llm-model-configs/default/{}": {
        "page": "AI profiles dialog (user)",
        "action": "Set as default (= LLMConfig.Modify)",
    },
    "GET /access/users/{}/llm-model-configs/own": {
        "page": "AI profiles dialog (user)",
        "action": "Read own configs",
    },
    "GET /access/groups/{}/llm-model-configs": {
        "page": "AI profiles dialog (group)",
        "action": "Load the group's configs (entry = Group.Modify)",
    },
    "POST /access/groups/{}/llm-model-configs": {
        "page": "AI profiles dialog (group)",
        "action": "New Configuration (= Group.Modify)",
    },
    "PUT /access/groups/{}/llm-model-configs/{}": {
        "page": "AI profiles dialog (group)",
        "action": "Edit (= Group.Modify)",
    },
    "DELETE /access/groups/{}/llm-model-configs/{}": {
        "page": "AI profiles dialog (group)",
        "action": "Delete (= Group.Modify)",
    },
    "GET /access/groups/{}/llm-model-configs/default": {
        "page": "AI profiles dialog (group)",
        "action": "Read the group default profile",
    },
    "PUT /access/groups/{}/llm-model-configs/default/{}": {
        "page": "AI profiles dialog (group)",
        "action": "Set as group default (= Group.Modify)",
    },
}
