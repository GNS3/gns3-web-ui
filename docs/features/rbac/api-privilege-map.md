# GNS3 Controller API × Privilege × Web UI Map

> **Generated file — do not edit by hand.**
>
> Regenerate with:
>
> ```bash
> python3 scripts/rbac/generate_api_privilege_map.py --server ../gns3-server
> ```

The **Privilege** column is parsed from the server's `has_privilege(...)` / `has_privilege_on_websocket(...)` declarations (route decorator `dependencies` and handler parameter defaults). The **Web UI** columns are maintained in [`scripts/rbac/ui_map.py`](../../../scripts/rbac/ui_map.py); the **Service** column is auto-matched from `HttpController` calls in `src/app`.

All paths are relative to the controller API root (`/v3`).

## Summary

- Controller endpoints: **223** (WebSocket: 6)
- With a privilege declaration: **186**
- Login only (authenticated, no privilege): **30**
- No privilege gate declared: **7** (may still be protected outside the decorator)
- Distinct privilege names: **49**
- Endpoints called by a Web UI service: **168**
- Endpoints with a curated Web UI page/action: **206**

## Endpoints by module

### Controller (version / reload / notification WS) — `controller.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/iou_license` | Server.Audit | — | —<br>no web UI caller | — |
| PUT | `/iou_license` | Server.Modify | — | —<br>no web UI caller | — |
| GET | `/notifications` | — (no gate declared) | Global | Notification stream (SSE)<br>requires Notification.Audit; without it the web UI never connects and polls GET /computes instead | — |
| WEBSOCKET | `/notifications/ws` | — (no gate declared) | Global | Notification stream (WebSocket)<br>requires Notification.Audit; unauthorized sockets are closed with code 1008 and the web UI falls back to polling GET /computes | — |
| POST | `/reload` | Server.Modify | — | —<br>no web UI caller | — |
| POST | `/shutdown` | Server.Modify | — | —<br>no web UI caller | — |
| GET | `/statistics` | Server.Audit | System status page | Load system statistics<br>the page is hidden (sidebar + route) without Server.Audit | `src/app/services/compute.service.ts:getStatistics` |
| GET | `/version` | — (no gate declared) | App shell | Show the controller version | `src/app/services/controller.service.ts:checkControllerVersion`<br>`src/app/services/version.service.ts:get` |
| POST | `/version` | — (no gate declared) | — | — | — |

### Server settings — `settings.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/settings` | Server.Audit | Server settings page | Load the server settings | `src/app/services/server-settings.service.ts:getServerSettings` |
| PUT | `/settings` | Server.Modify | Server settings page | Save changes (= Server.Modify) | `src/app/services/server-settings.service.ts:updateServerSettings` |

### Users (/access/users) — `users.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/users` | User.Audit | Management — Users page | Load the user list | `src/app/services/user.service.ts:list` |
| POST | `/access/users` | User.Allocate | Management — Users page | Add user (= User.Allocate) | `src/app/services/user.service.ts:add` |
| POST | `/access/users/authenticate` | — (no gate declared) | Login page | Sign in with an existing token | `src/app/services/login.service.ts:getLoggedUserRefToken` |
| POST | `/access/users/login` | — (no gate declared) | Login page | Sign in | `src/app/services/login.service.ts:login` |
| POST | `/access/users/logout` | — (login only) | App shell | Sign out | — |
| GET | `/access/users/me` | — (login only) | App shell | Load the signed-in user | `src/app/services/login.service.ts:getLoggedUser`<br>`src/app/services/user.service.ts:getInformationAboutLoggedUser` |
| PUT | `/access/users/me` | — (login only) | Profile / Change password dialog | Edit own profile or password (self-service, no admin privilege) | `src/app/services/user.service.ts:update` |
| GET | `/access/users/me/privileges` | — (login only) | App shell | Data source for privilege-based rendering of the sidebar and pages | `src/app/services/permission.service.ts:fetch` |
| POST | `/access/users/refresh` | — (no gate declared) | Global | Token refresh (automatic in HttpController) | — |
| DELETE | `/access/users/{user_id}` | User.Allocate | Management — Users page | Delete / bulk delete (= User.Allocate) | `src/app/services/user.service.ts:delete` |
| GET | `/access/users/{user_id}` | User.Audit | Management — Users page / user details dialog | Read a user | `src/app/services/user.service.ts:get` |
| PUT | `/access/users/{user_id}` | User.Modify | User details dialog | Save changes / Change Password (= User.Modify) | `src/app/services/user.service.ts:update` |
| GET | `/access/users/{user_id}/groups` | Group.Audit | User details dialog | Load the user's groups (the server requires Group.Audit) | `src/app/services/user.service.ts:getGroupsByUserId` |

### Groups (/access/groups) — `groups.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/groups` | Group.Audit | Management — Groups page | Load the group list | `src/app/services/group.service.ts:getGroups` |
| POST | `/access/groups` | Group.Allocate | Management — Groups page | Add group (= Group.Allocate) | `src/app/services/group.service.ts:addGroup` |
| DELETE | `/access/groups/{user_group_id}` | Group.Allocate | Management — Groups page | Delete / bulk delete (= Group.Allocate) | `src/app/services/group.service.ts:delete` |
| GET | `/access/groups/{user_group_id}` | Group.Audit | Group details dialog | Read a group | `src/app/services/group.service.ts:get` |
| PUT | `/access/groups/{user_group_id}` | Group.Modify | Group details dialog | Update Group (= Group.Modify) | `src/app/services/group.service.ts:update` |
| GET | `/access/groups/{user_group_id}/members` | Group.Audit | Group details dialog | Load the member list | `src/app/services/group.service.ts:getGroupMember` |
| DELETE | `/access/groups/{user_group_id}/members/{user_id}` | Group.Modify | Group details dialog | Remove user (= Group.Modify) | `src/app/services/group.service.ts:removeUser` |
| PUT | `/access/groups/{user_group_id}/members/{user_id}` | Group.Modify | Group details dialog | Add user (= Group.Modify) | `src/app/services/group.service.ts:addMemberToGroup` |

