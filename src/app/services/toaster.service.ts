import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class ToasterService {
  constructor(private snackbar: MatSnackBar) { }

  public error(message: string) {
    this.snackbar.open(message, null, { duration: 2000 });
  }

  public success(message: string) {
    this.snackbar.open(message, null, { duration: 2000 });
  }
}

