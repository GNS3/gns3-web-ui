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
import {PermissionActions} from "@models/api/permission";

@Component({
  selector: 'app-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent implements OnInit {

  readonly DENY = 'DENY';
  readonly ALLOW = 'ALLOW';
  @Input() action: PermissionActions;
  @Input() disabled = true;
  @Output() update = new EventEmitter<PermissionActions>();

  constructor() { }

  ngOnInit(): void {
  }

  change() {
    this.action === PermissionActions.DENY ? this.action = PermissionActions.ALLOW : this.action = PermissionActions.DENY;
    this.update.emit(this.action);
  }
}