### Roles (/access/roles) — `roles.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/roles` | Role.Audit | Management — Roles page | Load the role list | `src/app/services/role.service.ts:get` |
| POST | `/access/roles` | Role.Allocate | Management — Roles page | Add role (= Role.Allocate) | `src/app/services/role.service.ts:create` |
| DELETE | `/access/roles/{role_id}` | Role.Allocate | Management — Roles page | Delete roles (= Role.Allocate) | `src/app/services/role.service.ts:delete` |
| GET | `/access/roles/{role_id}` | Role.Audit | Role detail page | Load a role | `src/app/services/role.service.ts:getById` |
| PUT | `/access/roles/{role_id}` | Role.Modify | Role detail page | Update Role (= Role.Modify) | `src/app/services/role.service.ts:update` |
| GET | `/access/roles/{role_id}/privileges` | Role.Audit | Role detail page | Load the role's privileges | — |
| DELETE | `/access/roles/{role_id}/privileges/{privilege_id}` | Role.Modify | Role detail page | Revoke a privilege (= Role.Modify) | `src/app/services/role.service.ts:removePrivileges` |
| PUT | `/access/roles/{role_id}/privileges/{privilege_id}` | Role.Modify | Role detail page | Grant a privilege (= Role.Modify) | `src/app/services/role.service.ts:setPrivileges` |

### Privileges (/access/privileges) — `privileges.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/privileges` | — (login only) | Role detail page | Load the assignable privilege catalog | `src/app/services/privilege.service.ts:get` |

### ACL (/access/acl) — `acl.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/acl` | ACE.Audit | Management — ACL page | Load the ACE list | `src/app/services/acl.service.ts:list` |
| POST | `/access/acl` | ACE.Allocate | Management — ACL page | Add ACE (= ACE.Allocate) | `src/app/services/acl.service.ts:add` |
| GET | `/access/acl/endpoints` | ACE.Audit | Management — ACL page | Load the assignable endpoint catalog | `src/app/services/acl.service.ts:getEndpoints` |
| DELETE | `/access/acl/{ace_id}` | ACE.Allocate | Management — ACL page | Delete ACE / bulk delete (= ACE.Allocate) | `src/app/services/acl.service.ts:delete` |
| GET | `/access/acl/{ace_id}` | ACE.Audit | Management — ACL page | Read a single ACE | `src/app/services/acl.service.ts:get` |
| PUT | `/access/acl/{ace_id}` | ACE.Modify | Management — ACL page | Edit ACE (= ACE.Modify) | `src/app/services/acl.service.ts:update` |

### Images — `images.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/images` | Image.Audit | Image manager page | Load the image list (page entry needs Image.Audit plus a write privilege) | `src/app/services/image-manager.service.ts:getImages`<br>`src/app/services/ios.service.ts:getImages`<br>`src/app/services/iou.service.ts:getImages`<br>`src/app/services/qemu.service.ts:getImages` |
| POST | `/images/compatibility` | Image.Allocate | Image manager page | Check image checksums (= Image.Allocate) | `src/app/services/image-manager.service.ts:checkCompatibility` |
| GET | `/images/compatibility/catalog` | Image.Allocate | Image manager page | Load the known image-size catalog (= Image.Allocate) | `src/app/services/image-manager.service.ts:getCompatibilityCatalog` |
| POST | `/images/install` | Image.Allocate | Image manager page | Install Images (= Image.Allocate) | `src/app/services/image-manager.service.ts:installImages` |
| DELETE | `/images/prune` | Image.Allocate | Image manager page | Prune Images (= Image.Allocate) | `src/app/services/image-manager.service.ts:pruneImages` |
| POST | `/images/qemu/{image_path:path}` | Image.Allocate | Image manager page | Create a QEMU disk image (= Image.Allocate) | — |
| POST | `/images/sync` | Image.Allocate | Image manager page | Sync Images (= Image.Allocate) | `src/app/services/image-manager.service.ts:syncImages` |
| GET | `/images/sync/jobs/{job_id}` | Image.Audit | Image manager page | Poll the sync job progress | `src/app/services/image-manager.service.ts:getSyncJob` |
| POST | `/images/upload/{image_path:path}` | Image.Allocate | Image manager page | Add Image (= Image.Allocate) | `src/app/services/image-manager.service.ts:uploadedImage` |
| DELETE | `/images/{image_path:path}` | Image.Allocate | Image manager page | Delete Image (= Image.Allocate) | `src/app/services/image-manager.service.ts:deleteFile` |
| GET | `/images/{image_path:path}` | Image.Audit | Image manager page | Read a single image | — |

