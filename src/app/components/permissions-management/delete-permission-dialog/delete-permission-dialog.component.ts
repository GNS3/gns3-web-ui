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
import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Permission} from "@models/api/permission";

@Component({
  selector: 'app-delete-permission-dialog',
  templateUrl: './delete-permission-dialog.component.html',
  styleUrls: ['./delete-permission-dialog.component.scss']
})
export class DeletePermissionDialogComponent implements OnInit {

  constructor(private dialog: MatDialogRef<DeletePermissionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: Permission) { }

  ngOnInit(): void {
  }

  cancel() {
    this.dialog.close(false);
  }

  confirm() {
    this.dialog.close(true);
  }
}
