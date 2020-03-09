import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ToasterService {
  snackBarConfigForSuccess = {
    duration: 4000,
    panelClass: ['snackabar-success'],
    MatSnackBarHorizontalPosition: 'center',
    MatSnackBarVerticalPosition: 'bottom'
  };

  snackBarConfigForWarning = {
    duration: 4000,
    panelClass: ['snackabar-warning'],
    MatSnackBarHorizontalPosition: 'center',
    MatSnackBarVerticalPosition: 'bottom'
  };

  snackBarConfigForError = {
    duration: 4000,
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

  public warning(message: string) {
    this.zone.run(() => {
      this.snackbar.open(message, 'Close', this.snackBarConfigForWarning);
    });
  }

  public success(message: string) {
    this.zone.run(() => {
      this.snackbar.open(message, 'Close', this.snackBarConfigForSuccess);
    });
  }
}
