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
import {UserDataSource} from "@components/user-management/user-management.component";

@Pipe({
  name: 'userFilter'
})
export class UserFilterPipe implements PipeTransform {

  transform(items: UserDataSource, searchText: string) {
    if (!items) return [];
    if (!searchText) return items;
    searchText = searchText.toLowerCase();
    return items.userDatabase.data.filter((item) => {
      return (item.username && item.username.toLowerCase().includes(searchText))
        || (item.full_name && item.full_name.toLowerCase().includes(searchText))
        || (item.email && item.email.toLowerCase().includes(searchText));
    });
  }

}
