import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ProgressDialogComponent } from './progress-dialog.component';

@Injectable()
export class ProgressDialogService {
  constructor(private dialog: MatDialog) {}

  public open() {
    const ref = this.dialog.open(ProgressDialogComponent, {
      width: '250px'
    });
    return ref;
  }
}