### Templates — `templates.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/templates` | Template.Audit | Templates page / Add node palette | Load the template list (read-only users only use it through the Add node palette) | `src/app/services/built-in-templates.service.ts:getTemplates`<br>`src/app/services/docker.service.ts:getTemplates`<br>`src/app/services/ios.service.ts:getTemplates`<br>`src/app/services/iou.service.ts:getTemplates`<br>`src/app/services/qemu.service.ts:getTemplates`<br>`src/app/services/template.service.ts:list`<br>`src/app/services/virtual-box.service.ts:getTemplates`<br>`src/app/services/vmware.service.ts:getTemplates`<br>`src/app/services/vpcs.service.ts:getTemplates` |
| POST | `/templates` | Template.Allocate | Templates page / install wizard | Create a template, duplicate one, or import an appliance (= Template.Allocate) | `src/app/services/built-in-templates.service.ts:addTemplate`<br>`src/app/services/docker.service.ts:addTemplate`<br>`src/app/services/ios.service.ts:addTemplate`<br>`src/app/services/iou.service.ts:addTemplate`<br>`src/app/services/qemu.service.ts:addTemplate`<br>`src/app/services/template.service.ts:switchMap`<br>`src/app/services/virtual-box.service.ts:addTemplate`<br>`src/app/services/vmware.service.ts:addTemplate`<br>`src/app/services/vpcs.service.ts:addTemplate` |
| DELETE | `/templates/{template_id}` | Template.Allocate | Templates page | Delete the template (= Template.Allocate) | — |
| GET | `/templates/{template_id}` | Template.Audit | Template detail page | Load a single template (route needs Template.Audit) | `src/app/services/built-in-templates.service.ts:getTemplate`<br>`src/app/services/docker.service.ts:getTemplate`<br>`src/app/services/ios.service.ts:getTemplate`<br>`src/app/services/iou.service.ts:getTemplate`<br>`src/app/services/qemu.service.ts:getTemplate`<br>`src/app/services/template.service.ts:duplicate`<br>`src/app/services/virtual-box.service.ts:getTemplate`<br>`src/app/services/vmware.service.ts:getTemplate`<br>`src/app/services/vpcs.service.ts:getTemplate` |
| PUT | `/templates/{template_id}` | Template.Modify | Template detail page | Save the template (= Template.Modify) | `src/app/services/built-in-templates.service.ts:saveTemplate`<br>`src/app/services/docker.service.ts:saveTemplate`<br>`src/app/services/ios.service.ts:saveTemplate`<br>`src/app/services/iou.service.ts:saveTemplate`<br>`src/app/services/qemu.service.ts:saveTemplate`<br>`src/app/services/virtual-box.service.ts:saveTemplate`<br>`src/app/services/vmware.service.ts:saveTemplate`<br>`src/app/services/vpcs.service.ts:saveTemplate` |
| GET | `/templates/{template_id}/base-config/{filename}` | Template.Audit | Template detail page | Read a base config | — |
| PUT | `/templates/{template_id}/base-config/{filename}` | Template.Modify | Template detail page | Save a base config (= Template.Modify) | — |
| GET | `/templates/{template_id}/base-configs` | Template.Audit | Template detail page | List base configs | — |
| POST | `/templates/{template_id}/duplicate` | Template.Allocate | Templates page | Duplicate (= Template.Allocate) | — |

### Projects — `projects.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/projects` | — (login only) | Projects page | Load the project list (the server filters by ACE/resource pool) | `src/app/services/project.service.ts:list` |
| POST | `/projects` | Project.Allocate | Projects page | New project (button = Project.Allocate) | `src/app/services/project.service.ts:add` |
| POST | `/projects/load` | Server.Modify | Projects page | Reload the projects on the controller<br>only supported by the local service | — |
| DELETE | `/projects/{project_id}` | Project.Allocate | Projects page | Delete project (button = Project.Allocate) | `src/app/services/project.service.ts:delete` |
| GET | `/projects/{project_id}` | Project.Audit | Project view | Load the project when it is opened | `src/app/services/project.service.ts:get` |
| PUT | `/projects/{project_id}` | Project.Modify | Project view | Save project settings, Map settings PUT items (= Project.Modify) | `src/app/services/project.service.ts:update` |
| POST | `/projects/{project_id}/close` | Project.Allocate | Project view toolbar | Close project (menu = Project.Allocate) | `src/app/services/project.service.ts:close` |
| POST | `/projects/{project_id}/duplicate` | Project.Audit | Projects page | Duplicate project (button = Project.Audit) | `src/app/services/project.service.ts:duplicate` |
| GET | `/projects/{project_id}/export` | Project.Audit | Projects page / Project view menu | Export project (button = Project.Audit) | `src/app/services/project.service.ts:export` |
| GET | `/projects/{project_id}/files/{file_path:path}` | Project.Audit | Project files | Read a project file | — |
| POST | `/projects/{project_id}/files/{file_path:path}` | Project.Modify | Project files | Write or upload a project file | — |
| GET | `/projects/{project_id}/gns3file` | Project.Audit | Topology preview | Read the .gns3 file to render the static preview | `src/app/services/project.service.ts:gns3file` |
| POST | `/projects/{project_id}/import` | — (login only) | Projects page | Import project (button = Project.Allocate) | — |
| POST | `/projects/{project_id}/lock` | Project.Modify | Project view menu / canvas context menu | Lock all (= Project.Modify) | `src/app/services/drawing.service.ts:lockAllNodes` |
| GET | `/projects/{project_id}/locked` | Project.Audit | Project view | Read the lock state | — |
| GET | `/projects/{project_id}/marker-definitions` | Project.Audit | Marker manager — Definitions tab | Load the definitions | `src/app/services/marker.service.ts:listDefinitions` |
| POST | `/projects/{project_id}/marker-definitions` | Project.Modify | Marker manager — Definitions tab | Create a definition (= Project.Modify) | `src/app/services/marker.service.ts:createDefinition` |
| DELETE | `/projects/{project_id}/marker-definitions/{def_name}` | Project.Modify | Marker manager — Definitions tab | Delete a definition (= Project.Modify) | `src/app/services/marker.service.ts:deleteDefinition` |
| PUT | `/projects/{project_id}/marker-definitions/{def_name}` | Project.Modify | Marker manager — Definitions tab | Edit a definition (= Project.Modify) | `src/app/services/marker.service.ts:updateDefinition` |
| POST | `/projects/{project_id}/marker-definitions/{def_name}/pause` | Project.Modify | Marker manager — Definitions tab | Pause (= Project.Modify) | `src/app/services/marker.service.ts:pauseDefinition` |
| POST | `/projects/{project_id}/marker-definitions/{def_name}/resume` | Project.Modify | Marker manager — Definitions tab | Resume (= Project.Modify) | `src/app/services/marker.service.ts:resumeDefinition` |
| GET | `/projects/{project_id}/markers` | Project.Audit | Marker manager | Load the aggregate markers when the window opens | `src/app/services/marker.service.ts:aggregateList` |
| GET | `/projects/{project_id}/markers/tags/{tag}/replay/frame/detail` | Project.Audit | Marker replay overlay | Load a single frame's detail | `src/app/services/marker-replay.service.ts:replayFrameDetail` |
| GET | `/projects/{project_id}/markers/tags/{tag}/replay/frames` | Project.Audit | Marker replay overlay | Load the replay frame list | — |
| GET | `/projects/{project_id}/markers/tags/{tag}/replay/range` | Project.Audit | Marker replay overlay | Load the replay frame range | — |
| GET | `/projects/{project_id}/me/privileges` | Project.Audit | Project view (global) | Data source for privilege-based rendering inside the project | `src/app/services/project-permission.service.ts:load` |
| GET | `/projects/{project_id}/notifications` | Project.Audit | Project view | Project notifications / events | — |
| WEBSOCKET | `/projects/{project_id}/notifications/markers/ws` | Project.Audit | Marker manager / project view | Realtime marker notifications (= Project.Audit) | — |
| WEBSOCKET | `/projects/{project_id}/notifications/ws` | Project.Audit | Project view | Project realtime events (= Project.Audit) | — |
| POST | `/projects/{project_id}/open` | Project.Allocate | Projects page | Open project (button = Project.Allocate) | `src/app/services/project.service.ts:open` |
| GET | `/projects/{project_id}/stats` | Project.Audit | Project view | Project statistics (node/link counts) | `src/app/services/project.service.ts:getStatistics` |
| POST | `/projects/{project_id}/templates/{template_id}` | Node.Allocate | Add node palette | Create a node from a template (= Node.Allocate) | `src/app/services/node.service.ts:createFromTemplate` |
| POST | `/projects/{project_id}/unlock` | Project.Modify | Project view menu / canvas context menu | Unlock all (= Project.Modify) | `src/app/services/drawing.service.ts:unLockAllNodes` |

