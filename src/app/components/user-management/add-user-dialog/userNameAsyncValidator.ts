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
import {Server} from "../../../models/server";
import {FormControl} from "@angular/forms";
import {timer} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {UserService} from "../../../services/user.service";

export const userNameAsyncValidator = (server: Server, userService: UserService, except: string = '') => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => userService.list(server)),
      map((response) => {
        return (response.find((n) => n.username === control.value && control.value !== except) ? { userExists: true } : null);
      })
    );
  };
};
