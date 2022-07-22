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
import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Controller} from "@models/controller";
import {ControllerService} from "@services/controller.service";

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit {

  controller: Controller;
  links = ['users', 'groups', 'roles', 'permissions'];
  activeLink: string = this.links[0];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private controllerService: ControllerService) { }

  ngOnInit(): void {
    const controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
    });
  }
}
