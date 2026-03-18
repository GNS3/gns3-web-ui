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
import {Pipe, PipeTransform} from '@angular/core';
import {Group} from "@models/groups/group";
import {MatTableDataSource} from "@angular/material/table";

@Pipe({
  name: 'groupFilter'
})
export class GroupFilterPipe implements PipeTransform {

  transform(groups: MatTableDataSource<Group>, searchText: string): MatTableDataSource<Group> {

    if (!searchText) {
      return groups;
    }

    searchText = searchText.trim().toLowerCase();
    groups.filter = searchText;
    return groups;
  }

}