### Nodes — `nodes.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/projects/{project_id}/nodes` | Node.Audit | Project view | Load topology nodes | `src/app/services/project.service.ts:nodes` |
| POST | `/projects/{project_id}/nodes` | Node.Allocate | Add node palette / template drag-and-drop | Create a node (= Node.Allocate) | — |
| POST | `/projects/{project_id}/nodes/batch` | Node.Allocate | Add node palette | Create several nodes at once (Number of nodes > 1) | — |
| POST | `/projects/{project_id}/nodes/console/reset` | Node.Console | Project view menu | Reset all consoles (= Node.Console) | `src/app/services/node.service.ts:resetAllNodes` |
| POST | `/projects/{project_id}/nodes/reload` | Node.PowerMgmt | Project view menu | Reload all nodes (= Node.PowerMgmt) | `src/app/services/node.service.ts:reloadAll` |
| POST | `/projects/{project_id}/nodes/start` | Node.PowerMgmt | Project view menu | Start all nodes (= Node.PowerMgmt) | `src/app/services/node.service.ts:startAll` |
| POST | `/projects/{project_id}/nodes/stop` | Node.PowerMgmt | Project view menu | Stop all nodes (= Node.PowerMgmt) | `src/app/services/node.service.ts:stopAll` |
| POST | `/projects/{project_id}/nodes/suspend` | Node.PowerMgmt | Project view menu | Suspend all nodes (= Node.PowerMgmt) | `src/app/services/node.service.ts:suspendAll` |
| DELETE | `/projects/{project_id}/nodes/{node_id}` | Node.Allocate | Node context menu / Del key | Delete a node (= Node.Allocate) | `src/app/services/node.service.ts:delete` |
| GET | `/projects/{project_id}/nodes/{node_id}` | Node.Audit | Project view / node details | Read a single node | `src/app/services/node.service.ts:getNodeById`<br>`src/app/services/node.service.ts:getNode` |
| PUT | `/projects/{project_id}/nodes/{node_id}` | Node.Modify | Node context menu / properties dialog | Move, rename or reconfigure (= Node.Modify) | `src/app/services/node.service.ts:updatePosition`<br>`src/app/services/node.service.ts:updateLabel`<br>`src/app/services/node.service.ts:updateSymbol`<br>`src/app/services/node.service.ts:update`<br>`src/app/services/node.service.ts:updateNode` |
| POST | `/projects/{project_id}/nodes/{node_id}/console/reset` | Node.Console | Node context menu | Reset console (= Node.Console) | — |
| WEBSOCKET | `/projects/{project_id}/nodes/{node_id}/console/vnc` | Node.Console | Console window | Open the VNC console (= Node.Console) | — |
| WEBSOCKET | `/projects/{project_id}/nodes/{node_id}/console/ws` | Node.Console | Console window | Open the node console (= Node.Console) | — |
| POST | `/projects/{project_id}/nodes/{node_id}/duplicate` | Node.Allocate | Node context menu | Duplicate (= Node.Allocate) | `src/app/services/node.service.ts:duplicate` |
| GET | `/projects/{project_id}/nodes/{node_id}/dynamips/auto_idlepc` | Node.Audit | Node context menu | Auto Idle-PC (read-only probe) | `src/app/services/node.service.ts:getAutoIdlePC` |
| GET | `/projects/{project_id}/nodes/{node_id}/dynamips/idlepc_proposals` | Node.Audit | Node context menu | Idle-PC candidate values | `src/app/services/node.service.ts:getIdlePCProposals` |
| GET | `/projects/{project_id}/nodes/{node_id}/files` | Node.Audit | Node file manager | Load the file tree | `src/app/services/node.service.ts:getNodeFilesRecursive` |
| DELETE | `/projects/{project_id}/nodes/{node_id}/files/{file_path:path}` | Node.Modify | Node file manager | Delete a file (= Node.Modify) | `src/app/services/node.service.ts:deleteNodeFile` |
| GET | `/projects/{project_id}/nodes/{node_id}/files/{file_path:path}` | Node.Audit | Node file manager | Open or read a file (code-gated on Node.Audit) | `src/app/services/node.service.ts:getNodeFileContent` |
| POST | `/projects/{project_id}/nodes/{node_id}/files/{file_path:path}` | Node.Modify | Node file manager | Save / Upload (= Node.Modify) | `src/app/services/node.service.ts:uploadNodeFile`<br>`src/app/services/node.service.ts:saveNodeFileContent` |
| POST | `/projects/{project_id}/nodes/{node_id}/isolate` | Link.Modify | Node context menu | Isolate (= Link.Modify) | `src/app/services/node.service.ts:isolate` |
| GET | `/projects/{project_id}/nodes/{node_id}/links` | Link.Audit | Node context menu | Read the node's links | — |
| DELETE | `/projects/{project_id}/nodes/{node_id}/qemu/disk_image/{disk_name}` | Node.Allocate | Node context menu | Delete a disk image (= Node.Allocate) | — |
| POST | `/projects/{project_id}/nodes/{node_id}/qemu/disk_image/{disk_name}` | Node.Allocate | Node context menu | Create a disk image (= Node.Allocate) | `src/app/services/qemu.service.ts:createDiskImage` |
| PUT | `/projects/{project_id}/nodes/{node_id}/qemu/disk_image/{disk_name}` | Node.Allocate | Node context menu | Resize a disk image (= Node.Allocate) | — |
| POST | `/projects/{project_id}/nodes/{node_id}/reload` | Node.PowerMgmt | Node context menu / Nodes menu | Reload (= Node.PowerMgmt) | `src/app/services/node.service.ts:reload` |
| POST | `/projects/{project_id}/nodes/{node_id}/start` | Node.PowerMgmt | Node context menu / Nodes menu | Start (= Node.PowerMgmt) | `src/app/services/node.service.ts:start` |
| POST | `/projects/{project_id}/nodes/{node_id}/stop` | Node.PowerMgmt | Node context menu / Nodes menu | Stop (= Node.PowerMgmt) | `src/app/services/node.service.ts:stop` |
| POST | `/projects/{project_id}/nodes/{node_id}/suspend` | Node.PowerMgmt | Node context menu / Nodes menu | Suspend (= Node.PowerMgmt) | `src/app/services/node.service.ts:suspend` |
| POST | `/projects/{project_id}/nodes/{node_id}/unisolate` | Link.Modify | Node context menu | Remove isolation (= Link.Modify) | `src/app/services/node.service.ts:unisolate` |

