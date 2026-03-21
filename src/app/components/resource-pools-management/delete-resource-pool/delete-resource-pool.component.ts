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

import {ChangeDetectionStrategy, Component, Inject, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from '@angular/material/button';
import {ResourcePool} from "@models/resourcePools/ResourcePool";

@Component({
  standalone: true,
  selector: 'app-delete-resource-pool',
  templateUrl: './delete-resource-pool.component.html',
  styleUrls: ['./delete-resource-pool.component.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DeleteResourcePoolComponent implements OnInit {

  private dialogRef = inject(MatDialogRef<DeleteResourcePoolComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { pools: ResourcePool[] }) {}

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDelete() {
    this.dialogRef.close(true);
  }


}
