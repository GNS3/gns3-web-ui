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
import {ResourcePool} from "@models/resourcePools/ResourcePool";

@Component({
  selector: 'app-delete-resource-pool',
  templateUrl: './delete-resource-pool.component.html',
  styleUrls: ['./delete-resource-pool.component.scss']
})
export class DeleteResourcePoolComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<DeleteResourcePoolComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { pools: ResourcePool[] }) {}

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDelete() {
    this.dialogRef.close(true);
  }


}