### Links — `links.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/projects/{project_id}/links` | Link.Audit | Project view | Load links | `src/app/services/project.service.ts:links` |
| POST | `/projects/{project_id}/links` | Link.Allocate | Project view (canvas link drawing) | Create a link (= Link.Allocate) | `src/app/services/link.service.ts` |
| POST | `/projects/{project_id}/links/batch` | Link.Allocate | Project view (canvas link drawing) | Create several links at once | — |
| DELETE | `/projects/{project_id}/links/{link_id}` | Link.Allocate | Link context menu / Del key | Delete a link (= Link.Allocate) | `src/app/services/link.service.ts:deleteLink` |
| GET | `/projects/{project_id}/links/{link_id}` | Link.Audit | Project view / link details | Read a link | `src/app/services/link.service.ts:getLink` |
| PUT | `/projects/{project_id}/links/{link_id}` | Link.Modify | Link context menu / link filter | Edit the link, its filters or marker enabled state (= Link.Modify) | `src/app/services/link.service.ts:updateLink`<br>`src/app/services/link.service.ts:updateLinkStyle`<br>`src/app/services/link.service.ts:updateNodes` |
| GET | `/projects/{project_id}/links/{link_id}/available_filters` | Link.Audit | Link context menu (Filter) | Load the available filters (server is authoritative) | `src/app/services/link.service.ts:getAvailableFilters` |
| GET | `/projects/{project_id}/links/{link_id}/capture/file` | Link.Capture | Packet capture | Download the pcap file (= Link.Capture) | — |
| POST | `/projects/{project_id}/links/{link_id}/capture/start` | Link.Capture | Link context menu / capture toolbar | Start capture (= Link.Capture) | `src/app/services/link.service.ts:startCaptureOnLink` |
| POST | `/projects/{project_id}/links/{link_id}/capture/stop` | Link.Capture | Link context menu / capture toolbar | Stop capture (= Link.Capture) | `src/app/services/link.service.ts:stopCaptureOnLink` |
| GET | `/projects/{project_id}/links/{link_id}/capture/stream` | Link.Capture | Packet capture | Stream the pcap data (= Link.Capture) | `src/app/services/link.service.ts:streamPcap` |
| WEBSOCKET | `/projects/{project_id}/links/{link_id}/capture/web-wireshark` | Link.Capture | Web Wireshark window | Live packet capture (= Link.Capture) | — |
| POST | `/projects/{project_id}/links/{link_id}/capture/wireshark/restart` | Link.Capture | Packet capture | Restart the Wireshark session (= Link.Capture) | — |
| GET | `/projects/{project_id}/links/{link_id}/iface` | Link.Audit | Link details | Read interface information | — |
| GET | `/projects/{project_id}/links/{link_id}/markers` | Link.Audit | Marker manager | Read the markers of a single link | `src/app/services/marker.service.ts:list` |
| POST | `/projects/{project_id}/links/{link_id}/markers` | Link.Modify | Marker manager — Links tab | Add Marker (= Link.Modify) | `src/app/services/marker.service.ts:create` |
| DELETE | `/projects/{project_id}/links/{link_id}/markers/{marker_name}` | Link.Modify | Marker manager — Links tab | Delete (= Link.Modify) | `src/app/services/marker.service.ts:delete` |
| PUT | `/projects/{project_id}/links/{link_id}/markers/{marker_name}` | Link.Modify | Marker manager — Links tab | Enable/disable or Edit (= Link.Modify) | `src/app/services/marker.service.ts:update`<br>`src/app/services/marker.service.ts:setEnabled` |
| POST | `/projects/{project_id}/links/{link_id}/reset` | Link.Modify | Link context menu | Reset (= Link.Modify) | `src/app/services/link.service.ts:resetLink` |

