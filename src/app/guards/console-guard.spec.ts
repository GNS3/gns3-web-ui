import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConsoleGuard } from './console-guard';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConsoleGuard', () => {
  let guard: ConsoleGuard;
  let mockConsoleService: { openConsoles: number };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockDialogRef: { afterClosed: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(true)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    mockConsoleService = {
      openConsoles: 0,
    };

    TestBed.configureTestingModule({
      providers: [
        ConsoleGuard,
        { provide: NodeConsoleService, useValue: mockConsoleService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });

    guard = TestBed.inject(ConsoleGuard);
  });

  describe('canDeactivate', () => {
    it('should return true when no consoles are open', () => {
      mockConsoleService.openConsoles = 0;

      const result = guard.canDeactivate();

      expect(result).toBe(true);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open a centered confirmation dialog when consoles are open', () => {
      mockConsoleService.openConsoles = 2;

      guard.canDeactivate();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-warning-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Leave project?',
          message: 'Leaving this project will close all open consoles.',
          confirmButtonText: 'Leave project',
          tone: 'warning',
          icon: 'exit_to_app',
        },
      });
    });

    it('should return Observable from afterClosed when consoles are open', () => {
      mockConsoleService.openConsoles = 1;

      const result = guard.canDeactivate();

      expect(result).toBeTruthy();
      expect(mockDialogRef.afterClosed).toHaveBeenCalled();
    });

    it('should pass correct data to the dialog', () => {
      mockConsoleService.openConsoles = 5;

      guard.canDeactivate();

      const openCall = mockDialog.open.mock.calls[0];
      expect(openCall[1].data.message).toBe('Leaving this project will close all open consoles.');
    });
  });
});
