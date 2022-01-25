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
import { Pipe, PipeTransform } from '@angular/core';
import {Permission} from "@models/api/permission";

@Pipe({
  name: 'permissionsTypeFilter'
})
export class PermissionsTypeFilterPipe implements PipeTransform {

  transform(permissions: Permission[], filterTypeText: string): Permission[] {
    if (!permissions) {
      return [];
    }
    if (filterTypeText === undefined || filterTypeText === null || filterTypeText === '') {
      return permissions;
    }

    return permissions.filter((permissions: Permission) => permissions.path.toLowerCase().includes(filterTypeText.toLowerCase()));
  }

}