### Drawings — `drawings.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/projects/{project_id}/drawings` | Drawing.Audit | Project view | Load drawing objects | `src/app/services/project.service.ts:drawings` |
| POST | `/projects/{project_id}/drawings` | Drawing.Allocate | Project view drawing toolbar | Add a shape or text (= Drawing.Allocate) | `src/app/services/drawing.service.ts:add`<br>`src/app/services/drawing.service.ts:duplicate` |
| DELETE | `/projects/{project_id}/drawings/{drawing_id}` | Drawing.Allocate | Project view drawing object | Delete a drawing (= Drawing.Allocate) | `src/app/services/drawing.service.ts:delete` |
| GET | `/projects/{project_id}/drawings/{drawing_id}` | Drawing.Audit | Project view | Read a drawing object | — |
| PUT | `/projects/{project_id}/drawings/{drawing_id}` | Drawing.Modify | Project view drawing object | Move or edit a drawing (= Drawing.Modify) | `src/app/services/drawing.service.ts:updatePosition`<br>`src/app/services/drawing.service.ts:updateSizeAndPosition`<br>`src/app/services/drawing.service.ts:updateText`<br>`src/app/services/drawing.service.ts:update` |

### Symbols — `symbols.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/symbols` | Symbol.Audit | Templates page / Add node palette | Load symbols and icons | `src/app/services/symbol.service.ts:load` |
| GET | `/symbols/default_symbols` | Symbol.Audit | Templates page | Load the default symbol list | — |
| DELETE | `/symbols/{symbol_id:path}` | Symbol.Allocate | Template detail page | Delete a symbol (= Symbol.Allocate) | `src/app/services/symbol.service.ts:delete` |
| GET | `/symbols/{symbol_id:path}/dimensions` | Symbol.Audit | Template detail page / Add node palette | Read symbol dimensions | `src/app/services/symbol.service.ts:getDimensions` |
| GET | `/symbols/{symbol_id:path}/raw` | Symbol.Audit | Template detail page / Add node palette | Read the symbol image | — |
| POST | `/symbols/{symbol_id:path}/raw` | Symbol.Allocate | Template detail page | Upload a custom symbol (= Symbol.Allocate) | `src/app/services/symbol.service.ts:add` |

### Snapshots — `snapshots.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/projects/{project_id}/snapshots` | Snapshot.Audit | Snapshots dialog | Load the snapshot list | `src/app/services/snapshot.service.ts:list` |
| POST | `/projects/{project_id}/snapshots` | Snapshot.Allocate | Snapshots dialog | Create snapshot (= Snapshot.Allocate) | `src/app/services/snapshot.service.ts:create` |
| DELETE | `/projects/{project_id}/snapshots/{snapshot_id}` | Snapshot.Allocate | Snapshots dialog | Delete snapshot (= Snapshot.Allocate) | `src/app/services/snapshot.service.ts:delete` |
| POST | `/projects/{project_id}/snapshots/{snapshot_id}/restore` | Snapshot.Restore | Snapshots dialog | Restore snapshot (= Snapshot.Restore) | `src/app/services/snapshot.service.ts:restore` |

