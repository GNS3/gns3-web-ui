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
import {ApiInformationService, IFormatedList} from "@services/api-information.service";
import {Server} from "@models/server";

@Component({
  selector: 'app-path-auto-complete',
  templateUrl: './path-auto-complete.component.html',
  styleUrls: ['./path-auto-complete.component.scss']
})
export class PathAutoCompleteComponent implements OnInit {


  @Output() update = new EventEmitter<string>();
  @Input() server: Server;
  path: string[] = [];
  values: string[] = [];
  private completeData: IFormatedList[];
  public mode: 'SELECT' | 'COMPLETE' | undefined;
  completeField: string;

  constructor(private apiInformationService: ApiInformationService) {

  }

  updatePath(value: string) {
    this.path.push(value);
    this.update.emit(`/${this.path.join('/')}`);
  }

  popPath() {
    this.path.pop();
    this.update.emit(`/${this.path.join('/')}`);
  }

  ngOnInit(): void {
  }

  getNext() {
    this.apiInformationService
      .getPathNextElement(this.path)
      .subscribe((next: string[]) => {
        this.values = next;
        this.mode = 'SELECT';
      });
  }

  removePrevious() {
    if (this.mode) {
      return this.mode = undefined;
    }
    if (this.path.length > 0) {
      return this.popPath();
    }
  }

  valueChanged(value: string) {
    if (value.match(this.apiInformationService.bracketIdRegex)) {
      this.apiInformationService.getListByObjectId(this.server, value)
        .subscribe((data) => {
          this.mode = 'COMPLETE';
          this.completeData = data;
        });

    } else {
      this.updatePath(value);
      this.mode = undefined;
    }
  }

  validComplete() {
    this.updatePath(this.completeField);
    this.mode = undefined;
  }
}
