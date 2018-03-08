import { TestBed, inject } from '@angular/core/testing';

import { ToasterService } from './toaster.service';
import { MatSnackBar } from '@angular/material';

class MockedSnackBar {
  public open(message: string, ignored: any, options: any) {}
}

describe('ToasterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToasterService, {provide: MatSnackBar, useClass: MockedSnackBar}]
    });
  });

  it('should be created', inject([ToasterService], (service: ToasterService) => {
    expect(service).toBeTruthy();
  }));

  it('should open when success', inject([ToasterService, MatSnackBar], (service: ToasterService, snackBar: MatSnackBar) => {
    const spy = spyOn(snackBar, 'open');
    service.success("message");
    expect(snackBar.open).toHaveBeenCalledWith("message", null, { duration: 2000 });
  }));

  it('should open when error', inject([ToasterService, MatSnackBar], (service: ToasterService, snackBar: MatSnackBar) => {
    const spy = spyOn(snackBar, 'open');
    service.error("message");
    expect(snackBar.open).toHaveBeenCalledWith("message", null, { duration: 2000 });
  }));
});
