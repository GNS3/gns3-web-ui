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
import {User} from "@models/users/user";

@Pipe({
  name: 'membersFilter'
})
export class MembersFilterPipe implements PipeTransform {

  transform(members: User[], filterText: string): User[] {
    if (!members) {
      return [];
    }
    if (filterText === undefined || filterText === '') {
      return members;
    }

    return members.filter((member: User) => member.username.toLowerCase().includes(filterText.toLowerCase()));
  }

}
