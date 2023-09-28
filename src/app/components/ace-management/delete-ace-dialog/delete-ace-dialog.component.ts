/*
* Software Name : GNS3 Web UI
* Version: 3
* SPDX-FileCopyrightText: Copyright (c) 2023 Orange Business Services
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
import {ACE} from "@models/api/ACE";

@Component({
  selector: 'app-delete-ace-dialog',
  templateUrl: './delete-ace-dialog.component.html',
  styleUrls: ['./delete-ace-dialog.component.scss']
})
export class DeleteAceDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<DeleteAceDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { aces: ACE[] }) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDelete() {
    this.dialogRef.close(true);
  }
}