### Computes — `computes.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/computes` | Compute.Audit | Computes page / Add node palette / Templates page | Load the compute list | `src/app/services/compute.service.ts:getComputes` |
| POST | `/computes` | Compute.Allocate | Computes page | Add Compute (= Compute.Allocate) | `src/app/services/compute.service.ts:createCompute` |
| DELETE | `/computes/{compute_id}` | Compute.Allocate | Computes page | Delete compute (= Compute.Allocate) | `src/app/services/compute.service.ts:deleteCompute` |
| GET | `/computes/{compute_id}` | Compute.Audit | Computes page | Read a single compute | `src/app/services/compute.service.ts:getCompute` |
| PUT | `/computes/{compute_id}` | Compute.Modify | Computes page | Edit compute / Auto-connect toggle (= Compute.Modify) | `src/app/services/compute.service.ts:updateCompute` |
| POST | `/computes/{compute_id}/connect` | Compute.Modify | Computes page | Connect (= Compute.Modify) | `src/app/services/compute.service.ts:connectCompute` |
| POST | `/computes/{compute_id}/disconnect` | Compute.Modify | Computes page | Disconnect (= Compute.Modify) | — |
| GET | `/computes/{compute_id}/docker/images` | — (login only) | Image manager page / install wizard | List Docker images (no privilege gate) | `src/app/services/docker.service.ts:getImages`<br>`src/app/services/docker.service.ts:getImagesForCompute` |
| POST | `/computes/{compute_id}/docker/images/load` | Compute.Modify | Image manager page | Load a Docker tar (= Compute.Modify) | — |
| POST | `/computes/{compute_id}/docker/images/pull` | Compute.Modify | Image manager page | Pull Docker Image (= Compute.Modify) | — |
| DELETE | `/computes/{compute_id}/docker/images/{image:path}` | Compute.Modify | Image manager page | Delete Docker Image (= Compute.Modify) | `src/app/services/docker.service.ts:deleteImage` |
| POST | `/computes/{compute_id}/dynamips/auto_idlepc` | — (login only) | — | (to be filled) | `src/app/services/ios.service.ts:findIdlePC` |
| GET | `/computes/{compute_id}/virtualbox/vms` | — (login only) | — | (to be filled) | `src/app/services/virtual-box.service.ts:getVirtualMachines` |
| GET | `/computes/{compute_id}/vmware/vms` | — (login only) | — | (to be filled) | `src/app/services/vmware.service.ts:getVirtualMachines` |
| GET | `/computes/{compute_id}/{emulator}/{endpoint_path:path}` | — (login only) | — | — | — |
| POST | `/computes/{compute_id}/{emulator}/{endpoint_path:path}` | — (login only) | — | — | — |
| PUT | `/computes/{compute_id}/{emulator}/{endpoint_path:path}` | — (login only) | — | — | — |

### Appliances — `appliances.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/appliances` | Appliance.Audit | Install appliance wizard | Load the appliance registry (= Appliance.Audit) | `src/app/services/appliances.service.ts:return` |
| GET | `/appliances/{appliance_id}` | Appliance.Audit | Install appliance wizard | Read a single appliance | — |
| POST | `/appliances/{appliance_id}/install` | Appliance.Allocate | Install appliance wizard | Install the selected version (= Appliance.Allocate) | — |
| POST | `/appliances/{appliance_id}/version` | Appliance.Allocate | Install appliance wizard | Add an appliance version (= Appliance.Allocate) | — |

### Netmiko — `netmiko.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/netmiko/device_types` | — (login only) | — | (to be filled) | `src/app/services/netmiko-device-types.service.ts:getDeviceTypes` |

### Pools — `pools.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/pools` | Pool.Audit | Management — Pools page / project dialog | Load the resource pool list | `src/app/services/resource-pools.service.ts:getAll` |
| POST | `/pools` | Pool.Allocate | Management — Pools page | Add resource pool (= Pool.Allocate) | `src/app/services/resource-pools.service.ts:add` |
| DELETE | `/pools/{resource_pool_id}` | Pool.Allocate | Management — Pools page | Delete selected (= Pool.Allocate) | `src/app/services/resource-pools.service.ts:delete` |
| GET | `/pools/{resource_pool_id}` | Pool.Audit | Resource pool detail page | Load a resource pool | `src/app/services/resource-pools.service.ts:get` |
| PUT | `/pools/{resource_pool_id}` | Pool.Modify | Resource pool detail page | Update resource pool / Add project (= Pool.Modify) | `src/app/services/resource-pools.service.ts:update` |
| GET | `/pools/{resource_pool_id}/resources` | Pool.Audit | Resource pool detail page | Load the pool's resources | `src/app/services/resource-pools.service.ts:get`<br>`src/app/services/resource-pools.service.ts:switchMap` |
| DELETE | `/pools/{resource_pool_id}/resources/{resource_id}` | Pool.Modify | Resource pool detail page | Delete resource (= Pool.Modify) | `src/app/services/resource-pools.service.ts:deleteResource` |
| PUT | `/pools/{resource_pool_id}/resources/{resource_id}` | Pool.Modify | Resource pool detail page | Add a project to the pool (= Pool.Modify) | `src/app/services/resource-pools.service.ts:addResource` |

