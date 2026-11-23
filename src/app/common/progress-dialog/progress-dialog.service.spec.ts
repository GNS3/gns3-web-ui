import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ProgressDialogService } from './progress-dialog.service';
import { ProgressDialogComponent } from './progress-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProgressDialogService', () => {
  let service: ProgressDialogService;
  let mockDialog: any;

  beforeEach(() => {
    mockDialog = {
      open: vi.fn().mockReturnValue({ close: vi.fn() }),
    };

    TestBed.configureTestingModule({
      providers: [ProgressDialogService, { provide: MatDialog, useValue: mockDialog }],
    });

    service = TestBed.inject(ProgressDialogService);
  });

  it('should open the progress dialog with the given options as data', () => {
    service.open({ title: 'Creating snapshot', message: 'Saving the project state.' });

    expect(mockDialog.open).toHaveBeenCalledWith(
      ProgressDialogComponent,
      expect.objectContaining({
        data: { title: 'Creating snapshot', message: 'Saving the project state.' },
      })
    );
  });

  it('should pass empty data when opened without options', () => {
    service.open();

    expect(mockDialog.open).toHaveBeenCalledWith(
      ProgressDialogComponent,
      expect.objectContaining({ data: {} })
    );
  });

  it('should use the standard small dialog panel without stealing focus', () => {
    service.open();

    expect(mockDialog.open).toHaveBeenCalledWith(
      ProgressDialogComponent,
      expect.objectContaining({
        panelClass: ['base-dialog-panel', 'dialog-small-panel'],
        autoFocus: false,
      })
    );
  });

  it('should keep the dialog closable so dismissing only hides the wait', () => {
    service.open();

    const config = mockDialog.open.mock.calls[0][1];
    expect(config.disableClose).toBeFalsy();
  });
});
