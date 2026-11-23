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
 * Response of GET/PUT /access/groups/{group_id}/mcp_tools.
 *
 * - candidates: every MCP tool visible under the group's flat permissions
 *   (server-computed; the sole source for the checkbox list).
 * - tools: the stored whitelist. null = never configured (group unrestricted,
 *   permission gating only), [] = explicitly deny all tools. May contain
 *   names outside candidates (stale entries after a permission change) —
 *   PUT rejects them with 400, so the UI always submits the intersection.
 */
export interface GroupMcpToolsResponse {
  candidates: string[];
  tools: string[] | null;
  /**
   * True when the whitelist cannot affect anyone right now: the group has no
   * non-superadmin member (empty group or superadmin-only group).
   */
  bypass: boolean;
  /** Tool descriptions keyed by candidates (docstrings from the server; may be empty strings). */
  descriptions: Record<string, string>;
}