### LLM model configs (/access/.../llm-model-configs) — `llm_model_configs.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/groups/{group_id}/llm-model-configs` | Group.Audit | AI profiles dialog (group) | Load the group's configs (entry = Group.Modify) | `src/app/services/ai-profiles.service.ts:getGroupConfigs` |
| POST | `/access/groups/{group_id}/llm-model-configs` | Group.Modify | AI profiles dialog (group) | New Configuration (= Group.Modify) | `src/app/services/ai-profiles.service.ts:createGroupConfig` |
| GET | `/access/groups/{group_id}/llm-model-configs/default` | Group.Audit | AI profiles dialog (group) | Read the group default profile | `src/app/services/ai-profiles.service.ts:getDefaultGroupConfig` |
| PUT | `/access/groups/{group_id}/llm-model-configs/default/{config_id}` | Group.Modify | AI profiles dialog (group) | Set as group default (= Group.Modify) | `src/app/services/ai-profiles.service.ts:setDefaultGroupConfig` |
| DELETE | `/access/groups/{group_id}/llm-model-configs/{config_id}` | Group.Modify | AI profiles dialog (group) | Delete (= Group.Modify) | `src/app/services/ai-profiles.service.ts:deleteGroupConfig` |
| PUT | `/access/groups/{group_id}/llm-model-configs/{config_id}` | Group.Modify | AI profiles dialog (group) | Edit (= Group.Modify) | `src/app/services/ai-profiles.service.ts:updateGroupConfig`<br>`src/app/services/ai-profiles.service.ts:unsetDefaultGroupConfig` |
| GET | `/access/users/{user_id}/llm-model-configs` | LLMConfig.Audit | AI profiles dialog (user) | Load the user's configs (entry = LLMConfig.Modify) | `src/app/services/ai-profiles.service.ts:getConfigs` |
| POST | `/access/users/{user_id}/llm-model-configs` | LLMConfig.Modify | AI profiles dialog (user) | New profile (= LLMConfig.Modify) | `src/app/services/ai-profiles.service.ts:createConfig` |
| GET | `/access/users/{user_id}/llm-model-configs/default` | LLMConfig.Audit | AI profiles dialog (user) | Read the default profile | `src/app/services/ai-profiles.service.ts:getDefaultConfig` |
| PUT | `/access/users/{user_id}/llm-model-configs/default/{config_id}` | LLMConfig.Modify | AI profiles dialog (user) | Set as default (= LLMConfig.Modify) | `src/app/services/ai-profiles.service.ts:setDefaultConfig` |
| GET | `/access/users/{user_id}/llm-model-configs/own` | LLMConfig.Audit | AI profiles dialog (user) | Read own configs | `src/app/services/ai-profiles.service.ts:getOwnConfigs` |
| DELETE | `/access/users/{user_id}/llm-model-configs/{config_id}` | LLMConfig.Modify | AI profiles dialog (user) | Delete profile (= LLMConfig.Modify) | `src/app/services/ai-profiles.service.ts:deleteConfig` |
| PUT | `/access/users/{user_id}/llm-model-configs/{config_id}` | LLMConfig.Modify | AI profiles dialog (user) | Edit profile (= LLMConfig.Modify) | `src/app/services/ai-profiles.service.ts:updateConfig`<br>`src/app/services/ai-profiles.service.ts:unsetDefaultConfig` |

### Copilot — `copilot.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| POST | `/copilot/reload/skills` | — (login only) | Web settings → AI | Reload skills (superadmin only, hidden otherwise)<br>gate is is_superadmin in the handler, not a named privilege | `src/app/services/ai-chat.service.ts:reloadSkills` |

### Copilot chat — `chat.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| POST | `/copilot/projects/{project_id}/chat/inject` | — (login only) | Project view → AI chat | Inject an issue into the copilot<br>gate is Project.Audit in the handler, not a route dependency | — |
| GET | `/copilot/projects/{project_id}/chat/sessions` | — (login only) | Project view → AI chat | List chat sessions<br>gate is Project.Audit in the handler, not a route dependency | `src/app/services/ai-chat.service.ts:getSessions` |
| DELETE | `/copilot/projects/{project_id}/chat/sessions/{session_id}` | — (login only) | Project view → AI chat | Delete a chat session<br>gate is Project.Audit in the handler, not a route dependency | `src/app/services/ai-chat.service.ts:deleteSession` |
| PATCH | `/copilot/projects/{project_id}/chat/sessions/{session_id}` | — (login only) | Project view → AI chat | Rename a chat session<br>gate is Project.Audit in the handler, not a route dependency | — |
| POST | `/copilot/projects/{project_id}/chat/sessions/{session_id}/abort` | — (login only) | Project view → AI chat | Abort a running chat<br>gate is Project.Audit in the handler, not a route dependency | `src/app/services/ai-chat.service.ts:abortChat` |
| GET | `/copilot/projects/{project_id}/chat/sessions/{session_id}/history` | — (login only) | Project view → AI chat | Load session history<br>gate is Project.Audit in the handler, not a route dependency | `src/app/services/ai-chat.service.ts:getSessionHistory` |
| DELETE | `/copilot/projects/{project_id}/chat/sessions/{session_id}/pin` | — (login only) | Project view → AI chat | Unpin a chat session<br>gate is Project.Audit in the handler, not a route dependency | `src/app/services/ai-chat.service.ts:unpinSession` |
| PUT | `/copilot/projects/{project_id}/chat/sessions/{session_id}/pin` | — (login only) | Project view → AI chat | Pin a chat session<br>gate is Project.Audit in the handler, not a route dependency | `src/app/services/ai-chat.service.ts:pinSession` |
| POST | `/copilot/projects/{project_id}/chat/stream` | — (login only) | Project view → AI chat | Chat with the AI copilot<br>gate is Project.Audit in the handler, not a route dependency | — |

### API keys — `api_keys.py`

| Method | Path | Privilege | Web UI page | Web UI action | Service |
|--------|------|-----------|-------------|---------------|---------|
| GET | `/access/api-keys` | — (login only) | — | (to be filled) | `src/app/services/api-key.service.ts:list` |
| POST | `/access/api-keys` | — (login only) | — | (to be filled) | `src/app/services/api-key.service.ts:create` |
| DELETE | `/access/api-keys/{api_key_id}` | — (login only) | — | (to be filled) | `src/app/services/api-key.service.ts:delete` |
| POST | `/access/api-keys/{api_key_id}/restore` | — (login only) | — | (to be filled) | `src/app/services/api-key.service.ts:restore` |
| POST | `/access/api-keys/{api_key_id}/revoke` | — (login only) | — | (to be filled) | `src/app/services/api-key.service.ts:revoke` |
