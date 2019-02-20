import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class ToasterService {
  snackBarConfigForSuccess = {
    duration: 2000,
    panelClass: ['snackabar-success'],
    MatSnackBarHorizontalPosition: 'center',
    MatSnackBarVerticalPosition: 'bottom'
  };
  snackBarConfigForError = {
    duration: 2000,
    panelClass: ['snackabar-error'],
    MatSnackBarHorizontalPosition: 'center',
    MatSnackBarVerticalPosition: 'bottom'
  };
  constructor(
    private snackbar: MatSnackBar,
    private zone: NgZone) {}

  public error(message: string) {
    this.zone.run(() => {
      this.snackbar.open(message, 'Close', this.snackBarConfigForError);
    });
  }

  public success(message: string) {
    this.zone.run(() => {
      this.snackbar.open(message, 'Close', this.snackBarConfigForSuccess);
    });
  }
}
