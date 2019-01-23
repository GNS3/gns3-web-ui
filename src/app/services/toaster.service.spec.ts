import { TestBed, inject } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material';

import { ToasterService } from './toaster.service';

export class MockedToasterService {
  public errors: string[];
  public successes: string[];
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

  constructor() {
    this.errors = [];
    this.successes = [];
  }

  public error(message: string) {
    this.errors.push(message);
  }

  public success(message: string) {
    this.successes.push(message);
  }
}

class MockedSnackBar {
  public open(message: string, ignored: any, options: any) {}
}

describe('ToasterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToasterService, { provide: MatSnackBar, useClass: MockedSnackBar }]
    });
  });

  it('should be created', inject([ToasterService], (service: ToasterService) => {
    expect(service).toBeTruthy();
  }));

  it('should open when success', inject(
    [ToasterService, MatSnackBar],
    (service: ToasterService, snackBar: MatSnackBar) => {
      const spy = spyOn(snackBar, 'open');
      service.success('message');
      expect(snackBar.open).toHaveBeenCalledWith('message', 'Close', service.snackBarConfigForSuccess);
    }
  ));

  it('should open when error', inject(
    [ToasterService, MatSnackBar],
    (service: ToasterService, snackBar: MatSnackBar) => {
      const spy = spyOn(snackBar, 'open');
      service.error('message');
      expect(snackBar.open).toHaveBeenCalledWith('message', 'Close', service.snackBarConfigForError);
    }
  ));
});
