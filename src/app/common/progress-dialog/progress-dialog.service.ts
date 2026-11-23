import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProgressDialogComponent, ProgressDialogOptions } from './progress-dialog.component';

@Injectable()
export class ProgressDialogService {
  constructor(private dialog: MatDialog) {}

  public open(options?: ProgressDialogOptions) {
    return this.dialog.open(ProgressDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel'],
      data: options ?? {},
      autoFocus: false,
      // Deliberately closable: the operation runs on the server and cannot be
      // cancelled, so closing the dialog only hides it ("continue in
      // background"), it never aborts anything.
    });
  }
}
