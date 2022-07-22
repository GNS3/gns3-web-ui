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
export enum Methods {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export enum PermissionActions {
  ALLOW = 'ALLOW',
  DENY = 'DENY'
}

export interface Permission {
  methods: Methods[];
  path: string;
  action: PermissionActions;
  description: string;
  created_at?: string;
  updated_at?: string;
  permission_id?: string;
}
