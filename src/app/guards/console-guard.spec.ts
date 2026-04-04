import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { of } from 'rxjs';
import { ConsoleGuard } from './console-guard';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ConfirmationBottomSheetComponent } from '@components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConsoleGuard', () => {
  let guard: ConsoleGuard;
  let mockConsoleService: { openConsoles: number };
  let mockBottomSheet: { open: ReturnType<typeof vi.fn> };
  let mockBottomSheetRef: { afterDismissed: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockBottomSheetRef = {
      afterDismissed: vi.fn().mockReturnValue(of(true)),
    };

    mockBottomSheet = {
      open: vi.fn().mockReturnValue(mockBottomSheetRef),
    };

    mockConsoleService = {
      openConsoles: 0,
    };

    TestBed.configureTestingModule({
      providers: [
        ConsoleGuard,
        { provide: NodeConsoleService, useValue: mockConsoleService },
        { provide: MatBottomSheet, useValue: mockBottomSheet },
      ],
    });

    guard = TestBed.inject(ConsoleGuard);
  });

  describe('canDeactivate', () => {
    it('should return true when no consoles are open', () => {
      mockConsoleService.openConsoles = 0;

      const result = guard.canDeactivate();

      expect(result).toBe(true);
      expect(mockBottomSheet.open).not.toHaveBeenCalled();
    });

    it('should open confirmation bottom sheet when consoles are open', () => {
      mockConsoleService.openConsoles = 2;

      guard.canDeactivate();

      expect(mockBottomSheet.open).toHaveBeenCalledWith(
        ConfirmationBottomSheetComponent,
        {
          data: {
            message: 'Exiting the project will close open consoles, do you want to continue?',
          },
          panelClass: 'confirmation-bottom-sheet',
        },
      );
    });

    it('should return Observable from afterDismissed when consoles are open', () => {
      mockConsoleService.openConsoles = 1;

      const result = guard.canDeactivate();

      expect(result).toBeTruthy();
      expect(mockBottomSheetRef.afterDismissed).toHaveBeenCalled();
    });

    it('should pass correct data to bottom sheet', () => {
      mockConsoleService.openConsoles = 5;

      guard.canDeactivate();

      const openCall = mockBottomSheet.open.mock.calls[0];
      expect(openCall[1].data.message).toBe(
        'Exiting the project will close open consoles, do you want to continue?',
      );
    });
  });
});
