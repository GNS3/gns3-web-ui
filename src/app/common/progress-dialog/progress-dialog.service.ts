import { Injectable } from '@angular/core';
import { ProgressDialogComponent } from './progress-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class ProgressDialogService {
  constructor(private dialog: MatDialog) {}

  public open() {
    const ref = this.dialog.open(ProgressDialogComponent, {
      width: '250px',
      autoFocus: false,
      disableClose: true
    });
    return ref;
  }
}
