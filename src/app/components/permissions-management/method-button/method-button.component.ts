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
import {Methods} from "@models/api/permission";

@Component({
  selector: 'app-method-button',
  templateUrl: './method-button.component.html',
  styleUrls: ['./method-button.component.scss']
})
export class MethodButtonComponent implements OnInit {

  @Input() enable = false;
  @Input() name: Methods;
  @Input() disabled = true;

  @Output() update = new EventEmitter<{name: Methods; enable: boolean}>();

  constructor() { }

  ngOnInit(): void {
  }

  change() {
    this.enable = !this.enable;
    this.update.emit({name: this.name, enable: this.enable});
  }
}
