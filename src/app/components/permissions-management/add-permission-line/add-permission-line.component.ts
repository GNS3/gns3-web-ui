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
import {Component, Input, OnInit, Output} from '@angular/core';
import {ProjectService} from "@services/project.service";
import {Server} from "@models/server";
import {ComputeService} from "@services/compute.service";
import EventEmitter from "events";

@Component({
  selector: 'app-add-permission-line',
  templateUrl: './add-permission-line.component.html',
  styleUrls: ['./add-permission-line.component.scss']
})
export class AddPermissionLineComponent implements OnInit {

  objectTypes = ['projects', 'images', 'templates', 'computes']
  elements = [];
  selectedType = 'projects';
  @Input() server: Server;

  @Output() addPermissionEvent = new EventEmitter();

  constructor(private projectService: ProjectService,
              private computeService: ComputeService) { }

  ngOnInit(): void {
    this.projectService.list(this.server)
      .subscribe(elts => {
        this.elements = elts;
      })
  }

  changeType(value) {
    console.log(value);
    this.selectedType = value;
    switch (this.selectedType) {
      case 'projects':
        this.projectService.list(this.server)
          .subscribe(elts => {
            this.elements = elts;
          })
        break;
      case 'computes':
        this.computeService.getComputes(this.server)
          .subscribe(elts => {
            this.elements = elts;
          })
        break;
      default:
        console.log("TODO");
        this.elements = [];

    }
  }

  onSave() {
    this.addPermissionEvent.emit('save');
  }

  onCancel() {
    this.addPermissionEvent.emit('cancel');
  }
}
