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
import { Component, OnInit, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from "@angular/router";
import {MatTabsModule} from '@angular/material/tabs';
import {Controller} from "@models/controller";
import {ControllerService} from "@services/controller.service";

@Component({
  standalone: true,
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss'],
  imports: [CommonModule, RouterModule, MatTabsModule]
})
export class ManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private controllerService = inject(ControllerService);

  controller: Controller;
  links = ['users', 'groups', 'roles', 'pools', 'ACL'];

  constructor() { }

  ngOnInit(): void {
    const controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
    });
  }
}
