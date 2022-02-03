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
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Permission} from "@models/api/permission";
import { Server } from '@models/server';

@Component({
  selector: 'app-editable-permission',
  templateUrl: './editable-permission.component.html',
  styleUrls: ['./editable-permission.component.scss']
})
export class EditablePermissionComponent implements OnInit {

  @Input() permission: Permission;
  @Input() server: Server;
  @Input() side: 'LEFT' | 'RIGHT';
  @Output() click = new EventEmitter();

  constructor() { }

  ngOnInit(): void {}


  onClick() {
    this.click.emit();
  }

  getToolTip() {
    return `
    action: ${this.permission.action}
    methods: ${this.permission.methods.join(',')}
    original path: ${this.permission.path}
    `;
  }
}
