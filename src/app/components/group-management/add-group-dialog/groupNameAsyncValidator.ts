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
import { UntypedFormControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Controller } from "@models/controller";
import { GroupService } from "@services/group.service";

export const groupNameAsyncValidator = (controller: Controller, groupService: GroupService) => {
  return (control: UntypedFormControl) => {
    return timer(500).pipe(
      switchMap(() => groupService.getGroups(controller)),
      map((response) => {
        return (response.find((n) => n.name === control.value) ? { projectExist: true } : null);
      })
    );
  };
};
