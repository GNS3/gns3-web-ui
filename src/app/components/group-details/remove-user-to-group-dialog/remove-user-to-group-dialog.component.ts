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
import {User} from "@models/users/user";

@Component({
  selector: 'app-remove-user-to-group-dialog',
  templateUrl: './remove-user-to-group-dialog.component.html',
  styleUrls: ['./remove-user-to-group-dialog.component.scss']
})
export class RemoveUserToGroupDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<RemoveUserToGroupDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { user: User }) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    this.dialogRef.close(this.data.user);
  }
}
