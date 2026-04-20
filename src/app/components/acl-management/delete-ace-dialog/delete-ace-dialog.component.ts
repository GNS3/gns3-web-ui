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

import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ACE } from '@models/api/ACE';

@Component({
  standalone: true,
  selector: 'app-delete-ace-dialog',
  templateUrl: './delete-ace-dialog.component.html',
  styleUrls: ['./delete-ace-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class DeleteAceDialogComponent {
  private dialogRef = inject(MatDialogRef<DeleteAceDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { aces: ACE[] }) {}

  onCancel() {
    this.dialogRef.close();
  }

  onDelete() {
    this.dialogRef.close(true);
  }
}
