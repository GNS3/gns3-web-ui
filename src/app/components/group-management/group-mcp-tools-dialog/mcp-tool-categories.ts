/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 */

/**
 * Category catalog for MCP tools.
 *
 * Tool descriptions come from the server (GET .../mcp_tools returns a
 * "descriptions" object keyed by candidates). This file only groups known
 * tool names into sections for the whitelist dialog; unknown names fall back
 * to the "Other" section with the raw name. Regenerate when the server tool
 * roster changes.
 */

// Insertion order = section order in the whitelist dialog.
export const MCP_TOOL_CATEGORY_ORDER: readonly string[] = [
  'Projects',
  'Distributions',
  'Sharing',
  'Nodes',
  'Node files',
  'Links & traffic insight',
  'Snapshots',
  'Drawings & locking',
  'Templates & appliances',
  'Images',
  'Computes',
  'Devices & skills',
  'Server & account',
  'Other',
];

const TOOL_CATEGORIES: Readonly<Record<string, string>> = {

  "appliance_get": "Templates & appliances",
  "appliance_install": "Templates & appliances",
  "appliance_list": "Templates & appliances",
  "compute_get": "Computes",
  "compute_images": "Computes",
  "compute_list": "Computes",
  "device_config_send": "Devices & skills",
  "device_show_run": "Devices & skills",
  "device_skill_get": "Devices & skills",
  "distribution_delete": "Distributions",
  "distribution_list": "Distributions",
  "drawing_create_ellipse": "Drawings & locking",
  "drawing_create_rectangle": "Drawings & locking",
  "drawing_create_text": "Drawings & locking",
  "drawing_delete": "Drawings & locking",
  "drawing_get": "Drawings & locking",
  "drawing_list": "Drawings & locking",
  "drawing_update": "Drawings & locking",
  "image_delete": "Images",
  "image_get": "Images",
  "image_install": "Images",
  "image_list": "Images",
  "image_prune": "Images",
  "injection_skill_get": "Devices & skills",
  "link_available_filters": "Links & traffic insight",
  "link_capture_download": "Links & traffic insight",
  "link_capture_start": "Links & traffic insight",
  "link_capture_stop": "Links & traffic insight",
  "link_create": "Links & traffic insight",
  "link_delete": "Links & traffic insight",
  "link_get": "Links & traffic insight",
  "link_list": "Links & traffic insight",
  "link_marker": "Links & traffic insight",
  "link_reset": "Links & traffic insight",
  "link_update": "Links & traffic insight",
  "marker_definition": "Links & traffic insight",
  "node_console_exec": "Nodes",
  "node_create": "Nodes",
  "node_delete": "Nodes",
  "node_duplicate": "Nodes",
  "node_file_delete": "Node files",
  "node_file_get": "Node files",
  "node_file_list": "Node files",
  "node_file_write": "Node files",
  "node_get": "Nodes",
  "node_isolate": "Nodes",
  "node_links": "Nodes",
  "node_list": "Nodes",
  "node_start": "Nodes",
  "node_start_all": "Nodes",
  "node_stop": "Nodes",
  "node_stop_all": "Nodes",
  "node_suspend": "Nodes",
  "node_suspend_all": "Nodes",
  "node_unisolate": "Nodes",
  "node_update": "Nodes",
  "project_close": "Projects",
  "project_create": "Projects",
  "project_delete": "Projects",
  "project_distribute": "Distributions",
  "project_distribution_cancel": "Distributions",
  "project_distribution_list": "Distributions",
  "project_duplicate": "Projects",
  "project_get": "Projects",
  "project_list": "Projects",
  "project_lock": "Drawings & locking",
  "project_locked": "Drawings & locking",
  "project_open": "Projects",
  "project_privileges": "Projects",
  "project_readme_get": "Projects",
  "project_readme_update": "Projects",
  "project_share": "Sharing",
  "project_share_delete": "Sharing",
  "project_share_list": "Sharing",
  "project_stats": "Projects",
  "project_unlock": "Drawings & locking",
  "project_update": "Projects",
  "server_statistics": "Server & account",
  "server_version": "Server & account",
  "snapshot_create": "Snapshots",
  "snapshot_delete": "Snapshots",
  "snapshot_list": "Snapshots",
  "snapshot_restore": "Snapshots",
  "template_create": "Templates & appliances",
  "template_delete": "Templates & appliances",
  "template_get": "Templates & appliances",
  "template_list": "Templates & appliances",
  "template_update": "Templates & appliances",
  "user_privileges": "Server & account",
  "user_quotas": "Server & account",
  "vpcs_config_set": "Devices & skills",
};

export function mcpToolCategory(name: string): string {
  return TOOL_CATEGORIES[name] ?? 'Other';
}

// Section icons for the whitelist dialog (all present in the bundled icon font).
export const MCP_TOOL_CATEGORY_ICONS: Readonly<Record<string, string>> = {
  Projects: 'folder',
  Distributions: 'send',
  Sharing: 'people',
  Nodes: 'device_hub',
  'Node files': 'description',
  'Links & traffic insight': 'cable',
  Snapshots: 'history',
  'Drawings & locking': 'draw',
  'Templates & appliances': 'developer_board',
  Images: 'image',
  Computes: 'dns',
  'Devices & skills': 'router',
  'Server & account': 'manage_accounts',
  Other: 'category',
};

export function mcpToolCategoryIcon(category: string): string {
  return MCP_TOOL_CATEGORY_ICONS[category] ?? 'category';
}
