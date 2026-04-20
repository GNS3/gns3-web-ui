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
import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, from, throwError, catchError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { Role } from '@models/api/role';
import { ControllerService } from '@services/controller.service';
import { RoleService } from '@services/role.service';

@Injectable({
  providedIn: 'root',
})
export class RoleDetailResolver implements Resolve<Role> {
  constructor(private controllerService: ControllerService, private roleService: RoleService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Role> {
    const controllerId = route.paramMap.get('controller_id');
    const roleId = route.paramMap.get('role_id');

    // Convert Promise to Observable and handle errors
    return from(this.controllerService.get(+controllerId)).pipe(
      // Use switchMap to chain with the role service call
      switchMap((controller: Controller) => {
        return this.roleService.getById(controller, roleId);
      }),
      // Handle any errors from either service
      catchError((error) => {
        // Re-throw the error so the router can handle it
        return throwError(() => error);
      })
    );
  }
}
