import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToasterService } from './toaster.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ToasterService', () => {
  let service: ToasterService;
  let mockMatSnackBar: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock MatSnackBar
    mockMatSnackBar = {
      open: vi.fn(),
    };

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    service = new ToasterService(mockMatSnackBar);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should have success config defined', () => {
      expect(service.snackBarConfigForSuccess).toBeDefined();
      expect(service.snackBarConfigForSuccess.duration).toBe(4000);
      expect(service.snackBarConfigForSuccess.panelClass).toEqual(['snackabar-success']);
      expect(service.snackBarConfigForSuccess.MatSnackBarHorizontalPosition).toBe('center');
      expect(service.snackBarConfigForSuccess.MatSnackBarVerticalPosition).toBe('bottom');
    });

    it('should have warning config defined', () => {
      expect(service.snackBarConfigForWarning).toBeDefined();
      expect(service.snackBarConfigForWarning.duration).toBe(4000);
      expect(service.snackBarConfigForWarning.panelClass).toEqual(['snackabar-warning']);
      expect(service.snackBarConfigForWarning.MatSnackBarHorizontalPosition).toBe('center');
      expect(service.snackBarConfigForWarning.MatSnackBarVerticalPosition).toBe('bottom');
    });

    it('should have error config defined', () => {
      expect(service.snackBarConfigForError).toBeDefined();
      expect(service.snackBarConfigForError.duration).toBe(10000);
      expect(service.snackBarConfigForError.panelClass).toEqual(['snackabar-error']);
      expect(service.snackBarConfigForError.MatSnackBarHorizontalPosition).toBe('center');
      expect(service.snackBarConfigForError.MatSnackBarVerticalPosition).toBe('bottom');
    });
  });

  describe('success', () => {
    it('should call snackbar.open with message and Close button', () => {
      service.success('Operation successful');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Operation successful',
        'Close',
        service.snackBarConfigForSuccess
      );
    });

    it('should use success config', () => {
      service.success('Test success message');

      const openCall = mockMatSnackBar.open.mock.calls[0];
      expect(openCall[2]).toBe(service.snackBarConfigForSuccess);
    });

    it('should handle empty message', () => {
      service.success('');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('', 'Close', service.snackBarConfigForSuccess);
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.success(longMessage);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(longMessage, 'Close', service.snackBarConfigForSuccess);
    });
  });

  describe('warning', () => {
    it('should call snackbar.open with message and Close button', () => {
      service.warning('This is a warning');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'This is a warning',
        'Close',
        service.snackBarConfigForWarning
      );
    });

    it('should use warning config', () => {
      service.warning('Test warning message');

      const openCall = mockMatSnackBar.open.mock.calls[0];
      expect(openCall[2]).toBe(service.snackBarConfigForWarning);
    });

    it('should handle empty message', () => {
      service.warning('');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('', 'Close', service.snackBarConfigForWarning);
    });

    it('should handle special characters', () => {
      service.warning('Warning: <>&"\'');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Warning: <>&"\'',
        'Close',
        service.snackBarConfigForWarning
      );
    });
  });

  describe('error', () => {
    it('should call snackbar.open with message and Close button', () => {
      service.error('An error occurred');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'An error occurred',
        'Close',
        service.snackBarConfigForError
      );
    });

    it('should use error config', () => {
      service.error('Test error message');

      const openCall = mockMatSnackBar.open.mock.calls[0];
      expect(openCall[2]).toBe(service.snackBarConfigForError);
    });

    it('should log error to console', () => {
      service.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');
    });

    it('should handle empty error message', () => {
      service.error('');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('', 'Close', service.snackBarConfigForError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('');
    });

    it('should handle error objects as strings', () => {
      const errorString = 'Error: Network timeout';
      service.error(errorString);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        errorString,
        'Close',
        service.snackBarConfigForError
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(errorString);
    });
  });

  describe('Config Durations', () => {
    it('should have 4000ms duration for success messages', () => {
      expect(service.snackBarConfigForSuccess.duration).toBe(4000);
    });

    it('should have 4000ms duration for warning messages', () => {
      expect(service.snackBarConfigForWarning.duration).toBe(4000);
    });

    it('should have 10000ms duration for error messages (longer display)', () => {
      expect(service.snackBarConfigForError.duration).toBe(10000);
    });
  });

  describe('Config Panel Classes', () => {
    it('should use snackabar-success class for success messages', () => {
      expect(service.snackBarConfigForSuccess.panelClass).toContain('snackabar-success');
    });

    it('should use snackabar-warning class for warning messages', () => {
      expect(service.snackBarConfigForWarning.panelClass).toContain('snackabar-warning');
    });

    it('should use snackabar-error class for error messages', () => {
      expect(service.snackBarConfigForError.panelClass).toContain('snackabar-error');
    });
  });

  describe('Config Positioning', () => {
    it('should position all snackbars horizontally centered', () => {
      expect(service.snackBarConfigForSuccess.MatSnackBarHorizontalPosition).toBe('center');
      expect(service.snackBarConfigForWarning.MatSnackBarHorizontalPosition).toBe('center');
      expect(service.snackBarConfigForError.MatSnackBarHorizontalPosition).toBe('center');
    });

    it('should position all snackbars vertically at bottom', () => {
      expect(service.snackBarConfigForSuccess.MatSnackBarVerticalPosition).toBe('bottom');
      expect(service.snackBarConfigForWarning.MatSnackBarVerticalPosition).toBe('bottom');
      expect(service.snackBarConfigForError.MatSnackBarVerticalPosition).toBe('bottom');
    });
  });

  describe('Multiple Toasts', () => {
    it('should handle multiple toasts in sequence', () => {
      service.success('First message');
      service.warning('Second message');
      service.error('Third message');

      expect(mockMatSnackBar.open).toHaveBeenCalledTimes(3);
      expect(mockMatSnackBar.open).toHaveBeenNthCalledWith(
        1,
        'First message',
        'Close',
        service.snackBarConfigForSuccess
      );
      expect(mockMatSnackBar.open).toHaveBeenNthCalledWith(
        2,
        'Second message',
        'Close',
        service.snackBarConfigForWarning
      );
      expect(mockMatSnackBar.open).toHaveBeenNthCalledWith(
        3,
        'Third message',
        'Close',
        service.snackBarConfigForError
      );
    });

    it('should handle multiple error logs', () => {
      service.error('Error 1');
      service.error('Error 2');
      service.error('Error 3');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Error 1');
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Error 2');
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(3, 'Error 3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longError = 'E'.repeat(5000);
      service.error(longError);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        longError,
        'Close',
        service.snackBarConfigForError
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(longError);
    });

    it('should handle unicode characters in messages', () => {
      service.success('成功 ✓');
      service.warning('⚠️ 警告');
      service.error('❌ 错误');

      expect(mockMatSnackBar.open).toHaveBeenCalledTimes(3);
    });

    it('should handle multiline messages', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      service.error(multiline);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        multiline,
        'Close',
        service.snackBarConfigForError
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(multiline);
    });
  });
});
