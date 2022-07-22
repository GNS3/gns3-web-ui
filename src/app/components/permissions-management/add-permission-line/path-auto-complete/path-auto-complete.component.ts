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
import {ApiInformationService} from "@services/ApiInformation/api-information.service";
import {Controller} from "@models/controller";
import {PermissionPath} from "@components/permissions-management/add-permission-line/path-auto-complete/PermissionPath";
import {SubPath} from "@components/permissions-management/add-permission-line/path-auto-complete/SubPath";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

@Component({
  selector: 'app-path-auto-complete',
  templateUrl: './path-auto-complete.component.html',
  styleUrls: ['./path-auto-complete.component.scss']
})
export class PathAutoCompleteComponent implements OnInit {


  @Output() update = new EventEmitter<string>();
  @Input() controller: Controller;
  path: PermissionPath = new PermissionPath();
  values: string[] = [];
  private completeData: { data: IGenericApiObject[]; key: string };
  public mode: 'SELECT' | 'COMPLETE' | undefined;
  completeField: string;

  constructor(private apiInformationService: ApiInformationService) {

  }

  updatePath(name: string, value: string, key?: string) {
    this.path.add(new SubPath(name, value, key));
    this.update.emit('/' + this.path.getPath().join("/"));
  }

  popPath() {
    this.path.removeLast();
    this.update.emit('/' + this.path.getPath().join("/"));
  }

  ngOnInit(): void {
  }

  getNext() {
    this.apiInformationService
      .getPathNextElement(this.path.getPath())
      .subscribe((next: string[]) => {
        if (this.path.containStar()) {
          next = next.filter(item => !item.match(this.apiInformationService.bracketIdRegex));
        }
        this.values = next;
        this.mode = 'SELECT';
      });
  }

  removePrevious() {
    if (this.mode) {
      return this.mode = undefined;
    }
    if (!this.path.isEmpty()) {
      return this.popPath();
    }
  }

  valueChanged(value: string) {
    if (value.match(this.apiInformationService.bracketIdRegex) && !this.path.containStar()) {
      this.apiInformationService.getListByObjectId(this.controller, value, undefined, this.path.getVariables())
        .subscribe((data) => {
          this.mode = 'COMPLETE';
          this.completeData = {data, key: value};
        });

    } else {
      this.updatePath(value, value);
      this.mode = undefined;
    }
  }

  validComplete() {
    if (this.completeField === '*') {
      this.updatePath('*', '*');
    } else {
      const data = this.completeData.data.find((d) => this.completeField === d.name);
      this.updatePath(data.id, data.name, this.completeData.key);
    }
    this.mode = undefined;
    this.completeField = undefined;
  }
}
