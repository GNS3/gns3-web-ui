import { inject, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockedProgressService } from 'app/components/project-map/project-map.component.spec';
import { ProgressDialogService } from './progress-dialog.service';

describe('ProgressDialogService', () => {
  let  mockedProgressService : MockedProgressService
  beforeEach(() => {
    TestBed.configureTestingModule({
      // imports:[ProgressDialogService],
      providers: [
        { provide: MatDialog, useValue: {} },
        { provide: ProgressDialogService, useClass:MockedProgressService },
      ],
    });
  });

  it('should be created', inject([ProgressDialogService], (service: ProgressDialogService) => {
    expect(service).toBeTruthy();
  }));
});
