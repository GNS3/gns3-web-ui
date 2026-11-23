/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 *
 * Author: Sylvain MATHIEU, Elise LEBEAU
 */
export interface Group {
  name: string;
  created_at: string;
  updated_at: string;
  user_group_id: string;
  is_builtin: boolean;
  // Default node quotas for the group members: null = unlimited (-1 also means unlimited).
  default_max_nodes?: number | null;
  default_max_running_nodes?: number | null;
}
