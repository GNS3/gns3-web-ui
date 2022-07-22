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
import {Controller} from "../../../models/controller";
import {UserService} from "../../../services/user.service";
import {FormControl} from "@angular/forms";
import {timer} from "rxjs";
import {map, switchMap} from "rxjs/operators";

export const userEmailAsyncValidator = (controller: Controller, userService: UserService, except: string = '') => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => userService.list(controller)),
      map((response) => {
        return (response.find((n) => n.email === control.value && control.value !== except) ? { emailExists: true } : null);
      })
    );
  };
};
